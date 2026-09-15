/* Continuum Prompt 44 Consent A: recording and scribe. Distinct from Prompt 43 consent B
   (employer view and worker plan, clinical/engine/consent.mjs) and distinct from the
   Prompt 43 clinical.consent.consent_a_granted column (clinical and board consent, migration
   016). Prompt 44 Consent A is the recording and scribe flag the field writing class
   (AI-01, AI-02, AI-03, AI-06) is gated on.

   Counsel owns the words and the version identifier (Section 9). This module holds only the
   flag and the versioning slot. It does not contain visitor facing consent copy. No dashes. */

const active = (consentA) => Boolean(consentA && consentA.granted === true && !consentA.revoked_at);

// Kind name recorded on the versioning slot. Not visitor facing copy.
export const CONSENT_A_KIND = "recording_scribe";

// Counsel owns the version identifier. The engine stores whatever identifier counsel
// assigns; it does not invent one. UNASSIGNED-COUNSEL means the slot exists and is empty.
export const CONSENT_A_VERSION_UNASSIGNED = "UNASSIGNED-COUNSEL";

export const CONSENT_A_VERSIONING = Object.freeze({
  kind: CONSENT_A_KIND,
  version_id: null,
  copy: null,
  copy_owner: "counsel",
});

export function consentAAllowed(consentA) { return active(consentA); }

// Acceptance criterion 7: Consent A declined means the record control is not rendered.
export function recordingControlRendered(consentA) { return active(consentA); }

export function transcriptionAllowed(consentA) { return active(consentA); }

// Capture a grant. version_id is required (counsel assigned). copy is refused: the engine
// never stores visitor facing consent words (human gate, Section 9).
export function recordConsentAGrant(input) {
  const r = input || {};
  if (r.copy) {
    const e = new Error("Consent A wording is owned by counsel. The engine stores the flag and version identifier only (Prompt 44 Section 9).");
    e.code = "CONSENT-A-COPY-FORBIDDEN";
    throw e;
  }
  const version_id = r.version_id == null || String(r.version_id).trim() === ""
    ? CONSENT_A_VERSION_UNASSIGNED
    : String(r.version_id).trim();
  return {
    kind: CONSENT_A_KIND,
    granted: r.granted === true,
    granted_at: r.granted_at || null,
    revoked_at: r.revoked_at || null,
    version_id,
    copy: null,
    copy_owner: "counsel",
  };
}

export function consentAVersionId(consentA) {
  if (!consentA) return CONSENT_A_VERSION_UNASSIGNED;
  const v = consentA.version_id;
  if (v == null || String(v).trim() === "") return CONSENT_A_VERSION_UNASSIGNED;
  return String(v).trim();
}
