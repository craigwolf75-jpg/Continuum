/* Prompt 49 observability. Counters and traces carry identifiers, stage
   names, and outcomes only. No personal information in a name, label, tag,
   dimension, span, URL, or error. Canadian residency: in-process only.
   No em dashes or en dashes. */

const ZERO_COUNTERS = Object.freeze([
  "normalisation_unclassified_failure_total",
  "identity_bypass_attempt_total",
  "raw_measurement_emitted_total",
  "band_derived_outside_signature_total",
  "provenance_upgrade_attempt_total",
  "unanswered_axis_omitted_total",
]);

const PERMITTED_LABELS = Object.freeze([
  "organisation",
  "connection",
  "adapter",
  "adapter_version",
  "canonical_version",
  "stage",
  "outcome",
  "error_class",
  "code_set",
  "reason",
  "source_system",
]);

const FORBIDDEN_LABEL_FRAGMENTS = Object.freeze([
  "phn",
  "sin",
  "email",
  "phone",
  "name",
  "dob",
  "address",
  "payload",
]);

function emptyCounters() {
  return {
    normalisation_attempt_total: 0,
    normalisation_warning_total: 0,
    normalisation_error_total: 0,
    normalisation_unclassified_failure_total: 0,
    unsupported_schema_total: 0,
    unmapped_code_total: 0,
    unmapped_status_total: 0,
    mapping_gap_open: 0,
    mapping_gap_oldest_age: 0,
    reconciliation_required_total: 0,
    identity_bypass_attempt_total: 0,
    raw_measurement_emitted_total: 0,
    band_derived_outside_signature_total: 0,
    provenance_upgrade_attempt_total: 0,
    unanswered_axis_omitted_total: 0,
    outbound_blocked_total: 0,
    inbound_replay_total: 0,
    inbound_conflict_total: 0,
    extension_payload_field_total: 0,
  };
}

export function createMetrics() {
  const counters = emptyCounters();
  const histograms = {
    normalisation_duration: [],
    normalisation_stage_duration: [],
  };
  const logs = [];
  const spans = [];

  function assertLabels(labels) {
    const l = labels || {};
    for (const key of Object.keys(l)) {
      if (!PERMITTED_LABELS.includes(key)) {
        throw new Error("METRIC-LABEL-FORBIDDEN: " + key);
      }
      const lower = String(key).toLowerCase();
      for (const frag of FORBIDDEN_LABEL_FRAGMENTS) {
        if (lower === frag) throw new Error("METRIC-LABEL-PII: " + key);
      }
    }
  }

  return {
    counters,
    histograms,
    logs,
    spans,
    zeroCounterNames: ZERO_COUNTERS,
    increment(name, labels) {
      assertLabels(labels);
      if (!(name in counters)) counters[name] = 0;
      counters[name] += 1;
    },
    observe(name, valueMs, labels) {
      assertLabels(labels);
      if (!histograms[name]) histograms[name] = [];
      histograms[name].push(Number(valueMs));
    },
    log(line) {
      const text = typeof line === "string" ? line : JSON.stringify(line);
      logs.push(text);
    },
    startSpan(stage, correlationId) {
      const span = { stage, correlation_id: correlationId, attributes: {} };
      spans.push(span);
      return span;
    },
    zeroTotals() {
      const out = {};
      for (const name of ZERO_COUNTERS) out[name] = counters[name] || 0;
      return out;
    },
    allZeroSafety() {
      return ZERO_COUNTERS.every((name) => (counters[name] || 0) === 0);
    },
  };
}

export { ZERO_COUNTERS, PERMITTED_LABELS };
