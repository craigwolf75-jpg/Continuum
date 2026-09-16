/* Prompt 49 normalisation engine.

   Fourteen named stages. Structured result, never an unclassified
   exception. A hard ceiling breach returns processing_failure and does
   not hold a transaction. Stage 12 is never bypassed.
   No em dashes or en dashes. */

import {
  STAGE_NAMES,
  CEILINGS_MS,
  stagePayloadValidation,
  stageSchemaValidation,
  stageFieldMapping,
  stageTypeConversion,
  stageCodeMapping,
  stageStatusMapping,
  stageDateNormalisation,
  stageUnitNormalisation,
  stageIdentifierExtraction,
  stageCanonicalGeneration,
  stageProvenanceCapture,
  stageIdentityResolution,
  stageDomainValidation,
} from "./stages.mjs";
import { createResult, clinicErrorMessage } from "./result.mjs";
import { createReferenceAdapter } from "./reference_adapter.mjs";
import { namedError } from "./util.mjs";

export function runNormalisation(input, store, metrics, adapter) {
  const started = nowMs();
  const correlationId = (input && input.correlation_id) || (store && store.correlation_id) || "corr-unknown";
  const duration = {};
  const warnings = [];
  const errors = [];
  const ad = adapter || createReferenceAdapter();
  let stageName = "PAYLOAD_VALIDATION";

  try {
    const envelope = input.envelope || {};
    const raw = input.raw;
    const intermediate = input.intermediate || (typeof ad.parseInbound === "function" ? ad.parseInbound(raw).intermediate : raw);

    let r;
    r = timed("PAYLOAD_VALIDATION", () => stagePayloadValidation({
      raw,
      content_type: input.content_type || envelope.content_type,
      declared_content_type: input.declared_content_type || envelope.content_type,
      max_bytes: input.max_bytes,
    }), duration, metrics, input);
    if (!r.ok) return finish(r.outcome, null, warnings, r.errors, envelope, duration, correlationId, metrics);

    r = timed("SCHEMA_VALIDATION", () => stageSchemaValidation({
      schema_version: input.schema_version || envelope.schema_version || intermediate.schema_version,
      intermediate,
      require_structure: input.require_structure,
    }, ad), duration, metrics, input);
    if (!r.ok) {
      if (metrics) metrics.increment("unsupported_schema_total", { adapter: ad.descriptor().name, canonical_version: envelope.canonical_version || "1.0.0" });
      return finish(r.outcome, null, warnings, r.errors, envelope, duration, correlationId, metrics);
    }

    r = timed("FIELD_MAPPING", () => stageFieldMapping(intermediate, ad, metrics), duration, metrics, input);
    const mapped = { ...r.mapped, extension_payload: r.extension_payload };
    Object.assign(mapped, {
      organisation_id: input.connection_organisation_id || envelope.organisation_id,
      connection_id: envelope.connection_id || input.connection_id,
      external_system: envelope.source_system || "synthetic",
      authorship_provenance: intermediate.authorship_provenance,
      required_fields: input.required_fields || [],
      namespace_key: intermediate.namespace_key,
      at: input.at,
      jurisdiction_code: intermediate.jurisdiction_code,
      case_id: intermediate.case_id || intermediate.case_external_id,
      consent_ledger_id: intermediate.consent_ledger_id,
      weight_value: intermediate.weight_value,
      weight_unit: intermediate.weight_unit,
      measured_hours: intermediate.measured_hours,
      derived_band: intermediate.derived_band,
    });

    r = timed("TYPE_CONVERSION", () => stageTypeConversion(mapped), duration, metrics, input);
    warnings.push(...(r.warnings || []));
    let converted = r.converted;

    r = timed("CODE_MAPPING", () => stageCodeMapping(converted, store, metrics), duration, metrics, input);
    warnings.push(...(r.warnings || []));
    converted = r.converted;

    r = timed("STATUS_MAPPING", () => stageStatusMapping(converted, store, metrics), duration, metrics, input);
    warnings.push(...(r.warnings || []));
    converted = r.converted;

    r = timed("DATE_NORMALISATION", () => stageDateNormalisation(converted, {
      sourceGuaranteesUtc: intermediate.source_guarantees_utc === true,
      now: input.now || (store && store.now),
    }), duration, metrics, input);
    warnings.push(...(r.warnings || []));
    converted = r.converted;

    r = timed("UNIT_NORMALISATION", () => stageUnitNormalisation(converted), duration, metrics, input);
    warnings.push(...(r.warnings || []));
    converted = r.converted;

    r = timed("IDENTIFIER_EXTRACTION", () => stageIdentifierExtraction(converted, store), duration, metrics, input);
    warnings.push(...(r.warnings || []));
    converted = r.converted;

    r = timed("CANONICAL_GENERATION", () => stageCanonicalGeneration(converted), duration, metrics, input);
    if (!r.ok) return finish(r.outcome, null, warnings, r.errors, envelope, duration, correlationId, metrics);
    let canonical = r.canonical;

    r = timed("PROVENANCE_CAPTURE", () => stageProvenanceCapture(canonical, {
      ...envelope,
      mapping_version: converted.mapping_version,
    }, intermediate.authorship_provenance, metrics), duration, metrics, input);
    if (r.halt_outcome) {
      if (metrics) metrics.increment("reconciliation_required_total", { adapter: ad.descriptor().name });
      return finish(r.halt_outcome, null, warnings, r.errors || errors, envelope, duration, correlationId, metrics, null, r.source_provenance || (r.canonical && r.canonical.source_provenance));
    }
    canonical = r.canonical;

    r = timed("IDENTITY_RESOLUTION", () => stageIdentityResolution(canonical, store, metrics), duration, metrics, input);
    const identity = r.identity;
    if (r.halt_outcome) {
      if (metrics) metrics.increment("reconciliation_required_total", { adapter: ad.descriptor().name });
      return finish(r.halt_outcome, null, warnings, errors, envelope, duration, correlationId, metrics, identity, r.source_provenance || canonical.source_provenance);
    }
    canonical = r.canonical || canonical;

    r = timed("DOMAIN_VALIDATION", () => stageDomainValidation(canonical, store, {
      connection_organisation_id: input.connection_organisation_id || envelope.organisation_id,
      require_case: input.require_case,
      require_consent: input.require_consent,
      signed_row: input.signed_row,
      incoming_contradicts_signed: input.incoming_contradicts_signed,
      conflict_field: input.conflict_field,
      incoming_value: input.incoming_value,
      consent_purpose: input.consent_purpose,
      consent_recipient: input.consent_recipient,
      at: input.at || (store && store.now),
    }), duration, metrics, input);
    if (r.halt_outcome) {
      if (r.signed_conflict && store && store.conflicts) {
        store.conflicts.push({
          field_path: input.conflict_field,
          signed_value_wins: true,
          signed_row: input.signed_row,
        });
      }
      if (metrics) metrics.increment("reconciliation_required_total", { adapter: ad.descriptor().name });
      return finish(r.halt_outcome, null, warnings, r.errors || errors, envelope, duration, correlationId, metrics, identity, canonical.source_provenance);
    }
    canonical = r.canonical || canonical;

    const outcome = warnings.length ? "normalised_with_warnings" : "normalised";
    if (metrics) {
      metrics.increment("normalisation_attempt_total", { adapter: ad.descriptor().name, outcome });
      metrics.observe("normalisation_duration", nowMs() - started, { adapter: ad.descriptor().name });
    }
    return createResult({
      outcome,
      canonical_object: canonical,
      warnings,
      errors,
      source_provenance: canonical.source_provenance,
      duration_ms_by_stage: duration,
      correlation_id: correlationId,
      identity,
    });
  } catch (e) {
    if (e && e.code === "CEILING") {
      return finish("processing_failure", null, warnings, [e.issue || { code: "CEILING", stage: stageName, field_path: "engine", message: e.message, retained_source_value: null }], input.envelope || {}, duration, correlationId, metrics);
    }
    if (metrics) metrics.increment("normalisation_unclassified_failure_total", { adapter: "reference" });
    return createResult({
      outcome: "processing_failure",
      warnings,
      errors: [{ code: "UNCLASSIFIED", stage: stageName, field_path: "engine", message: clinicErrorMessage({ message: "Processing stopped. The clinic administrator can retry with the same message.", field_path: "engine" }), retained_source_value: null }],
      duration_ms_by_stage: duration,
      correlation_id: correlationId,
    });
  }
}

function timed(name, fn, duration, metrics, input) {
  const t0 = nowMs();
  if (metrics && metrics.startSpan) metrics.startSpan(name, input && input.correlation_id);
  const result = fn();
  const ms = nowMs() - t0;
  duration[name] = ms;
  if (metrics) metrics.observe("normalisation_stage_duration", ms, { stage: name });
  const ceiling = (input && input.ceilings && input.ceilings[name]) || CEILINGS_MS[name];
  if (input && input.force_ceiling === name) {
    const err = namedError("CEILING", "Hard ceiling breached for " + name);
    err.issue = { code: "CEILING", stage: name, field_path: "engine", message: "The operation was abandoned because it exceeded the hard ceiling. No transaction was held.", retained_source_value: null };
    throw err;
  }
  if (ceiling && ms > ceiling) {
    const err = namedError("CEILING", "Hard ceiling breached for " + name);
    err.issue = { code: "CEILING", stage: name, field_path: "engine", message: "The operation was abandoned because it exceeded the hard ceiling. No transaction was held.", retained_source_value: null };
    throw err;
  }
  return result;
}

function finish(outcome, canonical, warnings, errors, envelope, duration, correlationId, metrics, identity, sourceProvenance) {
  if (metrics) metrics.increment("normalisation_attempt_total", { adapter: envelope.adapter_name || "reference", outcome });
  return createResult({
    outcome,
    canonical_object: canonical,
    warnings,
    errors: errors || [],
    source_provenance: sourceProvenance || null,
    duration_ms_by_stage: duration,
    correlation_id: correlationId,
    identity,
  });
}

function nowMs() {
  return Date.now();
}

export { STAGE_NAMES };
