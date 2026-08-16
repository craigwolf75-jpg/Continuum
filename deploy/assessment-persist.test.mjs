// Continuum public assessment, persistence unit test (Task 5, revised Prompt
// 63c). Sandbox loads the controller with a fake window and document, the
// real config and scoring engine (so rendering the result surfaces does not
// throw), and a fake Supabase client: no network, no real DOM. Verifies:
// (a) rendering a result surface never calls client.rpc (no write on render
//     or navigation, proven by simulating the click and change events that
//     drive the flow from intro through both result surfaces with a spy
//     client wired up and ready);
// (b) invoking the save handler (the exported saveResult, and the full
//     click driven Save my result path) calls persist / client.rpc exactly
//     once, with save_source: 'user_initiated' present in the payload, and
//     leaves the original result object untagged;
// (c) persist still never throws and resolves { ok:false } on a rejecting,
//     missing, or malformed client, and the full click driven save path
//     with a rejecting client shows the neutral retry message, never the
//     saved confirmation.
// No em or en dashes anywhere, checked by char code only.
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const js = readFileSync(new URL('./assessment/assessment.js', import.meta.url), 'utf8');
const CRS = require('./assessment/config/crs-1.0.js');
const SCORING = require('./assessment/scoring.js');

let failures = 0; function ok(n, c) { if (!c) { failures++; console.error('FAIL', n); } }

// ---------------------------------------------------------------------
// Fake DOM. root.querySelector returns a persistent slot object for
// [data-save-slot] (so handleSaveResult's mutations are observable), and a
// generic disposable stub for anything else the controller queries
// (the to-snapshot button enable and disable). Click and change handlers
// registered via addEventListener are captured so the test can fire
// synthetic events without a real browser.
function makeFakeRoot() {
  var handlers = {};
  var slot = { innerHTML: '' };
  return {
    addEventListener: function (type, fn) { handlers[type] = fn; },
    _handlers: handlers,
    _slot: slot,
    innerHTML: '',
    scrollIntoView: function () {},
    querySelector: function (sel) {
      if (sel === '[data-save-slot]') return slot;
      return { disabled: false, innerHTML: '' };
    }
  };
}

const root = makeFakeRoot();
const sandbox = {
  window: {},
  document: { getElementById: function (id) { return id === 'assessment-root' ? root : null; }, addEventListener: function () {} },
  console: console
};
sandbox.globalThis = sandbox;
sandbox.window.ContinuumCRS = CRS;
sandbox.window.ContinuumScoring = SCORING;
new Function('window', 'document', 'globalThis', js)(sandbox.window, sandbox.document, sandbox);

const A = sandbox.window.ContinuumAssessment;
ok('persist exists', A && typeof A.persist === 'function');
ok('saveResult exists', A && typeof A.saveResult === 'function');

function fireClick(action, attrs) {
  var el = {
    getAttribute: function (name) {
      if (name === 'data-action') return action;
      if (attrs && Object.prototype.hasOwnProperty.call(attrs, name)) return attrs[name];
      return null;
    }
  };
  root._handlers['click']({ target: { closest: function () { return el; } } });
}

function fireRadioChange(questionId, optionKey) {
  var target = {
    matches: function (sel) { return sel === 'input[type="radio"][data-question]'; },
    getAttribute: function (name) { return name === 'data-question' ? questionId : null; },
    value: optionKey
  };
  root._handlers['change']({ target: target });
}

// ---------------------------------------------------------------------
// (a) Rendering never writes. A spy client is wired up and ready via
// window.ContinuumSupabaseReady for the whole walk through intro, stage1,
// the snapshot, stage2, and the full result, so any render-triggered write
// would be caught.
// ---------------------------------------------------------------------
let renderRpcCalls = 0;
sandbox.window.ContinuumSupabaseReady = Promise.resolve({
  rpc: function () { renderRpcCalls++; return Promise.resolve({ data: 'id', error: null }); }
});

fireClick('start'); // intro -> stage1
CRS.questions.filter(function (q) { return q.stage === 1; }).forEach(function (q) {
  fireRadioChange(q.id, q.options[0].key);
});
fireClick('to-snapshot'); // stage1 -> snapshot
ok('snapshot render does not call client.rpc', renderRpcCalls === 0);
ok('snapshot renders exactly one save slot', (root.innerHTML.match(/data-save-slot/g) || []).length === 1);
ok('snapshot save control states what saving does in one sentence',
  root.innerHTML.indexOf('Saving records an anonymous summary of your result to help improve the assessment.') !== -1);
ok('snapshot save control is a plain, non pre checked button',
  /<button type="button" class="crs-btn crs-btn-secondary" data-action="save-result" data-stage-reached="1">Save my result<\/button>/.test(root.innerHTML));

fireClick('to-stage2'); // snapshot -> stage2
CRS.questions.filter(function (q) { return q.stage === 2; }).forEach(function (q) {
  fireRadioChange(q.id, q.options[0].key);
});
fireClick('to-result'); // stage2 -> result
ok('detailed result render does not call client.rpc', renderRpcCalls === 0);
ok('detailed result renders exactly one save slot', (root.innerHTML.match(/data-save-slot/g) || []).length === 1);
ok('detailed result save control targets stage 2',
  root.innerHTML.indexOf('data-stage-reached="2"') !== -1);

// ---------------------------------------------------------------------
// (b) Invoking the save handler writes exactly once, tagged.
// ---------------------------------------------------------------------
const directAnswers = {}; CRS.questions.filter(function (q) { return q.stage === 1; }).forEach(function (q) {
  directAnswers[q.id] = q.options[0].key;
});
const directResult = A.buildResult(directAnswers, {}, 1);
let directRpcCalls = 0; let directLastCall = null;
const directSpyClient = { rpc: function (name, args) { directRpcCalls++; directLastCall = { name: name, args: args }; return Promise.resolve({ data: 'id', error: null }); } };
const directSaveOutcome = await A.saveResult(directResult, directSpyClient);
ok('direct saveResult resolves ok:true', directSaveOutcome && directSaveOutcome.ok === true);
ok('direct saveResult calls client.rpc exactly once', directRpcCalls === 1);
ok('direct saveResult calls submit_public_assessment', directLastCall && directLastCall.name === 'submit_public_assessment');
ok('direct saveResult tags save_source user_initiated',
  directLastCall && directLastCall.args && directLastCall.args.p_payload && directLastCall.args.p_payload.save_source === 'user_initiated');
ok('direct saveResult does not mutate the original result object', !('save_source' in directResult));

// Full click driven path: fire the rendered Save my result button at the
// result stage (still 'result' from the walk above) and let the async
// chain (resolveClient -> saveResult -> persist) settle.
let clickRpcCalls = 0; let clickLastCall = null;
sandbox.window.ContinuumSupabaseReady = Promise.resolve({
  rpc: function (name, args) { clickRpcCalls++; clickLastCall = { name: name, args: args }; return Promise.resolve({ data: 'id', error: null }); }
});
fireClick('save-result', { 'data-stage-reached': '2' });
await new Promise(function (resolve) { setTimeout(resolve, 10); });
ok('click driven save calls client.rpc exactly once', clickRpcCalls === 1);
ok('click driven save tags save_source user_initiated',
  clickLastCall && clickLastCall.args.p_payload.save_source === 'user_initiated');
ok('click driven save shows the confirmation in place of the button',
  root._slot.innerHTML.indexOf('Your result is saved.') !== -1);
ok('confirmation replaces the button rather than adding to it',
  root._slot.innerHTML.indexOf('Save my result') === -1);

// Click driven path with a rejecting client. A failed save must never
// falsely show saved, per three layer resilience: it must show the
// neutral retry message and leave the button so the visitor can try
// again. This is the one acceptance item that was previously proven only
// for persist() in isolation, not through the real click path.
let rejectingRpcCalls = 0;
sandbox.window.ContinuumSupabaseReady = Promise.resolve({
  rpc: function () { rejectingRpcCalls++; return Promise.reject(new Error('down')); }
});
fireClick('save-result', { 'data-stage-reached': '2' });
await new Promise(function (resolve) { setTimeout(resolve, 10); });
ok('click driven save with a rejecting client calls client.rpc once', rejectingRpcCalls === 1);
ok('click driven save with a rejecting client does not show the saved confirmation',
  root._slot.innerHTML.indexOf('Your result is saved.') === -1);
ok('click driven save with a rejecting client shows the neutral retry message',
  root._slot.innerHTML.indexOf('Could not save right now.') !== -1);
ok('click driven save with a rejecting client leaves the button in place to retry',
  root._slot.innerHTML.indexOf('Save my result') !== -1);

// ---------------------------------------------------------------------
// (c) persist never throws; always resolves { ok:boolean }.
// ---------------------------------------------------------------------
const badClient = { rpc: function () { return Promise.reject(new Error('down')); } };
const p = A.persist({ scoring_model_version: 'CRS_1.0' }, badClient)
  .then(function (r) { ok('persist resolves ok:false on failure', r && r.ok === false); })
  .catch(function () { failures++; console.error('FAIL persist threw'); });
let calledName = null;
const goodClient = { rpc: function (name, args) { calledName = name; return Promise.resolve({ data: 'id', error: null }); } };
const q = A.persist({ scoring_model_version: 'CRS_1.0' }, goodClient)
  .then(function (r) {
    ok('persist ok:true on success', r && r.ok === true);
    ok('calls submit_public_assessment', calledName === 'submit_public_assessment');
  });
await Promise.all([p, q]);
const r2 = await A.persist({ scoring_model_version: 'CRS_1.0' }, null).catch(function () { return { ok: 'threw' }; });
ok('persist resolves ok:false when no client is given', r2 && r2.ok === false);
const r3 = await A.saveResult({ scoring_model_version: 'CRS_1.0' }, badClient).catch(function () { return { ok: 'threw' }; });
ok('saveResult resolves ok:false on a rejecting client, never throws', r3 && r3.ok === false);

// No em or en dashes anywhere in this test file's own literal strings.
const selfSrc = readFileSync(new URL(import.meta.url), 'utf8');
ok('no em or en dashes in this test file',
  ![...selfSrc].some(function (c) { return c.charCodeAt(0) === 0x2013 || c.charCodeAt(0) === 0x2014; }));

if (failures) { console.error(failures + ' persist checks failed'); process.exit(1); }
console.log('assessment-persist: PASS');
