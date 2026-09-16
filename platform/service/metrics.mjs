/* Prompt 50 Section 11.1. In-process counters and histograms. No personal
   information in names or dimensions. No em dashes or en dashes anywhere. */

const ALLOWED_DIMS = Object.freeze([
  "organisation_id", "location_id", "connection_id", "environment",
  "action", "outcome", "error_class", "permission", "table", "key", "route", "status",
]);

const store = {
  counters: Object.create(null),
  gauges: Object.create(null),
  histograms: Object.create(null),
};

function dimKey(dims) {
  if (!dims) return "";
  const out = [];
  for (const [k, v] of Object.entries(dims)) {
    if (!ALLOWED_DIMS.includes(k)) continue;
    out.push(k + "=" + String(v));
  }
  return out.sort().join(",");
}

export function increment(name, dims, n) {
  const key = name + "|" + dimKey(dims);
  store.counters[key] = (store.counters[key] || 0) + (n == null ? 1 : n);
  return store.counters[key];
}

export function gauge(name, value, dims) {
  const key = name + "|" + dimKey(dims);
  store.gauges[key] = value;
  return value;
}

export function observe(name, value, dims) {
  const key = name + "|" + dimKey(dims);
  if (!store.histograms[key]) store.histograms[key] = [];
  store.histograms[key].push(value);
  return value;
}

export function readCounter(name, dims) {
  return store.counters[name + "|" + dimKey(dims)] || 0;
}

export function snapshot() {
  return {
    counters: { ...store.counters },
    gauges: { ...store.gauges },
    histograms: { ...store.histograms },
  };
}

export function resetMetrics() {
  store.counters = Object.create(null);
  store.gauges = Object.create(null);
  store.histograms = Object.create(null);
}

export function mustBeZero() {
  return {
    tenant_context_missing_total: readCounter("tenant_context_missing_total"),
    rls_denied_total: readCounter("rls_denied_total"),
    immutability_violation_total: readCounter("immutability_violation_total"),
    employer_wall_violation_total: readCounter("employer_wall_violation_total"),
    config_required_missing_total: readCounter("config_required_missing_total"),
  };
}

export const REQUIRED_METRICS = Object.freeze([
  "http_request_duration",
  "db_query_duration",
  "db_pool_saturation",
  "tenant_context_missing_total",
  "rls_denied_total",
  "authz_denied_total",
  "immutability_violation_total",
  "employer_wall_violation_total",
  "consent_resolver_calls_total",
  "disclosure_blocked_total",
  "event_outbox_depth",
  "event_outbox_oldest_age",
  "audit_chain_verification_status",
  "config_required_missing_total",
  "feature_flag_expired_total",
]);
