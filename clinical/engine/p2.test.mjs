/* Continuum Prompt 40 increment 3: P2 cross field validation suite.
   node clinical/engine/p2.test.mjs
   Proves the conditional present versus ABSENT rule, the BR1 and BR4 date rules,
   the date primitives, and that runP2 folds in the VAL-X cross field rules from
   validation.mjs while collecting all failures. No dashes anywhere. */

import {
  conditionalRequirement, dateOnOrBefore, dateOnOrAfter,
  br1DateOfInjury, br4DateOfService, runP2
} from "./p2.mjs";
import { valX04, valX01 } from "./validation.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// -- conditional requirement: present-and-non-empty when met, present-and-EMPTY
//    when not met (Prompt 39A Section 3, the board's OBX convention) --
const presc = { name: "Prescription name" };
ok("conditional: met and present is accepted", conditionalRequirement(presc, true, true, "Codeine").length === 0);
ok("conditional: met but blank is rejected (required when met)", conditionalRequirement(presc, true, false, "").length === 1);
ok("conditional: met but present and blank is rejected", conditionalRequirement(presc, true, true, "").length === 1);
ok("conditional: not met and cleared (present and empty) is ACCEPTED per the board convention", conditionalRequirement(presc, false, true, "").length === 0);
ok("conditional: not met and absent is also accepted (no stale value)", conditionalRequirement(presc, false, false, "").length === 0);
ok("conditional: not met with a stale value is rejected (must be cleared)", conditionalRequirement(presc, false, true, "leftover").length === 1);
// absent mode: a whole container not applicable to the form must be absent (39A 3.1 item 2)
ok("conditional absent mode: not applicable and present is rejected", conditionalRequirement({ name: "attachment container" }, false, true, "", "absent").length === 1);
ok("conditional absent mode: not applicable and absent is accepted", conditionalRequirement({ name: "attachment container" }, false, false, "", "absent").length === 0);

// -- date primitives --
ok("dateOnOrBefore: after the bound is rejected", dateOnOrBefore("BR1", "d", "2026-08-10", "2026-08-09", "today").length === 1);
ok("dateOnOrBefore: equal to the bound is accepted", dateOnOrBefore("BR1", "d", "2026-08-09", "2026-08-09", "today").length === 0);
ok("dateOnOrAfter: before the bound is rejected", dateOnOrAfter("BR1", "d", "2000-01-01", "2010-01-01", "dob").length === 1);
ok("dateOnOrAfter: a blank date is not asserted", dateOnOrAfter("BR1", "d", "", "2010-01-01", "dob").length === 0);
ok("dateOnOrBefore: a non ISO value is left to P1", dateOnOrBefore("BR1", "d", "08/10/2026", "2026-08-09", "today").length === 0);

// -- BR1 Date of Injury --
ok("BR1: injury in the future is rejected", br1DateOfInjury("2030-01-01", "2026-08-09", "1980-01-01").length === 1);
ok("BR1: injury before birth is rejected", br1DateOfInjury("1975-01-01", "2026-08-09", "1980-01-01").length === 1);
ok("BR1: a valid injury date passes", br1DateOfInjury("2026-06-01", "2026-08-09", "1980-01-01").length === 0);

// -- BR4 Date of service --
ok("BR4: service in the future is rejected", br4DateOfService("2030-01-01", "2030-01-02", "2026-08-09", "2026-01-01").length >= 1);
ok("BR4: service before the accident is rejected", br4DateOfService("2025-12-01", "2026-01-05", "2026-08-09", "2026-01-01").length === 1);
ok("BR4: From after To is rejected", br4DateOfService("2026-03-10", "2026-03-01", "2026-08-09", "2026-01-01").length === 1);
ok("BR4: a valid service window passes", br4DateOfService("2026-03-01", "2026-03-10", "2026-08-09", "2026-01-01").length === 0);

// -- runP2 folds in VAL-X rules and collects all --
const p2 = runP2([
  () => valX01(true, "123"),                                              // 1 PHN cross field
  () => valX04([{ part: "Hand", side: "left", nature: "Sprain" }, { part: "Hand", side: "left", nature: "Sprain" }]), // 1 dup
  () => br1DateOfInjury("2030-01-01", "2026-08-09", "1980-01-01"),        // 1 future injury
  () => conditionalRequirement({ name: "Prescription name" }, true, false, "") // 1 conditional
]);
ok("runP2: collects all four cross field failures, never stops at the first", p2.length === 4);
ok("runP2: each failure names its element", p2.every((f) => typeof f.element === "string" && f.element.length > 0));
ok("runP2: a throwing check is captured, not fatal", runP2([() => { throw new Error("boom"); }, () => valX01(true, "1")]).length === 2);

console.log("\np2 suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
