# Continuum Public Assessment, Step 2B: Benchmark Engine (dark). Design Spec

Date: 2026-08-17. Status: DESIGN, awaiting Gary's review. Lane: public marketing
site, outside the held platform. No em dashes or en dashes anywhere.

Sub-project B of Prompt 63 Step 2. Builds the benchmark engine infrastructure
(cohort hierarchy, progressive broadening, confidence levels, source registry,
versioning) as a client-side library plus a reference config, tested with SYNTH
fixtures. It ships DARK: no external data is ingested, no benchmark is shown to
users, and no visitor surface changes. Gary approved this design and the "build
dark" scope on 2026-08-17. Sub-project C (the Continuum proprietary maturity
benchmark) reuses this engine and stays gated separately.

## 1. Scope and decisions

- New files only: `deploy/assessment/benchmark.js` (engine library) and
  `deploy/assessment/config/crb-2026-01.js` (benchmark reference config).
- No DB migration. No visitor-surface change. No ingestion of any external
  dataset (Section 00.3 gate honored: ingestion is Craig's separate decision,
  already given in principle for the B1-approved sources, but the actual data
  loading is a later operational step, not this build).
- Frequency-context only. The engine produces external injury-FREQUENCY context
  comparisons, never an RTW-maturity comparison. Maturity is sub-project C
  (Section 11).
- Source registry holds the B1-approved context sources' METADATA only, no
  benchmark values. The engine's `lookupBenchmark` therefore returns
  INSUFFICIENT for all real inputs today; the LOGIC is proven with SYNTH data.
- Deterministic, no LLM. Config-driven. Dash law. Three layer resilience.

## 2. Benchmark reference config (`config/crb-2026-01.js`)

UMD (module.exports in Node, `window.ContinuumBenchmark_CRB` in browser). Shape:

```
{
  benchmarkVersion: "CRB_2026_01",
  changelog: "<string>",
  cohortDimensions: ["country","province_state","industry","workforce_size_band","injury_volume_band","site_count_band"],
  confidenceLevels: ["HIGH","MODERATE","ESTIMATED","INSUFFICIENT"],
  metrics: [ { key:"lost_time_incidence_rate", label, unit, note:"frequency context, not maturity" }, ... ],
  sources: [
    { id, org, title, url, dataPeriod, geography, industryClassification,
      metricKeys:[...], licensing, attribution, dateRetrieved, verdict } // from B1
  ],
  data: {}   // EMPTY: no benchmark values loaded (dark). Shape documented for the loader.
}
```

`sources` is transcribed from the B1 research (OSHA ITA, BLS SOII, Statistics
Canada, AWCBC) with their metadata and the required attribution string. `data`
is an empty object with its documented shape (keyed by metric then cohort key),
so a future approved loader knows exactly how to populate it.

## 3. Cohort model and progressive broadening (Section 9)

`cohortHierarchy(cohort, config) -> [cohortSpec, ...]`, ordered most-specific to
least-specific:

1. industry + province_state + workforce_size_band
2. industry + country + workforce_size_band
3. industry + country
4. broader industry family + country
5. broadest occupational benchmark (country)

Each `cohortSpec` is the subset of cohort fields it matches on. The generator
skips a rung whose required fields the respondent did not supply. If no rung is
credible, the lookup returns nothing. It never manufactures a cohort.

## 4. Confidence levels (Section 13)

`confidenceFor(matchRung, observations, config) -> "HIGH"|"MODERATE"|"ESTIMATED"|"INSUFFICIENT"`:

- HIGH: rung 1 or 2 (direct comparison) AND observations at or above the config
  adequacy floor.
- MODERATE: rung 3 or 4 (broader but relevant) with adequate observations.
- ESTIMATED: a modeled or external contextual estimate (rung 5, or a
  config-flagged modeled figure).
- INSUFFICIENT: no credible match, or observations below the floor. No numerical
  comparison is displayed for INSUFFICIENT.

Adequacy floor (minimum comparable observations) is a config value, tunable.

## 5. Lookup (never manufacture)

`lookupBenchmark(cohort, metric, dataset, config) -> { value, matchedCohortRung, confidence, sourceId, benchmarkVersion } | null`:

1. Validate `metric` is a known frequency-context metric (guard: reject any
   metric not in `config.metrics`, so a maturity metric can never be looked up
   here, Section 11).
2. Walk `cohortHierarchy`. For each rung, look for a value in `dataset[metric]`
   at that cohort key with enough observations.
3. On the first credible rung, return the value with its confidence, source, and
   benchmark version. Never blend rungs, never interpolate a missing cohort.
4. If no rung yields a credible value, return `null` (rendered as no benchmark).
   `dataset` is empty today, so this is the live behavior; SYNTH datasets in the
   tests exercise the positive paths.

## 6. Versioning (Section 22)

`BENCHMARK_VERSION` is `"CRB_2026_01"`, carried in config and in every lookup
result. When a benchmark is ever applied to a saved assessment, the version is
recorded in the existing response `provenance`/jsonb (no schema change). Source
metadata retained in config so any comparison can be reproduced and explained.

## 7. Result surface

None in this sub-project. The engine is a library; no benchmark rendering is
added to the assessment. When Craig-approved external data is loaded later (a
separate per-source operational step, with attribution and the source registry),
a follow-up wires the frequency-context comparison into the Stage 2 result,
labelled as external frequency context, with the confidence language of
Section 13 and the frequency-vs-maturity distinction of Section 11. That
follow-up is out of scope here.

## 8. Engine interfaces (for the plan)

`deploy/assessment/benchmark.js` exports `ContinuumBenchmark` (UMD):
- `cohortHierarchy(cohort, config) -> cohortSpec[]`
- `confidenceFor(matchRung, observations, config) -> string`
- `lookupBenchmark(cohort, metric, dataset, config) -> result|null`
- `benchmarkVersion(config) -> string`

Pure functions, no DOM, no network, no LLM. `cohort` is
`{ country, province_state, industry, workforce_size_band, injury_volume_band, site_count_band }`
(any field may be absent). `dataset` is `config.data` (empty) or a SYNTH object
in tests.

## 9. Testing

Node suites (`deploy/assessment-benchmark*.test.mjs`), SYNTH fixtures, CI-gated:
- Config validity (version CRB_2026_01, sources have the required metadata and
  attribution, metrics are frequency-context, data empty).
- cohortHierarchy order and rung-skipping when fields are absent.
- confidenceFor tiers including the adequacy floor.
- lookupBenchmark: returns the most specific credible SYNTH value with correct
  confidence and source; returns null when the dataset is empty or below the
  floor; never blends or interpolates; rejects a non-frequency (maturity) metric.
- Dash-clean (charCodeAt 0x2013/0x2014).

## 10. Constraints and gates

Dash law. Deterministic, no LLM. Config-driven. Three layer resilience (the
engine is pure and cannot fail the page; it is not even loaded by index.html in
this sub-project). No migration. No ingestion. No visitor surface. No consent
copy. No package.json change (the assessment subtree already carries the
commonjs marker). SYNTH fixtures only.

## 11. Open items and handoffs

1. Actual external-data loading (OSHA/BLS/StatCan/AWCBC values) is a separate,
   Craig-approved, per-source operational step, with attribution and the source
   registry. Not this build.
2. Wiring the frequency-context comparison into the Stage 2 result is deferred
   until data is loaded.
3. Sub-project C (Continuum proprietary maturity benchmark) reuses this engine's
   cohort and confidence model but supplies its own data (Continuum's aggregated
   responses) and stays gated on the privacy disclosure plus counsel and a
   minimum sample size.
4. AWCBC commercial-use terms remain to be confirmed before that source is ever
   loaded (from B1).
