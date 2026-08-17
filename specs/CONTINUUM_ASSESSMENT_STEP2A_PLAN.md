# Step 2A Sophisticated Scoring (CRS_1.1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deepen the shipped deterministic assessment engine to CRS_1.1: exact-number exposure inputs with provenance, per-dimension opportunity templates, refined confidence, and a financial model gated on real employer inputs, underneath the same 6 plus optional 6 front end.

**Architecture:** Extend the existing static `deploy/assessment/` config, engine, and Stage 2 result. New `config/crs-1.1.js` (the active config), extended `scoring.js` (backward compatible), and updated `assessment.js` rendering. No database migration (the `exposure`/`provenance` columns are already jsonb).

**Tech Stack:** Plain HTML/CSS/JS (no build). Node `.mjs` tests (run by `suites.yml`). No new dependency.

**Spec:** `specs/CONTINUUM_ASSESSMENT_STEP2A_DESIGN.md` (read it; it is the authority).

## Global Constraints

- No em dashes and no en dashes anywhere (code, comments, copy, commit messages). Tests detect dashes by `charCodeAt(0) === 0x2013` (en) or `0x2014` (em), never a glyph character class.
- Deterministic only, no LLM. Config-driven: no weights, thresholds, templates, or financial constants in presentation or engine code, only in config.
- UNKNOWN is never rendered as 0. Not sure stays null and lowers confidence, never the score.
- Provenance survives calculation: USER_PROVIDED (exact / user supplied), MODELED_ESTIMATE (band midpoint / accepted industry estimate), UNKNOWN.
- `SCORING_MODEL_VERSION` is `"CRS_1.1"`, stored on every new response. CRS_1.0 config still loads and its callers still pass (backward compatible). Historical rows are never recalculated.
- Financial: dollars render ONLY when `loaded_daily_labour_cost` is supplied; otherwise operational-only. Every assumption stored with provenance; industry estimates labelled; nothing silently assumed. Scenario language, never a guarantee. Whole dollars, no false precision.
- No DB migration. No external actions. No benchmark of any kind. Storage stays opt-in, own-result-only, no PII.
- Node module resolution: `deploy/package.json` is `type:module`; the assessment subtree carries `{"type":"commonjs"}` markers (approved). New `.js` under `deploy/assessment/` inherit them; no new package.json.
- Tests are `deploy/assessment-*.test.mjs` (auto-run by `suites.yml`).

---

### Task 1: CRS_1.1 config

**Files:**
- Create: `deploy/assessment/config/crs-1.1.js`
- Test: `deploy/assessment-config-11.test.mjs`

**Interfaces:**
- Produces the CRS_1.1 config object (UMD: `module.exports` in Node, `window.ContinuumCRS` in browser). It is CRS_1.0's shape PLUS: `changelog` (string), `opportunityTemplates` ({DIMENSION: string} for all six), an expanded `observations` array, `exposure[].allowExact` (boolean), and a `financial` block `{ enabled_when_inputs_present:true, operational_only_note:string, inputs:[{key,label,unit,required:boolean,industry_estimate:number|null}] }`. `version` is `"CRS_1.1"`.

- [ ] **Step 1: Write the failing config validity test**

```js
// deploy/assessment-config-11.test.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const CRS = require('./assessment/config/crs-1.1.js');
let failures = 0;
function ok(n, c) { if (!c) { failures++; console.error('FAIL', n); } }

ok('version is CRS_1.1', CRS.version === 'CRS_1.1');
ok('has changelog string', typeof CRS.changelog === 'string' && CRS.changelog.length > 0);
ok('weights still sum to 100', Object.values(CRS.dimensions).reduce((s,d)=>s+d.weight,0) === 100);
ok('opportunityTemplates cover all six dimensions',
  Object.keys(CRS.dimensions).every(d => typeof CRS.opportunityTemplates[d] === 'string'
    && CRS.opportunityTemplates[d].length > 0));
ok('observations expanded beyond three and has a default',
  CRS.observations.length > 3 && CRS.observations.some(r => r.when.length === 0));
ok('cases and duration allow exact, size and sites do not', (function () {
  const by = {}; CRS.exposure.forEach(e => { by[e.kind] = e.allowExact === true; });
  return by.annual_lost_time_cases === true && by.avg_lost_time_duration_days === true
    && by.workforce_size === false && by.site_count === false;
})());
ok('financial block shape',
  CRS.financial && CRS.financial.enabled_when_inputs_present === true
  && Array.isArray(CRS.financial.inputs)
  && CRS.financial.inputs.some(i => i.key === 'loaded_daily_labour_cost' && i.required === true));
ok('financial industry estimates are numbers or null',
  CRS.financial.inputs.every(i => i.industry_estimate === null || typeof i.industry_estimate === 'number'));
ok('confidence rules can read exact-value counts',
  Array.isArray(CRS.confidence.rules) && CRS.confidence.rules.length >= 3);
ok('no em or en dashes',
  ![...JSON.stringify(CRS)].some(c => c.charCodeAt(0) === 0x2013 || c.charCodeAt(0) === 0x2014));

if (failures) { console.error(failures + ' checks failed'); process.exit(1); }
console.log('assessment-config-11: PASS');
```

- [ ] **Step 2: Run it and watch it fail** (`node deploy/assessment-config-11.test.mjs`, module not found).

- [ ] **Step 3: Write `config/crs-1.1.js`.** Copy CRS_1.0's structure (dimensions, scale, bands, industries, questions, exposure, observations) from `deploy/assessment/config/crs-1.0.js` verbatim, then apply the CRS_1.1 additions: set `version:"CRS_1.1"`; add `changelog`; add `opportunityTemplates` (one plain sentence per dimension, e.g. MODIFIED_DUTY: "Finding suitable modified duties still depends on manual coordination, which is where recovery time is most often lost."); expand `observations` with a few more `{id,when,template}` rules plus the existing default; add `allowExact:true` to the `annual_lost_time_cases` and `avg_lost_time_duration_days` exposure entries and `allowExact:false` to `workforce_size` and `site_count`; add the `financial` block with `loaded_daily_labour_cost` (required, unit "dollars per day", industry_estimate null) plus optional `replacement_or_overtime_cost`, `admin_handling_cost`, `claim_cost`, `indirect_cost_multiplier`. Keep the UMD wrapper identical to crs-1.0.js. Dash-clean.

- [ ] **Step 4: Run to green** (`assessment-config-11: PASS`).

- [ ] **Step 5: Commit** (`git add deploy/assessment/config/crs-1.1.js deploy/assessment-config-11.test.mjs; git commit -m "feat(assessment): CRS_1.1 config with exact inputs, opportunity templates, financial block"`).

---

### Task 2: Engine extensions

**Files:**
- Modify: `deploy/assessment/scoring.js`
- Test: `deploy/assessment-scoring-11.test.mjs`

**Interfaces:**
- Consumes CRS_1.1 config. Adds to the `ContinuumScoring` export, all pure:
  - `resolveExposure(exposureAnswers, config) -> { key: { value:number|null, provenance:"USER_PROVIDED"|"MODELED_ESTIMATE"|"UNKNOWN" } }`. `exposureAnswers[key]` may be `{ band:"B2" }`, `{ exact:42 }`, or absent. Exact wins (USER_PROVIDED); else band repValue (MODELED_ESTIMATE); else null (UNKNOWN).
  - `lostWorkerDays(exposureResolved, config) -> { days:number|null, provenance, scenarios:[{pct,days}] }`. Uses `exposureResolved.annual_lost_time_cases.value` times `.avg_lost_time_duration_days.value`. provenance is USER_PROVIDED only if both are USER_PROVIDED, else MODELED_ESTIMATE, else (any null) days null.
  - `financialModel(exposureResolved, financialInputs, config) -> { dollars:{ perScenario:[{pct,dollars,provenance}] }|null, assumptions:[{key,value,provenance,label}] }`. `financialInputs[key]` is a number the user supplied or absent. Returns `dollars:null` unless `loaded_daily_labour_cost` is supplied AND lostWorkerDays returns non-null days; else converts each worker-day scenario to whole dollars at the daily cost. assumptions lists every financial variable used with provenance (USER_PROVIDED for supplied, MODELED_ESTIMATE for an accepted config industry_estimate) and a label. An unsupplied variable with no accepted estimate is omitted, never assumed.
  - `priorityOpportunities(dimScores, config) -> [{ dimension, line }]` (up to three lowest scored dimensions, each `line` from `config.opportunityTemplates`).
  - `assessmentConfidence(answers, dimScores, exposureResolved, config) -> "High"|"Moderate"|"Limited"` (extended signature; incorporates exact-value count).
- Existing `dimensionScores`, `overallScore`, `bandFor`, `strongestAndGap`, `observation`, `missingDataRate` keep their signatures unchanged.

- [ ] **Step 1: Write failing engine tests**

```js
// deploy/assessment-scoring-11.test.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const CRS = require('./assessment/config/crs-1.1.js');
const S = require('./assessment/scoring.js');
let failures = 0;
function eq(n,a,b){ if (JSON.stringify(a)!==JSON.stringify(b)){ failures++; console.error('FAIL',n,'got',JSON.stringify(a),'want',JSON.stringify(b)); } }
function ok(n,c){ if(!c){ failures++; console.error('FAIL',n); } }

// resolveExposure: exact -> USER_PROVIDED, band -> MODELED_ESTIMATE, absent -> UNKNOWN.
const rex = S.resolveExposure({ annual_lost_time_cases:{ exact:42 }, avg_lost_time_duration_days:{ band: firstBandKey(CRS,'avg_lost_time_duration_days') } }, CRS);
eq('exact cases value', rex.annual_lost_time_cases.value, 42);
eq('exact cases provenance', rex.annual_lost_time_cases.provenance, 'USER_PROVIDED');
eq('band duration provenance', rex.avg_lost_time_duration_days.provenance, 'MODELED_ESTIMATE');
ok('absent workforce size is UNKNOWN', rex.workforce_size && rex.workforce_size.provenance === 'UNKNOWN');

// lostWorkerDays with both exact = 42 x 12 = 504, USER_PROVIDED, 10 percent = 50.
const rex2 = S.resolveExposure({ annual_lost_time_cases:{ exact:42 }, avg_lost_time_duration_days:{ exact:12 } }, CRS);
const lwd = S.lostWorkerDays(rex2, CRS);
eq('lwd days', lwd.days, 504);
eq('lwd provenance user', lwd.provenance, 'USER_PROVIDED');
ok('10 percent scenario is 50', lwd.scenarios.some(s => s.pct===10 && s.days===50));

// financialModel: null without daily cost; dollars with it.
eq('no dollars without daily cost', S.financialModel(rex2, {}, CRS).dollars, null);
const fin = S.financialModel(rex2, { loaded_daily_labour_cost: 400 }, CRS);
ok('dollars present with daily cost', fin.dollars && Array.isArray(fin.dollars.perScenario));
ok('10 percent dollars = 50 x 400 = 20000',
  fin.dollars.perScenario.some(s => s.pct===10 && s.dollars===20000));
ok('assumption records the daily cost as USER_PROVIDED',
  fin.assumptions.some(a => a.key==='loaded_daily_labour_cost' && a.value===400 && a.provenance==='USER_PROVIDED'));
ok('unsupplied variable not silently assumed',
  !fin.assumptions.some(a => a.key==='claim_cost' && a.provenance==='USER_PROVIDED'));

// priorityOpportunities: three lowest scored dimensions, each with a template line.
const ds = { MEDICAL_ACCESS:0, RESTRICTIONS_WORKFLOW:100, MODIFIED_DUTY:25, RECOVERY_VISIBILITY:50, CLAIMS_COORDINATION:75, WORKFLOW_INTEGRATION:100 };
const po = S.priorityOpportunities(ds, CRS);
eq('three opportunities', po.length, 3);
eq('lowest first', po[0].dimension, 'MEDICAL_ACCESS');
ok('each has a template line', po.every(p => typeof p.line === 'string' && p.line.length > 0));

// confidence incorporates exact-value count (extended signature).
ok('confidence returns a tier',
  ['High','Moderate','Limited'].includes(
    S.assessmentConfidence({}, ds, rex2, CRS)));

function firstBandKey(cfg, kind){ const e = cfg.exposure.find(x=>x.kind===kind); return e.bands[0].key; }

if (failures) { console.error(failures + ' checks failed'); process.exit(1); }
console.log('assessment-scoring-11: PASS');
```

- [ ] **Step 2: Run and watch it fail** (functions undefined).

- [ ] **Step 3: Implement the new functions in `scoring.js`.** Add `resolveExposure`, update `lostWorkerDays` to consume resolved exposure (keep a guard so an old-style numeric call still works if any CRS_1.0 caller remains, or update its only caller in the controller in Task 3), add `financialModel`, `priorityOpportunities`, and extend `assessmentConfidence` to the new signature `(answers, dimScores, exposureResolved, config)` (exposureResolved may be undefined; treat missing as zero exact values). Read `config.opportunityTemplates`, `config.financial`, and each `config.exposure[].bands[].repValue`. Keep all existing functions and their signatures. Whole-dollar rounding via `Math.round`. Dash-clean.

- [ ] **Step 4: Run to green.**

- [ ] **Step 5: Re-run the six QA profiles under CRS_1.1.** Add to the test a load of the CRS_1.1 config through the existing profile assertions (maturity scores unchanged from CRS_1.0 since weights and scale are identical), confirming backward compatibility. Run green.

- [ ] **Step 6: Commit** (`git add deploy/assessment/scoring.js deploy/assessment-scoring-11.test.mjs; git commit -m "feat(assessment): CRS_1.1 engine (exposure resolution, financial model, opportunity lines, confidence)"`).

---

### Task 3: Controller and Stage 2 UI

**Files:**
- Modify: `deploy/assessment/assessment.js`
- Modify: `deploy/assessment/index.html`
- Modify: `deploy/assessment/assessment.css`
- Test: `deploy/assessment-smoke-11.test.mjs`

**Interfaces:**
- `index.html` loads `config/crs-1.1.js` (the active config) instead of `crs-1.0.js`.
- Stage 2 renders the optional exact-number field for `allowExact` exposure inputs, and an optional collapsible financial input block (loaded daily labour cost primary, others optional).
- Result rendering uses `priorityOpportunities` (three template lines), `resolveExposure` plus `lostWorkerDays` for operational exposure, and `financialModel` for dollar lines (only when present).
- `buildResult()` returns `scoring_model_version: window.ContinuumCRS.version` (now CRS_1.1), a richer `exposure` object (the resolved values plus provenance), and financial assumptions under `provenance.financial`.

- [ ] **Step 1: Write the smoke/structure test**

```js
// deploy/assessment-smoke-11.test.mjs
import { readFileSync } from 'fs';
const html = readFileSync(new URL('./assessment/index.html', import.meta.url), 'utf8');
const js  = readFileSync(new URL('./assessment/assessment.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('./assessment/assessment.css', import.meta.url), 'utf8');
let failures = 0; function ok(n,c){ if(!c){ failures++; console.error('FAIL', n); } }

ok('loads crs-1.1 config', html.includes('config/crs-1.1.js'));
ok('does not load crs-1.0 as the active config', !html.includes('config/crs-1.0.js'));
ok('controller uses priorityOpportunities', js.includes('priorityOpportunities'));
ok('controller uses resolveExposure', js.includes('resolveExposure'));
ok('controller uses financialModel', js.includes('financialModel'));
ok('version from config', js.includes('ContinuumCRS.version'));
ok('no benchmark on the surface', !/benchmark/i.test(html));
ok('no em or en dashes',
  ![...(html + js + css)].some(c => c.charCodeAt(0) === 0x2013 || c.charCodeAt(0) === 0x2014));
if (failures) { console.error(failures + ' checks failed'); process.exit(1); }
console.log('assessment-smoke-11: PASS');
```

- [ ] **Step 2: Run and watch it fail.**

- [ ] **Step 3: Update `index.html`** to load `config/crs-1.1.js` before `scoring.js`.

- [ ] **Step 4: Update `assessment.js`.** In Stage 2: render an optional exact-number input for each `allowExact` exposure input (labelled "or enter the exact number"), and an optional collapsible financial block from `config.financial.inputs`. Collect exposure answers as `{ band, exact }` per input. In the result: call `resolveExposure`, `lostWorkerDays`, `financialModel`, `priorityOpportunities`; render the three opportunity template lines, the operational exposure with provenance labels ("estimated" where derived), and the financial dollar lines only when `financialModel(...).dollars` is non-null (each labelled, whole dollars). Update `buildResult()` to emit `scoring_model_version` from config, the resolved `exposure` with provenance, and `provenance.financial = financialModel(...).assumptions`. Keep the opt-in save, the FALLBACK_CONFIG resilience (update its version marker), and confidence-controlled wording. Dash-clean.

- [ ] **Step 5: Update `assessment.css`** for the optional inputs and financial block (existing style, 44px targets, reduced-motion honored).

- [ ] **Step 6: Run the smoke test to green.**

- [ ] **Step 7: Manual browser verification (controller does this).** Note in the report that live rendering (exact inputs, financial dollars only with a daily cost, three opportunity lines) is pending a browser check by the controller.

- [ ] **Step 8: Commit** (`git add deploy/assessment/index.html deploy/assessment/assessment.js deploy/assessment/assessment.css deploy/assessment-smoke-11.test.mjs; git commit -m "feat(assessment): CRS_1.1 Stage 2 optional inputs, financial and opportunity rendering"`).

---

### Task 4: Guardrails and full suite

**Files:**
- Create: `deploy/assessment-guardrails-11.test.mjs`
- Test: the whole `deploy/assessment-*.test.mjs` suite

- [ ] **Step 1: Write the guardrail test**

```js
// deploy/assessment-guardrails-11.test.mjs
import { readFileSync } from 'fs';
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:])\/\/.*$/gm,'$1');
const js  = strip(readFileSync(new URL('./assessment/assessment.js', import.meta.url), 'utf8'));
const eng = strip(readFileSync(new URL('./assessment/scoring.js', import.meta.url), 'utf8'));
let failures = 0; function ok(n,c){ if(!c){ failures++; console.error('FAIL', n); } }
ok('engine reads weights from config', /config\.dimensions\[[^\]]+\]\.weight/.test(eng));
ok('engine reads opportunity templates from config', eng.includes('config.opportunityTemplates'));
ok('engine reads financial config', eng.includes('config.financial'));
ok('version referenced from config', js.includes('CONFIG.version') && js.includes('window.ContinuumCRS'));
ok('no bare daily-cost or dollar-rate literal in engine',
  !/\bloaded_daily_labour_cost\s*=\s*\d/.test(eng));
if (failures) { console.error(failures + ' checks failed'); process.exit(1); }
console.log('assessment-guardrails-11: PASS');
```

- [ ] **Step 2: Run and watch it fail, then make it pass** (the assertions describe already-built code from Tasks 2 and 3; if any fails, fix the referenced code, not the test).

- [ ] **Step 3: Run the entire assessment suite.**

Run: `for f in deploy/assessment-*.test.mjs; do echo "== $f =="; node "$f" || exit 1; done`
Expected: every assessment suite prints PASS.

- [ ] **Step 4: Commit** (`git add deploy/assessment-guardrails-11.test.mjs; git commit -m "test(assessment): CRS_1.1 guardrails"`).

---

## Self-Review

Spec coverage: exact-number inputs + provenance (Tasks 1,2,3), per-dimension opportunity templates (Tasks 1,2,3), refined confidence (Tasks 1,2), financial model gated on real inputs with stored labelled assumptions (Tasks 1,2,3), lost-worker-day and scenario refinement (Task 2), CRS_1.1 versioning and backward compatibility (Tasks 1,2,3), no migration (storage via existing jsonb, Task 3), testing incl QA profiles and guardrails (all tasks), constraints (throughout). No benchmark, no external actions, no gates.

Placeholder scan: opportunity template and observation copy is authored during Task 1 Step 3 from the spec intent (plain-language sentences), which is the transcription/authoring step, not a deferred placeholder. Config values (financial industry estimates) default to null and are config-tunable.

Type consistency: `resolveExposure` returns `{key:{value,provenance}}` consumed by `lostWorkerDays` and `financialModel`; `exposureAnswers[key]` is `{band,exact}` produced by the controller (Task 3) and consumed by `resolveExposure` (Task 2); `buildResult` field names match the existing migration columns (unchanged) with financial under `provenance.financial`; `assessmentConfidence` new 4-arg signature is used consistently in Task 2 tests and Task 3 controller.
