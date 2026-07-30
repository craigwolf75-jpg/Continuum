/* Continuum Hub sign in endpoint. Vercel Node.js serverless function at
   /api/hub-signin. POST { email, password } verifies credentials against
   Supabase Auth, then applies the approval gate from public.hub_profiles:
     status='approved' -> issues ct_session { sub, email, group }, 200 with
       the cookie set
     no profile row, or status='pending' -> 200 { ok:true, status:'pending' },
       no cookie (awaiting an admin decision)
     status='rejected' -> 403 neutral, no cookie
   gary@farmceuticawellness.com (deploy/api/_hub_session.js ADMIN_EMAILS) is
   never decided by the stored row: every successful sign in for that email
   self heals hub_profiles to status='approved', access_group='admin' unless
   it is already exactly that (the upsert write is skipped once the row is
   already in that state, so approved_at/approved_by are not rewritten on
   every login), so the admin can never be locked out by data drift. A non
   admin whose signup profile insert failed
   (an orphaned auth user with no hub_profiles row at all) is also self
   healed here, to a pending row, using an idempotent insert (ignore on
   conflict) so a concurrent write never overwrites a row that already
   exists.

   HARD WALL vs the SITE gate: this file only ever signs or sets the
   ct_session cookie with CONTINUUM_HUB_SESSION_SECRET (via
   deploy/api/_hub_session.js). It never reads, sets, or references ct_site
   or CONTINUUM_SITE_SESSION_SECRET.

   Talks to Supabase Auth via deploy/api/_hub_auth.js's verifyPassword
   (GoTrue password grant) and to PostgREST directly for the hub_profiles
   read/writes, matching deploy/api/site-access.js's plain fetch() pattern.

   Fails closed throughout: missing env, an unexpected Supabase Auth or
   PostgREST response, or any unrecognized hub_profiles status/group all
   deny (no cookie), never fall open. Invalid credentials and an unknown
   email return the identical 401 shape, so this endpoint cannot be used to
   enumerate which emails have an account. No dashes anywhere. */

import { validateSigninInput, verifyPassword } from "./_hub_auth.js";
import { signHubSession, serializeHubCookie, ADMIN_EMAILS } from "./_hub_session.js";

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days, matches the site gate's session TTL

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

// PENDING CREDS: cannot run without a live Supabase project. Reads the
// hub_profiles row for this user id, or null if none exists.
async function loadProfile(baseUrl, serviceKey, id) {
  const res = await fetch(
    baseUrl + "/rest/v1/hub_profiles?id=eq." + encodeURIComponent(id) + "&select=*",
    { method: "GET", headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey } }
  );
  if (res.status !== 200) throw new Error("hub_profiles read failed with status " + res.status);
  const rows = await res.json();
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

// PENDING CREDS: cannot run without a live Supabase project. Upserts the
// admin row (status='approved', access_group='admin') on the user's primary
// key, on every successful admin email sign in where it is not already in
// that state, regardless of what the row currently says: a missing row, a
// pending row, a rejected row, or a stale group all converge to the same
// admin state. Returns the upserted row (Prefer: return=representation) so
// the caller can carry it forward instead of the stale pre-upsert value.
async function upsertAdminProfile(baseUrl, serviceKey, id, email) {
  const res = await fetch(baseUrl + "/rest/v1/hub_profiles", {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: "Bearer " + serviceKey,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify({
      id,
      email,
      status: "approved",
      access_group: "admin",
      role_label: "Platform Admin",
      approved_at: new Date().toISOString(),
      approved_by: "system (admin email allowlist)"
    })
  });
  if (res.status !== 200 && res.status !== 201) throw new Error("hub_profiles admin upsert failed with status " + res.status);
  const data = await res.json();
  return Array.isArray(data) && data.length ? data[0] : (data || null);
}

// PENDING CREDS: cannot run without a live Supabase project. Self heals a
// non admin orphan (a verified auth user with no hub_profiles row at all,
// e.g. a Task 3 signup whose profile insert failed) by inserting a pending
// row. Prefer: resolution=ignore-duplicates makes this idempotent: if a row
// already exists (a race with a concurrent request, or an approval that
// landed in between the read above and this insert) the insert is silently
// skipped rather than overwriting it.
async function insertPendingProfile(baseUrl, serviceKey, id, email) {
  const res = await fetch(baseUrl + "/rest/v1/hub_profiles", {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: "Bearer " + serviceKey,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates"
    },
    body: JSON.stringify({ id, email, status: "pending" })
  });
  if (res.status !== 200 && res.status !== 201) throw new Error("hub_profiles pending insert failed with status " + res.status);
}

// Pure: given the verified user's email and their hub_profiles row (already
// self healed where needed), decides the outcome. No I/O; unit testable in
// isolation from Supabase and Supabase Auth. Admin is decided by session
// email (ADMIN_EMAILS), never by the data column, so it is checked first and
// short circuits regardless of the profile shape.
function resolveAccess(email, profile) {
  if (ADMIN_EMAILS.includes(email)) {
    return { state: "active", group: "admin" };
  }
  if (!profile || profile.status === "pending") {
    return { state: "pending" };
  }
  if (profile.status === "rejected") {
    return { state: "rejected" };
  }
  if (
    profile.status === "approved" &&
    (profile.access_group === "group1" || profile.access_group === "group2" || profile.access_group === "admin")
  ) {
    return { state: "active", group: profile.access_group };
  }
  // any other status/group combination is unrecognized: fail closed
  return { state: "pending" };
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
    const sessionSecret = process.env.CONTINUUM_HUB_SESSION_SECRET;
    if (!baseUrl || !serviceKey || !sessionSecret) {
      res.status(503).json({ ok: false, error: "hub signin not configured" });
      return;
    }

    const body = await readJsonBody(req);
    const validation = validateSigninInput(body);
    if (!validation.ok) {
      res.status(401).json({ ok: false });
      return;
    }

    const verified = await verifyPassword(baseUrl, serviceKey, validation.email, validation.password);
    if (verified.outcome === "error") {
      res.status(503).json({ ok: false, error: "hub signin error" });
      return;
    }
    if (verified.outcome !== "verified") {
      res.status(401).json({ ok: false });
      return;
    }

    const isAdmin = ADMIN_EMAILS.includes(verified.email);
    let profile = await loadProfile(baseUrl, serviceKey, verified.id);

    if (isAdmin) {
      const alreadyAdmin = profile && profile.status === "approved" && profile.access_group === "admin";
      if (!alreadyAdmin) {
        profile = await upsertAdminProfile(baseUrl, serviceKey, verified.id, verified.email);
      }
    } else if (!profile) {
      await insertPendingProfile(baseUrl, serviceKey, verified.id, verified.email);
      profile = { id: verified.id, email: verified.email, status: "pending", access_group: null };
    }

    const access = resolveAccess(verified.email, profile);

    if (access.state === "pending") {
      res.status(200).json({ ok: true, status: "pending" });
      return;
    }
    if (access.state === "rejected") {
      res.status(403).json({ ok: false });
      return;
    }

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + SESSION_TTL_SECONDS;
    const token = await signHubSession({ sub: verified.id, email: verified.email, group: access.group, iat, exp }, sessionSecret);
    res.setHeader("set-cookie", serializeHubCookie(token));
    res.status(200).json({ ok: true, group: access.group });
  } catch (e) {
    res.status(503).json({ ok: false, error: "hub signin error" });
  }
}

export { isCrossSiteRequest, resolveAccess, loadProfile, upsertAdminProfile, insertPendingProfile };
export default handler;
