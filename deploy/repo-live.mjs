/* Continuum physician platform: the LIVE repository adapter. This is the real Postgres backed
   implementation of the repository port (clinical/engine/repository.mjs), reading the physician
   schema in the dedicated project. It is the adapter the port doc said lives outside the pure
   engine: it performs I/O, so it lives on the deploy side (like xsd-validator.mjs).

   It takes an injected `execute(sql) -> Promise<rows[]>` so the SQL and mapping are testable
   without a network (the CI test injects a fake executor; the live runner injects a Supabase
   Management API executor). The orchestrators are unchanged: they await the same port methods.

   Read side for the batch dry run path (getClinic, getSignedReports, getObxSkeleton,
   getReportObservations, getReportFields, isPractitionerActive); recordBatchOutcome is a receipt
   only, because the dry run must not write (and audit.event is append only, so a dry run must
   not pollute it). commitSignature is the signature WRITE path (safe partial): it builds the one
   transaction that freezes a signed measurement, but takes the measurement header explicitly
   because the measurement_draft jsonb contract that would supply it is not built yet, and it
   refuses rather than fabricates when the header is absent or an axis is skipped. No production
   submission is enabled here. No dashes anywhere. */

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

    // The signature write path (Prompt 42 Section 2.1, safe partial). Persists a signed
    // measurement in ONE transaction: insert the functional_measurement header, one
    // functional_axis_value per answered axis, the band_derivation_audit rows, update the
    // wcb_report signature columns, and append the audit event. Testable with a fake executor;
    // no live write happens here.
    //
    // The header is taken EXPLICITLY (header arg, or bundle.header) because the measurement
    // header lives in the measurement_draft store, whose jsonb contract is owned by the Form
    // Engine and Screens prompt and is not built yet. This adapter must never fabricate an
    // immutable clinical row, so it refuses when the header is absent. answered is derived as
    // NOT skipped: the signature gate (sign_measurement.signatureBlockers) guarantees every axis
    // is answered or skipped, so a non skipped signed axis was answered. It also refuses a
    // skipped axis: migration 011 makes functional_axis_value.source NOT NULL, but a signed skip
    // carries no source, so persisting skips is an unresolved contract, surfaced not invented.
    async commitSignature(bundle, header) {
      const b = bundle || {};
      const h = header || b.header || {};
      const need = ["id", "clinic_id", "case_id", "practitioner_id", "form_id", "version", "measured_at", "effective_from", "created_by"];
      const missing = need.filter((k) => h[k] === undefined || h[k] === null);
      if (missing.length) {
        throw new Error("commitSignature (live) requires an explicit measurement header (missing: " + missing.join(", ") + "); it must not fabricate an immutable clinical.functional_measurement row until the measurement_draft contract lands.");
      }
      const axes = b.axis_value_rows || [];
      const skips = axes.filter((r) => r.skipped);
      if (skips.length) {
        const e = new Error("Refusing to persist a skipped axis (" + skips.map((r) => r.axis).join(", ") + "): migration 011 functional_axis_value.source is NOT NULL but a signed skip carries no source. The skipped axis persistence contract is unresolved.");
        e.code = "SKIPPED-AXIS-PERSISTENCE-UNRESOLVED";
        throw e;
      }

      const mid = h.id;
      const by = h.created_by;
      const ru = b.report_update || {};
      const ev = b.audit_event || {};
      const at = b.at ?? ru.signed_at ?? null;

      const mCols = "id, clinic_id, case_id, report_id, practitioner_id, form_id, version, measured_at, work_hours_per_day, modified_hours, modified_duties, fit_for_work, fit_override_reason, effective_from, effective_to, created_by";
      const mVals = [h.id, h.clinic_id, h.case_id, b.reportId, h.practitioner_id, h.form_id, h.version, h.measured_at, h.work_hours_per_day, h.modified_hours, h.modified_duties, h.fit_for_work, h.fit_override_reason, h.effective_from, h.effective_to, by].map(lit).join(", ");
      const insMeasurement = "insert into clinical.functional_measurement (" + mCols + ") values (" + mVals + ")";

      const avCols = "measurement_id, axis, answered, skipped, skip_reason, capability, restriction_code_list, measured_hours, measured_weight_kg, derived_band, derived_capability_code, rounded_down, below_lowest_band, source, created_by";
      const avRows = axes.map((r) => "(" + [mid, r.axis, !r.skipped, false, r.skip_reason ?? null, r.capability ?? null, r.restriction_code_list ?? r.code_list_name ?? null, r.measured_hours ?? null, r.measured_weight_kg ?? null, r.derived_band ?? null, r.derived_capability_code ?? null, Boolean(r.rounded_down), Boolean(r.below_lowest_band), r.source ?? null, by].map(lit).join(", ") + ")");
      const insAxis = avRows.length ? "insert into clinical.functional_axis_value (" + avCols + ") values " + avRows.join(", ") : null;

      const baCols = "measurement_id, axis, measured_weight_kg, measured_hours, emitted_band, emitted_capability_code, rounded_down, below_lowest_band, derived_by";
      const baRows = (b.band_derivation_audit || []).map((d) => "(" + [mid, d.axis, d.measured_weight_kg ?? null, d.measured_hours ?? null, d.emitted_band ?? null, d.emitted_capability_code ?? null, Boolean(d.rounded_down), Boolean(d.below_lowest_band), by].map(lit).join(", ") + ")");
      const insBand = baRows.length ? "insert into clinical.band_derivation_audit (" + baCols + ") values " + baRows.join(", ") : null;

      const updReport = "update clinical.wcb_report set status = " + lit(ru.status ?? "signed") + ", signed_at = " + lit(ru.signed_at ?? at) + ", snapshot_hash = " + lit(ru.snapshot_hash ?? null) + " where id = " + lit(b.reportId);

      const insAudit = "insert into audit.event (actor, action, entity, entity_id, detail, at) values (" +
        [ev.actor ?? null, ev.action ?? "sign_measurement", ev.entity ?? "wcb_report", ev.entity_id ?? b.reportId].map(lit).join(", ") +
        ", " + lit(JSON.stringify(ev.detail || {})) + "::jsonb, " + lit(at) + ")";

      const sql = ["begin", insMeasurement, insAxis, insBand, updReport, insAudit].filter(Boolean).join(";\n") + ";\ncommit;";
      await execute(sql);
      return { committed: true, measurement_id: mid };
    },
  };
}
