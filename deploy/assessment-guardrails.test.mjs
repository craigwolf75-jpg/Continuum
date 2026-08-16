// Continuum public assessment, Task 6: config not in presentation and
// version guardrails. Verifies the engine reads dimension weights from
// config (never hardcoding them), that the controller references the
// scoring model version from config rather than a literal, and that the
// specific dimension weight values do not appear as bare numeric literals
// in the controller outside its documented three-layer-resilience fallback
// config. No em or en dashes anywhere, checked by char code only, never a
// glyph regex.
import { readFileSync } from 'fs';
const js  = readFileSync(new URL('./assessment/assessment.js', import.meta.url), 'utf8');
const eng = readFileSync(new URL('./assessment/scoring.js', import.meta.url), 'utf8');
let failures = 0; function ok(n,c){ if(!c){ failures++; console.error('FAIL', n); } }

// The engine must compute weights from config, never from a literal table
// baked into scoring.js itself.
ok('engine reads weights from config', eng.includes('config.dimensions') && eng.includes('.weight'));

// The controller must reference the scoring model version from the loaded
// config object, never a hardcoded version string.
ok('version referenced from config', js.includes('ContinuumCRS.version'));

// No dimension weights or band thresholds hardcoded in the controller's own
// logic. Task 3's three-layer resilience carries a documented FALLBACK_CONFIG
// block inside assessment.js that legitimately repeats the real config's
// weight values (15, 20, 25, 10) for when window.ContinuumCRS fails to load;
// that block is not presentation logic, it is the resilience layer itself,
// so it is excluded from this scan rather than producing a flaky guardrail.
const fallbackStart = js.indexOf('var FALLBACK_CONFIG');
const fallbackEnd = js.indexOf('function loadConfig');
ok('fallback config block is present and precedes loadConfig',
  fallbackStart !== -1 && fallbackEnd !== -1 && fallbackStart < fallbackEnd);
const jsOutsideFallback = fallbackStart !== -1 && fallbackEnd !== -1
  ? js.slice(0, fallbackStart) + js.slice(fallbackEnd)
  : js;
[15, 20, 25, 10].forEach(function (w) {
  var re = new RegExp('weight\\s*:\\s*' + w + '\\b');
  ok('dimension weight ' + w + ' does not appear as a bare literal outside the fallback block',
    !re.test(jsOutsideFallback));
});

// No em or en dashes anywhere in either file, detected by char code only.
ok('no em or en dashes',
  ![...(js + eng)].some(function (c) { return c.charCodeAt(0) === 0x2013 || c.charCodeAt(0) === 0x2014; }));

if (failures) { console.error(failures + ' guardrail checks failed'); process.exit(1); }
console.log('assessment-guardrails: PASS');
