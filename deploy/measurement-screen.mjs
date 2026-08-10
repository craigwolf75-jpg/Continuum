/* Continuum Prompt 41 SCR-MEAS-01: the measurement screen behaviour spine.

   Section 3 of Prompt 41 calls this "the only genuinely new work in the encounter".
   This module is the pure, framework free state model for it: the part that is easy to
   get subtly wrong. It holds no field inventory of its own. The axis set, the quantity
   type and the code list all come from resolve_axes(form_id) in Prompt 39 (the
   functional measurement model, clinical/engine/measurement.mjs), passed in as
   axisSpecs. Nothing here is hard coded (Section 3.2).

   The rules this enforces, verbatim from the prompt:
   - Zone 2 defaults to unanswered. Never to Able (Section 3.1). No axis is ever given a
     capability the practitioner did not enter.
   - The one accelerator, Mark all remaining as Able, writes source bulk_marked_able with
     provenance human, and ONLY after a confirmation naming the count and the axes
     (Section 3.1, acceptance criterion 2). The practitioner asserts the judgement; the
     software does not make one.
   - No system authored value ever reaches a report (acceptance criterion 1). Every
     capability carries a human source.
   - An able or unable only axis (grasping, sided reaching) cannot be graded Limited; a
     graded intent there is refused so it can be raised to a human, never auto emitted.
   - Copy is linted against the banned vocabulary (Section 0A.3).

   Band derivation is NOT here: at entry the practitioner enters a real number; the band
   is shown on the review screen (Section 3.3), which is a separate screen and uses
   clinical/engine/measurement.mjs deriveWeightBand. No dashes anywhere. */

// The three human sources. There is no code path that writes a capability without one
// of these (acceptance criterion 1). "not answered" is capability null, not a source.
export const HUMAN_SOURCES = ["measured", "carried_forward", "bulk_marked_able"];

// Banned in labels, tooltips, empty states and error copy (Section 0A.3).
export const BANNED_TERMS = [
  "predicted", "suggested diagnosis", "recommended restriction",
  "smart", "automatic assessment", "ai decided",
];

// The capability options a code_set offers on its radio group. "not_answered" is the
// default selected option and maps to capability null (answered false). A weight axis
// offers Limited, which reveals a kilograms input. An able or unable only axis never
// offers Limited (a graded answer there must go to a human).
export const CAPABILITY_OPTIONS = {
  basic: ["not_answered", "able", "limited", "unable"],
  extended: ["not_answered", "able", "limited", "unable"],
  conditional: ["not_answered", "able", "limited", "unable"],
  weight: ["not_answered", "able", "limited", "unable"],
  able_unable_only: ["not_answered", "able", "unable"],
};

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();

// Lint a copy string against the banned vocabulary. Returns the banned terms found
// (word boundary match, case insensitive), empty when clean.
export function bannedTermLint(text) {
  const t = norm(text);
  if (!t) return [];
  return BANNED_TERMS.filter((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp("\\b" + escaped + "\\b", "i").test(t);
  });
}

// Build the presentational model for a form from its resolve_axes output. Splits the
// axes into Zone 1 (focused) and Zone 2 (other). Without a body region relevance map
// (opts.relevantAxes), every axis is focused: the safe default, because both zones
// default to unanswered and a focused axis simply requires an answer. Environment is
// not an axis row; it is a Zone 3 exception. Returns focused, other and the Zone 3
// exceptions (pain, medication side effects, hospitalisation, work hours, and
// environment when the form has it), each field grounded in the Prompt 39 tables.
export function buildScreenModel(formId, axisSpecs, opts = {}) {
  const relevant = opts.relevantAxes ? new Set(opts.relevantAxes) : null;
  const focused = [], other = [];
  for (const s of axisSpecs || []) {
    if (s.code_set === "environment") continue; // Zone 3, not an axis row
    const row = {
      axis: s.axis,
      ui_mapping: s.ui_mapping,
      code_set: s.code_set,
      quantity_kind: s.quantity_kind,
      code_list_name: s.code_list_name,
      options: CAPABILITY_OPTIONS[s.code_set] || CAPABILITY_OPTIONS.basic,
    };
    if (!relevant || relevant.has(s.axis)) focused.push(row); else other.push(row);
  }
  const hasEnvironment = (axisSpecs || []).some((s) => s.code_set === "environment");
  return { formId, focused, other, exceptions: buildExceptions(hasEnvironment), hasEnvironment };
}

// Zone 3 exceptions. Each key maps to a real Prompt 39 column: work_hours_per_day on
// functional_measurement; self_reported_pain, medication_side_effects and hospitalized
// on functional_clinical_context; environment on functional_environment. Copy uses the
// allowed framing (worker reported), never a banned term.
function buildExceptions(hasEnvironment) {
  const ex = [
    { key: "work_hours", label: "Work hours per day", control: "number", unit: "hours" },
    { key: "self_reported_pain", label: "Worker reported pain", control: "boolean" },
    { key: "medication_side_effects", label: "Medication side effects", control: "boolean" },
    { key: "hospitalized", label: "Hospitalisation", control: "boolean" },
  ];
  if (hasEnvironment)
    ex.push({ key: "environment", label: "Environment restrictions", control: "environment",
      factors: ["cold", "hot", "wet", "dry", "dust", "lighting", "noise"] });
  return ex;
}

// The answer state for a form: one entry per axis row, every one unanswered, no
// capability, no source (Section 3.1: never defaults to Able). Environment is handled
// by the exception controls, not here.
export function createState(axisSpecs) {
  const m = new Map();
  for (const s of axisSpecs || []) {
    if (s.code_set === "environment") continue;
    m.set(s.axis, {
      axis: s.axis, code_set: s.code_set, quantity_kind: s.quantity_kind,
      answered: false, skipped: false, skip_reason: null,
      capability: null, quantity: null, source: null, provenance: null,
    });
  }
  return m;
}

// Record a practitioner answer. capability is one of able, limited, unable (limited only
// where the code_set allows it). Refuses a graded Limited on an able or unable only
// axis so it can be raised to a human. A limited answer keeps its quantity; any other
// clears it. Always a human source.
export function answerAxis(state, axis, capability, quantity = null) {
  const r = state.get(norm(axis));
  if (!r) throw new Error("no such axis on this form: " + norm(axis));
  const cap = norm(capability);
  if (!["able", "limited", "unable"].includes(cap)) throw new Error("capability must be able, limited or unable, got " + JSON.stringify(capability));
  if (cap === "limited" && r.code_set === "able_unable_only")
    throw new Error("axis " + r.axis + " is able or unable only; a graded answer must be raised to a human, not entered here");
  r.answered = true; r.skipped = false; r.skip_reason = null;
  r.capability = cap;
  r.quantity = cap === "limited" ? quantity : null;
  r.source = "measured"; r.provenance = "human";
  return r;
}

// Skip an axis with a reason (skip_requires_reason). Clears any capability.
export function skipAxis(state, axis, reason) {
  const r = state.get(norm(axis));
  if (!r) throw new Error("no such axis on this form: " + norm(axis));
  if (!norm(reason)) throw new Error("a skip requires a reason");
  r.answered = false; r.skipped = true; r.skip_reason = norm(reason);
  r.capability = null; r.quantity = null; r.source = null; r.provenance = null;
  return r;
}

// Return an axis to the unanswered state.
export function resetAxis(state, axis) {
  const r = state.get(norm(axis));
  if (!r) throw new Error("no such axis on this form: " + norm(axis));
  r.answered = false; r.skipped = false; r.skip_reason = null;
  r.capability = null; r.quantity = null; r.source = null; r.provenance = null;
  return r;
}

// The axes neither answered nor skipped: the live count behind the Zone 2 control and
// the signature blocker (Sections 3, 7).
export function unassessedAxes(state) {
  return [...state.values()].filter((r) => !r.answered && !r.skipped).map((r) => r.axis);
}

// The count of a given axis subset still not assessed (for the Zone 2 label, computed
// live from actual state).
export function notAssessedCount(state, axisList) {
  return (axisList || []).filter((a) => { const r = state.get(a); return r && !r.answered && !r.skipped; }).length;
}

// The one accelerator. Without confirmed:true it makes NO change and returns the count
// and the axes it would affect so the interface can name them in a confirmation dialog.
// With confirmed:true it marks every still unassessed axis Able with source
// bulk_marked_able and provenance human, and never touches an axis already answered or
// skipped (acceptance criterion 2, Section 3.1).
export function markAllRemainingAsAble(state, opts = {}) {
  const remaining = unassessedAxes(state);
  if (!opts.confirmed)
    return { requiresConfirmation: true, applied: false, count: remaining.length, axes: remaining };
  for (const a of remaining) {
    const r = state.get(a);
    r.answered = true; r.skipped = false; r.skip_reason = null;
    r.capability = "able"; r.quantity = null;
    r.source = "bulk_marked_able"; r.provenance = "human";
  }
  return { requiresConfirmation: false, applied: true, count: remaining.length, axes: remaining };
}

// Acceptance criterion 1 audit: every axis that carries a capability must carry a human
// source and provenance human. Returns the offending rows (empty when clean). No system
// authored value can pass this.
export function provenanceAudit(state) {
  return [...state.values()].filter(
    (r) => r.capability !== null && !(HUMAN_SOURCES.includes(r.source) && r.provenance === "human"));
}

// What blocks signature from the measurement screen (Section 7). Returns the blockers by
// name. The interface only mirrors this; the server enforces it.
export function signatureBlockers(state) {
  const blockers = [];
  const un = unassessedAxes(state);
  if (un.length)
    blockers.push({ id: "AXIS-UNASSESSED", axes: un, message: "Axes neither answered nor skipped: " + un.join(", ") });
  for (const r of state.values())
    if (r.code_set === "able_unable_only" && r.capability === "limited")
      blockers.push({ id: "GRADED-NOT-ALLOWED", axes: [r.axis], message: "Axis " + r.axis + " is able or unable only and cannot be graded; raise it to a human" });
  return { blocked: blockers.length > 0, blockers };
}
