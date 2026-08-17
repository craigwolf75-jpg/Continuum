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
ok('rungs is a non-empty array with numeric rung and non-empty fields',
  Array.isArray(CRB.rungs) && CRB.rungs.length > 0 &&
  CRB.rungs.every(r => typeof r.rung === 'number' && Array.isArray(r.fields) && r.fields.length > 0));
ok('rung 1 is the most specific (most required fields, listed first)',
  CRB.rungs[0].rung === 1 &&
  CRB.rungs.every(r => r.fields.length <= CRB.rungs[0].fields.length));
ok('no em or en dashes',
  ![...JSON.stringify(CRB)].some(c => c.charCodeAt(0) === 0x2013 || c.charCodeAt(0) === 0x2014));
if (failures) { console.error(failures + ' checks failed'); process.exit(1); }
console.log('assessment-benchmark-config: PASS');
