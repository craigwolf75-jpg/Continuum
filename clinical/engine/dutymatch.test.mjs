/* Continuum Prompt 43 duty match suite (Section 4.1, 4.2, 5; criteria 3, 4, 9). Proves
   the match runs against the derived band not the raw measurement, no job profile
   publishes nothing, an unrated restricted axis is conditional with unmapped_demand, and
   every reason is functional prose carrying no restriction value. No dashes anywhere. */

import {
  capacityFromBand, capacityFromMeasurement, matchDuty, matchDuties, restrictionSetState, BAND_CAPACITY_KG,
} from "./dutymatch.mjs";
import { rawMeasurementInPayload } from "./employer_schema.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// -- band capacity and criterion 9 setup ----------------------------------------------
ok("the band capacities are 5, 10, 20 and open top", BAND_CAPACITY_KG.LIMITED === 5 && BAND_CAPACITY_KG.LIGHT === 10 && BAND_CAPACITY_KG.MEDIUM === 20 && BAND_CAPACITY_KG.HEAVY === Infinity);
ok("criterion 9 setup: a measured 8 kg derives a 5 kg matching capacity via LIMITED", (() => { const c = capacityFromMeasurement(8); return c.band === "LIMITED" && c.capacityKg === 5; })());

// -- criterion 9: the match runs against 5 kg, not the raw 8 kg ------------------------
const derived = capacityFromMeasurement(8); // band LIMITED, capacity 5
const liftRestriction = { lifting_floor_to_waist: { capability: "limited", quantity_kind: "weight", capacityKg: derived.capacityKg } };
ok("criterion 9: a duty requiring 7 kg is EXCLUDED (7 > 5), proving the match ran against 5 not 8", (() => {
  const m = matchDuty({ duty_id: "d1", duty_name: "Stock shelving", demands: [{ axis: "lifting_floor_to_waist", kind: "weight", required: 7 }] }, liftRestriction);
  return m.verdict === "excluded";
})());
ok("a duty requiring 4 kg is within the 5 kg band (not excluded)", (() => {
  const m = matchDuty({ duty_id: "d2", duty_name: "Light assembly", demands: [{ axis: "lifting_floor_to_waist", kind: "weight", required: 4 }] }, liftRestriction);
  return m.verdict !== "excluded";
})());

// -- unable axis excludes a duty that requires it -------------------------------------
ok("a duty requiring an axis the worker is Unable on is excluded, with a functional reason", (() => {
  const m = matchDuty({ duty_id: "d3", duty_name: "Overhead crane", demands: [{ axis: "overhead_reaching", kind: "binary", required: true }] }, { overhead_reaching: { capability: "unable" } });
  return m.verdict === "excluded" && m.excluded_because.includes("overhead reaching") && m.excluded_because.includes("cannot do");
})());

// -- criterion 4: an unrated restricted axis is conditional with unmapped_demand -------
ok("criterion 4: a duty with no rating on a restricted axis is conditional and unmapped, never safe", (() => {
  const m = matchDuty({ duty_id: "d4", duty_name: "Yard patrol", demands: [{ axis: "walking", kind: "hours", required: 4 }] }, { lifting_floor_to_waist: { capability: "limited", quantity_kind: "weight", capacityKg: 5 } });
  return m.verdict === "conditional" && m.unmapped_demand === true;
})());

// -- a restricted axis within capacity is safe with a condition, not excluded ---------
ok("a duty within the restricted capacity is conditional (safe with a condition), not excluded", (() => {
  const m = matchDuty({ duty_id: "d5", duty_name: "Sorting", demands: [{ axis: "lifting_floor_to_waist", kind: "weight", required: 3 }] }, liftRestriction);
  return m.verdict === "conditional" && m.condition_text && !m.excluded_because;
})());

// -- an able worker on all axes is safe -----------------------------------------------
ok("a duty is safe when the worker is not restricted on any axis it demands", matchDuty({ duty_id: "d6", duty_name: "Gatehouse monitoring", demands: [{ axis: "sitting", kind: "hours", required: 8 }] }, {}).verdict === "safe");

// -- legacy R code with no measurement suppresses the match (Section 5) ---------------
ok("a legacy R code with no measurement makes the duty conditional and routes to a coordinator", (() => {
  const m = matchDuty({ duty_id: "d7", duty_name: "Anything", demands: [] }, { lifting_general: { capability: "limited", legacyNoMeasurement: true } });
  return m.verdict === "conditional" && m.unmapped_demand === true && m.condition_text.includes("historical label");
})());

// -- no job profile publishes nothing (criterion 3, Section 5) ------------------------
ok("criterion 3: no job profile publishes nothing and routes to the coordinator", (() => {
  const r = matchDuties([], liftRestriction);
  return r.published === false && r.reason === "no-job-profile" && r.lines.length === 0;
})());
ok("criterion 3: an empty match is not an error and produces no employer view", matchDuties(null, {}).published === false);

// -- a real profile produces safe, conditional and excluded lines with a summary ------
const profile = [
  { duty_id: "f", duty_name: "Camera monitoring", demands: [{ axis: "overhead_reaching", kind: "binary", required: false }, { axis: "lifting_floor_to_waist", kind: "weight", required: 0 }] },
  { duty_id: "b", duty_name: "Overhead crane", demands: [{ axis: "overhead_reaching", kind: "binary", required: true }] },
  { duty_id: "c", duty_name: "Stock shelving", demands: [{ axis: "lifting_floor_to_waist", kind: "weight", required: 7 }] },
  { duty_id: "e", duty_name: "Yard patrol", demands: [{ axis: "walking", kind: "hours", required: 4 }] },
];
const restrictions = { overhead_reaching: { capability: "unable" }, lifting_floor_to_waist: { capability: "limited", quantity_kind: "weight", capacityKg: 5 } };
const result = matchDuties(profile, restrictions);
ok("a duty that rates the restricted axes as not stressed is safe", result.lines.find((l) => l.duty_id === "f").verdict === "safe");
ok("a job profile produces safe, conditional and excluded verdicts", result.published && result.summary.safe === 1 && result.summary.excluded === 2 && result.summary.conditional === 1);

// -- the match output carries NO raw measurement and NO restriction value -------------
ok("criterion 2: the duty match output contains no raw measurement", rawMeasurementInPayload(result).length === 0);
ok("no verdict reason leaks a number (no kilograms, no hours, no band)", result.lines.every((l) => !/\d/.test((l.excluded_because || "") + (l.condition_text || ""))));

// -- expired and withdrawn restriction sets (criterion 8) -----------------------------
ok("criterion 8: a set past effective_to renders as expired, never current", restrictionSetState({ effective_to: "2026-07-01" }, "2026-08-10") === "expired");
ok("a current set renders as current", restrictionSetState({ effective_to: "2026-12-31" }, "2026-08-10") === "current");
ok("a withdrawn set renders as withdrawn", restrictionSetState({ withdrawn_at: "2026-08-05T00:00:00Z", effective_to: "2026-12-31" }, "2026-08-10") === "withdrawn");

console.log("\nduty match suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
