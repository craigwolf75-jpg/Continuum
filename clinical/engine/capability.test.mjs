/* Continuum Prompt 40: capability code set resolver suite.
   node clinical/engine/capability.test.mjs
   Proves the (form, element) Basic vs Extended rule (Prompt 39A Section 2 and its
   acceptance criteria 9 to 14) against the loaded config: the C050S Basic to
   Extended move, the C151S conditional, the able or unable only elements, and
   the not on form guard. Loads the same ROWS the seed is built from. No dashes. */

import { ROWS } from "../db/capability_code_set.data.mjs";
import { indexCodeSets, resolveCodeSet, emitCapability, BASIC, EXTENDED } from "./capability.mjs";

const idx = indexCodeSets(ROWS);
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const set = (form, obx, flag) => resolveCodeSet(idx, form, obx, flag).codeSet;
const list = (form, obx, flag) => resolveCodeSet(idx, form, obx, flag).listName;

// -- criterion 9: on C050E and C151, bending etc are Basic (LIMITED) --
ok("C050E Bending is basic", set("C050E", "RTWPATIENTBENDINGCAPABILITY") === "basic");
ok("C151 Pushing is basic", set("C151", "RTWPATIENTPUSHINGPULLINGCAPABILITY") === "basic");
ok("C050E Overhead reaching is basic", set("C050E", "RTWPATIENTOVERHEADREACHINGCAPABILITY") === "basic");
ok("C050E basic bending emits LIMITED", emitCapability(idx, "C050E", "RTWPATIENTBENDINGCAPABILITY", null, "limited").value === "LIMITED");

// -- criterion 10: on C050S those same elements are Extended (LIMITEDTO) --
ok("C050S Bending is extended", set("C050S", "RTWPATIENTBENDINGCAPABILITY") === "extended");
ok("C050S Climbing is extended", set("C050S", "RTWPATIENTCLIMBINGCAPABILITY") === "extended");
ok("C050S extended bending emits LIMITEDTO", emitCapability(idx, "C050S", "RTWPATIENTBENDINGCAPABILITY", null, "limited_to").value === "LIMITEDTO");

// -- criterion 11: C151S conditional, N -> Basic, Y -> Extended --
ok("C151S Bending is conditional (flag drives the list)", resolveCodeSet(idx, "C151S", "RTWPATIENTBENDINGCAPABILITY", "N").conditional === true);
ok("C151S Bending with flag N resolves Basic", list("C151S", "RTWPATIENTBENDINGCAPABILITY", "N") === BASIC);
ok("C151S Bending with flag Y resolves Extended", list("C151S", "RTWPATIENTBENDINGCAPABILITY", "Y") === EXTENDED);
ok("C151S Bending N emits LIMITED", emitCapability(idx, "C151S", "RTWPATIENTBENDINGCAPABILITY", "N", "limited").value === "LIMITED");
ok("C151S Bending Y emits LIMITEDTO", emitCapability(idx, "C151S", "RTWPATIENTBENDINGCAPABILITY", "Y", "limited_to").value === "LIMITEDTO");

// -- criterion 12: on C151S sitting, standing, walking, lifting, driving stay Extended under both flags --
ok("C151S Sitting is extended regardless of flag N", list("C151S", "RTWPATIENTSITTINGCAPABILITY", "N") === EXTENDED);
ok("C151S Sitting is extended regardless of flag Y", list("C151S", "RTWPATIENTSITTINGCAPABILITY", "Y") === EXTENDED);
ok("C151S Driving is extended", set("C151S", "RTWPATIENTDRIVINGCAPABILITY") === "extended");
ok("C151S Lifting floor to waist is extended", set("C151S", "RTWPATIENTLIFTINGFLOORTOWAIST") === "extended");

// -- criterion 13: grasping and reaching accept only ABLE or UNABLE --
ok("C050S Grasping right is able_unable_only", set("C050S", "RTWPATIENTGRASPINGRIGHT") === "able_unable_only");
ok("C151S Reaching above left is able_unable_only", set("C151S", "RTWPATIENTREACHINGABOVELEFTSHOULDER") === "able_unable_only");
ok("able_unable_only accepts ABLE", emitCapability(idx, "C050S", "RTWPATIENTGRASPINGRIGHT", null, "able").value === "ABLE");
ok("able_unable_only rejects a graded value (raises to a human)", (() => { const r = emitCapability(idx, "C050S", "RTWPATIENTGRASPINGRIGHT", null, "limited_to"); return r.value === null && r.failures.length === 1; })());

// -- not on form guard (39A note 2): overhead reaching does not exist on C050S --
ok("C050S has no overhead reaching (not_on_form)", set("C050S", "RTWPATIENTOVERHEADREACHINGCAPABILITY") === "not_on_form");
ok("C050S single lifting is not_on_form (replaced by three planes)", set("C050S", "RTWPATIENTLIFTINGCAPABILITY") === "not_on_form");
ok("C050E has no lifting plane (single only)", set("C050E", "RTWPATIENTLIFTINGFLOORTOWAIST") === "not_on_form");
ok("emitting a not_on_form capability fails loudly", (() => { const r = emitCapability(idx, "C050S", "RTWPATIENTOVERHEADREACHINGCAPABILITY", null, "limited"); return r.value === null && r.failures.length === 1; })());

// -- weight band stays a separate namespace (39A Section 2.6) --
ok("a weight band emits the band, not a restriction code", emitCapability(idx, "C050S", "RTWPATIENTLIFTINGFLOORTOWAIST", null, "limited_to", "HEAVY").value === "HEAVY");

// -- row count sanity --
ok("58 code set rows loaded", ROWS.length === 58);

console.log("\ncapability suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
