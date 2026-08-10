/* Continuum Prompt 42 HL7 document envelope suite. Proves the full document round trips
   against every one of the board's seventeen 5.xx sample files (parse, regenerate,
   compare, criteria 2, 3, 5 at the document level), that the OBX layer built in
   hl7gen.mjs is byte identical to the OBX inside a real board document (end to end),
   that 5.17 carries all eight report types in one file, and that a value change flows to
   exactly one slot. Reads the committed board samples. No dashes anywhere. */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  canonicalizeXml, parseXml, serialize, roundTrips, findAll, extractLeaves,
  documentObxIdentifiers,
} from "./hl7doc.mjs";
import { serializeObx } from "./hl7gen.mjs";
import { SAMPLE_OBX } from "../db/hl7_samples.data.mjs";

const SAMPLES = join(dirname(fileURLToPath(import.meta.url)), "..", "db", "samples");
const read = (f) => readFileSync(join(SAMPLES, f), "utf8");
const files = readdirSync(SAMPLES).filter((f) => f.endsWith(".xml")).sort();

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// -- every board sample round trips exactly (criteria 2, 3, 5 at the document level) ---
ok("all seventeen board samples are present", files.length === 17);
let rtCount = 0;
for (const f of files) if (roundTrips(read(f))) rtCount++; else console.error("  round trip failed: " + f);
ok("every board sample round trips (parse, serialize, equals canonical)", rtCount === 17);

// -- the root and the envelope segments are present and in order ----------------------
const c050e = parseXml(read("5.02 - C050E - Max Fields without Attachments.xml"));
ok("the document root is ZRPT_P03", c050e.tag === "ZRPT_P03");
ok("the file header, batch header, message header and trailers are present", ["FHS", "BHS", "MSH", "EVN", "PID", "BTS", "FTS"].every((seg) => findAll(c050e, seg).length >= 1));
ok("the root keeps its namespace attributes", c050e.attrs.includes('xmlns="urn:WCBhl7_v231-schema_modern_v100"'));

// -- end to end: hl7gen OBX output is byte identical to the board document's OBX --------
const obxNodes = findAll(c050e, "OBX");
ok("the C050E document carries 98 OBX observations", obxNodes.length === 98);
const leafText = (node, tag) => { const n = findAll(node, tag)[0]; return n && n.children[0] ? n.children[0].text : ""; };
let obxMatch = 0;
for (const o of obxNodes) {
  const id = leafText(o, "CE.1");
  const value = leafText(o, "OBX.5");
  const obx1 = leafText(o, "OBX.1");
  const obx2 = leafText(o, "OBX.2");
  if (serialize(o) === serializeObx(id, value, { obx1, obx2 })) obxMatch++;
}
ok("hl7gen reproduces every OBX in the C050E document exactly (end to end)", obxMatch === 98);

// -- the document OBX order matches the extracted skeleton -----------------------------
ok("the C050E document OBX identifiers match the extracted skeleton", JSON.stringify(documentObxIdentifiers(c050e)) === JSON.stringify(SAMPLE_OBX.C050E.max.map((o) => o.identifier)));

// -- 5.17 carries all eight report types in one file (Section 2.4, criterion 5) --------
const multi = parseXml(read("5.17 - Multiple Reports.xml"));
const reports = findAll(multi, "ZRPT_P03.GRP.2");
ok("5.17 round trips", roundTrips(read("5.17 - Multiple Reports.xml")));
ok("5.17 contains eight report bodies (ZRPT_P03.GRP.2)", reports.length === 8);
ok("5.17 carries the eight form identifiers in EVN.4", (() => {
  const forms = findAll(multi, "EVN.4").map((e) => e.children[0] ? e.children[0].text : "").filter(Boolean);
  return ["C050E", "C050S", "C151", "C151S", "C568", "C568A", "C569", "C570"].every((f) => forms.includes(f));
})());

// -- C569 and C570 documents carry no attachment observations (Section 2.3) -----------
const c569 = parseXml(read("5.15 - C569.xml"));
ok("the C569 document has no FILEATTACHMENT observation", !documentObxIdentifiers(c569).some((id) => id.startsWith("FILEATTACHMENT")));

// -- a value change flows to exactly one leaf slot (data driven, not an echo) ----------
ok("editing one OBX value changes exactly one leaf and nothing else", (() => {
  const tree = parseXml(read("5.15 - C569.xml"));
  const before = extractLeaves(tree);
  const target = findAll(tree, "OBX.5").find((n) => n.children[0] && n.children[0].text === "GP");
  if (!target) return false;
  target.children[0].text = "OIS";
  const after = extractLeaves(parseXml(serialize(tree)));
  const diffs = after.filter((a, i) => JSON.stringify(a) !== JSON.stringify(before[i]));
  return diffs.length === 1 && diffs[0].value === "OIS";
})());

// -- the canonicaliser is idempotent --------------------------------------------------
ok("canonicalize is idempotent", (() => { const c = canonicalizeXml(read("5.16 - C570.xml")); return canonicalizeXml(c) === c; })());

console.log("\nhl7 document suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
