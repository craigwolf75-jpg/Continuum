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
import { validateAgainstSchemas } from "./xsd-validator.mjs";

const SAMPLES = join(dirname(fileURLToPath(import.meta.url)), "..", "clinical", "db", "samples");
const sampleXml = readFileSync(join(SAMPLES, "5.01 - C050E - Max Fields with Attachment.xml"), "utf8");

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

function repoWithSignedReport() {
  return createInMemoryRepository({
    clinics: [{ id: "clinic-1", name: "Test Clinic", accreditation_status: "none", region: "ca-central-1" }],
    practitioners: [{ id: "prac-1", clinic_id: "clinic-1", billing_number: "12345", name: "Dr Test", active: true }],
    reports: [{ id: "rep-1", case_id: "case-1", practitioner_id: "prac-1", form_id: "C050E", version: 1, status: "signed", snapshot_hash: "0".repeat(64) }],
    observations: [{ report_id: "rep-1", observations: [{ identifier: "JOBTITLE", value: "Gatehouse Officer" }] }],
  });
}

// The validate adapter: wrap the real two schema validator into the { ok, failures } shape
// the batch worker expects. The structural schema is the hard gate (Prompt 43a gate 2).
const validate = async (xml) => {
  const r = await validateAgainstSchemas(xml, { fileName: "batch.xml" });
  return { ok: r.valid === true && r.blocked === false, failures: r.errors };
};

// Gate closed (no accreditation, no cron secret, no flag): the batch must be dry run and must
// not transmit. generate returns a real board sample so validate runs on a real document.
{
  const repo = repoWithSignedReport();
  let transmitted = false;
  const out = await runClinicBatch(
    repo,
    { generate: () => sampleXml, validate, transmit: () => { transmitted = true; return { ok: true }; }, notify: () => {} },
    { clinicId: "clinic-1" },
    { env: {} },
  );
  ok("the batch is dry run while the submission gate is closed", out.status === "dry-run" && out.transmitted === false);
  ok("the real xmllint-wasm validator passes the real board sample through the orchestrator", out.validated === true);
  ok("the transmitter is never called while the gate is closed", transmitted === false);
  ok("the signed report is not mutated by a dry run batch", repo._debug.store.reports.get("rep-1").status === "signed");
  ok("the dry run records the reports it would submit", out.would_submit.includes("rep-1"));
}

console.log("\norchestrator CI wiring suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
