/* Continuum sign_measurement suite (Prompt 39 Section 3.4, Prompt 42 Section 2.1). Proves
   the signature routine derives bands, emits board codes, and takes a deterministic
   snapshot_hash, blocks server side on an unassessed axis / inactive practitioner / graded
   able-or-unable-only axis, never authors a capability, and never mutates the draft.
   No dashes anywhere. */

import {
  signMeasurement, signatureBlockers, signatureWarnings, canonicalPayload, snapshotHash, provenanceAudit,
  STALE_CARRIED_DAYS,
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

// -- Section 6 fail loudly: hours, stale carried, weight warn --
ok("measured hours exceeding work_hours_per_day blocks and names both values", (() => {
  const b = signatureBlockers(
    [{ axis: "sitting", answered: true, skipped: false, capability: "limited", measured_hours: 10, source: "measured" }],
    practitioner,
    { work_hours_per_day: 8 },
  );
  return b.some((x) => x.id === "HOURS-EXCEED-WORKDAY" && x.measured_hours === 10 && x.work_hours_per_day === 8);
})());
ok("hours within the work day do not block", signatureBlockers(
  [{ axis: "sitting", answered: true, skipped: false, capability: "limited", measured_hours: 6, source: "measured" }],
  practitioner,
  { work_hours_per_day: 8 },
).every((x) => x.id !== "HOURS-EXCEED-WORKDAY"));
ok("a carried forward value older than 90 days blocks until confirmed", (() => {
  const b = signatureBlockers(
    [{ axis: "walking", answered: true, skipped: false, capability: "able", source: "carried_forward", carried_from_at: "2026-01-01T00:00:00Z" }],
    practitioner,
    { measured_at: "2026-08-10T00:00:00Z" },
  );
  return b.some((x) => x.id === "STALE-CARRIED-FORWARD" && x.age_days > STALE_CARRIED_DAYS);
})());
ok("confirming a stale carried forward value unblocks it", signatureBlockers(
  [{ axis: "walking", answered: true, skipped: false, capability: "able", source: "carried_forward", carried_from_at: "2026-01-01T00:00:00Z", confirmed: true }],
  practitioner,
  { measured_at: "2026-08-10T00:00:00Z" },
).every((x) => x.id !== "STALE-CARRIED-FORWARD"));
ok("a measured weight above 100 kg warns and does not block", (() => {
  const axisValues = [{ axis: "lifting_general", answered: true, skipped: false, capability: "limited", quantity_kind: "weight", code_list_name: "Weight Category Codes", measured_weight_kg: 120, source: "measured", provenance: "human" }];
  const signed = signMeasurement({ report, practitioner, axisValues });
  return signed.signed === true && signed.warnings.some((w) => w.id === "WEIGHT-ABOVE-100" && w.measured_weight_kg === 120);
})());
ok("8 kg does not raise the weight warning", signatureWarnings([{ measured_weight_kg: 8, axis: "lifting_general" }]).length === 0);

ok("an untouched ai_draft field blocks signature (Prompt 44 criterion 3, on the sign path)", (() => {
  const b = signMeasurement({ report, practitioner, axisValues: axes, reportFields: [{ provenance: "ai_draft", element_key: "diagnosis_narrative" }] });
  return b.signed === false && b.blockers.some((x) => x.id === "AI-DRAFT-UNTOUCHED");
})());
ok("passing a throwing model adapter does not run it (zero model calls from review and sign)", (() => {
  const bomb = { invoke() { throw new Error("model adapter must not be called from sign"); } };
  const s = signMeasurement({ report, practitioner, axisValues: axes }, { modelAdapter: bomb, signedAt: "2026-08-10T12:00:00Z" });
  return s.signed === true;
})());


console.log("\nsign measurement suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
