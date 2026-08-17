// Continuum public assessment, Task 3: page structure smoke test. Checks
// load order, the mount root, config-driven rendering, resilience markers,
// and the no-benchmark and no-dash rules. No em or en dashes anywhere.
import { readFileSync } from 'fs';
const html = readFileSync(new URL('./assessment/index.html', import.meta.url), 'utf8');
const js  = readFileSync(new URL('./assessment/assessment.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('./assessment/assessment.css', import.meta.url), 'utf8');
let failures = 0; function ok(n,c){ if(!c){ failures++; console.error('FAIL', n); } }

ok('loads config before controller',
  html.indexOf('config/crs-1.1.js') < html.indexOf('assessment.js') &&
  html.indexOf('config/crs-1.1.js') !== -1);
ok('loads scoring engine', html.includes('scoring.js'));
ok('has a mount root', /id=["']assessment-root["']/.test(html));
ok('controller renders from config not hardcoded questions',
  js.includes('ContinuumCRS') && js.includes('ContinuumScoring'));
ok('controller has try catch around persistence', js.includes('try') && js.includes('catch'));
ok('no benchmark words on the surface',
  !/benchmark/i.test(html));
ok('no em or en dashes', ![...(html + js + css)].some(function (c) { return c.charCodeAt(0) === 0x2013 || c.charCodeAt(0) === 0x2014; }));
if (failures) { console.error(failures + ' smoke checks failed'); process.exit(1); }
console.log('assessment-smoke: PASS');
