/* Continuum Prompt 61 pathway suite. SYNTH only. No dashes. */

import { allSynthDuties } from "../db/occupational_synth.data.mjs";
import { makeRestriction } from "./prompt60_restriction_codes.mjs";
import { CASE_TYPE_PSYCHOLOGICAL_INJURY, REMOVED_SURFACES, RETAINED_SURFACES, acceptSymptomCheckIn, surfacesFor } from "./prompt61_surfaces.mjs";
import { walkPsychPathway, rejectSymptomCheckIn, openPsychologicalInjuryCase } from "./prompt61_pathway.mjs";
import { employerConductReport, aggregateSiteConduct, sortPsychCases, snapshotAtClaim, K_MIN_DEFAULT } from "./prompt61_conduct.mjs";
import { silentDays } from "./prompt61_silent_days.mjs";
import { evaluateHoursStepDate, hoursLadderFromRestriction, SYNTH_HOURS_LADDER_STEPS, HOURS_HOLD_COORDINATOR } from "./prompt61_hours.mjs";
import { assembleBoardEvidence, fileBoardEvidence } from "./prompt61_board_evidence.mjs";
import { storeNamedIndividual, visibleNamedIndividual, employerDashboardProjection, schedulerConstraint, logNamedIndividualAccess, exportOrIntelligenceView, COUNSEL_REVIEW, PRIVACY_OFFICER_WORDING } from "./prompt61_named_individual.mjs";
import { AUTOMATED_DETECTION_EXISTS, automatedDetection, coordinatorEscalation, persistentSupportLink, inspectOutboundCalls, psychFreeTextOutbound, CRISIS_LIST_CONFIRMED_BY_CRAIG } from "./prompt61_crisis.mjs";
import { recordAccommodation, C1447_WORKPLACE_ACCOMMODATIONS, C1447_TASK_ACCOMMODATIONS } from "./prompt61_accommodations.mjs";
import { matchPrompt61Duty, matchPrompt61Duties, runSecurityCaseMatch } from "./prompt61_match.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const duties = allSynthDuties();
const visitor = duties.find((d) => d.duty_name === "Visitor log entry");
const yard = duties.find((d) => d.duty_name === "Yard foot patrol");
const desk = duties.find((d) => d.duty_name === "Front desk reception");

ok("case type constant is psychological_injury", CASE_TYPE_PSYCHOLOGICAL_INJURY === "psychological_injury");
ok("removed list includes symptom_check_in", REMOVED_SURFACES.includes("symptom_check_in"));
ok("retained four surfaces", RETAINED_SURFACES.join(",") === "morning_duty_acknowledgment,secure_messaging,document_upload,hours_confirmation");
ok("psych surfaces have no symptom check-in and no toggle", (() => {
  const s = surfacesFor(CASE_TYPE_PSYCHOLOGICAL_INJURY);
  return s.symptom_check_in_exists === false && s.toggle_exists === false;
})());

ok("9.3 server rejects symptom payload", (() => {
  const row = openPsychologicalInjuryCase({ site: "SYNTH-SITE-B", shift_pattern: "nights", supervisor_ref: "SYNTH-SUP-1" });
  const r = rejectSymptomCheckIn(row, { pain_score: 4, worsened_duties: ["x"] });
  return r.accepted === false && r.code === "symptom_checkin_does_not_exist" && r.symptom_check_in_exists === false;
})());

ok("9.3 other case types still accept the concept of a check-in", acceptSymptomCheckIn("concussion", { free_text: "hi" }).accepted === true);

const walked = walkPsychPathway({
  site: "SYNTH-SITE-B",
  shift_pattern: "days",
  supervisor_ref: "SYNTH-SUP-1",
  restrictions: [
    makeRestriction("no_lone_work", { authored_by: "Dr SYNTH" }),
    makeRestriction("no_night_or_rotating_shift", { authored_by: "Dr SYNTH" }),
    makeRestriction("no_assignment_to_specified_site", { authored_by: "Dr SYNTH", value: { site_ref: "SYNTH-SITE-A" } }),
    makeRestriction("graduated_hours", { authored_by: "Dr SYNTH", value: { weekly_steps: SYNTH_HOURS_LADDER_STEPS.map((s) => ({ ...s })) } }),
  ],
  duties,
  match_context: { asOfDate: "2026-09-17", assignment: { shift: "night", site_id: "SYNTH-SITE-A" } },
  asOfDate: "2026-09-17",
  current_assignment: { site: "SYNTH-SITE-B", shift_pattern: "days", supervisor_ref: "SYNTH-SUP-1" },
});

ok("9.3 pathway opens and closes a psych case", walked.case.case_type === CASE_TYPE_PSYCHOLOGICAL_INJURY && walked.case.status === "closed");
ok("9.3 pathway symptom write is rejected", walked.symptom_rejected === true && walked.symptom_code === "symptom_checkin_does_not_exist");
ok("9.4 retained surfaces all accepted", walked.retained.morning_duty_acknowledgment && walked.retained.secure_messaging && walked.retained.document_upload && walked.retained.hours_confirmation);
ok("9.4 removed list is present on the case", walked.removed.includes("symptom_check_in") && walked.removed.includes("made_worse_question"));
ok("pathway never stored a symptom check-in row", walked.case.symptom_checkins.length === 0);

ok("9.5 security case every non-safe line names a restriction", walked.match.lines.filter((l) => l.verdict !== "safe").every((l) => typeof l.restriction_label === "string" && l.restriction_label.length > 0));
ok("9.5 yard excluded by No lone work", (() => {
  const line = walked.match.lines.find((l) => l.duty_name === "Yard foot patrol");
  return line && line.verdict === "excluded" && line.excluded_because === "Excluded by: No lone work";
})());
ok("9.5 night assignment excluded by No night or rotating shift on a non-lone duty", (() => {
  const m = matchPrompt61Duty(visitor, [makeRestriction("no_night_or_rotating_shift", { authored_by: "Dr SYNTH" })], { asOfDate: "2026-09-17", assignment: { shift: "night" } });
  return m.verdict === "excluded" && m.excluded_because === "Excluded by: No night or rotating shift" && m.assignment_excluded === true;
})());
ok("9.5 specified site excludes the assignment", (() => {
  const m = matchPrompt61Duty(visitor, [makeRestriction("no_assignment_to_specified_site", { authored_by: "Dr SYNTH", value: { site_ref: "SYNTH-SITE-A" } })], { asOfDate: "2026-09-17", assignment: { site_id: "SYNTH-SITE-A" } });
  return m.verdict === "excluded" && m.excluded_because === "Excluded by: No assignment to specified site";
})());
ok("9.5 graduated hours do not exclude duties", walked.match.lines.filter((l) => l.restriction_code === "graduated_hours" && l.verdict === "excluded").length === 0);

ok("9.6 conflict rule excludes factor 12 above not_required", (() => {
  const conflict = makeRestriction("no_conflict_or_crisis_response_duty", { authored_by: "Dr SYNTH" });
  const y = matchPrompt61Duty(yard, [conflict], { asOfDate: "2026-09-17" });
  const v = matchPrompt61Duty(visitor, [conflict], { asOfDate: "2026-09-17" });
  return y.verdict === "excluded" && y.excluded_because === "Excluded by: No conflict or crisis response duty" && v.verdict !== "excluded";
})());

ok("public facing excludes front desk on factor 10", (() => {
  const m = matchPrompt61Duty(desk, [makeRestriction("no_public_facing_duty", { authored_by: "Dr SYNTH" })], { asOfDate: "2026-09-17" });
  return m.verdict === "excluded" && m.excluded_because === "Excluded by: No public facing duty";
})());

ok("reduced caseload is conditional with the value shown", (() => {
  const stock = duties.find((d) => d.duty_name === "Floor to waist stocking");
  const m = matchPrompt61Duty(stock, [makeRestriction("reduced_caseload_or_task_volume", { authored_by: "Dr SYNTH", value: { percent: 50 } })], { asOfDate: "2026-09-17" });
  return m.verdict === "conditional" && String(m.condition_text).includes("Reduced caseload or task volume") && String(m.condition_text).includes("50");
})());

ok("9.7 unmapped fails loud", (() => {
  const m = matchPrompt61Duty(visitor, [makeRestriction("no_such_psych_code", { authored_by: "Dr SYNTH" })], { asOfDate: "2026-09-17" });
  return m.verdict !== "safe" && m.unmapped === true && m.employer_visible === false;
})());

ok("9.8 past review date is conditional", (() => {
  const expired = makeRestriction("no_public_facing_duty", { authored_by: "Dr SYNTH", review_or_expiry_date: "2026-09-01" });
  const m = matchPrompt61Duty(visitor, [expired], { asOfDate: "2026-09-17" });
  return m.verdict === "conditional" && m.condition_text === "Conditional: restriction past review date";
})());

ok("security helper returns a three-way capable split", (() => {
  const run = runSecurityCaseMatch();
  return run.summary.excluded >= 1 && run.lines.every((l) => l.verdict === "safe" || l.restriction_label);
})());

ok("2.4 accommodations vocabulary is present", C1447_WORKPLACE_ACCOMMODATIONS.includes("environment") && C1447_TASK_ACCOMMODATIONS.includes("caseload_reduction") && recordAccommodation("workplace", "location", "SYNTH").ok);

ok("9.9 claim date snapshot exists", walked.conduct.snapshot_present === true && walked.conduct.claim_date_snapshot.site === "SYNTH-SITE-B");
ok("9.9 offered is distinct from discussed", walked.conduct.modified_role_offered_is_distinct === true && walked.conduct.modified_role_offered_at === "2026-09-04" && walked.conduct.modified_role_discussed_at === "2026-09-03");
ok("9.9 days from restriction to first modified shift computes", walked.conduct.days_from_restriction_to_first_modified_shift === 3);
ok("9.9 same site comparison computes", walked.conduct.same_site === true && walked.conduct.same_supervisor === true);
ok("9.9 conduct is facts, not a score", walked.conduct.score === null && walked.conduct.named_manager_assessment === null);
ok("9.9 k_min suppresses small aggregates", aggregateSiteConduct([walked.conduct], K_MIN_DEFAULT).suppressed === true);
ok("9.9 k_min releases at 5", aggregateSiteConduct(Array(5).fill(walked.conduct), 5).suppressed === false && aggregateSiteConduct(Array(5).fill(walked.conduct), 5).score === null);

ok("silent days count days with no touch", silentDays([{ kind: "contact", at: "2026-09-01" }], "2026-09-01", "2026-09-03").days === 2);
ok("silent days missing range is UNKNOWN", silentDays([], null, "2026-09-03").days === "UNKNOWN");

ok("9.15 hours hold without clinician authorisation", (() => {
  const plan = hoursLadderFromRestriction(makeRestriction("graduated_hours", {
    authored_by: "Dr SYNTH",
    value: { weekly_steps: [{ week: 1, hours_per_day: 4, days_per_week: 3, planned_date: "2026-09-07" }] },
  }));
  const ev = evaluateHoursStepDate(plan, "2026-09-17");
  return ev.held === true && ev.advanced === false && ev.outstanding_action === HOURS_HOLD_COORDINATOR;
})());

ok("9.4 hours confirmation records worker_confirmation source", walked.case.hours_confirmations[0].source === "worker_confirmation" && walked.case.hours_confirmations[0].is_health_information === false);

ok("5.4 board evidence does not widen or auto submit", walked.evidence.widened === false && walked.evidence.auto_submit === false && walked.evidence.submitted === false);
ok("5.4 extras are ignored", assembleBoardEvidence(null, { worker_display_name: "A", claim_date: "2026-09-01", restriction_codes: [], hours_plan: {}, modified_role_offered_at: "2026-09-04", extra_field: "no" }).extras_ignored.includes("extra_field"));
ok("5.4 software cannot file without a human", fileBoardEvidence(walked.evidence, {}).submitted === false);

ok("6 named individual hidden on employer dashboard", (() => {
  const stored = storeNamedIndividual({ person_free_text: "SYNTH Person" }, { named_individual_restriction_enabled: true });
  const emp = employerDashboardProjection(stored);
  const sched = schedulerConstraint(stored);
  const visC = visibleNamedIndividual(stored, { role: "coordinator" });
  const visE = visibleNamedIndividual(stored, { role: "employer" });
  return stored.stored && emp.named_individual === null && sched.reason === null && sched.constraint.startsWith("cannot be co rostered with ") && visC.visible && !visE.visible;
})());
ok("6 access is logged", logNamedIndividualAccess({ person_ref: "u1" }, { user: "coord", at: "2026-09-17", purpose: "roster" }, []).entry.purpose === "roster");
ok("6 tenant disable works", storeNamedIndividual({ person_ref: "u1" }, { named_individual_restriction_enabled: false }).stored === false);
ok("6 export strips the name", exportOrIntelligenceView({ person_free_text: "X", other: 1 }, "export").payload.person_free_text == null);
ok("6 counsel STOP is reported, wording not invented", COUNSEL_REVIEW === "STOP" && PRIVACY_OFFICER_WORDING === null);

ok("8 no automated detection", AUTOMATED_DETECTION_EXISTS === false && automatedDetection("hello").ran === false && automatedDetection("hello").classification === null);
ok("8 persistent support link is unconditional", persistentSupportLink({ case_type: "concussion" }).always_visible && persistentSupportLink({}).conditional_on_worker_words === false);
ok("8 coordinator escalation is not a clinical finding", coordinatorEscalation({ triggered_by: "Coord SYNTH", recipient: null }).stored_as_clinical_finding === false);
ok("8.3 list not confirmed", CRISIS_LIST_CONFIRMED_BY_CRAIG === false && persistentSupportLink({}).live_list === null);
ok("9.11 no outbound classification calls", psychFreeTextOutbound("hello").allowed && inspectOutboundCalls([]).allowed);
ok("9.11 a classifier host would be blocked", inspectOutboundCalls([{ url: "https://example.invalid/moderation", purpose: "class" }]).allowed === false);

ok("9.14 sort only on administrative facts", sortPsychCases([{ outstanding_actions: 2 }, { outstanding_actions: 1 }], "outstanding_actions").ok && sortPsychCases([], "colour").ok === false);

ok("employerConductReport without snapshot comparison is UNKNOWN", employerConductReport({}).same_site === "UNKNOWN");
ok("snapshot helper records claim date fields", snapshotAtClaim({ site: "A", shift_pattern: "days", supervisor_ref: "S", claim_date: "2026-09-01" }).site === "A");

ok("matchPrompt61Duties empty duties is no-job-profile", matchPrompt61Duties([], [], {}).published === false);

console.log("\nPrompt 61 pathway suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
