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
