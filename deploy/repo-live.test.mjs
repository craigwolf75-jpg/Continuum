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
  if (/from clinical\.clinic where id/.test(sql)) return [{ id: "c1", name: "Worker 44", accreditation_status: "none", region: "ca-central-1" }];
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

// -- commitSignature (the signReport write path, safe partial) ---------------
// Writes what the signed bundle plus an EXPLICIT header determine, in ONE atomic transaction:
// insert functional_measurement (header) + functional_axis_value (answered axes) +
// band_derivation_audit, update wcb_report, append audit.event. It does NOT read the draft
// (that jsonb contract is not built) and does NOT run live here (fake executor). It refuses to
// fabricate: no header, or a skipped axis (011 source is NOT NULL but a signed skip carries no
// source), and it is rejected rather than invented.
const writes = [];
const wExec = async (sql) => { writes.push(sql); return []; };
const wRepo = createLiveRepository({ execute: wExec });

const header = { id: "m1", clinic_id: "c1", case_id: "ca1", practitioner_id: "p1", form_id: "C050E", version: 1, measured_at: "2026-08-11T09:00:00Z", work_hours_per_day: "8.00", modified_hours: false, modified_duties: true, fit_for_work: "MODIFIED", fit_override_reason: null, effective_from: "2026-08-11", effective_to: null, created_by: "p1" };
const bundle = {
  reportId: "r1",
  report_update: { status: "signed", signed_at: "2026-08-11T09:00:00Z", snapshot_hash: "abc123" },
  axis_value_rows: [
    { axis: "lifting_floor_to_waist", skipped: false, capability: "limited", derived_band: "LIMITED", derived_capability_code: "LIMITED", rounded_down: false, below_lowest_band: false, measured_weight_kg: "5.00", measured_hours: null, source: "measured", provenance: "human" },
    { axis: "sitting", skipped: false, capability: "able", derived_band: null, derived_capability_code: "ABLE", rounded_down: false, below_lowest_band: false, measured_weight_kg: null, measured_hours: null, source: "measured", provenance: "human" },
  ],
  band_derivation_audit: [
    { axis: "lifting_floor_to_waist", measured_weight_kg: "5.00", measured_hours: null, emitted_band: "LIMITED", emitted_capability_code: "LIMITED", rounded_down: false, below_lowest_band: false },
  ],
  audit_event: { action: "sign_measurement", entity: "wcb_report", entity_id: "r1", actor: "p1", detail: { snapshot_hash: "abc123", axis_count: 2 } },
  at: "2026-08-11T09:00:00Z",
};

{
  const before = writes.length;
  const res = await wRepo.commitSignature(bundle, header);
  ok("commitSignature runs exactly one atomic statement wrapped in begin and commit", writes.length - before === 1 && /^\s*begin\s*;/i.test(writes[writes.length - 1]) && /commit\s*;?\s*$/i.test(writes[writes.length - 1].trim()));
  const sql = writes[writes.length - 1];
  ok("it inserts the functional_measurement header (supplied id, clinic, case, created_by)", /insert into clinical\.functional_measurement/.test(sql) && /'m1'/.test(sql) && /'c1'/.test(sql) && /'ca1'/.test(sql) && /'2026-08-11T09:00:00Z'/.test(sql));
  ok("it inserts a functional_axis_value row per answered axis, keyed to the measurement, answered true skipped false", /insert into clinical\.functional_axis_value/.test(sql) && /lifting_floor_to_waist/.test(sql) && /sitting/.test(sql) && /'LIMITED'/.test(sql) && /'ABLE'/.test(sql));
  ok("it inserts the band_derivation_audit rows with derived_by the practitioner", /insert into clinical\.band_derivation_audit/.test(sql) && /derived_by/.test(sql));
  ok("it updates wcb_report status, signed_at and snapshot_hash by report id (not an insert only table)", /update clinical\.wcb_report set /.test(sql) && /status = 'signed'/.test(sql) && /snapshot_hash = 'abc123'/.test(sql) && /where id = 'r1'/.test(sql));
  ok("it appends the audit event with the detail as jsonb", /insert into audit\.event/.test(sql) && /'sign_measurement'/.test(sql) && /::jsonb/.test(sql));
  const iM = sql.indexOf("clinical.functional_measurement"), iA = sql.indexOf("clinical.functional_axis_value"), iB = sql.indexOf("clinical.band_derivation_audit"), iR = sql.indexOf("update clinical.wcb_report"), iE = sql.indexOf("audit.event");
  ok("the statements run in dependency order (measurement, axis values, band audit, report update, audit event)", iM < iA && iA < iB && iB < iR && iR < iE);
  ok("commitSignature returns a receipt naming the measurement id", res.committed === true && res.measurement_id === "m1");
}

ok("commitSignature refuses to write without an explicit header (never fabricates an immutable measurement row)", await (async () => {
  try { await wRepo.commitSignature(bundle, {}); return false; } catch (e) { return /header/i.test(e.message); }
})());

ok("commitSignature refuses a skipped axis (011 source is NOT NULL but a signed skip carries no source)", await (async () => {
  const skippedBundle = { ...bundle, axis_value_rows: [{ axis: "driving", skipped: true, capability: null, derived_band: null, derived_capability_code: null, rounded_down: false, below_lowest_band: false, source: null, provenance: null }] };
  try { await wRepo.commitSignature(skippedBundle, header); return false; } catch (e) { return e.code === "SKIPPED-AXIS-PERSISTENCE-UNRESOLVED"; }
})());

console.log("\nlive repository adapter suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
