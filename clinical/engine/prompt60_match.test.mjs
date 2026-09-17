/* Continuum Prompt 60 Sections 3 and 4 match suite. Proves the three-way
   split on SYNTH, named restriction faces, unmapped loud fail, unscored
   and ai_drafted never safe, past review date, assignment-only night
   shift, graduated hours do not exclude, security lone post names
   restriction and factor rating, binding constraint fact, and
   coordinator acknowledgment. Physical matchDuty is not imported as the
   matcher. No dashes anywhere. */

import { SYNTH_POSITIONS, SYNTHETIC, allSynthDuties } from "../db/occupational_synth.data.mjs";
import { frequencyBandFromPercent } from "./c1447_factors.mjs";
import { makeRestriction } from "./prompt60_restriction_codes.mjs";
import {
  matchPrompt60Duty, matchPrompt60Duties, assignConditionalDuty, assignDuty,
  bindingConstraintFact, loudUnmappedFail, EXCLUDED_BY_PREFIX,
  CONDITIONAL_PAST_REVIEW, CONDITIONAL_UNSCORED, UNMAPPED_COORDINATOR,
  employerReasonHasValueDigit,
} from "./prompt60_match.mjs";
import { rawMeasurementInPayload } from "./employer_schema.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const duties = allSynthDuties();
const byName = (name) => duties.find((d) => d.duty_name === name);
const yard = byName("Yard foot patrol");
const gate = byName("Gatehouse monitoring");
const visitor = byName("Visitor log entry");
const bins = byName("Light bin sorting");
const climb = byName("Perimeter climb inspection");

ok("SYNTHETIC remains true", SYNTHETIC === true);
ok("SYNTH still has 6 positions", SYNTH_POSITIONS.length === 6);
ok("SYNTH still has 13 duties", duties.length === 13);
ok("every position and duty id is SYNTH prefixed", SYNTH_POSITIONS.every((p) => /^SYNTH-POS-/.test(p.position_id) && p.duties.every((d) => /^SYNTH-DUTY-/.test(d.duty_id))));
ok("a safety_sensitive unaccompanied duty exists (security case)", yard && yard.position_classification === "safety_sensitive" && yard.task_descriptors.unaccompanied_posting === true);
ok("at least one duty has screen_minutes set and one has null", duties.some((d) => d.screen_minutes != null) && duties.some((d) => d.screen_minutes == null));
ok("at least one factor is unscored on a duty", duties.some((d) => (d.cognitive_demands || []).some((s) => s.source === "unscored")));
ok("at least one ai_drafted score exists", duties.some((d) => (d.cognitive_demands || []).some((s) => s.source === "ai_drafted")));
ok("custom slots keep retrieved wording without normalising", gate.custom_demand_slots[0].summary_extract === "14.Additional tasks:" && gate.custom_demand_slots[1].summary_extract === "15. Additional tasks:");
ok("5.5 on visitor log attention is derived occasional", visitor.cognitive_demands.find((s) => s.factor_id === 2).frequency_band === "occasional");
ok("missing percent on yard factor 9 is UNKNOWN, never 0", yard.cognitive_demands.find((s) => s.factor_id === 9).frequency_band === "UNKNOWN" && yard.cognitive_demands.find((s) => s.factor_id === 9).frequency_percent !== 0);
ok("frequencyBandFromPercent(5.5) is occasional", frequencyBandFromPercent(5.5) === "occasional");

const lone = makeRestriction("no_lone_work", { authored_by: "Dr SYNTH" });
const screen = makeRestriction("max_continuous_screen_minutes", { authored_by: "Dr SYNTH", value: { minutes: 90 } });
const single = makeRestriction("single_task_only_no_concurrent_demand", { authored_by: "Dr SYNTH" });
const hours = makeRestriction("graduated_hours", { authored_by: "Dr SYNTH", value: { hours_per_day: 4, days_per_week: 3 } });
const breaks = makeRestriction("scheduled_rest_breaks", { authored_by: "Dr SYNTH", value: { frequency: "hourly", duration: "10 min" } });
const night = makeRestriction("no_night_or_rotating_shift", { authored_by: "Dr SYNTH" });

const set = [lone, screen, hours, breaks];
const split = matchPrompt60Duties([visitor, bins, yard, gate], set, { asOfDate: "2026-09-17" });

ok("three-way split: visitor log is safe", split.lines.find((l) => l.duty_name === "Visitor log entry").verdict === "safe");
ok("three-way split: light bin sorting is conditional (unrecorded screen minutes)", split.lines.find((l) => l.duty_name === "Light bin sorting").verdict === "conditional");
ok("three-way split: yard and gatehouse are excluded", split.lines.find((l) => l.duty_name === "Yard foot patrol").verdict === "excluded" && split.lines.find((l) => l.duty_name === "Gatehouse monitoring").verdict === "excluded");
ok("ai_drafted factor 3 under single_task is conditional and draft", (() => {
  const withSingle = matchPrompt60Duty(bins, [single], { asOfDate: "2026-09-17" });
  return withSingle.verdict === "conditional" && withSingle.draft === true;
})());
ok("yard foot patrol is excluded by No lone work", (() => {
  const m = matchPrompt60Duty(yard, [lone], { asOfDate: "2026-09-17" });
  return m.verdict === "excluded" && m.excluded_because === "Excluded by: No lone work";
})());
ok("gatehouse is excluded by Max continuous screen minutes without leaking the minute value", (() => {
  const m = matchPrompt60Duty(gate, [screen], { asOfDate: "2026-09-17" });
  return m.verdict === "excluded" && m.excluded_because === "Excluded by: Max continuous screen minutes" && !employerReasonHasValueDigit(m);
})());
ok("employer safe list is only safe duties", split.employer_lines.every((l) => l.verdict === "safe") && !split.employer_lines.some((l) => l.duty_name === "Yard foot patrol"));

ok("security case names restriction and factor rating", (() => {
  const m = matchPrompt60Duty(yard, [lone], { asOfDate: "2026-09-17", assignment: { shift: "night", remote: true } });
  return m.verdict === "excluded"
    && m.excluded_because === "Excluded by: No lone work"
    && m.factor_rating
    && m.factor_rating.label === "Self-supervision"
    && m.factor_rating.intensity === "high"
    && m.coordinator_face.includes("No lone work")
    && m.coordinator_face.includes("Self-supervision")
    && m.coordinator_face.includes("high");
})());

ok("unmapped restriction fails loud and is never safe", (() => {
  const mystery = makeRestriction("not_a_real_code", { authored_by: "Dr SYNTH" });
  const m = matchPrompt60Duty(visitor, [mystery], { asOfDate: "2026-09-17" });
  const loud = loudUnmappedFail(mystery);
  return m.verdict !== "safe" && m.unmapped === true && m.loud_fail.message === UNMAPPED_COORDINATOR && loud.audience === "coordinator" && loud.employer_safe === false && m.employer_visible === false;
})());

ok("unscored factor tested by an active restriction is conditional, never safe", (() => {
  const bare = {
    ...visitor,
    cognitive_demands: visitor.cognitive_demands.map((s) => s.factor_id === 3 ? { ...s, source: "unscored", intensity: null } : s),
  };
  const m2 = matchPrompt60Duty(bare, [single], { asOfDate: "2026-09-17" });
  return m2.verdict === "conditional" && m2.condition_text === CONDITIONAL_UNSCORED && m2.restriction_label === "Single task only, no concurrent demand";
})());

ok("ai_drafted score on a tested factor is conditional, never safe, and marked draft", (() => {
  const m = matchPrompt60Duty(bins, [single], { asOfDate: "2026-09-17" });
  return m.verdict === "conditional" && m.draft === true && m.restriction_label === "Single task only, no concurrent demand";
})());

ok("restriction with no clinician author is not a restriction; duties conditional", (() => {
  const unsigned = makeRestriction("no_lone_work", { authored_by: null });
  const m = matchPrompt60Duty(yard, [unsigned], { asOfDate: "2026-09-17" });
  return unsigned.is_restriction === false && m.verdict === "conditional" && m.outstanding_action === "restriction_no_clinician_author" && m.verdict !== "safe";
})());

ok("past review date moves a would-be-safe duty to conditional", (() => {
  const expired = makeRestriction("no_lone_work", { authored_by: "Dr SYNTH", review_or_expiry_date: "2026-09-01" });
  const m = matchPrompt60Duty(visitor, [expired], { asOfDate: "2026-09-17" });
  return m.verdict === "conditional" && m.condition_text === CONDITIONAL_PAST_REVIEW && m.restriction_label === "No lone work";
})());

ok("past review never silently lapses an exclusion into permission", (() => {
  const expired = makeRestriction("no_lone_work", { authored_by: "Dr SYNTH", review_or_expiry_date: "2026-09-01" });
  const m = matchPrompt60Duty(yard, [expired], { asOfDate: "2026-09-17" });
  return m.verdict === "excluded" && m.excluded_because === "Excluded by: No lone work";
})());

ok("no_night_or_rotating_shift excludes the assignment, not the duty definition", (() => {
  const bare = matchPrompt60Duty(yard, [night], { asOfDate: "2026-09-17" });
  const assigned = matchPrompt60Duty(yard, [night], { asOfDate: "2026-09-17", assignment: { shift: "night" } });
  return bare.verdict !== "excluded" && assigned.verdict === "excluded" && assigned.assignment_excluded === true && assigned.excluded_because === "Excluded by: No night or rotating shift";
})());

ok("graduated_hours and scheduled_rest_breaks do not exclude duties", (() => {
  const m = matchPrompt60Duties([visitor, gate, bins], [hours, breaks], { asOfDate: "2026-09-17" });
  return m.lines.every((l) => l.verdict !== "excluded");
})());

ok("every excluded and conditional line names the restriction display_label", (() => {
  const m = matchPrompt60Duties([yard, bins, gate], [lone, single, screen], { asOfDate: "2026-09-17" });
  return m.lines.filter((l) => l.verdict !== "safe").every((l) => typeof l.restriction_label === "string" && l.restriction_label.length > 0);
})());

ok("excluded face uses Excluded by: prefix", EXCLUDED_BY_PREFIX === "Excluded by: ");

ok("binding constraint fact uses Calliope shape when more than half are excluded", (() => {
  const lines = [
    { verdict: "excluded", restriction_label: "No lone work" },
    { verdict: "excluded", restriction_label: "No lone work" },
    { verdict: "excluded", restriction_label: "No driving as duty" },
    { verdict: "safe", restriction_label: null },
  ];
  const fact = bindingConstraintFact(lines);
  return fact.text === "No lone work accounts for 2 of 3 exclusions";
})());

ok("binding constraint missing counts are UNKNOWN, never 0", (() => {
  const fact = bindingConstraintFact(null);
  return fact.excluded === "UNKNOWN" && fact.total_exclusions === "UNKNOWN";
})());

ok("safety_sensitive conditional duty refuses assign without acknowledgment and logs it", (() => {
  const m = matchPrompt60Duty(bins, [single], { asOfDate: "2026-09-17" });
  const refused = assignConditionalDuty(bins, m, null);
  const allowed = assignDuty(bins, m, { recorded: true, by: "Coord SYNTH", at: "2026-09-17" });
  return m.verdict === "conditional" && refused.assigned === false && refused.log[0].event === "assignment_refused_no_acknowledgment" && allowed.assigned === true;
})());

ok("unmapped is not published to the employer as safe", (() => {
  const mystery = makeRestriction("totally_unknown", { authored_by: "Dr SYNTH" });
  const m = matchPrompt60Duties([visitor], [mystery], { asOfDate: "2026-09-17" });
  return m.employer_lines.length === 0 && m.coordinator_alerts.length === 1 && m.coordinator_alerts[0].message === UNMAPPED_COORDINATOR;
})());

ok("Prompt 60 match payload has no raw measurement leak", rawMeasurementInPayload(split).length === 0);
ok("employer excluded reason has no restriction value digits", !employerReasonHasValueDigit(matchPrompt60Duty(gate, [screen], { asOfDate: "2026-09-17" })));

ok("climb at heights is excluded by No work at heights", (() => {
  const m = matchPrompt60Duty(climb, [makeRestriction("no_work_at_heights", { authored_by: "Dr SYNTH" })], { asOfDate: "2026-09-17" });
  return m.verdict === "excluded" && m.excluded_because === "Excluded by: No work at heights";
})());

ok("live then cached then empty restrictions (safe default)", (() => {
  const live = matchPrompt60Duty(visitor, [lone], { asOfDate: "2026-09-17" });
  const cached = matchPrompt60Duty(visitor, null, { asOfDate: "2026-09-17", cached_restrictions: [lone] });
  const empty = matchPrompt60Duty(visitor, null, { asOfDate: "2026-09-17" });
  return live.verdict === cached.verdict && empty.verdict === "safe";
})());

console.log("\nPrompt 60 match suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
