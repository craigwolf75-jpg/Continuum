/* Continuum Prompt 60 Section 2 / 7.1 to 7.3. Proves the thirteen C1447
   labels character for character, stored intensity definitions including
   OCR artefacts, frequency_percent raw with derived band, not_daily
   independent, and 5.5 => occasional. No customer-facing board alignment
   string. No dashes (em or en) anywhere. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  C1447_FACTORS, CUSTOM_DEMAND_SLOTS, PRINTED_FREQUENCY_KEY_GAP,
  frequencyBandFromPercent, makeCognitiveScore, cognitiveDemandSet,
  intensityDefinition, tenantAuthoredCoverageByFactor, POSITION_CLASSIFICATIONS,
} from "./c1447_factors.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const VERIFY = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "docs", "prompts", "60", "C1447_VERIFICATION.md"), "utf8");

const EXPECTED_LABELS = [
  "Short-term memory and recall",
  "Attention to detail",
  "Completing multiple tasks",
  "Mental endurance",
  "Problem solving and decision making",
  "Self-supervision",
  "Supervision of others",
  "Time pressures",
  "Exposure to environmental distractions",
  "Interpersonal relationships (working cooperatively with others)",
  "Exposure to emotional situations and/or distressed individuals",
  "Exposure to confrontational situations",
  "Verbal communication",
];

ok("7.1: thirteen labels are present", C1447_FACTORS.length === 13);
ok("7.1: labels match C1447 character for character", C1447_FACTORS.every((f, i) => f.label === EXPECTED_LABELS[i]));
ok("7.1: each expected label appears in C1447_VERIFICATION.md", EXPECTED_LABELS.every((l) => VERIFY.includes(l)));

ok("7.2: factor 1 high keeps OCR artefact difference", intensityDefinition(1, "high").includes("difference"));
ok("7.2: factor 1 high keeps OCR artefact ot be", intensityDefinition(1, "high").includes("ot be"));
ok("7.2: factor 2 moderate keeps attention of concentration", intensityDefinition(2, "moderate").includes("attention of concentration"));
ok("7.2: factor 10 high keeps and/r", intensityDefinition(10, "high").includes("and/r"));
ok("7.2: no customer-facing board alignment string in this module", (() => {
  const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "c1447_factors.mjs"), "utf8");
  return !/customer-facing board alignment/.test(src) && !/aligned to WCB Alberta/.test(src);
})());
ok("7.2: printed-key gap is reported, not hidden", PRINTED_FREQUENCY_KEY_GAP.includes("5.5") && PRINTED_FREQUENCY_KEY_GAP.includes("gap"));
ok("7.2: items 14 and 15 store retrieved form wording without normalising", CUSTOM_DEMAND_SLOTS[0].summary_extract === "14.Additional tasks:" && CUSTOM_DEMAND_SLOTS[1].summary_extract === "15. Additional tasks:" && CUSTOM_DEMAND_SLOTS[0].detail_heading === "Additional task" && CUSTOM_DEMAND_SLOTS[1].detail_heading === "Additional task");
ok("7.2: items 14 and 15 have empty intensity shells", CUSTOM_DEMAND_SLOTS.every((s) => s.intensity_definitions.low === "" && s.intensity_definitions.moderate === "" && s.intensity_definitions.high === ""));

ok("7.3: 0 is not_required", frequencyBandFromPercent(0) === "not_required");
ok("7.3: 1 is rare", frequencyBandFromPercent(1) === "rare");
ok("7.3: 5 is rare", frequencyBandFromPercent(5) === "rare");
ok("7.3: 5.5 resolves to occasional without error", frequencyBandFromPercent(5.5) === "occasional");
ok("7.3: 6 is occasional", frequencyBandFromPercent(6) === "occasional");
ok("7.3: 33 is occasional", frequencyBandFromPercent(33) === "occasional");
ok("7.3: 34 is frequent", frequencyBandFromPercent(34) === "frequent");
ok("7.3: 66 is frequent", frequencyBandFromPercent(66) === "frequent");
ok("7.3: 67 is constant", frequencyBandFromPercent(67) === "constant");
ok("7.3: missing percent is UNKNOWN, never 0 and never not_required", frequencyBandFromPercent(null) === "UNKNOWN" && frequencyBandFromPercent(undefined) === "UNKNOWN");
ok("7.3: frequency_band is derived, not taken from the caller", makeCognitiveScore(2, { intensity: "low", frequency_percent: 5.5, frequency_band: "rare", source: "tenant_authored" }).frequency_band === "occasional");
ok("7.3: not_daily is independent of frequency", (() => {
  const a = makeCognitiveScore(2, { intensity: "low", frequency_percent: 80, not_daily: true, source: "tenant_authored" });
  const b = makeCognitiveScore(2, { intensity: "low", frequency_percent: 0, not_daily: false, source: "tenant_authored" });
  return a.not_daily === true && a.frequency_band === "constant" && b.not_daily === false && b.frequency_band === "not_required";
})());
ok("7.3: unscored is explicit, never null source", makeCognitiveScore(3, { source: "unscored" }).source === "unscored" && makeCognitiveScore(3, { source: "unscored" }).intensity === null);
ok("7.3: a stored score keeps scored_by and scored_on", (() => {
  const s = makeCognitiveScore(1, { intensity: "low", frequency_percent: 10, source: "tenant_authored", scored_by: "SYNTH-RATER-01", scored_on: "2026-09-01" });
  return s.scored_by === "SYNTH-RATER-01" && s.scored_on === "2026-09-01" && s.intensity_definition.includes("Minimal need");
})());
ok("7.3: cognitiveDemandSet fills missing factors as unscored", cognitiveDemandSet({ 1: { intensity: "low", frequency_percent: 10, source: "tenant_authored" } }).filter((s) => s.source === "unscored").length === 12);
ok("7.3: empty duty list coverage is UNKNOWN, never 0", tenantAuthoredCoverageByFactor([]).every((r) => r.percent === "UNKNOWN" && r.tenant_authored === "UNKNOWN"));
ok("7.3: position classification tokens are the three enum tokens", POSITION_CLASSIFICATIONS.join(",") === "safety_sensitive,risk_sensitive,decision_critical");

console.log("\nC1447 factors suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
