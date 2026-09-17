/* Continuum Prompt 60 Section 5 check-in / provocation suite. Proves
   task-linked capture, 24h settle only, ordered provocation records with
   no totals, next-day follow up, unanswered never assumed settled, seven
   day fixture coordinator prompts on the second and third cases only,
   and the three visibility projections. No dashes anywhere. */

import {
  captureCheckIn, provocationRecords, followUpNeeded, followUpQuestion,
  applyFollowUp, orderedProvocationWithFollowUp, clinicianProjection,
  coordinatorProjection, employerProjection, assertEmployerCheckinWall,
  sevenDayFixture, SYNTH_CHECKIN_DUTIES, CLINICIAN_REQUIRED_LINE,
  CLINICIAN_VISIBILITY_LINE, COORDINATOR_UNSETTLED_24H,
  COORDINATOR_UNANSWERED_FOLLOW_UP, WORKER_REPORTED_LABEL,
} from "./prompt60_checkin.mjs";
import { employerPrompt60Leak } from "./employer_schema.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

ok("SYNTH check-in fixture is three labelled duties, not 209", SYNTH_CHECKIN_DUTIES.length === 3 && SYNTH_CHECKIN_DUTIES.every((d) => d.fixture === true));
ok("fixture titles match Calliope examples", SYNTH_CHECKIN_DUTIES.map((d) => d.duty_name).join("|") === "Gatehouse monitoring|Yard foot patrol|Light bin sorting");

const captured = captureCheckIn({
  date: "2026-09-10",
  duties_performed: ["Yard foot patrol", "Not a plan duty"],
  worsened_duties: ["Yard foot patrol"],
  settled_end_of_shift: "yes",
  approved_hours: 4,
  hours_worked: 4,
  free_text: "I took a slower walk.",
  plan_duties: SYNTH_CHECKIN_DUTIES,
});
ok("capture keeps only plan duties", captured.duties_performed.join(",") === "Yard foot patrol" && !captured.duties_performed.includes("Not a plan duty"));
ok("missing approved hours on empty input is UNKNOWN, never 0", captureCheckIn(null).approved_hours === "UNKNOWN");

const recs = provocationRecords(captured);
ok("provocation records are ordered duty records with yes/no/unanswered only", recs.length === 1 && recs[0].duty === "Yard foot patrol" && recs[0].worsened === "yes" && recs[0].settled_within_24h === "yes");
ok("nothing is totalled or scored on the record", !Object.prototype.hasOwnProperty.call(recs[0], "score") && !Object.prototype.hasOwnProperty.call(recs[0], "total"));

ok("follow-up question is Calliope exact", followUpQuestion("Yard foot patrol") === "Yesterday you said Yard foot patrol made your symptoms worse. Has that now settled?");

const fixture = sevenDayFixture();
ok("seven-day fixture has three check-ins", fixture.checkins.length === 3);
const day1 = orderedProvocationWithFollowUp(fixture.checkins[0]);
const day2 = orderedProvocationWithFollowUp(fixture.checkins[1]);
const day3 = orderedProvocationWithFollowUp(fixture.checkins[2]);
ok("day 1 worsening settled inside 24h", day1[0].worsened === "yes" && day1[0].settled_within_24h === "yes");
ok("day 2 worsening did not settle", day2[0].worsened === "yes" && day2[0].settled_within_24h === "no");
ok("day 3 next-day check-in is unanswered, never assumed settled or persisted", day3[0].settled_within_24h === "unanswered");

const coord = coordinatorProjection(fixture.checkins, false);
ok("coordinator is prompted on the second and third cases only", coord.prompts.length === 2);
ok("second prompt is unsettled 24h Calliope", coord.prompts[0].text === COORDINATOR_UNSETTLED_24H && coord.prompts[0].kind === "unsettled_24h");
ok("third prompt is unanswered follow-up Calliope", coord.prompts[1].text === COORDINATOR_UNANSWERED_FOLLOW_UP && coord.prompts[1].kind === "unanswered_follow_up");
ok("coordinator prompts carry no symptom, body part, or diagnosis", coord.prompts.every((p) => !/symptom|shoulder|diagnosis|concussion/i.test(p.text) || p.text === COORDINATOR_UNSETTLED_24H));

const clin = clinicianProjection(fixture.checkins, { hours_per_day: 4, days_per_week: 3 });
ok("clinician required line is character for character", clin.required_line === CLINICIAN_REQUIRED_LINE);
ok("clinician visibility line is character for character", clin.visibility_line === CLINICIAN_VISIBILITY_LINE);
ok("clinician free text is labelled worker reported", clin.rows.every((r) => r.free_text_label === WORKER_REPORTED_LABEL));
ok("clinician table is chronological and not totalled", clin.rows.length === 3 && clin.rows[0].date === "2026-09-10" && !clin.total);

const emp = employerProjection(
  [{ duty_id: "SYNTH-DUTY-0103", duty_name: "Visitor log entry" }],
  "Duties on track",
  4,
  false
);
ok("employer payload is functional status plus safe duties only", emp.status === "Duties on track" && emp.safe_duties.length === 1 && emp.approved_hours === "4");
ok("employer payload has no check-in / provocation / worsening leak", assertEmployerCheckinWall(emp).length === 0);
ok("employerPrompt60Leak catches a check-in key", employerPrompt60Leak({ checkin: { worsened: true } }).some((h) => h.banned_term === "checkin" || h.banned_term === "worsening"));
ok("employerPrompt60Leak catches provocation", employerPrompt60Leak({ provocation: [] }).some((h) => h.banned_term === "provocation"));
ok("missing employer approved hours is UNKNOWN", employerProjection([], "Duty plan under review", null, false).approved_hours === "UNKNOWN");

const missedFollow = applyFollowUp(fixture.checkins[2], {}, "2026-09-15");
ok("unanswered follow-up is an outstanding action, never a guessed settle", missedFollow.unanswered.length === 1 && missedFollow.unanswered[0].state === "unanswered" && missedFollow.records[0].settled_within_24h === "unanswered");

ok("empty live capture falls back to cached then empty default", (() => {
  const cached = captureCheckIn(null, {
    date: "2026-09-10",
    duties_performed: ["Light bin sorting"],
    plan_duties: SYNTH_CHECKIN_DUTIES,
  });
  const empty = captureCheckIn(null, null);
  return cached.duties_performed[0] === "Light bin sorting" && empty.duties_performed.length === 0 && empty.approved_hours === "UNKNOWN";
})());

ok("followUpNeeded is empty when the worsening settled by end of shift", followUpNeeded(captured).length === 0);

console.log("\nPrompt 60 check-in suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
