/* Continuum Prompt 40 HUB gate session codec. Edge compatible: Web Crypto
   only (crypto.subtle, globalThis.crypto), no node built ins, so this same
   file runs unmodified under plain node for unit tests and in any Vercel
   runtime the Prompt 39 hub login ends up using.

   HARD WALL vs the Prompt 40 SITE gate: this module signs and verifies the
   ct_session cookie only, using CONTINUUM_HUB_SESSION_SECRET only. It never
   reads or writes the site gate's cookie (ct_site) or the site gate's
   secret (CONTINUUM_SITE_SESSION_SECRET). deploy/api/_site_session.js is the
   sibling module for that separate session; the two never share a secret or
   a cookie name.

   The HUB login (deploy/api/hub-signin.js) issues ct_session via
   signHubSession above, then serializeHubCookie below. Approval status and
   access group come from public.hub_profiles (see that file); this module
   stays a pure codec with no knowledge of the approval layer itself.

   Token shape mirrors _site_session.js: base64url(JSON payload) + "." +
   base64url(HMAC SHA256 of the base64url payload string).

   No dashes anywhere. */

const ALGO = { name: "HMAC", hash: "SHA-256" };

// The one and only cookie name this module ever reads or writes. Exported so
// callers never need to hardcode the literal string themselves.
const HUB_COOKIE_NAME = "ct_session";

// Deny by default admin allowlist. The hub now issues a real ct_session
// carrying an actual email claim on every sign in, so isAuthorizedAdmin
// below requires that email to be present in this list; a missing or empty
// email claim is never treated as authorized.
const ADMIN_EMAILS = ["gary@farmceuticawellness.com"];

function getSubtle() {
  const c = globalThis.crypto;
  if (!c || !c.subtle) {
    throw new Error("Web Crypto (globalThis.crypto.subtle) is not available in this runtime.");
  }
  return c.subtle;
}

async function importHmacKey(secret) {
  if (!secret || typeof secret !== "string") {
    throw new Error("A non empty secret string is required.");
  }
  const subtle = getSubtle();
  const keyBytes = new TextEncoder().encode(secret);
  return subtle.importKey("raw", keyBytes, ALGO, false, ["sign", "verify"]);
}

function bytesToBase64url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBytes(b64url) {
  let b64 = String(b64url).replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function stringToBase64url(str) {
  return bytesToBase64url(new TextEncoder().encode(str));
}

function base64urlToString(b64url) {
  return new TextDecoder().decode(base64urlToBytes(b64url));
}

// Sign an arbitrary JSON serializable payload. The eventual Prompt 39 login
// is expected to pass { iat, exp } (issued at / expires, epoch seconds),
// mirroring the SITE session shape, but this function itself does not
// assume that; it just signs whatever it is given. Kept here (rather than
// left unbuilt) so this file's own round trip is unit testable now, ahead
// of the real login existing.
async function signHubSession(payload, secret) {
  const key = await importHmacKey(secret);
  const payloadB64 = stringToBase64url(JSON.stringify(payload));
  const sigBuf = await getSubtle().sign(ALGO, key, new TextEncoder().encode(payloadB64));
  const sigB64 = bytesToBase64url(new Uint8Array(sigBuf));
  return payloadB64 + "." + sigB64;
}

// Verify a token produced by signHubSession, or by the eventual Prompt 39
// login (as long as it uses this same codec). Returns the decoded payload
// when the signature matches AND the payload has not expired, otherwise
// null. Fails closed on every error path (malformed token, wrong secret,
// expired, bad JSON): callers only ever see a payload or null, never an
// exception.
async function verifyHubSession(token, secret, nowSec) {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadB64, sigB64] = parts;
    if (!payloadB64 || !sigB64) return null;

    const key = await importHmacKey(secret);
    const sigBytes = base64urlToBytes(sigB64);
    const dataBytes = new TextEncoder().encode(payloadB64);
    const valid = await getSubtle().verify(ALGO, key, sigBytes, dataBytes);
    if (!valid) return null;

    const payload = JSON.parse(base64urlToString(payloadB64));
    const now = typeof nowSec === "number" ? nowSec : Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || now >= payload.exp) return null;

    return payload;
  } catch (e) {
    // any parse error, decode error, or crypto error fails closed to null
    return null;
  }
}

// Minimal Cookie header parser. Returns a plain object of name to decoded
// value; never throws on a malformed header. Duplicated from
// _site_session.js on purpose rather than shared, so the two session
// modules stay fully independent files with no import between them; that
// keeps the hard wall visible at a glance in either file alone.
function parseCookies(header) {
  const out = {};
  if (!header || typeof header !== "string") return out;
  const parts = header.split(";");
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    if (!name) continue;
    const rawValue = part.slice(eq + 1).trim();
    try {
      out[name] = decodeURIComponent(rawValue);
    } catch (e) {
      out[name] = rawValue;
    }
  }
  return out;
}

// Authorization check for the Prompt 40 admin surface, layered on top of
// "does this request carry a valid ct_session at all" (that check happens
// separately, in deploy/api/site-codes-admin.js's requireHubAdmin, using
// verifyHubSession above).
//
// Deny by default: a session is authorized only when it is an object, its
// email claim is a non empty string, AND that email is in ADMIN_EMAILS. A
// missing session, a session with no email claim, or an empty email claim
// is never authorized.
function isAuthorizedAdmin(session) {
  if (!session || typeof session !== "object") return false;
  if (typeof session.email !== "string" || session.email.length === 0) return false;
  return ADMIN_EMAILS.includes(session.email);
}

// Set-Cookie value for the ct_session hub cookie. Own cookie, own name,
// never ct_site (the site gate's cookie). 7 day Max-Age (final review, I2:
// aligned to the hub-signin.js SESSION_TTL_SECONDS token expiry, shortened
// from 30 days), independent of deploy/api/_site_session.js's
// serializeSiteCookie, which keeps its own 30 day Max-Age unchanged.
function serializeHubCookie(token) {
  return "ct_session=" + token + "; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800";
}

// Clears the ct_session cookie on sign out (Max-Age=0 expires it immediately).
function clearHubCookie() {
  return "ct_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";
}

export { signHubSession, verifyHubSession, parseCookies, HUB_COOKIE_NAME, ADMIN_EMAILS, isAuthorizedAdmin, serializeHubCookie, clearHubCookie };
