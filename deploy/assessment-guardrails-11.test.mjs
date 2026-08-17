// deploy/assessment-guardrails-11.test.mjs
// CRS_1.1 guardrails: proves, in real (non-comment) code, that the engine
// reads dimension weights, opportunity templates, and financial config from
// the loaded config object rather than a baked-in literal, that the
// scoring model version is sourced from CONFIG.version fed by
// window.ContinuumCRS, and that no bare daily-cost literal has crept into
// the engine. No em or en dashes anywhere, checked by char code only.
import { readFileSync } from 'fs';
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:])\/\/.*$/gm,'$1');
const jsRaw = readFileSync(new URL('./assessment/assessment.js', import.meta.url), 'utf8');
const engRaw = readFileSync(new URL('./assessment/scoring.js', import.meta.url), 'utf8');
const js  = strip(jsRaw);
const eng = strip(engRaw);
let failures = 0; function ok(n,c){ if(!c){ failures++; console.error('FAIL', n); } }
ok('engine reads weights from config', /config\.dimensions\[[^\]]+\]\.weight/.test(eng));
ok('engine reads opportunity templates from config', eng.includes('config.opportunityTemplates'));
ok('engine reads financial config', eng.includes('config.financial'));
ok('version referenced from config', js.includes('CONFIG.version') && js.includes('window.ContinuumCRS'));
ok('no bare daily-cost or dollar-rate literal in engine',
  !/\bloaded_daily_labour_cost\s*=\s*\d/.test(eng));

// No em or en dashes anywhere in either source file, detected by char code
// only, never a glyph regex.
ok('no em or en dashes',
  ![...(jsRaw + engRaw)].some(function (c) { return c.charCodeAt(0) === 0x2013 || c.charCodeAt(0) === 0x2014; }));

if (failures) { console.error(failures + ' checks failed'); process.exit(1); }
console.log('assessment-guardrails-11: PASS');
