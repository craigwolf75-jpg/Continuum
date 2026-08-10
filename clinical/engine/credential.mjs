/* Continuum Prompt 42: the myWCB credential and upload spine (Section 4.2, 6, 7).

   Accreditation conditions this enforces, quoted in Section 0A: the credential is used
   only for submission and retrieval, and is never stored in the application database or a
   log. One leaked submitter credential compromises every clinic on the platform.

   This module fetches the credential from the injected secret store at call time (never
   persisted), redacts it from any output (criterion 8: it appears in no log, no error, no
   response), retries an upload three times with exponential backoff then produces an
   escalation plan, pauses submission only (never clinical work) when the credential is
   unavailable (Section 6), and gates production submission behind a flag that cannot be
   enabled without accreditation status on the clinic (criterion 11).

   Pure and injectable, no real network. No dashes anywhere. */

export const MYWCB_CREDENTIAL_KEYS = ["MYWCB_USERNAME", "MYWCB_PASSWORD"];
export const PRODUCTION_FLAG_KEY = "CONTINUUM_PRODUCTION_SUBMISSION";
export const REDACTED = "[REDACTED]";

// Fetch the credential from the injected secret store (for example process.env) at call
// time. Returns { ok, credential } or { ok:false, reason, missing }. The credential is
// never returned in any structure that is logged; callers pass it only to the uploader.
export function fetchCredential(store, keys = MYWCB_CREDENTIAL_KEYS) {
  const s = store || {};
  const missing = keys.filter((k) => !s[k]);
  if (missing.length) return { ok: false, reason: "credential-unavailable", missing };
  const credential = {};
  for (const k of keys) credential[k] = s[k];
  return { ok: true, credential };
}

// Redact every secret value from a string. Applied to all output before it can reach a
// log, an error, or an API response (criterion 8).
export function redact(text, secrets) {
  let out = String(text === null || text === undefined ? "" : text);
  for (const v of secrets || []) if (v) out = out.split(String(v)).join(REDACTED);
  return out;
}

// A credential fetch failure pauses submission only; clinical work continues unaffected
// (Section 6). This is a typed result, never a throw that would stop the encounter.
export function submissionOnCredentialFailure() {
  return {
    status: "paused", reason: "credential-unavailable", clinicalWorkContinues: true,
    message: "Submission paused: the myWCB credential is unavailable. Clinical work is unaffected.",
  };
}

// Three attempts with exponential backoff (Section 4.2). Returns the attempt count and
// the backoff delays between attempts.
export function retryPlan(attempts = 3, baseMs = 1000) {
  const backoffMs = [];
  for (let i = 0; i < attempts - 1; i++) backoffMs.push(baseMs * Math.pow(2, i));
  return { attempts, backoffMs };
}

// After three failed attempts, notify by three channels and escalate to Continuum support
// after thirty minutes (Section 4.2).
export function escalationPlan() {
  return { notify: ["in_app", "email", "sms"], escalateToSupportAfterMinutes: 30 };
}

// Production submission is disabled by a flag and cannot be enabled without accreditation
// status on the clinic (criterion 11). Default off: both the flag and the clinic's
// accreditation must be set. Testing happens only against the board sample files.
export function productionSubmissionAllowed(clinic, env) {
  const flagOn = (env || {})[PRODUCTION_FLAG_KEY] === "on";
  const accredited = Boolean(clinic && clinic.accreditation_status === "accredited");
  return flagOn && accredited;
}

// Run an upload safely: fetch the credential at call time, retry with backoff, and ensure
// no error or response ever carries the credential. doUpload(credential) performs the one
// authenticated upload; sleep(ms) awaits a backoff (injected so tests do not really wait).
// Returns { status:'uploaded', ... } on success, submissionOnCredentialFailure() when the
// credential is unavailable, or { status:'upload-failed', error, escalation } after all
// attempts, with the credential redacted from every field.
export async function safeUpload({ store, doUpload, keys, attempts = 3, baseMs = 1000, sleep }) {
  const cred = fetchCredential(store, keys);
  if (!cred.ok) return submissionOnCredentialFailure();
  const secrets = Object.values(cred.credential);
  const plan = retryPlan(attempts, baseMs);
  let lastError = "";
  for (let a = 0; a < attempts; a++) {
    try {
      const res = await doUpload(cred.credential);
      return { status: "uploaded", attempt: a + 1, response: redact(JSON.stringify(res || {}), secrets) };
    } catch (e) {
      lastError = redact(e && e.message ? e.message : String(e), secrets);
      if (a < attempts - 1 && typeof sleep === "function") await sleep(plan.backoffMs[a]);
    }
  }
  return { status: "upload-failed", attempts, error: lastError, escalation: escalationPlan() };
}
