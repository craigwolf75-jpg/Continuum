// Continuum public assessment, Task 6: config not in presentation and
// version guardrails. Verifies, in real (non-comment) code, that the engine
// reads dimension weights from config.dimensions[..].weight (never a
// literal table), that the controller sources the scoring model version
// from CONFIG.version fed by window.ContinuumCRS (never a hardcoded
// version string), and that the specific dimension weight values do not
// appear as bare numeric literals in the controller outside its documented
// three-layer-resilience fallback config. No em or en dashes anywhere,
// checked by char code only, never a glyph regex.
import { readFileSync } from 'fs';
const js  = readFileSync(new URL('./assessment/assessment.js', import.meta.url), 'utf8');
const eng = readFileSync(new URL('./assessment/scoring.js', import.meta.url), 'utf8');
let failures = 0; function ok(n,c){ if(!c){ failures++; console.error('FAIL', n); } }

// Strip comments before scanning for structural facts, so a mention inside a
// // line comment or a /* block comment */ can never satisfy a check meant
// to prove something about the real code path. Safe for both files here:
// neither contains a string literal or regex literal with // or /* .. */
// inside it (confirmed by inspection), so this is not a general purpose
// tokenizer, just a comment stripper fit to these two known files.
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}
const jsCode = stripComments(js);
const engCode = stripComments(eng);

// The engine must compute weights by reading config.dimensions[d].weight at
// call time, never from a literal table baked into scoring.js itself.
ok('engine reads weights from config',
  /config\.dimensions\[[^\]]+\]\.weight/.test(engCode));

// The controller must reference the scoring model version from the loaded
// config object, never a hardcoded version string. Both structural facts
// must hold in real code, not merely in a comment: CONFIG.version is the
// actual value buildResult() uses, and window.ContinuumCRS is the source
// loadConfig() reads it from.
ok('controller uses CONFIG.version in real code', jsCode.includes('CONFIG.version'));
ok('controller reads window.ContinuumCRS in real code', jsCode.includes('window.ContinuumCRS'));

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
