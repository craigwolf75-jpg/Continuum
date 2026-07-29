/* Continuum Prompt 40 SITE gate code entry endpoint. Vercel Node.js
   serverless function at /api/site-access (NOT edge: this is the only part
   of the gate allowed to touch Supabase). POST { code, path } validates a
   code against public.access_codes via the validate_and_log_access RPC. On a
   match it signs a ct_site session and returns it as a Set-Cookie header. On
   a miss it returns 401. Every attempt, matched or not, is logged by the RPC
   itself, not by this file.

   HARD WALL vs the Prompt 39 hub gate: this file only ever signs or sets the
   ct_site cookie with CONTINUUM_SITE_SESSION_SECRET. It never reads, sets, or
   references ct_session or the hub gate's secret.

   Talks to Supabase over plain fetch() against the PostgREST endpoint rather
   than the @supabase/supabase-js SDK, so this file has zero npm dependencies
   and stays edge portable even though it currently runs on the Node runtime.

   Fails closed throughout: a missing env var, a Supabase error, or an
   unexpected exception all deny access. Nothing here ever falls open.

   PENDING CREDS: everything that touches the network (the rate limit read
   from access_log, the validate_and_log_access RPC call, and therefore the
   whole request/response cycle end to end) cannot run without live
   CONTINUUM_SUPABASE_URL / CONTINUUM_SUPABASE_SERVICE_KEY values and a
   deployed database. Only the pure rateDecision function below is unit
   tested (deploy/site-access.test.mjs).

   No dashes anywhere. */

import { signSession, serializeSiteCookie } from "./_site_session.js";

const MAX_ATTEMPTS = 10;
const WINDOW_SECONDS = 60 * 60; // 1 hour
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

// Pure rate limit decision: 10 attempts per IP per hour, then a 1 hour
// lockout. No I/O, so this is unit testable without Supabase. attemptsInWindow
// is the count of attempts from this IP inside the rolling window; lockedUntil
// is an epoch seconds timestamp (or null) marking an already triggered
// lockout that outlives the rolling window count.
function rateDecision(attemptsInWindow, lockedUntil, now) {
  if (typeof lockedUntil === "number" && lockedUntil > now) {
    return { blocked: true, retryAfter: lockedUntil - now };
  }
  const attempts = typeof attemptsInWindow === "number" ? attemptsInWindow : 0;
  if (attempts >= MAX_ATTEMPTS) {
    return { blocked: true, retryAfter: WINDOW_SECONDS };
  }
  return { blocked: false, retryAfter: 0 };
}

function getClientIp(req) {
  const xff = req.headers && req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) return xff.split(",")[0].trim();
  if (Array.isArray(xff) && xff.length) return String(xff[0]).split(",")[0].trim();
  const sock = req.socket || req.connection;
  return sock && sock.remoteAddress ? sock.remoteAddress : "unknown";
}

function getUserAgent(req) {
  const ua = req.headers && req.headers["user-agent"];
  return typeof ua === "string" ? ua : "";
}

// Reads and parses the JSON request body. Tolerates req.body already being
// parsed (Vercel's default Node function behavior), a raw JSON string, or an
// unparsed stream, so this works whether or not upstream body parsing ran.
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

// PENDING CREDS: cannot run without a live Supabase project. Reads the
// rolling attempt count for this IP from access_log (no separate rate limit
// table is required by the Prompt 40 migration) and derives a lockedUntil
// once the count crosses MAX_ATTEMPTS.
async function loadRateLimitState(baseUrl, serviceKey, ip, now) {
  const windowStartIso = new Date((now - WINDOW_SECONDS) * 1000).toISOString();
  const query =
    "select=ts&ip=eq." + encodeURIComponent(ip) + "&ts=gte." + encodeURIComponent(windowStartIso) + "&order=ts.desc";
  const res = await fetch(baseUrl + "/rest/v1/access_log?" + query, {
    method: "GET",
    headers: {
      apikey: serviceKey,
      Authorization: "Bearer " + serviceKey
    }
  });

  if (!res.ok) {
    // fail closed: if the counter cannot be read, treat this IP as already
    // at the limit rather than allowing unlimited guesses through
    return { attemptsInWindow: MAX_ATTEMPTS, lockedUntil: now + WINDOW_SECONDS };
  }

  const rows = await res.json();
  const attemptsInWindow = Array.isArray(rows) ? rows.length : MAX_ATTEMPTS;
  let lockedUntil = null;
  if (Array.isArray(rows) && rows.length >= MAX_ATTEMPTS && rows[0] && rows[0].ts) {
    const mostRecentSec = Math.floor(new Date(rows[0].ts).getTime() / 1000);
    lockedUntil = mostRecentSec + WINDOW_SECONDS;
  }
  return { attemptsInWindow, lockedUntil };
}

// PENDING CREDS: cannot run without a live Supabase project. Calls the
// validate_and_log_access RPC, which matches the code AND logs the attempt in
// one atomic step, regardless of outcome.
async function callValidateAndLogAccess(baseUrl, serviceKey, code, ip, ua, path) {
  const res = await fetch(baseUrl + "/rest/v1/rpc/validate_and_log_access", {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: "Bearer " + serviceKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ p_code: code, p_ip: ip, p_ua: ua, p_path: path })
  });

  if (!res.ok) {
    throw new Error("validate_and_log_access RPC failed with status " + res.status);
  }

  const data = await res.json();
  const row = Array.isArray(data) ? data[0] : data;
  return row && row.matched === true;
}

async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "method not allowed" });
      return;
    }

    const baseUrl = process.env.CONTINUUM_SUPABASE_URL;
    const serviceKey = process.env.CONTINUUM_SUPABASE_SERVICE_KEY;
    const sessionSecret = process.env.CONTINUUM_SITE_SESSION_SECRET;

    // Fail closed: any missing configuration denies access. This endpoint
    // never falls open just because it is misconfigured.
    if (!baseUrl || !serviceKey || !sessionSecret) {
      res.status(503).json({ ok: false, error: "gate not configured" });
      return;
    }

    const body = await readJsonBody(req);
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const path = typeof body.path === "string" ? body.path : "";

    if (!code) {
      res.status(400).json({ ok: false, error: "code required" });
      return;
    }

    const ip = getClientIp(req);
    const ua = getUserAgent(req);
    const now = Math.floor(Date.now() / 1000);

    const rateState = await loadRateLimitState(baseUrl, serviceKey, ip, now);
    const decision = rateDecision(rateState.attemptsInWindow, rateState.lockedUntil, now);
    if (decision.blocked) {
      res.setHeader("retry-after", String(decision.retryAfter));
      res.status(429).json({ ok: false, error: "too many attempts" });
      return;
    }

    const matched = await callValidateAndLogAccess(baseUrl, serviceKey, code, ip, ua, path);

    if (!matched) {
      res.status(401).json({ ok: false, error: "invalid code" });
      return;
    }

    const iat = now;
    const exp = iat + SESSION_TTL_SECONDS;
    const token = await signSession({ iat, exp }, sessionSecret);
    const cookie = serializeSiteCookie(token);

    res.setHeader("set-cookie", cookie);
    res.status(200).json({ ok: true });
  } catch (e) {
    // fail closed on any unexpected error
    res.status(503).json({ ok: false, error: "gate error" });
  }
}

export { rateDecision, MAX_ATTEMPTS, WINDOW_SECONDS };
export default handler;
