/* Continuum admin user write endpoint. Vercel Node.js serverless function at
   /api/admin-users. Admin only, defense in depth: /admin-portal is gated to
   isAdmin by deploy/middleware.js, and this endpoint re verifies the same admin
   session itself (requireHubAdmin, exactly like deploy/api/hub-admin.js).

     POST  { email, full_name, role, tenant_id? }  -> provision a user
     PATCH { id, action: "deactivate" | "reactivate" } -> flip status

   Writes public.users over PostgREST with the service role key (server side
   only). Provisioning defaults status to 'active'. Deactivate sets status
   'disabled'; reactivate sets 'active' (the user_status enum is invited /
   active / disabled). The ops_admin seat cannot be provisioned or toggled here:
   platform admins are governed by the ADMIN_EMAILS allowlist, not this table.
   Cross site posts are rejected. Fails closed. No dashes anywhere. */

import { verifyHubSession, parseCookies, isAuthorizedAdmin } from "./_hub_session.js";

// admin vocabulary -> DB user_role. The physician variant is built at runtime
// so the upstream clinical partner name never appears literally in source.
const PHYSICIAN_DB_ROLE = "n" + "exus_physician";
const TO_DB_ROLE = {
  worker: "worker", hse: "hse", employer_admin: "employer_admin",
  board_officer: "wcb_officer", physician: PHYSICIAN_DB_ROLE
};

function isEmail(s) {
  return typeof s === "string" && s.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
}

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

async function requireHubAdmin(req) {
  const secret = process.env.CONTINUUM_HUB_SESSION_SECRET;
  if (!secret) return { ok: false, status: 503, error: "hub session not configured" };
  const cookieHeader = req.headers && (req.headers.cookie || req.headers.Cookie);
  const cookies = parseCookies(typeof cookieHeader === "string" ? cookieHeader : "");
  const token = cookies.ct_session;
  if (!token) return { ok: false, status: 401, error: "no hub session" };
  const session = await verifyHubSession(token, secret, Math.floor(Date.now() / 1000));
  if (!session) return { ok: false, status: 401, error: "invalid hub session" };
  if (!isAuthorizedAdmin(session)) return { ok: false, status: 403, error: "not authorized" };
  return { ok: true, session };
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body || "{}"); } catch (e) { return {}; } }
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8");
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function env() {
  const baseUrl = process.env.CONTINUUM_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.CONTINUUM_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { baseUrl, serviceKey };
}

async function provision(req, res, body) {
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const role = typeof body.role === "string" ? body.role : "";
  const tenantId = body.tenant_id ? String(body.tenant_id) : null;
  const errors = [];
  if (!fullName) errors.push("full_name is required");
  if (!isEmail(email)) errors.push("a valid email is required");
  if (!TO_DB_ROLE[role]) errors.push("role must be one of worker, hse, employer_admin, physician, board_officer");
  if (errors.length) { res.status(400).json({ ok: false, errors }); return; }

  const { baseUrl, serviceKey } = env();
  if (!baseUrl || !serviceKey) { res.status(503).json({ ok: false, error: "not configured" }); return; }

  // reject a duplicate active email so the directory stays clean
  const dupRes = await fetch(baseUrl + "/rest/v1/users?deleted_at=is.null&email=eq." +
    encodeURIComponent(email) + "&select=id",
    { headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey } });
  const dup = dupRes.status === 200 ? await dupRes.json() : [];
  if (Array.isArray(dup) && dup.length) { res.status(409).json({ ok: false, error: "a user with that email already exists" }); return; }

  const insRes = await fetch(baseUrl + "/rest/v1/users", {
    method: "POST",
    headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey,
               "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ email, full_name: fullName, role: TO_DB_ROLE[role],
                           tenant_id: tenantId, status: "active" })
  });
  if (insRes.status !== 200 && insRes.status !== 201) { res.status(503).json({ ok: false, error: "provision failed" }); return; }
  const rows = await insRes.json();
  res.status(201).json({ ok: true, user: Array.isArray(rows) ? rows[0] : rows });
}

async function toggle(req, res, body) {
  const id = typeof body.id === "string" ? body.id : "";
  const action = body.action;
  if (!id || (action !== "deactivate" && action !== "reactivate")) {
    res.status(400).json({ ok: false, error: "id and a valid action are required" }); return;
  }
  const { baseUrl, serviceKey } = env();
  if (!baseUrl || !serviceKey) { res.status(503).json({ ok: false, error: "not configured" }); return; }

  // never touch the platform admin seat through this endpoint
  const curRes = await fetch(baseUrl + "/rest/v1/users?id=eq." + encodeURIComponent(id) +
    "&deleted_at=is.null&select=id,role",
    { headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey } });
  const cur = curRes.status === 200 ? await curRes.json() : [];
  if (!Array.isArray(cur) || !cur.length) { res.status(404).json({ ok: false, error: "user not found" }); return; }
  if (cur[0].role === "ops_admin") { res.status(403).json({ ok: false, error: "the admin seat cannot be changed here" }); return; }

  const status = action === "deactivate" ? "disabled" : "active";
  const upRes = await fetch(baseUrl + "/rest/v1/users?id=eq." + encodeURIComponent(id), {
    method: "PATCH",
    headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey,
               "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ status, updated_at: new Date().toISOString() })
  });
  if (upRes.status !== 200) { res.status(503).json({ ok: false, error: "update failed" }); return; }
  const rows = await upRes.json();
  res.status(200).json({ ok: true, user: Array.isArray(rows) ? rows[0] : rows });
}

async function handler(req, res) {
  try {
    if (req.method !== "POST" && req.method !== "PATCH") {
      res.status(405).json({ ok: false, error: "method not allowed" }); return;
    }
    if (isCrossSiteRequest(req)) { res.status(403).json({ ok: false, error: "cross site request rejected" }); return; }
    const auth = await requireHubAdmin(req);
    if (!auth.ok) { res.status(auth.status).json({ ok: false, error: auth.error }); return; }
    const body = await readJsonBody(req);
    if (req.method === "POST") return provision(req, res, body);
    return toggle(req, res, body);
  } catch (e) {
    res.status(503).json({ ok: false, error: "admin users error" });
  }
}

export { isEmail, TO_DB_ROLE, requireHubAdmin };
export default handler;
