/* Continuum Prompt 61 Sections 3 and 4: psych restriction match.

   Amends Prompt 60 structures. Does not rebuild C1447. Does not
   replace prompt60_match.mjs. New codes and mappings live on the
   Prompt 60 catalogue and map. This module names the psych pathway
   and the security-case helper.

   Every excluded and conditional duty names the restriction.
   Unmapped fails loud. No dashes anywhere. */

import { allSynthDuties } from "../db/occupational_synth.data.mjs";
import { makeRestriction } from "./prompt60_restriction_codes.mjs";
import {
  matchPrompt60Duty,
  matchPrompt60Duties,
  assignConditionalDuty,
  assignDuty,
  bindingConstraintFact,
  loudUnmappedFail,
  EXCLUDED_BY_PREFIX,
  CONDITIONAL_PAST_REVIEW,
  CONDITIONAL_UNSCORED,
  UNMAPPED_COORDINATOR,
} from "./prompt60_match.mjs";

export {
  matchPrompt60Duty as matchPrompt61Duty,
  matchPrompt60Duties as matchPrompt61Duties,
  assignConditionalDuty,
  assignDuty,
  bindingConstraintFact,
  loudUnmappedFail,
  EXCLUDED_BY_PREFIX,
  CONDITIONAL_PAST_REVIEW,
  CONDITIONAL_UNSCORED,
  UNMAPPED_COORDINATOR,
  makeRestriction,
};

export const SECURITY_CASE_RESTRICTIONS = Object.freeze([
  "no_lone_work",
  "no_night_or_rotating_shift",
  "no_assignment_to_specified_site",
  "graduated_hours",
]);

export function synthSecurityCaseRestrictions() {
  return [
    makeRestriction("no_lone_work", { authored_by: "Dr SYNTH" }),
    makeRestriction("no_night_or_rotating_shift", { authored_by: "Dr SYNTH" }),
    makeRestriction("no_assignment_to_specified_site", {
      authored_by: "Dr SYNTH",
      value: { site_ref: "SYNTH-SITE-A" },
    }),
    makeRestriction("graduated_hours", {
      authored_by: "Dr SYNTH",
      value: { hours_per_day: 4, days_per_week: 3 },
    }),
  ];
}

export function runSecurityCaseMatch(context) {
  const duties = allSynthDuties();
  const restrictions = synthSecurityCaseRestrictions();
  return matchPrompt60Duties(duties, restrictions, context || {
    asOfDate: "2026-09-17",
    assignment: { shift: "night", site_id: "SYNTH-SITE-A" },
  });
}
