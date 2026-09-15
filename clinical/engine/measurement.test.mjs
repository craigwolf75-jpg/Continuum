/* Continuum Prompt 39: functional measurement model suite. Proves the band
   derivation (acceptance criteria 5, 6, 7), the LIMITED versus LIMITEDTO emission
   (criterion 4), the overloaded LIMITED collision, the able or unable only guard, the
   C151S conditional resolution, and that resolveAxes reproduces the Section 4.4 board
   matrix exactly (criteria 2 and 3). Loads the real axis map the seed is built from.
   No dashes anywhere. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { AXIS_MAP } from "../db/functional_measurement.data.mjs";
import {
  deriveWeightBand, emitCode, codeListForSet, resolveAxes, indexAxisMap,
  BASIC_LIST, EXTENDED_LIST, WEIGHT_LIST,
  formCapabilityAxesFromSeed, assertFormAxesCovered, missingAxesFromResolver,
  migrateLegacyRestriction, axisRowState, axisRowConstraintViolations,
  BAND_PROOFS, LEGACY_LABEL_NOTE,
} from "./measurement.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const idx = indexAxisMap(AXIS_MAP);
const axesOf = (form) => resolveAxes(form, idx).map((a) => a.axis);
const specOf = (form, axis) => resolveAxes(form, idx).find((a) => a.axis === axis);

// -- band derivation (criteria 5, 6, 7) and both open ends and the exact boundaries --
ok("criterion 5: 8 kg is LIMITED, rounded down", (() => { const b = deriveWeightBand(8); return b.band === "LIMITED" && b.roundedDown === true && b.belowLowestBand === false; })());
ok("criterion 6: 25 kg is HEAVY, not a rounding case", (() => { const b = deriveWeightBand(25); return b.band === "HEAVY" && b.roundedDown === false; })());
ok("criterion 7: 3 kg is LIMITED, below the lowest band", (() => { const b = deriveWeightBand(3); return b.band === "LIMITED" && b.belowLowestBand === true && b.roundedDown === false; })());
ok("exactly 5 kg is LIMITED, not rounded, not below", (() => { const b = deriveWeightBand(5); return b.band === "LIMITED" && b.roundedDown === false && b.belowLowestBand === false; })());
ok("exactly 10 kg is LIGHT, not rounded", (() => { const b = deriveWeightBand(10); return b.band === "LIGHT" && b.roundedDown === false; })());
ok("15 kg rounds down to LIGHT", (() => { const b = deriveWeightBand(15); return b.band === "LIGHT" && b.roundedDown === true; })());
ok("exactly 20 kg is MEDIUM, not rounded", (() => { const b = deriveWeightBand(20); return b.band === "MEDIUM" && b.roundedDown === false; })());
ok("21 kg is HEAVY", deriveWeightBand(21).band === "HEAVY");
ok("null weight yields no band", (() => { const b = deriveWeightBand(null); return b.band === null && b.roundedDown === false && b.belowLowestBand === false; })());
ok("the only band outputs are the four Weight Category Codes", [3, 5, 8, 10, 15, 20, 25].every((k) => ["LIMITED", "LIGHT", "MEDIUM", "HEAVY"].includes(deriveWeightBand(k).band)));

// -- emission: LIMITED versus LIMITEDTO by list (criterion 4) --
ok("able emits ABLE on either list", emitCode("able", BASIC_LIST, null) === "ABLE" && emitCode("able", EXTENDED_LIST, null) === "ABLE");
ok("unable emits UNABLE", emitCode("unable", BASIC_LIST, null) === "UNABLE");
ok("limited on the Basic list emits LIMITED", emitCode("limited", BASIC_LIST, null) === "LIMITED");
ok("limited on the Extended list emits LIMITEDTO", emitCode("limited", EXTENDED_LIST, null) === "LIMITEDTO");
ok("limited_to on the Extended list emits LIMITEDTO", emitCode("limited_to", EXTENDED_LIST, null) === "LIMITEDTO");

// -- criterion 4 end to end through the axis map: bending emits LIMITED on C050E, LIMITEDTO on C050S --
ok("criterion 4: bending on C050E emits LIMITED", emitCode("limited", specOf("C050E", "bending").code_list_name, null) === "LIMITED");
ok("criterion 4: the same intent on C050S emits LIMITEDTO", emitCode("limited", specOf("C050S", "bending").code_list_name, null) === "LIMITEDTO");

// -- the overloaded LIMITED collision: a weight axis emits the band LIMITED (5 kg), distinct meaning --
ok("a weight axis emits the band LIMITED as a 5 kg Weight Category Code", emitCode("limited", WEIGHT_LIST, "LIMITED") === "LIMITED");
ok("the weight band wins over the capability path", emitCode("able", WEIGHT_LIST, "HEAVY") === "HEAVY");

// -- the able or unable only guard: a graded answer must not auto emit, it goes to a human --
ok("a graded answer on an able or unable only axis returns null", emitCode("limited", null, null) === null);
ok("restricted_from is not emitted here", emitCode("restricted_from", BASIC_LIST, null) === null);
ok("an unanswered capability is not emitted here", emitCode(null, BASIC_LIST, null) === null);

// -- C151S conditional resolution via the RTWPATIENTSTATUSCHANGED flag (39A Section 2.4) --
ok("C151S bending is a conditional set", specOf("C151S", "bending").code_set === "conditional");
ok("conditional with flag N (no change) resolves to Basic, emits LIMITED", (() => { const list = codeListForSet("conditional", "N", "N"); return list === BASIC_LIST && emitCode("limited", list, null) === "LIMITED"; })());
ok("conditional with flag Y (changed) resolves to Extended, emits LIMITEDTO", (() => { const list = codeListForSet("conditional", "Y", "N"); return list === EXTENDED_LIST && emitCode("limited", list, null) === "LIMITEDTO"; })());

// -- criterion 2: the C050E axis set --
const c050e = axesOf("C050E");
ok("criterion 2: C050E has lifting_general", c050e.includes("lifting_general"));
ok("criterion 2: C050E has overhead_reaching", c050e.includes("overhead_reaching"));
ok("criterion 2: C050E has NOT the three lifting planes", !["lifting_floor_to_waist", "lifting_waist_to_shoulder", "lifting_above_shoulder"].some((a) => c050e.includes(a)));
ok("criterion 2: C050E has NOT grasping", !c050e.some((a) => a.startsWith("grasping")));
ok("criterion 2: C050E has NOT sided reaching", !c050e.some((a) => a.startsWith("reaching_")));
ok("criterion 2: C050E has NOT environment", !c050e.includes("environment"));
ok("C050E posture axes are Basic, quantity none", ["bending", "twisting", "kneeling_squatting", "climbing"].every((a) => { const s = specOf("C050E", a); return s.code_set === "basic" && s.quantity_kind === "none"; }));
ok("C050E tolerance axes are Extended plus hours", ["sitting", "standing", "walking", "driving"].every((a) => { const s = specOf("C050E", a); return s.code_set === "extended" && s.quantity_kind === "hours"; }));
ok("C050E has eleven axes", c050e.length === 11);

// -- criterion 3: the C050S axis set --
const c050s = axesOf("C050S");
ok("criterion 3: C050S has the three lifting planes", ["lifting_floor_to_waist", "lifting_waist_to_shoulder", "lifting_above_shoulder"].every((a) => c050s.includes(a)));
ok("criterion 3: C050S has the four sided reaching values", ["reaching_left_above", "reaching_left_below", "reaching_right_above", "reaching_right_below"].every((a) => c050s.includes(a)));
ok("criterion 3: C050S has grasping per hand", c050s.includes("grasping_left") && c050s.includes("grasping_right"));
ok("criterion 3: C050S has environment", c050s.includes("environment"));
ok("criterion 3: C050S does NOT have lifting_general or overhead_reaching", !c050s.includes("lifting_general") && !c050s.includes("overhead_reaching"));
ok("C050S posture axes moved to Extended plus hours", ["bending", "twisting", "kneeling_squatting", "climbing"].every((a) => { const s = specOf("C050S", a); return s.code_set === "extended" && s.quantity_kind === "hours"; }));
ok("C050S pushing is Extended plus weight", (() => { const s = specOf("C050S", "pushing_pulling"); return s.code_set === "extended" && s.quantity_kind === "weight"; })());
ok("C050S sided reaching and grasping are able or unable only", ["reaching_left_above", "grasping_left"].every((a) => specOf("C050S", a).code_set === "able_unable_only"));
ok("C050S has nineteen axes", c050s.length === 19);

// -- C151 mirrors C050E, C151S mirrors C050S in shape --
ok("C151 mirrors C050E axis set", JSON.stringify(axesOf("C151")) === JSON.stringify(c050e));
ok("C151S mirrors C050S axis set", JSON.stringify(axesOf("C151S")) === JSON.stringify(c050s));

// -- an unknown form resolves to no axes so the caller fails that form build --
ok("an unknown form resolves to an empty axis set", resolveAxes("C999", idx).length === 0);

// -- axis order is stable and by display_order --
ok("C050S axis order starts with the tolerance group", JSON.stringify(c050s.slice(0, 4)) === JSON.stringify(["sitting", "standing", "walking", "driving"]));

// -- shared band proofs (criteria 5, 6, 7) as a table the SQL probe also uses --
ok("BAND_PROOFS covers 8, 25 and 3 kg", BAND_PROOFS.map((p) => p.kg).join(",") === "8,25,3");

// -- form_element (Prompt 40) has no axis column: fail loudly if a form axis is omitted --
const formSeed = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "db", "003_seed_form_elements.sql"), "utf8");
const formAxes = formCapabilityAxesFromSeed(formSeed);
ok("Prompt 40 form_element seed maps C050E lifting_general and overhead_reaching", formAxes.C050E.includes("lifting_general") && formAxes.C050E.includes("overhead_reaching"));
ok("Prompt 40 form_element seed maps C050S planes, grasping, sided reaching, environment", ["lifting_floor_to_waist", "grasping_left", "reaching_left_above", "environment"].every((a) => formAxes.C050S.includes(a)));
ok("C050E form definition axes are covered by resolve_axes", assertFormAxesCovered("C050E", formAxes.C050E, resolveAxes("C050E", idx)) === true);
ok("C050S form definition axes are covered by resolve_axes", assertFormAxesCovered("C050S", formAxes.C050S, resolveAxes("C050S", idx)) === true);
ok("C151 form definition axes are covered by resolve_axes", assertFormAxesCovered("C151", formAxes.C151, resolveAxes("C151", idx)) === true);
ok("C151S form definition axes are covered by resolve_axes", assertFormAxesCovered("C151S", formAxes.C151S, resolveAxes("C151S", idx)) === true);
ok("an axis present on the form but absent from resolve_axes fails the form build", (() => {
  try { assertFormAxesCovered("C050E", ["sitting", "not_a_real_axis"], resolveAxes("C050E", idx)); return false; }
  catch (e) { return e.code === "FORM-AXIS-MISSING" && e.missing.includes("not_a_real_axis"); }
})());
ok("missingAxesFromResolver is empty when the resolver covers the form", missingAxesFromResolver(formAxes.C050E, resolveAxes("C050E", idx)).length === 0);

// -- Section 5: legacy R code migration never fabricates a measurement --
ok("migrating a legacy R code sets has_underlying_measurement false", migrateLegacyRestriction({ case_id: "c1", r_code: "R01" }).has_underlying_measurement === false);
ok("migrating a legacy R code fabricates no measurement", migrateLegacyRestriction({ case_id: "c1", r_code: "R01" }).fabricated_measurement === null);
ok("the legacy note is the Prompt 39 default", migrateLegacyRestriction({ case_id: "c1", r_code: "R22" }).note === LEGACY_LABEL_NOTE);

// -- criterion 10 and 11: three states, skip requires a reason --
ok("unanswered is distinct from skipped and from answered able", axisRowState({ answered: false, skipped: false }) === "unanswered" && axisRowState({ answered: false, skipped: true, skip_reason: "n/a" }) === "skipped" && axisRowState({ answered: true, capability: "able" }) === "answered_able");
ok("a skipped axis without a reason violates skip_requires_reason", axisRowConstraintViolations({ skipped: true }).includes("skip_requires_reason"));
ok("an answered able row has no constraint violations", axisRowConstraintViolations({ answered: true, skipped: false, capability: "able" }).length === 0);

console.log("\nmeasurement suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
