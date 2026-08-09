/* Continuum Hub signup notification suite. node deploy/hub-notify.test.mjs
   Proves the pure payload builder, the env config reader, and the best effort
   Resend send with a mocked fetch: no op when unconfigured (no network call),
   posts to Resend when configured, and never throws on a non 2xx status or a
   network error. No dashes anywhere. */
import {
  buildSignupNotification, readNotifyConfig, sendSignupNotification, DEFAULT_FROM
} from "./api/_notify.js";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// -- buildSignupNotification, pure --
const built = buildSignupNotification("worker@example.com", "info@continuumrtw.com", "Continuum Hub <no-reply@continuumrtw.com>");
ok("to is an array carrying the recipient", Array.isArray(built.to) && built.to[0] === "info@continuumrtw.com");
ok("from is the provided from", built.from === "Continuum Hub <no-reply@continuumrtw.com>");
ok("subject mentions awaiting approval", /awaiting approval/i.test(built.subject));
ok("text carries the signup email", built.text.includes("worker@example.com"));
ok("text points to the admin approval page", built.text.includes("/admin-hub-users"));
ok("from falls back to DEFAULT_FROM when omitted", buildSignupNotification("a@b.com", "info@continuumrtw.com").from === DEFAULT_FROM);
ok("builder is dash clean", !/[–—]/.test(JSON.stringify(built)));

// -- readNotifyConfig, pure --
ok("configured is false with no api key", readNotifyConfig({ SIGNUP_NOTIFY_TO: "info@continuumrtw.com" }).configured === false);
ok("configured is false with no recipient", readNotifyConfig({ RESEND_API_KEY: "re_x" }).configured === false);
ok("configured is true with both", readNotifyConfig({ RESEND_API_KEY: "re_x", SIGNUP_NOTIFY_TO: "info@continuumrtw.com" }).configured === true);
ok("from defaults to DEFAULT_FROM", readNotifyConfig({ RESEND_API_KEY: "re_x", SIGNUP_NOTIFY_TO: "info@continuumrtw.com" }).from === DEFAULT_FROM);
ok("from honors SIGNUP_NOTIFY_FROM when set", readNotifyConfig({ RESEND_API_KEY: "re_x", SIGNUP_NOTIFY_TO: "info@continuumrtw.com", SIGNUP_NOTIFY_FROM: "x@y.com" }).from === "x@y.com");
ok("empty env is not configured", readNotifyConfig({}).configured === false);

// -- sendSignupNotification, mocked fetch --
async function withMockFetch(impl, fn) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => { calls.push({ url, init }); return impl(url, init); };
  try { await fn(calls); } finally { globalThis.fetch = original; }
}

async function main() {
  // unconfigured: no network call at all
  await withMockFetch(() => { throw new Error("fetch must not be called when unconfigured"); }, async (calls) => {
    const r = await sendSignupNotification("worker@example.com", {});
    ok("unconfigured returns sent false, reason not configured", r.sent === false && r.reason === "not configured");
    ok("unconfigured makes no network call", calls.length === 0);
  });

  // configured + 200: posts to Resend with Bearer auth and the payload
  await withMockFetch((url, init) => ({ status: 200, json: async () => ({ id: "email_1" }) }), async (calls) => {
    const r = await sendSignupNotification("worker@example.com", { RESEND_API_KEY: "re_secret", SIGNUP_NOTIFY_TO: "info@continuumrtw.com" });
    ok("configured send returns sent true", r.sent === true);
    ok("send hits the Resend emails endpoint", calls[0].url === "https://api.resend.com/emails");
    ok("send authorizes with the Resend api key as a Bearer", calls[0].init.headers.Authorization === "Bearer re_secret");
    const body = JSON.parse(calls[0].init.body);
    ok("send addresses the configured recipient", body.to[0] === "info@continuumrtw.com");
    ok("send body carries the signup email", body.text.includes("worker@example.com"));
  });

  // configured + non 2xx: best effort, no throw, sent false
  await withMockFetch(() => ({ status: 422, json: async () => ({ message: "bad" }) }), async () => {
    const r = await sendSignupNotification("worker@example.com", { RESEND_API_KEY: "re_secret", SIGNUP_NOTIFY_TO: "info@continuumrtw.com" });
    ok("a non 2xx status returns sent false and never throws", r.sent === false && /422/.test(r.reason));
  });

  // configured + network error: best effort, no throw, sent false
  await withMockFetch(() => { throw new Error("network down"); }, async () => {
    const r = await sendSignupNotification("worker@example.com", { RESEND_API_KEY: "re_secret", SIGNUP_NOTIFY_TO: "info@continuumrtw.com" });
    ok("a network error returns sent false and never throws", r.sent === false && r.reason === "error");
  });

  console.log("\nhub-notify suite: " + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
}
main();
