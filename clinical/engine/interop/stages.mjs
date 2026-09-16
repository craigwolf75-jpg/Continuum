/* Prompt 49 fourteen named stages.

   Stages 1 to 10 are pure functions of their input. Stage 12 is
   resolveIdentity and is never bypassed. An expected condition never
   throws; the engine wraps these and returns a structured result.
   No em dashes or en dashes. */

import { createHash } from "node:crypto";
import { namedError, isBlank } from "./util.mjs";
import { normaliseTemporal } from "./dates.mjs";
import { normaliseUnit, isLegacy25PoundLabel } from "./units.mjs";
import { mapCode, mapStatus } from "./mapping.mjs";
import { createIdentifier, validateIdentifier, identifierForResolution } from "./identifier.mjs";
import { transitionAuthorship, createSourceProvenance } from "./authorship.mjs";
import { inboundBandOnly, projectFunctionalCapacity, emitUnansweredAxes } from "./functional.mjs";
import { resolveIdentity } from "./identity_port.mjs";
import { evaluateConsent, assertNoCachedConsent } from "./consent_port.mjs";
import { createIssue } from "./result.mjs";
import { CANONICAL_VERSION, createPerson, projectWorkerRole, createConsentReference, createOccupationalInjuryCase, createStatus } from "./types.mjs";

export const STAGE_NAMES = Object.freeze([
  "PAYLOAD_VALIDATION",
  "SCHEMA_VALIDATION",
  "FIELD_MAPPING",
  "TYPE_CONVERSION",
  "CODE_MAPPING",
  "STATUS_MAPPING",
  "DATE_NORMALISATION",
  "UNIT_NORMALISATION",
  "IDENTIFIER_EXTRACTION",
  "CANONICAL_GENERATION",
  "PROVENANCE_CAPTURE",
  "IDENTITY_RESOLUTION",
  "DOMAIN_VALIDATION",
  "RESULT",
]);

export const CEILINGS_MS = Object.freeze({
  PAYLOAD_VALIDATION: 250,
  SCHEMA_VALIDATION: 250,
  FIELD_MAPPING: 500,
  TYPE_CONVERSION: 500,
  CODE_MAPPING: 50,
  STATUS_MAPPING: 500,
  DATE_NORMALISATION: 500,
  UNIT_NORMALISATION: 500,
  IDENTIFIER_EXTRACTION: 500,
  CANONICAL_GENERATION: 500,
  PROVENANCE_CAPTURE: 500,
  IDENTITY_RESOLUTION: 2000,
  DOMAIN_VALIDATION: 1000,
  RESULT: 250,
});

const MAX_BYTES = 512 * 1024;

export function stagePayloadValidation(input) {
  const raw = input.raw;
  const declaredType = input.content_type || "application/json";
  const bytes = Buffer.byteLength(typeof raw === "string" ? raw : JSON.stringify(raw || ""));
  if (bytes > (input.max_bytes || MAX_BYTES)) {
    return fail("rejected_invalid_source", "PAYLOAD_VALIDATION", "payload", "The payload exceeds the size bound.", String(bytes));
  }
  if (input.content_type && input.declared_content_type && input.content_type !== input.declared_content_type) {
    return fail("rejected_invalid_source", "PAYLOAD_VALIDATION", "content_type", "The content type does not match the declaration.", input.content_type);
  }
  if (raw === undefined || raw === null || raw === "") {
    return fail("rejected_invalid_source", "PAYLOAD_VALIDATION", "payload", "The payload is empty.", "");
  }
  if (typeof raw === "string" && declaredType.includes("json")) {
    try { JSON.parse(raw); }
    catch (e) { return fail("rejected_invalid_source", "PAYLOAD_VALIDATION", "payload", "The payload is not well formed JSON.", raw.slice(0, 80)); }
  }
  return ok({ bytes, content_type: declaredType });
}

export function stageSchemaValidation(input, adapter) {
  const descriptor = adapter.descriptor();
  const version = input.schema_version;
  const supported = descriptor.schema_versions || [];
  if (!version || !supported.includes(version)) {
    return fail("rejected_unsupported_schema", "SCHEMA_VALIDATION", "schema_version", "The schema version is not supported by the registered adapter.", version);
  }
  const ir = input.intermediate || {};
  if (input.require_structure && !ir.status && !ir.person_external_id && !ir.axis) {
    return fail("rejected_unsupported_schema", "SCHEMA_VALIDATION", "structure", "Required source structure is absent.", JSON.stringify(ir).slice(0, 80));
  }
  return ok({ schema_version: version });
}

export function stageFieldMapping(intermediate, adapter, metrics) {
  const manifest = adapter.fieldManifest();
  const src = intermediate || {};
  const mapped = {};
  const extension = {};
  const allowed = new Set(manifest.filter((e) => e.direction === "inbound" || e.direction === "both").map((e) => e.field));
  for (const [key, value] of Object.entries(src)) {
    if (allowed.has(key)) mapped[key] = value;
    else {
      extension[key] = value;
      if (metrics) metrics.increment("extension_payload_field_total", { adapter: adapter.descriptor().name });
    }
  }
  return ok({ mapped, extension_payload: extension });
}

export function stageTypeConversion(mapped) {
  const warnings = [];
  const out = { ...mapped };
  if (out.work_hours_per_day !== undefined && out.work_hours_per_day !== null && out.work_hours_per_day !== "") {
    const n = Number(out.work_hours_per_day);
    if (Number.isNaN(n)) {
      warnings.push(createIssue("TYPE-UNPARSEABLE", "TYPE_CONVERSION", "work_hours_per_day", "The value could not be parsed. The source was retained.", String(out.work_hours_per_day)));
      out.work_hours_per_day = null;
      out.work_hours_per_day_source = mapped.work_hours_per_day;
    } else {
      out.work_hours_per_day_source = mapped.work_hours_per_day;
      out.work_hours_per_day = n;
    }
  }
  return ok({ converted: out, warnings });
}

export function stageCodeMapping(converted, store, metrics) {
  const warnings = [];
  const gaps = [];
  if (converted.code) {
    const result = mapCode({
      external_system: converted.external_system || "synthetic",
      external_code_set: converted.code_set || "status_or_code",
      external_code: converted.code,
      organisation_id: converted.organisation_id,
      jurisdiction_code: converted.jurisdiction_code,
      connection_id: converted.connection_id,
      field_path: "code",
      at: converted.at,
    }, store, metrics);
    if (result.field_rejected) {
      warnings.push(createIssue("CODE-UNMAPPED", "CODE_MAPPING", "code", "The code is unmapped. The field was rejected and the source was retained. The rest of the message may apply.", String(converted.code)));
      gaps.push(result.mapping_gap);
      converted.code_canonical = null;
      converted.code_source = converted.code;
    } else {
      converted.code_canonical = result.canonical_code;
      converted.mapping_version = result.map_version;
    }
  }
  return ok({ converted, warnings, gaps });
}

export function stageStatusMapping(converted, store, metrics) {
  const status = mapStatus(converted.status, converted.status_system || converted.external_system, store, metrics);
  return ok({ converted: { ...converted, status_object: status }, warnings: status.mapping_status === "unmapped" ? [
    createIssue("STATUS-UNMAPPED", "STATUS_MAPPING", "status", "The status is unmapped. It did not become a canonical status.", String(converted.status)),
  ] : [] });
}

export function stageDateNormalisation(converted, options) {
  const warnings = [];
  const dates = {};
  for (const field of ["recorded_at", "birth_date", "injury_date"]) {
    if (converted[field] === undefined) continue;
    const n = normaliseTemporal(converted[field], options);
    dates[field] = n;
    if (n.warning) warnings.push(createIssue(n.warning.code, "DATE_NORMALISATION", field, n.warning.message, n.warning.retained_source_value));
  }
  return ok({ converted: { ...converted, dates }, warnings });
}

export function stageUnitNormalisation(converted) {
  const warnings = [];
  let rejectedMapping = false;
  if (isLegacy25PoundLabel(converted.weight_label, converted.weight_unit) || isLegacy25PoundLabel(converted.weight_value, converted.weight_unit)) {
    const band = inboundBandOnly({
      axis: converted.axis || "lifting_general",
      source_value: converted.weight_label || converted.weight_value,
      source_unit: converted.weight_unit,
      label: converted.weight_label,
    });
    converted.functional_restriction = band.restriction;
    converted.measured_hours = null;
    converted.measured_weight_kg = null;
    converted.legacy_25_pound = true;
    warnings.push(createIssue(band.warning.code, "UNIT_NORMALISATION", "weight_label", band.warning.message, band.warning.retained_source_value));
    return ok({ converted, warnings, rejectedMapping: true, unmapped_band: true });
  }
  if (converted.weight_label && !converted.measured_weight_kg) {
    const band = inboundBandOnly({
      axis: converted.axis || "lifting_general",
      band: converted.weight_label,
      source_value: converted.weight_label,
    });
    converted.functional_restriction = band.restriction;
    converted.measured_hours = null;
    converted.measured_weight_kg = null;
  }
  if (converted.weight_value !== undefined && converted.weight_unit) {
    const u = normaliseUnit(converted.weight_value, converted.weight_unit);
    if (u.warning) warnings.push(createIssue(u.warning.code, "UNIT_NORMALISATION", "weight_value", u.warning.message, u.warning.retained_source_value));
    if (u.rejected) rejectedMapping = true;
    converted.measured_weight_kg = u.canonical;
    converted.weight_source_value = u.source_value;
    converted.weight_source_unit = u.source_unit;
  }
  return ok({ converted, warnings, rejectedMapping });
}

export function stageIdentifierExtraction(converted, store) {
  const warnings = [];
  const identifiers = [];
  if (converted.person_external_id) {
    const validation = validateIdentifier(converted.namespace_key || "external.person", converted.person_external_id, converted.at, store);
    const ident = identifierForResolution(createIdentifier({
      scope: "external",
      namespace_key: converted.namespace_key || "external.person",
      value: converted.person_external_id,
      is_globally_unique: false,
      is_reassignable: true,
    }), validation);
    if (validation === "invalid" || validation === "unvalidatable") {
      warnings.push(createIssue("IDENTIFIER-" + validation.toUpperCase(), "IDENTIFIER_EXTRACTION", "person_external_id", "Identifier validation did not block the message. The identifier cannot contribute to a deterministic identity outcome.", String(converted.person_external_id)));
    }
    identifiers.push(ident);
  }
  return ok({ converted: { ...converted, identifiers }, warnings });
}

export function stageCanonicalGeneration(converted) {
  const required = converted.required_fields || [];
  for (const field of required) {
    if (isBlank(converted[field]) && converted[field] !== false && converted[field] !== 0) {
      return fail("rejected_invalid_source", "CANONICAL_GENERATION", field, "A required field is absent. Nothing was written.", "");
    }
  }
  const person = createPerson({ id: null, identifiers: converted.identifiers || [] });
  const injuryCase = createOccupationalInjuryCase({ id: converted.case_external_id || converted.case_id || null });
  const worker = projectWorkerRole(person, injuryCase);
  const axes = [];
  if (converted.axis) {
    axes.push({
      axis: converted.axis,
      answered: converted.answered !== false && converted.answered !== "false",
      skipped: converted.skipped === true,
      capability: converted.capability || null,
      measured_hours: converted.measured_hours === undefined ? null : converted.measured_hours,
      measured_weight_kg: converted.measured_weight_kg === undefined ? null : converted.measured_weight_kg,
      derived_band: converted.derived_band || null,
      derived_capability_code: converted.derived_capability_code || null,
      axis_source: converted.axis_source || "measured",
      authorship_provenance: converted.authorship_provenance || "human",
    });
  }
  const functional = projectFunctionalCapacity({
    case_reference: injuryCase.id,
    version: converted.measurement_version || 1,
    effective_from: converted.dates && converted.dates.recorded_at && converted.dates.recorded_at.kind === "date" ? converted.dates.recorded_at.canonical : null,
    work_hours_per_day: converted.work_hours_per_day,
    modified_hours: converted.modified_hours,
    modified_duties: converted.modified_duties,
  }, axes);
  const consentRef = converted.consent_ledger_id ? createConsentReference(converted.consent_ledger_id) : null;
  if (consentRef) {
    const cached = assertNoCachedConsent(consentRef);
    if (!cached.ok) return fail("rejected_invalid_source", "CANONICAL_GENERATION", "consent", cached.reason, "");
  }
  const canonical = {
    type: converted.canonical_type || "FunctionalCapacity",
    canonical_version: CANONICAL_VERSION,
    person,
    worker,
    case: injuryCase,
    functional,
    functional_restriction: converted.functional_restriction || null,
    status: converted.status_object || createStatus({ source_status_raw: converted.status, mapping_status: "unmapped" }),
    consent: consentRef,
    extension_payload: converted.extension_payload || {},
    authorship_provenance: converted.authorship_provenance || "human",
    organisation_id: converted.organisation_id,
    connection_id: converted.connection_id,
  };
  return ok({ canonical, worker_is_entity: false });
}

export function stageProvenanceCapture(canonical, envelope, authorshipFrom, metrics) {
  const fromValue = authorshipFrom || canonical.authorship_provenance || "human";
  const transition = transitionAuthorship(fromValue, canonical.authorship_provenance || fromValue, metrics);
  const source_provenance = createSourceProvenance({
    source_system: envelope.source_system,
    connection_id: envelope.connection_id,
    inbound_message_id: envelope.id,
    adapter_name: envelope.adapter_name,
    adapter_version: envelope.adapter_version,
    canonical_version: envelope.canonical_version,
    mapping_version: envelope.mapping_version || canonical.mapping_version,
    received_at: envelope.received_at,
    source_recorded_at: envelope.source_recorded_at,
    transformations_applied: STAGE_NAMES.slice(0, 11),
  });
  return ok({
    canonical: { ...canonical, authorship_provenance: transition.value, source_provenance },
    source_provenance,
  });
}

export function stageIdentityResolution(canonical, store, metrics) {
  const ident = (canonical.person && canonical.person.identifiers && canonical.person.identifiers[0]) || {};
  const resolved = resolveIdentity({
    connection_id: canonical.connection_id,
    identifier_type: ident.identifier_type || "external",
    identifier_value: ident.value,
    namespace_key: ident.namespace_key,
    contributes_to_deterministic: ident.contributes_to_deterministic === true,
  }, store, metrics);
  if (resolved.outcome === "review_required" || resolved.outcome === "conflict") {
    return {
      ok: true,
      halt_outcome: "requires_manual_reconciliation",
      identity: resolved,
      write_domain: false,
    };
  }
  return ok({
    identity: resolved,
    canonical: {
      ...canonical,
      person: { ...canonical.person, id: resolved.person_id },
    },
    write_domain: resolved.outcome === "deterministic" || resolved.outcome === "created" || resolved.outcome === "replayed",
  });
}

export function stageDomainValidation(canonical, store, context) {
  const errors = [];
  const ctx = context || {};
  if (canonical.organisation_id && ctx.connection_organisation_id && canonical.organisation_id !== ctx.connection_organisation_id) {
    errors.push(createIssue("TENANCY-MISMATCH", "DOMAIN_VALIDATION", "organisation_id", "The object does not belong to the connection's organisation.", String(canonical.organisation_id)));
  }
  if (ctx.require_case && store && store.cases && canonical.case && canonical.case.id) {
    const found = store.cases.find((c) => c.id === canonical.case.id && c.organisation_id === ctx.connection_organisation_id);
    if (!found) errors.push(createIssue("CASE-MISSING", "DOMAIN_VALIDATION", "case", "The referenced case does not exist in a permitted state.", String(canonical.case.id)));
  }
  if (ctx.signed_row && ctx.incoming_contradicts_signed) {
    errors.push(createIssue("SIGNED-WINS", "DOMAIN_VALIDATION", ctx.conflict_field || "value", "An inbound value contradicts a signed value. The signed value wins permanently.", ctx.incoming_value));
    return {
      ok: true,
      halt_outcome: "requires_manual_reconciliation",
      errors,
      signed_conflict: true,
    };
  }
  if (canonical.status && canonical.status.mapping_status === "unmapped" && canonical.status.requires_reconciliation) {
    errors.push(createIssue("STATUS-UNMAPPED", "DOMAIN_VALIDATION", "status", "An unmapped status requires reconciliation and is not a canonical status.", canonical.status.source_status_raw));
  }
  if (errors.length) {
    return { ok: true, halt_outcome: "requires_manual_reconciliation", errors };
  }
  if (ctx.require_consent) {
    const state = evaluateConsent({
      subject_person_id: canonical.person && canonical.person.id,
      purpose: ctx.consent_purpose || "integration_inbound",
      recipient: ctx.consent_recipient || "continuum",
      at: ctx.at || new Date().toISOString(),
    }, store);
    if (state !== "granted") {
      errors.push(createIssue("CONSENT-" + String(state).toUpperCase(), "DOMAIN_VALIDATION", "consent", "Consent evaluated at call time is " + state + ".", state));
    }
  }
  if (errors.length) {
    return { ok: true, halt_outcome: "requires_manual_reconciliation", errors };
  }
  return ok({ canonical });
}

export function digestOf(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return createHash("sha256").update(text).digest("hex");
}

export function idempotencyKey(connectionId, externalMessageId, payloadDigest) {
  const material = [connectionId, externalMessageId || "", payloadDigest].join("|");
  return createHash("sha256").update(material).digest("hex");
}

function ok(extra) {
  return { ok: true, ...extra };
}

function fail(outcome, stage, field, message, retained) {
  return {
    ok: false,
    outcome,
    errors: [createIssue(outcome.toUpperCase(), stage, field, message, retained)],
  };
}
