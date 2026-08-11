/* Continuum physician platform: the CI facing end to end wiring proof (Prompt 43a wiring).
   The clinical/engine suites do not run in CI (CI runs only deploy/*.test.mjs); this test
   exercises the batch orchestrator through the REAL xmllint-wasm validator against a REAL
   board sample so CI keeps the two invariants that matter most green: the chain runs, and a
   batch NEVER transmits while the submission gate is closed (the standing case). Nothing here
   enables production submission. No dashes anywhere. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createInMemoryRepository } from "../clinical/engine/repository.mjs";
import { runClinicBatch } from "../clinical/engine/orchestrator.mjs";
import { extractReportUnits, getObxSection } from "../clinical/engine/hl7envelope.mjs";
import { extractObx } from "../clinical/engine/hl7gen.mjs";
import { validateAgainstSchemas } from "./xsd-validator.mjs";

const SAMPLES = join(dirname(fileURLToPath(import.meta.url)), "..", "clinical", "db", "samples");
const template = readFileSync(join(SAMPLES, "5.03 - C050E - Min Fields.xml"), "utf8");
// The report's observations are seeded from the template's own OBX section so the assembled
// document is a complete, board valid section (the full OBX skeleton from the seed is the next
// increment; here we prove the envelope path end to end through the real validator).
const templateObservations = extractObx(getObxSection(extractReportUnits(template)[0]));

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

function repoWithSignedReport() {
  return createInMemoryRepository({
    clinics: [{ id: "clinic-1", name: "Test Clinic", accreditation_status: "none", region: "ca-central-1" }],
    practitioners: [{ id: "prac-1", clinic_id: "clinic-1", billing_number: "12345", name: "Dr Test", active: true }],
    reports: [{ id: "rep-1", case_id: "case-1", practitioner_id: "prac-1", form_id: "C050E", version: 1, status: "signed", snapshot_hash: "0".repeat(64) }],
    observations: [{ report_id: "rep-1", observations: templateObservations }],
    reportFields: [{ report_id: "rep-1", fields: {
      worker: { family: "Roe", given: "Sam", date_of_birth: "1990-03-03", phn: "987654321", street: "42 Elm Ave", city: "Calgary", province: "AB", postal: "T2T2T2" },
      case: { claim_number: "7654321", claim_reference: "7654321", date_of_injury: "2026-02-02" },
      practitioner: { family: "Green", given: "Pat", role_code: "GP" },
      message: { datetime: "202608110900", formId: "C050E", injuryDate: "2026-02-02" },
    } }],
  });
}

// The validate adapter: wrap the real two schema validator into the { ok, failures } shape
// the batch worker expects. The structural schema is the hard gate (Prompt 43a gate 2).
const validate = async (xml) => {
  const r = await validateAgainstSchemas(xml, { fileName: "batch.xml" });
  return { ok: r.valid === true && r.blocked === false, failures: r.errors };
};

// Gate closed (no accreditation, no cron secret, no flag): the batch must be dry run and must
// not transmit. No generate is injected, so the orchestrator ASSEMBLES the document itself
// through the envelope module (hl7envelope) from the signed report's OBX section, then the
// real xmllint-wasm validator checks the assembled output. This proves the full
// generate to validate chain on a document Continuum built, not one handed to it.
{
  const repo = repoWithSignedReport();
  let transmitted = false;
  const out = await runClinicBatch(
    repo,
    { validate, transmit: () => { transmitted = true; return { ok: true }; }, notify: () => {} },
    { clinicId: "clinic-1" },
    { env: {}, template },
  );
  ok("the batch is dry run while the submission gate is closed", out.status === "dry-run" && out.transmitted === false);
  ok("the orchestrator assembled a batch that passes the real xmllint-wasm structural schema", out.validated === true);
  ok("the transmitter is never called while the gate is closed", transmitted === false);
  ok("the signed report is not mutated by a dry run batch", repo._debug.store.reports.get("rep-1").status === "signed");
  ok("the dry run records the reports it would submit", out.would_submit.includes("rep-1"));

  // The assembled document carries the report's OWN populated fields, not the template's.
  const assembled = await generateForAssertion(repo, template);
  ok("the assembled document carries the report's populated worker and case fields", /<XPN\.1>Roe<\/XPN\.1>/.test(assembled) && /<PID\.7>19900303<\/PID\.7>/.test(assembled) && /<CX\.1>7654321<\/CX\.1>/.test(assembled) && /<MSH\.10>rep-1<\/MSH\.10>/.test(assembled));
}

// Re run the default assembler directly to assert on the assembled document content (the dry
// run outcome does not return the XML). Same repository, same template, no transmission.
async function generateForAssertion(repo, tmpl) {
  const { runClinicBatch: _rcb } = await import("../clinical/engine/orchestrator.mjs");
  let captured = null;
  await _rcb(repo, { validate: async (xml) => { captured = xml; return { ok: true, failures: [] }; }, notify: () => {} }, { clinicId: "clinic-1" }, { env: {}, template: tmpl });
  return captured;
}

console.log("\norchestrator CI wiring suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
