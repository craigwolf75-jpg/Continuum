/* Continuum Prompt 42: the ZRPT_P03 envelope conformance proof (CI). The clinical/engine
   envelope suite proves the string operations; this proves the OUTPUT is board conforming by
   validating it against the REAL structural schema with xmllint-wasm. It shows a single report
   template validates, that a two report batch assembled from that template validates (so the
   LST and GRP nesting and the trailer counts are correct), and that swapping in an hl7gen
   generated OBX section still validates (so the OBX seam is sound). Runs under the deploy
   suites where xmllint-wasm is installed. No dashes anywhere. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateAgainstSchemas } from "./xsd-validator.mjs";
import {
  extractReportUnits, getObxSection, buildReportUnit, assembleFromTemplate,
  reportCount, trailerCounts, replaceObxSection,
} from "../clinical/engine/hl7envelope.mjs";
import { extractObx, serializeObxSection } from "../clinical/engine/hl7gen.mjs";

const SAMPLES = join(dirname(fileURLToPath(import.meta.url)), "..", "clinical", "db", "samples");
const single = readFileSync(join(SAMPLES, "5.03 - C050E - Min Fields.xml"), "utf8");

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const passesStructural = async (xml, name) => {
  const r = await validateAgainstSchemas(xml, { fileName: name });
  if (!r.valid || r.blocked) console.error("    structural errors (" + name + "): " + JSON.stringify(r.errors.slice(0, 3)));
  return r.valid === true && r.blocked === false;
};

// -- baseline: the template itself validates ---------------------------------
ok("the single report template passes the structural schema", await passesStructural(single, "template.xml"));

// -- a two report batch assembled from the template validates ----------------
{
  const unit = extractReportUnits(single)[0];
  const obx = getObxSection(unit);
  const batch = assembleFromTemplate(single, [
    buildReportUnit(unit, { controlId: "REP-A", obxSection: obx }),
    buildReportUnit(unit, { controlId: "REP-B", obxSection: obx }),
  ]);
  ok("the assembled batch has two reports and trailers of 002", reportCount(batch) === 2 && trailerCounts(batch).bts1 === "002" && trailerCounts(batch).fts1 === "002");
  ok("the assembled two report batch passes the structural schema", await passesStructural(batch, "assembled-2.xml"));
}

// -- swapping in an hl7gen generated OBX section still validates --------------
{
  const unit = extractReportUnits(single)[0];
  // Parse the template unit's OBX section back to observations and regenerate it with hl7gen,
  // then swap it in. This proves a signed report's own OBX layer drops into the envelope.
  const observations = extractObx(getObxSection(unit));
  const regenerated = serializeObxSection(observations);
  const swappedUnit = replaceObxSection(unit, regenerated);
  const batch = assembleFromTemplate(single, [buildReportUnit(swappedUnit, { controlId: "REP-GEN" })]);
  ok("the OBX section round trips through hl7gen without losing observations", extractObx(getObxSection(swappedUnit)).length === observations.length && observations.length > 10);
  ok("a batch with an hl7gen generated OBX section passes the structural schema", await passesStructural(batch, "assembled-gen.xml"));
}

console.log("\nhl7 envelope conformance suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
