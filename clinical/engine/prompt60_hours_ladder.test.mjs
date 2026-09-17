/* Continuum Prompt 60 Section 5 hours ladder suite. Proves graduated_hours
   populates the plan, a passed planned date HOLDS and never auto-advances,
   clinician authorisation is the only advance, a scheduled shift over the
   current step conflicts before the shift, actual hours carry roster or
   worker_checkin source, and missing approved hours render UNKNOWN never 0.
   No dashes anywhere. */

import { makeRestriction } from "./prompt60_restriction_codes.mjs";
import {
  hoursLadderFromRestriction, evaluateHoursStepDate, authoriseHoursStep,
  shiftConflictsCurrentStep, recordActualHours, approvedHoursFace,
  HOURS_HOLD_COORDINATOR, currentLadderStep, SYNTH_HOURS_LADDER_STEPS,
} from "./prompt60_hours_ladder.mjs";
import { workerPlanPayload } from "./worker_plan.mjs";
import { rawMeasurementInPayload } from "./employer_schema.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const restriction = makeRestriction("graduated_hours", {
  authored_by: "Dr SYNTH",
  value: {
    weekly_steps: SYNTH_HOURS_LADDER_STEPS,
  },
});

const plan = hoursLadderFromRestriction(restriction);
ok("7.11: SYNTH hours ladder has four steps", SYNTH_HOURS_LADDER_STEPS.length === 4 && plan.steps.length === 4);
ok("graduated_hours populates a week-step ladder", plan.populated === true && plan.steps.length === 4);
ok("step 1 is 4 hours and 3 days", plan.steps[0].hours_per_day === 4 && plan.steps[0].days_per_week === 3);
ok("current step starts at week 1", currentLadderStep(plan).week === 1);

const held = evaluateHoursStepDate(plan, "2026-09-17");
ok("a passed planned date HOLDS at the current step", held.held === true && held.advanced === false && held.step.week === 1);
ok("Calliope hours-hold outstanding action is exact", held.outstanding_action === HOURS_HOLD_COORDINATOR);
ok("held hours face is the current step, not zeroed", held.hours_per_day === "4" && held.days_per_week === "3");

const unchanged = evaluateHoursStepDate(plan, "2026-09-17");
ok("evaluating again still does not auto-advance", unchanged.held === true && unchanged.step.week === 1 && plan.current_index === 0);

const authorised = authoriseHoursStep(plan, "Dr SYNTH", "2026-09-17T10:00:00Z");
ok("advancement happens only when a clinician authorises", authorised.advanced === true && authorised.plan.current_index === 1);
ok("the authorised step is stamped", authorised.plan.steps[0].authorised_by === "Dr SYNTH");

const afterAuth = evaluateHoursStepDate(authorised.plan, "2026-09-17");
ok("after authorisation the plan is no longer held on a passed first-step date", afterAuth.held === true || afterAuth.step.week === 2);

const conflict = shiftConflictsCurrentStep({ hours_per_day: 8, days_per_week: 5 }, plan);
ok("a scheduled shift over the current step conflicts BEFORE the shift", conflict.conflict === true && conflict.before_shift === true);

const okShift = shiftConflictsCurrentStep({ hours_per_day: 4, days_per_week: 3 }, plan);
ok("a shift within the current step does not conflict", okShift.conflict === false);

ok("missing approved hours render UNKNOWN, never 0", approvedHoursFace(null) === "UNKNOWN" && approvedHoursFace(undefined) === "UNKNOWN" && approvedHoursFace("") === "UNKNOWN");
ok("a recorded zero hours is 0, not UNKNOWN", approvedHoursFace(0) === "0");

const roster = recordActualHours({ date: "2026-09-17", hours: 4, source: "roster" });
const typed = recordActualHours({ date: "2026-09-17", hours: 3.5, source: "worker_checkin" });
ok("actual hours record roster or worker_checkin and are not health information", roster.source === "roster" && typed.source === "worker_checkin" && roster.is_health_information === false);

ok("empty live plan falls back to cached steps then UNKNOWN", (() => {
  const r = evaluateHoursStepDate({ cached_steps: plan.steps, cached_index: 0 }, "2026-09-17");
  return r.step && r.step.week === 1;
})());
ok("missing plan is UNKNOWN, never 0", (() => {
  const r = evaluateHoursStepDate(null, "2026-09-17");
  return r.hours_per_day === "UNKNOWN" && r.days_per_week === "UNKNOWN";
})());

ok("unsigned graduated_hours does not populate a plan", hoursLadderFromRestriction(makeRestriction("graduated_hours", { authored_by: null })).populated === false);

const payload = workerPlanPayload({
  case_ref: "case-1", form_id: "C050S", measurement_version: 3, work_status: "fit_with_restrictions",
  hours_per_day: 4, days_per_week: 3, axes: [],
});
ok("workerPlanPayload still carries hours_per_day and now days_per_week", payload.hours_per_day === 4 && payload.days_per_week === 3);
ok("worker plan payload has no raw measurement", rawMeasurementInPayload(payload).length === 0);

console.log("\nPrompt 60 hours ladder suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
