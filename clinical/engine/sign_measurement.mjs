/* Continuum physician foundation: the signature routine (Prompt 39 Section 3.4, Prompt 42
   Section 2.1). At signature, and only at signature, the draft working set is frozen: each
   axis's band is derived from its measurement (Prompt 39 deriveWeightBand), the emitted
   board code is computed, and a SHA-256 snapshot_hash is taken over the canonical signed
   payload, all in the same conceptual transaction that sets signed_at. The signed snapshot
   and the submitted file are therefore byte identical (Prompt 42), and a later uploaded
   file that differs from this hash is an integrity failure, not a retry.

   The signature gate is SERVER authoritative (the screen only mirrors it). Prompt 39
   Section 6 fail loudly conditions that belong here (silence is never permission):
     AXIS-UNASSESSED: an axis with no answered and no skipped blocks, listing axes by name
     HOURS-EXCEED-WORKDAY: measured hours above work_hours_per_day blocks, naming both values
     STALE-CARRIED-FORWARD: a carried forward value older than 90 days blocks until confirmed
     WEIGHT-ABOVE-100: a measured weight above 100 kg warns and does not block
   An inactive practitioner and a graded answer on an able or unable only axis also block
   (Prompt 42). No capability is ever authored by the system: every derived axis with a
   capability carries a human source (Prompt 39 criterion 1).

   Pure functions; the routine returns the rows to insert (the draft is never mutated and
   the frozen rows are insert only per migration 011). No dashes anywhere. */

import { createHash } from "node:crypto";
import { deriveWeightBand, emitCode } from "./measurement.mjs";

const HUMAN_SOURCES = ["measured", "carried_forward", "bulk_marked_able"];
export const STALE_CARRIED_DAYS = 90;
export const WEIGHT_WARN_KG = 100;

function num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export function carriedForwardAgeDays(fromIso, asOfIso) {
  if (!fromIso || !asOfIso) return null;
  const a = Date.parse(fromIso);
  const b = Date.parse(asOfIso);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.floor((b - a) / 86400000);
}

// Warnings never block signature. Weight above 100 kg is confirmed by the practitioner
// at the screen; this engine only raises the named warning.
export function signatureWarnings(axisValues) {
  const w = [];
  for (const v of axisValues || []) {
    const kg = num(v.measured_weight_kg);
    if (kg !== null && kg > WEIGHT_WARN_KG)
      w.push({
        id: "WEIGHT-ABOVE-100",
        axis: v.axis,
        measured_weight_kg: kg,
        message: "Measured weight " + kg + " kg on " + v.axis + " is above 100 kg. Warn, do not block. Practitioner may confirm.",
      });
  }
  return w;
}

// The server side signature blockers. Returns the blockers by name (empty means signable).
// header is the measurement header (work_hours_per_day, measured_at) when present.
export function signatureBlockers(axisValues, practitioner, header = {}) {
  const b = [];
  if (practitioner && practitioner.active === false)
    b.push({ id: "PRACTITIONER-INACTIVE", message: "The practitioner " + (practitioner.billing_number || practitioner.id || "") + " is no longer active; the report cannot be signed." });
  const unassessed = (axisValues || []).filter((v) => !v.answered && !v.skipped).map((v) => v.axis);
  if (unassessed.length)
    b.push({ id: "AXIS-UNASSESSED", axes: unassessed, message: "Axes neither answered nor skipped: " + unassessed.join(", ") });
  const workHours = num(header.work_hours_per_day);
  const asOf = header.measured_at || header.as_of || null;
  for (const v of axisValues || []) {
    if (v.answered && v.code_set === "able_unable_only" && (v.capability === "limited" || v.capability === "limited_to"))
      b.push({ id: "GRADED-NOT-ALLOWED", axis: v.axis, message: "Axis " + v.axis + " is able or unable only and cannot be graded; raise it to a human." });
    const hours = num(v.measured_hours);
    if (hours !== null && workHours !== null && hours > workHours)
      b.push({
        id: "HOURS-EXCEED-WORKDAY",
        axis: v.axis,
        measured_hours: hours,
        work_hours_per_day: workHours,
        message: "Measured hours " + hours + " on " + v.axis + " exceed work hours per day " + workHours + ".",
      });
    if (v.source === "carried_forward") {
      const age = v.age_days != null ? Number(v.age_days) : carriedForwardAgeDays(v.carried_from_at, asOf);
      const stale = v.stale === true || (age !== null && age > STALE_CARRIED_DAYS);
      if (stale && v.confirmed !== true)
        b.push({
          id: "STALE-CARRIED-FORWARD",
          axis: v.axis,
          age_days: age,
          message: "Carried forward value on " + v.axis + " is older than " + STALE_CARRIED_DAYS + " days and requires explicit confirmation before signature.",
        });
    }
  }
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
  const { report, practitioner, axisValues, measurement } = input || {};
  const header = measurement || {};
  const blockers = signatureBlockers(axisValues || [], practitioner, header);
  const warnings = signatureWarnings(axisValues || []);
  if (blockers.length) return { signed: false, blocked: true, blockers, warnings };

  const derived = (axisValues || []).map(deriveAxis);
  const hash = snapshotHash(canonicalPayload(report, derived));
  const bandAudit = derived.filter((d) => !d.skipped).map((d) => ({
    axis: d.axis, measured_weight_kg: d.measured_weight_kg, measured_hours: d.measured_hours,
    emitted_band: d.derived_band, emitted_capability_code: d.derived_capability_code,
    rounded_down: d.rounded_down, below_lowest_band: d.below_lowest_band,
  }));

  return {
    signed: true, blocked: false, warnings,
    report_update: { status: "signed", signed_at: opts.signedAt || null, snapshot_hash: hash },
    axis_value_rows: derived,
    band_derivation_audit: bandAudit,
    audit_event: { action: "sign_measurement", entity: "wcb_report", entity_id: (report && report.id) || null, actor: (practitioner && practitioner.id) || null, detail: { snapshot_hash: hash, axis_count: derived.length, warning_count: warnings.length } },
    snapshot_hash: hash,
  };
}

// Criterion 1: no axis carries a capability without a human source. Returns the offending
// rows (empty means clean). No system authored value can pass this.
export function provenanceAudit(axisValueRows) {
  return (axisValueRows || []).filter((d) => d.capability !== null && d.capability !== undefined && !(HUMAN_SOURCES.includes(d.source) && d.provenance === "human"));
}
