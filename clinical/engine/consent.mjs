/* Continuum Prompt 43: consent B and revocation (Section 6, criteria 6 and 7).

   Consent B gates the employer view and the worker plan ONLY under a disclosure
   channel that requires it. Employer view publish also honors the disclosure
   profile employer_channel (ARGUS-PRIV-010). Board submission is profile data:
   statutory duty, requires consent, or blocked. It never gates the Pink Copy:
   the Pink Copy is the worker's own copy, unaffected by consent B (Section 5,
   Section 6).

   Revocation withdraws the employer view within 60 seconds and writes withdrawn_at
   (criterion 6). The notice shown to the worker states plainly that information already
   lawfully disclosed to the employer cannot be recalled. It must not imply otherwise.

   Pure functions, no database. The original published set is never mutated on revocation.
   No dashes anywhere. */

export const REVOCATION_SLA_SECONDS = 60;

const active = (consentB) => Boolean(consentB && consentB.granted === true && !consentB.revoked_at);

const CHANNEL_REFUSED = new Set(["none", "blocked"]);
const CHANNEL_REQUIRES_CONSENT_B = new Set(["worker_handoff", "requires_consent_b"]);
const CHANNEL_OPEN = new Set(["open"]);

// Consent B only. The worker plan and AI consent B checks use this. Employer
// view publish must call employerPublishAllowed so the disclosure channel is
// enforced. This function is not the publish gate.
export function employerViewAllowed(consentB) { return active(consentB); }

function requireDisclosureChannel(disclosureProfile) {
  const channel = disclosureProfile && disclosureProfile.employer_channel;
  if (!channel) {
    const e = new Error("employerPublishAllowed requires an explicit disclosure profile. Never default.");
    e.code = "DISCLOSURE-PROFILE-MISSING";
    throw e;
  }
  return channel;
}

// Employer view publish: disclosure channel AND consent rules. Never defaults
// to Alberta. Missing or unknown channel fails named.
// none or blocked: refuse even when consent B is granted.
// worker_handoff or requires_consent_b: consent B must be active.
// open: no consent B required (explicit channel only).
export function employerPublishAllowed(consentB, disclosureProfile) {
  const channel = requireDisclosureChannel(disclosureProfile);
  if (CHANNEL_REFUSED.has(channel)) return false;
  if (CHANNEL_REQUIRES_CONSENT_B.has(channel)) return active(consentB);
  if (CHANNEL_OPEN.has(channel)) return true;
  const e = new Error("Unknown disclosure profile employer_channel: " + channel);
  e.code = "DISCLOSURE-PROFILE-UNKNOWN";
  throw e;
}

export function employerPublishDeniedReason(consentB, disclosureProfile) {
  const channel = requireDisclosureChannel(disclosureProfile);
  if (CHANNEL_REFUSED.has(channel)) return "employer-channel-blocked";
  if (CHANNEL_REQUIRES_CONSENT_B.has(channel) && !active(consentB)) return "consent-b-required";
  return null;
}

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
