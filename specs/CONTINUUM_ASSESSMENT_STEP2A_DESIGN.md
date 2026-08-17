# Continuum Public Assessment, Step 2A: Sophisticated Scoring. Design Spec

Date: 2026-08-16. Status: DESIGN, awaiting Gary's review. Lane: public marketing
site (deploy/), outside the held platform. No em dashes or en dashes anywhere.

Step 2A is the first of four sub-projects decomposed from Prompt 63 (Step 2). It
deepens the deterministic scoring that Step 1 shipped, underneath the same
"6 questions, instant score, optional 6, deeper result" front end. Sub-projects
B (benchmark), C (proprietary benchmark), and D (Opportunity Score) follow, each
its own spec. Gary approved this design on 2026-08-16.

## 1. Scope and decisions

- Refines the existing `deploy/assessment/` config, engine, and Stage 2 result.
  Version bumps from `CRS_1.0` to `CRS_1.1`. Historical `CRS_1.0` rows are never
  recalculated (Prompt 63 Section 21).
- No database migration. The stored `exposure` and `provenance` columns are
  already `jsonb` and absorb the richer data; the RPC and table are unchanged.
- No gates: client side plus config, no external actions, no consent-copy
  dependency. Storage remains opt-in and own-result-only (Step 1 / Prompt 63c).
- Financial model: ON but only with real employer inputs (Gary's ruling). Dollar
  figures render only when the required inputs are supplied; otherwise
  operational only. Every assumption is stored and labelled; industry estimates
  are identified as estimates on screen; nothing is silently assumed
  (Sections 16, 17, 25).
- Front end stays 6 plus optional 6. New inputs (exact numbers, financial) are
  OPTIONAL fields inside the existing Stage 2, never new required questions.

## 2. Config changes (`config/crs-1.1.js`)

New file `deploy/assessment/config/crs-1.1.js` (Step 1's `crs-1.0.js` stays for
history and is not edited). `version: "CRS_1.1"`. Adds a `changelog` string
noting the delta from 1.0. Carries everything CRS_1.0 had, plus:

- `opportunityTemplates`: a map `{ DIMENSION: "<one plain sentence>" }` for all
  six dimensions, used to render the three priority opportunities (replaces
  Step 1's generic label-derived line). Deterministic, config-authored.
- `observations`: expanded rules library (Step 1 had three). Each is still
  `{ id, when:[{dimension,op,value}], template }`, first match wins, with a
  default catch-all last.
- `exposure[]`: each exposure input gains `allowExact: true|false`. When true the
  UI offers an optional exact-number field. `repValue` per band stays (used for
  the band midpoint estimate). `annual_lost_time_cases` and
  `avg_lost_time_duration_days` are `allowExact: true`; `workforce_size` and
  `site_count` remain band only.
- `confidence`: rules extended so tiers can read exact-vs-range and
  user-provided-vs-estimated counts (see section 4). Benchmark quality is a
  sub-project B input and is out of scope here.
- `financial`: a config block:
  `{ enabled_when_inputs_present: true, inputs:[ {key, label, unit, required:bool, industry_estimate: number|null} ], operational_only_note: "<string>" }`.
  `inputs` lists the financial variables (Section 17): `loaded_daily_labour_cost`
  (required for any dollar output), and optional `replacement_or_overtime_cost`,
  `admin_handling_cost`, `claim_cost`, `indirect_cost_multiplier`. Any
  `industry_estimate` present is a labelled fallback, never silently applied
  (see section 5).

## 3. Exact-number inputs and provenance (Sections 15, 16)

In Stage 2, exposure inputs with `allowExact: true` render their band selector
AND an optional "or enter the exact number" field. Resolution, per input:

- Exact number supplied: `{ value: <number>, provenance: "USER_PROVIDED" }`.
- Only a band selected: `{ value: <band.repValue>, provenance: "MODELED_ESTIMATE" }`.
- Neither: `{ value: null, provenance: "UNKNOWN" }`.

Provenance travels into the result object and the stored `provenance` jsonb and
survives every calculation (Section 15). The band a respondent selects is
`USER_PROVIDED`; the point estimate derived from that band is `MODELED_ESTIMATE`
(Prompt 63b registration note 3).

Re-identification note carried to sub-project C: exact org figures (cases,
duration, financial) are more identifying than bands. Storing them here is
acceptable because storage is opt-in and own-result-only (the respondent's own
data, Section 00.4). Sub-project C MUST band or suppress these before any
aggregate benchmark, per Prompt 63a note 3. This spec does not aggregate.

## 4. Refined confidence (Section 23)

`assessmentConfidence` now factors: number of answered maturity questions, number
of Not sure responses, count of exact vs range exposure values, and count of user
provided vs estimated values. Still deterministic, config-driven, first match
wins, and it controls only the wording strength (High: "Your responses
indicate"; lower: "Based on the information available, your responses suggest").
It never changes the score. Starting tiers (in config, tunable):

- High: at most one Not sure, at least five dimensions scored, and at least one
  exact exposure value.
- Moderate: at most three Not sure, at least four dimensions scored.
- Limited: otherwise.

## 5. Financial model (Sections 16, 17, 25)

Engine function `financialModel(exposureResolved, financialInputs, config)`:

- Returns operational-only (`{ dollars: null }`) unless `loaded_daily_labour_cost`
  is present and a lost-worker-day total exists.
- When present: converts worker-day scenarios to dollars at the employer's stated
  daily cost, plus any optional cost variables the employer supplied. Example
  output line: "A 10 percent reduction is about 50 worker days, roughly $X at
  your stated $Y per day." Estimates labelled; whole dollars, no false precision
  (Section 25).
- Every variable used is returned with its provenance: `USER_PROVIDED` for
  supplied values, `MODELED_ESTIMATE` for any config `industry_estimate` fallback
  that the UI explicitly offered and the user accepted. An industry estimate is
  never applied silently: if a variable is missing and only a config estimate
  exists, the dollar figure for that component is either omitted or shown with a
  clear "industry estimate" label, per config and the UI, never blended in
  invisibly.
- The assumptions (each variable, its value, its provenance) are stored on the
  saved row under `provenance.financial` in the existing `provenance` jsonb. No
  schema change.

The financial block is framed as a scenario, never a product performance claim or
a guarantee (Sections 16, 17). Dollar ROI is not shown without real inputs.

## 6. Result rendering (`assessment.js`)

Stage 2 detailed result (Section 24) gains, all deterministic:

- Three priority opportunities, each rendered from `opportunityTemplates` for the
  three lowest scored dimensions (replaces the generic Step 1 line).
- Operational Exposure and Improvement Scenario as today, now using resolved
  exact-or-band exposure with provenance labels ("estimated" where derived).
- The financial scenario lines ONLY when `financialModel` returns dollars;
  otherwise the operational lines stand alone.
- Version stamped: `buildResult().scoring_model_version === "CRS_1.1"`.
- No benchmark comparison (sub-projects B and C, gated).

Stage 2 question surface gains the optional exact-number fields (section 3) and an
optional collapsible financial input block (loaded daily labour cost primary; the
others optional). These are optional and skippable; skipping yields
operational-only, and the assessment still completes in the simple 6 plus 6 shape.

## 7. Engine interfaces (for the plan)

In `deploy/assessment/scoring.js` (extended; CRS_1.0 callers stay valid):

- `resolveExposure(exposureAnswers, config) -> { key: { value:number|null, provenance } }`
- `lostWorkerDays(exposureResolved, config) -> { days:number|null, provenance, scenarios:[{pct,days}] }` (updated to consume resolved exposure)
- `financialModel(exposureResolved, financialInputs, config) -> { dollars:{ perScenario:[{pct,dollars,provenance}] }|null, assumptions:[{key,value,provenance,label}] }`
- `assessmentConfidence(answers, dimScores, exposureResolved, config) -> "High"|"Moderate"|"Limited"`
- `priorityOpportunities(dimScores, config) -> [{ dimension, line }]` (three lowest scored, using `opportunityTemplates`)
- Existing `dimensionScores`, `overallScore`, `bandFor`, `strongestAndGap`,
  `observation`, `missingDataRate` keep their CRS_1.0 signatures.

## 8. Storage

No migration. `buildResult()` now returns `scoring_model_version: "CRS_1.1"`, a
richer `exposure` object (resolved values plus provenance), and financial
assumptions under `provenance.financial`. All of it lands in the existing `jsonb`
columns via the unchanged RPC. Still opt-in, own-result-only, no PII (financial
figures are org-level, not personal; stored only on an explicit Save).

## 9. Testing

Extend the Node suites (`deploy/assessment-*.test.mjs`), SYNTH fixtures, CI-gated:

- Provenance: exact number is USER_PROVIDED, band is MODELED_ESTIMATE, missing is
  UNKNOWN; provenance survives into the result and buildResult payload.
- Confidence tiers across the new inputs (exact vs range, user vs estimated).
- Priority opportunities: the three lowest dimensions selected, each rendered
  from `opportunityTemplates`.
- Lost worker days with resolved exposure (42 cases at 12 days is 504; 10 percent
  is 50), provenance correct for exact vs band.
- Financial model: dollars null without `loaded_daily_labour_cost`; dollars
  present and correctly computed with it; assumptions stored with provenance; an
  unsupplied variable is never silently assumed; industry estimate labelled.
- Version stamping CRS_1.1 on new responses; CRS_1.0 config still loads and its
  callers still pass (backward compatible).
- The config-not-in-presentation guardrail still holds for CRS_1.1 (weights,
  thresholds, templates, financial constants all in config).
- The six QA profiles re-run under CRS_1.1 with expected scores.

## 10. Constraints and gates

Dash law. Three layer resilience (config inline fallback, pure client scoring,
best-effort save). No LLM. UNKNOWN never rendered as 0. Provenance survives.
No package.json change beyond the existing scoped markers. No external actions.
No consent-copy dependency. Storage stays opt-in and own-result-only. No
benchmarking of any kind (sub-projects B and C). No migration.

## 11. Open items and handoffs

1. Financial variable set: this spec includes loaded daily labour cost (required
   for dollars) plus four optional variables. If Craig wants a specific cost
   stack or omissions, it is config-only.
2. Exact org figures and financial inputs stored here are own-result-only;
   sub-project C must band or suppress them before any aggregate. Flagged.
3. Opportunity template copy and the expanded observation rules are new visitor
   copy; they follow the plain-language and dash rules and are Craig-owned copy
   in principle, drafted here and adjustable in config.
