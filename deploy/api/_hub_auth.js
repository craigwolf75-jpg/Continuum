/* Continuum Hub email+password auth: Supabase Auth REST helper module.
   Server side only (Vercel Node.js functions), uses the SERVICE ROLE key
   against Supabase Auth's REST endpoints (GoTrue), matching the pattern
   deploy/api/site-access.js uses for PostgREST: plain fetch(), zero SDK
   dependency, service key never sent to the browser.

   HARD WALL vs the SITE gate: this module never reads or writes ct_site or
   CONTINUUM_SITE_SESSION_SECRET; it only prepares data for the ct_session
   cookie issued by deploy/api/hub-signin.js.

   Two network calls:
   - createAuthUser: POST {baseUrl}/auth/v1/admin/users (GoTrue admin API).
     email_confirm: true is set on every create, matching the design's "no
     email confirmation on signup": the approval gate, not email
     confirmation, is what blocks access.
   - verifyPassword: POST {baseUrl}/auth/v1/token?grant_type=password
     (GoTrue's standard password grant; safe to call server side with the
     service role key as apikey, the same endpoint supabase-js calls client
     side, just not exposed to the browser here).

   Fails closed throughout: any missing config, any unexpected shape in a
   GoTrue response, or a network error (DNS failure, connection refused,
   timeout, or anything else fetch or response handling can throw) surfaces
   as a typed { outcome: "error" } result, never a thrown exception the
   caller forgot to catch and never a silent success. createAuthUser and
   verifyPassword each wrap their entire fetch plus response handling in a
   try/catch so a network failure resolves to { outcome: "error" } instead
   of rejecting. No dashes anywhere. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// Pure: validates a sign up body. No I/O.
function validateSignupInput(body) {
  const errors = [];
  const b = body && typeof body === "object" ? body : {};
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";

  if (!email || !EMAIL_RE.test(email)) errors.push("a valid email is required");
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    errors.push("password must be at least " + MIN_PASSWORD_LENGTH + " characters");
  }

  return { ok: errors.length === 0, errors, email, password };
}

// Pure: validates a sign in body. Looser than signup (no minimum length
// check here; a real account could predate a future length bump), so a
// legitimate short password account is never locked out by a stricter sign
// in check than the one it was created under.
function validateSigninInput(body) {
  const errors = [];
  const b = body && typeof body === "object" ? body : {};
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";

  if (!email || !EMAIL_RE.test(email)) errors.push("a valid email is required");
  if (!password) errors.push("password is required");

  return { ok: errors.length === 0, errors, email, password };
}

// Pure: interprets a GoTrue admin create user response. GoTrue's duplicate
// signal is a 422 (or 400 on some versions) whose body carries a message
// mentioning "already registered" / "already exists"; matched case
// insensitively so a GoTrue version skew does not misclassify a duplicate
// as a generic error.
function parseAuthUserResponse(status, body) {
  const b = body && typeof body === "object" ? body : {};
  if (status === 200 || status === 201) {
    if (typeof b.id === "string" && typeof b.email === "string") {
      return { outcome: "created", id: b.id, email: b.email };
    }
    return { outcome: "error", detail: "malformed create user response" };
  }
  const msg = typeof b.msg === "string" ? b.msg : typeof b.message === "string" ? b.message : "";
  if ((status === 422 || status === 400) && /already\s+(?:been\s+)?registered|already exists/i.test(msg)) {
    return { outcome: "duplicate" };
  }
  return { outcome: "error", detail: msg || ("create user failed with status " + status) };
}

// Pure: interprets a GoTrue password grant token response.
function parseTokenResponse(status, body) {
  const b = body && typeof body === "object" ? body : {};
  if (status === 200) {
    const user = b.user && typeof b.user === "object" ? b.user : null;
    if (user && typeof user.id === "string" && typeof user.email === "string") {
      return { outcome: "verified", id: user.id, email: user.email };
    }
    return { outcome: "error", detail: "malformed token response" };
  }
  if (status === 400) {
    return { outcome: "invalid" };
  }
  return { outcome: "error", detail: "token request failed with status " + status };
}

// PENDING CREDS: cannot run without a live Supabase project. Creates a
// Supabase Auth user via the GoTrue admin API. The whole fetch plus
// response handling is inside the try so a network failure (DNS, connection
// refused, timeout) resolves to { outcome: "error" } instead of throwing.
async function createAuthUser(baseUrl, serviceKey, email, password) {
  try {
    const res = await fetch(baseUrl + "/auth/v1/admin/users", {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: "Bearer " + serviceKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password, email_confirm: true })
    });
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    return parseAuthUserResponse(res.status, data);
  } catch (e) {
    return { outcome: "error", detail: e && e.message ? e.message : "network error calling create user" };
  }
}

// PENDING CREDS: cannot run without a live Supabase project. Verifies an
// email/password pair via the GoTrue password grant. The whole fetch plus
// response handling is inside the try so a network failure (DNS, connection
// refused, timeout) resolves to { outcome: "error" } instead of throwing.
async function verifyPassword(baseUrl, serviceKey, email, password) {
  try {
    const res = await fetch(baseUrl + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: {
        apikey: serviceKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    return parseTokenResponse(res.status, data);
  } catch (e) {
    return { outcome: "error", detail: e && e.message ? e.message : "network error calling token endpoint" };
  }
}

export {
  validateSignupInput,
  validateSigninInput,
  parseAuthUserResponse,
  parseTokenResponse,
  createAuthUser,
  verifyPassword,
  MIN_PASSWORD_LENGTH
};
