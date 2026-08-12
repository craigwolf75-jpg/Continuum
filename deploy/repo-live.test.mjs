/* Continuum: the live repository adapter suite (CI, no network). Injects a fake executor that
   returns canned rows and asserts the adapter builds the right queries against the physician
   schema and maps rows to the port shape. The real end to end run against the live project is a
   separate one shot verification (not in CI). No dashes anywhere. */

import { createLiveRepository, lit } from "./repo-live.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// -- lit escaping ------------------------------------------------------------
ok("lit quotes and doubles single quotes, NULLs null", lit("a'b") === "'a''b'" && lit(null) === "NULL" && lit(undefined) === "NULL" && lit("x") === "'x'");

// A fake executor: records every SQL and returns canned rows by query shape.
const seen = [];
const execute = async (sql) => {
  seen.push(sql);
  if (/from clinical\.clinic where id/.test(sql)) return [{ id: "c1", name: "Clinic", accreditation_status: "none", region: "ca-central-1" }];
  if (/wcb_report r join clinical\.wcb_case/.test(sql) && /status = 'signed'/.test(sql)) return [{ id: "r1", case_id: "ca1", practitioner_id: "p1", form_id: "C050E", version: 1, status: "signed", snapshot_hash: null }];
  if (/wcb_obx_skeleton/.test(sql)) return [{ obx_identifier: "JOBTITLE" }, { obx_identifier: "EMPNAME" }];
  if (/from clinical\.wcb_report_field/.test(sql)) return [{ identifier: "JOBTITLE", value: "Guard" }];
  if (/select active from clinical\.practitioner/.test(sql)) return [{ active: true }];
  if (/join clinical\.worker w/.test(sql)) return [{ family_name: "Roe", given_name: "Sam", middle_name: "T", phn: "987654321", sex: "M", date_of_birth: "1990-03-03", street: "1 Main", po_box: null, city: "Calgary", province: "AB", postal_code: "T2T2T2", phone_area: "403", phone_number: "5551234", claim_number: "1234567", date_of_injury: "2026-02-02", p_family: "Green", p_given: "Pat", role_code: "GP", p_phone_area: "780", p_phone_number: "5559999", form_id: "C050E" }];
  return [];
};
const repo = createLiveRepository({ execute });

ok("createLiveRepository requires an execute function", (() => { try { createLiveRepository({}); return false; } catch { return true; } })());

// -- getClinic ---------------------------------------------------------------
{
  const c = await repo.getClinic("c1");
  ok("getClinic maps the clinic row and targets the clinical schema", c.region === "ca-central-1" && /clinical\.clinic where id = 'c1'/.test(seen[seen.length - 1]));
}

// -- getSignedReports --------------------------------------------------------
{
  const r = await repo.getSignedReports("c1");
  ok("getSignedReports joins case to clinic and filters status signed", r.length === 1 && r[0].form_id === "C050E" && /c\.clinic_id = 'c1'/.test(seen[seen.length - 1]) && /status = 'signed'/.test(seen[seen.length - 1]));
}

// -- getObxSkeleton ----------------------------------------------------------
{
  const s = await repo.getObxSkeleton("C050E");
  ok("getObxSkeleton returns ordered identifiers and orders by ordinal", s.length === 2 && s[0] === "JOBTITLE" && /order by ordinal/.test(seen[seen.length - 1]));
}

// -- getReportObservations ---------------------------------------------------
{
  const o = await repo.getReportObservations("r1");
  ok("getReportObservations maps element_key to identifier", o.length === 1 && o[0].identifier === "JOBTITLE" && o[0].value === "Guard");
}

// -- getReportFields ---------------------------------------------------------
{
  const f = await repo.getReportFields("r1");
  ok("getReportFields maps worker components (po_box to pobox, postal_code to postal)", f.worker.family === "Roe" && f.worker.pobox === null && f.worker.postal === "T2T2T2" && f.worker.phn === "987654321");
  ok("getReportFields maps case and practitioner and the message form id", f.case.claim_number === "1234567" && f.case.claim_reference === "1234567" && f.practitioner.family === "Green" && f.practitioner.role_code === "GP" && f.message.formId === "C050E");
}

// -- isPractitionerActive ----------------------------------------------------
ok("isPractitionerActive reads the active flag", (await repo.isPractitionerActive("p1")) === true);

// -- recordBatchOutcome is a non persisting receipt (append only audit) ------
{
  const r = await repo.recordBatchOutcome({ status: "dry-run" });
  ok("recordBatchOutcome returns a receipt and does not persist", r.recorded === true && r.persisted === false);
}

console.log("\nlive repository adapter suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
