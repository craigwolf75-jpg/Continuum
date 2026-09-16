/* Prompt 50 Sections 11.5 and 11.6. Dashboard and alert specifications as
   data. No personal information. No third-party sink outside Canada.
   No em dashes or en dashes anywhere. */

export const DASHBOARDS = Object.freeze([
  { key: "platform_health", panels: ["latency", "error_rate", "saturation", "pool"] },
  { key: "tenancy_and_security", panels: ["must_be_zero", "denials", "break_glass"] },
  { key: "data_integrity", panels: ["audit_chain", "outbox_depth", "outbox_age", "immutability", "partitions"] },
  { key: "configuration", panels: ["required_keys_missing", "expired_flags", "recent_changes"] },
]);

export const PAGE_ALERTS = Object.freeze([
  { key: "cross_tenant_read", condition: "rls_denied_total increases" },
  { key: "employer_wall", condition: "employer_wall_violation_total increases" },
  { key: "immutability", condition: "immutability_violation_total increases" },
  { key: "audit_chain", condition: "audit_chain_verification_status is 0" },
  { key: "tenant_context_missing", condition: "tenant_context_missing_total increases" },
  { key: "readiness_all_down", condition: "ready failing across all instances for 2 minutes" },
  { key: "error_rate", condition: "error rate above 5 percent for 10 minutes" },
]);

export const TICKET_ALERTS = Object.freeze([
  { key: "outbox_depth_or_age", condition: "growth" },
  { key: "missing_future_partition", condition: "inside 7 days" },
  { key: "expired_feature_flag", condition: "retire_by passed" },
  { key: "pool_saturation", condition: "above 80 percent" },
  { key: "replica_lag", condition: "above threshold" },
  { key: "latency_regression", condition: "regression" },
]);
