/* Continuum physician foundation: the signature routine (Prompt 39 Section 3.4, Prompt 42
   Section 2.1). At signature, and only at signature, the draft working set is frozen: each
   axis's band is derived from its measurement (Prompt 39 deriveWeightBand), the emitted
   board code is computed, and a SHA-256 snapshot_hash is taken over the canonical signed
   payload, all in the same conceptual transaction that sets signed_at. The signed snapshot
   and the submitted file are therefore byte identical (Prompt 42), and a later uploaded
   file that differs from this hash is an integrity failure, not a retry.

   The signature gate is SERVER authoritative (the screen only mirrors it): it blocks while
   any axis is neither answered nor skipped, when the practitioner is no longer active
   (Prompt 42 Section 6), and when an able or unable only axis carries a graded answer. No
   capability is ever authored by the system: every derived axis with a capability carries
   a human source (Prompt 39 criterion 1).

   Pure functions; the routine returns the rows to insert (the draft is never mutated and
   the frozen rows are insert only per migration 011). No dashes anywhere. */

import { createHash } from "node:crypto";
import { deriveWeightBand, emitCode } from "./measurement.mjs";

const HUMAN_SOURCES = ["measured", "carried_forward", "bulk_marked_able"];

// The server side signature blockers. Returns the blockers by name (empty means signable).
export function signatureBlockers(axisValues, practitioner) {
  const b = [];
  if (practitioner && practitioner.active === false)
    b.push({ id: "PRACTITIONER-INACTIVE", message: "The practitioner " + (practitioner.billing_number || practitioner.id || "") + " is no longer active; the report cannot be signed." });
  const unassessed = (axisValues || []).filter((v) => !v.answered && !v.skipped).map((v) => v.axis);
  if (unassessed.length)
    b.push({ id: "AXIS-UNASSESSED", axes: unassessed, message: "Axes neither answered nor skipped: " + unassessed.join(", ") });
  for (const v of axisValues || [])
    if (v.answered && v.code_set === "able_unable_only" && (v.capability === "limited" || v.capability === "limited_to"))
      b.push({ id: "GRADED-NOT-ALLOWED", axis: v.axis, message: "Axis " + v.axis + " is able or unable only and cannot be graded; raise it to a human." });
  return b;
}

// Freeze one axis: derive its band (weight axes) and its emitted board code. A skipped axis
// carries no capability and no band. The raw measurement stays on the row (the clinical
// schema, insert only, never leaves Continuum); the employer view reads only the band.
function deriveAxis(v) {
  if (v.skipped) {
    return { axis: v.axis, skipped: true, capability: null, derived_band: null, derived_capability_code: null, rounded_down: false, below_lowest_band: false, source: null, provenance: null };
  }
  const wb = v.quantity_kind === "weight" ? deriveWeightBand(v.measured_weight_kg) : { band: null, roundedDown: false, belowLowestBand: false };
  return {
    axis: v.axis, skipped: false, capability: v.capability,
    derived_band: wb.band,
    derived_capability_code: emitCode(v.capability, v.code_list_name, wb.band),
    rounded_down: wb.roundedDown, below_lowest_band: wb.belowLowestBand,
    measured_weight_kg: v.measured_weight_kg ?? null, measured_hours: v.measured_hours ?? null,
    source: v.source, provenance: v.provenance,
  };
}

// A deterministic canonical serialisation of the signed payload: the report identity and
// the axis rows sorted by axis, each reduced to its capability and derived outputs. The
// snapshot_hash is a SHA-256 over this string, so the same signed payload always hashes to
// the same value (Prompt 42 Section 2.1).
export function canonicalPayload(report, derived) {
  const axes = (derived || []).slice().sort((a, b) => (a.axis < b.axis ? -1 : a.axis > b.axis ? 1 : 0))
    .map((d) => [d.axis, d.skipped ? "SKIP" : (d.capability || ""), d.derived_band || "", d.derived_capability_code || ""].join(":"));
  return [String((report && report.id) || ""), String((report && report.form_id) || ""), String((report && report.version) || 1), ...axes].join("|");
}

export function snapshotHash(canonical) {
  return createHash("sha256").update(String(canonical), "utf8").digest("hex");
}

// Sign the measurement: gate, derive, hash. Returns { signed:false, blocked, blockers } if
// the gate fails, else the report update (status signed, signed_at, snapshot_hash), the
// frozen axis rows, the band derivation audit rows, and an append only audit event. Never
// mutates the input.
export function signMeasurement(input, opts = {}) {
  const { report, practitioner, axisValues } = input || {};
  const blockers = signatureBlockers(axisValues || [], practitioner);
  if (blockers.length) return { signed: false, blocked: true, blockers };

  const derived = (axisValues || []).map(deriveAxis);
  const hash = snapshotHash(canonicalPayload(report, derived));
  const bandAudit = derived.filter((d) => !d.skipped).map((d) => ({
    axis: d.axis, measured_weight_kg: d.measured_weight_kg, measured_hours: d.measured_hours,
    emitted_band: d.derived_band, emitted_capability_code: d.derived_capability_code,
    rounded_down: d.rounded_down, below_lowest_band: d.below_lowest_band,
  }));

  return {
    signed: true, blocked: false,
    report_update: { status: "signed", signed_at: opts.signedAt || null, snapshot_hash: hash },
    axis_value_rows: derived,
    band_derivation_audit: bandAudit,
    audit_event: { action: "sign_measurement", entity: "wcb_report", entity_id: (report && report.id) || null, actor: (practitioner && practitioner.id) || null, detail: { snapshot_hash: hash, axis_count: derived.length } },
    snapshot_hash: hash,
  };
}

// Criterion 1: no axis carries a capability without a human source. Returns the offending
// rows (empty means clean). No system authored value can pass this.
export function provenanceAudit(axisValueRows) {
  return (axisValueRows || []).filter((d) => d.capability !== null && d.capability !== undefined && !(HUMAN_SOURCES.includes(d.source) && d.provenance === "human"));
}
