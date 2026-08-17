// Continuum public assessment, engagement CTA unit test (Task 2, Step 2D).
// Sandbox loads the controller with a fake window and document, the real
// config and scoring engine (so rendering the result surface does not
// throw), and a fake Supabase client: no network, no real DOM. Verifies:
// (a) the static smoke checks from the task brief: the two CTA controls
//     exist, the record_engagement RPC and its two signals are present, the
//     call is guarded (try/catch), and the internal Opportunity Score is
//     never fetched, referenced, or rendered. That last check is against the
//     actual internal field and function names (opportunity_score,
//     opportunity_factors, compute_opportunity_score), not the plain English
//     word "opportunity": the public facing Priority Opportunities section
//     (Section 24, pre existing) already and legitimately uses that word for
//     an unrelated concept, and is out of this task's scope;
// (b) both CTAs render on the Stage 2 detailed result even without a save,
//     and Book a Demo still navigates while Review my results still shows
//     its confirmation in that case, but neither calls record_engagement
//     (there is no response_id to attach the signal to, per design spec
//     section 6);
// (c) after a save produces a response_id, Review my results and Book a
//     Demo each call record_engagement exactly once with the right signal
//     and that response_id; a rejecting client never blocks the
//     confirmation or the navigation (best effort, three layer resilience);
// (d) window.ContinuumAssessment.recordEngagement never throws and resolves
//     as a no-op when responseId is falsy.
// No em or en dashes anywhere, checked by char code only.
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const js = readFileSync(new URL('./assessment/assessment.js', import.meta.url), 'utf8');
const CRS = require('./assessment/config/crs-1.0.js');
const SCORING = require('./assessment/scoring.js');

let failures = 0; function ok(n, c) { if (!c) { failures++; console.error('FAIL', n); } }

// ---------------------------------------------------------------------
// (a) Static smoke checks (task brief, Step 1).
// ---------------------------------------------------------------------
ok('has a Review my results control', /Review my results/i.test(js));
ok('has a Book a Demo control', /Book a Demo/i.test(js));
ok('calls record_engagement rpc', js.includes('record_engagement'));
ok('records review_clicked and book_a_demo_clicked', js.includes('review_clicked') && js.includes('book_a_demo_clicked'));
ok('never renders the internal opportunity score',
  !/opportunity_score|opportunity_factors|compute_opportunity_score/i.test(js));
ok('engagement is best effort (guarded)', js.includes('try') && js.includes('catch'));
ok('no em or en dashes',
  ![...js].some(function (c) { return c.charCodeAt(0) === 0x2013 || c.charCodeAt(0) === 0x2014; }));

// ---------------------------------------------------------------------
// Sandbox setup, the same technique as assessment-persist.test.mjs.
// root.querySelector returns a persistent slot object for both
// [data-save-slot] and [data-engagement-slot] (so the handlers' mutations
// are observable), and a generic disposable stub for anything else.
// ---------------------------------------------------------------------
function makeFakeRoot() {
  var handlers = {};
  var saveSlot = { innerHTML: '' };
  var engagementSlot = { innerHTML: '' };
  return {
    addEventListener: function (type, fn) { handlers[type] = fn; },
    _handlers: handlers,
    _saveSlot: saveSlot,
    _engagementSlot: engagementSlot,
    innerHTML: '',
    scrollIntoView: function () {},
    querySelector: function (sel) {
      if (sel === '[data-save-slot]') return saveSlot;
      if (sel === '[data-engagement-slot]') return engagementSlot;
      return { disabled: false, innerHTML: '' };
    }
  };
}

const root = makeFakeRoot();
const fakeLocation = { href: '' };
const sandbox = {
  window: { location: fakeLocation },
  document: { getElementById: function (id) { return id === 'assessment-root' ? root : null; }, addEventListener: function () {} },
  console: console
};
sandbox.globalThis = sandbox;
sandbox.window.ContinuumCRS = CRS;
sandbox.window.ContinuumScoring = SCORING;
new Function('window', 'document', 'globalThis', js)(sandbox.window, sandbox.document, sandbox);

const A = sandbox.window.ContinuumAssessment;
ok('recordEngagement exists', A && typeof A.recordEngagement === 'function');

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

function settle() {
  return new Promise(function (resolve) { setTimeout(resolve, 10); });
}

function walkToResult() {
  fireClick('start'); // intro -> stage1
  CRS.questions.filter(function (q) { return q.stage === 1; }).forEach(function (q) {
    fireRadioChange(q.id, q.options[0].key);
  });
  fireClick('to-snapshot'); // stage1 -> snapshot
  fireClick('to-stage2'); // snapshot -> stage2
  CRS.questions.filter(function (q) { return q.stage === 2; }).forEach(function (q) {
    fireRadioChange(q.id, q.options[0].key);
  });
  fireClick('to-result'); // stage2 -> result
}

// ---------------------------------------------------------------------
// (b) Both CTAs render on the detailed result without a save; Book a Demo
// still navigates and Review my results still confirms, but neither writes.
// ---------------------------------------------------------------------
let noSaveRpcCalls = 0;
sandbox.window.ContinuumSupabaseReady = Promise.resolve({
  rpc: function () { noSaveRpcCalls++; return Promise.resolve({ data: 'unused', error: null }); }
});
walkToResult();
ok('detailed result renders Review my results without a save', root.innerHTML.indexOf('Review my results') !== -1);
ok('detailed result renders Book a Demo without a save', root.innerHTML.indexOf('Book a Demo') !== -1);

fireClick('review-results');
await settle();
ok('review without a save does not call client.rpc', noSaveRpcCalls === 0);
ok('review without a save still shows a confirmation',
  root._engagementSlot.innerHTML.indexOf('Review my results') !== -1 &&
  root._engagementSlot.innerHTML.toLowerCase().indexOf('thanks') !== -1);

fireClick('book-a-demo');
await settle();
ok('book a demo without a save does not call client.rpc', noSaveRpcCalls === 0);
ok('book a demo without a save still navigates', fakeLocation.href === 'https://continuumrtw.com/book');

// ---------------------------------------------------------------------
// (c) After a save, both CTAs call record_engagement with the response_id.
// ---------------------------------------------------------------------
let saveCalls = 0; let savedName = null;
sandbox.window.ContinuumSupabaseReady = Promise.resolve({
  rpc: function (name) { saveCalls++; savedName = name; return Promise.resolve({ data: 'resp-abc-123', error: null }); }
});
fireClick('save-result', { 'data-stage-reached': '2' });
await settle();
ok('save before engagement calls submit_public_assessment', saveCalls === 1 && savedName === 'submit_public_assessment');

let engagementCalls = [];
sandbox.window.ContinuumSupabaseReady = Promise.resolve({
  rpc: function (name, args) { engagementCalls.push({ name: name, args: args }); return Promise.resolve({ data: null, error: null }); }
});
fakeLocation.href = '';
fireClick('review-results');
await settle();
ok('review after a save calls record_engagement exactly once', engagementCalls.length === 1);
ok('review after a save uses review_clicked with the saved response_id',
  engagementCalls[0] && engagementCalls[0].name === 'record_engagement' &&
  engagementCalls[0].args.p_response_id === 'resp-abc-123' &&
  engagementCalls[0].args.p_signal === 'review_clicked');

engagementCalls = [];
fireClick('book-a-demo');
await settle();
ok('book a demo after a save calls record_engagement exactly once', engagementCalls.length === 1);
ok('book a demo after a save uses book_a_demo_clicked with the saved response_id',
  engagementCalls[0] && engagementCalls[0].name === 'record_engagement' &&
  engagementCalls[0].args.p_response_id === 'resp-abc-123' &&
  engagementCalls[0].args.p_signal === 'book_a_demo_clicked');
ok('book a demo after a save still navigates', fakeLocation.href === 'https://continuumrtw.com/book');

// ---------------------------------------------------------------------
// (c continued) Best effort: a rejecting client never blocks the CTA.
// ---------------------------------------------------------------------
sandbox.window.ContinuumSupabaseReady = Promise.resolve({
  rpc: function () { return Promise.reject(new Error('down')); }
});
fakeLocation.href = '';
fireClick('book-a-demo');
await settle();
ok('book a demo still navigates when the engagement call fails', fakeLocation.href === 'https://continuumrtw.com/book');

fireClick('review-results');
await settle();
ok('review still confirms when the engagement call fails',
  root._engagementSlot.innerHTML.toLowerCase().indexOf('thanks') !== -1);

// ---------------------------------------------------------------------
// (d) recordEngagement is a no-op that resolves when responseId is falsy,
// and never throws even when the client's rpc rejects.
// ---------------------------------------------------------------------
let directCalls = 0;
const directClient = { rpc: function () { directCalls++; return Promise.reject(new Error('down')); } };
const directResult = await A.recordEngagement(null, 'review_clicked', directClient).catch(function () { return 'threw'; });
ok('recordEngagement is a no-op for a falsy responseId', directCalls === 0 && directResult !== 'threw');
const directResult2 = await A.recordEngagement('resp-xyz', 'review_clicked', directClient).catch(function () { return 'threw'; });
ok('recordEngagement never throws on a rejecting client', directCalls === 1 && directResult2 !== 'threw');

// No em or en dashes anywhere in this test file's own literal strings.
const selfSrc = readFileSync(new URL(import.meta.url), 'utf8');
ok('no em or en dashes in this test file',
  ![...selfSrc].some(function (c) { return c.charCodeAt(0) === 0x2013 || c.charCodeAt(0) === 0x2014; }));

if (failures) { console.error(failures + ' engagement checks failed'); process.exit(1); }
console.log('assessment-engagement: PASS');
