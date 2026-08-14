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

   SECURITY FIXES (post review): getClientIp now reads x-real-ip first and
   only falls back to the LAST entry of x-forwarded-for (not the first,
   attacker controllable, entry); the handler now rejects cross site POSTs
   via isCrossSiteRequest before doing anything else.

   No dashes anywhere. */

import { issueSiteCookie } from "./_site_session.js";

const MAX_ATTEMPTS = 10;
const WINDOW_SECONDS = 60 * 60; // 1 hour

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

// SECURITY FIX (post review, I1): x-real-ip is the single value Vercel's own
// edge network sets and is trustworthy. x-forwarded-for is a comma
// separated chain that a client can prepend arbitrary fake entries onto;
// Vercel APPENDS the real client IP as the LAST entry, so the correct
// (and previously wrong) read of that header is the last entry, never the
// first (the leftmost entry is fully attacker controlled and would let a
// caller claim any IP to dodge the per-IP rate limit).
function getClientIp(req) {
  const headers = req.headers || {};

  const realIp = headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) return realIp.trim();
  if (Array.isArray(realIp) && realIp.length && realIp[0]) return String(realIp[0]).trim();

  const xff = headers["x-forwarded-for"];
  const xffValue = typeof xff === "string" ? xff : Array.isArray(xff) && xff.length ? String(xff[xff.length - 1]) : "";
  if (xffValue) {
    const parts = xffValue.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }

  const sock = req.socket || req.connection;
  return sock && sock.remoteAddress ? sock.remoteAddress : "unknown";
}

// SECURITY FIX (post review, M3): a cheap CSRF guard on the code entry POST.
// Rejects when the browser reports this as a cross site fetch (Sec-Fetch-Site,
// sent by all modern browsers on fetch requests) or when an Origin header is
// present and its host does not match the request's own Host header. Absent
// signals (no Sec-Fetch-Site, no Origin, e.g. very old browsers or non
// browser first party callers) are not treated as cross site on their own;
// this guard is a cheap extra layer, not the endpoint's only defense (the
// code itself must still match, and attempts are still rate limited either
// way).
function isCrossSiteRequest(req) {
  const headers = req.headers || {};

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

    if (isCrossSiteRequest(req)) {
      res.status(403).json({ ok: false, error: "cross site request rejected" });
      return;
    }

    const baseUrl = process.env.CONTINUUM_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.CONTINUUM_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
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

    const cookie = await issueSiteCookie(sessionSecret, now);

    res.setHeader("set-cookie", cookie);
    res.status(200).json({ ok: true });
  } catch (e) {
    // fail closed on any unexpected error
    res.status(503).json({ ok: false, error: "gate error" });
  }
}

export { rateDecision, MAX_ATTEMPTS, WINDOW_SECONDS, getClientIp, isCrossSiteRequest };
export default handler;
