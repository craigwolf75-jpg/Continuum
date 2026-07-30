/* Continuum Hub admin approval surface. Vercel Node.js serverless function
   at /api/hub-admin. Lets an authorized hub session (gary@, per
   deploy/api/_hub_session.js ADMIN_EMAILS) list pending, approved, and
   rejected public.hub_profiles rows, approve a pending row into group1 or
   group2, or reject it. No check in or medical data appears here:
   hub_profiles carries only email, status, access_group, role_label, and
   approval bookkeeping.

   HARD WALL vs the SITE gate: this file reads only ct_session, verified
   with only CONTINUUM_HUB_SESSION_SECRET (deploy/api/_hub_session.js). It
   never reads, sets, or references ct_site or CONTINUUM_SITE_SESSION_SECRET.

   Talks to Supabase over plain fetch() against the PostgREST endpoint,
   matching deploy/api/site-codes-admin.js's pattern, using the service role
   key. Missing env vars fail CLOSED (deny). No dashes anywhere. */

import { verifyHubSession, parseCookies, isAuthorizedAdmin } from "./_hub_session.js";

// admin is never assignable through approve: the only way a session ever
// carries group 'admin' is deploy/api/hub-signin.js's own ADMIN_EMAILS self
// heal, never this endpoint.
const GROUPS = ["group1", "group2"];

function validateApproveInput(body) {
  const errors = [];
  const b = body && typeof body === "object" ? body : {};
  if (typeof b.id !== "string" || !b.id) errors.push("id is required");
  if (typeof b.access_group !== "string" || !GROUPS.includes(b.access_group)) {
    errors.push("access_group must be one of: " + GROUPS.join(", "));
  }
  return { ok: errors.length === 0, errors };
}

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

async function requireHubAdmin(req) {
  const secret = process.env.CONTINUUM_HUB_SESSION_SECRET;
  if (!secret) return { ok: false, status: 401, error: "hub session not configured" };

  const cookieHeader = req.headers && (req.headers.cookie || req.headers.Cookie);
  const cookies = parseCookies(typeof cookieHeader === "string" ? cookieHeader : "");
  const token = cookies.ct_session;
  if (!token) return { ok: false, status: 401, error: "no hub session" };

  const nowSec = Math.floor(Date.now() / 1000);
  const session = await verifyHubSession(token, secret, nowSec);
  if (!session) return { ok: false, status: 401, error: "invalid hub session" };

  if (!isAuthorizedAdmin(session)) return { ok: false, status: 403, error: "not authorized" };

  return { ok: true, session };
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

// PENDING CREDS: cannot run without a live Supabase project.
async function listProfiles(baseUrl, serviceKey) {
  const res = await fetch(baseUrl + "/rest/v1/hub_profiles?select=*&order=created_at.desc", {
    method: "GET",
    headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey }
  });
  if (!res.ok) throw new Error("hub_profiles list failed with status " + res.status);
  return res.json();
}

// PENDING CREDS: cannot run without a live Supabase project.
async function approveProfile(baseUrl, serviceKey, id, accessGroup, approverEmail) {
  const res = await fetch(baseUrl + "/rest/v1/hub_profiles?id=eq." + encodeURIComponent(id), {
    method: "PATCH",
    headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ status: "approved", access_group: accessGroup, approved_at: new Date().toISOString(), approved_by: approverEmail })
  });
  if (!res.ok) throw new Error("hub_profiles approve failed with status " + res.status);
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

// PENDING CREDS: cannot run without a live Supabase project.
async function rejectProfile(baseUrl, serviceKey, id, approverEmail) {
  const res = await fetch(baseUrl + "/rest/v1/hub_profiles?id=eq." + encodeURIComponent(id), {
    method: "PATCH",
    headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ status: "rejected", access_group: null, approved_at: new Date().toISOString(), approved_by: approverEmail })
  });
  if (!res.ok) throw new Error("hub_profiles reject failed with status " + res.status);
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

async function handler(req, res) {
  try {
    if (req.method === "POST" && isCrossSiteRequest(req)) {
      res.status(403).json({ ok: false, error: "cross site request rejected" });
      return;
    }

    const guard = await requireHubAdmin(req);
    if (!guard.ok) {
      res.status(guard.status).json({ ok: false, error: guard.error });
      return;
    }

    const baseUrl = process.env.CONTINUUM_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.CONTINUUM_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!baseUrl || !serviceKey) {
      res.status(503).json({ ok: false, error: "hub admin api not configured" });
      return;
    }

    if (req.method === "GET") {
      const profiles = await listProfiles(baseUrl, serviceKey);
      res.status(200).json({ ok: true, profiles: Array.isArray(profiles) ? profiles : [] });
      return;
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      const action = typeof body.action === "string" ? body.action : "";
      const approverEmail = guard.session && typeof guard.session.email === "string" ? guard.session.email : "unknown admin";

      if (action === "approve") {
        const validation = validateApproveInput(body);
        if (!validation.ok) {
          res.status(400).json({ ok: false, errors: validation.errors });
          return;
        }
        const updated = await approveProfile(baseUrl, serviceKey, body.id, body.access_group, approverEmail);
        res.status(200).json({ ok: true, profile: updated });
        return;
      }

      if (action === "reject") {
        const id = typeof body.id === "string" ? body.id : "";
        if (!id) {
          res.status(400).json({ ok: false, error: "id required" });
          return;
        }
        const updated = await rejectProfile(baseUrl, serviceKey, id, approverEmail);
        res.status(200).json({ ok: true, profile: updated });
        return;
      }

      res.status(400).json({ ok: false, error: "unknown action" });
      return;
    }

    res.status(405).json({ ok: false, error: "method not allowed" });
  } catch (e) {
    res.status(503).json({ ok: false, error: "hub admin api error" });
  }
}

export { validateApproveInput, isCrossSiteRequest, requireHubAdmin, listProfiles, approveProfile, rejectProfile, GROUPS };
export default handler;
