// Continuum public assessment, Task 3: CRS_1.1 page structure smoke test.
// Checks the active config load order (crs-1.1.js, not crs-1.0.js), that the
// controller uses the new CRS_1.1 engine functions, that the scoring model
// version is sourced from the loaded config, and the no-benchmark and
// no-dash rules. No em or en dashes anywhere.
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
ok('optional cost figures note present when dollars are shown',
  js.includes('The other cost figures you entered were recorded but are not yet part of this dollar estimate.'));
ok('no benchmark on the surface', !/benchmark/i.test(html));
ok('no em or en dashes',
  ![...(html + js + css)].some(c => c.charCodeAt(0) === 0x2013 || c.charCodeAt(0) === 0x2014));
if (failures) { console.error(failures + ' checks failed'); process.exit(1); }
console.log('assessment-smoke-11: PASS');
