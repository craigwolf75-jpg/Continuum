/* Continuum Hub whoami suite. node deploy/hub-whoami.test.mjs
   Proves GET /api/hub-whoami reports identity straight from a verified
   ct_session, never issuing or refreshing a cookie itself, and fails
   closed (503) when CONTINUUM_HUB_SESSION_SECRET is not configured. Covers
   a valid session, a missing cookie, a tampered token, an expired token,
   the missing secret case, and the non GET method guard.
   No dashes anywhere. */
import handler from "./api/hub-whoami.js";
import { signHubSession } from "./api/_hub_session.js";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

function mockRes() {
  const r = { _status: null, _body: null, _headers: {} };
  r.status = (c) => { r._status = c; return r; };
  r.json = (b) => { r._body = b; return r; };
  r.setHeader = (k, v) => { r._headers[k] = v; };
  return r;
}

async function main() {
  const SECRET = "whoami-test-secret";
  const now = Math.floor(Date.now() / 1000);

  // -- missing secret: fail closed with 503, before even looking at the cookie --
  {
    const res = mockRes();
    await handler({ method: "GET", headers: { cookie: "ct_session=whatever" } }, res);
    ok("missing secret fails closed with 503", res._status === 503);
    ok("missing secret sets no cookie", !res._headers["set-cookie"]);
  }

  process.env.CONTINUUM_HUB_SESSION_SECRET = SECRET;

  // -- non GET --
  {
    const res = mockRes();
    await handler({ method: "POST", headers: {} }, res);
    ok("non GET is method not allowed", res._status === 405);
  }

  // -- no cookie at all --
  {
    const res = mockRes();
    await handler({ method: "GET", headers: {} }, res);
    ok("no cookie returns 401", res._status === 401 && res._body.ok === false);
    ok("no cookie sets no cookie", !res._headers["set-cookie"]);
  }

  // -- valid session --
  {
    const token = await signHubSession({ sub: "u1", email: "employer@example.com", group: "group1", iat: now, exp: now + 3600 }, SECRET);
    const res = mockRes();
    await handler({ method: "GET", headers: { cookie: "ct_session=" + token } }, res);
    ok("valid session returns 200 with the exact email and group", res._status === 200 && res._body.ok === true && res._body.email === "employer@example.com" && res._body.group === "group1");
    ok("whoami never sets a cookie", !res._headers["set-cookie"]);
  }

  // -- admin session reports group admin straight from the payload --
  {
    const token = await signHubSession({ sub: "u2", email: "gary@farmceuticawellness.com", group: "admin", iat: now, exp: now + 3600 }, SECRET);
    const res = mockRes();
    await handler({ method: "GET", headers: { cookie: "ct_session=" + token } }, res);
    ok("admin session returns 200 with group admin", res._status === 200 && res._body.group === "admin" && res._body.email === "gary@farmceuticawellness.com");
    ok("admin session sets no cookie", !res._headers["set-cookie"]);
  }

  // -- tampered token: flip a char in the signature --
  {
    const token = await signHubSession({ sub: "u3", email: "worker@example.com", group: "group2", iat: now, exp: now + 3600 }, SECRET);
    const parts = token.split(".");
    const sig = parts[1];
    const flippedChar = sig[0] === "a" ? "b" : "a";
    const tampered = parts[0] + "." + flippedChar + sig.slice(1);
    const res = mockRes();
    await handler({ method: "GET", headers: { cookie: "ct_session=" + tampered } }, res);
    ok("tampered token returns 401", res._status === 401 && res._body.ok === false);
    ok("tampered token sets no cookie", !res._headers["set-cookie"]);
  }

  // -- expired token --
  {
    const token = await signHubSession({ sub: "u4", email: "worker@example.com", group: "group2", iat: now - 7200, exp: now - 3600 }, SECRET);
    const res = mockRes();
    await handler({ method: "GET", headers: { cookie: "ct_session=" + token } }, res);
    ok("expired token returns 401", res._status === 401 && res._body.ok === false);
    ok("expired token sets no cookie", !res._headers["set-cookie"]);
  }

  delete process.env.CONTINUUM_HUB_SESSION_SECRET;
  console.log("\nhub-whoami suite: " + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
}
main();
