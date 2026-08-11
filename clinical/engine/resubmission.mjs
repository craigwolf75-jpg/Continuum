/* Continuum Prompt 42: resubmission (Section 5).

   A resubmission is a NEW wcb_submission row with attempt + 1. The original is never
   mutated (Section 5, and the immutability the accreditation condition in Section 0A.1
   requires: a Submitter will not alter original data unless authorised in a way an audit
   can substantiate).

   The open question this must NOT resolve in code (Section 5, Section 9 item 3): whether
   a board rejection requires a new practitioner signature. The recommended position,
   pending Craig and counsel, is implemented here, made configurable, and flagged as
   provisional:
     - an administrative field correction resubmits under the ORIGINAL signature, with an
       audit record of the authorised alteration;
     - any clinical field change requires a new report and a new signature, so the
       resubmission is blocked until it is re signed.

   This module does not decide how a corrected payload's snapshot_hash relates to the
   original signature (whether an administrative correction re snapshots under the
   original signature or carries the original hash): that is part of the same open
   question and is left to the signature routine and counsel. Pure functions, no
   database. No dashes anywhere. */

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();

// The recommended position, pending Craig and counsel. provisional flags that it is not
// settled; both arms are configurable via resubmit opts.
export const SIGNATURE_POLICY = {
  administrative: "original-signature",
  clinical: "new-signature-required",
  provisional: true,
};

// Classify a resubmission by the fields it changes. Any changed field in the clinical set
// makes it a clinical change; otherwise it is administrative. The clinical field set is
// injected (configuration), never hard coded.
export function classifyChange(changedFields, clinicalFields) {
  const clinical = clinicalFields instanceof Set ? clinicalFields : new Set((clinicalFields || []).map(norm));
  const changed = (changedFields || []).map(norm).filter(Boolean);
  const clinicalHits = changed.filter((f) => clinical.has(f));
  return { classification: clinicalHits.length ? "clinical" : "administrative", clinicalFields: clinicalHits };
}

// Whether the resubmission requires a new signature under the (configurable) policy.
export function requiresNewSignature(changedFields, opts = {}) {
  const c = classifyChange(changedFields, opts.clinicalFields);
  const policy = opts.policy || SIGNATURE_POLICY;
  const arm = c.classification === "clinical" ? policy.clinical : policy.administrative;
  return arm === "new-signature-required";
}

// Build a resubmission: a NEW submission row with attempt + 1, linked to the original. The
// original object is never mutated (a fresh object is returned). An administrative
// correction resubmits under the original signature with an alteration audit; a clinical
// change is blocked pending a new signature and names the offending fields.
export function resubmit(original, correction = {}, opts = {}) {
  const changedFields = correction.changedFields || [];
  const cls = classifyChange(changedFields, opts.clinicalFields);
  const newSig = requiresNewSignature(changedFields, opts);
  const attempt = Number(original.attempt || 1) + 1;

  const base = {
    case_id: original.case_id,
    report_id: original.report_id,
    form_id: original.form_id,
    previous_submission_id: original.submission_id || original.id || null,
    attempt,
    classification: cls.classification,
    changed_fields: changedFields.slice(),
    // FLAG (Section 9 item 3): the signature policy is the recommended position, not settled.
    signature_policy_provisional: true,
  };

  if (newSig) {
    return {
      ...base,
      status: "awaiting-new-signature",
      blocked: true,
      signature_basis: "new-signature-required",
      reason: cls.classification === "clinical"
        ? "A clinical field changed (" + cls.clinicalFields.join(", ") + "); a new report and a new practitioner signature are required before resubmission."
        : "A new signature is required by the configured policy before resubmission.",
    };
  }

  // Administrative correction: resubmit under the original signature, with an audit of the
  // authorised alteration (accreditation condition 0A.1).
  return {
    ...base,
    status: "ready",
    blocked: false,
    signature_basis: "original-signature",
    signed_by: original.signed_by || null,
    signed_at: original.signed_at || null,
    alteration_audit: {
      original_submission_id: original.submission_id || original.id || null,
      changed_fields: changedFields.slice(),
      corrected_by: correction.correctedBy || null,
      authorized_by: original.signed_by || null,
      reason: correction.reason || "administrative field correction",
    },
  };
}

// Guarantee the original submission was not mutated by resubmit (Section 5, Section 7).
export function originalUnmutated(before, after) {
  return JSON.stringify(before) === JSON.stringify(after);
}
