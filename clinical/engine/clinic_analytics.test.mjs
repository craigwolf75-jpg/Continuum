/* Prompt 47 Part 9 clinic analytics suite. node clinical/engine/clinic_analytics.test.mjs
   No em dashes or en dashes anywhere. */

import { defineMetrics, feesForgone, aggregateOnlyRtw, benchmarkOrHide, healthScoreWeights, labelTrend } from "./clinic_analytics.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const throws = (fn, code) => { try { fn(); return false; } catch (e) { return !code || e.code === code; } };

const metrics = defineMetrics();
ok("fees_forgone is a defined derived metric", metrics.fees_forgone && metrics.fees_forgone.derived === true);
ok("return_to_work is aggregate only", metrics.return_to_work.aggregate_only === true && metrics.return_to_work.per_physician === false);
ok("trend is never a prediction", metrics.trend.never === "prediction" && metrics.trend.label === "trend");

ok("fees forgone computes eligible minus collected", feesForgone({ eligible_fee_amount: 100, collected_fee_amount: 40 }).value === 60);
ok("missing fee inputs are UNKNOWN never 0", feesForgone({}).value === "UNKNOWN");

ok("RTW aggregate counts returned outcomes", aggregateOnlyRtw([{ outcome: "returned" }, { outcome: false }]).value === 1);
ok("RTW per physician is refused", throws(() => aggregateOnlyRtw([{ outcome: "returned" }], { per_physician: true }), "RTW-PER-PHYSICIAN-REFUSED"));

ok("benchmark hidden below min cohort", benchmarkOrHide(3, 10).shown === false && benchmarkOrHide(3, 10).value === "UNKNOWN");
ok("benchmark shown at min cohort", benchmarkOrHide(10, 10).shown === true);
ok("unknown cohort does not become 0", benchmarkOrHide(null, 10).value === "UNKNOWN");

const weights = healthScoreWeights();
ok("health score weights are constants and UNKNOWN never 0", weights.product_adoption === "UNKNOWN" && weights.renewal_risk !== 0);
ok("trend label is trend never prediction", labelTrend([1, 3]).kind === "trend" && labelTrend([1, 3]).never === "prediction");

console.log("\nclinic_analytics suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
