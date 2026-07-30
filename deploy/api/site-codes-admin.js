/* Continuum Prompt 40 ADMIN code view API. Vercel Node.js serverless
   function at /api/site-codes-admin. Lets an authorized hub session manage
   public.access_codes (list, create, expire, revoke) and read
   public.access_log, both defined in
   supabase/migrations/20260729130000_site_access_gate.sql.

   HARD WALL vs the Prompt 40 SITE gate: this file reads only the ct_session
   cookie, verified with only CONTINUUM_HUB_SESSION_SECRET
   (deploy/api/_hub_session.js). It never reads, sets, or references ct_site
   or CONTINUUM_SITE_SESSION_SECRET. deploy/api/site-access.js (the SITE
   code entry endpoint) is a separate file for that separate concern; this
   file does not import from it and does not touch it.

   GATING (read deploy/api/_hub_session.js's header first): the Prompt 39 hub
   LOGIN that issues ct_session is not built yet. Every endpoint below calls
   requireHubAdmin first and returns before doing anything else if that
   check fails. With no Prompt 39 login deployed, no request can ever carry
   a valid ct_session, so in practice every endpoint here fails closed until
   Prompt 39 ships. That is intended: this file is staged ahead of its own
   gate, not a bypass of it.

   Talks to Supabase over plain fetch() against the PostgREST endpoint,
   matching the pattern in deploy/api/site-access.js, using the service role
   key (CONTINUUM_SUPABASE_URL / CONTINUUM_SUPABASE_SERVICE_KEY). Missing
   env vars fail CLOSED (deny), same as the SITE gate's code entry endpoint.

   PENDING CREDS: every function below that calls fetch() against Supabase
   (listCodesAndLog, insertAccessCode, expireAccessCode, revokeAccessCode)
   cannot run without a live CONTINUUM_SUPABASE_URL /
   CONTINUUM_SUPABASE_SERVICE_KEY and a deployed database. Only the pure
   helpers (deriveCodeStatus, validateCreateInput, generateAccessCode,
   isCrossSiteRequest, requireHubAdmin's session logic by way of
   _hub_session.js) are unit tested (deploy/site-codes-admin.test.mjs), which
   also includes a mocked req/res integration test proving the handler
   itself returns 401 and never reaches any Supabase call when ct_session is
   missing, wrong signature, or expired, for every action.

   SECURITY FIX (post review): this endpoint is state changing (create,
   expire, revoke) but originally had no cross site guard, unlike
   deploy/api/site-access.js. isCrossSiteRequest below mirrors that file's
   guard exactly and is now the FIRST check the handler runs for every POST
   request (before requireHubAdmin, before touching Supabase config, before
   reading the body), since create/expire/revoke are the only POST actions
   this endpoint supports and list (GET, read only) does not need it.

   No dashes anywhere. */

import { randomBytes } from "node:crypto";
import { verifyHubSession, parseCookies, isAuthorizedAdmin } from "./_hub_session.js";

const CATEGORIES = ["prospect", "investor", "partner", "internal"];
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;
const LOG_LIMIT = 100;
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L, avoids visual mixups
const CODE_LENGTH = 16;

// -- pure helpers, unit tested directly --

// Derives a human facing status for one access_codes row. now is an epoch
// millisecond number (defaults to Date.now()); code is the row shape from
// public.access_codes (expires_at / revoked_at as ISO strings or null,
// max_uses as an int or null, use_count as an int).
//
// Precedence: revoked always wins (an operator's explicit revoke should
// never be masked by an unrelated exhaustion or expiry reading), then
// expired (a natural, time based end of life), then exhausted (a usage
// limit reached), else active.
function deriveCodeStatus(code, now) {
  const nowMs = typeof now === "number" ? now : Date.now();
  if (!code || typeof code !== "object") return "expired";

  if (code.revoked_at) return "revoked";

  if (code.expires_at) {
    const expiresMs = new Date(code.expires_at).getTime();
    if (!Number.isNaN(expiresMs) && expiresMs <= nowMs) return "expired";
  }

  if (typeof code.max_uses === "number" && code.max_uses !== null) {
    const useCount = typeof code.use_count === "number" ? code.use_count : 0;
    if (useCount >= code.max_uses) return "exhausted";
  }

  return "active";
}

// Validates the body of a create action. Returns { ok, errors }; errors is
// always an array (empty when ok). No I/O, so this is unit testable without
// Supabase or a request object.
function validateCreateInput(body) {
  const errors = [];
  const b = body && typeof body === "object" ? body : {};

  const label = typeof b.label === "string" ? b.label.trim() : "";
  if (!label) errors.push("label is required");

  if (typeof b.category !== "string" || !CATEGORIES.includes(b.category)) {
    errors.push("category must be one of: " + CATEGORIES.join(", "));
  }

  if (b.expires_at !== undefined && b.expires_at !== null && b.expires_at !== "") {
    const t = new Date(b.expires_at).getTime();
    if (Number.isNaN(t)) errors.push("expires_at must be a valid date");
  }

  if (b.max_uses !== undefined && b.max_uses !== null && b.max_uses !== "") {
    const n = Number(b.max_uses);
    if (!Number.isInteger(n) || n <= 0) errors.push("max_uses must be a positive integer");
  }

  return { ok: errors.length === 0, errors };
}

// Random access code generator. Uses node:crypto randomBytes (a real
// CSPRNG, not Math.random). CODE_ALPHABET is 31 characters (0, O, 1, I, L
// excluded as ambiguous), and 31 does not evenly divide 256, so a plain
// "byte % 31" would be biased: the first 256 % 31 = 8 characters of the
// alphabet (A through H) would be drawn slightly more often than the rest.
// This uses rejection sampling instead: the largest multiple of 31 that is
// <= 256 is 248 (31 * 8), so any drawn byte >= 248 is discarded and another
// byte is drawn in its place; only accepted bytes (0 to 247) are mapped
// through "% 31". Every one of the 31 characters then has exactly 8 ways to
// be produced from an accepted byte, so the result is uniform over the
// alphabet with no bias. CODE_LENGTH stays 16, giving 31^16 possibilities,
// about 79 bits of entropy (comfortably >= the ~77 bit floor). Grouped with
// ASCII hyphens (not em/en dashes) purely for human readability when an
// operator reads a code off the admin table.
function generateAccessCode() {
  const alphabetLen = CODE_ALPHABET.length;
  const acceptCeiling = Math.floor(256 / alphabetLen) * alphabetLen; // 248 for a 31 char alphabet
  const chars = [];
  while (chars.length < CODE_LENGTH) {
    const draw = randomBytes(CODE_LENGTH - chars.length);
    for (let i = 0; i < draw.length && chars.length < CODE_LENGTH; i++) {
      const b = draw[i];
      if (b < acceptCeiling) {
        chars.push(CODE_ALPHABET[b % alphabetLen]);
      }
      // b >= acceptCeiling is rejected and simply not used; the loop draws
      // more bytes on its next iteration until CODE_LENGTH is reached.
    }
  }
  const raw = chars.join("");
  return raw.slice(0, 4) + "-" + raw.slice(4, 8) + "-" + raw.slice(8, 12) + "-" + raw.slice(12, 16);
}

// A cheap CSRF guard on every state changing (POST) request to this
// endpoint. Mirrors deploy/api/site-access.js's isCrossSiteRequest exactly:
// rejects when the browser reports this as a cross site fetch
// (Sec-Fetch-Site, sent by all modern browsers on fetch requests), or when
// an Origin header is present and its host does not match the request's own
// Host header. Absent signals (no Sec-Fetch-Site, no Origin, e.g. very old
// browsers or non browser first party callers) are not treated as cross
// site on their own; this guard is a cheap extra layer, not this endpoint's
// only defense (the ct_session guard behind it still must pass either way).
// An Origin header present but unparsable fails closed (rejected), same as
// site-access.js.
function isCrossSiteRequest(req) {
  const headers = (req && req.headers) || {};

  const secFetchSite = headers["sec-fetch-site"];
  if (typeof secFetchSite === "string" && secFetchSite.toLowerCase() === "cross-site") {
    return true;
  }

  const origin = headers["origin"];
  const host = headers["host"];
  if (typeof origin === "string" && origin && typeof host === "string" && host) {
    try {
      const originHost = new URL(origin).host.toLowerCase();
      if (originHost !== host.toLowerCase()) return true;
    } catch (e) {
      // an Origin header present but unparsable is itself suspicious
      return true;
    }
  }

  return false;
}

// -- hub admin guard --

// Reads and verifies the ct_session cookie and checks admin authorization.
// Returns { ok: true, session } on success, or { ok: false, status, error }
// on any failure. Fails closed: a missing cookie, a missing or bad secret,
// an invalid/expired token, or a session that fails isAuthorizedAdmin all
// return ok: false and the caller MUST stop and return that status/error
// without proceeding to any Supabase call.
async function requireHubAdmin(req) {
  const secret = process.env.CONTINUUM_HUB_SESSION_SECRET;
  if (!secret) {
    return { ok: false, status: 401, error: "hub session not configured" };
  }

  const cookieHeader = req.headers && (req.headers.cookie || req.headers.Cookie);
  const cookies = parseCookies(typeof cookieHeader === "string" ? cookieHeader : "");
  const token = cookies.ct_session;
  if (!token) {
    return { ok: false, status: 401, error: "no hub session" };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const session = await verifyHubSession(token, secret, nowSec);
  if (!session) {
    return { ok: false, status: 401, error: "invalid hub session" };
  }

  if (!isAuthorizedAdmin(session)) {
    return { ok: false, status: 403, error: "not authorized" };
  }

  return { ok: true, session };
}

// -- Supabase (PostgREST) I/O, pending live creds --

// PENDING CREDS: cannot run without a live Supabase project. Loads a page of
// access_codes (newest first) and the most recent access_log entries.
async function listCodesAndLog(baseUrl, serviceKey, { page, pageSize }) {
  const size = Math.min(Math.max(1, pageSize || DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const offset = Math.max(0, ((page || 1) - 1) * size);

  const codesRes = await fetch(
    baseUrl + "/rest/v1/access_codes?select=*&order=created_at.desc&limit=" + size + "&offset=" + offset,
    {
      method: "GET",
      headers: {
        apikey: serviceKey,
        Authorization: "Bearer " + serviceKey,
        Prefer: "count=exact"
      }
    }
  );
  if (!codesRes.ok) {
    throw new Error("access_codes list failed with status " + codesRes.status);
  }
  const codes = await codesRes.json();

  const logRes = await fetch(
    baseUrl + "/rest/v1/access_log?select=*&order=ts.desc&limit=" + LOG_LIMIT,
    {
      method: "GET",
      headers: {
        apikey: serviceKey,
        Authorization: "Bearer " + serviceKey
      }
    }
  );
  if (!logRes.ok) {
    throw new Error("access_log list failed with status " + logRes.status);
  }
  const log = await logRes.json();

  const now = Date.now();
  const codesWithStatus = (Array.isArray(codes) ? codes : []).map((c) => ({
    ...c,
    status: deriveCodeStatus(c, now)
  }));

  return { codes: codesWithStatus, log: Array.isArray(log) ? log : [], page: page || 1, pageSize: size };
}

// PENDING CREDS: cannot run without a live Supabase project. Inserts a new
// access_codes row with a freshly generated code.
async function insertAccessCode(baseUrl, serviceKey, input) {
  const code = generateAccessCode();
  const row = {
    label: input.label.trim(),
    code,
    category: input.category
  };
  if (input.expires_at !== undefined && input.expires_at !== null && input.expires_at !== "") {
    row.expires_at = new Date(input.expires_at).toISOString();
  }
  if (input.max_uses !== undefined && input.max_uses !== null && input.max_uses !== "") {
    row.max_uses = Number(input.max_uses);
  }

  const res = await fetch(baseUrl + "/rest/v1/access_codes", {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: "Bearer " + serviceKey,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify(row)
  });
  if (!res.ok) {
    throw new Error("access_codes insert failed with status " + res.status);
  }
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

// PENDING CREDS: cannot run without a live Supabase project. Sets
// expires_at to now for the given id, which is enough on its own for
// deriveCodeStatus to report the code as expired going forward; it does not
// delete the row, so the access history stays intact.
async function expireAccessCode(baseUrl, serviceKey, id) {
  const res = await fetch(baseUrl + "/rest/v1/access_codes?id=eq." + encodeURIComponent(id), {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: "Bearer " + serviceKey,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify({ expires_at: new Date().toISOString() })
  });
  if (!res.ok) {
    throw new Error("access_codes expire failed with status " + res.status);
  }
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

// PENDING CREDS: cannot run without a live Supabase project. Sets
// revoked_at, which deriveCodeStatus treats as taking precedence over every
// other status.
async function revokeAccessCode(baseUrl, serviceKey, id) {
  const res = await fetch(baseUrl + "/rest/v1/access_codes?id=eq." + encodeURIComponent(id), {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: "Bearer " + serviceKey,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify({ revoked_at: new Date().toISOString() })
  });
  if (!res.ok) {
    throw new Error("access_codes revoke failed with status " + res.status);
  }
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

// Reads and parses the JSON request body. Tolerates req.body already being
// parsed (Vercel's default Node function behavior), a raw JSON string, or an
// unparsed stream. Duplicated from deploy/api/site-access.js's own copy on
// purpose, matching that file's convention of each endpoint owning its own
// small body reader rather than sharing one across files.
async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body || "{}");
    } catch (e) {
      return {};
    }
  }
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8");
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function getQueryAction(req) {
  try {
    const url = new URL(req.url, "http://internal");
    return url.searchParams.get("action");
  } catch (e) {
    return null;
  }
}

async function handler(req, res) {
  try {
    // CSRF guard FIRST, before any other work: create/expire/revoke are the
    // only POST actions this endpoint supports, and all of them are state
    // changing, so every POST request is checked here before the hub
    // session guard, before the Supabase config check, and before the body
    // is even read. GET (list) is read only and does not go through this.
    if (req.method === "POST" && isCrossSiteRequest(req)) {
      res.status(403).json({ ok: false, error: "cross site request rejected" });
      return;
    }

    // HARD WALL: this is the only session/authorization check that gates
    // every branch below. On any failure here, respond and return
    // immediately; no branch below may run before this has returned ok: true.
    const guard = await requireHubAdmin(req);
    if (!guard.ok) {
      res.status(guard.status).json({ ok: false, error: guard.error });
      return;
    }

    const baseUrl = process.env.CONTINUUM_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.CONTINUUM_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    // Fail closed: without live Supabase config, no action can proceed,
    // authorized session or not.
    if (!baseUrl || !serviceKey) {
      res.status(503).json({ ok: false, error: "admin api not configured" });
      return;
    }

    if (req.method === "GET") {
      const action = getQueryAction(req) || "list";
      if (action !== "list") {
        res.status(400).json({ ok: false, error: "unknown action" });
        return;
      }
      const url = new URL(req.url, "http://internal");
      const page = Number(url.searchParams.get("page")) || 1;
      const pageSize = Number(url.searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE;
      const result = await listCodesAndLog(baseUrl, serviceKey, { page, pageSize });
      res.status(200).json({ ok: true, ...result });
      return;
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      const action = (typeof body.action === "string" && body.action) || getQueryAction(req);

      if (action === "create") {
        const validation = validateCreateInput(body);
        if (!validation.ok) {
          res.status(400).json({ ok: false, errors: validation.errors });
          return;
        }
        const created = await insertAccessCode(baseUrl, serviceKey, body);
        res.status(200).json({ ok: true, code: created });
        return;
      }

      if (action === "expire" || action === "revoke") {
        const id = typeof body.id === "string" ? body.id : "";
        if (!id) {
          res.status(400).json({ ok: false, error: "id required" });
          return;
        }
        const updated =
          action === "expire"
            ? await expireAccessCode(baseUrl, serviceKey, id)
            : await revokeAccessCode(baseUrl, serviceKey, id);
        res.status(200).json({ ok: true, code: updated });
        return;
      }

      res.status(400).json({ ok: false, error: "unknown action" });
      return;
    }

    res.status(405).json({ ok: false, error: "method not allowed" });
  } catch (e) {
    // fail closed on any unexpected error
    res.status(503).json({ ok: false, error: "admin api error" });
  }
}

export {
  deriveCodeStatus,
  validateCreateInput,
  generateAccessCode,
  isCrossSiteRequest,
  requireHubAdmin,
  listCodesAndLog,
  insertAccessCode,
  expireAccessCode,
  revokeAccessCode,
  CATEGORIES,
  CODE_ALPHABET
};
export default handler;
