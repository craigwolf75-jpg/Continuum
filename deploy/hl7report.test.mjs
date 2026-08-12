/* Continuum Prompt 42: per report field population conformance proof (CI). The clinical/engine
   suite proves the field values land in the right subfields; this proves that a report unit
   populated with a real worker, case and practitioner is STILL board conforming, by validating
   the assembled document against the real structural schema with xmllint-wasm. Runs under the
   deploy suites. No dashes anywhere. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateAgainstSchemas } from "./xsd-validator.mjs";
import { extractReportUnits, assembleFromTemplate, reportCount } from "../clinical/engine/hl7envelope.mjs";
import { populateReportUnit } from "../clinical/engine/hl7report.mjs";

const SAMPLES = join(dirname(fileURLToPath(import.meta.url)), "..", "clinical", "db", "samples");
const template = readFileSync(join(SAMPLES, "5.02 - C050E - Max Fields without Attachments.xml"), "utf8");

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const passesStructural = async (xml, name) => {
  const r = await validateAgainstSchemas(xml, { fileName: name });
  if (!r.valid || r.blocked) console.error("    structural errors (" + name + "): " + JSON.stringify(r.errors.slice(0, 3)));
  return r.valid === true && r.blocked === false;
};

const worker = { family: "Roe", given: "Sam", middle: "T", date_of_birth: "1990-03-03", sex: "M", phn: "987654321", street: "42 Elm Ave", city: "Calgary", province: "AB", postal: "T2T2T2", phone_area: "403", phone_number: "5559876" };
const caseData = { claim_number: "7654321", claim_reference: "7654321", date_of_injury: "2026-02-02" };
const practitioner = { family: "Green", given: "Pat", role_code: "GP", phone_area: "780", phone_number: "5551111" };

// A single populated report validates against the structural schema.
{
  const unit = populateReportUnit(extractReportUnits(template)[0], {
    worker, case: caseData, practitioner,
    message: { datetime: "202608110900", controlId: "REP-1", formId: "C050E", injuryDate: "2026-02-02" },
    financial: { transactionId: "TXN-0001", transactionDate: "2026-01-02", feeCode: "000042", facilityType: "H", procedureCode: "03.02A" },
    coding: { diagnosisNarrative: "Left shoulder rotator cuff strain", diagnosisProvenance: "human", diagnosticCodes: ["840.4"], injuries: [{ partOfBody: "31000", sideOfBody: "L", typeOfInjury: "07110" }] },
  });
  const batch = assembleFromTemplate(template, [unit]);
  ok("a populated report carries the worker and case values", /<XPN\.1>Roe<\/XPN\.1>/.test(batch) && /<CX\.1>7654321<\/CX\.1>/.test(batch) && /<PID\.7>19900303<\/PID\.7>/.test(batch));
  ok("a populated report carries the FT1 financial fields", /<FT1\.3>TXN-0001<\/FT1\.3>/.test(batch) && /<FT1\.4>20260102<\/FT1\.4>/.test(batch) && /<CE\.1>000042<\/CE\.1>/.test(batch));
  ok("a populated report carries the FT1.19 clinical coding", /<CE\.2>Left shoulder rotator cuff strain<\/CE\.2><CE\.3>DIAGNOSIS<\/CE\.3>/.test(batch) && /<CE\.1>840\.4<\/CE\.1><CE\.2\/><CE\.3>DIAGCD<\/CE\.3>/.test(batch) && /<CE\.1>31000<\/CE\.1><CE\.2\/><CE\.3>POBCD<\/CE\.3>/.test(batch));
  ok("a populated single report batch (with FT1 + clinical coding) passes the real structural schema", await passesStructural(batch, "populated-1.xml"));
}

// Two distinct populated reports assemble into one batch that validates.
{
  const u1 = populateReportUnit(extractReportUnits(template)[0], { worker, case: caseData, practitioner, message: { datetime: "202608110900", controlId: "REP-1", formId: "C050E", injuryDate: "2026-02-02" } });
  const u2 = populateReportUnit(extractReportUnits(template)[0], { worker: { family: "Doe", given: "Ann", date_of_birth: "1985-05-05", phn: "" }, case: { claim_number: "1112223", date_of_injury: "2026-03-03" }, practitioner, message: { datetime: "202608110905", controlId: "REP-2", formId: "C050E", injuryDate: "2026-03-03" } });
  const batch = assembleFromTemplate(template, [u1, u2]);
  ok("two populated reports assemble into a two report batch", reportCount(batch) === 2);
  ok("a two report populated batch passes the real structural schema", await passesStructural(batch, "populated-2.xml"));
  ok("the second report has the no PHN indicator Y with a blank PHN", /<CX\.5>Y<\/CX\.5>/.test(batch));
}

console.log("\nhl7 per report population conformance suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
