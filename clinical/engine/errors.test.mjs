/* Continuum Prompt 40: error resolver suite (Prompt 39A Section 5). Proves that a
   catalogued board code resolves to an element and nothing else, that a low
   confidence or unmapped code surfaces the board's raw text to a human, and that
   the resolver never returns a value, polarity or correction. Loads the same ROWS
   the seed is built from. No dashes anywhere. */

import { ROWS } from "../db/error_catalogue.data.mjs";
import { indexErrorCatalogue, resolveError, CONFIDENCE_FLOOR } from "./errors.mjs";

const idx = indexErrorCatalogue(ROWS);
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// -- the one real board code maps to an element only --
const r = resolveError(idx, "AB", "121023", "121023: Worker Personal Health Number must be BLANK since Worker Personal Health Number Indicator is No");
ok("121023 is mapped", r.mapped === true);
ok("121023 maps to the Worker 36 element", r.element === "Worker 36");
ok("121023 carries the legacy inverted polarity note", typeof r.note === "string" && r.note.includes("inverted polarity"));
ok("121023 carries the raw board text through", r.rawText.includes("must be BLANK"));

// -- the resolver NEVER returns a value, polarity or correction --
ok("resolution has no value field", !("value" in r) && !("requiredValue" in r));
ok("resolution has no polarity field", !("polarity" in r));
ok("resolution has no correction field", !("correction" in r) && !("fix" in r));

// -- an unmapped code surfaces the raw text to a human --
const u = resolveError(idx, "AB", "999999", "999999: some new board rejection we have never seen");
ok("an unmapped code is not mapped", u.mapped === false && u.surfaceToHuman === true);
ok("an unmapped code has no element", u.element === null);
ok("an unmapped code surfaces the board raw text", u.rawText.includes("some new board rejection"));

// -- a mapped code below the confidence floor is treated as unmapped --
const lowIdx = indexErrorCatalogue([{ jurisdiction_code: "AB", board_code: "300001", element_name: "Some element", confidence: 0.5, source: "x" }]);
const low = resolveError(lowIdx, "AB", "300001", "300001: raw text");
ok("a below floor mapping surfaces raw text, not the element", low.mapped === false && low.element === null && low.surfaceToHuman === true);
const atFloor = indexErrorCatalogue([{ jurisdiction_code: "AB", board_code: "300002", element_name: "Some element", confidence: 0.80, source: "x" }]);
ok("a mapping exactly at the 0.80 floor is trusted", resolveError(atFloor, "AB", "300002", "x").mapped === true);
ok("the confidence floor is 0.80", CONFIDENCE_FLOOR === 0.80);

// -- a row with no element is unmapped even at high confidence --
const noEl = indexErrorCatalogue([{ jurisdiction_code: "AB", board_code: "300003", element_name: null, confidence: 0.99, source: "x" }]);
ok("a row with no element is unmapped", resolveError(noEl, "AB", "300003", "x").mapped === false);

// -- jurisdiction is part of the key --
ok("the same code in another jurisdiction is unmapped", resolveError(idx, "BC", "121023", "x").mapped === false);

// -- raw text is always carried, even when null --
ok("a null raw text resolves without throwing", resolveError(idx, "AB", "999998", null).rawText === null);

console.log("\nerrors suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
