/* Prompt 47 Part 9 clinic analytics suite. node clinical/engine/clinic_analytics.test.mjs
   No em dashes or en dashes anywhere. */

import { defineMetrics, feesForgone, aggregateOnlyRtw, aggregateOnlyRecovery, benchmarkOrHide, healthScoreWeights, healthScoreWeightTotal, labelTrend } from "./clinic_analytics.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const throws = (fn, code) => { try { fn(); return false; } catch (e) { return !code || e.code === code; } };

const metrics = defineMetrics();
ok("fees_forgone is a defined derived metric", metrics.fees_forgone && metrics.fees_forgone.derived === true);
ok("return_to_work is aggregate only", metrics.return_to_work_success.aggregate_only === true && metrics.return_to_work_success.per_physician === false);
ok("Part 9.3 named metrics exist", [
  "documentation_time", "appointment_duration", "report_completion_time", "fee_tier_achievement",
  "ai_utilisation", "case_volume", "recovery_outcome", "return_to_work_success",
  "employer_satisfaction", "clinic_utilisation", "revenue_analytics", "operational_efficiency", "fees_forgone",
].every((k) => metrics[k] && metrics[k].key === k));
ok("fee_tier_achievement is three way", metrics.fee_tier_achievement.tiers.join() === "same_day,on_time,late");
ok("appointment_duration and clinic_utilisation are Phase 2", metrics.appointment_duration.phase === 2 && metrics.clinic_utilisation.phase === 2);
ok("trend is never a prediction", metrics.trend.never === "prediction" && metrics.trend.label === "trend");

ok("fees forgone computes eligible minus collected", feesForgone({ eligible_fee_amount: 100, collected_fee_amount: 40 }).value === 60);
ok("missing fee inputs are UNKNOWN never 0", feesForgone({}).value === "UNKNOWN");

ok("RTW aggregate counts returned outcomes", aggregateOnlyRtw([{ outcome: "returned" }, { outcome: false }]).value === 1);
ok("RTW per physician is refused", throws(() => aggregateOnlyRtw([{ outcome: "returned" }], { per_physician: true }), "RTW-PER-PHYSICIAN-REFUSED"));
ok("recovery per physician is refused", throws(() => aggregateOnlyRecovery([{ outcome: "returned" }], { group_by: "physician" }), "RTW-PER-PHYSICIAN-REFUSED"));

ok("benchmark hidden below min cohort", benchmarkOrHide(3, 10).shown === false && benchmarkOrHide(3, 10).value === "UNKNOWN");
ok("benchmark shown at min cohort", benchmarkOrHide(10, 10).shown === true);
ok("unknown cohort does not become 0", benchmarkOrHide(null, 10).value === "UNKNOWN");

const weights = healthScoreWeights();
ok("Part 8.1 weights are the Prompt 47 numbers", weights.physician_adoption === 30 && weights.value_delivered === 25 && weights.operational_health === 15 && weights.depth === 10 && weights.relationship === 10 && weights.support_burden === 5 && weights.commercial === 5);
ok("health score weights sum to 100", healthScoreWeightTotal() === 100);
ok("trend label is trend never prediction", labelTrend([1, 3]).kind === "trend" && labelTrend([1, 3]).never === "prediction");

console.log("\nclinic_analytics suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
