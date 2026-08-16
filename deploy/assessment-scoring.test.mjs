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
ok('missing data rate is 1 of 6', Math.abs(S.missingDataRate(oneUnsure, CRS) - (1 / 6)) < 1e-9);

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

// ---------------------------------------------------------------------------
// QA profiles A to F (spec section 8). SYNTH prefixed identifiers.
// ---------------------------------------------------------------------------

// Profile A: SYNTH_PROFILE_A, small, low volume, weak processes -> low maturity, low exposure.
const SYNTH_PROFILE_A_ANSWERS = {
  S1Q1: 'MANUAL',   // MEDICAL_ACCESS 15 -> 25
  S1Q2: 'ABSENT',   // RESTRICTIONS_WORKFLOW 20 -> 0
  S1Q3: 'ABSENT',   // MODIFIED_DUTY 25 -> 0
  S1Q4: 'MANUAL',   // RECOVERY_VISIBILITY 20 -> 25
  S1Q5: 'ABSENT',   // CLAIMS_COORDINATION 10 -> 0
  S1Q6: 'MANUAL'    // WORKFLOW_INTEGRATION 10 -> 25
};
const SYNTH_PROFILE_A_EXPOSURE = { annual_lost_time_cases: 5, avg_lost_time_duration_days: 5 };
const dsA = S.dimensionScores(SYNTH_PROFILE_A_ANSWERS, CRS);
const overallA = S.overallScore(dsA, CRS);
// (15*25 + 20*0 + 25*0 + 20*25 + 10*0 + 10*25) / 100 = 1125/100 = 11.25 -> 11.
eq('profile A overall (low maturity)', overallA, 11);
eq('profile A band is Reactive', S.bandFor(overallA, CRS), 'Reactive');
const lwdA = S.lostWorkerDays(SYNTH_PROFILE_A_EXPOSURE, CRS);
eq('profile A low exposure lost days', lwdA.days, 25);

// Profile B: SYNTH_PROFILE_B, large, high volume, weak processes -> low maturity,
// high exposure, and size must NOT lower maturity: same maturity answers as A,
// plus large-employer exposure fields folded into the answers object (the engine
// only reads config.questions ids, so exposure keys are inert to dimensionScores).
const SYNTH_PROFILE_B_ANSWERS = Object.assign({}, SYNTH_PROFILE_A_ANSWERS, {
  S2Q1: 'B5', // workforce_size 10000 plus (not a maturity question, must be ignored)
  S2Q2: 'B5', // annual_lost_time_cases 1000 plus
  S2Q3: 'B4', // avg_lost_time_duration_days 1 to 3 months
  S2Q4: 'B4'  // site_count 21 plus
});
const SYNTH_PROFILE_B_EXPOSURE = { annual_lost_time_cases: 1000, avg_lost_time_duration_days: 60 };
const dsB = S.dimensionScores(SYNTH_PROFILE_B_ANSWERS, CRS);
const overallB = S.overallScore(dsB, CRS);
eq('profile B overall (low maturity, same as small employer A)', overallB, overallA);
eq('profile B maturity equals small-employer profile A maturity', overallB, 11);
const lwdB = S.lostWorkerDays(SYNTH_PROFILE_B_EXPOSURE, CRS);
ok('profile B exposure (lost days) is far higher than profile A', lwdB.days > lwdA.days);

// Profile C: SYNTH_PROFILE_C, large, mature processes -> high maturity, high
// exposure, scores stay separate (exposure never feeds the maturity engine).
const SYNTH_PROFILE_C_ANSWERS = {
  S1Q1: 'STRUCTURED', S1Q2: 'STRUCTURED', S1Q3: 'STRUCTURED',
  S1Q4: 'STRUCTURED', S1Q5: 'STRUCTURED', S1Q6: 'STRUCTURED',
  S2Q5: 'STRUCTURED', S2Q6: 'STRUCTURED'
};
const SYNTH_PROFILE_C_EXPOSURE = { annual_lost_time_cases: 600, avg_lost_time_duration_days: 25 };
const dsC = S.dimensionScores(SYNTH_PROFILE_C_ANSWERS, CRS);
const overallC = S.overallScore(dsC, CRS);
eq('profile C overall (high maturity)', overallC, 100);
eq('profile C band is Advanced', S.bandFor(overallC, CRS), 'Advanced');
const lwdC = S.lostWorkerDays(SYNTH_PROFILE_C_EXPOSURE, CRS);
eq('profile C high exposure lost days', lwdC.days, 15000);
ok('profile C maturity stays 100 regardless of high exposure', S.overallScore(dsC, CRS) === 100);

// Profile D: SYNTH_PROFILE_D, medium, mixed maturity -> mid band, correct
// strongest and gap.
const SYNTH_PROFILE_D_ANSWERS = {
  S1Q1: 'ESTABLISHED', // MEDICAL_ACCESS 15 -> 75
  S1Q2: 'PARTIAL',     // RESTRICTIONS_WORKFLOW 20 -> 50
  S1Q3: 'STRUCTURED',  // MODIFIED_DUTY 25 -> 100 (strongest, heaviest weight)
  S1Q4: 'MANUAL',      // RECOVERY_VISIBILITY 20 -> 25 (gap)
  S1Q5: 'PARTIAL',     // CLAIMS_COORDINATION 10 -> 50
  S1Q6: 'ESTABLISHED'  // WORKFLOW_INTEGRATION 10 -> 75
};
const dsD = S.dimensionScores(SYNTH_PROFILE_D_ANSWERS, CRS);
const overallD = S.overallScore(dsD, CRS);
// (15*75+20*50+25*100+20*25+10*50+10*75)/100 = 6375/100 = 63.75 -> 64.
eq('profile D overall (mid band)', overallD, 64);
eq('profile D band is Established', S.bandFor(overallD, CRS), 'Established');
const sgD = S.strongestAndGap(dsD);
eq('profile D strongest is MODIFIED_DUTY', sgD.strongest, 'MODIFIED_DUTY');
eq('profile D gap is RECOVERY_VISIBILITY', sgD.gap, 'RECOVERY_VISIBILITY');

// Profile E: SYNTH_PROFILE_E, several NOT_SURE -> confidence Limited, and no
// dimension scored 0 from a NOT_SURE (unknown stays null).
const SYNTH_PROFILE_E_ANSWERS = {
  S1Q1: 'NOT_SURE',   // MEDICAL_ACCESS
  S1Q2: 'NOT_SURE',   // RESTRICTIONS_WORKFLOW
  S1Q3: 'PARTIAL',    // MODIFIED_DUTY 25 -> 50
  S1Q4: 'NOT_SURE',   // RECOVERY_VISIBILITY
  S1Q5: 'NOT_SURE',   // CLAIMS_COORDINATION
  S1Q6: 'MANUAL'      // WORKFLOW_INTEGRATION 10 -> 25
};
const dsE = S.dimensionScores(SYNTH_PROFILE_E_ANSWERS, CRS);
['MEDICAL_ACCESS', 'RESTRICTIONS_WORKFLOW', 'RECOVERY_VISIBILITY', 'CLAIMS_COORDINATION'].forEach(function (d) {
  ok('profile E NOT_SURE dimension ' + d + ' is null not 0', dsE[d] === null);
});
const confidenceE = S.assessmentConfidence(SYNTH_PROFILE_E_ANSWERS, dsE, CRS);
eq('profile E confidence is Limited', confidenceE, 'Limited');
const overallE = S.overallScore(dsE, CRS);
// (25*50 + 10*25) / 35 = 1500/35 = 42.857... -> 43, computed only from answered dims.
eq('profile E overall computed from available evidence only', overallE, 43);

// Profile F: SYNTH_PROFILE_F, insufficient cohort -> no benchmark field present
// in any result object (phase 3 benchmarking is gated OFF; the engine must not
// manufacture or expose a comparison).
const SYNTH_PROFILE_F_ANSWERS = SYNTH_PROFILE_D_ANSWERS;
const dsF = S.dimensionScores(SYNTH_PROFILE_F_ANSWERS, CRS);
const overallF = S.overallScore(dsF, CRS);
const resultObjects = [
  dsF,
  S.strongestAndGap(dsF),
  S.lostWorkerDays({ annual_lost_time_cases: 30, avg_lost_time_duration_days: 11 }, CRS)
];
resultObjects.forEach(function (obj, i) {
  ok('profile F result object ' + i + ' has no benchmark key', !Object.prototype.hasOwnProperty.call(obj, 'benchmark'));
});
ok('profile F: no benchmark substring in any serialized result',
  !resultObjects.some(function (obj) { return JSON.stringify(obj).toLowerCase().indexOf('benchmark') !== -1; }));
ok('profile F overall is a plain number, not a comparison object', typeof overallF === 'number');

// No em or en dashes anywhere in this test file's own literal strings (self check via
// the shared fixture object, char-code detection only, never a glyph regex).
const allProfileText = JSON.stringify([
  SYNTH_PROFILE_A_ANSWERS, SYNTH_PROFILE_B_ANSWERS, SYNTH_PROFILE_C_ANSWERS,
  SYNTH_PROFILE_D_ANSWERS, SYNTH_PROFILE_E_ANSWERS, SYNTH_PROFILE_F_ANSWERS
]);
ok('no em or en dashes in profile fixtures',
  ![...allProfileText].some(function (c) { return c.charCodeAt(0) === 0x2013 || c.charCodeAt(0) === 0x2014; }));

if (failures) { console.error(failures + ' scoring checks failed'); process.exit(1); }
console.log('assessment-scoring: PASS');
