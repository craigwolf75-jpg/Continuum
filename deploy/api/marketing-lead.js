/* Continuum Prompt 62: marketing lead capture endpoint. Vercel Node serverless
   function at /api/marketing-lead. Replaces the old Request access mailto: an
   email is validated, stored durably in public.marketing_leads via the service
   key, and (best effort) forwarded to the admin inbox via the existing Resend
   notifier. Storage first, so no lead is lost if forwarding is not yet wired.

   Three layer resilience (Section 2.4 / standing law):
     - timeout: the storage fetch is bounded by an AbortController.
     - fail open: any unexpected error returns the plain failure JSON, never an
       error screen; the page shows "That did not go through...".
     - structured logging: one JSON line per attempt, WITHOUT the address (the
       lead email is prospect PII and never enters the logs, Section 3.3).

   No dashes anywhere. No SDK; plain fetch, the deploy/api pattern. */

import { sendLeadNotification } from "./_notify.js";

const STORE_TIMEOUT_MS = 8000;

// Pure: shape validation. Server side is the real check; the client also checks.
function isEmail(s) {
  return typeof s === "string" && s.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
}

// Same origin guard (matches the hub endpoints): a lead form post arrives from
// our own page; reject an obvious cross site submission.
function isCrossSiteRequest(req) {
  const h = (req && req.headers) || {};
  const sfs = h["sec-fetch-site"];
  if (typeof sfs === "string" && sfs.toLowerCase() === "cross-site") return true;
  const origin = h["origin"], host = h["host"];
  if (typeof origin === "string" && origin && typeof host === "string" && host) {
    try { if (new URL(origin).host.toLowerCase() !== host.toLowerCase()) return true; }
    catch (e) { return true; }
  }
  return false;
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body || "{}"); } catch (e) { return {}; } }
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString("utf8");
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

// Store the lead. Timeout bounded. Returns true only on a 2xx from PostgREST.
async function storeLead(baseUrl, key, email, source) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), STORE_TIMEOUT_MS);
  try {
    const res = await fetch(baseUrl + "/rest/v1/marketing_leads", {
      method: "POST",
      headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ email, source_page: source }),
      signal: ctrl.signal
    });
    return res.status >= 200 && res.status < 300;
  } finally {
    clearTimeout(timer);
  }
}

async function handler(req, res) {
  try {
    if (req.method !== "POST") { res.status(405).json({ ok: false }); return; }
    if (isCrossSiteRequest(req)) { res.status(403).json({ ok: false }); return; }

    const baseUrl = process.env.CONTINUUM_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.CONTINUUM_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!baseUrl || !key) {
      console.log(JSON.stringify({ evt: "marketing_lead", ok: false, reason: "unconfigured" }));
      res.status(503).json({ ok: false });
      return;
    }

    const body = await readJsonBody(req);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const source = typeof body.source === "string" ? body.source.slice(0, 120) : "/";
    if (!isEmail(email)) { res.status(400).json({ ok: false, error: "invalid email" }); return; }

    const stored = await storeLead(baseUrl, key, email, source);
    // structured log: attempt outcome and source only, never the address
    console.log(JSON.stringify({ evt: "marketing_lead", ok: stored, source }));
    if (!stored) { res.status(502).json({ ok: false }); return; }

    // Best effort forward; never blocks or fails the request.
    try { await sendLeadNotification(email, source); } catch (e) { /* stored already */ }

    res.status(200).json({ ok: true });
  } catch (e) {
    // fail open to the plain failure, not an error screen
    try { console.log(JSON.stringify({ evt: "marketing_lead", ok: false, reason: "error" })); } catch (_) {}
    res.status(502).json({ ok: false });
  }
}

export { isEmail, isCrossSiteRequest };
export default handler;
