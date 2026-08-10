/* Continuum Prompt 40: OBX skeleton verifier suite (Prompt 39A Section 3.1,
   acceptance criterion 4). Proves that a generated OBX set matching the board
   skeleton passes, a wrong count or order fails, and the HL7 null is rejected.
   Loads the real skeleton the seed is built from. No dashes anywhere. */

import { ROWS } from "../db/obx_skeleton.data.mjs";
import { indexSkeleton, verifySkeleton, assertNoHl7Null, HL7_NULL } from "./obx.mjs";

const idx = indexSkeleton(ROWS);
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const c050e = idx.get("C050E");

// -- criterion 4: the C050E skeleton is 98 OBX in a fixed order --
ok("the C050E skeleton has 98 observations", c050e.length === 98);
ok("C569 and C570 carry two observations each (39A Section 3.1 item 2)", idx.get("C569").length === 2 && idx.get("C570").length === 2);
ok("C568 carries three observations", idx.get("C568").length === 3);

// -- a generated set equal to the skeleton passes --
ok("a generated C050E equal to the skeleton passes", verifySkeleton(idx, "C050E", c050e.slice()).length === 0);
ok("a generated C569 equal to the skeleton passes", verifySkeleton(idx, "C569", idx.get("C569").slice()).length === 0);

// -- wrong count fails --
ok("dropping an observation fails on count", (() => { const f = verifySkeleton(idx, "C050E", c050e.slice(0, 97)); return f.some((x) => x.id === "OBX-COUNT"); })());
ok("adding an observation fails on count", verifySkeleton(idx, "C050E", c050e.concat(["EXTRA"])).some((x) => x.id === "OBX-COUNT"));

// -- wrong order fails, and names the first divergent position --
ok("swapping two identifiers fails on order", (() => {
  const g = c050e.slice(); const t = g[0]; g[0] = g[1]; g[1] = t;
  const f = verifySkeleton(idx, "C050E", g);
  return f.some((x) => x.id === "OBX-ORDER" && x.message.includes("position 1"));
})());
ok("a changed identifier fails on order", (() => {
  const g = c050e.slice(); g[40] = "WRONGID";
  return verifySkeleton(idx, "C050E", g).some((x) => x.id === "OBX-ORDER" && x.message.includes("position 41"));
})());

// -- unknown form --
ok("an unknown form has no skeleton", verifySkeleton(idx, "C999", []).some((x) => x.id === "OBX-NOFORM"));

// -- HL7 null guard (criterion 4: emits no HL7 null anywhere) --
ok("an empty string value is fine (present and empty)", assertNoHl7Null("C050E", ["", "ABLE", ""]).length === 0);
ok("the HL7 null value is rejected", assertNoHl7Null("C050E", ["ABLE", HL7_NULL, ""]).length === 1);
ok("the HL7 null failure names its position", assertNoHl7Null("C050E", ["", "", HL7_NULL]).some((x) => x.message.includes("position 3")));
ok("HL7_NULL is the two character string of two double quotes", HL7_NULL === '""' && HL7_NULL.length === 2);

// -- skeleton identifiers are unique per form --
ok("no form skeleton repeats an identifier", [...idx.values()].every((ids) => new Set(ids).size === ids.length));

// -- total across the eight forms is 521 (matches the Multiple Reports sample) --
ok("the eight skeletons total 521 observations", [...idx.values()].reduce((s, ids) => s + ids.length, 0) === 521);

console.log("\nobx suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
