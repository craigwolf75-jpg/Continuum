/* Continuum Prompt 42 credential and upload suite. Proves the credential is fetched from
   the store at call time, never appears in any output (criterion 8, verified by grepping
   the whole cycle), that a credential fetch failure pauses submission only while clinical
   work continues (Section 6), the three attempt backoff and escalation (Section 4.2), and
   that production submission is disabled by a flag and needs accreditation (criterion 11).
   No dashes anywhere. */

import {
  fetchCredential, redact, submissionOnCredentialFailure, retryPlan, escalationPlan,
  productionSubmissionAllowed, safeUpload, MYWCB_CREDENTIAL_KEYS, PRODUCTION_FLAG_KEY, REDACTED,
} from "./credential.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const SECRET_PW = "s3cr3t-P@ss-9931";
const store = { MYWCB_USERNAME: "submitter001", MYWCB_PASSWORD: SECRET_PW };

// -- fetch from the store at call time ------------------------------------------------
ok("fetchCredential returns the credential when the store has it", (() => { const c = fetchCredential(store); return c.ok && c.credential.MYWCB_PASSWORD === SECRET_PW; })());
ok("fetchCredential reports what is missing without a value", (() => { const c = fetchCredential({ MYWCB_USERNAME: "x" }); return !c.ok && c.missing.includes("MYWCB_PASSWORD"); })());
ok("the credential keys are the myWCB username and password", MYWCB_CREDENTIAL_KEYS.join() === "MYWCB_USERNAME,MYWCB_PASSWORD");

// -- redaction ------------------------------------------------------------------------
ok("redact scrubs a secret from a string", redact("login failed for submitter001 with " + SECRET_PW, [SECRET_PW]) === "login failed for submitter001 with " + REDACTED);
ok("redact handles multiple occurrences", redact(SECRET_PW + " and again " + SECRET_PW, [SECRET_PW]) === REDACTED + " and again " + REDACTED);
ok("redact leaves clean text untouched", redact("no secret here", [SECRET_PW]) === "no secret here");

// -- credential failure pauses submission only (Section 6) ----------------------------
ok("a credential failure pauses submission and keeps clinical work running", (() => { const r = submissionOnCredentialFailure(); return r.status === "paused" && r.clinicalWorkContinues === true; })());

// -- retry and escalation (Section 4.2) -----------------------------------------------
ok("the retry plan is three attempts with exponential backoff", (() => { const p = retryPlan(); return p.attempts === 3 && p.backoffMs.join() === "1000,2000"; })());
ok("the escalation plan is three channels and a thirty minute support escalation", (() => { const e = escalationPlan(); return e.notify.join() === "in_app,email,sms" && e.escalateToSupportAfterMinutes === 30; })());

// -- production submission gate (criterion 11) ----------------------------------------
const accredited = { accreditation_status: "accredited" };
const notYet = { accreditation_status: "pending" };
ok("production submission is off by default", productionSubmissionAllowed(accredited, {}) === false);
ok("production submission stays off without accreditation even with the flag on", productionSubmissionAllowed(notYet, { [PRODUCTION_FLAG_KEY]: "on" }) === false);
ok("production submission stays off with accreditation but no flag", productionSubmissionAllowed(accredited, {}) === false);
ok("production submission is allowed only with both the flag and accreditation", productionSubmissionAllowed(accredited, { [PRODUCTION_FLAG_KEY]: "on" }) === true);

// -- safeUpload: success, failure, and the criterion 8 grep ---------------------------
const noSleep = async () => {};

const success = await safeUpload({ store, doUpload: async () => ({ receipt: "ok" }), sleep: noSleep });
ok("safeUpload succeeds and returns a redacted response", success.status === "uploaded" && !success.response.includes(SECRET_PW));

const missing = await safeUpload({ store: {}, doUpload: async () => ({}), sleep: noSleep });
ok("safeUpload with no credential pauses submission (clinical work continues)", missing.status === "paused" && missing.clinicalWorkContinues === true);

// doUpload that throws an error CONTAINING the credential every time
let attempts = 0;
const leaky = await safeUpload({
  store,
  doUpload: async (cred) => { attempts++; throw new Error("HTTP 401 rejected user submitter001 password " + cred.MYWCB_PASSWORD); },
  sleep: noSleep,
});
ok("safeUpload fails after three attempts", attempts === 3 && leaky.status === "upload-failed");
ok("the failure carries an escalation plan", leaky.escalation && leaky.escalation.notify.length === 3);
ok("criterion 8: the credential is redacted from the error", leaky.error.includes(REDACTED) && !leaky.error.includes(SECRET_PW));

// criterion 8: grep the WHOLE cycle output for the credential, expect zero hits
ok("criterion 8: the credential appears in no output across a full cycle", (() => {
  const allOutput = JSON.stringify([success, missing, leaky, submissionOnCredentialFailure(), escalationPlan()]);
  return !allOutput.includes(SECRET_PW);
})());

console.log("\ncredential suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
