/* Continuum Prompt 61 psychological injury CI wrapper.
   suites.yml globs deploy/*.test.mjs. Re-proves engine invariants and
   scans only the Prompt 61 pathway files. Does not flag platform
   readiness. Does not flag clinical-dashboard.html. No live apply.
   No dashes. */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { SYNTH_POSITIONS, SYNTHETIC, allSynthDuties } from "../clinical/db/occupational_synth.data.mjs";
import { C1447_FACTORS } from "../clinical/engine/c1447_factors.mjs";
import { CASE_TYPE_PSYCHOLOGICAL_INJURY, RETAINED_SURFACES } from "../clinical/engine/prompt61_surfaces.mjs";
import { AUTOMATED_DETECTION_EXISTS } from "../clinical/engine/prompt61_crisis.mjs";
import { COUNSEL_REVIEW, PRIVACY_OFFICER_WORDING } from "../clinical/engine/prompt61_named_individual.mjs";
import { walkPsychPathway } from "../clinical/engine/prompt61_pathway.mjs";
import { makeRestriction } from "../clinical/engine/prompt60_restriction_codes.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const DASH_RE = /[\u2013\u2014]/;

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

const PATHWAY = [
  "clinical/engine/prompt61_surfaces.mjs",
  "clinical/engine/prompt61_hours.mjs",
  "clinical/engine/prompt61_silent_days.mjs",
  "clinical/engine/prompt61_conduct.mjs",
  "clinical/engine/prompt61_named_individual.mjs",
  "clinical/engine/prompt61_crisis.mjs",
  "clinical/engine/prompt61_board_evidence.mjs",
  "clinical/engine/prompt61_match.mjs",
  "clinical/engine/prompt61_pathway.mjs",
  "clinical/engine/prompt61_accommodations.mjs",
  "clinical/engine/prompt61_pathway.test.mjs",
  "clinical/db/024_migration_prompt61_psych_injury.sql",
  "worker-app/src/lib/prompt61_psych.ts",
  "worker-app/src/lib/prompt61_day_store.ts",
  "worker-app/src/components/PsychDay.tsx",
  "worker-app/src/components/SupportLink.tsx",
  "deploy/worker/psych-day.html",
  "deploy/prompt61-psych-injury.test.mjs",
];

ok("SYNTHETIC is still true", SYNTHETIC === true);
ok("SYNTH still 6 positions", SYNTH_POSITIONS.length === 6);
ok("SYNTH still 13 duties", allSynthDuties().length === 13);
ok("thirteen C1447 labels untouched", C1447_FACTORS.length === 13 && C1447_FACTORS[0].label === "Short-term memory and recall");
ok("case type is psychological_injury", CASE_TYPE_PSYCHOLOGICAL_INJURY === "psychological_injury");
ok("retained surfaces are the four", RETAINED_SURFACES.length === 4);
ok("no automated detection flag", AUTOMATED_DETECTION_EXISTS === false);
ok("counsel STOP and no invented wording", COUNSEL_REVIEW === "STOP" && PRIVACY_OFFICER_WORDING === null);

const engine = spawnSync(process.execPath, [join(root, "clinical/engine/prompt61_pathway.test.mjs")], { encoding: "utf8" });
ok("engine pathway suite exits 0", engine.status === 0);
if (engine.status !== 0) console.error(engine.stdout || engine.stderr);

const p60 = spawnSync(process.execPath, [join(root, "clinical/engine/prompt60_match.test.mjs")], { encoding: "utf8" });
ok("Prompt 60 match suite still exits 0", p60.status === 0);
if (p60.status !== 0) console.error(p60.stdout || p60.stderr);

const hours = spawnSync(process.execPath, [join(root, "clinical/engine/prompt60_hours_ladder.test.mjs")], { encoding: "utf8" });
ok("Prompt 60 hours suite still exits 0", hours.status === 0);

const walked = walkPsychPathway({
  restrictions: [makeRestriction("no_lone_work", { authored_by: "Dr SYNTH" })],
  duties: allSynthDuties(),
  match_context: { asOfDate: "2026-09-17" },
  site: "SYNTH-SITE-B",
  shift_pattern: "days",
  supervisor_ref: "SYNTH-SUP-1",
});
ok("walk rejects symptom check-in", walked.symptom_rejected);
ok("walk retains the four surfaces", walked.retained.morning_duty_acknowledgment && walked.retained.secure_messaging && walked.retained.document_upload && walked.retained.hours_confirmation);
ok("migration file has no symptom check-in table", !/check_in|reported_pain|worsened/.test(read("clinical/db/024_migration_prompt61_psych_injury.sql")));
ok("psych-day html keeps duty ack and support link", (() => {
  const html = read("deploy/worker/psych-day.html");
  return html.includes("I understand today's duties and hours") && html.includes("get-help.html#resources") && !/pain|fatigue|confidence/.test(html);
})());

const BANNED = new RegExp("\\b(" + [
  ["p","h","q"].join(""),
  ["g","a","d","7"].join(""),
  ["g","a","d","-","7"].join(""),
  ["d","a","s","s"].join(""),
  ["k","e","s","s","l","e","r"].join(""),
  ["k","1","0"].join(""),
  ["w","h","o","5"].join(""),
  ["w","h","o","d","a","s"].join(""),
  ["c","s","s","r","s"].join(""),
  ["m","o","o","d"].join(""),
  ["w","e","l","l","b","e","i","n","g"].join(""),
  ["d","i","s","t","r","e","s","s"].join(""),
  ["s","e","n","t","i","m","e","n","t"].join(""),
  ["r","i","s","k","_","s","c","o","r","e"].join(""),
].join("|") + ")\\b", "i");
for (const f of PATHWAY) {
  const text = read(f);
  ok(f + ": no em or en dash", !DASH_RE.test(text));
  ok(f + ": 9.10 banned tokens absent", !BANNED.test(text));
}

ok("PSYCH_CAPTURE flag stays false in worker schema", /PSYCH_CAPTURE_PRODUCTION_RELEASE', false/.test(read("supabase/migrations/20260915140000_worker_schema.sql")));
ok("clinical-dashboard.html not in this pathway list", PATHWAY.every((f) => f !== "deploy/clinical-dashboard.html"));

console.log("\nPrompt 61 psych injury CI: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
