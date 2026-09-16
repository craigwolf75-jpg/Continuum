/* Prompt 47 Part 9: minimal clinic analytics for renewal and pilot.

   Metric definitions from the mission-named 9.3 set: fees forgone (the key
   derived number), return to work (aggregate only, never per physician),
   benchmark (hidden below min cohort), and trend (label trend, never
   prediction). Part 8.1 health score WEIGHTS are named constants only; numeric
   weights are UNKNOWN until Prompt 47 8.1 text is filed (docs/prompts/47/STOPS.md).
   No live Bedrock. No occupational dataset seed. UNKNOWN is never rendered as 0.
   No em dashes or en dashes anywhere. */

import { namedError, UNKNOWN } from "./clinic_ops_util.mjs";

export const METRIC_DEFINITIONS = Object.freeze({
  fees_forgone: {
    key: "fees_forgone",
    unit: "currency",
    derived: true,
    description: "Board fees that were eligible but not collected.",
  },
  return_to_work: {
    key: "return_to_work",
    unit: "count",
    aggregate_only: true,
    per_physician: false,
    description: "Return to work outcomes, aggregate only.",
  },
  benchmark: {
    key: "benchmark",
    unit: "ratio",
    requires_min_cohort: true,
    description: "Shown only when the cohort meets the minimum size.",
  },
  trend: {
    key: "trend",
    unit: "label",
    label: "trend",
    never: "prediction",
    description: "A trend label, never a prediction.",
  },
});

export const HEALTH_SCORE_WEIGHT_KEYS = Object.freeze([
  "product_adoption",
  "time_to_value",
  "support_burden",
  "renewal_risk",
]);

export function defineMetrics() {
  return METRIC_DEFINITIONS;
}

export function healthScoreWeights() {
  const weights = {};
  for (const key of HEALTH_SCORE_WEIGHT_KEYS) weights[key] = UNKNOWN;
  return Object.freeze(weights);
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

export function aggregateOnlyRtw(rows, opts) {
  const options = opts || {};
  if (options.per_physician === true || options.group_by === "practitioner" || options.group_by === "physician") {
    throw namedError("RTW-PER-PHYSICIAN-REFUSED", "Return to work outcomes are aggregate only, never per physician.");
  }
  const list = Array.isArray(rows) ? rows : [];
  if (list.some((r) => r && r.practitioner_id && options.allow_practitioner_dimension === true)) {
    throw namedError("RTW-PER-PHYSICIAN-REFUSED", "Return to work outcomes are aggregate only, never per physician.");
  }
  const known = list.filter((r) => r && r.outcome !== undefined && r.outcome !== null && r.outcome !== UNKNOWN);
  if (known.length === 0) {
    return { key: "return_to_work", value: UNKNOWN, aggregate: true, count: 0 };
  }
  const returned = known.filter((r) => r.outcome === true || r.outcome === "returned" || r.returned === true).length;
  return { key: "return_to_work", value: returned, aggregate: true, count: known.length, per_physician: false };
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
