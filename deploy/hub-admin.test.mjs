/* Continuum Hub admin approval suite. node deploy/hub-admin.test.mjs
   Proves validateApproveInput, the CSRF guard, the requireHubAdmin guard
   fails closed (missing/wrong signature/expired ct_session, every action,
   zero Supabase calls), and the approve/reject Supabase writes carry the
   right status and access_group. No dashes anywhere. */
import handler, { validateApproveInput, isCrossSiteRequest, GROUPS } from "./api/hub-admin.js";
import { signHubSession } from "./api/_hub_session.js";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

ok("GROUPS is exactly group1 and group2 (admin is never assignable here)", GROUPS.length === 2 && GROUPS.includes("group1") && GROUPS.includes("group2") && !GROUPS.includes("admin"));

ok("missing id is an error", validateApproveInput({ access_group: "group1" }).ok === false);
ok("missing access_group is an error", validateApproveInput({ id: "u1" }).ok === false);
ok("access_group admin is rejected (not assignable via approve)", validateApproveInput({ id: "u1", access_group: "admin" }).ok === false);
ok("group1 is a valid approve input", validateApproveInput({ id: "u1", access_group: "group1" }).ok === true);
ok("group2 is a valid approve input", validateApproveInput({ id: "u1", access_group: "group2" }).ok === true);

ok("cross site POST is rejected", isCrossSiteRequest({ headers: { "sec-fetch-site": "cross-site", host: "continuumrtw.com" } }) === true);

function mockRes() {
  const r = { _status: null, _body: null };
  r.status = (c) => { r._status = c; return r; };
  r.json = (b) => { r._body = b; return r; };
  return r;
}

async function main() {
  const HUB_SECRET = "hub-admin-test-secret";
  const HUB_WRONG_SECRET = "hub-admin-test-wrong-secret";
  process.env.CONTINUUM_HUB_SESSION_SECRET = HUB_SECRET;
  const now = Math.floor(Date.now() / 1000);

  const forged = await signHubSession({ email: "gary@farmceuticawellness.com", group: "admin", iat: now, exp: now + 3600 }, HUB_WRONG_SECRET);
  const expired = await signHubSession({ email: "gary@farmceuticawellness.com", group: "admin", iat: now - 7200, exp: now - 3600 }, HUB_SECRET);
  const nonAdmin = await signHubSession({ email: "someone-else@example.com", group: "group1", iat: now, exp: now + 3600 }, HUB_SECRET);

  const guardScenarios = [
    { name: "missing ct_session", cookie: "" },
    { name: "wrong signature ct_session", cookie: "ct_session=" + forged },
    { name: "expired ct_session", cookie: "ct_session=" + expired },
    { name: "non admin ct_session", cookie: "ct_session=" + nonAdmin }
  ];

  let fetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { fetchCalls++; throw new Error("fetch must not be called: the guard should fail closed first"); };

  try {
    for (const scenario of guardScenarios) {
      for (const action of ["list", "approve", "reject"]) {
        fetchCalls = 0;
        const headers = { host: "continuumrtw.com" };
        if (scenario.cookie) headers.cookie = scenario.cookie;
        const req = action === "list"
          ? { method: "GET", url: "/api/hub-admin", headers }
          : { method: "POST", url: "/api/hub-admin", headers, body: { action, id: "u1", access_group: "group1" } };
        const res = mockRes();
        await handler(req, res);
        const expectedStatus = scenario.name === "non admin ct_session" ? 403 : 401;
        ok(scenario.name + " + " + action + " returns " + expectedStatus, res._status === expectedStatus);
        ok(scenario.name + " + " + action + " never reaches Supabase", fetchCalls === 0);
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
  }

  // authorized admin: approve writes status approved and the chosen group
  const adminToken = await signHubSession({ email: "gary@farmceuticawellness.com", group: "admin", iat: now, exp: now + 3600 }, HUB_SECRET);
  process.env.CONTINUUM_SUPABASE_URL = "https://x.supabase.co";
  process.env.CONTINUUM_SUPABASE_SERVICE_KEY = "svc-key";

  let patchBody = null;
  globalThis.fetch = async (url, init) => {
    if (init.method === "PATCH") { patchBody = JSON.parse(init.body); return { ok: true, status: 200, json: async () => ([{ ...patchBody, id: "u1" }]) }; }
    if (!init || !init.method || init.method === "GET") return { ok: true, status: 200, json: async () => ([]) };
    throw new Error("unexpected fetch: " + url);
  };
  try {
    const res = mockRes();
    await handler({ method: "POST", url: "/api/hub-admin", headers: { host: "continuumrtw.com", cookie: "ct_session=" + adminToken }, body: { action: "approve", id: "u1", access_group: "group1" } }, res);
    ok("approve returns 200 with the updated profile", res._status === 200 && res._body.ok === true);
    ok("approve PATCHes status approved and access_group group1", patchBody && patchBody.status === "approved" && patchBody.access_group === "group1");
    ok("approve stamps approved_by with the admin's own email", patchBody.approved_by === "gary@farmceuticawellness.com");

    const resReject = mockRes();
    await handler({ method: "POST", url: "/api/hub-admin", headers: { host: "continuumrtw.com", cookie: "ct_session=" + adminToken }, body: { action: "reject", id: "u2" } }, resReject);
    ok("reject returns 200", resReject._status === 200);
    ok("reject PATCHes status rejected", patchBody && patchBody.status === "rejected");

    const resList = mockRes();
    await handler({ method: "GET", url: "/api/hub-admin", headers: { host: "continuumrtw.com", cookie: "ct_session=" + adminToken } }, resList);
    ok("list returns 200 with a profiles array", resList._status === 200 && Array.isArray(resList._body.profiles));
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.CONTINUUM_SUPABASE_URL;
    delete process.env.CONTINUUM_SUPABASE_SERVICE_KEY;
    delete process.env.CONTINUUM_HUB_SESSION_SECRET;
  }

  console.log("\nhub-admin suite: " + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
}
main();
