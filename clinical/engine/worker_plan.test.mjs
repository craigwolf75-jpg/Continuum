/* Continuum Prompt 39 worker plan projection suite (criterion 8). Proves the worker
   plan payload carries the derived band and never a raw measurement. Uses the shared
   employer_schema scanner so a raw key fails the build. No dashes anywhere. */

import { workerPlanPayload, bandPlainLanguage } from "./worker_plan.mjs";
import { rawMeasurementInPayload } from "./employer_schema.mjs";
import { deriveWeightBand } from "./measurement.mjs";
import { matchDuties } from "./dutymatch.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const signedAxes = [
  { axis: "lifting_floor_to_waist", skipped: false, capability: "limited", derived_band: "LIMITED", derived_capability_code: "LIMITED", measured_weight_kg: 8, measured_hours: null, source: "measured" },
  { axis: "sitting", skipped: false, capability: "able", derived_band: null, derived_capability_code: "ABLE", measured_hours: 6, source: "measured" },
];

const plan = workerPlanPayload({
  case_ref: "case-1", form_id: "C050S", measurement_version: 3, work_status: "fit_with_restrictions", hours_per_day: 6, axes: signedAxes,
});

ok("an 8 kg measurement projects LIMITED, not 8", plan.axes[0].derived_band === "LIMITED" && plan.axes[0].band_plain_language === "about 5 kilograms");
ok("the worker plan axis rows do not copy measured_weight_kg", plan.axes.every((a) => !Object.prototype.hasOwnProperty.call(a, "measured_weight_kg")));
ok("the worker plan axis rows do not copy measured_hours", plan.axes.every((a) => !Object.prototype.hasOwnProperty.call(a, "measured_hours")));
ok("criterion 8: worker plan payload contains no raw measurement key", rawMeasurementInPayload(plan).length === 0);
ok("the JSON export of the worker plan does not contain the raw 8", !JSON.stringify(plan).includes("8"));

const derived = deriveWeightBand(8);
const duties = [{ duty_id: "d1", duty_name: "Light assembly", demands: [{ axis: "lifting_floor_to_waist", kind: "weight", required: 4 }] }];
const match = matchDuties(duties, { lifting_floor_to_waist: { capability: "limited", quantity_kind: "weight", capacityKg: 5 } });
ok("criterion 8: employer duty match payload contains no raw measurement key", rawMeasurementInPayload(match).length === 0);
ok("the match capacity is the LIMITED band (5), matching the worker plan band", derived.band === "LIMITED" && plan.axes[0].band_capacity_kg === 5);

ok("HEAVY plain language is over 20 kilograms", bandPlainLanguage("HEAVY") === "over 20 kilograms");
ok("a skipped axis still has no raw keys", (() => {
  const p = workerPlanPayload({ axes: [{ axis: "walking", skipped: true, derived_band: null, derived_capability_code: null, measured_hours: 3 }] });
  return p.axes[0].skipped === true && rawMeasurementInPayload(p).length === 0;
})());

console.log("\nworker plan suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
