/* Continuum sign_measurement suite (Prompt 39 Section 3.4, Prompt 42 Section 2.1). Proves
   the signature routine derives bands, emits board codes, and takes a deterministic
   snapshot_hash, blocks server side on an unassessed axis / inactive practitioner / graded
   able-or-unable-only axis, never authors a capability, and never mutates the draft.
   No dashes anywhere. */

import {
  signMeasurement, signatureBlockers, canonicalPayload, snapshotHash, provenanceAudit,
} from "./sign_measurement.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const report = { id: "rep-1", form_id: "C050S", version: 2 };
const practitioner = { id: "prac-1", billing_number: "A2145", active: true };
const axes = [
  { axis: "walking", answered: true, capability: "able", quantity_kind: "hours", code_set: "extended", code_list_name: "Extended Work Restriction Codes", source: "measured", provenance: "human" },
  { axis: "sitting", answered: true, capability: "limited", quantity_kind: "hours", code_set: "extended", code_list_name: "Extended Work Restriction Codes", measured_hours: 4, source: "measured", provenance: "human" },
  { axis: "lifting_floor_to_waist", answered: true, capability: "limited", quantity_kind: "weight", code_set: "weight", code_list_name: "Weight Category Codes", measured_weight_kg: 8, source: "measured", provenance: "human" },
  { axis: "overhead_reaching", answered: false, skipped: true, skip_reason: "not relevant", quantity_kind: "none", code_set: "able_unable_only" },
];

// -- a complete measurement signs -----------------------------------------------------
const signed = signMeasurement({ report, practitioner, axisValues: axes }, { signedAt: "2026-08-10T12:00:00Z" });
ok("a complete measurement signs", signed.signed === true && signed.blocked === false);
ok("the report update sets status signed, signed_at and a 64 hex snapshot_hash", signed.report_update.status === "signed" && signed.report_update.signed_at === "2026-08-10T12:00:00Z" && /^[0-9a-f]{64}$/.test(signed.report_update.snapshot_hash));

// -- band derivation at signature (Prompt 39) -----------------------------------------
const lift = signed.axis_value_rows.find((r) => r.axis === "lifting_floor_to_waist");
ok("a measured 8 kg weight axis derives the LIMITED band and rounds down", lift.derived_band === "LIMITED" && lift.rounded_down === true);
ok("the weight axis emits its band as the board code", lift.derived_capability_code === "LIMITED");
ok("a limited hours axis on the Extended list emits LIMITEDTO", signed.axis_value_rows.find((r) => r.axis === "sitting").derived_capability_code === "LIMITEDTO");
ok("an able axis emits ABLE", signed.axis_value_rows.find((r) => r.axis === "walking").derived_capability_code === "ABLE");
ok("a skipped axis carries no capability and no band", (() => { const s = signed.axis_value_rows.find((r) => r.axis === "overhead_reaching"); return s.skipped && s.capability === null && s.derived_band === null; })());

// -- the band derivation audit records the emitted band (Prompt 39 Section 2.6) --------
ok("the band derivation audit records the emitted band for the weight axis", signed.band_derivation_audit.some((a) => a.axis === "lifting_floor_to_waist" && a.emitted_band === "LIMITED" && a.measured_weight_kg === 8));
ok("an append only audit event is produced for the signature", signed.audit_event.action === "sign_measurement" && signed.audit_event.entity_id === "rep-1");

// -- the snapshot hash is deterministic and reproduces the signed payload -------------
ok("the same signed payload hashes to the same value", snapshotHash(canonicalPayload(report, signed.axis_value_rows)) === signed.snapshot_hash);
ok("a changed capability changes the hash", (() => {
  const changed = signed.axis_value_rows.map((r) => r.axis === "walking" ? { ...r, capability: "unable", derived_capability_code: "UNABLE" } : r);
  return snapshotHash(canonicalPayload(report, changed)) !== signed.snapshot_hash;
})());

// -- criterion 1: no capability is system authored ------------------------------------
ok("criterion 1: every signed axis with a capability carries a human source", provenanceAudit(signed.axis_value_rows).length === 0);
ok("a system authored capability is caught", provenanceAudit([{ axis: "x", capability: "able", source: "system", provenance: "system" }]).length === 1);

// -- the signature gate is server authoritative ---------------------------------------
ok("an unassessed axis blocks the signature and names it", (() => {
  const b = signMeasurement({ report, practitioner, axisValues: [{ axis: "sitting", answered: false, skipped: false }] });
  return b.signed === false && b.blocked === true && b.blockers.some((x) => x.id === "AXIS-UNASSESSED" && x.axes.includes("sitting"));
})());
ok("an inactive practitioner blocks the signature", (() => {
  const b = signMeasurement({ report, practitioner: { ...practitioner, active: false }, axisValues: axes });
  return b.signed === false && b.blockers.some((x) => x.id === "PRACTITIONER-INACTIVE");
})());
ok("a graded answer on an able or unable only axis blocks the signature", (() => {
  const b = signatureBlockers([{ axis: "grasping_left", answered: true, capability: "limited", code_set: "able_unable_only" }], practitioner);
  return b.some((x) => x.id === "GRADED-NOT-ALLOWED");
})());

// -- the draft is never mutated -------------------------------------------------------
ok("signing never mutates the input axis values", (() => {
  const before = JSON.parse(JSON.stringify(axes));
  signMeasurement({ report, practitioner, axisValues: axes }, { signedAt: "2026-08-10T12:00:00Z" });
  return JSON.stringify(axes) === JSON.stringify(before);
})());

console.log("\nsign measurement suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
