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

// confidence tier examples: High needs at most one not sure, at least five
// dimensions scored, and at least one exact exposure value; Moderate relaxes
// the not sure count and drops the exact requirement; Limited otherwise.
const allHigh = { MEDICAL_ACCESS:100, RESTRICTIONS_WORKFLOW:100, MODIFIED_DUTY:100, RECOVERY_VISIBILITY:100, CLAIMS_COORDINATION:100, WORKFLOW_INTEGRATION:100 };
eq('confidence High with an exact exposure value', S.assessmentConfidence({}, allHigh, rex2, CRS), 'High');
const noExact = S.resolveExposure({}, CRS);
eq('confidence drops to Moderate with no exact exposure value', S.assessmentConfidence({}, allHigh, noExact, CRS), 'Moderate');
eq('confidence without exposure resolved still returns a tier', S.assessmentConfidence({}, allHigh, undefined, CRS), 'Moderate');

// lostWorkerDays back compat: CRS_1.0 style raw numeric fields still resolve
// (a raw number is treated as USER_PROVIDED, old behavior).
const lwdRaw = S.lostWorkerDays({ annual_lost_time_cases: 42, avg_lost_time_duration_days: 12 }, CRS);
eq('lwd back compat days', lwdRaw.days, 504);
eq('lwd back compat provenance', lwdRaw.provenance, 'USER_PROVIDED');

// Regression: the shipped controller (assessment.js, exposureNumericInputs)
// calls lostWorkerDays with raw numbers plus a whole-object _provenance flag
// of 'MODELED_ESTIMATE' for band derived exposure. That flag must still be
// honored so the "(estimated)" label in the rendered result survives.
const lwdLegacyEstimate = S.lostWorkerDays({ annual_lost_time_cases: 5, avg_lost_time_duration_days: 5, _provenance: 'MODELED_ESTIMATE' }, CRS);
eq('lwd legacy _provenance days', lwdLegacyEstimate.days, 25);
eq('lwd legacy _provenance honored as MODELED_ESTIMATE', lwdLegacyEstimate.provenance, 'MODELED_ESTIMATE');

function firstBandKey(cfg, kind){ const e = cfg.exposure.find(x=>x.kind===kind); return e.bands[0].key; }

// ---------------------------------------------------------------------------
// QA profiles A to F (spec section 8), re-run under CRS_1.1. Maturity scores
// are unchanged from CRS_1.0 since weights and scale are identical, confirming
// backward compatibility of the scoring engine on the new config.
// ---------------------------------------------------------------------------

const SYNTH_PROFILE_A_ANSWERS = {
  S1Q1: 'MANUAL', S1Q2: 'ABSENT', S1Q3: 'ABSENT',
  S1Q4: 'MANUAL', S1Q5: 'ABSENT', S1Q6: 'MANUAL'
};
const dsA = S.dimensionScores(SYNTH_PROFILE_A_ANSWERS, CRS);
const overallA = S.overallScore(dsA, CRS);
eq('CRS_1.1 profile A overall unchanged from CRS_1.0', overallA, 11);
eq('CRS_1.1 profile A band unchanged', S.bandFor(overallA, CRS), 'Reactive');

const SYNTH_PROFILE_B_ANSWERS = Object.assign({}, SYNTH_PROFILE_A_ANSWERS, {
  S2Q1: 'B5', S2Q2: 'B5', S2Q3: 'B4', S2Q4: 'B4'
});
const dsB = S.dimensionScores(SYNTH_PROFILE_B_ANSWERS, CRS);
const overallB = S.overallScore(dsB, CRS);
eq('CRS_1.1 profile B maturity equals small employer profile A (size does not move maturity)', overallB, overallA);

const SYNTH_PROFILE_C_ANSWERS = {
  S1Q1: 'STRUCTURED', S1Q2: 'STRUCTURED', S1Q3: 'STRUCTURED',
  S1Q4: 'STRUCTURED', S1Q5: 'STRUCTURED', S1Q6: 'STRUCTURED',
  S2Q5: 'STRUCTURED', S2Q6: 'STRUCTURED'
};
const dsC = S.dimensionScores(SYNTH_PROFILE_C_ANSWERS, CRS);
const overallC = S.overallScore(dsC, CRS);
eq('CRS_1.1 profile C overall unchanged from CRS_1.0', overallC, 100);
eq('CRS_1.1 profile C band unchanged', S.bandFor(overallC, CRS), 'Advanced');

const SYNTH_PROFILE_D_ANSWERS = {
  S1Q1: 'ESTABLISHED', S1Q2: 'PARTIAL', S1Q3: 'STRUCTURED',
  S1Q4: 'MANUAL', S1Q5: 'PARTIAL', S1Q6: 'ESTABLISHED'
};
const dsD = S.dimensionScores(SYNTH_PROFILE_D_ANSWERS, CRS);
const overallD = S.overallScore(dsD, CRS);
eq('CRS_1.1 profile D overall unchanged from CRS_1.0', overallD, 64);
eq('CRS_1.1 profile D band unchanged', S.bandFor(overallD, CRS), 'Established');
const sgD = S.strongestAndGap(dsD);
eq('CRS_1.1 profile D strongest unchanged', sgD.strongest, 'MODIFIED_DUTY');
eq('CRS_1.1 profile D gap unchanged', sgD.gap, 'RECOVERY_VISIBILITY');

const SYNTH_PROFILE_E_ANSWERS = {
  S1Q1: 'NOT_SURE', S1Q2: 'NOT_SURE', S1Q3: 'PARTIAL',
  S1Q4: 'NOT_SURE', S1Q5: 'NOT_SURE', S1Q6: 'MANUAL'
};
const dsE = S.dimensionScores(SYNTH_PROFILE_E_ANSWERS, CRS);
const overallE = S.overallScore(dsE, CRS);
eq('CRS_1.1 profile E overall unchanged from CRS_1.0', overallE, 43);
eq('CRS_1.1 profile E confidence Limited (extended signature, no exposure resolved)',
  S.assessmentConfidence(SYNTH_PROFILE_E_ANSWERS, dsE, undefined, CRS), 'Limited');

// Profile F reuses profile D's answers (insufficient cohort for benchmarking):
// no result object exposes a benchmark field, phase 3 benchmarking stays off.
const dsF = S.dimensionScores(SYNTH_PROFILE_D_ANSWERS, CRS);
const resultObjectsF = [ dsF, S.strongestAndGap(dsF), S.priorityOpportunities(dsF, CRS) ];
resultObjectsF.forEach(function (obj, i) {
  ok('CRS_1.1 profile F result object ' + i + ' has no benchmark key', !Object.prototype.hasOwnProperty.call(obj, 'benchmark'));
});
ok('CRS_1.1 profile F: no benchmark substring in any serialized result',
  !resultObjectsF.some(function (obj) { return JSON.stringify(obj).toLowerCase().indexOf('benchmark') !== -1; }));

// No em or en dashes anywhere in this test file's own literal strings (self
// check via the shared fixture object, char-code detection only).
const allProfileText = JSON.stringify([
  SYNTH_PROFILE_A_ANSWERS, SYNTH_PROFILE_B_ANSWERS, SYNTH_PROFILE_C_ANSWERS,
  SYNTH_PROFILE_D_ANSWERS, SYNTH_PROFILE_E_ANSWERS
]);
ok('no em or en dashes in profile fixtures',
  ![...allProfileText].some(function (c) { return c.charCodeAt(0) === 0x2013 || c.charCodeAt(0) === 0x2014; }));

if (failures) { console.error(failures + ' checks failed'); process.exit(1); }
console.log('assessment-scoring-11: PASS');
