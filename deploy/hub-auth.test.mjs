/* Continuum Hub auth helper suite. node deploy/hub-auth.test.mjs
   Proves the pure validators and response parsers in deploy/api/_hub_auth.js,
   the network calls with a mocked fetch, and the new cookie serialize/clear
   helpers in deploy/api/_hub_session.js. No dashes anywhere. */
import {
  validateSignupInput, validateSigninInput, parseAuthUserResponse, parseTokenResponse,
  createAuthUser, verifyPassword, MIN_PASSWORD_LENGTH
} from "./api/_hub_auth.js";
import { serializeHubCookie, clearHubCookie, HUB_COOKIE_NAME } from "./api/_hub_session.js";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// -- cookie helpers --
ok("serializeHubCookie names the ct_session cookie", serializeHubCookie("tok").startsWith("ct_session=tok;"));
ok("serializeHubCookie is HttpOnly, Secure, SameSite=Lax", /HttpOnly.*Secure.*SameSite=Lax/.test(serializeHubCookie("tok")));
ok("serializeHubCookie is 30 days (Max-Age=2592000)", serializeHubCookie("tok").includes("Max-Age=2592000"));
ok("clearHubCookie empties the value and sets Max-Age=0", clearHubCookie() === "ct_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
ok("clearHubCookie never touches ct_site", !clearHubCookie().includes("ct_site"));
ok("HUB_COOKIE_NAME still ct_session", HUB_COOKIE_NAME === "ct_session");

// -- validateSignupInput --
ok("valid signup input is ok", validateSignupInput({ email: "a@b.com", password: "longenough1" }).ok === true);
ok("missing email is an error", validateSignupInput({ password: "longenough1" }).ok === false);
ok("malformed email is an error", validateSignupInput({ email: "not-an-email", password: "longenough1" }).ok === false);
ok("short password is an error", validateSignupInput({ email: "a@b.com", password: "short" }).ok === false);
ok("MIN_PASSWORD_LENGTH is 8", MIN_PASSWORD_LENGTH === 8);
ok("email is lowercased and trimmed", validateSignupInput({ email: "  A@B.COM  ", password: "longenough1" }).email === "a@b.com");

// -- validateSigninInput (looser: no minimum length) --
ok("valid signin input is ok", validateSigninInput({ email: "a@b.com", password: "x" }).ok === true);
ok("missing password is an error", validateSigninInput({ email: "a@b.com" }).ok === false);
ok("malformed email is an error on signin too", validateSigninInput({ email: "nope", password: "x" }).ok === false);

// -- parseAuthUserResponse --
ok("201 with id and email is created", parseAuthUserResponse(201, { id: "u1", email: "a@b.com" }).outcome === "created");
ok("200 with id and email is created", parseAuthUserResponse(200, { id: "u1", email: "a@b.com" }).outcome === "created");
ok("201 missing id is an error, not a false created", parseAuthUserResponse(201, { email: "a@b.com" }).outcome === "error");
ok("422 already registered is duplicate", parseAuthUserResponse(422, { msg: "Email address already registered" }).outcome === "duplicate");
ok("400 already exists (message casing) is duplicate", parseAuthUserResponse(400, { msg: "User already exists" }).outcome === "duplicate");
ok("422 unrelated message is a plain error, not duplicate", parseAuthUserResponse(422, { msg: "weak password" }).outcome === "error");
ok("500 is an error", parseAuthUserResponse(500, {}).outcome === "error");

// -- parseTokenResponse --
ok("200 with a user is verified", parseTokenResponse(200, { user: { id: "u1", email: "a@b.com" } }).outcome === "verified");
ok("200 missing a user is an error, not a false verify", parseTokenResponse(200, {}).outcome === "error");
ok("400 is invalid credentials", parseTokenResponse(400, { error: "invalid_grant" }).outcome === "invalid");
ok("500 is an error, not invalid (do not mask an outage as a bad password)", parseTokenResponse(500, {}).outcome === "error");

// -- network calls, mocked fetch --
async function withMockFetch(responses, fn) {
  const calls = [];
  const original = globalThis.fetch;
  let i = 0;
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    const r = responses[Math.min(i, responses.length - 1)]; i++;
    return { status: r.status, json: async () => r.body };
  };
  try { await fn(calls); } finally { globalThis.fetch = original; }
}

async function main() {
  await withMockFetch([{ status: 201, body: { id: "u1", email: "a@b.com" } }], async (calls) => {
    const result = await createAuthUser("https://x.supabase.co", "svc-key", "a@b.com", "longenough1");
    ok("createAuthUser hits /auth/v1/admin/users", calls[0].url.includes("/auth/v1/admin/users"));
    ok("createAuthUser sends apikey and Bearer with the service key", calls[0].init.headers.apikey === "svc-key" && calls[0].init.headers.Authorization === "Bearer svc-key");
    ok("createAuthUser sends email_confirm true (no email confirmation flow)", JSON.parse(calls[0].init.body).email_confirm === true);
    ok("createAuthUser returns created", result.outcome === "created" && result.id === "u1");
  });

  await withMockFetch([{ status: 200, body: { user: { id: "u1", email: "a@b.com" } } }], async (calls) => {
    const result = await verifyPassword("https://x.supabase.co", "svc-key", "a@b.com", "pw");
    ok("verifyPassword hits the password grant endpoint", calls[0].url.includes("/auth/v1/token?grant_type=password"));
    ok("verifyPassword sends only apikey, not a Bearer session (no session exists yet)", calls[0].init.headers.apikey === "svc-key" && !calls[0].init.headers.Authorization);
    ok("verifyPassword returns verified", result.outcome === "verified" && result.email === "a@b.com");
  });

  await withMockFetch([{ status: 400, body: { error: "invalid_grant" } }], async () => {
    const result = await verifyPassword("https://x.supabase.co", "svc-key", "a@b.com", "wrong");
    ok("verifyPassword returns invalid on a bad password", result.outcome === "invalid");
  });

  console.log("\nhub-auth suite: " + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
}
main();
