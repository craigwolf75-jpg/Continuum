/* Continuum physician platform: the repository PORT (Prompt 43a wiring).

   The orchestrators (orchestrator.mjs) are pure: they sequence the engines and read and
   write through a repository object that is INJECTED, never imported. This file documents
   that port and ships an in memory reference implementation used by the tests and local
   development. The real adapter that binds this port to the dedicated Montreal Supabase
   project (the clinical, employer and audit schemas of migration 016 and following) is
   deliberately NOT in this file: it needs the live schema and a database client, and Claude
   never creates or touches that project. When the schema is live, the app supplies a Postgres
   backed object with the same method names and shapes, and the orchestrators do not change.

   THE PORT (every method is synchronous here for a deterministic test; a real adapter may
   return promises and the orchestrators await, which is a no op on a plain value):

     getSignableInput(reportId)      -> { report, practitioner, axisValues } | null
     commitSignature(bundle)         -> persists report_update, axis rows, band audit, audit
                                        event in ONE transaction; returns { committed: true }
     getSignedReports(clinicId)      -> [ report, ... ] with status signed
     getReportObservations(reportId) -> ordered [ { identifier, value }, ... ] (OBX values)
     getObxSkeleton(formId)          -> ordered [ obx_identifier, ... ] (wcb_obx_skeleton seed,
                                        009/010: the form's full OBX skeleton in ordinal order)
     getReportFields(reportId)       -> { worker, case, practitioner, message } | null
                                        (the per report identity and demographic values;
                                        hl7report populateReportUnit fills the segments)
     getClinic(clinicId)             -> { id, accreditation_status, region } | null
     isPractitionerActive(id)        -> boolean
     recordBatchOutcome(outcome)     -> { recorded: true }
     recordSubmissionResult(result)  -> { recorded: true }
     getSubmission(submissionId)     -> the original submission row | null
     insertResubmission(row)         -> the inserted row (attempt + 1; original untouched)
     getConsentB(caseId)             -> { granted, revoked_at } | null
     getDerivedRestrictions(reportId)-> { axis: { capability, quantity_kind, band, hoursLimit } }
                                        DERIVED bands only, never a raw measurement
     getPinkCopyData(reportId)       -> the completed report shape pinkcopy.mjs expects | null
     appendAudit(event)              -> { appended: true }

   Pure data structures. No dashes anywhere. */

// Build an in memory repository from a seed of plain arrays and maps. Test and dev only;
// this is NOT the production adapter. Every write mutates the in memory store and appends an
// audit event where the port promises one, mirroring the append only audit.event table.
export function createInMemoryRepository(seed = {}) {
  const store = {
    clinics: new Map((seed.clinics || []).map((c) => [c.id, { ...c }])),
    practitioners: new Map((seed.practitioners || []).map((p) => [p.id, { ...p }])),
    reports: new Map((seed.reports || []).map((r) => [r.id, { ...r }])),
    drafts: new Map((seed.drafts || []).map((d) => [d.report_id, { ...d }])),
    observations: new Map((seed.observations || []).map((o) => [o.report_id, o.observations.slice()])),
    reportFields: new Map((seed.reportFields || []).map((f) => [f.report_id, { ...f.fields }])),
    obxSkeletons: new Map((seed.obxSkeletons || []).map((s) => [s.form_id, s.identifiers.slice()])),
    restrictions: new Map((seed.restrictions || []).map((x) => [x.report_id, { ...x.restrictionByAxis }])),
    consents: new Map((seed.consents || []).map((c) => [c.case_id, { ...c }])),
    pinkData: new Map((seed.pinkData || []).map((p) => [p.report_id, { ...p.data }])),
    submissions: new Map((seed.submissions || []).map((s) => [s.id, { ...s }])),
  };
  const axisValues = new Map(); // report_id -> frozen axis rows
  const audit = [];             // append only mirror of audit.event
  const batchOutcomes = [];
  const submissionResults = [];

  return {
    // -- read side ---------------------------------------------------------
    getSignableInput(reportId) {
      const draft = store.drafts.get(reportId);
      if (!draft) return null;
      const report = store.reports.get(reportId) || null;
      const practitioner = store.practitioners.get(draft.practitioner_id) || null;
      return { report, practitioner, axisValues: (draft.axisValues || []).slice() };
    },
    getSignedReports(clinicId) {
      const out = [];
      for (const r of store.reports.values()) {
        if (r.status !== "signed") continue;
        const p = store.practitioners.get(r.practitioner_id);
        if (p && p.clinic_id === clinicId) out.push({ ...r });
      }
      return out;
    },
    getReportObservations(reportId) { return (store.observations.get(reportId) || []).slice(); },
    getObxSkeleton(formId) { return (store.obxSkeletons.get(formId) || []).slice(); },
    getReportFields(reportId) { const f = store.reportFields.get(reportId); return f ? { ...f } : null; },
    getClinic(clinicId) { const c = store.clinics.get(clinicId); return c ? { ...c } : null; },
    isPractitionerActive(id) { const p = store.practitioners.get(id); return Boolean(p && p.active !== false); },
    getSubmission(submissionId) { const s = store.submissions.get(submissionId); return s ? { ...s } : null; },
    getConsentB(caseId) { const c = store.consents.get(caseId); return c ? { granted: c.consent_b_granted === true, revoked_at: c.consent_b_revoked_at || null } : null; },
    getDerivedRestrictions(reportId) { const r = store.restrictions.get(reportId); return r ? { ...r } : {}; },
    getPinkCopyData(reportId) { const d = store.pinkData.get(reportId); return d ? { ...d } : null; },

    // -- write side (each returns a small receipt) -------------------------
    commitSignature(bundle) {
      const report = store.reports.get(bundle.reportId);
      if (report) Object.assign(report, bundle.report_update);
      axisValues.set(bundle.reportId, (bundle.axis_value_rows || []).slice());
      if (bundle.audit_event) audit.push({ ...bundle.audit_event, at: bundle.at || null });
      return { committed: true };
    },
    recordBatchOutcome(outcome) { batchOutcomes.push({ ...outcome }); return { recorded: true }; },
    recordSubmissionResult(result) {
      submissionResults.push({ ...result });
      const rep = store.reports.get(result.report_id);
      if (rep) rep.status = result.status === "accepted" ? "accepted" : "rejected";
      return { recorded: true };
    },
    insertResubmission(row) {
      const id = row.id || "sub-" + (store.submissions.size + 1);
      const saved = { ...row, id };
      store.submissions.set(id, saved);
      return { ...saved };
    },
    appendAudit(event) { audit.push({ ...event }); return { appended: true }; },

    // -- test introspection (not part of the port) -------------------------
    _debug: { store, axisValues, audit, batchOutcomes, submissionResults },
  };
}
