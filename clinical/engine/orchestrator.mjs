/* Continuum physician platform: the end to end orchestrators (Prompt 43a wiring).

   These functions are the connective tissue the pure engines never carried: they read and
   write through an injected repository (repository.mjs port) and sequence the engines into
   the real flows. They stay pure themselves: no clock (timestamps are injected), no network
   (upload and notify are injected), no database (the repository is injected). That is what
   lets the whole chain be tested against the in memory repository, and lets the same code
   run against the Montreal Postgres adapter unchanged.

   The six flows:
     signReport         Prompt 39 and 42: freeze the draft, derive bands, hash, persist.
     runClinicBatch     Prompt 42: collect signed, assemble, validate, and (only when the
                        submission gate is open, which Claude never opens) transmit. Dormant
                        by default: assemble and validate, never transmit.
     ingestReturnFile   Prompt 42: parse the board return file, reconcile, record.
     resubmitReport     Prompt 42: a new attempt, original untouched, signature policy honored.
     publishEmployerView Prompt 43: consent gate, canonical guard, then the wall check.
     producePinkCopy    Prompt 43: the worker copy, never delivered to an employer.

   Every write that alters data appends an audit event, per accreditation condition 0A.1.
   Nothing here enables production submission; that is structurally impossible without the
   gate (submission_gate.mjs). No dashes anywhere. */

import { signMeasurement, provenanceAudit } from "./sign_measurement.mjs";
import { runBatch } from "./batch.mjs";
import { serializeObxSection } from "./hl7gen.mjs";
import { extractReportUnits, getObxSection, buildReportUnit, assembleFromTemplate } from "./hl7envelope.mjs";
import { parseReturnFile, reconcileReturnFile, buildSubmissionResult } from "./returnfile.mjs";
import { resubmit } from "./resubmission.mjs";
import { employerViewAllowed } from "./consent.mjs";
import { capacityFromBand } from "./dutymatch.mjs";
import { publishDutyMatch } from "./occupational.mjs";
import { rawMeasurementInPayload } from "./employer_schema.mjs";
import { pinkCopy } from "./pinkcopy.mjs";
import { productionSubmissionEnabled, disabledUploader } from "./submission_gate.mjs";

const nn = async (v) => (v && typeof v.then === "function" ? await v : v);

// -- 1. sign ----------------------------------------------------------------
// Freeze the draft at signature: derive bands, compute the snapshot hash, and persist the
// report update, the frozen axis rows, the band derivation audit and the audit event in one
// transaction. Refuses to persist a capability with no human source (criterion 1), a defense
// in depth check on top of the signature gate. Returns the signMeasurement result.
export async function signReport(repo, params, opts = {}) {
  const input = await nn(repo.getSignableInput(params.reportId));
  if (!input) return { signed: false, blocked: true, blockers: [{ id: "REPORT-NOT-FOUND", message: "No signable draft for report " + params.reportId }] };

  const result = signMeasurement(input, { signedAt: opts.signedAt || null });
  if (!result.signed) return result;

  const leaks = provenanceAudit(result.axis_value_rows);
  if (leaks.length) {
    const e = new Error("Refusing to persist a signature: " + leaks.length + " axis rows carry a capability with no human source (criterion 1).");
    e.code = "PROVENANCE-LEAK";
    e.rows = leaks;
    throw e;
  }

  await nn(repo.commitSignature({
    reportId: params.reportId,
    report_update: result.report_update,
    axis_value_rows: result.axis_value_rows,
    band_derivation_audit: result.band_derivation_audit,
    audit_event: result.audit_event,
    at: opts.signedAt || null,
  }));
  return result;
}

// -- 2. batch ---------------------------------------------------------------
// Assemble the signed reports into one file, validate it, and transmit only when the
// submission gate is open. Dormant by default: when the gate is closed (the standing case),
// the batch assembles and validates to PROVE readiness, records a dry run outcome, and does
// NOT transmit and does NOT change any report status. When the gate is open (which Claude
// never opens), it delegates to runBatch with the injected transmitter.
//
// effects: { generate(signed), validate(xml), notify(payload), transmit(xml) }. generate and
// validate are injected because generate depends on the full ZRPT_P03 envelope (staged as
// the next HL7 increment) and validate depends on the deploy side xmllint-wasm; keeping them
// injected leaves this module free of the wasm dependency and of the envelope gap.
export async function runClinicBatch(repo, effects, params, opts = {}) {
  const env = opts.env || {};
  const clinic = await nn(repo.getClinic(params.clinicId));
  const signed = await nn(repo.getSignedReports(params.clinicId));
  if (!signed.length) { await nn(repo.recordBatchOutcome({ clinic_id: params.clinicId, status: "empty", transmitted: false })); return { status: "empty" }; }

  const generate = effects.generate || defaultAssemble(repo, { template: opts.template });
  const validate = effects.validate;
  if (typeof validate !== "function") throw new Error("runClinicBatch requires an injected validate function (deploy xsd-validator adapter).");

  const gateOpen = productionSubmissionEnabled(env, clinic);
  if (!gateOpen) {
    // Dormant path: assemble and validate, never transmit, never mutate report status.
    const xml = await nn(generate(signed));
    const v = await nn(validate(xml));
    const outcome = {
      clinic_id: params.clinicId, status: "dry-run", transmitted: false,
      validated: Boolean(v && v.ok), failures: v && v.ok ? [] : (v ? v.failures : ["validation-unavailable"]),
      would_submit: signed.map((r) => r.id),
      submission_disabled_reason: "production submission gate closed (Prompt 43a gate 1 prerequisites and operator flag)",
    };
    await nn(repo.recordBatchOutcome(outcome));
    return outcome;
  }

  // Live path (never reached by Claude): a real transmitter must be injected; otherwise the
  // disabled uploader refuses and runBatch returns the reports to signed and notifies.
  const upload = effects.transmit || disabledUploader("no-transmitter-wired");
  const out = runBatch({
    reports: signed,
    isPractitionerActive: (id) => Boolean(repo.isPractitionerActive(id)),
    generate, validate, upload, notify: effects.notify,
  });
  await nn(repo.recordBatchOutcome({ clinic_id: params.clinicId, ...out, transmitted: out.status === "uploaded" }));
  return out;
}

// The default assembler: build the full ZRPT_P03 batch through the envelope module
// (hl7envelope.mjs). A template document (a committed board sample) supplies the demographic
// envelope; each signed report contributes its OBX section (hl7gen serializeObxSection),
// swapped into a report unit with its own control id, and the units assemble with the trailer
// counts set. The envelope is complete and board conforming (proven in
// deploy/hl7envelope.test.mjs against the real structural schema).
//
// The remaining increment is per report FIELD population: PID, PV1 and FT1 from live worker
// and case data, and the full OBX skeleton from the seed (migration 009 and 010). Until that
// lands the demographic fields come from the template, so the default assembler needs an
// injected template (opts.template) to produce a valid document; a report with no observations
// keeps the template's OBX section so the batch still validates.
function defaultAssemble(repo, opts = {}) {
  return async (signed) => {
    if (!opts.template) {
      const e = new Error("runClinicBatch needs an injected template (a committed board sample) until per report field mapping is wired: pass opts.template or effects.generate.");
      e.code = "NO-TEMPLATE";
      throw e;
    }
    const templateUnit = extractReportUnits(opts.template)[0];
    const units = [];
    for (const r of signed) {
      const obs = await nn(repo.getReportObservations(r.id));
      const obxSection = obs && obs.length ? serializeObxSection(obs) : getObxSection(templateUnit);
      units.push(buildReportUnit(templateUnit, { controlId: r.id, obxSection }));
    }
    return assembleFromTemplate(opts.template, units);
  };
}

// -- 3. return file ---------------------------------------------------------
// Parse the board return file, reconcile against the error catalogue, build the submission
// result, and record it. Nothing is swallowed: unmapped codes and unparsed lines flag human
// review (returnfile.mjs).
export async function ingestReturnFile(repo, params, opts = {}) {
  const parsed = parseReturnFile(params.text);
  const reconciled = reconcileReturnFile(parsed, opts.catalogueIndex || {}, {
    jurisdiction: opts.jurisdiction || "", elementNames: opts.elementNames || [], floor: opts.floor,
  });
  const result = buildSubmissionResult(params.submissionId, params.attempt, reconciled);
  await nn(repo.recordSubmissionResult({ report_id: params.reportId, ...result }));
  await nn(repo.appendAudit({ action: "ingest_return_file", entity: "wcb_submission", entity_id: params.submissionId, detail: { status: result.status, unmapped: result.unmapped_count } }));
  return { result, catalogueGrowth: reconciled.catalogueGrowth };
}

// -- 4. resubmit ------------------------------------------------------------
// Build a new attempt, leave the original untouched, honor the (provisional, configurable)
// signature policy. A clinical change is blocked pending a new signature (resubmission.mjs).
export async function resubmitReport(repo, params, opts = {}) {
  const original = await nn(repo.getSubmission(params.submissionId));
  if (!original) return { blocked: true, reason: "no-original-submission" };
  const row = resubmit(original, params.correction || {}, { clinicalFields: opts.clinicalFields, policy: opts.policy });
  if (row.blocked) return row; // awaiting new signature; nothing persisted
  const saved = await nn(repo.insertResubmission(row));
  await nn(repo.appendAudit({ action: "resubmit", entity: "wcb_submission", entity_id: saved.id, detail: { attempt: saved.attempt, classification: saved.classification } }));
  return { blocked: false, submission: saved };
}

// -- 5. employer view -------------------------------------------------------
// Publish the duty match to the employer ONLY when consent B is active, ONLY against the
// canonical occupational dataset (the synthetic guard throws otherwise), and ONLY after the
// wall check confirms no raw measurement or clinical term is in the payload (criteria 1, 2).
// Reads the DERIVED band, never the raw measurement (criterion 9).
export async function publishEmployerView(repo, dataset, params, opts = {}) {
  const consentB = await nn(repo.getConsentB(params.caseId));
  if (!employerViewAllowed(consentB)) return { published: false, reason: "consent-b-required" };

  const derived = await nn(repo.getDerivedRestrictions(params.reportId));
  const restrictionByAxis = {};
  for (const [axis, r] of Object.entries(derived || {})) {
    restrictionByAxis[axis] = {
      capability: r.capability,
      quantity_kind: r.quantity_kind,
      capacityKg: r.quantity_kind === "weight" ? capacityFromBand(r.band) : undefined,
      hoursLimit: r.quantity_kind === "hours" ? r.hoursLimit : undefined,
      legacyNoMeasurement: r.legacyNoMeasurement === true,
    };
  }

  const result = publishDutyMatch(dataset, params.jobTitle, restrictionByAxis, { allowSynthetic: opts.allowSynthetic === true });

  // The wall (criteria 1 and 2): never publish a payload that carries a raw measurement or a
  // banned clinical term, structurally, not by inspection. A hit is a defect, so throw.
  const leaks = rawMeasurementInPayload(result);
  if (leaks.length) {
    const e = new Error("Refusing to publish an employer view: the payload carries " + leaks.length + " raw measurement or clinical terms (Prompt 43 wall, criteria 1 and 2).");
    e.code = "EMPLOYER-WALL-BREACH";
    e.leaks = leaks;
    throw e;
  }
  await nn(repo.appendAudit({ action: "publish_employer_view", entity: "wcb_case", entity_id: params.caseId, detail: { published: result.published, summary: result.summary || null } }));
  return result;
}

// -- 6. pink copy -----------------------------------------------------------
// Produce the worker copy from a completed report. Never delivered to an employer by
// Continuum (pinkcopy.mjs employerDeliveryAllowed is false); the lawful channel is the
// worker handing it over.
export async function producePinkCopy(repo, params) {
  const data = await nn(repo.getPinkCopyData(params.reportId));
  if (!data) return { produced: false, reason: "report-not-found" };
  const copy = pinkCopy(data);
  if (!copy) return { produced: false, reason: "report-not-complete" };
  return { produced: true, copy };
}
