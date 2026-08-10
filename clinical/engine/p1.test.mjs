/* Continuum Prompt 40 increment 3: P1 field validation suite.
   node clinical/engine/p1.test.mjs
   Proves type, length, format, numeric range, code list membership, the
   always_required presence check, and the runP1 collect all orchestrator.
   No dashes anywhere. */

import {
  requiredField, typeField, lengthField, formatField, numericRange,
  codeMembership, runP1
} from "./p1.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// -- required --
ok("requiredField: blank required is rejected", requiredField({ name: "PHN", required: true }, "").length === 1);
ok("requiredField: present required is accepted", requiredField({ name: "PHN", required: true }, "x").length === 0);
ok("requiredField: blank optional is accepted", requiredField({ name: "PHN", required: false }, "").length === 0);

// -- type --
ok("typeField: integer rejects a decimal", typeField("integer", "1.5").length === 1);
ok("typeField: integer accepts a whole number", typeField("integer", "12").length === 0);
ok("typeField: numeric accepts a decimal", typeField("numeric", "12.34").length === 0);
ok("typeField: numeric rejects letters", typeField("numeric", "12a").length === 1);
ok("typeField: date accepts a real date", typeField("date", "2026-08-09").length === 0);
ok("typeField: date rejects a bad shape", typeField("date", "08/09/2026").length === 1);
ok("typeField: date rejects Feb 30", typeField("date", "2026-02-30").length === 1);
ok("typeField: boolean accepts Y", typeField("boolean", "Y").length === 0);
ok("typeField: boolean rejects true", typeField("boolean", "true").length === 1);
ok("typeField: blank is never a type error", typeField("integer", "").length === 0);
ok("typeField: string is unconstrained", typeField("string", "anything at all").length === 0);

// -- length --
ok("lengthField: over max is rejected", lengthField({ name: "Note", maxLength: 3 }, "abcd").length === 1);
ok("lengthField: at max is accepted", lengthField({ name: "Note", maxLength: 4 }, "abcd").length === 0);
ok("lengthField: under min is rejected", lengthField({ name: "Code", minLength: 5 }, "abc").length === 1);
ok("lengthField: no bounds means no check", lengthField({ name: "Note" }, "abcdef").length === 0);

// -- format --
ok("formatField: a RegExp mismatch is rejected", formatField({ name: "PHN", format: /^\d{9}$/ }, "12x").length === 1);
ok("formatField: a RegExp match is accepted", formatField({ name: "PHN", format: /^\d{9}$/ }, "123456789").length === 0);
ok("formatField: a string pattern works too", formatField({ name: "PHN", format: "^\\d{9}$" }, "123456789").length === 0);
ok("formatField: no format means no check", formatField({ name: "PHN" }, "anything").length === 0);

// -- numeric range (BR3, BR6, BR7, BR10 style) --
ok("numericRange: Fees must be > 0", numericRange({ name: "Fees" }, "0", { gt: 0, lte: 9999.99 }).length === 1);
ok("numericRange: Fees over 9999.99 is rejected", numericRange({ name: "Fees" }, "10000", { gt: 0, lte: 9999.99 }).length === 1);
ok("numericRange: Fees in range is accepted", numericRange({ name: "Fees" }, "125.50", { gt: 0, lte: 9999.99 }).length === 0);
ok("numericRange: Encounters 0 to 9, zero rejected", numericRange({ name: "Encounters" }, "0", { gt: 0, lte: 9 }).length === 1);
ok("numericRange: Encounters 10 rejected", numericRange({ name: "Encounters" }, "10", { gt: 0, lte: 9 }).length === 1);
ok("numericRange: no bounds means no check", numericRange({ name: "x" }, "5", null).length === 0);
ok("numericRange: blank is not a range error", numericRange({ name: "x" }, "", { gt: 0 }).length === 0);

// -- code list membership --
const codes = new Set(["01100", "24000"]);
ok("codeMembership: a member is accepted", codeMembership({ name: "POB" }, "01100", codes).length === 0);
ok("codeMembership: a non member is rejected", codeMembership({ name: "POB" }, "99999", codes).length === 1);
ok("codeMembership: no list loaded is a failure, not a silent pass", codeMembership({ name: "POB" }, "01100", null).length === 1);
ok("codeMembership: blank is not a membership error", codeMembership({ name: "POB" }, "", codes).length === 0);
ok("codeMembership: the leading zero code is the string 01100, not 1100", codeMembership({ name: "POB" }, "1100", codes).length === 1);

// -- runP1 orchestrator, collect all --
const el = { id: "e1", name: "Fees", type: "numeric", required: true, maxLength: 8, bounds: { gt: 0, lte: 9999.99 } };
ok("runP1: a good value passes every check", runP1(el, "125.50").length === 0);
ok("runP1: a blank required value fails once (blank short circuits the rest)", runP1(el, "").length === 1);
const codeEl = { id: "e2", name: "POB", type: "code", required: true, codeListSet: codes };
ok("runP1: a bad code fails membership but not type", runP1(codeEl, "99999").length === 1);
ok("runP1: collects a type and a range failure together", (() => {
  const two = runP1({ name: "Fees", type: "integer", bounds: { lte: 9 } }, "50.5");
  // 50.5 is not an integer (type) and 50.5 > 9 (range): two distinct failures.
  return two.length === 2;
})());
ok("runP1: never throws on a bare element", runP1(undefined, "x").length >= 0);

console.log("\np1 suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
