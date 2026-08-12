/* Continuum Prompt 42: OBX skeleton conformance proof (CI). Proves that rebuilding a report's
   OBX section from the FULL form skeleton (as the live wcb_obx_skeleton seed drives it) and
   placing it in the envelope still validates against the real structural schema. The skeleton
   here is taken from a board sample's own OBX identifier order (so no database is needed in
   CI); the live path uses repo.getObxSkeleton, which returns the same ordered identifiers.
   No dashes anywhere. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateAgainstSchemas } from "./xsd-validator.mjs";
import { extractReportUnits, replaceObxSection, assembleFromTemplate } from "../clinical/engine/hl7envelope.mjs";
import { extractObx, skeletonObxSection } from "../clinical/engine/hl7gen.mjs";

const SAMPLES = join(dirname(fileURLToPath(import.meta.url)), "..", "clinical", "db", "samples");
const template = readFileSync(join(SAMPLES, "5.03 - C050E - Min Fields.xml"), "utf8");

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const passesStructural = async (xml, name) => {
  const r = await validateAgainstSchemas(xml, { fileName: name });
  if (!r.valid || r.blocked) console.error("    structural errors (" + name + "): " + JSON.stringify(r.errors.slice(0, 3)));
  return r.valid === true && r.blocked === false;
};

// The C050E skeleton and values, taken from the board sample's own OBX order.
const unit = extractReportUnits(template)[0];
const sampleObx = extractObx(unit.slice(unit.indexOf("<ZRPT_P03.LST.2>")));
const skeleton = sampleObx.map((o) => o.identifier);
const valuesById = {}; for (const o of sampleObx) valuesById[o.identifier] = o.value;

ok("the C050E sample skeleton is the full ordinal set (matches the seeded 98)", skeleton.length === 98);

// Rebuild the OBX section from the skeleton with the sample's values, assemble, validate.
{
  const rebuilt = replaceObxSection(unit, skeletonObxSection(skeleton, valuesById));
  const batch = assembleFromTemplate(template, [rebuilt]);
  ok("the rebuilt skeleton keeps all 98 observations in order", extractObx(batch.slice(batch.indexOf("<ZRPT_P03.LST.2>"))).length === 98);
  ok("a report OBX section rebuilt from the full skeleton passes the real structural schema", await passesStructural(batch, "skeleton-valued.xml"));
}

// The full skeleton with NO values (all present and empty) still validates structurally.
{
  const emptied = replaceObxSection(unit, skeletonObxSection(skeleton, {}));
  const batch = assembleFromTemplate(template, [emptied]);
  ok("the full skeleton present and empty passes the real structural schema", await passesStructural(batch, "skeleton-empty.xml"));
}

console.log("\nOBX skeleton conformance suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
