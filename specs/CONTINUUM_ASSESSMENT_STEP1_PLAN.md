# Public Injury Recovery Assessment, Step 1: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public two stage Injury Recovery Assessment shell: six questions to an instant Recovery Snapshot, then an optional six to a deeper result, on a real config driven versioned deterministic score, with anonymous own result only storage.

**Architecture:** A static page under `deploy/assessment/` whose scoring is pure client side JavaScript reading a versioned config object. Persistence is best effort through an anon callable SECURITY DEFINER RPC into an append only table. No benchmarking, no lead capture, no LLM.

**Tech Stack:** Plain HTML, CSS, and JavaScript (no build step, matching the static site). Node `.mjs` test scripts (repo convention, run by `suites.yml`). Postgres migration applied by `exposure-proof.yml` CI. Supabase anon client for the persistence call.

**Spec:** `specs/CONTINUUM_ASSESSMENT_STEP1_DESIGN.md` (read it; the plan argues from it and the verbatim question copy lives there in section 3).

## Global Constraints

- No em dashes and no en dashes anywhere: code, comments, copy, commit messages. Use commas, colons, or a spaced hyphen.
- Tests that assert dash cleanliness must detect dashes by char code (`charCodeAt(0) === 0x2013` for en, `0x2014` for em), never by a literal glyph character class, so the test files themselves stay dash clean.
- Three layer resilience on every data path: config has an inline fallback, scoring is pure client side, storage is best effort and never blocks or alters the shown result.
- No LLM in scoring or interpretation. Deterministic only.
- UNKNOWN is never rendered as 0. "Not sure" is `null`, excluded from the score, and lowers confidence, never the score.
- Provenance values survive calculation: USER_PROVIDED, MODELED_ESTIMATE, UNKNOWN.
- Append only migrations. Never edit an applied migration.
- No `package.json` change. If a Supabase anon client is not already present on the marketing site, vendor it locally; do not add an npm dependency or a CDN script.
- `SCORING_MODEL_VERSION` is `"CRS_1.0"`, stored on every response. Historical results are never silently recalculated.
- No benchmark comparison is computed, stored as an aggregate, or displayed (phase 3, gated on the consent copy plus counsel).
- No name, email, company, IP, user agent, or any personal or health data is captured or stored.
- Test fixtures are SYNTH prefixed.
- New tests are `deploy/*.test.mjs` (auto run by `suites.yml`); the SQL migration is applied by `exposure-proof.yml`.

---

### Task 1: Scoring config module

**Files:**
- Create: `deploy/assessment/config/crs-1.0.js`
- Test: `deploy/assessment-config.test.mjs`

**Interfaces:**
- Produces: a config object exported as `module.exports` in Node and assigned to `window.ContinuumCRS` in the browser. Shape:
  `{ version:string, scale:{KEY:number|null}, dimensions:{DIM:{label,weight}}, bands:[{min,max,label}], confidence:{rules:[{level,maxNotSure,minDimensionsScored}]}, industries:[string], questions:[{id,stage,dimension,options:[{label,key,value,provenance}]}], exposure:[{id,stage,kind,bands:[{label,key,repDays?}]}], observations:[{id,when:[{dimension,op,value}],template}] }`
- The maturity option `value` is one of the `scale` numbers, or `null` for the `NOT_SURE` option.

- [ ] **Step 1: Write the failing config validity test**

```js
// deploy/assessment-config.test.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const CRS = require('./assessment/config/crs-1.0.js');
let failures = 0;
function check(name, cond) { if (!cond) { failures++; console.error('FAIL', name); } }

check('version is CRS_1.0', CRS.version === 'CRS_1.0');
check('weights sum to 100',
  Object.values(CRS.dimensions).reduce((s, d) => s + d.weight, 0) === 100);
check('six dimensions', Object.keys(CRS.dimensions).length === 6);
check('scale values correct',
  CRS.scale.STRUCTURED === 100 && CRS.scale.ESTABLISHED === 75 &&
  CRS.scale.PARTIAL === 50 && CRS.scale.MANUAL === 25 &&
  CRS.scale.ABSENT === 0 && CRS.scale.NOT_SURE === null);
check('bands cover 0 to 100 with no gap',
  CRS.bands[0].min === 0 && CRS.bands[CRS.bands.length - 1].max === 100 &&
  CRS.bands.every((b, i) => i === 0 || b.min === CRS.bands[i - 1].max + 1));
check('every question maps to a known dimension',
  CRS.questions.every(q => CRS.dimensions[q.dimension]));
check('every maturity option value is in scale or null',
  CRS.questions.every(q => q.options.every(o =>
    o.value === null || Object.values(CRS.scale).includes(o.value))));
check('every question has exactly one NOT_SURE option',
  CRS.questions.every(q => q.options.filter(o => o.key === 'NOT_SURE').length === 1));
check('stage 1 has one question per dimension (six total)',
  CRS.questions.filter(q => q.stage === 1).length === 6);
check('no em or en dashes in config strings',
  ![...JSON.stringify(CRS)].some(function (c) { return c.charCodeAt(0) === 0x2013 || c.charCodeAt(0) === 0x2014; }));

if (failures) { console.error(failures + ' config checks failed'); process.exit(1); }
console.log('assessment-config: PASS');
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node deploy/assessment-config.test.mjs`
Expected: FAIL (module not found / cannot require missing file).

- [ ] **Step 3: Write the config**

Create `deploy/assessment/config/crs-1.0.js` using the UMD wrapper below. Transcribe the twelve questions and four exposure inputs verbatim from spec section 3 into `questions` and `exposure`. Each maturity option is `{ label:"<spec text>", key:"STRUCTURED|ESTABLISHED|PARTIAL|MANUAL|ABSENT|NOT_SURE", value:<scale number or null>, provenance:"USER_PROVIDED" }` (the NOT_SURE option is `value:null, provenance:"UNKNOWN"`).

```js
// deploy/assessment/config/crs-1.0.js
// Continuum Recovery Readiness scoring model, version CRS_1.0. Data only, no
// scoring logic. No em or en dashes anywhere.
(function (root) {
  var CRS = {
    version: "CRS_1.0",
    scale: { STRUCTURED:100, ESTABLISHED:75, PARTIAL:50, MANUAL:25, ABSENT:0, NOT_SURE:null },
    dimensions: {
      MEDICAL_ACCESS:        { label:"Medical Access", weight:15 },
      RESTRICTIONS_WORKFLOW: { label:"Restrictions Workflow", weight:20 },
      MODIFIED_DUTY:         { label:"Modified Duty and RTW", weight:25 },
      RECOVERY_VISIBILITY:   { label:"Recovery Visibility", weight:20 },
      CLAIMS_COORDINATION:   { label:"Claims Coordination", weight:10 },
      WORKFLOW_INTEGRATION:  { label:"Workflow Integration", weight:10 }
    },
    bands: [
      { min:0,  max:39,  label:"Reactive" },
      { min:40, max:59,  label:"Developing" },
      { min:60, max:79,  label:"Established" },
      { min:80, max:100, label:"Advanced" }
    ],
    confidence: { rules: [
      { level:"High",     maxNotSure:1,  minDimensionsScored:5 },
      { level:"Moderate", maxNotSure:3,  minDimensionsScored:4 },
      { level:"Limited",  maxNotSure:99, minDimensionsScored:0 }
    ]},
    industries: ["construction","mining","security","manufacturing","transportation","healthcare","other"],
    questions: [
      // S1Q1..S1Q6 (stage 1, one per dimension) and S2Q5..S2Q6 (stage 2 depth).
      // Transcribe text and options verbatim from spec section 3.1 and 3.2.
      // Example shape for one question:
      // { id:"S1Q3", stage:1, dimension:"MODIFIED_DUTY",
      //   text:"How does your organization find suitable modified or light duties for a recovering worker?",
      //   options:[
      //     { label:"A maintained list of approved modified duties matched to the restrictions", key:"STRUCTURED", value:100, provenance:"USER_PROVIDED" },
      //     { label:"A repeatable process, matched mostly by hand", key:"ESTABLISHED", value:75, provenance:"USER_PROVIDED" },
      //     { label:"Improvised for each case by a supervisor or coordinator", key:"PARTIAL", value:50, provenance:"USER_PROVIDED" },
      //     { label:"Rarely offered, workers usually stay off work", key:"MANUAL", value:25, provenance:"USER_PROVIDED" },
      //     { label:"We do not offer modified duty", key:"ABSENT", value:0, provenance:"USER_PROVIDED" },
      //     { label:"Not sure", key:"NOT_SURE", value:null, provenance:"UNKNOWN" }
      //   ] }
    ],
    exposure: [
      // S2Q1..S2Q4 from spec section 3.2. Each: { id, stage:2, kind:"workforce_size|annual_lost_time_cases|avg_lost_time_duration_days|site_count",
      //   bands:[{ label:"<spec text>", key:"B1", repValue:<representative number for scenario, or null> }] }
      // For avg_lost_time_duration_days give repValue in days per band (for the lost worker day calc).
      // For annual_lost_time_cases give repValue as a representative case count per band.
    ],
    observations: [
      { id:"restrictions_ok_duty_gap",
        when:[ { dimension:"RESTRICTIONS_WORKFLOW", op:">=", value:60 },
               { dimension:"MODIFIED_DUTY", op:"<=", value:50 } ],
        template:"Your responses suggest that medical restrictions are being received reasonably effectively, but translating those restrictions into suitable work may still require significant manual coordination." },
      { id:"visibility_gap",
        when:[ { dimension:"RECOVERY_VISIBILITY", op:"<=", value:25 } ],
        template:"Recovery progress appears to have limited visibility, which usually means problems are noticed late rather than prevented." },
      { id:"default",
        when:[],
        template:"Your responses give an initial picture of how your recovery and return to work process is working today. The deeper assessment will sharpen it." }
    ]
  };
  if (typeof module !== "undefined" && module.exports) module.exports = CRS;
  else root.ContinuumCRS = CRS;
})(typeof window !== "undefined" ? window : globalThis);
```

- [ ] **Step 4: Run the test to green**

Run: `node deploy/assessment-config.test.mjs`
Expected: `assessment-config: PASS`.

- [ ] **Step 5: Commit**

```bash
git add deploy/assessment/config/crs-1.0.js deploy/assessment-config.test.mjs
git commit -m "feat(assessment): CRS_1.0 scoring config with validity test"
```

---

### Task 2: Scoring engine

**Files:**
- Create: `deploy/assessment/scoring.js`
- Test: `deploy/assessment-scoring.test.mjs`

**Interfaces:**
- Consumes: the Task 1 config object.
- Produces (UMD export `ContinuumScoring` / `module.exports`), all pure, all taking `(answers, config)` unless noted. `answers` is `{ questionId: optionKey }`.
  - `dimensionScores(answers, config) -> { DIM: number|null }`
  - `overallScore(dimScores, config) -> number|null`  (0 to 100, integer)
  - `missingDataRate(answers, config) -> number`  (0 to 1)
  - `assessmentConfidence(answers, dimScores, config) -> "High"|"Moderate"|"Limited"`
  - `bandFor(score, config) -> string|null`
  - `strongestAndGap(dimScores) -> { strongest: DIM|null, gap: DIM|null }`
  - `observation(dimScores, config) -> string`
  - `lostWorkerDays(exposureAnswers, config) -> { days: number|null, provenance: string, scenarios: [{ pct:number, days:number }] }`

- [ ] **Step 1: Write the failing engine unit tests**

```js
// deploy/assessment-scoring.test.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const CRS = require('./assessment/config/crs-1.0.js');
const S = require('./assessment/scoring.js');
let failures = 0;
function eq(name, a, b) { if (JSON.stringify(a) !== JSON.stringify(b)) { failures++; console.error('FAIL', name, 'got', JSON.stringify(a), 'want', JSON.stringify(b)); } }
function ok(name, c) { if (!c) { failures++; console.error('FAIL', name); } }

// All STRUCTURED (100) across stage 1 => overall 100, band Advanced, confidence High.
const allStructured = {}; CRS.questions.filter(q => q.stage === 1)
  .forEach(q => { allStructured[q.id] = 'STRUCTURED'; });
eq('all structured overall', S.overallScore(S.dimensionScores(allStructured, CRS), CRS), 100);
eq('all structured band', S.bandFor(100, CRS), 'Advanced');
eq('all structured confidence', S.assessmentConfidence(allStructured, S.dimensionScores(allStructured, CRS), CRS), 'High');

// Not sure never becomes zero: one NOT_SURE dimension is excluded, not scored 0.
const oneUnsure = Object.assign({}, allStructured);
const firstS1 = CRS.questions.find(q => q.stage === 1).id;
oneUnsure[firstS1] = 'NOT_SURE';
const ds = S.dimensionScores(oneUnsure, CRS);
ok('unsure dimension is null not 0', ds[CRS.questions.find(q => q.id === firstS1).dimension] === null);
eq('overall stays 100 with one unsure', S.overallScore(ds, CRS), 100);
ok('missing data rate is 1 of 6', Math.abs(S.missingDataRate(oneUnsure, CRS) - (1/6)) < 1e-9);

// Weight renormalization: only two dimensions answered, weights renormalize over them.
// MEDICAL_ACCESS (15) at 100, MODIFIED_DUTY (25) at 0 => (15*100 + 25*0)/40 = 37.5 -> 38.
const twoOnly = {};
CRS.questions.filter(q => q.stage === 1).forEach(q => {
  if (q.dimension === 'MEDICAL_ACCESS') twoOnly[q.id] = 'STRUCTURED';
  else if (q.dimension === 'MODIFIED_DUTY') twoOnly[q.id] = 'ABSENT';
  else twoOnly[q.id] = 'NOT_SURE';
});
eq('renormalized overall', S.overallScore(S.dimensionScores(twoOnly, CRS), CRS), 38);

// Strongest and gap.
const sg = S.strongestAndGap(S.dimensionScores(twoOnly, CRS));
eq('strongest', sg.strongest, 'MEDICAL_ACCESS');
eq('gap', sg.gap, 'MODIFIED_DUTY');

// Lost worker days: 42 cases at 12 days = 504; 10 percent reduction approx 50.
const lwd = S.lostWorkerDays({ annual_lost_time_cases: 42, avg_lost_time_duration_days: 12 }, CRS);
eq('lost worker days', lwd.days, 504);
ok('10 percent scenario approx 50', lwd.scenarios.some(s => s.pct === 10 && s.days === 50));

// All NOT_SURE => overall null, confidence Limited (unknown never 0).
const allUnsure = {}; CRS.questions.filter(q => q.stage === 1).forEach(q => { allUnsure[q.id] = 'NOT_SURE'; });
eq('all unsure overall null', S.overallScore(S.dimensionScores(allUnsure, CRS), CRS), null);
eq('all unsure confidence', S.assessmentConfidence(allUnsure, S.dimensionScores(allUnsure, CRS), CRS), 'Limited');

if (failures) { console.error(failures + ' scoring checks failed'); process.exit(1); }
console.log('assessment-scoring: PASS');
```

- [ ] **Step 2: Run and watch it fail**

Run: `node deploy/assessment-scoring.test.mjs`
Expected: FAIL (cannot find `scoring.js`).

- [ ] **Step 3: Implement the engine**

```js
// deploy/assessment/scoring.js
// Deterministic Continuum Recovery Readiness scoring. Pure functions, no DOM,
// no network, no LLM. No em or en dashes.
(function (root) {
  function optionValue(config, questionId, optionKey) {
    var q = config.questions.find(function (x) { return x.id === questionId; });
    if (!q) return undefined;
    var o = q.options.find(function (x) { return x.key === optionKey; });
    return o ? o.value : undefined; // null for NOT_SURE
  }

  function dimensionScores(answers, config) {
    var buckets = {};
    Object.keys(config.dimensions).forEach(function (d) { buckets[d] = []; });
    config.questions.forEach(function (q) {
      if (!(q.id in answers)) return;
      var v = optionValue(config, q.id, answers[q.id]);
      if (v === null || v === undefined) return; // NOT_SURE excluded
      buckets[q.dimension].push(v);
    });
    var out = {};
    Object.keys(buckets).forEach(function (d) {
      out[d] = buckets[d].length
        ? Math.round(buckets[d].reduce(function (s, x) { return s + x; }, 0) / buckets[d].length)
        : null;
    });
    return out;
  }

  function overallScore(dimScores, config) {
    var num = 0, den = 0;
    Object.keys(dimScores).forEach(function (d) {
      if (dimScores[d] === null) return;
      var w = config.dimensions[d].weight;
      num += w * dimScores[d]; den += w;
    });
    return den ? Math.round(num / den) : null;
  }

  function maturityQuestionIds(config) {
    return config.questions.map(function (q) { return q.id; });
  }

  function missingDataRate(answers, config) {
    var ids = maturityQuestionIds(config).filter(function (id) { return id in answers; });
    if (!ids.length) return 0;
    var notSure = ids.filter(function (id) { return optionValue(config, id, answers[id]) === null; }).length;
    return notSure / ids.length;
  }

  function countScoredDimensions(dimScores) {
    return Object.keys(dimScores).filter(function (d) { return dimScores[d] !== null; }).length;
  }

  function countNotSure(answers, config) {
    return maturityQuestionIds(config).filter(function (id) {
      return (id in answers) && optionValue(config, id, answers[id]) === null;
    }).length;
  }

  function assessmentConfidence(answers, dimScores, config) {
    var notSure = countNotSure(answers, config);
    var scored = countScoredDimensions(dimScores);
    var rule = config.confidence.rules.find(function (r) {
      return notSure <= r.maxNotSure && scored >= r.minDimensionsScored;
    });
    return rule ? rule.level : 'Limited';
  }

  function bandFor(score, config) {
    if (score === null || score === undefined) return null;
    var b = config.bands.find(function (x) { return score >= x.min && score <= x.max; });
    return b ? b.label : null;
  }

  function strongestAndGap(dimScores) {
    var scored = Object.keys(dimScores).filter(function (d) { return dimScores[d] !== null; });
    if (!scored.length) return { strongest: null, gap: null };
    var strongest = scored.reduce(function (a, b) { return dimScores[b] > dimScores[a] ? b : a; });
    var gap = scored.reduce(function (a, b) { return dimScores[b] < dimScores[a] ? b : a; });
    return { strongest: strongest, gap: gap };
  }

  function matches(cond, dimScores) {
    var v = dimScores[cond.dimension];
    if (v === null || v === undefined) return false;
    if (cond.op === '>=') return v >= cond.value;
    if (cond.op === '<=') return v <= cond.value;
    if (cond.op === '>') return v > cond.value;
    if (cond.op === '<') return v < cond.value;
    if (cond.op === '==') return v === cond.value;
    return false;
  }

  function observation(dimScores, config) {
    var rule = config.observations.find(function (r) {
      return r.when.every(function (c) { return matches(c, dimScores); });
    });
    return rule ? rule.template : '';
  }

  function lostWorkerDays(exposureAnswers, config) {
    var cases = exposureAnswers.annual_lost_time_cases;
    var days = exposureAnswers.avg_lost_time_duration_days;
    if (typeof cases !== 'number' || typeof days !== 'number') {
      return { days: null, provenance: 'UNKNOWN', scenarios: [] };
    }
    var total = Math.round(cases * days);
    var scenarios = [5, 10, 20].map(function (pct) {
      return { pct: pct, days: Math.round(total * pct / 100) };
    });
    var prov = (exposureAnswers._provenance === 'MODELED_ESTIMATE') ? 'MODELED_ESTIMATE' : 'USER_PROVIDED';
    return { days: total, provenance: prov, scenarios: scenarios };
  }

  var api = { dimensionScores: dimensionScores, overallScore: overallScore,
    missingDataRate: missingDataRate, assessmentConfidence: assessmentConfidence,
    bandFor: bandFor, strongestAndGap: strongestAndGap, observation: observation,
    lostWorkerDays: lostWorkerDays };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ContinuumScoring = api;
})(typeof window !== "undefined" ? window : globalThis);
```

- [ ] **Step 4: Run to green**

Run: `node deploy/assessment-scoring.test.mjs`
Expected: `assessment-scoring: PASS`.

- [ ] **Step 5: Add the six QA profile assertions to the same test file**

Append profiles A to F (spec section 8) as answer sets and assert: A low maturity, B low maturity with high exposure and size not lowering maturity (compare B maturity equals a same-answers small employer), C high maturity, D mid band, E confidence Limited with no zero from NOT_SURE, F no benchmark field present in any result object. Use SYNTH prefixed identifiers. Run to green, then commit.

```bash
git add deploy/assessment/scoring.js deploy/assessment-scoring.test.mjs
git commit -m "feat(assessment): deterministic scoring engine with QA profiles"
```

---

### Task 3: Assessment page, controller, and styles

**Files:**
- Create: `deploy/assessment/index.html`
- Create: `deploy/assessment/assessment.js`
- Create: `deploy/assessment/assessment.css`
- Test: `deploy/assessment-smoke.test.mjs`

**Interfaces:**
- Consumes: `window.ContinuumCRS` (Task 1) and `window.ContinuumScoring` (Task 2), loaded as plain scripts before `assessment.js`.
- Produces: a DOM app that renders the intro, stage 1 questions, snapshot, stage 2 questions, and detailed result from config, computing results with the engine. The controller exposes `window.ContinuumAssessment` with a testable non DOM helper `buildResult(answers, exposure, stageReached)` that returns the result object persisted in Task 5.

- [ ] **Step 1: Write the smoke and structure test**

```js
// deploy/assessment-smoke.test.mjs
import { readFileSync } from 'fs';
const html = readFileSync(new URL('./assessment/index.html', import.meta.url), 'utf8');
const js  = readFileSync(new URL('./assessment/assessment.js', import.meta.url), 'utf8');
let failures = 0; function ok(n,c){ if(!c){ failures++; console.error('FAIL', n); } }

ok('loads config before controller',
  html.indexOf('config/crs-1.0.js') < html.indexOf('assessment.js') &&
  html.indexOf('config/crs-1.0.js') !== -1);
ok('loads scoring engine', html.includes('scoring.js'));
ok('has a mount root', /id=["']assessment-root["']/.test(html));
ok('controller renders from config not hardcoded questions',
  js.includes('ContinuumCRS') && js.includes('ContinuumScoring'));
ok('controller has try catch around persistence', js.includes('try') && js.includes('catch'));
ok('no benchmark words on the surface',
  !/benchmark/i.test(html));
ok('no em or en dashes', ![...(html + js)].some(function (c) { return c.charCodeAt(0) === 0x2013 || c.charCodeAt(0) === 0x2014; }));
if (failures) { console.error(failures + ' smoke checks failed'); process.exit(1); }
console.log('assessment-smoke: PASS');
```

- [ ] **Step 2: Run and watch it fail**

Run: `node deploy/assessment-smoke.test.mjs`
Expected: FAIL (files missing).

- [ ] **Step 3: Build `index.html`**

A single page with `<div id="assessment-root"></div>`, brand fonts and colors matching `deploy/index.html`, and, before `assessment.js`, two plain script tags: `config/crs-1.0.js` then `scoring.js`. No inline questions. Include `assessment.css`. No `benchmark` text anywhere.

- [ ] **Step 4: Build `assessment.js` (controller)**

Render stages from `ContinuumCRS`, hold answers in memory, compute with `ContinuumScoring`, and render the snapshot and detailed result per spec section 5. Wording strength follows confidence. Provide `window.ContinuumAssessment.buildResult(answers, exposure, stageReached)` returning:
`{ scoring_model_version: ContinuumCRS.version, stage_reached, industry, answers, dimension_scores, overall_score, band, assessment_confidence, missing_data_rate, exposure, provenance }`.
Persistence is added in Task 5; for now `buildResult` returns the object and the controller renders it. Three layer resilience: if `window.ContinuumCRS` is missing, fall back to an inline minimal config embedded in the controller so the page still renders.

- [ ] **Step 5: Build `assessment.css`** matching the site (navy #0E1B2C, gold #C8972F, Space Grotesk and Inter), 44px tap targets, reduced motion guard.

- [ ] **Step 6: Run the smoke test to green**

Run: `node deploy/assessment-smoke.test.mjs`
Expected: `assessment-smoke: PASS`.

- [ ] **Step 7: Manual browser verification (not automatable)**

Open `deploy/assessment/index.html` (via the local static server or Claude in Chrome). Confirm: the six questions render, the snapshot shows a score, band, strongest, opportunity, and observation; the optional six load; the detailed result shows the score, three opportunities, and the exposure and scenario lines where inputs allow; no benchmark appears. Record what was checked.

- [ ] **Step 8: Commit**

```bash
git add deploy/assessment/index.html deploy/assessment/assessment.js deploy/assessment/assessment.css deploy/assessment-smoke.test.mjs
git commit -m "feat(assessment): two stage page, controller, and styles"
```

---

### Task 4: Storage schema and RPC

**Files:**
- Create: `supabase/migrations/20260815160000_public_assessment.sql`
- Modify: `supabase/tests/exposure_proof.sql` (add anon isolation assertions)

**Interfaces:**
- Produces: table `public.public_assessment_response` and anon executable function `public.submit_public_assessment(p_payload jsonb) returns uuid`.

- [ ] **Step 1: Write the migration**

Use the exact DDL in spec section 6 (table, RLS enable, revoke all, the SECURITY DEFINER function with pinned `search_path`, revoke from public, grant execute to anon). Pick the timestamp `20260815160000` so it sorts after `20260815140000`. No em or en dashes.

- [ ] **Step 2: Add release gate assertions to `exposure_proof.sql`**

Before `reset role;`, add a block asserting anon cannot read or write the base table directly and that the RPC exists and is anon executable:

```sql
-- Public assessment: anon writes only through the SECURITY DEFINER RPC.
set role anon;
do $$
begin
  begin
    perform 1 from public.public_assessment_response limit 1;
    raise exception 'LEAK public_assessment: anon can select base table';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
do $$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname='public' and p.proname='submit_public_assessment') then
    raise exception 'MISSING public.submit_public_assessment';
  end if;
end $$;
```

- [ ] **Step 3: Verify via CI (no local DB)**

Push the branch and confirm the `exposure-proof` GitHub check is green (it applies every migration and runs `exposure_proof.sql` against a seeded throwaway Postgres). If red, read the failing job log and fix the migration. Do not apply to the live project in this task.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260815160000_public_assessment.sql supabase/tests/exposure_proof.sql
git commit -m "feat(assessment): append only storage table and anon submit RPC"
```

---

### Task 5: Client persistence (best effort)

**Files:**
- Modify: `deploy/assessment/assessment.js`
- Test: `deploy/assessment-persist.test.mjs`

**Interfaces:**
- Consumes: `buildResult(...)` from Task 3 and the anon Supabase client.
- Produces: `window.ContinuumAssessment.persist(result, client)` returning a Promise that resolves `{ ok:boolean }` and never throws.

- [ ] **Step 1: Confirm the Supabase client situation**

Search the marketing pages for an existing anon Supabase client (`grep -rin "createClient\|supabase" deploy/index.html deploy/*.js`). If present, reuse it. If absent, vendor `@supabase/supabase-js` UMD build into `deploy/assessment/vendor/` (no npm dependency, no CDN) and load it before `assessment.js`. Record which path was taken.

- [ ] **Step 2: Write the failing persistence test (sandbox, no network)**

```js
// deploy/assessment-persist.test.mjs
import { readFileSync } from 'fs';
const js = readFileSync(new URL('./assessment/assessment.js', import.meta.url), 'utf8');
// Sandbox load the controller with a fake window and a fake Supabase client.
const sandbox = { window: {}, document: { getElementById: () => null, addEventListener(){} }, console };
sandbox.globalThis = sandbox; sandbox.window.ContinuumCRS = { version:'CRS_1.0', dimensions:{}, questions:[], bands:[], confidence:{rules:[]}, observations:[] };
sandbox.window.ContinuumScoring = {};
new Function('window','document','globalThis', js)(sandbox.window, sandbox.document, sandbox);
let failures = 0; function ok(n,c){ if(!c){ failures++; console.error('FAIL', n); } }

const A = sandbox.window.ContinuumAssessment;
ok('persist exists', A && typeof A.persist === 'function');
// A failing client must resolve ok:false, never throw.
const badClient = { rpc: () => Promise.reject(new Error('down')) };
const p = A.persist({ scoring_model_version:'CRS_1.0' }, badClient)
  .then(r => ok('persist resolves ok:false on failure', r && r.ok === false))
  .catch(() => { failures++; console.error('FAIL persist threw'); });
// A working client must call rpc submit_public_assessment.
let called = null;
const goodClient = { rpc: (name, args) => { called = { name, args }; return Promise.resolve({ data:'id', error:null }); } };
const q = A.persist({ scoring_model_version:'CRS_1.0' }, goodClient)
  .then(r => { ok('persist ok:true on success', r && r.ok === true);
               ok('calls submit_public_assessment', called && called.name === 'submit_public_assessment'); });
await Promise.all([p, q]);
if (failures) { console.error(failures + ' persist checks failed'); process.exit(1); }
console.log('assessment-persist: PASS');
```

- [ ] **Step 3: Run and watch it fail**

Run: `node deploy/assessment-persist.test.mjs`
Expected: FAIL (`persist` undefined).

- [ ] **Step 4: Implement `persist`**

```js
// inside assessment.js, on window.ContinuumAssessment
persist: function (result, client) {
  try {
    return client.rpc('submit_public_assessment', { p_payload: result })
      .then(function (res) { return { ok: !res || !res.error }; })
      .catch(function () { return { ok: false }; });
  } catch (e) {
    return Promise.resolve({ ok: false });
  }
}
```

Wire the controller to call `persist(buildResult(...), client)` after rendering each result, ignoring the outcome for the user path (best effort). Never block or change the shown result on failure.

- [ ] **Step 5: Run to green, then commit**

Run: `node deploy/assessment-persist.test.mjs`
Expected: `assessment-persist: PASS`.

```bash
git add deploy/assessment/assessment.js deploy/assessment-persist.test.mjs
git commit -m "feat(assessment): best effort anonymous persistence via RPC"
```

---

### Task 6: Guardrails, full suite, and PR

**Files:**
- Create: `deploy/assessment-guardrails.test.mjs`
- Test: the whole `deploy/*.test.mjs` suite

**Interfaces:**
- Consumes: all prior files.

- [ ] **Step 1: Write the config not in presentation and version guardrail test**

```js
// deploy/assessment-guardrails.test.mjs
import { readFileSync } from 'fs';
const js  = readFileSync(new URL('./assessment/assessment.js', import.meta.url), 'utf8');
const eng = readFileSync(new URL('./assessment/scoring.js', import.meta.url), 'utf8');
let failures = 0; function ok(n,c){ if(!c){ failures++; console.error('FAIL', n); } }
// No dimension weights or band thresholds hardcoded in presentation or engine.
ok('no weight literals in controller', !/\b(15|20|25)\s*[,)]/.test(js.replace(/#0E1B2C|#C8972F/g,'')));
ok('engine reads weights from config', eng.includes('config.dimensions') && eng.includes('.weight'));
ok('version referenced from config', js.includes('ContinuumCRS.version'));
if (failures) { console.error(failures + ' guardrail checks failed'); process.exit(1); }
console.log('assessment-guardrails: PASS');
```

Note: the weight literal regex is a heuristic; if it produces a false positive on legitimate non weight numbers, tighten it to assert the specific dimension weights do not appear as bare literals in `assessment.js`. The real guarantee is `engine reads weights from config`.

- [ ] **Step 2: Run the entire suite**

Run: `for f in deploy/*.test.mjs; do echo "== $f =="; node "$f" || exit 1; done`
Expected: every suite prints PASS and the loop exits 0.

- [ ] **Step 3: Commit**

```bash
git add deploy/assessment-guardrails.test.mjs
git commit -m "test(assessment): config not in presentation and version guardrails"
```

- [ ] **Step 4: Push and open a PR (do not merge)**

```bash
git push -u origin feat/public-assessment-step1
gh pr create --base main --head feat/public-assessment-step1 \
  --title "Public Injury Recovery Assessment, Step 1 shell" \
  --body "Implements specs/CONTINUUM_ASSESSMENT_STEP1_DESIGN.md. Two stage assessment, config driven deterministic scoring, anonymous own result only storage. No benchmarking (phase 3, gated), no lead capture. CI exposure-proof and suites must be green before merge. Live DB apply is a separate step."
```

- [ ] **Step 5: Confirm CI green and report**

Watch `gh pr checks`. `exposure-proof` (applies the new migration) and `suites` (runs every new `*.test.mjs`) must pass. Report the result. Merge and live apply are Gary's calls, per the earlier established flow.

---

## Self-Review

Spec coverage: dimensions and weights (Task 1), normalization scale (Task 1), Not sure handling (Task 2), overall calculation with renormalization (Task 2), confidence (Task 2), bands (Tasks 1 and 2), strongest and gap and observation (Task 2), lost worker days and scenarios (Task 2), two stage UI and result screens (Task 3), no benchmark shown (Tasks 3 and 6 assertions), anonymous storage and RPC (Task 4), best effort persistence (Task 5), versioning and config not in presentation (Tasks 1, 4, 6), six QA profiles (Task 2), append only migration and dash law (Tasks 4 and throughout). Phase 3 benchmarking and lead capture are intentionally out of scope.

Placeholder scan: the only deferred content is the verbatim transcription of the twelve questions and four exposure inputs from spec section 3, which is explicitly a transcription step with the exact shape and a full worked example given; the spec travels with the plan. No TBDs in logic or tests.

Type consistency: `answers` is `{questionId: optionKey}` everywhere; `dimensionScores` returns `{DIM: number|null}` consumed by `overallScore`, `strongestAndGap`, `observation`; `buildResult` field names match the migration columns and the RPC payload keys in Task 4 and Task 5.
