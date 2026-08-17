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
