/* Continuum Prompt 41 SCR-FUP-01: the follow up screen, the wedge (Section 4).

   Pure, framework free behaviour spine. The value here is carry forward, roughly 78 of
   136 elements pre filled on a C151, and getting the board's real rule chain right. The
   thing this must NOT do (Section 4.2, correcting a previous specification): treat
   UNCHANGED as a collapse of 66 fields that reaches signature in two interactions. That
   is false. UNCHANGED carries forward and runs the real chain from form_rule; only SR3
   (modified duties and modified hours both No) collapses the capability block.

   The C151S no change and gate chain below is ported from the real form_rule rows in
   clinical/db/form_rules.data.mjs (SR30, SR28, E1, SR1, SR2, SR3). The suite cross
   checks it against that source so it can never silently drift.

   Rules this enforces:
   - A new measurement version is created on every follow up, including UNCHANGED
     (Section 4.3, acceptance criterion 5).
   - Every carried value renders with a from previous visit label; a value older than 90
     days is stale and cannot reach signature without explicit confirmation
     (Section 4.3, Section 7).
   - A clearing warning appears before any collapse that would discard entered data
     (acceptance criterion 6).
   - Sparklines carry a text alternative giving first value, last value and direction
     (Section 6).
   No dashes anywhere. Dates are passed in, never read from the clock, so the logic is
   deterministic and testable. */

export const STALE_DAYS = 90;
export const TRAJECTORIES = ["IMPROVING", "UNCHANGED", "REGRESSING"];

// ---------------------------------------------------------------------------
// The C151S no change and gate chain, ported from form_rules.data.mjs. Each entry
// mirrors a real form_rule row: its code, the trigger, and the fields it toggles.
// ---------------------------------------------------------------------------
export const C151S_CHAIN = {
  // SR30: E1 Yes or No enables the missed work question. Never short circuits to signature.
  missedWorkTrigger: "Will/has the patient miss(ed) work beyond the date of accident",
  // SR28: not changed hides the four OIS disposition questions and shows the pre accident date.
  oisDispositionFields: [
    "OIS specific questions",
    "Reviewed work capabilities with patient",
    "Patient was assessed and now deemed",
    "OIS follow-up visit required",
  ],
  preAccidentDateField: "Estimated date you expect the patient will be able to perform pre-accident work",
  // E1 code_list_switch: not changed switches these five axes to Basic, does NOT hide them.
  codeListSwitchAxes: ["E14", "E16", "E18", "E20", "E22"],
  // SR3: modified duties and modified hours both No collapses the capability block.
  capabilityBlockFields: [
    "Number of hours patient is capable of working per day",
    "Current Capabilities",
    "Other reasons why the patient cannot work",
    "Estimated date you expect the patient will be able to perform pre-accident work",
  ],
};

const yn = (v) => (String(v).toUpperCase() === "Y" || String(v).toUpperCase() === "YES" ? "Y"
  : String(v).toUpperCase() === "N" || String(v).toUpperCase() === "NO" ? "N" : null);

// Evaluate the real chain from the practitioner's answers to the trigger fields. Returns
// what is visible, what is hidden, the code list each switched axis uses, and whether the
// capability block collapses. This is the whole point of Section 4.2: the chain, not a
// shortcut. answers: { statusChanged, missedWork, returnedToWork, modifiedDuties, modifiedHours }.
export function evaluateNoChangeChain(answers = {}) {
  const statusChanged = yn(answers.statusChanged); // N = not changed, Y = changed
  const missedWork = yn(answers.missedWork);
  const returnedToWork = yn(answers.returnedToWork);
  const modDuties = yn(answers.modifiedDuties);
  const modHours = yn(answers.modifiedHours);

  const hidden = new Set();
  const visible = new Set();

  // SR30: the missed work question is always enabled once E1 is answered (Yes or No).
  const missedWorkEnabled = statusChanged !== null;
  if (missedWorkEnabled) visible.add(C151S_CHAIN.missedWorkTrigger);

  // SR28: not changed hides the four OIS disposition questions and shows the pre accident date.
  if (statusChanged === "N") {
    for (const f of C151S_CHAIN.oisDispositionFields) hidden.add(f);
    visible.add(C151S_CHAIN.preAccidentDateField);
  } else if (statusChanged === "Y") {
    for (const f of C151S_CHAIN.oisDispositionFields) visible.add(f);
  }

  // E1 code_list_switch: not changed uses Basic, changed uses Extended. Never hides.
  const list = statusChanged === "N" ? "Basic Work Restriction Codes" : "Extended Work Restriction Codes";
  const codeListFor = {};
  for (const a of C151S_CHAIN.codeListSwitchAxes) codeListFor[a] = list;

  // SR1: missed work Yes enables returned to work and hides modified; No the inverse.
  if (missedWork === "Y") { visible.add("Has the patient returned to work"); hidden.add("Modified duties"); hidden.add("Modified hours"); }
  else if (missedWork === "N") { visible.add("Modified duties"); visible.add("Modified hours"); hidden.add("Has the patient returned to work"); }

  // SR3: modified duties and modified hours both No collapses the capability block. This
  // is the ONLY collapse, and it is not implied by UNCHANGED (Section 4.2).
  const capabilityBlockCollapsed = modDuties === "N" && modHours === "N";
  const cleared = [];
  if (capabilityBlockCollapsed) {
    for (const f of C151S_CHAIN.capabilityBlockFields) { hidden.add(f); cleared.push(f); }
    visible.add("Other restrictions or additional comments");
  }

  return {
    statusChanged, missedWorkEnabled, capabilityBlockCollapsed,
    codeListFor, hidden: [...hidden], visible: [...visible], cleared,
    returnedToWork, // surfaced for SR2 downstream if the caller needs it
  };
}

// ---------------------------------------------------------------------------
// Measurement version: a new version on EVERY follow up, including UNCHANGED
// (Section 4.3, acceptance criterion 5). Never reuses the previous version.
// ---------------------------------------------------------------------------
export function nextMeasurementVersion(previousVersion) {
  const n = Number(previousVersion);
  if (!Number.isFinite(n) || n < 0) throw new Error("previousVersion must be a non negative number");
  return n + 1;
}

// ---------------------------------------------------------------------------
// Trajectory routing (Section 4.1). Every trajectory carries forward.
// ---------------------------------------------------------------------------
export function trajectoryPlan(trajectory) {
  const t = String(trajectory || "").toUpperCase();
  if (!TRAJECTORIES.includes(t)) throw new Error("trajectory must be IMPROVING, UNCHANGED or REGRESSING");
  if (t === "UNCHANGED") return { trajectory: t, carryForward: true, opens: "none", routesTo: "review", createsVersion: true };
  if (t === "IMPROVING") return { trajectory: t, carryForward: true, opens: "chosen_axes", routesTo: "measurement", createsVersion: true };
  return { trajectory: t, carryForward: true, opens: "full", routesTo: "measurement", createsVersion: true };
}

// ---------------------------------------------------------------------------
// Carry forward (Section 4.3). Each previous value becomes a carried entry with a from
// previous visit label and a stale flag. Dates are ISO strings; the reference date is
// passed in. A stale value (older than 90 days) cannot reach signature unconfirmed.
// ---------------------------------------------------------------------------
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatVisitLabel(isoDate) {
  const d = new Date(isoDate + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return "previous visit";
  return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()];
}

export function ageInDays(fromIso, toIso) {
  const a = new Date(fromIso + "T00:00:00Z").getTime();
  const b = new Date(toIso + "T00:00:00Z").getTime();
  return Math.floor((b - a) / 86400000);
}

export function isStale(previousVisitIso, asOfIso, staleDays = STALE_DAYS) {
  return ageInDays(previousVisitIso, asOfIso) > staleDays;
}

// previousValues: [{ element, value }]. Returns carried entries, each source
// carried_forward with a from previous visit label and a stale flag and age.
export function carryForward(previousValues, previousVisitIso, asOfIso) {
  const stale = isStale(previousVisitIso, asOfIso);
  const age = ageInDays(previousVisitIso, asOfIso);
  const label = "from previous visit, " + formatVisitLabel(previousVisitIso);
  return (previousValues || []).map((v) => ({
    element: v.element, value: v.value,
    source: "carried_forward", provenance: "human",
    label, stale, ageDays: age,
    confirmed: false, // a stale carried value must be explicitly confirmed
  }));
}

// Confirm a stale carried value (the explicit confirmation Section 4.3 requires).
export function confirmCarried(entry) {
  return { ...entry, confirmed: true };
}

// ---------------------------------------------------------------------------
// Clearing warning (acceptance criterion 6): before any collapse that would discard
// entered data, warn and name the fields. fieldsToClear are the elements a collapse
// would hide and clear; enteredValues is a map or set of elements that currently hold
// data the practitioner entered this visit. Returns the fields that would lose data.
// ---------------------------------------------------------------------------
export function clearingWarning(fieldsToClear, enteredValues) {
  const has = enteredValues instanceof Set
    ? (k) => enteredValues.has(k)
    : (k) => enteredValues && Object.prototype.hasOwnProperty.call(enteredValues, k)
        && enteredValues[k] !== null && enteredValues[k] !== undefined && enteredValues[k] !== "";
  const atRisk = (fieldsToClear || []).filter(has);
  return { warn: atRisk.length > 0, fields: atRisk };
}

// ---------------------------------------------------------------------------
// Sparkline text alternative (Section 6): first value, last value, direction.
// ---------------------------------------------------------------------------
export function sparklineTextAlt(label, series, unit = "") {
  const s = (series || []).filter((n) => typeof n === "number");
  if (!s.length) return label + ": no data";
  const first = s[0], last = s[s.length - 1];
  const dir = last > first ? "up" : last < first ? "down" : "steady";
  const u = unit ? " " + unit : "";
  return label + ": first " + first + u + ", last " + last + u + ", direction " + dir;
}

// ---------------------------------------------------------------------------
// Signature blockers for the follow up screen (Section 7). An unconfirmed stale carried
// value blocks and is named with its age.
// ---------------------------------------------------------------------------
export function followupSignatureBlockers(carriedEntries) {
  const blockers = [];
  for (const e of carriedEntries || [])
    if (e.stale && !e.confirmed)
      blockers.push({ id: "STALE-UNCONFIRMED", element: e.element, ageDays: e.ageDays,
        message: "Carried value for " + e.element + " is " + e.ageDays + " days old and must be confirmed before signature" });
  return { blocked: blockers.length > 0, blockers };
}
