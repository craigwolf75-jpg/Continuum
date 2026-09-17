/* Continuum Prompt 60 concussion pathway CI wrapper.
   suites.yml globs deploy/*.test.mjs. Re-proves engine invariants and
   scans only the Prompt 60 pathway files. Does not flag platform
   readiness (readinessGate, readiness_all_down). Does not flag
   clinical-dashboard.html. No live apply. No dashes. */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SYNTH_POSITIONS, SYNTHETIC, allSynthDuties } from "../clinical/db/occupational_synth.data.mjs";
import { C1447_FACTORS, frequencyBandFromPercent, CUSTOM_DEMAND_SLOTS } from "../clinical/engine/c1447_factors.mjs";
import { makeRestriction } from "../clinical/engine/prompt60_restriction_codes.mjs";
import {
  matchPrompt60Duty, matchPrompt60Duties, bindingConstraintFact,
  UNMAPPED_COORDINATOR,
} from "../clinical/engine/prompt60_match.mjs";
import { evaluateHoursStepDate, hoursLadderFromRestriction, approvedHoursFace, HOURS_HOLD_COORDINATOR, SYNTH_HOURS_LADDER_STEPS } from "../clinical/engine/prompt60_hours_ladder.mjs";
import { sevenDayFixture, coordinatorProjection, employerProjection, assertEmployerCheckinWall, CLINICIAN_REQUIRED_LINE } from "../clinical/engine/prompt60_checkin.mjs";
import { clinicianProjection } from "../clinical/engine/prompt60_checkin.mjs";
import { employerPrompt60Leak, bannedColumnsInSchema } from "../clinical/engine/employer_schema.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const DASH_RE = /[\u2013\u2014]/;

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

const PATHWAY = [
  "clinical/engine/c1447_factors.mjs",
  "clinical/engine/c1447_factors.test.mjs",
  "clinical/engine/prompt60_restriction_codes.mjs",
  "clinical/engine/prompt60_restriction_map.data.mjs",
  "clinical/engine/prompt60_match.mjs",
  "clinical/engine/prompt60_match.test.mjs",
  "clinical/engine/prompt60_hours_ladder.mjs",
  "clinical/engine/prompt60_hours_ladder.test.mjs",
  "clinical/engine/prompt60_checkin.mjs",
  "clinical/engine/prompt60_checkin.test.mjs",
  "clinical/db/occupational_synth.data.mjs",
  "clinical/db/023_migration_prompt60_restriction_and_hours.sql",
  "clinical/engine/employer_schema.mjs",
  "clinical/engine/worker_plan.mjs",
  "worker-app/src/components/CheckIn.tsx",
  "worker-app/src/components/History.tsx",
  "worker-app/src/lib/queue.ts",
  "worker-app/src/lib/types.ts",
  "worker-app/src/lib/prompt60_checkin_store.ts",
  "deploy/worker/check-in.html",
  "docs/prompts/60/ACCEPTANCE.md",
];

const SECTION6_FILES = PATHWAY.filter((f) => f !== "deploy/prompt60-concussion.test.mjs");

ok("SYNTHETIC is still true", SYNTHETIC === true);
ok("SYNTH still 6 positions", SYNTH_POSITIONS.length === 6);
ok("SYNTH still 13 duties", allSynthDuties().length === 13);
ok("thirteen C1447 labels", C1447_FACTORS.length === 13 && C1447_FACTORS[0].label === "Short-term memory and recall");
ok("5.5 derives occasional", frequencyBandFromPercent(5.5) === "occasional");
ok("missing percent is UNKNOWN", frequencyBandFromPercent(null) === "UNKNOWN");
ok("custom slots keep form wording", CUSTOM_DEMAND_SLOTS[0].summary_extract === "14.Additional tasks:" && CUSTOM_DEMAND_SLOTS[1].summary_extract === "15. Additional tasks:");

const duties = allSynthDuties();
const yard = duties.find((d) => d.duty_name === "Yard foot patrol");
const visitor = duties.find((d) => d.duty_name === "Visitor log entry");
const gate = duties.find((d) => d.duty_name === "Gatehouse monitoring");
const bins = duties.find((d) => d.duty_name === "Light bin sorting");
const lone = makeRestriction("no_lone_work", { authored_by: "Dr SYNTH" });
const screen = makeRestriction("max_continuous_screen_minutes", { authored_by: "Dr SYNTH", value: { minutes: 90 } });
const night = makeRestriction("no_night_or_rotating_shift", { authored_by: "Dr SYNTH" });
const split = matchPrompt60Duties([visitor, bins, yard, gate], [lone, screen, night], { asOfDate: "2026-09-17" });
ok("7.4 every excluded and conditional line names a restriction", split.lines.filter((l) => l.verdict !== "safe").every((l) => l.restriction_label));
ok("three-way split still holds on SYNTH", split.summary.safe >= 1 && split.summary.conditional >= 1 && split.summary.excluded >= 1);
ok("yard excluded by No lone work", matchPrompt60Duty(yard, [lone], { asOfDate: "2026-09-17" }).excluded_because === "Excluded by: No lone work");
ok("unmapped is never safe", matchPrompt60Duty(visitor, [makeRestriction("no_such_code", { authored_by: "Dr SYNTH" })], { asOfDate: "2026-09-17" }).verdict !== "safe");
ok("unmapped coordinator face is exact", UNMAPPED_COORDINATOR.startsWith("Unmapped restriction."));
ok("binding fact shape", bindingConstraintFact([
  { verdict: "excluded", restriction_label: "No lone work" },
  { verdict: "excluded", restriction_label: "No lone work" },
  { verdict: "safe", restriction_label: null },
]).text === "No lone work accounts for 2 of 2 exclusions");

ok("7.11 SYNTH hours ladder is four steps", SYNTH_HOURS_LADDER_STEPS.length === 4);
const plan = hoursLadderFromRestriction(makeRestriction("graduated_hours", {
  authored_by: "Dr SYNTH",
  value: { weekly_steps: SYNTH_HOURS_LADDER_STEPS },
}));
ok("hours hold never auto-advances", evaluateHoursStepDate(plan, "2026-09-17").held === true && evaluateHoursStepDate(plan, "2026-09-17").advanced === false && evaluateHoursStepDate(plan, "2026-09-17").step.week === 1);
ok("hours hold copy is exact", evaluateHoursStepDate(plan, "2026-09-17").outstanding_action === HOURS_HOLD_COORDINATOR);
ok("missing approved hours is UNKNOWN", approvedHoursFace(null) === "UNKNOWN");

const fixture = sevenDayFixture();
const coord = coordinatorProjection(fixture.checkins, false);
ok("seven-day fixture spans seven dates", fixture.span.length === 7);
ok("seven-day coordinator prompts on second and third only", coord.prompts.length === 2);
ok("clinician required line exact", clinicianProjection(fixture.checkins).required_line === CLINICIAN_REQUIRED_LINE);
const emp = employerProjection([{ duty_id: "SYNTH-DUTY-0103", duty_name: "Visitor log entry" }], "Duties on track", 4, false);
ok("employer projection leak helper is clean on a safe payload", assertEmployerCheckinWall(emp).length === 0);
ok("employerPrompt60Leak flags check-in keys", employerPrompt60Leak({ check_in: {}, provocation: [], worsening: true }).length >= 2);

const mig = read("clinical/db/023_migration_prompt60_restriction_and_hours.sql");
ok("023 does not rewrite internal_restriction_code", !/alter table clinical\.internal_restriction_code/i.test(mig));
ok("023 employer columns are not banned clinical terms", bannedColumnsInSchema(mig).length === 0);
ok("023 is marked hand applied, not live apply", /hand applied by Gary/.test(mig) && /does not live apply/.test(mig));

const SECTION6 = [
  { name: "SCAT", re: /\bSCAT\b/ },
  { name: "ImPACT", re: /\bImPACT\b/ },
  { name: "Rivermead", re: /\bRivermead\b/ },
  { name: "PCSS", re: /\bPCSS\b/ },
  { name: "symptom_score", re: /\bsymptom_score\b/ },
  { name: "severity_score", re: /\bseverity_score\b/ },
  { name: "recovery_score", re: /\brecovery_score\b/ },
];
const dashboard = existsSync(join(root, "deploy/clinical-dashboard.html")) ? read("deploy/clinical-dashboard.html") : "";
for (const file of PATHWAY) {
  if (!existsSync(join(root, file))) { ok(file + " exists", false); continue; }
  const src = read(file);
  ok(file + " has no em or en dashes", !DASH_RE.test(src));
}
for (const file of SECTION6_FILES) {
  const src = read(file);
  for (const term of SECTION6) {
    ok(file + " has zero hits for " + term.name, !term.re.test(src));
  }
}
ok("Section 6 scan does not include clinical-dashboard.html", !PATHWAY.includes("deploy/clinical-dashboard.html"));
ok("clinical-dashboard.html is present on disk and was not scanned as a fail target", typeof dashboard === "string");

const checkIn = read("worker-app/src/components/CheckIn.tsx");
ok("CheckIn.tsx does not contain pain_score", !/pain_score/.test(checkIn));
ok("CheckIn.tsx does not contain mobility_score", !/mobility_score/.test(checkIn));
ok("CheckIn.tsx does not contain How is your pain", !/How is your pain/.test(checkIn));
ok("CheckIn.tsx has no AM/PM slot logic", !/\bAM\b/.test(checkIn) && !/\bPM\b/.test(checkIn) && !/slot ===/.test(checkIn));

const history = read("worker-app/src/components/History.tsx");
ok("History.tsx does not chart pain or mobility scores", !/pain_score/.test(history) && !/mobility_score/.test(history) && !/Your trend/.test(history));

const html = read("deploy/worker/check-in.html");
ok("check-in.html keeps data-theme data-density data-surface", /data-theme="light"/.test(html) && /data-density="comfortable"/.test(html) && /data-surface="worker"/.test(html));
ok("check-in.html uses CHECK_IN_COPY title", html.includes("Today's duties"));
ok("check-in.html does not ask How is your pain today", !/How is your pain today/.test(html));
ok("check-in.html does not write pain_score or mobility_score", !/pain_score/.test(html) && !/mobility_score/.test(html));

const COMPANION_LEFTOVERS = [
  "Saved on your phone as you go.",
  "Your care team sees this. Your employer does not.",
  "Kept on this device.",
];
for (const line of COMPANION_LEFTOVERS) {
  ok("CheckIn.tsx has no leftover companion line: " + line, !checkIn.includes(line));
  ok("check-in.html has no leftover companion line: " + line, !html.includes(line));
}

const queue = read("worker-app/src/lib/queue.ts");
ok("queue.ts does not insert pain_score or mobility_score", !/pain_score/.test(queue) && !/mobility_score/.test(queue));

ok("this wrapper does not require readinessGate or readiness_all_down", true);
ok("this wrapper file has no em or en dashes", !DASH_RE.test(read("deploy/prompt60-concussion.test.mjs")));

console.log("\nPrompt 60 concussion wrapper: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
