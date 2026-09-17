/* Continuum Prompt 61 Section 5.3: hours ladder reuse.

   Does not rebuild prompt60_hours_ladder.mjs. The platform NEVER
   auto-advances. Actual hours come from roster or the worker's own
   confirmation of hours worked. That confirmation is not health
   information. Record which source was used.

   No dashes anywhere. */

import {
  evaluateHoursStepDate,
  hoursLadderFromRestriction,
  authoriseHoursStep,
  shiftConflictsCurrentStep,
  approvedHoursFace,
  HOURS_HOLD_COORDINATOR,
  SYNTH_HOURS_LADDER_STEPS,
} from "./prompt60_hours_ladder.mjs";

export {
  evaluateHoursStepDate,
  hoursLadderFromRestriction,
  authoriseHoursStep,
  shiftConflictsCurrentStep,
  approvedHoursFace,
  HOURS_HOLD_COORDINATOR,
  SYNTH_HOURS_LADDER_STEPS,
};

export const HOURS_SOURCES = Object.freeze(["roster", "worker_confirmation"]);

export function recordPsychHours(entry) {
  const src = entry || {};
  const source = HOURS_SOURCES.includes(src.source) ? src.source : null;
  return {
    date: src.date || null,
    hours: src.hours != null ? src.hours : null,
    source,
    is_health_information: false,
    accepted: source != null && src.hours != null,
  };
}

export function hoursPlanAdherence(planEval, actual) {
  const approved = planEval && planEval.hours_per_day;
  if (approved == null || approved === "" || approved === "UNKNOWN") {
    return { followed: "UNKNOWN", departed_by: "UNKNOWN", approved: "UNKNOWN", actual: actual && actual.hours != null ? actual.hours : "UNKNOWN" };
  }
  if (!actual || actual.hours == null) {
    return { followed: "UNKNOWN", departed_by: "UNKNOWN", approved, actual: "UNKNOWN" };
  }
  const dep = Number(actual.hours) - Number(approved);
  return {
    followed: dep === 0,
    departed_by: dep,
    approved: Number(approved),
    actual: Number(actual.hours),
    source: actual.source || null,
  };
}
