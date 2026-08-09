/* Continuum Hub sign up endpoint. Vercel Node.js serverless function at
   /api/hub-signup. POST { email, password } creates a Supabase Auth user
   (email_confirm true, no email confirmation flow) and a public.hub_profiles
   row with status='pending'. No cookie is ever issued here: a brand new
   account cannot self approve.

   Reachable only once a visitor is past the SITE gate (deploy/middleware.js);
   this file does not itself check ct_site, the site gate already governed
   the request before it reached this path.

   HARD WALL vs the SITE gate: this file never reads or writes ct_site or
   CONTINUUM_SITE_SESSION_SECRET.

   Returns a neutral 200 in both the "created" and "already registered"
   cases, so this endpoint cannot be used to enumerate which emails already
   have an account.

   Talks to Supabase Auth over plain fetch() via deploy/api/_hub_auth.js
   (GoTrue admin API) and to PostgREST directly for the hub_profiles insert,
   both with the service role key, matching deploy/api/site-access.js's
   pattern. Fails closed: missing env or any unexpected error denies (503),
   never falls open. No dashes anywhere. */

import { validateSignupInput, createAuthUser } from "./_hub_auth.js";
import { sendSignupNotification } from "./_notify.js";

function isCrossSiteRequest(req) {
  const headers = (req && req.headers) || {};
  const secFetchSite = headers["sec-fetch-site"];
  if (typeof secFetchSite === "string" && secFetchSite.toLowerCase() === "cross-site") return true;
  const origin = headers["origin"];
  const host = headers["host"];
  if (typeof origin === "string" && origin && typeof host === "string" && host) {
    try {
      const originHost = new URL(origin).host.toLowerCase();
      if (originHost !== host.toLowerCase()) return true;
    } catch (e) {
      return true;
    }
  }
  return false;
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body || "{}"); } catch (e) { return {}; }
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

// PENDING CREDS: cannot run without a live Supabase project. Inserts the
// pending hub_profiles row for a freshly created auth user.
async function insertPendingProfile(baseUrl, serviceKey, id, email) {
  const res = await fetch(baseUrl + "/rest/v1/hub_profiles", {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: "Bearer " + serviceKey,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify({ id, email, status: "pending" })
  });
  if (res.status !== 200 && res.status !== 201) {
    throw new Error("hub_profiles insert failed with status " + res.status);
  }
  return res.json();
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
    if (!baseUrl || !serviceKey) {
      res.status(503).json({ ok: false, error: "hub signup not configured" });
      return;
    }

    const body = await readJsonBody(req);
    const validation = validateSignupInput(body);
    if (!validation.ok) {
      res.status(400).json({ ok: false, errors: validation.errors });
      return;
    }

    const created = await createAuthUser(baseUrl, serviceKey, validation.email, validation.password);

    if (created.outcome === "duplicate") {
      res.status(200).json({ ok: true, status: "pending" });
      return;
    }
    if (created.outcome !== "created") {
      res.status(503).json({ ok: false, error: "hub signup error" });
      return;
    }

    await insertPendingProfile(baseUrl, serviceKey, created.id, created.email);

    // Best effort admin notification for a freshly created account only (never
    // on the neutral duplicate path above). sendSignupNotification never throws
    // and is a silent no op unless RESEND_API_KEY and SIGNUP_NOTIFY_TO are set,
    // so it cannot fail or delay a signup once the account and profile exist.
    await sendSignupNotification(created.email, process.env);

    res.status(200).json({ ok: true, status: "pending" });
  } catch (e) {
    res.status(503).json({ ok: false, error: "hub signup error" });
  }
}

export { isCrossSiteRequest, insertPendingProfile };
export default handler;
