/* Continuum Prompt 43: consent B and revocation (Section 6, criteria 6 and 7).

   Consent B gates the employer view and the worker plan ONLY under the Alberta
   statutory report profile. Board submission is profile data: statutory duty,
   requires consent, or blocked. It never gates the Pink Copy: the Pink Copy is
   the worker's own copy, unaffected by consent B (Section 5, Section 6).

   Revocation withdraws the employer view within 60 seconds and writes withdrawn_at
   (criterion 6). The notice shown to the worker states plainly that information already
   lawfully disclosed to the employer cannot be recalled. It must not imply otherwise.

   Pure functions, no database. The original published set is never mutated on revocation.
   No dashes anywhere. */

export const REVOCATION_SLA_SECONDS = 60;

const active = (consentB) => Boolean(consentB && consentB.granted === true && !consentB.revoked_at);

// The employer view exists only while consent B is active (Section 5, Section 6).
export function employerViewAllowed(consentB) { return active(consentB); }

// The worker plan is gated by consent B as well (Section 6: consent B gates the employer
// view AND the worker plan).
export function workerPlanAllowed(consentB) { return active(consentB); }

// Board submission depends on the jurisdiction consent profile, never on a
// hard coded province. alberta_statutory_report: statutory duty, always allowed.
// requires_consent: gated by consent B. blocked: never allowed.
export function boardSubmissionAllowed(consentB, consentProfile) {
  const mode = consentProfile && consentProfile.board_submission;
  if (!mode) {
    const e = new Error("boardSubmissionAllowed requires an explicit consent profile. Never default.");
    e.code = "CONSENT-PROFILE-MISSING";
    throw e;
  }
  if (mode === "statutory") return true;
  if (mode === "blocked") return false;
  if (mode === "requires_consent") return Boolean(consentB && consentB.granted === true && !consentB.revoked_at);
  const e = new Error("Unknown consent profile board_submission mode: " + mode);
  e.code = "CONSENT-PROFILE-UNKNOWN";
  throw e;
}

// The Pink Copy is NEVER gated by consent B (Section 5, Section 6): it is the worker's own
// copy. Always available once the report is complete.
export function pinkCopyAllowed() { return true; }

// The plain notice the interface must show on revocation. It withdraws FUTURE access and
// states that what was already lawfully disclosed cannot be recalled. It must not imply
// that a recall is possible (Section 6).
export function revocationNotice() {
  return "Future employer access is withdrawn. Information already lawfully disclosed to the employer cannot be recalled.";
}

// Revoke consent B: withdraw the employer view and stamp withdrawn_at. The original
// published set is not mutated; a new withdrawn view is returned. The board submission
// and the Pink Copy are unaffected.
export function revokeConsentB(publishedSet, atIso) {
  return {
    employer_view: { ...(publishedSet || {}), withdrawn_at: atIso, access: "withdrawn" },
    employer_view_allowed: false,
    board_submission_unaffected: true,
    pink_copy_unaffected: true,
    notice: revocationNotice(),
  };
}

// The revocation SLA (criterion 6): the employer view must be removed within 60 seconds
// of the revoke request. Checks the elapsed seconds between the request and the access
// removal, both in milliseconds.
export function withinRevocationSla(revokeRequestedMs, accessRemovedMs) {
  return (Number(accessRemovedMs) - Number(revokeRequestedMs)) / 1000 <= REVOCATION_SLA_SECONDS;
}
