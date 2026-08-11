/* Continuum Prompt 42 resubmission suite (Section 5, criterion 10). Proves a
   resubmission is a new row with attempt plus one, the original is never mutated, an
   administrative correction resubmits under the original signature with an alteration
   audit, a clinical change is blocked pending a new signature, and the signature policy
   is configurable and flagged provisional. No dashes anywhere. */

import {
  SIGNATURE_POLICY, classifyChange, requiresNewSignature, resubmit, originalUnmutated,
} from "./resubmission.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const CLINICAL = ["RTWPATIENTSITTINGCAPABILITY", "RTWPATIENTLIFTINGMAXOF", "diagnosis"];
const original = {
  submission_id: "sub-1", case_id: "c1", report_id: "r1", form_id: "C050E",
  attempt: 1, status: "rejected", signed_by: "prac-1", signed_at: "2026-08-01T10:00:00Z",
};

// -- classification -------------------------------------------------------------------
ok("only administrative fields classify as administrative", classifyChange(["claim_number", "employer_name"], CLINICAL).classification === "administrative");
ok("any clinical field classifies as clinical and is named", (() => {
  const c = classifyChange(["employer_name", "RTWPATIENTSITTINGCAPABILITY"], CLINICAL);
  return c.classification === "clinical" && c.clinicalFields.includes("RTWPATIENTSITTINGCAPABILITY");
})());
ok("the clinical field set is injected, not hard coded", classifyChange(["custom_field"], ["custom_field"]).classification === "clinical");

// -- signature requirement (recommended policy) ---------------------------------------
ok("an administrative change does not require a new signature", requiresNewSignature(["claim_number"], { clinicalFields: CLINICAL }) === false);
ok("a clinical change requires a new signature", requiresNewSignature(["diagnosis"], { clinicalFields: CLINICAL }) === true);
ok("the policy is configurable (administrative can require a new signature too)", requiresNewSignature(["claim_number"], { clinicalFields: CLINICAL, policy: { administrative: "new-signature-required", clinical: "new-signature-required" } }) === true);
ok("the recommended policy is flagged provisional", SIGNATURE_POLICY.provisional === true);

// -- administrative resubmission: original signature + audit --------------------------
const admin = resubmit(original, { changedFields: ["claim_number"], correctedBy: "admin-1", reason: "claim number typo" }, { clinicalFields: CLINICAL });
ok("an administrative resubmission is attempt plus one", admin.attempt === 2);
ok("it links to the original submission", admin.previous_submission_id === "sub-1");
ok("it is ready and resubmits under the original signature", admin.status === "ready" && !admin.blocked && admin.signature_basis === "original-signature" && admin.signed_by === "prac-1");
ok("it carries an alteration audit authorised by the original signer", admin.alteration_audit && admin.alteration_audit.authorized_by === "prac-1" && admin.alteration_audit.corrected_by === "admin-1" && admin.alteration_audit.changed_fields.includes("claim_number"));
ok("the signature policy is flagged provisional on the row", admin.signature_policy_provisional === true);

// -- clinical resubmission: blocked pending a new signature ---------------------------
const clinical = resubmit(original, { changedFields: ["RTWPATIENTLIFTINGMAXOF"] }, { clinicalFields: CLINICAL });
ok("a clinical resubmission is attempt plus one", clinical.attempt === 2);
ok("it is blocked awaiting a new signature", clinical.status === "awaiting-new-signature" && clinical.blocked === true && clinical.signature_basis === "new-signature-required");
ok("it names the clinical field that forces a new signature", clinical.reason.includes("RTWPATIENTLIFTINGMAXOF"));
ok("a blocked clinical resubmission has no original signature basis and no audit", !clinical.signed_by && !clinical.alteration_audit);

// -- criterion 10: the original is never mutated --------------------------------------
ok("criterion 10: the original submission is untouched after a resubmission", (() => {
  const before = JSON.parse(JSON.stringify(original));
  resubmit(original, { changedFields: ["claim_number"] }, { clinicalFields: CLINICAL });
  resubmit(original, { changedFields: ["diagnosis"] }, { clinicalFields: CLINICAL });
  return originalUnmutated(before, original);
})());
ok("the resubmission is a distinct new row, not the original object", admin !== original && admin.submission_id === undefined);

// -- attempt increments from whatever the original attempt was ------------------------
ok("attempt increments from the original attempt (not a fixed 2)", resubmit({ ...original, attempt: 4 }, { changedFields: ["claim_number"] }, { clinicalFields: CLINICAL }).attempt === 5);

console.log("\nresubmission suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
