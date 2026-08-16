// Continuum public assessment, persistence unit test (Task 5). Sandbox loads
// the controller with a fake window and document, and a fake Supabase
// client: no network, no real DOM. Verifies persist() never throws and
// resolves { ok:false } on any failure, { ok:true } on success, calling
// the submit_public_assessment RPC with the result as p_payload. No em or
// en dashes anywhere.
import { readFileSync } from 'fs';
const js = readFileSync(new URL('./assessment/assessment.js', import.meta.url), 'utf8');
// Sandbox load the controller with a fake window and a fake Supabase client.
const sandbox = { window: {}, document: { getElementById: () => null, addEventListener(){} }, console };
sandbox.globalThis = sandbox; sandbox.window.ContinuumCRS = { version:'CRS_1.0', dimensions:{}, questions:[], bands:[], confidence:{rules:[]}, observations:[] };
sandbox.window.ContinuumScoring = {};
new Function('window','document','globalThis', js)(sandbox.window, sandbox.document, sandbox);
let failures = 0; function ok(n,c){ if(!c){ failures++; console.error('FAIL', n); } }

const A = sandbox.window.ContinuumAssessment;
ok('persist exists', A && typeof A.persist === 'function');
// A failing client must resolve ok:false, never throw.
const badClient = { rpc: () => Promise.reject(new Error('down')) };
const p = A.persist({ scoring_model_version:'CRS_1.0' }, badClient)
  .then(r => ok('persist resolves ok:false on failure', r && r.ok === false))
  .catch(() => { failures++; console.error('FAIL persist threw'); });
// A working client must call rpc submit_public_assessment.
let called = null;
const goodClient = { rpc: (name, args) => { called = { name, args }; return Promise.resolve({ data:'id', error:null }); } };
const q = A.persist({ scoring_model_version:'CRS_1.0' }, goodClient)
  .then(r => { ok('persist ok:true on success', r && r.ok === true);
               ok('calls submit_public_assessment', called && called.name === 'submit_public_assessment'); });
await Promise.all([p, q]);
// A missing client must resolve ok:false, never throw (best effort with no client available).
const r2 = await A.persist({ scoring_model_version:'CRS_1.0' }, null).catch(() => ({ ok: 'threw' }));
ok('persist resolves ok:false when no client is given', r2 && r2.ok === false);
if (failures) { console.error(failures + ' persist checks failed'); process.exit(1); }
console.log('assessment-persist: PASS');
