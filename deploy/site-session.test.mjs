/* Continuum Prompt 40 site session suite. node deploy/site-session.test.mjs
   Proves the ct_site cookie codec (deploy/api/_site_session.js): sign then
   verify round trips, a wrong secret is rejected as forged, a flipped
   payload byte is rejected as tampered, an expired token is rejected, and
   the Set-Cookie serialization carries the required attributes.
   PENDING CREDS: this proves the pure Web Crypto logic only. Running inside
   an actual Vercel Edge runtime is untested; this module never touches
   Supabase, so there is nothing else here that needs live creds.
   No dashes anywhere. */
import { signSession, verifySession, serializeSiteCookie, parseCookies } from "./api/_site_session.js";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const SECRET = "test-secret-do-not-use-in-prod";
const WRONG_SECRET = "a-different-secret-entirely";

async function main() {
  const now = Math.floor(Date.now() / 1000);
  const payload = { iat: now, exp: now + 30 * 24 * 60 * 60 };

  // -- sign then verify with the same secret returns the payload --
  const token = await signSession(payload, SECRET);
  ok("token has exactly two dot separated parts", token.split(".").length === 2);
  const verified = await verifySession(token, SECRET, now);
  ok("valid token verifies", verified !== null);
  ok("verified payload carries the same iat", verified && verified.iat === payload.iat);
  ok("verified payload carries the same exp", verified && verified.exp === payload.exp);

  // -- wrong secret is forged, must fail --
  const forgedCheck = await verifySession(token, WRONG_SECRET, now);
  ok("verify with the wrong secret returns null", forgedCheck === null);

  // -- a flipped payload byte is tampered, must fail --
  const [payloadPart, sigPart] = token.split(".");
  const tamperedPayload = String.fromCharCode(payloadPart.charCodeAt(0) + 1) + payloadPart.slice(1);
  const tamperedToken = tamperedPayload + "." + sigPart;
  const tamperedCheck = await verifySession(tamperedToken, SECRET, now);
  ok("verify with a flipped payload byte returns null", tamperedCheck === null);

  // -- a flipped signature byte must also fail --
  const tamperedSig = String.fromCharCode(sigPart.charCodeAt(0) + 1) + sigPart.slice(1);
  const tamperedSigToken = payloadPart + "." + tamperedSig;
  const tamperedSigCheck = await verifySession(tamperedSigToken, SECRET, now);
  ok("verify with a flipped signature byte returns null", tamperedSigCheck === null);

  // -- an expired token must fail even with the right secret --
  const expiredPayload = { iat: now - 40 * 24 * 60 * 60, exp: now - 10 * 24 * 60 * 60 };
  const expiredToken = await signSession(expiredPayload, SECRET);
  const expiredCheck = await verifySession(expiredToken, SECRET, now);
  ok("verify of an expired token returns null", expiredCheck === null);

  // -- a token still valid one second before expiry verifies --
  const almostExpiredPayload = { iat: now - 100, exp: now + 1 };
  const almostExpiredToken = await signSession(almostExpiredPayload, SECRET);
  const almostExpiredCheck = await verifySession(almostExpiredToken, SECRET, now);
  ok("a token one second from expiry still verifies", almostExpiredCheck !== null);

  // -- malformed tokens fail closed rather than throwing --
  ok("empty string token returns null", (await verifySession("", SECRET, now)) === null);
  ok("garbage token returns null", (await verifySession("not-a-real-token", SECRET, now)) === null);
  ok("null token returns null", (await verifySession(null, SECRET, now)) === null);
  ok("undefined token returns null", (await verifySession(undefined, SECRET, now)) === null);
  ok("three part token returns null", (await verifySession("a.b.c", SECRET, now)) === null);

  // -- cookie serialization carries the required attributes --
  const cookie = serializeSiteCookie(token);
  ok("cookie sets ct_site to the token", cookie.indexOf("ct_site=" + token) === 0);
  ok("cookie is HttpOnly", cookie.includes("HttpOnly"));
  ok("cookie is Secure", cookie.includes("Secure"));
  ok("cookie is SameSite=Lax", cookie.includes("SameSite=Lax"));
  ok("cookie Path is /", cookie.includes("Path=/"));
  ok("cookie Max-Age is 2592000 (30 days)", cookie.includes("Max-Age=2592000"));
  ok("cookie never names ct_session", !cookie.includes("ct_session"));

  // -- cookie header parsing --
  const parsed = parseCookies("ct_site=" + token + "; other=1");
  ok("parseCookies reads ct_site", parsed.ct_site === token);
  ok("parseCookies reads other cookies present alongside it", parsed.other === "1");
  ok("parseCookies on an empty header returns an empty object", Object.keys(parseCookies("")).length === 0);
  ok("parseCookies on a null header returns an empty object", Object.keys(parseCookies(null)).length === 0);
  ok("parseCookies does not invent a ct_session entry", parsed.ct_session === undefined);

  console.log("\nsite-session suite: " + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
}

main();
