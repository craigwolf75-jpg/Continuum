// Continuum public assessment Step 2B, Task 2: dark benchmark engine tests.
// Pure functions, SYNTH fixtures only. No em or en dashes anywhere.
import { readFileSync } from 'fs';
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

// Guardrails (Step 5).
const engineSrc = readFileSync(new URL('./assessment/benchmark.js', import.meta.url), 'utf8');
const configSrc = readFileSync(new URL('./assessment/config/crb-2026-01.js', import.meta.url), 'utf8');
const indexSrc = readFileSync(new URL('./assessment/index.html', import.meta.url), 'utf8');

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}
const engineCode = stripComments(engineSrc);

// The confidence decision must read the adequacy floor from config, never a
// bare numeric literal compared against observations.
ok('confidenceFor reads adequacy floor from config',
  /config\.adequacyFloor/.test(engineCode));
ok('no hardcoded numeric threshold compared against observations',
  !/observations\s*[<>=!]+\s*\d/.test(engineCode));

// No em or en dashes anywhere in the engine or the config, char code only.
ok('no em or en dashes in benchmark.js',
  ![...engineSrc].some(c => c.charCodeAt(0) === 0x2013 || c.charCodeAt(0) === 0x2014));
ok('no em or en dashes in crb-2026-01.js',
  ![...configSrc].some(c => c.charCodeAt(0) === 0x2013 || c.charCodeAt(0) === 0x2014));

// The engine ships dark: index.html must not load it.
ok('index.html does not load benchmark.js', !indexSrc.includes('benchmark.js'));

if (failures) { console.error(failures + ' checks failed'); process.exit(1); }
console.log('assessment-benchmark: PASS');
