/* Prompt 49 structured normalisation result.

   An expected condition never throws. An exception escaping the engine
   is a defect and is counted in normalisation_unclassified_failure_total.
   No em dashes or en dashes. */

export const OUTCOMES = Object.freeze([
  "normalised",
  "normalised_with_warnings",
  "rejected_invalid_source",
  "rejected_unsupported_mapping",
  "rejected_unsupported_schema",
  "requires_manual_reconciliation",
  "processing_failure",
]);

export function createIssue(code, stage, fieldPath, message, retainedSourceValue) {
  return {
    code,
    stage,
    field_path: fieldPath,
    message,
    retained_source_value: retainedSourceValue,
  };
}

export function createResult(input) {
  const r = input || {};
  const outcome = OUTCOMES.includes(r.outcome) ? r.outcome : "processing_failure";
  const normalised = outcome === "normalised" || outcome === "normalised_with_warnings";
  return {
    outcome,
    canonical_object: normalised ? (r.canonical_object || null) : null,
    warnings: [...(r.warnings || [])],
    errors: [...(r.errors || [])],
    source_provenance: r.source_provenance || null,
    duration_ms_by_stage: { ...(r.duration_ms_by_stage || {}) },
    correlation_id: r.correlation_id || null,
    identity: r.identity || null,
  };
}

export function clinicErrorMessage(issue) {
  const i = issue || {};
  const field = i.field_path || "the message";
  const what = i.message || "The value could not be used.";
  return what + " Field: " + field + ". Keep the source value and send it to the clinic administrator.";
}
