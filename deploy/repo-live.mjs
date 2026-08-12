/* Continuum physician platform: the LIVE repository adapter. This is the real Postgres backed
   implementation of the repository port (clinical/engine/repository.mjs), reading the physician
   schema in the dedicated project. It is the adapter the port doc said lives outside the pure
   engine: it performs I/O, so it lives on the deploy side (like xsd-validator.mjs).

   It takes an injected `execute(sql) -> Promise<rows[]>` so the SQL and mapping are testable
   without a network (the CI test injects a fake executor; the live runner injects a Supabase
   Management API executor). The orchestrators are unchanged: they await the same port methods.

   Read only for the batch dry run path (getClinic, getSignedReports, getObxSkeleton,
   getReportObservations, getReportFields, isPractitionerActive); recordBatchOutcome is a receipt
   only, because the dry run must not write (and audit.event is append only, so a dry run must
   not pollute it). No production submission is enabled here. No dashes anywhere. */

// A SQL string literal, single quotes doubled; NULL for null or undefined. The inputs are ids
// and form codes from the application, but everything is escaped regardless.
export function lit(v) {
  return v === null || v === undefined ? "NULL" : "'" + String(v).replace(/'/g, "''") + "'";
}

export function createLiveRepository(opts = {}) {
  const execute = opts.execute;
  if (typeof execute !== "function") throw new Error("createLiveRepository requires an injected execute(sql) function.");
  const rows = async (sql) => (await execute(sql)) || [];
  const one = async (sql) => { const r = await rows(sql); return r[0] || null; };

  return {
    async getClinic(clinicId) {
      return one("select id, name, accreditation_status, region from clinical.clinic where id = " + lit(clinicId));
    },

    async getSignedReports(clinicId) {
      return rows(
        "select r.id, r.case_id, r.practitioner_id, r.form_id, r.version, r.status, r.snapshot_hash " +
        "from clinical.wcb_report r join clinical.wcb_case c on c.id = r.case_id " +
        "where c.clinic_id = " + lit(clinicId) + " and r.status = 'signed'"
      );
    },

    async getObxSkeleton(formId) {
      const r = await rows("select obx_identifier from clinical.wcb_obx_skeleton where form_id = " + lit(formId) + " order by ordinal");
      return r.map((x) => x.obx_identifier);
    },

    async getReportObservations(reportId) {
      const r = await rows("select element_key as identifier, value from clinical.wcb_report_field where report_id = " + lit(reportId) + " order by element_key");
      return r.map((x) => ({ identifier: x.identifier, value: x.value }));
    },

    async isPractitionerActive(id) {
      const r = await one("select active from clinical.practitioner where id = " + lit(id));
      return Boolean(r && r.active !== false);
    },

    // Reads the worker, case and practitioner for a report and maps them to the shape
    // hl7report.populateReportUnit expects (worker components, case, practitioner, message).
    async getReportFields(reportId) {
      const r = await one(
        "select w.family_name, w.given_name, w.middle_name, w.phn, w.sex, w.date_of_birth, " +
        "w.street, w.po_box, w.city, w.province, w.postal_code, w.phone_area, w.phone_number, " +
        "c.claim_number, c.date_of_injury, p.family_name as p_family, p.given_name as p_given, " +
        "p.role_code, p.phone_area as p_phone_area, p.phone_number as p_phone_number, r.form_id " +
        "from clinical.wcb_report r join clinical.wcb_case c on c.id = r.case_id " +
        "join clinical.worker w on w.id = c.worker_id join clinical.practitioner p on p.id = r.practitioner_id " +
        "where r.id = " + lit(reportId)
      );
      if (!r) return null;
      return {
        worker: {
          family: r.family_name, given: r.given_name, middle: r.middle_name, phn: r.phn, sex: r.sex,
          date_of_birth: r.date_of_birth, street: r.street, pobox: r.po_box, city: r.city,
          province: r.province, postal: r.postal_code, phone_area: r.phone_area, phone_number: r.phone_number,
        },
        case: { claim_number: r.claim_number, claim_reference: r.claim_number, date_of_injury: r.date_of_injury },
        practitioner: { family: r.p_family, given: r.p_given, role_code: r.role_code, phone_area: r.p_phone_area, phone_number: r.p_phone_number },
        message: { formId: r.form_id, injuryDate: r.date_of_injury },
      };
    },

    // The dry run does not persist (audit.event is append only). Return a receipt.
    async recordBatchOutcome() { return { recorded: true, persisted: false }; },
  };
}
