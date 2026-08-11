/* Continuum Prompt 42 Section 3 XSD suite (approved 43a gate 2). Validates every board
   sample against both schemas in order, offline, proves a malformed file is rejected at
   the structural stage, and proves the maximum size file (multiple reports plus three
   1 MB base64 attachments) validates within the WebAssembly memory ceiling so that limit
   is met in a test, not in production. Runs under the deploy suites, where xmllint-wasm
   is installed by npm ci. No dashes anywhere. */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateAgainstSchemas, isSupplementaryKnownDefect, SCHEMA_STRUCTURAL, SCHEMA_SUPPLEMENTARY } from "./xsd-validator.mjs";

const SAMPLES = join(dirname(fileURLToPath(import.meta.url)), "..", "clinical", "db", "samples");
const read = (f) => readFileSync(join(SAMPLES, f), "utf8");
const sampleFiles = readdirSync(SAMPLES).filter((f) => f.endsWith(".xml")).sort();

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// -- both schemas are loaded from disk, offline (never fetched) ------------------------
ok("both board schemas are loaded from disk", SCHEMA_STRUCTURAL.length > 100000 && SCHEMA_SUPPLEMENTARY.length > 100000);
ok("all seventeen board samples are present", sampleFiles.length === 17);

// -- criterion 1: the STRUCTURAL schema is the authoritative gate; all seventeen pass it,
//    and none is blocked. The supplementary schema (6.01) is advisory. --
const results = {};
for (const f of sampleFiles) results[f] = await validateAgainstSchemas(read(f), { fileName: f });
ok("criterion 1: all seventeen samples pass the structural gate and none is blocked", Object.values(results).every((r) => r.valid === true && r.blocked === false && r.stage !== "structural"));
ok("fifteen samples pass both schemas cleanly", Object.values(results).filter((r) => r.stage === "passed").length === 15);
ok("no sample raises an unexpected supplementary finding", Object.values(results).every((r) => r.raiseToHuman === false));

// -- the supplementary schema over strictness on the board's own samples (39A doctrine) --
ok("C570 (5.16) and the multiple reports file (5.17) surface the known supplementary defect, not blocked", (() => {
  const a = results["5.16 - C570.xml"], b = results["5.17 - Multiple Reports.xml"];
  return a.stage === "passed-with-known-supplementary-defect" && a.blocked === false && b.stage === "passed-with-known-supplementary-defect" && b.blocked === false;
})());
ok("the supplementary findings are empty optional rejections (date FT1.4, length CE.1, value CP.3)", (() => {
  const e = results["5.16 - C570.xml"].supplementaryFindings;
  return e.some((x) => /FT1\.4/.test(x)) && e.some((x) => /CE\.1/.test(x)) && e.some((x) => /CP\.3/.test(x)) && e.every(isSupplementaryKnownDefect);
})());

// -- the known defect classifier ------------------------------------------------------
ok("isSupplementaryKnownDefect matches every empty value shape", isSupplementaryKnownDefect("The value '' is not accepted by the pattern") === true && isSupplementaryKnownDefect("The value has a length of '0'; this differs from '6'") === true && isSupplementaryKnownDefect("'' is not a valid value of the atomic type 'xs:int'") === true);
ok("isSupplementaryKnownDefect does not match a non empty supplementary failure", isSupplementaryKnownDefect("Element X: [facet 'enumeration'] The value 'ZZ' is not an allowed value") === false);

// -- the two schema order: a structurally invalid file is caught at the structural stage
const bad = await validateAgainstSchemas("<ZRPT_P03 xmlns=\"urn:WCBhl7_v231-schema_modern_v100\"><NOPE/></ZRPT_P03>", { fileName: "bad.xml" });
ok("a structurally invalid file is rejected at the structural stage", bad.valid === false && bad.stage === "structural" && bad.errors.length > 0);

// -- a well formed non conforming file never reports valid ----------------------------
ok("an empty document is not valid", (await validateAgainstSchemas("<ZRPT_P03/>", { fileName: "empty.xml" })).valid === false);

// -- condition 3: the maximum size file validates within the WASM memory ceiling ------
const maxSizeFixture = (() => {
  const base = read("5.01 - C050E - Max Fields with Attachment.xml");
  const m = base.match(/<OBX\.5>(dGVzdCBhdHRhY2htZW50[^<]*)<\/OBX\.5>/);
  const oneMbBase64 = "QUJD".repeat(262144); // 1,048,576 chars of valid base64
  return base.split(m[1]).join(oneMbBase64); // replaces all three attachment contents
})();
ok("the max size fixture is three 1 MB attachments (about 3 MB)", Buffer.byteLength(maxSizeFixture) > 3_000_000);
const big = await validateAgainstSchemas(maxSizeFixture, { fileName: "maxsize.xml", maxMemoryPages: 8192 });
ok("condition 3: the maximum size file validates within the WASM memory ceiling, no crash", typeof big.valid === "boolean" && big.valid === true && big.blocked === false);

console.log("\nxsd validation suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
