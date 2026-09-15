/* Continuum Prompt 39: the functional measurement model, pure engine mirror.

   Three deterministic routines that the migration also implements in SQL, kept here as
   pure functions so they can be unit tested without a database (the standing rule is
   that Claude never touches the Continuum Supabase project):

   - deriveWeightBand(kg): the board Weight Category Code band, rounding down always
     (Prompt 39 Section 4.1). A worker told they can lift less is inconvenienced; a
     worker told they can lift more is injured.
   - emitCode(capability, codeListName, weightBand): the emitted board token from the
     pair (capability, code list), never from a single internal enum, because LIMITED
     is overloaded (a Basic restriction token and a 5 kg Weight Category Code) and the
     Basic and Extended lists differ by the one token LIMITED versus LIMITEDTO
     (Prompt 39 Section 5, confirmed by 39A Section 2.2).
   - resolveAxes(formId, axisMapRows): the axis set for a form, read from the axis map
     configuration, never hard coded, so the same resolver produces a C050E and a C050S
     (Prompt 39 Section 4). Reproduces the Section 4.4 board matrix exactly.

   Failure is never invented here: a graded answer on an able or unable only axis, or a
   restricted_from or unanswered capability, returns null so the caller raises it to a
   human. No dashes anywhere. */

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();

export const BASIC_LIST = "Basic Work Restriction Codes";
export const EXTENDED_LIST = "Extended Work Restriction Codes";
export const WEIGHT_LIST = "Weight Category Codes";

// The permitted band outputs are exactly the board Weight Category Codes.
export const WEIGHT_BANDS = ["LIMITED", "LIGHT", "MEDIUM", "HEAVY"];

// Deterministic weight band, rounding down. Both open ends handled: below the lowest
// band still yields LIMITED (flagged below_lowest_band), above the top band yields
// HEAVY. Mirrors clinical.derive_weight_band exactly.
export function deriveWeightBand(measuredKg) {
  if (measuredKg === null || measuredKg === undefined || Number.isNaN(Number(measuredKg)))
    return { band: null, roundedDown: false, belowLowestBand: false };
  const kg = Number(measuredKg);
  if (kg < 5) return { band: "LIMITED", roundedDown: false, belowLowestBand: true };
  if (kg === 5) return { band: "LIMITED", roundedDown: false, belowLowestBand: false };
  if (kg < 10) return { band: "LIMITED", roundedDown: true, belowLowestBand: false };
  if (kg === 10) return { band: "LIGHT", roundedDown: false, belowLowestBand: false };
  if (kg < 20) return { band: "LIGHT", roundedDown: true, belowLowestBand: false };
  if (kg === 20) return { band: "MEDIUM", roundedDown: false, belowLowestBand: false };
  return { band: "HEAVY", roundedDown: false, belowLowestBand: false };
}

// Emit the board token. A weight axis emits its band (which may itself be the string
// LIMITED as a 5 kg Weight Category Code, a distinct meaning from the restriction
// LIMITED). A non weight axis emits from the pair (capability, code list). A graded
// answer on any list that is not Basic or Extended returns null so the caller raises
// it. Mirrors clinical.emit_code.
export function emitCode(capability, codeListName, weightBand) {
  if (weightBand !== null && weightBand !== undefined && norm(weightBand) !== "") return norm(weightBand);
  const cap = norm(capability);
  if (cap === "able") return "ABLE";
  if (cap === "unable") return "UNABLE";
  if (cap === "limited" || cap === "limited_to") {
    const list = norm(codeListName);
    if (list === EXTENDED_LIST) return "LIMITEDTO";
    if (list === BASIC_LIST) return "LIMITED";
    return null; // able_unable_only or unknown list: a graded answer must go to a human
  }
  // restricted_from and not answered are handled by the caller (skipped or unanswered).
  return null;
}

// Resolve the code list name for a code_set. A conditional set (C151S) resolves to
// Basic or Extended by the flag value; every other set maps to its fixed list or null.
export function codeListForSet(codeSet, flagValue, basicValue) {
  const set = norm(codeSet);
  if (set === "basic") return BASIC_LIST;
  if (set === "extended") return EXTENDED_LIST;
  if (set === "weight") return WEIGHT_LIST;
  if (set === "conditional") return norm(flagValue) === norm(basicValue) ? BASIC_LIST : EXTENDED_LIST;
  return null; // able_unable_only, environment
}

// Index axis map rows into form_id -> ordered AxisSpec[].
export function indexAxisMap(rows) {
  const m = new Map();
  for (const r of rows || []) {
    if (!m.has(r.form_id)) m.set(r.form_id, []);
    m.get(r.form_id).push(r);
  }
  for (const [form, rs] of m)
    m.set(form, rs.slice().sort((a, b) => a.display_order - b.display_order));
  return m;
}

// The axis set for a form, in display order. Never hard coded: reads the configuration.
// Returns [] for an unknown form so the caller can fail that form build loudly rather
// than silently emit a wrong shape (Prompt 39 Section 4.4 consequence).
export function resolveAxes(formId, axisMapRows) {
  const index = axisMapRows instanceof Map ? axisMapRows : indexAxisMap(axisMapRows);
  const rows = index.get(norm(formId)) || [];
  return rows.map((r) => ({
    axis: r.axis,
    ui_mapping: r.ui_mapping,
    code_list_name: r.code_list_name,
    code_set: r.code_set,
    quantity_kind: r.quantity_kind,
  }));
}

// Board form element names (Prompt 40 form_element.element_name) to Prompt 39 axis keys.
// Quantity companion rows (Hours, Max of) are not axes and are not mapped.
export const ELEMENT_NAME_TO_AXIS = {
  Sitting: "sitting",
  Standing: "standing",
  Walking: "walking",
  Driving: "driving",
  Bending: "bending",
  Twisting: "twisting",
  "Kneeling/Squatting": "kneeling_squatting",
  Climbing: "climbing",
  "Pushing/Pulling": "pushing_pulling",
  Lifting: "lifting_general",
  "Lifting - Floor to waist": "lifting_floor_to_waist",
  "Lifting - Waist to shoulder": "lifting_waist_to_shoulder",
  "Lifting - Above shoulder": "lifting_above_shoulder",
  "Overhead reaching": "overhead_reaching",
  "Grasping - left": "grasping_left",
  "Grasping - right": "grasping_right",
  "Reaching - Above left shoulder": "reaching_left_above",
  "Reaching - Below left shoulder": "reaching_left_below",
  "Reaching - Above right shoulder": "reaching_right_above",
  "Reaching - Below right shoulder": "reaching_right_below",
  Environment: "environment",
};

// Parse capability axis names out of the Prompt 40 form_element seed SQL. Does not rewrite
// form_element: Prompt 40 owns that table and it has no axis column, so resolve_axes reads
// clinical.functional_axis_map (011 reconciliation). This mapping is the fail loudly check
// that an axis present on the form is not silently omitted from resolve_axes.
export function formCapabilityAxesFromSeed(sqlText) {
  const text = String(sqlText || "");
  const marker = "where fd.jurisdiction_code='";
  const out = {};
  let searchFrom = 0;
  while (true) {
    const idx = text.indexOf(marker, searchFrom);
    if (idx < 0) break;
    const start = idx + marker.length;
    const jurEnd = text.indexOf("'", start);
    const afterJur = text.slice(jurEnd + 1);
    const formKey = " and fd.form_id='";
    const formAt = afterJur.indexOf(formKey);
    if (formAt < 0) { searchFrom = jurEnd + 1; continue; }
    const formStart = jurEnd + 1 + formAt + formKey.length;
    const endQuote = text.indexOf("'", formStart);
    const formId = text.slice(formStart, endQuote);
    const blockStart = text.lastIndexOf("join (values", idx);
    const values = blockStart >= 0 ? text.slice(blockStart, idx) : "";
    const axes = [];
    const tupleRe = /\('([^']+)','([^']+)'/g;
    let m;
    while ((m = tupleRe.exec(values))) {
      const axis = ELEMENT_NAME_TO_AXIS[m[2]];
      if (axis && !axes.includes(axis)) axes.push(axis);
    }
    out[formId] = axes;
    searchFrom = endQuote + 1;
  }
  return out;
}

export function missingAxesFromResolver(formAxesFromDefinition, resolvedAxes) {
  const resolved = new Set((resolvedAxes || []).map((a) => (typeof a === "string" ? a : a.axis)));
  return (formAxesFromDefinition || []).filter((a) => !resolved.has(a));
}

// Fail the build of that form: do not silently omit. Throws FORM-AXIS-MISSING.
export function assertFormAxesCovered(formId, formAxesFromDefinition, resolvedAxes) {
  const missing = missingAxesFromResolver(formAxesFromDefinition, resolvedAxes);
  if (missing.length) {
    const e = new Error("Form " + formId + " build failed: axes present in the form definition but absent from resolve_axes: " + missing.join(", "));
    e.code = "FORM-AXIS-MISSING";
    e.missing = missing;
    throw e;
  }
  return true;
}

export const LEGACY_LABEL_NOTE = "Legacy label. No measurement was ever captured. Do not infer one.";

// Section 5: a legacy R code becomes a derived label, never a stored fact. Never fabricate
// a measurement from a label. The 25 pound label has no safe lossless mapping onto the
// board bands (11, 22, 44 and over 44).
export function migrateLegacyRestriction(input) {
  const caseId = input && input.case_id;
  const rCode = input && input.r_code;
  return {
    case_id: caseId,
    r_code: rCode,
    has_underlying_measurement: false,
    note: LEGACY_LABEL_NOTE,
    fabricated_measurement: null,
  };
}

// Three distinct, queryable states for an axis row (criterion 10).
export function axisRowState(row) {
  const r = row || {};
  if (r.skipped) return "skipped";
  if (r.answered && r.capability === "able") return "answered_able";
  if (r.answered) return "answered";
  return "unanswered";
}

export function axisRowConstraintViolations(row) {
  const r = row || {};
  const v = [];
  if (r.answered && r.skipped) v.push("answered_or_skipped_not_both");
  if (r.capability != null && r.capability !== "" && !r.answered) v.push("capability_requires_answered");
  if (r.skipped && (r.skip_reason == null || String(r.skip_reason).trim() === "")) v.push("skip_requires_reason");
  if ((r.capability === "limited" || r.capability === "limited_to") && r.measured_hours == null && r.measured_weight_kg == null)
    v.push("quantity_required_when_limited");
  return v;
}

export const IMMUTABLE_MEASUREMENT_TABLES = [
  "functional_measurement", "functional_axis_value", "functional_grasping",
  "functional_reaching", "functional_environment", "functional_clinical_context",
  "internal_restriction", "legacy_restriction_label", "band_derivation_audit",
];

// Mirrors clinical.block_mutation for tests that cannot open Postgres. The database proof
// is the 011 trigger plus the 019 reassert and the SQL probe in clinical/db/tests.
export function attemptUpdateMeasurementRow(tableName) {
  const table = String(tableName || "");
  if (IMMUTABLE_MEASUREMENT_TABLES.includes(table)) {
    const e = new Error("clinical measurement rows are immutable. UPDATE is not permitted on " + table);
    e.code = "IMMUTABLE-UPDATE";
    throw e;
  }
  return { updated: true };
}

export const BAND_PROOFS = [
  { kg: 8, band: "LIMITED", rounded_down: true, below_lowest_band: false },
  { kg: 25, band: "HEAVY", rounded_down: false, below_lowest_band: false },
  { kg: 3, band: "LIMITED", rounded_down: false, below_lowest_band: true },
];
