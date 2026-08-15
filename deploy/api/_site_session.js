/* Continuum Prompt 40 SITE gate session codec. Edge compatible: Web Crypto
   only (crypto.subtle, globalThis.crypto), no node built ins, so this same
   file runs unmodified in Vercel Edge Middleware and under plain node for
   unit tests.

   HARD WALL vs the Prompt 39 hub gate: this module signs and verifies the
   ct_site cookie only, using CONTINUUM_SITE_SESSION_SECRET only. It never
   reads or writes the hub session cookie or the hub secret. Two sessions,
   no shared secret.

   Token shape: base64url(JSON payload) + "." + base64url(HMAC SHA256 of the
   base64url payload string). Deliberately simple, no header segment, since
   the algorithm and key are fixed by this file, not negotiated per token.

   No dashes anywhere. */

const ALGO = { name: "HMAC", hash: "SHA-256" };

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

// Sign an arbitrary JSON serializable payload. Callers building a new SITE
// session pass { iat, exp } where exp = iat + 30 days in seconds, but this
// function itself does not assume that shape; it just signs whatever it is
// given.
async function signSession(payload, secret) {
  const key = await importHmacKey(secret);
  const payloadB64 = stringToBase64url(JSON.stringify(payload));
  const sigBuf = await getSubtle().sign(ALGO, key, new TextEncoder().encode(payloadB64));
  const sigB64 = bytesToBase64url(new Uint8Array(sigBuf));
  return payloadB64 + "." + sigB64;
}

// Verify a token produced by signSession. Returns the decoded payload when
// the signature matches AND the payload has not expired, otherwise null.
// Fails closed on every error path (malformed token, wrong secret, expired,
// bad JSON): callers only ever see a payload or null, never an exception.
// Signature comparison goes through crypto.subtle.verify, which the Web
// Crypto backend implements as a constant time MAC comparison, rather than
// this file doing its own (weaker) string compare.
async function verifySession(token, secret, nowSec) {
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

// Set-Cookie value for the ct_site session cookie. Own cookie, own name,
// never ct_session (the hub gate's cookie). No Max-Age and no Expires, so it is
// a true session cookie: the browser drops it when it fully closes, and the
// access gate returns on the next browser session (the signed token still
// bounds the maximum lifetime for a browser that preserves session cookies).
function serializeSiteCookie(token) {
  return "ct_site=" + token + "; HttpOnly; Secure; SameSite=Lax; Path=/";
}

// Idle timeout window for the site access session. The middleware re-issues the
// ct_site cookie on every valid request, so an active visitor keeps sliding the
// window forward; SITE_SESSION_TTL_SECONDS with no request lets the token expire
// and the gate returns. One place owns the TTL and the { iat, exp } payload
// shape so the entry endpoint (site-access.js) and the middleware slide can
// never drift.
const SITE_SESSION_TTL_SECONDS = 2 * 60; // 2 minutes idle

// Sign a fresh ct_site token good for one idle window and return its Set-Cookie
// value. Used at first entry (site-access.js) and on every sliding refresh
// (middleware.js).
async function issueSiteCookie(secret, nowSec) {
  const iat = typeof nowSec === "number" ? nowSec : Math.floor(Date.now() / 1000);
  const token = await signSession({ iat, exp: iat + SITE_SESSION_TTL_SECONDS }, secret);
  return serializeSiteCookie(token);
}

// Minimal Cookie header parser. Returns a plain object of name to decoded
// value; never throws on a malformed header.
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

export { signSession, verifySession, serializeSiteCookie, parseCookies, issueSiteCookie, SITE_SESSION_TTL_SECONDS };
