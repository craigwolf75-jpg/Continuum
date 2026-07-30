/* Continuum Hub sign out suite. node deploy/hub-signout.test.mjs
   Proves POST /api/hub-signout clears ct_session (never ct_site), rejects a
   cross site POST before doing anything else, is idempotent with no
   incoming cookie, and rejects any non POST method.
   No dashes anywhere. */
import handler, { isCrossSiteRequest } from "./api/hub-signout.js";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

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

async function main() {
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
    await handler({ method: "POST", headers: { host: "continuumrtw.com", "sec-fetch-site": "cross-site" } }, res);
    ok("cross site POST is rejected end to end", res._status === 403);
    ok("cross site POST sets no cookie", !res._headers["set-cookie"]);
  }

  // -- same origin POST, no incoming cookie at all: still clears cleanly --
  {
    const res = mockRes();
    await handler({ method: "POST", headers: { host: "continuumrtw.com" } }, res);
    ok("same origin POST with no incoming cookie still returns 200", res._status === 200 && res._body.ok === true);
    const cookie = res._headers["set-cookie"];
    ok("Set-Cookie clears ct_session with Max-Age=0", typeof cookie === "string" && /ct_session=;.*Max-Age=0/.test(cookie));
    ok("the cleared cookie name is ct_session, never ct_site", typeof cookie === "string" && cookie.startsWith("ct_session=") && !cookie.startsWith("ct_site="));
  }

  // -- same origin POST with an incoming cookie: also clears cleanly --
  {
    const res = mockRes();
    await handler({ method: "POST", headers: { host: "continuumrtw.com", cookie: "ct_session=sometoken.sig" } }, res);
    ok("same origin POST with an existing cookie returns 200", res._status === 200 && res._body.ok === true);
    const cookie = res._headers["set-cookie"];
    ok("clears ct_session with Max-Age=0 regardless of the incoming value", typeof cookie === "string" && /ct_session=;.*Max-Age=0/.test(cookie));
  }

  console.log("\nhub-signout suite: " + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
}
main();
