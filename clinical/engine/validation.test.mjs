/* Continuum Prompt 40 increment 3 validation engine suite.
   node clinical/engine/validation.test.mjs
   Proves the VAL-X cross field rules, the PHN polarity inversion, the code list
   emission, and the collect all failures P3 runner. Maps to acceptance criteria
   12 (all five errors), 13 (VAL-X04), 14 (VAL-X07), 15 (PHN inversion).
   No dashes anywhere. */

import {
  phnFields, havePhnXpathValue, valX01, valX02, valX03, valX04, valX05, valX06,
  dominantHandEnabled, additionalInjuriesEnabled, valX09, valX12, emitCode, runP3
} from "./validation.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// -- PHN inversion, criterion 15 --
ok("phnFields: no PHN -> CX.5 Y and CX.1 blank", (() => { const p = phnFields(true, "ignored"); return p.cx5 === "Y" && p.cx1 === ""; })());
ok("phnFields: has PHN -> CX.5 N and CX.1 kept", (() => { const p = phnFields(false, "123456789"); return p.cx5 === "N" && p.cx1 === "123456789"; })());
ok("havePhnXpathValue inverts: no PHN -> N", havePhnXpathValue(true) === "N");
ok("havePhnXpathValue inverts: has PHN -> Y", havePhnXpathValue(false) === "Y");
ok("valX01: populated PHN with no PHN indicator Yes is rejected", valX01(true, "123").length === 1);
ok("valX01: blank PHN with no PHN indicator Yes is accepted", valX01(true, "").length === 0);
ok("valX01: blank PHN with indicator No is rejected", valX01(false, "").length === 1);
ok("valX01: present PHN with indicator No is accepted", valX01(false, "123").length === 0);

// -- VAL-X04 unique rows, criterion 13 --
ok("valX04: two identical part/side/nature rows are rejected", valX04([
  { part: "Hand", side: "left", nature: "Sprain" },
  { part: "Hand", side: "left", nature: "Sprain" }
]).length === 1);
ok("valX04: distinct rows are accepted", valX04([
  { part: "Hand", side: "left", nature: "Sprain" },
  { part: "Hand", side: "right", nature: "Sprain" }
]).length === 0);
ok("valX04: entirely empty rows are not duplicates", valX04([{ part: "", side: "", nature: "" }, { part: "", side: "", nature: "" }]).length === 0);

// -- VAL-X07 dominant hand, criterion 14 --
ok("dominantHandEnabled: Shoulder is enabled", dominantHandEnabled("Shoulder") === true);
ok("dominantHandEnabled: Back is disabled", dominantHandEnabled("Back") === false);
ok("dominantHandEnabled: case insensitive", dominantHandEnabled("wrist") === true);

// -- VAL-X05 diagnostic code order --
ok("valX05: code 2 without code 1 is rejected", valX05("", "D2", "").length === 1);
ok("valX05: code 3 without code 2 is rejected", valX05("D1", "", "D3").length === 1);
ok("valX05: proper order is accepted", valX05("D1", "D2", "D3").length === 0);

// -- VAL-X06 row completeness --
ok("valX06: populated row missing nature is rejected", valX06({ part: "Hand", side: "left", nature: "" }, true).length === 1);
ok("valX06: side required flag adds a side failure", valX06({ part: "Hand", side: "", nature: "Sprain" }, true).some((f) => f.element === "Side of body"));
ok("valX06: side not required means no side failure", valX06({ part: "Neck", side: "", nature: "Strain" }, false).every((f) => f.element !== "Side of body"));
ok("valX06: an empty row produces no failures", valX06({ part: "", side: "", nature: "" }, true).length === 0);

// -- VAL-X02 side required --
ok("valX02: side blank with flag on and part present is rejected", valX02({ part: "Hand", side: "" }, true).length === 1);
ok("valX02: side present is accepted", valX02({ part: "Hand", side: "left" }, true).length === 0);

// -- VAL-X03 forbidden POB NOI --
ok("valX03: a forbidden pair is rejected", valX03([{ part: "01100", nature: "24000" }], new Set(["01100|24000"])).length === 1);
ok("valX03: an allowed pair is accepted", valX03([{ part: "01100", nature: "24000" }], new Set(["99999|00000"])).length === 0);

// -- VAL-X08 additional injuries --
ok("additionalInjuriesEnabled: 5 rows enables", additionalInjuriesEnabled(5) === true);
ok("additionalInjuriesEnabled: 4 rows does not", additionalInjuriesEnabled(4) === false);

// -- VAL-X09 prescriptions when opioids --
ok("valX09: opioids Yes with no prescriptions is rejected", valX09(true, []).length === 1);
ok("valX09: opioids Yes with a prescription is accepted", valX09(true, [{ name: "x" }]).length === 0);
ok("valX09: opioids No needs no prescription", valX09(false, []).length === 0);

// -- VAL-X12 hours within work day --
ok("valX12: axis hours over work hours is rejected", valX12([{ axis: "sitting", hours: 9 }], 8).length === 1);
ok("valX12: axis hours within work hours is accepted", valX12([{ axis: "sitting", hours: 6 }], 8).length === 0);
ok("valX12: no work hours means no assertion", valX12([{ axis: "sitting", hours: 9 }], null).length === 0);

// -- emit_code, the Basic vs Extended split and the LIMITED overload --
ok("emitCode: able is ABLE", emitCode("able", "Basic Work Restriction Codes", null) === "ABLE");
ok("emitCode: limited on Basic is LIMITED", emitCode("limited", "Basic Work Restriction Codes", null) === "LIMITED");
ok("emitCode: limited on Extended is LIMITEDTO", emitCode("limited_to", "Extended Work Restriction Codes", null) === "LIMITEDTO");
ok("emitCode: a weight axis emits the band, not a restriction code", emitCode("limited_to", "Extended Work Restriction Codes", "HEAVY") === "HEAVY");

// -- P3 collect all failures, criterion 12 --
const p3 = runP3([
  () => valX01(true, "123"),                                             // 1 PHN
  () => valX04([{ part: "Hand", side: "left", nature: "Sprain" }, { part: "Hand", side: "left", nature: "Sprain" }]), // 1 dup
  () => valX05("", "D2", ""),                                            // 1 code order
  () => valX12([{ axis: "sitting", hours: 9 }], 8),                      // 1 hours
  () => valX09(true, [])                                                 // 1 opioids
]);
ok("runP3: collects all five distinct failures, never stops at the first", p3.length === 5);
ok("runP3: each failure names its element", p3.every((f) => typeof f.element === "string" && f.element.length > 0));
ok("runP3: a throwing check is captured, not fatal", runP3([() => { throw new Error("boom"); }, () => valX01(true, "1")]).length === 2);

console.log("\nvalidation suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
