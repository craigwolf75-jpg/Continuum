/* Continuum Prompt 40 ADMIN code view suite. node deploy/site-codes-admin.test.mjs
   Proves the pure logic behind the admin API (deploy/api/site-codes-admin.js)
   and its hub session codec (deploy/api/_hub_session.js): the ct_session
   sign/verify round trip, isAuthorizedAdmin's deny by default behavior,
   deriveCodeStatus's precedence rules, validateCreateInput's field checks,
   isCrossSiteRequest's CSRF guard, and a mocked req/res integration test
   proving the handler itself fails closed (401, zero Supabase calls) when
   ct_session is missing, wrong signature, or expired, for every action.
   Real network calls never happen anywhere in this suite; the fetch stub
   used in the fail-closed section throws if it is ever invoked, so any
   accidental fall-through to a live-network code path fails the test loudly
   rather than silently attempting a real request.

   PENDING CREDS: everything that touches the network in
   deploy/api/site-codes-admin.js (listCodesAndLog, insertAccessCode,
   expireAccessCode, revokeAccessCode, and the handler's SUCCESS path end to
   end once a session passes the guard) cannot run without live
   CONTINUUM_SUPABASE_URL / CONTINUUM_SUPABASE_SERVICE_KEY values and a
   deployed database; none of that is exercised here. What IS proven here is
   that the guard itself never lets a request reach that point.

   PENDING PROMPT 39: the hub LOGIN that issues a real ct_session cookie from
   the shared demo passcode is not built yet. This suite signs its own test
   tokens with signHubSession to exercise verifyHubSession in isolation; it
   does not and cannot prove the real login flow, because that flow does not
   exist yet.

   No dashes anywhere. */
import { signHubSession, verifyHubSession, isAuthorizedAdmin, ADMIN_EMAILS, HUB_COOKIE_NAME } from "./api/_hub_session.js";
import handler, {
  deriveCodeStatus,
  validateCreateInput,
  generateAccessCode,
  isCrossSiteRequest,
  CATEGORIES,
  CODE_ALPHABET
} from "./api/site-codes-admin.js";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

async function main() {
  const SECRET = "hub-test-secret-do-not-use-in-prod";
  const WRONG_SECRET = "a-different-hub-secret-entirely";
  const now = Math.floor(Date.now() / 1000);

  // -- HUB_COOKIE_NAME / ADMIN_EMAILS sanity --
  ok("hub cookie name is ct_session", HUB_COOKIE_NAME === "ct_session");
  ok("hub cookie name is never ct_site", HUB_COOKIE_NAME !== "ct_site");
  ok("ADMIN_EMAILS seeds gary@farmceuticawellness.com", ADMIN_EMAILS.includes("gary@farmceuticawellness.com"));

  // -- sign then verify with the same secret returns the payload --
  const payload = { iat: now, exp: now + 30 * 24 * 60 * 60 };
  const token = await signHubSession(payload, SECRET);
  ok("hub token has exactly two dot separated parts", token.split(".").length === 2);
  const verified = await verifyHubSession(token, SECRET, now);
  ok("valid hub token verifies", verified !== null);
  ok("verified hub payload carries the same exp", verified && verified.exp === payload.exp);

  // -- wrong secret is forged, must fail --
  const forgedCheck = await verifyHubSession(token, WRONG_SECRET, now);
  ok("verify with the wrong hub secret returns null", forgedCheck === null);

  // -- a flipped payload byte is tampered, must fail --
  const [payloadPart, sigPart] = token.split(".");
  const tamperedPayload = String.fromCharCode(payloadPart.charCodeAt(0) + 1) + payloadPart.slice(1);
  const tamperedToken = tamperedPayload + "." + sigPart;
  const tamperedCheck = await verifyHubSession(tamperedToken, SECRET, now);
  ok("verify with a flipped hub payload byte returns null", tamperedCheck === null);

  // -- a flipped signature byte must also fail --
  const tamperedSig = String.fromCharCode(sigPart.charCodeAt(0) + 1) + sigPart.slice(1);
  const tamperedSigToken = payloadPart + "." + tamperedSig;
  const tamperedSigCheck = await verifyHubSession(tamperedSigToken, SECRET, now);
  ok("verify with a flipped hub signature byte returns null", tamperedSigCheck === null);

  // -- an expired token must fail even with the right secret --
  const expiredPayload = { iat: now - 40 * 24 * 60 * 60, exp: now - 10 * 24 * 60 * 60 };
  const expiredToken = await signHubSession(expiredPayload, SECRET);
  const expiredCheck = await verifyHubSession(expiredToken, SECRET, now);
  ok("verify of an expired hub token returns null", expiredCheck === null);

  // -- malformed tokens fail closed rather than throwing --
  ok("empty string hub token returns null", (await verifyHubSession("", SECRET, now)) === null);
  ok("garbage hub token returns null", (await verifyHubSession("not-a-real-token", SECRET, now)) === null);
  ok("null hub token returns null", (await verifyHubSession(null, SECRET, now)) === null);
  ok("three part hub token returns null", (await verifyHubSession("a.b.c", SECRET, now)) === null);

  // -- isAuthorizedAdmin: deny by default behavior --
  ok(
    "a session with no email claim is not authorized (deny by default)",
    isAuthorizedAdmin({ iat: now, exp: now + 100 }) === false
  );
  ok(
    "a session with the allowlisted admin email is authorized",
    isAuthorizedAdmin({ iat: now, exp: now + 100, email: "gary@farmceuticawellness.com" }) === true
  );
  ok(
    "a session with a non allowlisted email is not authorized",
    isAuthorizedAdmin({ iat: now, exp: now + 100, email: "someone-else@x.com" }) === false
  );
  ok("a null session is not authorized", isAuthorizedAdmin(null) === false);
  ok("an undefined session is not authorized", isAuthorizedAdmin(undefined) === false);
  ok(
    "an empty string email is not authorized (deny by default)",
    isAuthorizedAdmin({ iat: now, exp: now + 100, email: "" }) === false
  );
  ok(
    "an empty object with no email claim is not authorized (deny by default)",
    isAuthorizedAdmin({}) === false
  );

  // -- deriveCodeStatus: precedence and each terminal status --
  const nowMs = Date.now();
  ok(
    "an ordinary code with no expiry, no revoke, no cap is active",
    deriveCodeStatus({ expires_at: null, revoked_at: null, max_uses: null, use_count: 0 }, nowMs) === "active"
  );
  ok(
    "a code with a future expiry and room left is active",
    deriveCodeStatus(
      { expires_at: new Date(nowMs + 60_000).toISOString(), revoked_at: null, max_uses: 10, use_count: 3 },
      nowMs
    ) === "active"
  );
  ok(
    "a code with a past expiry is expired",
    deriveCodeStatus(
      { expires_at: new Date(nowMs - 60_000).toISOString(), revoked_at: null, max_uses: null, use_count: 0 },
      nowMs
    ) === "expired"
  );
  ok(
    "a code with revoked_at set is revoked",
    deriveCodeStatus(
      { expires_at: null, revoked_at: new Date(nowMs - 1000).toISOString(), max_uses: null, use_count: 0 },
      nowMs
    ) === "revoked"
  );
  ok(
    "a code at use_count equal to max_uses is exhausted",
    deriveCodeStatus({ expires_at: null, revoked_at: null, max_uses: 5, use_count: 5 }, nowMs) === "exhausted"
  );
  ok(
    "a code with use_count over max_uses is exhausted",
    deriveCodeStatus({ expires_at: null, revoked_at: null, max_uses: 5, use_count: 9 }, nowMs) === "exhausted"
  );
  ok(
    "a code under its usage cap is active, not exhausted",
    deriveCodeStatus({ expires_at: null, revoked_at: null, max_uses: 5, use_count: 4 }, nowMs) === "active"
  );
  ok(
    "revoked takes precedence over an also expired code",
    deriveCodeStatus(
      {
        expires_at: new Date(nowMs - 60_000).toISOString(),
        revoked_at: new Date(nowMs - 1000).toISOString(),
        max_uses: null,
        use_count: 0
      },
      nowMs
    ) === "revoked"
  );
  ok(
    "expired takes precedence over an also exhausted code",
    deriveCodeStatus(
      { expires_at: new Date(nowMs - 60_000).toISOString(), revoked_at: null, max_uses: 5, use_count: 5 },
      nowMs
    ) === "expired"
  );
  ok("a null code is treated as expired rather than throwing", deriveCodeStatus(null, nowMs) === "expired");

  // -- validateCreateInput: field checks --
  ok(
    "missing label is an error",
    validateCreateInput({ category: "prospect" }).ok === false &&
      validateCreateInput({ category: "prospect" }).errors.some((e) => /label/.test(e))
  );
  ok(
    "a blank (whitespace only) label is an error",
    validateCreateInput({ label: "   ", category: "prospect" }).ok === false
  );
  ok(
    "a bad category is an error",
    validateCreateInput({ label: "acme demo", category: "not-a-real-category" }).ok === false &&
      validateCreateInput({ label: "acme demo", category: "not-a-real-category" }).errors.some((e) => /category/.test(e))
  );
  ok(
    "a missing category is an error",
    validateCreateInput({ label: "acme demo" }).ok === false
  );
  ok(
    "a minimal valid create input is ok with no errors",
    validateCreateInput({ label: "acme demo", category: "prospect" }).ok === true &&
      validateCreateInput({ label: "acme demo", category: "prospect" }).errors.length === 0
  );
  ok(
    "every declared category passes validation on its own",
    CATEGORIES.every((c) => validateCreateInput({ label: "x", category: c }).ok === true)
  );
  ok(
    "a valid optional expires_at is ok",
    validateCreateInput({ label: "x", category: "internal", expires_at: new Date().toISOString() }).ok === true
  );
  ok(
    "an unparsable expires_at is an error",
    validateCreateInput({ label: "x", category: "internal", expires_at: "not-a-date" }).ok === false
  );
  ok(
    "a positive integer max_uses is ok",
    validateCreateInput({ label: "x", category: "internal", max_uses: 5 }).ok === true
  );
  ok(
    "a zero max_uses is an error",
    validateCreateInput({ label: "x", category: "internal", max_uses: 0 }).ok === false
  );
  ok(
    "a negative max_uses is an error",
    validateCreateInput({ label: "x", category: "internal", max_uses: -3 }).ok === false
  );
  ok(
    "a non integer max_uses is an error",
    validateCreateInput({ label: "x", category: "internal", max_uses: 2.5 }).ok === false
  );
  ok(
    "omitting expires_at and max_uses entirely is still ok (both optional)",
    validateCreateInput({ label: "x", category: "internal" }).ok === true
  );

  // -- generateAccessCode: shape sanity (not a security proof, just format) --
  const codeA = generateAccessCode();
  const codeB = generateAccessCode();
  ok("generateAccessCode returns a string", typeof codeA === "string");
  ok("generateAccessCode is grouped into 4 blocks of 4", /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(codeA));
  ok("generateAccessCode never uses ambiguous characters 0, O, 1, I, L", !/[0O1IL]/.test(codeA));
  ok("two successive calls to generateAccessCode differ", codeA !== codeB);

  // -- generateAccessCode: rejection sampling correctness (post review fix) --
  // CODE_ALPHABET is 31 characters (0, O, 1, I, L excluded as ambiguous).
  // 256 is not evenly divisible by 31, so a plain "byte % 31" would bias the
  // first 256 % 31 = 8 letters (A through H). generateAccessCode now uses
  // rejection sampling (discard any byte >= 248, the largest multiple of 31
  // that is <= 256) to stay uniform. This suite cannot observe the
  // distribution directly, but it can and does prove every generated code
  // is built only from CODE_ALPHABET characters (nothing outside that set
  // ever leaks through, which a broken modulo or an unrejected byte could
  // otherwise produce) across many draws.
  ok("CODE_ALPHABET is exactly 31 characters", CODE_ALPHABET.length === 31);
  ok(
    "CODE_ALPHABET itself excludes every ambiguous character",
    !/[0O1IL]/.test(CODE_ALPHABET)
  );
  const alphabetCharClass = "[" + CODE_ALPHABET.split("").join("") + "]";
  const manyCodes = Array.from({ length: 500 }, () => generateAccessCode());
  const allCodesOnlyAlphabetChars = manyCodes.every((c) =>
    new RegExp("^(?:" + alphabetCharClass + "|-)+$").test(c) && !/[0O1IL]/.test(c)
  );
  ok("500 generated codes contain only CODE_ALPHABET characters (plus hyphens)", allCodesOnlyAlphabetChars);
  ok(
    "500 generated codes never contain any of 0, O, 1, I, L",
    manyCodes.every((c) => !/[0O1IL]/.test(c))
  );
  ok(
    "500 generated codes are each 19 characters long (16 alphabet chars + 3 hyphens)",
    manyCodes.every((c) => c.length === 19)
  );

  // -- isCrossSiteRequest: the CSRF guard, mirrors deploy/api/site-access.js --
  ok(
    "Sec-Fetch-Site cross-site is rejected",
    isCrossSiteRequest({ headers: { "sec-fetch-site": "cross-site", host: "continuumrtw.com" } }) === true
  );
  ok(
    "Sec-Fetch-Site same-origin is not rejected on that signal alone",
    isCrossSiteRequest({ headers: { "sec-fetch-site": "same-origin", host: "continuumrtw.com" } }) === false
  );
  ok(
    "a mismatched Origin host is rejected",
    isCrossSiteRequest({ headers: { origin: "https://evil.example", host: "continuumrtw.com" } }) === true
  );
  ok(
    "a matching Origin host is not rejected",
    isCrossSiteRequest({ headers: { origin: "https://continuumrtw.com", host: "continuumrtw.com" } }) === false
  );
  ok(
    "an unparsable Origin header fails closed (rejected)",
    isCrossSiteRequest({ headers: { origin: "not a url", host: "continuumrtw.com" } }) === true
  );
  ok(
    "no Origin and no Sec-Fetch-Site signal at all is not rejected on its own",
    isCrossSiteRequest({ headers: { host: "continuumrtw.com" } }) === false
  );
  ok(
    "a missing headers object does not throw and is not rejected",
    isCrossSiteRequest({}) === false
  );

  // -- handler fail closed integration test --
  // Constructs real req/res mocks (no supertest, no HTTP server) and proves
  // the handler itself, not just requireHubAdmin in isolation, returns 401
  // and never reaches a Supabase call, for every action, when ct_session is
  // (a) missing, (b) present but wrong signature, (c) expired. The global
  // fetch stub below throws if it is ever invoked, so any accidental
  // fall-through past the guard fails this test immediately rather than
  // silently attempting a real network call.
  const HUB_SECRET = "hub-integration-test-secret";
  const HUB_WRONG_SECRET = "hub-integration-test-wrong-secret";
  process.env.CONTINUUM_HUB_SESSION_SECRET = HUB_SECRET;

  const guardNow = Math.floor(Date.now() / 1000);
  const forgedSessionToken = await signHubSession({ iat: guardNow, exp: guardNow + 3600 }, HUB_WRONG_SECRET);
  const expiredSessionToken = await signHubSession({ iat: guardNow - 7200, exp: guardNow - 3600 }, HUB_SECRET);

  const guardScenarios = [
    { name: "missing ct_session", cookie: "" },
    { name: "wrong signature ct_session", cookie: "ct_session=" + forgedSessionToken },
    { name: "expired ct_session", cookie: "ct_session=" + expiredSessionToken }
  ];

  const sampleId = "11111111-1111-1111-1111-111111111111";
  function buildRequest(actionName, cookie) {
    const headers = { host: "continuumrtw.com" };
    if (cookie) headers.cookie = cookie;
    if (actionName === "list") {
      return { method: "GET", url: "/api/site-codes-admin?action=list", headers };
    }
    if (actionName === "create") {
      return { method: "POST", url: "/api/site-codes-admin", headers, body: { action: "create", label: "integration test", category: "prospect" } };
    }
    return { method: "POST", url: "/api/site-codes-admin", headers, body: { action: actionName, id: sampleId } };
  }

  function mockRes() {
    const r = { _status: null, _body: null };
    r.status = (code) => { r._status = code; return r; };
    r.json = (body) => { r._body = body; return r; };
    r.setHeader = () => {};
    return r;
  }

  let fetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCalls++;
    throw new Error("fetch must not be called: the hub session guard should fail closed before any Supabase call");
  };

  try {
    for (const scenario of guardScenarios) {
      for (const actionName of ["list", "create", "expire", "revoke"]) {
        fetchCalls = 0;
        const req = buildRequest(actionName, scenario.cookie);
        const res = mockRes();
        await handler(req, res);
        ok(scenario.name + " + " + actionName + " action returns 401", res._status === 401);
        ok(scenario.name + " + " + actionName + " action never reaches a Supabase call", fetchCalls === 0);
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.CONTINUUM_HUB_SESSION_SECRET;
  }

  console.log("\nsite-codes-admin suite: " + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
}

main();
