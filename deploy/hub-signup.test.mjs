/* Continuum Hub sign up suite. node deploy/hub-signup.test.mjs
   Proves the CSRF guard, input validation, the neutral duplicate email
   response (no enumeration), fail closed on missing config, and that a
   successful create writes exactly one hub_profiles row with status pending.
   Real network calls never happen; the fetch stub is a per test mock.
   No dashes anywhere. */
import handler, { isCrossSiteRequest, insertPendingProfile } from "./api/hub-signup.js";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

function mockRes() {
  const r = { _status: null, _body: null, _headers: {} };
  r.status = (c) => { r._status = c; return r; };
  r.json = (b) => { r._body = b; return r; };
  r.setHeader = (k, v) => { r._headers[k] = v; };
  return r;
}

ok("cross site POST is rejected", isCrossSiteRequest({ headers: { "sec-fetch-site": "cross-site", host: "continuumrtw.com" } }) === true);
ok("same origin POST is not rejected on that signal alone", isCrossSiteRequest({ headers: { "sec-fetch-site": "same-origin", host: "continuumrtw.com" } }) === false);

async function main() {
  process.env.CONTINUUM_SUPABASE_URL = "https://x.supabase.co";
  process.env.CONTINUUM_SUPABASE_SERVICE_KEY = "svc-key";

  const resMethod = mockRes();
  await handler({ method: "GET", headers: { host: "continuumrtw.com" } }, resMethod);
  ok("GET is method not allowed", resMethod._status === 405);

  const resCrossSite = mockRes();
  await handler({ method: "POST", headers: { host: "continuumrtw.com", "sec-fetch-site": "cross-site" }, body: {} }, resCrossSite);
  ok("cross site POST is rejected end to end", resCrossSite._status === 403);

  const resBadInput = mockRes();
  await handler({ method: "POST", headers: { host: "continuumrtw.com" }, body: { email: "nope", password: "short" } }, resBadInput);
  ok("invalid input returns 400 with errors", resBadInput._status === 400 && Array.isArray(resBadInput._body.errors));

  const originalFetch = globalThis.fetch;
  let calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    if (url.includes("/auth/v1/admin/users")) return { status: 201, json: async () => ({ id: "u1", email: "worker@example.com" }) };
    if (url.includes("/rest/v1/hub_profiles")) return { status: 201, json: async () => ([{ id: "u1", email: "worker@example.com", status: "pending" }]) };
    throw new Error("unexpected fetch: " + url);
  };
  try {
    const resCreate = mockRes();
    await handler({ method: "POST", headers: { host: "continuumrtw.com" }, body: { email: "worker@example.com", password: "longenough1" } }, resCreate);
    ok("a fresh signup returns 200 pending", resCreate._status === 200 && resCreate._body.status === "pending");
    ok("a fresh signup inserts exactly one hub_profiles row", calls.filter((c) => c.url.includes("/rest/v1/hub_profiles")).length === 1);
    ok("the inserted row is status pending", JSON.parse(calls.find((c) => c.url.includes("/rest/v1/hub_profiles")).init.body).status === "pending");
    ok("no cookie is ever set on signup", !resCreate._headers["set-cookie"]);
  } finally {
    globalThis.fetch = originalFetch;
  }

  globalThis.fetch = async (url) => {
    if (url.includes("/auth/v1/admin/users")) return { status: 422, json: async () => ({ msg: "Email address already registered" }) };
    throw new Error("unexpected fetch: " + url);
  };
  try {
    const resDup = mockRes();
    await handler({ method: "POST", headers: { host: "continuumrtw.com" }, body: { email: "existing@example.com", password: "longenough1" } }, resDup);
    ok("a duplicate email returns the identical neutral 200 pending response", resDup._status === 200 && resDup._body.status === "pending");
  } finally {
    globalThis.fetch = originalFetch;
  }

  const resNoConfig = mockRes();
  delete process.env.CONTINUUM_SUPABASE_URL;
  await handler({ method: "POST", headers: { host: "continuumrtw.com" }, body: { email: "a@b.com", password: "longenough1" } }, resNoConfig);
  ok("missing config fails closed with 503", resNoConfig._status === 503);

  delete process.env.CONTINUUM_SUPABASE_SERVICE_KEY;

  console.log("\nhub-signup suite: " + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
}
main();
