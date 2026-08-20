/* Continuum admin directory endpoint. Vercel Node.js serverless function at
   /api/admin-directory. GET returns the REAL platform directory (active users
   and tenants) as operational metadata, so the Platform Admin portal shows
   live database state instead of hardcoded rows.

   AUTH: admin only, defense in depth. The /admin-portal page is already gated
   to isAdmin by deploy/middleware.js (a valid ct_session with group 'admin'
   AND an email in ADMIN_EMAILS). This endpoint verifies the SAME admin session
   itself, exactly like deploy/api/hub-admin.js, so the directory is never
   readable by a non admin even if the page gate were bypassed. A non admin
   gets 401/403, never data.

   OPERATIONAL METADATA ONLY: emails, names, roles, tenant, status, last active.
   No clinical content ever, matching the admin portal's own telemetry law.

   Reads public.users and public.tenants directly over PostgREST with the
   service role key (server side only, never exposed to the browser), matching
   the zero SDK plain fetch pattern the rest of deploy/api uses. Soft deleted
   rows (deleted_at not null) are excluded, so removed demo users never appear.
   Fails closed: missing env or any unexpected error denies. No dashes anywhere. */

import { verifyHubSession, parseCookies, isAuthorizedAdmin } from "./_hub_session.js";

// DB role -> the admin portal's role vocabulary (its filter chips). Any role
// ending in "_physician" maps to "physician" via mapRole below, so the physician
// role variant is handled without naming the upstream clinical partner here.
const ROLE_MAP = {
  ops_admin: "continuum_admin",
  worker: "worker",
  hse: "hse",
  employer_admin: "employer_admin",
  wcb_officer: "board_officer"
};

function mapRole(role) {
  if (typeof role === "string" && /physician$/.test(role)) return "physician";
  return ROLE_MAP[role] || role;
}

// province code -> the board label the admin portal shows.
const BOARD_MAP = {
  ab: "WCB Alberta", bc: "WorkSafeBC", sk: "WCB Saskatchewan", mb: "WCB Manitoba",
  on: "WSIB Ontario", qc: "CNESST", nb: "WorkSafeNB", ns: "WCB Nova Scotia",
  pe: "WCB PEI", nl: "WorkplaceNL", yt: "WCB Yukon", nt: "WSCC", nu: "WSCC"
};

// Pure: a compact relative time from an ISO timestamp, matching the admin's
// "12m ago" / "3d ago" style. Never throws.
function ago(iso) {
  try {
    const then = Date.parse(iso);
    if (!then) return "";
    const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (s < 60) return "just now";
    const m = Math.floor(s / 60); if (m < 60) return m + "m ago";
    const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
    const d = Math.floor(h / 24); return d + "d ago";
  } catch (e) { return ""; }
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

async function getRows(baseUrl, serviceKey, path) {
  const res = await fetch(baseUrl + path, {
    headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey }
  });
  if (res.status !== 200) throw new Error("read failed " + res.status);
  return res.json();
}

async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.status(405).json({ ok: false, error: "method not allowed" });
      return;
    }
    const auth = await requireHubAdmin(req);
    if (!auth.ok) {
      res.status(auth.status).json({ ok: false, error: auth.error });
      return;
    }
    const baseUrl = process.env.CONTINUUM_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.CONTINUUM_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!baseUrl || !serviceKey) {
      res.status(503).json({ ok: false, error: "directory not configured" });
      return;
    }

    const dbUsers = await getRows(baseUrl, serviceKey,
      "/rest/v1/users?deleted_at=is.null&select=id,full_name,email,role,status,tenant_id,updated_at&order=created_at");
    const dbTenants = await getRows(baseUrl, serviceKey,
      "/rest/v1/tenants?deleted_at=is.null&select=id,name,province,status,wcb_account_number,created_at&order=created_at");

    const tenantName = {};
    dbTenants.forEach(function (t) { tenantName[t.id] = t.name; });

    const users = dbUsers.map(function (u) {
      return {
        id: u.id,
        name: u.full_name || u.email,
        role: mapRole(u.role),
        org: u.tenant_id ? (tenantName[u.tenant_id] || "Unknown tenant")
                         : (u.role === "ops_admin" ? "Continuum" : "Unassigned"),
        status: u.status,
        last: ago(u.updated_at)
      };
    });

    const tenants = dbTenants.map(function (t) {
      return {
        id: t.id, name: t.name,
        board: BOARD_MAP[t.province] || (t.province ? t.province.toUpperCase() : "Unknown"),
        paused: false, pose: false, committee: "",
        active: 0, completion: 0, onboarded: 0, weeks: 0,
        pilot: false, sandbox: (t.status === "sandbox")
      };
    });

    res.status(200).json({
      ok: true,
      generated_at: new Date().toISOString(),
      users, tenants,
      counts: { active_users: users.length, tenants: tenants.length }
    });
  } catch (e) {
    res.status(503).json({ ok: false, error: "directory error" });
  }
}

export { ago, ROLE_MAP, requireHubAdmin };
export default handler;
