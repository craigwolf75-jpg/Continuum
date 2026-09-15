/* Continuum Prompt 39 schema proofs that do not need a live database.
   Reads the shipped 011 and 019 SQL and asserts the fail loudly objects the
   July 23 prompt requires: REVOKE UPDATE DELETE, block_mutation trigger,
   derive_weight_band open ends, emit_code LIMITED versus LIMITEDTO,
   legacy_restriction_label, skip_requires_reason on axis_value, and the 019
   grasping or reaching or environment constraints. Live UPDATE is proven by
   clinical/db/tests/prompt39_sql_proofs.sql when psql is available. No dashes. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { attemptUpdateMeasurementRow, BAND_PROOFS, deriveWeightBand } from "./measurement.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "db");
const m011 = readFileSync(join(root, "011_migration_functional_measurement_model.sql"), "utf8");
const m019 = readFileSync(join(root, "019_migration_functional_measurement_gap_fill.sql"), "utf8");

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

ok("011 revokes UPDATE and DELETE on functional_measurement", /revoke update, delete on[\s\S]*clinical\.functional_measurement/.test(m011));
ok("011 installs a before update or delete trigger", m011.includes("before update or delete on clinical.%I"));
ok("011 defines clinical.block_mutation", m011.includes("create or replace function clinical.block_mutation()"));
ok("011 creates legacy_restriction_label with has_underlying_measurement default false", /create table if not exists clinical\.legacy_restriction_label[\s\S]*has_underlying_measurement boolean not null default false/.test(m011));
ok("011 skip_requires_reason is on functional_axis_value", m011.includes("constraint skip_requires_reason"));
ok("011 derive_weight_band handles under 5 kg as LIMITED below_lowest_band", m011.includes("band := 'LIMITED'; rounded_down := false; below_lowest_band := true;"));
ok("011 derive_weight_band handles over 20 kg as HEAVY not rounded", m011.includes("band := 'HEAVY';   rounded_down := false; below_lowest_band := false;"));
ok("011 emit_code returns LIMITEDTO on the Extended list", m011.includes("return 'LIMITEDTO'"));
ok("011 emit_code returns LIMITED on the Basic list", m011.includes("if p_code_list = 'Basic Work Restriction Codes'    then return 'LIMITED';"));
ok("011 resolve_axes reads functional_axis_map, not form_element", m011.includes("from clinical.functional_axis_map") && !/from clinical\.form_element/.test(m011));

ok("019 does not create functional_measurement (does not rebuild 011)", !/create table if not exists clinical\.functional_measurement/.test(m019));
ok("019 does not rewrite form_element", !/clinical\.form_element/.test(m019));
ok("019 adds grasping skip_requires_reason", m019.includes("grasping_skip_requires_reason"));
ok("019 adds grasping able or unable only", m019.includes("grasping_able_or_unable_only"));
ok("019 adds reaching skip_requires_reason", m019.includes("reaching_skip_requires_reason"));
ok("019 adds environment skip_requires_reason", m019.includes("environment_skip_requires_reason"));
ok("019 reasserts REVOKE UPDATE DELETE on functional_measurement", /revoke update, delete on[\s\S]*clinical\.functional_measurement/.test(m019));

ok("attempted UPDATE of functional_measurement fails in the engine mirror", (() => {
  try { attemptUpdateMeasurementRow("functional_measurement"); return false; }
  catch (e) { return e.code === "IMMUTABLE-UPDATE"; }
})());

for (const p of BAND_PROOFS) {
  const b = deriveWeightBand(p.kg);
  ok("BAND_PROOFS " + p.kg + " kg matches deriveWeightBand", b.band === p.band && b.roundedDown === p.rounded_down && b.belowLowestBand === p.below_lowest_band);
}

console.log("\nmeasurement schema proof suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
