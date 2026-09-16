/* Prompt 47 Part 9: minimal clinic analytics for renewal and pilot.

   Metric definitions are the Part 9.3 named set as constants. Fees forgone is
   the key derived number. Return to work and recovery outcomes are aggregate
   only, never per physician. Benchmarking needs a min cohort. Trend is labelled
   trend, never prediction. Part 8.1 health score WEIGHTS are constants only:
   this is not a CS platform. No live Bedrock. No occupational dataset seed.
   UNKNOWN is never rendered as 0. No em dashes or en dashes anywhere. */

import { namedError, UNKNOWN } from "./clinic_ops_util.mjs";

function metric(row) {
  return Object.freeze(row);
}

export const METRIC_DEFINITIONS = Object.freeze({
  documentation_time: metric({
    key: "documentation_time",
    unit: "duration",
    description: "Time spent documenting an encounter.",
  }),
  appointment_duration: metric({
    key: "appointment_duration",
    unit: "duration",
    phase: 2,
    description: "Appointment duration. Phase 2.",
  }),
  report_completion_time: metric({
    key: "report_completion_time",
    unit: "duration",
    description: "Time from encounter to signed report.",
  }),
  fee_tier_achievement: metric({
    key: "fee_tier_achievement",
    unit: "tier",
    tiers: Object.freeze(["same_day", "on_time", "late"]),
    description: "Fee tier achievement, three way: same_day, on_time, late.",
  }),
  ai_utilisation: metric({
    key: "ai_utilisation",
    unit: "ratio",
    description: "Share of encounters that used the AI assist path.",
  }),
  case_volume: metric({
    key: "case_volume",
    unit: "count",
    description: "Case volume for the clinic or location.",
  }),
  recovery_outcome: metric({
    key: "recovery_outcome",
    unit: "count",
    aggregate_only: true,
    per_physician: false,
    description: "Recovery outcomes, aggregate only.",
  }),
  return_to_work_success: metric({
    key: "return_to_work_success",
    unit: "count",
    aggregate_only: true,
    per_physician: false,
    description: "Return to work success, aggregate only.",
  }),
  return_to_work: metric({
    key: "return_to_work",
    unit: "count",
    aggregate_only: true,
    per_physician: false,
    alias_of: "return_to_work_success",
    description: "Return to work outcomes, aggregate only.",
  }),
  employer_satisfaction: metric({
    key: "employer_satisfaction",
    unit: "score",
    description: "Employer satisfaction with the clinic service.",
  }),
  clinic_utilisation: metric({
    key: "clinic_utilisation",
    unit: "ratio",
    phase: 2,
    description: "Clinic utilisation. Phase 2.",
  }),
  revenue_analytics: metric({
    key: "revenue_analytics",
    unit: "currency",
    description: "Clinic revenue analytics for the product half.",
  }),
  operational_efficiency: metric({
    key: "operational_efficiency",
    unit: "ratio",
    description: "Operational efficiency of the clinic product path.",
  }),
  fees_forgone: metric({
    key: "fees_forgone",
    unit: "currency",
    derived: true,
    description: "Board fees that were eligible but not collected.",
  }),
  benchmark: metric({
    key: "benchmark",
    unit: "ratio",
    requires_min_cohort: true,
    description: "Shown only when the cohort meets the minimum size.",
  }),
  trend: metric({
    key: "trend",
    unit: "label",
    label: "trend",
    never: "prediction",
    description: "A trend label, never a prediction.",
  }),
});

export const HEALTH_SCORE_WEIGHTS = Object.freeze({
  physician_adoption: 30,
  value_delivered: 25,
  operational_health: 15,
  depth: 10,
  relationship: 10,
  support_burden: 5,
  commercial: 5,
});

export const HEALTH_SCORE_WEIGHT_KEYS = Object.freeze(Object.keys(HEALTH_SCORE_WEIGHTS));

export function defineMetrics() {
  return METRIC_DEFINITIONS;
}

export function healthScoreWeights() {
  return HEALTH_SCORE_WEIGHTS;
}

export function healthScoreWeightTotal() {
  return Object.values(HEALTH_SCORE_WEIGHTS).reduce((sum, n) => sum + n, 0);
}

export function feesForgone(input) {
  const src = input || {};
  const eligible = src.eligible_fee_amount;
  const collected = src.collected_fee_amount;
  if (eligible === undefined || eligible === null || collected === undefined || collected === null) {
    return { key: "fees_forgone", value: UNKNOWN, unit: "currency", reason: "input-missing" };
  }
  const a = Number(eligible);
  const b = Number(collected);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    return { key: "fees_forgone", value: UNKNOWN, unit: "currency", reason: "input-not-numeric" };
  }
  return { key: "fees_forgone", value: a - b, unit: "currency", derived: true };
}

function refusePerPhysician(opts) {
  const options = opts || {};
  if (options.per_physician === true || options.group_by === "practitioner" || options.group_by === "physician") {
    throw namedError("RTW-PER-PHYSICIAN-REFUSED", "Return to work and recovery outcomes are aggregate only, never per physician.");
  }
}

export function aggregateOnlyRtw(rows, opts) {
  refusePerPhysician(opts);
  const options = opts || {};
  const list = Array.isArray(rows) ? rows : [];
  if (list.some((r) => r && r.practitioner_id && options.allow_practitioner_dimension === true)) {
    throw namedError("RTW-PER-PHYSICIAN-REFUSED", "Return to work and recovery outcomes are aggregate only, never per physician.");
  }
  const known = list.filter((r) => r && r.outcome !== undefined && r.outcome !== null && r.outcome !== UNKNOWN);
  if (known.length === 0) {
    return { key: "return_to_work_success", value: UNKNOWN, aggregate: true, count: 0 };
  }
  const returned = known.filter((r) => r.outcome === true || r.outcome === "returned" || r.returned === true).length;
  return { key: "return_to_work_success", value: returned, aggregate: true, count: known.length, per_physician: false };
}

export function aggregateOnlyRecovery(rows, opts) {
  refusePerPhysician(opts);
  return { ...aggregateOnlyRtw(rows, opts), key: "recovery_outcome" };
}

export function benchmarkOrHide(cohortSize, minSize) {
  if (cohortSize === undefined || cohortSize === null || minSize === undefined || minSize === null) {
    return { shown: false, value: UNKNOWN, reason: "cohort-or-minimum-unknown" };
  }
  const n = Number(cohortSize);
  const min = Number(minSize);
  if (Number.isNaN(n) || Number.isNaN(min)) {
    return { shown: false, value: UNKNOWN, reason: "cohort-or-minimum-unknown" };
  }
  if (n < min) return { shown: false, value: UNKNOWN, reason: "below-min-cohort", cohort_size: n, min_size: min };
  return { shown: true, cohort_size: n, min_size: min };
}

export function labelTrend(series) {
  const points = Array.isArray(series) ? series.filter((p) => p !== undefined && p !== null && p !== UNKNOWN) : [];
  if (points.length < 2) return { label: "trend", kind: "trend", value: UNKNOWN, never: "prediction" };
  const first = Number(points[0]);
  const last = Number(points[points.length - 1]);
  if (Number.isNaN(first) || Number.isNaN(last)) return { label: "trend", kind: "trend", value: UNKNOWN, never: "prediction" };
  const direction = last > first ? "up" : last < first ? "down" : "flat";
  return { label: "trend", kind: "trend", direction, never: "prediction" };
}
