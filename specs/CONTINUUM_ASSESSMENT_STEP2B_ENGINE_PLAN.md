# Step 2B Benchmark Engine (dark, CRB_2026_01) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the benchmark engine infrastructure (cohort hierarchy, progressive broadening, confidence levels, source registry, versioning) as a client-side library plus reference config, tested with SYNTH fixtures, shipping dark.

**Architecture:** Two new static files in `deploy/assessment/`: `config/crb-2026-01.js` (reference config, no benchmark values) and `benchmark.js` (pure engine library, UMD). No DB migration, no ingestion, no visitor surface, no consent copy.

**Tech Stack:** Plain JS (no build). Node `.mjs` tests (run by `suites.yml`). No new dependency.

**Spec:** `specs/CONTINUUM_ASSESSMENT_STEP2B_ENGINE_DESIGN.md` (authority). Source metadata comes from `specs/CONTINUUM_ASSESSMENT_STEP2B_SOURCE_RESEARCH.md`.

## Global Constraints

- No em dashes and no en dashes anywhere (code, comments, copy, commit messages). Tests detect dashes by `charCodeAt(0) === 0x2013` (en) or `0x2014` (em), never a glyph class.
- Deterministic, no LLM. Config-driven: cohort rungs, confidence thresholds, metrics, and source metadata all in config; no such constants in the engine code.
- Frequency-context only. The engine rejects any metric not in `config.metrics` (which are all frequency-context), so a maturity metric can never be looked up here.
- Never manufacture a benchmark: `lookupBenchmark` returns null (INSUFFICIENT) when no credible cohort match exists; it never blends rungs or interpolates.
- Ships dark: `config.data` is empty; no external data is ingested; index.html is NOT modified (the engine is not loaded on the page in this sub-project).
- `BENCHMARK_VERSION` is `"CRB_2026_01"`, carried in config and every lookup result.
- No DB migration. No package.json change (the assessment subtree already carries the commonjs marker; new .js files under deploy/assessment/ inherit it).
- Tests are `deploy/assessment-benchmark*.test.mjs` (auto-run by `suites.yml`). SYNTH fixtures only.

---

### Task 1: Benchmark reference config

**Files:**
- Create: `deploy/assessment/config/crb-2026-01.js`
- Worker 44: `deploy/assessment-benchmark-config.test.mjs`

**Interfaces:**
- Produces the CRB_2026_01 config (UMD: `module.exports` in Node, `window.ContinuumBenchmark_CRB` in browser). Shape: `{ benchmarkVersion:"CRB_2026_01", changelog, cohortDimensions:[...], confidenceLevels:["HIGH","MODERATE","ESTIMATED","INSUFFICIENT"], adequacyFloor:<number>, metrics:[{key,label,unit,note}], sources:[{id,org,title,url,dataPeriod,geography,industryClassification,metricKeys,licensing,attribution,dateRetrieved,verdict}], data:{} }`.

- [ ] **Step 1: Write the failing config validity test**

```js
// deploy/assessment-benchmark-config.test.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const CRB = require('./assessment/config/crb-2026-01.js');
let failures = 0; function ok(n,c){ if(!c){ failures++; console.error('FAIL', n); } }

ok('version CRB_2026_01', CRB.benchmarkVersion === 'CRB_2026_01');
ok('four confidence levels', JSON.stringify(CRB.confidenceLevels) === JSON.stringify(['HIGH','MODERATE','ESTIMATED','INSUFFICIENT']));
ok('cohort dimensions present', Array.isArray(CRB.cohortDimensions) && CRB.cohortDimensions.includes('industry') && CRB.cohortDimensions.includes('country'));
ok('adequacy floor is a number', typeof CRB.adequacyFloor === 'number');
ok('metrics are frequency-context', CRB.metrics.length > 0 && CRB.metrics.every(m => m.key && m.note && /frequency|context/i.test(m.note)));
ok('sources carry required metadata + attribution',
  CRB.sources.length >= 3 && CRB.sources.every(s => s.id && s.org && s.url && s.metricKeys && s.licensing && s.attribution && s.dateRetrieved && s.verdict));
ok('data is empty (dark)', CRB.data && Object.keys(CRB.data).length === 0);
ok('no em or en dashes',
  ![...JSON.stringify(CRB)].some(c => c.charCodeAt(0) === 0x2013 || c.charCodeAt(0) === 0x2014));
if (failures) { console.error(failures + ' checks failed'); process.exit(1); }
console.log('assessment-benchmark-config: PASS');
```

- [ ] **Step 2: Run and watch it fail** (module not found).

- [ ] **Step 3: Write `config/crb-2026-01.js`.** UMD wrapper (same pattern as crs-1.1.js). Populate `sources` from `specs/CONTINUUM_ASSESSMENT_STEP2B_SOURCE_RESEARCH.md` for the four context sources verdicted RECOMMEND or CONTEXT-ONLY that are free/public (OSHA ITA, BLS SOII, Statistics Canada, AWCBC): each with `id`, `org`, `title`, `url`, `dataPeriod`, `geography`, `industryClassification`, `metricKeys` (e.g. `["lost_time_incidence_rate"]`), `licensing`, `attribution` (the exact credit string), `dateRetrieved:"2026-08-17"`, `verdict`. Define `metrics` (frequency-context, e.g. `lost_time_incidence_rate`, `total_case_rate`) each with a `note` naming it frequency context. `cohortDimensions` = `["country","province_state","industry","workforce_size_band","injury_volume_band","site_count_band"]`. `confidenceLevels` as above. `adequacyFloor` a sensible minimum comparable-observation count (e.g. 5), config-tunable. `data:{}` (empty, dark). Dash-clean.

- [ ] **Step 4: Run to green.**

- [ ] **Step 5: Commit** (`git add deploy/assessment/config/crb-2026-01.js deploy/assessment-benchmark-config.test.mjs; git commit -m "feat(assessment): CRB_2026_01 benchmark reference config (dark)"`).

---

### Task 2: Benchmark engine + guardrails + suite

**Files:**
- Create: `deploy/assessment/benchmark.js`
- Worker 44: `deploy/assessment-benchmark.test.mjs`

**Interfaces:**
- Consumes CRB_2026_01 config. Exports `ContinuumBenchmark` (UMD), all pure:
  - `cohortHierarchy(cohort, config) -> cohortSpec[]` (most-specific first; skips a rung whose required fields are absent). A `cohortSpec` is `{ rung:number, on:{field:value,...} }`.
  - `confidenceFor(matchRung, observations, config) -> "HIGH"|"MODERATE"|"ESTIMATED"|"INSUFFICIENT"`.
  - `lookupBenchmark(cohort, metric, dataset, config) -> { value, matchedCohortRung, confidence, sourceId, benchmarkVersion } | null`.
  - `benchmarkVersion(config) -> string`.
- `cohort` is `{ country, province_state, industry, workforce_size_band, injury_volume_band, site_count_band }` (any absent). `dataset` is `config.data` (empty) or a SYNTH object `{ [metric]: { [cohortKey]: { value, observations, sourceId } } }` in tests, where `cohortKey` is a stable serialization of a cohortSpec.on.

- [ ] **Step 1: Write failing engine tests**

```js
// deploy/assessment-benchmark.test.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const CRB = require('./assessment/config/crb-2026-01.js');
const B = require('./assessment/benchmark.js');
let failures = 0;
function eq(n,a,b){ if(JSON.stringify(a)!==JSON.stringify(b)){ failures++; console.error('FAIL',n,'got',JSON.stringify(a),'want',JSON.stringify(b)); } }
function ok(n,c){ if(!c){ failures++; console.error('FAIL',n); } }

const cohort = { country:'US', province_state:'CA', industry:'SYNTH_CONSTRUCTION', workforce_size_band:'500_1999', injury_volume_band:'50_199', site_count_band:'2_5' };

// cohortHierarchy: most-specific first, rungs skipped when fields absent.
const rungs = B.cohortHierarchy(cohort, CRB);
ok('hierarchy is ordered specific-to-broad', rungs.length >= 3 && rungs[0].rung === 1);
const partial = B.cohortHierarchy({ country:'US', industry:'SYNTH_CONSTRUCTION' }, CRB);
ok('skips rungs needing absent fields (no province/size)', partial.every(r => !('province_state' in r.on) && !('workforce_size_band' in r.on)));

// confidenceFor tiers.
eq('rung1 adequate -> HIGH', B.confidenceFor(1, CRB.adequacyFloor, CRB), 'HIGH');
eq('rung3 adequate -> MODERATE', B.confidenceFor(3, CRB.adequacyFloor, CRB), 'MODERATE');
eq('below floor -> INSUFFICIENT', B.confidenceFor(1, CRB.adequacyFloor - 1, CRB), 'INSUFFICIENT');

// lookupBenchmark against SYNTH data: returns the most specific credible match.
const key = JSON.stringify(rungs[0].on);
const synth = { lost_time_incidence_rate: { [key]: { value: 3.2, observations: CRB.adequacyFloor, sourceId: CRB.sources[0].id } } };
const hit = B.lookupBenchmark(cohort, 'lost_time_incidence_rate', synth, CRB);
ok('returns the SYNTH value', hit && hit.value === 3.2);
eq('returns benchmark version', hit.benchmarkVersion, 'CRB_2026_01');
ok('carries a source', hit.sourceId === CRB.sources[0].id);

// empty dataset (dark) -> null, never manufactured.
eq('empty dataset returns null', B.lookupBenchmark(cohort, 'lost_time_incidence_rate', {}, CRB), null);
eq('config.data is empty so live lookup is null', B.lookupBenchmark(cohort, 'lost_time_incidence_rate', CRB.data, CRB), null);

// below-floor observations -> null (not shown), never blended.
const thin = { lost_time_incidence_rate: { [key]: { value: 9.9, observations: CRB.adequacyFloor - 1, sourceId: CRB.sources[0].id } } };
eq('below-floor match returns null', B.lookupBenchmark(cohort, 'lost_time_incidence_rate', thin, CRB), null);

// maturity metric rejected (frequency-context guard).
eq('unknown/maturity metric rejected', B.lookupBenchmark(cohort, 'rtw_maturity', synth, CRB), null);

ok('no em or en dashes in engine source', true); // covered by the guardrail below

if (failures) { console.error(failures + ' checks failed'); process.exit(1); }
console.log('assessment-benchmark: PASS');
```

- [ ] **Step 2: Run and watch it fail** (engine functions undefined).

- [ ] **Step 3: Implement `benchmark.js`.** UMD wrapper. Implement the four functions per the interfaces. `cohortHierarchy` builds rungs 1 to 5 from `config` (industry+province_state+size; industry+country+size; industry+country; industry-family+country; country), including a rung only when the cohort supplies its required fields. `confidenceFor`: below `config.adequacyFloor` observations -> INSUFFICIENT; else rung 1 or 2 -> HIGH, rung 3 or 4 -> MODERATE, rung 5 -> ESTIMATED. `lookupBenchmark`: reject a metric not in `config.metrics` (return null); walk the hierarchy; for the first rung whose `dataset[metric][key]` exists with `observations >= adequacyFloor`, return `{ value, matchedCohortRung:rung, confidence: confidenceFor(rung, observations, config), sourceId, benchmarkVersion }`; else null. Never blend or interpolate. `benchmarkVersion` returns `config.benchmarkVersion`. Read all thresholds/rungs from config; no hardcoded cohort strings or thresholds. Dash-clean.

- [ ] **Step 4: Run to green.**

- [ ] **Step 5: Add the guardrail assertions to the same test file.** Append: the engine source contains no bare `HIGH`/`MODERATE` confidence decision based on a hardcoded numeric literal (thresholds come from config); a char-code (0x2013/0x2014) scan of `benchmark.js` and `crb-2026-01.js` is clean; `index.html` was NOT modified to load the benchmark (grep the file, assert no `benchmark.js` script tag) so it truly ships dark. Run green.

- [ ] **Step 6: Run the whole assessment suite** (`for f in deploy/assessment-*.test.mjs; do echo "== $f =="; node "$f" || exit 1; done`) and confirm every assessment suite passes (the CRS_1.1 suites are untouched and must stay green).

- [ ] **Step 7: Commit** (`git add deploy/assessment/benchmark.js deploy/assessment-benchmark.test.mjs; git commit -m "feat(assessment): dark benchmark engine (cohort hierarchy, confidence, lookup)"`).

---

## Self-Review

Spec coverage: source registry config (Task 1), cohort hierarchy and progressive broadening (Task 2), confidence levels (Task 2), lookup with never-manufacture and frequency-context guard (Task 2), versioning (Tasks 1 and 2), dark (empty data, index.html untouched, guardrail in Task 2 Step 5), testing with SYNTH fixtures (both tasks), no migration / no visitor surface / no ingestion (throughout). Result-surface wiring and real data loading are explicitly out of scope (spec sections 7 and 11).

Placeholder scan: source metadata is transcribed from the B1 research file during Task 1 Step 3, which is a transcription step with the exact fields listed, not a deferred placeholder. `adequacyFloor` defaults to a stated number, config-tunable.

Type consistency: `cohortHierarchy` returns `cohortSpec[]` with `{rung, on}`; `lookupBenchmark` consumes those rungs and a `dataset` keyed by `metric` then `JSON.stringify(on)`; the SYNTH dataset in the test is built with exactly that key; `confidenceFor(rung, observations, config)` signature matches its use inside `lookupBenchmark`; `benchmarkVersion` returns `config.benchmarkVersion` used in the result object.
