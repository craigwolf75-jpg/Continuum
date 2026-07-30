/* Continuum Hub sign in suite. node deploy/hub-signin.test.mjs
   Proves resolveAccess in isolation (pure: no profile/pending -> pending,
   rejected -> rejected, approved group1/group2 -> active, ADMIN_EMAILS ->
   always active admin regardless of the profile row), then the endpoint end
   to end with a mocked fetch: method/CSRF/config guards, bad password and
   an unknown user both return the identical neutral 401, a GoTrue error
   fails closed with 503, pending and rejected profiles set no cookie, an
   approved profile issues a ct_session cookie carrying its group, a non
   admin orphan (verified user with no hub_profiles row) self heals a
   pending row with an idempotent insert, and gary@ always resolves to an
   active admin session (with a self healed hub_profiles row) whether the
   stored row is pending or missing entirely. upsertAdminProfile is also
   unit tested directly to prove it returns the parsed upserted row (so the
   handler never carries a stale pre-upsert profile forward), and an
   already-approved-admin stored row is proven to skip the upsert write
   entirely while still issuing the admin session. Every issued cookie is
   asserted to be ct_session, never ct_site. No dashes anywhere. */
import handler, { isCrossSiteRequest, resolveAccess, upsertAdminProfile } from "./api/hub-signin.js";
import { verifyHubSession, ADMIN_EMAILS } from "./api/_hub_session.js";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// -- resolveAccess, pure --
ok("no profile is pending", resolveAccess("worker@example.com", null).state === "pending");
ok("pending profile is pending", resolveAccess("worker@example.com", { status: "pending" }).state === "pending");
ok("rejected profile is rejected", resolveAccess("worker@example.com", { status: "rejected" }).state === "rejected");
ok("approved group1 is active with group1", (() => { const a = resolveAccess("worker@example.com", { status: "approved", access_group: "group1" }); return a.state === "active" && a.group === "group1"; })());
ok("approved group2 is active with group2", (() => { const a = resolveAccess("clinic@example.com", { status: "approved", access_group: "group2" }); return a.state === "active" && a.group === "group2"; })());
ok("approved with an unrecognized group fails closed to pending", resolveAccess("x@example.com", { status: "approved", access_group: "bogus" }).state === "pending");
ok("approved with access_group admin on a non admin email fails closed to pending, no session minted (I1)", resolveAccess("notadmin@example.com", { status: "approved", access_group: "admin" }).state === "pending");
ok("approved with a null access_group fails closed to pending (I1)", resolveAccess("x@example.com", { status: "approved", access_group: null }).state === "pending");
ok("an unrecognized status fails closed to pending", resolveAccess("x@example.com", { status: "weird" }).state === "pending");
ok("ADMIN_EMAILS resolves active admin even with no profile at all", (() => { const a = resolveAccess("gary@farmceuticawellness.com", null); return a.state === "active" && a.group === "admin"; })());
ok("ADMIN_EMAILS resolves active admin even over a pending profile", (() => { const a = resolveAccess("gary@farmceuticawellness.com", { status: "pending" }); return a.state === "active" && a.group === "admin"; })());
ok("ADMIN_EMAILS resolves active admin even over a rejected profile", (() => { const a = resolveAccess("gary@farmceuticawellness.com", { status: "rejected" }); return a.state === "active" && a.group === "admin"; })());
ok("gary@farmceuticawellness.com is in ADMIN_EMAILS", ADMIN_EMAILS.includes("gary@farmceuticawellness.com"));

// -- CSRF guard, pure --
ok("cross site POST is rejected", isCrossSiteRequest({ headers: { "sec-fetch-site": "cross-site", host: "continuumrtw.com" } }) === true);
ok("same origin POST is not rejected on that signal alone", isCrossSiteRequest({ headers: { "sec-fetch-site": "same-origin", host: "continuumrtw.com" } }) === false);

function mockRes() {
  const r = { _status: null, _body: null, _headers: {} };
  r.status = (c) => { r._status = c; return r; };
  r.json = (b) => { r._body = b; return r; };
  r.setHeader = (k, v) => { r._headers[k] = v; };
  return r;
}

const SECRET = "signin-test-secret";
const BASE_URL = "https://x.supabase.co";
const SERVICE_KEY = "svc-key";

async function main() {
  const originalFetch = globalThis.fetch;

  // -- non POST --
  {
    const res = mockRes();
    await handler({ method: "GET", headers: { host: "continuumrtw.com" } }, res);
    ok("GET is method not allowed", res._status === 405);
    ok("GET sets no cookie", !res._headers["set-cookie"]);
  }

  // -- cross site POST --
  {
    const res = mockRes();
    await handler({ method: "POST", headers: { host: "continuumrtw.com", "sec-fetch-site": "cross-site" }, body: {} }, res);
    ok("cross site POST is rejected end to end", res._status === 403);
    ok("cross site POST sets no cookie", !res._headers["set-cookie"]);
  }

  // -- missing env: no config set at all yet --
  {
    const res = mockRes();
    await handler({ method: "POST", headers: { host: "continuumrtw.com" }, body: { email: "a@b.com", password: "longenough1" } }, res);
    ok("missing env fails closed with 503", res._status === 503);
    ok("missing env sets no cookie", !res._headers["set-cookie"]);
  }

  process.env.CONTINUUM_SUPABASE_URL = BASE_URL;
  process.env.CONTINUUM_SUPABASE_SERVICE_KEY = SERVICE_KEY;
  process.env.CONTINUUM_HUB_SESSION_SECRET = SECRET;

  // -- invalid password --
  globalThis.fetch = async (url) => {
    if (url.includes("/auth/v1/token")) return { status: 400, json: async () => ({ error: "invalid_grant" }) };
    throw new Error("unexpected fetch: " + url);
  };
  let badPasswordBody;
  try {
    const res = mockRes();
    await handler({ method: "POST", headers: { host: "continuumrtw.com" }, body: { email: "worker@example.com", password: "wrong" } }, res);
    ok("bad password returns 401", res._status === 401);
    ok("bad password sets no cookie", !res._headers["set-cookie"]);
    badPasswordBody = res._body;
  } finally { globalThis.fetch = originalFetch; }

  // -- unknown user: GoTrue reports the identical 400 as a bad password --
  globalThis.fetch = async (url) => {
    if (url.includes("/auth/v1/token")) return { status: 400, json: async () => ({ error: "invalid_grant" }) };
    throw new Error("unexpected fetch: " + url);
  };
  try {
    const res = mockRes();
    await handler({ method: "POST", headers: { host: "continuumrtw.com" }, body: { email: "nosuchuser@example.com", password: "longenough1" } }, res);
    ok("unknown user returns 401", res._status === 401);
    ok("unknown user sets no cookie", !res._headers["set-cookie"]);
    ok("unknown user gets the identical neutral body as a bad password", JSON.stringify(res._body) === JSON.stringify(badPasswordBody));
  } finally { globalThis.fetch = originalFetch; }

  // -- verifyPassword error: GoTrue returns an unexpected status --
  globalThis.fetch = async (url) => {
    if (url.includes("/auth/v1/token")) return { status: 500, json: async () => ({}) };
    throw new Error("unexpected fetch: " + url);
  };
  try {
    const res = mockRes();
    await handler({ method: "POST", headers: { host: "continuumrtw.com" }, body: { email: "worker@example.com", password: "longenough1" } }, res);
    ok("a GoTrue error fails closed with 503", res._status === 503);
    ok("a GoTrue error sets no cookie", !res._headers["set-cookie"]);
  } finally { globalThis.fetch = originalFetch; }

  // -- pending profile (row exists, status pending) --
  let pendingCalls = [];
  globalThis.fetch = async (url, init) => {
    pendingCalls.push({ url, init });
    if (url.includes("/auth/v1/token")) return { status: 200, json: async () => ({ user: { id: "u1", email: "worker@example.com" } }) };
    if (url.includes("/rest/v1/hub_profiles")) return { status: 200, json: async () => ([{ id: "u1", email: "worker@example.com", status: "pending", access_group: null }]) };
    throw new Error("unexpected fetch: " + url);
  };
  try {
    const res = mockRes();
    await handler({ method: "POST", headers: { host: "continuumrtw.com" }, body: { email: "worker@example.com", password: "longenough1" } }, res);
    ok("pending returns 200 with status pending", res._status === 200 && res._body.status === "pending");
    ok("pending sets no cookie", !res._headers["set-cookie"]);
    ok("pending never writes to hub_profiles (only the read happens)", pendingCalls.filter((c) => c.url.includes("/rest/v1/hub_profiles") && c.init.method === "POST").length === 0);
    ok("no response body ever carries the service key or base url", !JSON.stringify(res._body).includes(SERVICE_KEY) && !JSON.stringify(res._body).includes(BASE_URL));
  } finally { globalThis.fetch = originalFetch; }

  // -- rejected profile --
  globalThis.fetch = async (url) => {
    if (url.includes("/auth/v1/token")) return { status: 200, json: async () => ({ user: { id: "u2", email: "gone@example.com" } }) };
    if (url.includes("/rest/v1/hub_profiles")) return { status: 200, json: async () => ([{ id: "u2", email: "gone@example.com", status: "rejected", access_group: null }]) };
    throw new Error("unexpected fetch: " + url);
  };
  try {
    const res = mockRes();
    await handler({ method: "POST", headers: { host: "continuumrtw.com" }, body: { email: "gone@example.com", password: "longenough1" } }, res);
    ok("rejected returns 403 neutral", res._status === 403 && !/reject/i.test(JSON.stringify(res._body)));
    ok("rejected sets no cookie", !res._headers["set-cookie"]);
  } finally { globalThis.fetch = originalFetch; }

  // -- approved group1 --
  globalThis.fetch = async (url) => {
    if (url.includes("/auth/v1/token")) return { status: 200, json: async () => ({ user: { id: "u3", email: "employer@example.com" } }) };
    if (url.includes("/rest/v1/hub_profiles")) return { status: 200, json: async () => ([{ id: "u3", email: "employer@example.com", status: "approved", access_group: "group1" }]) };
    throw new Error("unexpected fetch: " + url);
  };
  try {
    const res = mockRes();
    await handler({ method: "POST", headers: { host: "continuumrtw.com" }, body: { email: "employer@example.com", password: "longenough1" } }, res);
    ok("approved group1 returns 200 active group1", res._status === 200 && res._body.group === "group1");
    const cookie = res._headers["set-cookie"];
    ok("approved group1 sets a ct_session cookie", typeof cookie === "string" && cookie.startsWith("ct_session="));
    ok("approved group1 never sets a ct_site cookie", typeof cookie === "string" && !cookie.startsWith("ct_site="));
    const token = cookie.split("ct_session=")[1].split(";")[0];
    const payload = await verifyHubSession(token, SECRET, Math.floor(Date.now() / 1000));
    ok("the issued token verifies and carries group1", payload && payload.group === "group1" && payload.email === "employer@example.com" && payload.sub === "u3");
  } finally { globalThis.fetch = originalFetch; }

  // -- missing profile orphan (non admin, no hub_profiles row at all) --
  let orphanCalls = [];
  globalThis.fetch = async (url, init) => {
    orphanCalls.push({ url, init });
    if (url.includes("/auth/v1/token")) return { status: 200, json: async () => ({ user: { id: "u4", email: "orphan@example.com" } }) };
    if (url.includes("/rest/v1/hub_profiles") && init.method === "GET") return { status: 200, json: async () => ([]) };
    if (url.includes("/rest/v1/hub_profiles") && init.method === "POST") return { status: 201, json: async () => ([]) };
    throw new Error("unexpected fetch: " + url);
  };
  try {
    const res = mockRes();
    await handler({ method: "POST", headers: { host: "continuumrtw.com" }, body: { email: "orphan@example.com", password: "longenough1" } }, res);
    ok("a non admin orphan returns 200 with status pending", res._status === 200 && res._body.status === "pending");
    ok("a non admin orphan sets no cookie", !res._headers["set-cookie"]);
    const insertCall = orphanCalls.find((c) => c.url.includes("/rest/v1/hub_profiles") && c.init.method === "POST");
    ok("the orphan self heal inserts exactly one hub_profiles row", orphanCalls.filter((c) => c.url.includes("/rest/v1/hub_profiles") && c.init.method === "POST").length === 1);
    ok("the orphan insert body is a pending row for this user", insertCall && JSON.parse(insertCall.init.body).status === "pending" && JSON.parse(insertCall.init.body).id === "u4");
    ok("the orphan insert uses PostgREST ignore-duplicates resolution", insertCall && insertCall.init.headers.Prefer.includes("ignore-duplicates"));
  } finally { globalThis.fetch = originalFetch; }

  // -- gary@ signing in with a pending stored row still resolves to admin --
  let garyPendingCalls = [];
  globalThis.fetch = async (url, init) => {
    garyPendingCalls.push({ url, init });
    if (url.includes("/auth/v1/token")) return { status: 200, json: async () => ({ user: { id: "u-gary", email: "gary@farmceuticawellness.com" } }) };
    if (url.includes("/rest/v1/hub_profiles") && init.method === "GET") return { status: 200, json: async () => ([{ id: "u-gary", email: "gary@farmceuticawellness.com", status: "pending", access_group: null }]) };
    if (url.includes("/rest/v1/hub_profiles") && init.method === "POST") return { status: 200, json: async () => ([{ id: "u-gary", email: "gary@farmceuticawellness.com", status: "approved", access_group: "admin" }]) };
    throw new Error("unexpected fetch: " + url);
  };
  try {
    const res = mockRes();
    await handler({ method: "POST", headers: { host: "continuumrtw.com" }, body: { email: "gary@farmceuticawellness.com", password: "longenough1" } }, res);
    ok("gary@ with a pending stored row still gets 200 active admin", res._status === 200 && res._body.group === "admin");
    const cookie = res._headers["set-cookie"];
    ok("gary@ gets a ct_session cookie, never ct_site", typeof cookie === "string" && cookie.startsWith("ct_session=") && !cookie.startsWith("ct_site="));
    const upsertCall = garyPendingCalls.find((c) => c.url.includes("/rest/v1/hub_profiles") && c.init.method === "POST");
    ok("gary@ signing in self heals hub_profiles to approved admin regardless of the pending row", upsertCall && JSON.parse(upsertCall.init.body).status === "approved" && JSON.parse(upsertCall.init.body).access_group === "admin");
    ok("the admin self heal upsert uses PostgREST merge-duplicates resolution", upsertCall && upsertCall.init.headers.Prefer.includes("merge-duplicates"));
  } finally { globalThis.fetch = originalFetch; }

  // -- gary@ signing in with no prior hub_profiles row at all --
  let garyAbsentCalls = [];
  globalThis.fetch = async (url, init) => {
    garyAbsentCalls.push({ url, init });
    if (url.includes("/auth/v1/token")) return { status: 200, json: async () => ({ user: { id: "u-gary", email: "gary@farmceuticawellness.com" } }) };
    if (url.includes("/rest/v1/hub_profiles") && init.method === "GET") return { status: 200, json: async () => ([]) };
    if (url.includes("/rest/v1/hub_profiles") && init.method === "POST") return { status: 201, json: async () => ([{ id: "u-gary", email: "gary@farmceuticawellness.com", status: "approved", access_group: "admin" }]) };
    throw new Error("unexpected fetch: " + url);
  };
  try {
    const res = mockRes();
    await handler({ method: "POST", headers: { host: "continuumrtw.com" }, body: { email: "gary@farmceuticawellness.com", password: "longenough1" } }, res);
    ok("gary@ with no profile row at all still gets 200 active admin", res._status === 200 && res._body.group === "admin");
    ok("gary@ absent row self heal never takes the non admin orphan pending path", garyAbsentCalls.filter((c) => c.url.includes("/rest/v1/hub_profiles") && c.init.method === "POST").length === 1);
    const upsertCall = garyAbsentCalls.find((c) => c.url.includes("/rest/v1/hub_profiles") && c.init.method === "POST");
    ok("gary@ with no row is self healed to approved admin", upsertCall && JSON.parse(upsertCall.init.body).status === "approved" && JSON.parse(upsertCall.init.body).access_group === "admin");
    const cookie = res._headers["set-cookie"];
    const token = cookie.split("ct_session=")[1].split(";")[0];
    const payload = await verifyHubSession(token, SECRET, Math.floor(Date.now() / 1000));
    ok("gary@'s issued token carries the admin group", payload && payload.group === "admin" && payload.email === "gary@farmceuticawellness.com");
  } finally { globalThis.fetch = originalFetch; }

  // -- upsertAdminProfile returns the parsed upserted row, not just performs
  //    a write, so the caller can carry it forward instead of a stale value --
  globalThis.fetch = async (url, init) => {
    if (url.includes("/rest/v1/hub_profiles") && init.method === "POST") {
      return { status: 200, json: async () => ([{ id: "u-x", email: "gary@farmceuticawellness.com", status: "approved", access_group: "admin" }]) };
    }
    throw new Error("unexpected fetch: " + url);
  };
  try {
    const row = await upsertAdminProfile(BASE_URL, SERVICE_KEY, "u-x", "gary@farmceuticawellness.com");
    ok("upsertAdminProfile returns the parsed upserted row (the caller reassigns profile from this, not the stale pre-upsert value)", row && row.id === "u-x" && row.status === "approved" && row.access_group === "admin");
  } finally { globalThis.fetch = originalFetch; }

  // -- gary@ already an approved admin row: the upsert write is skipped
  //    entirely, but the admin session is still issued --
  let garyAlreadyAdminCalls = [];
  globalThis.fetch = async (url, init) => {
    garyAlreadyAdminCalls.push({ url, init });
    if (url.includes("/auth/v1/token")) return { status: 200, json: async () => ({ user: { id: "u-gary", email: "gary@farmceuticawellness.com" } }) };
    if (url.includes("/rest/v1/hub_profiles") && init.method === "GET") return { status: 200, json: async () => ([{ id: "u-gary", email: "gary@farmceuticawellness.com", status: "approved", access_group: "admin" }]) };
    if (url.includes("/rest/v1/hub_profiles") && init.method === "POST") return { status: 200, json: async () => ([{}]) }; // should never be reached
    throw new Error("unexpected fetch: " + url);
  };
  try {
    const res = mockRes();
    await handler({ method: "POST", headers: { host: "continuumrtw.com" }, body: { email: "gary@farmceuticawellness.com", password: "longenough1" } }, res);
    ok("gary@ already an approved admin row returns 200 active admin", res._status === 200 && res._body.group === "admin");
    ok("gary@ already an approved admin row triggers zero upsert POSTs", garyAlreadyAdminCalls.filter((c) => c.url.includes("/rest/v1/hub_profiles") && c.init.method === "POST").length === 0);
    const cookie = res._headers["set-cookie"];
    ok("gary@ already an approved admin row still gets a ct_session cookie", typeof cookie === "string" && cookie.startsWith("ct_session="));
  } finally { globalThis.fetch = originalFetch; }

  // -- I1 end to end: an approved row with access_group='admin' on a non
  //    admin email must never mint an admin (or any) session --
  globalThis.fetch = async (url) => {
    if (url.includes("/auth/v1/token")) return { status: 200, json: async () => ({ user: { id: "u5", email: "notadmin@example.com" } }) };
    if (url.includes("/rest/v1/hub_profiles")) return { status: 200, json: async () => ([{ id: "u5", email: "notadmin@example.com", status: "approved", access_group: "admin" }]) };
    throw new Error("unexpected fetch: " + url);
  };
  try {
    const res = mockRes();
    await handler({ method: "POST", headers: { host: "continuumrtw.com" }, body: { email: "notadmin@example.com", password: "longenough1" } }, res);
    ok("approved access_group admin on a non admin email returns 200 pending, not an admin session (I1)", res._status === 200 && res._body.status === "pending");
    ok("approved access_group admin on a non admin email sets no cookie (I1)", !res._headers["set-cookie"]);
  } finally { globalThis.fetch = originalFetch; }

  // -- M4 end to end: a mixed case GoTrue verified.email still resolves the
  //    correct non admin group, and the issued session email claim is
  //    normalized lowercase --
  globalThis.fetch = async (url) => {
    if (url.includes("/auth/v1/token")) return { status: 200, json: async () => ({ user: { id: "u6", email: "Employer@Example.com" } }) };
    if (url.includes("/rest/v1/hub_profiles")) return { status: 200, json: async () => ([{ id: "u6", email: "employer@example.com", status: "approved", access_group: "group1" }]) };
    throw new Error("unexpected fetch: " + url);
  };
  try {
    const res = mockRes();
    await handler({ method: "POST", headers: { host: "continuumrtw.com" }, body: { email: "Employer@Example.com", password: "longenough1" } }, res);
    ok("mixed case verified.email still resolves active group1 (M4)", res._status === 200 && res._body.group === "group1");
    const cookie = res._headers["set-cookie"];
    const token = cookie.split("ct_session=")[1].split(";")[0];
    const payload = await verifyHubSession(token, SECRET, Math.floor(Date.now() / 1000));
    ok("the issued session email claim is normalized lowercase (M4)", payload && payload.email === "employer@example.com");
  } finally { globalThis.fetch = originalFetch; }

  // -- M4 end to end: a mixed case GoTrue verified.email for the admin
  //    address still hits the ADMIN_EMAILS allowlist (which is stored
  //    lowercase) and still resolves active admin --
  let garyMixedCaseCalls = [];
  globalThis.fetch = async (url, init) => {
    garyMixedCaseCalls.push({ url, init });
    if (url.includes("/auth/v1/token")) return { status: 200, json: async () => ({ user: { id: "u-gary", email: "Gary@FarmceuticaWellness.com" } }) };
    if (url.includes("/rest/v1/hub_profiles") && init.method === "GET") return { status: 200, json: async () => ([]) };
    if (url.includes("/rest/v1/hub_profiles") && init.method === "POST") return { status: 201, json: async () => ([{ id: "u-gary", email: "gary@farmceuticawellness.com", status: "approved", access_group: "admin" }]) };
    throw new Error("unexpected fetch: " + url);
  };
  try {
    const res = mockRes();
    await handler({ method: "POST", headers: { host: "continuumrtw.com" }, body: { email: "Gary@FarmceuticaWellness.com", password: "longenough1" } }, res);
    ok("a mixed case gary@ verified.email still resolves active admin (M4)", res._status === 200 && res._body.group === "admin");
    const upsertCall = garyMixedCaseCalls.find((c) => c.url.includes("/rest/v1/hub_profiles") && c.init.method === "POST");
    ok("the admin self heal upsert writes the normalized lowercase email (M4)", upsertCall && JSON.parse(upsertCall.init.body).email === "gary@farmceuticawellness.com");
  } finally { globalThis.fetch = originalFetch; }

  delete process.env.CONTINUUM_SUPABASE_URL;
  delete process.env.CONTINUUM_SUPABASE_SERVICE_KEY;
  delete process.env.CONTINUUM_HUB_SESSION_SECRET;

  console.log("\nhub-signin suite: " + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
}
main();
