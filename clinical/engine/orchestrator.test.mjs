/* Continuum physician platform: the end to end wiring suite (Prompt 43a wiring). Proves the
   six orchestrators sequence the engines correctly against the in memory repository, that a
   batch is DORMANT by default (assemble and validate, never transmit, report status
   untouched), that even a forced open gate never transmits without a deliberately wired
   transmitter, that the employer wall and canonical guard hold on the publish path, and that
   the pink copy is never an employer delivery. No dashes anywhere. */

import { createInMemoryRepository } from "./repository.mjs";
import { signReport, runClinicBatch, ingestReturnFile, resubmitReport, publishEmployerView, producePinkCopy } from "./orchestrator.mjs";
import { SYNTH_POSITIONS, SYNTHETIC } from "../db/occupational_synth.data.mjs";
import { BASIC_LIST } from "./measurement.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

function seedRepo(overrides = {}) {
  return createInMemoryRepository({
    clinics: [{ id: "clinic-1", name: "Test Clinic", accreditation_status: overrides.accreditation || "none", region: "ca-central-1" }],
    practitioners: [{ id: "prac-1", clinic_id: "clinic-1", billing_number: "12345", name: "Dr Test", active: overrides.practitionerActive !== false }],
    reports: [{ id: "rep-1", case_id: "case-1", practitioner_id: "prac-1", form_id: "C050", version: 1, status: "draft", completed: false }],
    drafts: [{ report_id: "rep-1", practitioner_id: "prac-1", axisValues: [
      { axis: "lifting_floor_to_waist", answered: true, code_set: "basic", quantity_kind: "weight", capability: "limited", measured_weight_kg: 8, code_list_name: BASIC_LIST, source: "measured", provenance: "human" },
      { axis: "overhead_reaching", answered: true, code_set: "able_unable_only", quantity_kind: null, capability: "unable", source: "measured", provenance: "human" },
      { axis: "sitting", skipped: true },
    ] }],
    observations: [{ report_id: "rep-1", observations: [{ identifier: "JOBTITLE", value: "Gatehouse Officer" }, { identifier: "EMPNAME", value: "Acme" }] }],
    restrictions: [{ report_id: "rep-1", restrictionByAxis: {
      overhead_reaching: { capability: "unable" },
      lifting_floor_to_waist: { capability: "limited", quantity_kind: "weight", band: "LIMITED" },
    } }],
    consents: [{ case_id: "case-1", consent_b_granted: true }, { case_id: "case-2", consent_b_granted: false }],
    pinkData: [{ report_id: "rep-1", data: { completed: true, claim_number: "1234567", worker_name: "A Worker", axes: [
      { axis: "lifting_floor_to_waist", capability: "limited", quantity_kind: "weight", band: "LIMITED" },
      { axis: "overhead_reaching", capability: "unable" },
    ] } }],
    submissions: [{ id: "sub-1", report_id: "rep-1", case_id: "case-1", form_id: "C050", attempt: 1, status: "accepted", signed_by: "prac-1", signed_at: "2026-08-11T00:00:00Z" }],
  });
}

// -- 1. sign ----------------------------------------------------------------
{
  const repo = seedRepo();
  const r = await signReport(repo, { reportId: "rep-1" }, { signedAt: "2026-08-11T09:00:00Z" });
  ok("signReport signs a complete draft", r.signed === true && r.blocked === false);
  ok("signReport derives the 5 kg band from the raw 8 kg (criterion 9)", r.band_derivation_audit.find((a) => a.axis === "lifting_floor_to_waist").emitted_band === "LIMITED");
  ok("signReport writes a 64 char snapshot hash", typeof r.snapshot_hash === "string" && r.snapshot_hash.length === 64);
  ok("signReport moves the report to signed and stamps the hash", repo._debug.store.reports.get("rep-1").status === "signed" && repo._debug.store.reports.get("rep-1").snapshot_hash === r.snapshot_hash);
  ok("signReport appends a sign audit event", repo._debug.audit.some((e) => e.action === "sign_measurement"));
}
{
  const repo = seedRepo({ practitionerActive: false });
  const r = await signReport(repo, { reportId: "rep-1" });
  ok("signReport blocks on an inactive practitioner and writes nothing", r.signed === false && r.blockers.some((b) => b.id === "PRACTITIONER-INACTIVE") && repo._debug.store.reports.get("rep-1").status === "draft");
}

// -- 2. batch: dormant by default -------------------------------------------
{
  const repo = seedRepo();
  await signReport(repo, { reportId: "rep-1" }, { signedAt: "2026-08-11T09:00:00Z" });
  let transmitted = false;
  const effects = {
    generate: () => "<ZRPT_P03/>",
    validate: () => ({ ok: true, failures: [] }),
    transmit: () => { transmitted = true; return { ok: true }; },
    notify: () => {},
  };
  const out = await runClinicBatch(repo, effects, { clinicId: "clinic-1" }, { env: {} });
  ok("runClinicBatch is dry run when the gate is closed", out.status === "dry-run" && out.transmitted === false);
  ok("runClinicBatch validates in dry run and lists would submit reports", out.validated === true && out.would_submit.includes("rep-1"));
  ok("runClinicBatch never calls the transmitter in dry run", transmitted === false);
  ok("runClinicBatch leaves the report status untouched in dry run", repo._debug.store.reports.get("rep-1").status === "signed");
}

// -- 2b. batch: a forced open gate still never transmits without a wired transmitter -------
{
  const repo = seedRepo({ accreditation: "accredited" });
  await signReport(repo, { reportId: "rep-1" }, { signedAt: "2026-08-11T09:00:00Z" });
  let notified = null;
  const effects = { generate: () => "<ZRPT_P03/>", validate: () => ({ ok: true, failures: [] }), notify: (p) => { notified = p; } };
  const env = { CRON_SECRET: "x", CONTINUUM_ALLOW_BOARD_SUBMISSION: "true" };
  const out = await runClinicBatch(repo, effects, { clinicId: "clinic-1" }, { env });
  ok("an open gate with no transmitter returns upload-failed, never transmitted", out.status === "upload-failed" && out.returnedToSigned.includes("rep-1"));
  ok("an open gate with no transmitter escalates to a named human", notified && notified.recipient === "named-human");
}

// -- 2c. batch: empty when nothing is signed --------------------------------
{
  const repo = seedRepo();
  const out = await runClinicBatch(repo, { validate: () => ({ ok: true }) }, { clinicId: "clinic-1" }, { env: {} });
  ok("runClinicBatch is empty when no report is signed", out.status === "empty");
}

// -- 3. return file ---------------------------------------------------------
{
  const repo = seedRepo();
  const text = "1\t121023: Worker Personal Health Number must be BLANK since Worker Personal Health Number Indicator is No";
  const { result } = await ingestReturnFile(repo, { text, submissionId: "sub-1", attempt: 1, reportId: "rep-1" }, { jurisdiction: "AB", elementNames: ["Worker Personal Health Number Indicator"] });
  ok("ingestReturnFile marks a rejection as rejected", result.status === "rejected" && result.rejection_count === 1);
  ok("ingestReturnFile flags an unmapped code for human review", result.human_review_required === true && result.unmapped_count === 1);
  ok("ingestReturnFile records the result and moves the report to rejected", repo._debug.store.reports.get("rep-1").status === "rejected");
}

// -- 4. resubmit ------------------------------------------------------------
{
  const repo = seedRepo();
  const admin = await resubmitReport(repo, { submissionId: "sub-1", correction: { changedFields: ["claim_number"], correctedBy: "clerk-1" } }, { clinicalFields: ["diagnosis", "axes"] });
  ok("resubmitReport builds attempt 2 for an administrative correction", admin.blocked === false && admin.submission.attempt === 2);
  ok("resubmitReport leaves the original submission untouched", repo._debug.store.submissions.get("sub-1").attempt === 1);
  const clinical = await resubmitReport(repo, { submissionId: "sub-1", correction: { changedFields: ["diagnosis"] } }, { clinicalFields: ["diagnosis", "axes"] });
  ok("resubmitReport blocks a clinical change pending a new signature", clinical.blocked === true && clinical.status === "awaiting-new-signature");
}

// -- 5. employer view -------------------------------------------------------
const dataset = { SYNTHETIC, SYNTH_POSITIONS };
{
  const repo = seedRepo();
  const r = await publishEmployerView(repo, dataset, { caseId: "case-1", reportId: "rep-1", jobTitle: "Gatehouse Officer" }, { allowSynthetic: true });
  ok("publishEmployerView publishes when consent B is active", r.published === true && Array.isArray(r.lines));
  ok("publishEmployerView carries no raw measurement in the payload (the wall)", JSON.stringify(r).indexOf("measured_weight") === -1);
  ok("publishEmployerView appends a publish audit event", repo._debug.audit.some((e) => e.action === "publish_employer_view"));
}
{
  const repo = seedRepo();
  const r = await publishEmployerView(repo, dataset, { caseId: "case-2", reportId: "rep-1", jobTitle: "Gatehouse Officer" }, { allowSynthetic: true });
  ok("publishEmployerView refuses without consent B", r.published === false && r.reason === "consent-b-required");
}
{
  const repo = seedRepo();
  let threw = null;
  try { await publishEmployerView(repo, dataset, { caseId: "case-1", reportId: "rep-1", jobTitle: "Gatehouse Officer" }); }
  catch (e) { threw = e.code; }
  ok("publishEmployerView refuses a synthetic dataset without the override (canonical guard)", threw === "SYNTHETIC-NOT-AUTHORIZED");
}

// -- 6. pink copy -----------------------------------------------------------
{
  const repo = seedRepo();
  const r = await producePinkCopy(repo, { reportId: "rep-1" });
  ok("producePinkCopy produces the worker copy for a completed report", r.produced === true && r.copy.title.includes("WORKER COPY"));
  ok("the pink copy shows the derived band, not a raw measurement", JSON.stringify(r.copy.table).includes("5 kg"));
}

console.log("\norchestrator (end to end wiring) suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
