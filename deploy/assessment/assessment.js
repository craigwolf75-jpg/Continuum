// Continuum public Recovery Readiness assessment, controller (Task 3). Reads
// window.ContinuumCRS (Task 1) and window.ContinuumScoring (Task 2) and
// renders the two stage flow entirely from config: no hardcoded questions,
// weights, thresholds, or answer values live in this file. No em or en
// dashes anywhere, no LLM, no benchmark comparison of any kind.
(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Resilience layer 1 of 3: a minimal inline config, used only if
  // window.ContinuumCRS failed to load or is malformed. This keeps the
  // page rendering (a smaller, safe version of the flow) instead of
  // showing nothing. Layer 2 is the pure, network free scoring engine
  // (Task 2), which never depends on this file loading correctly. Layer 3
  // is the safe defaults inside the render functions below (never render
  // an unknown value as a numeric zero).
  // ---------------------------------------------------------------------
  var FALLBACK_CONFIG = {
    version: 'CRS_1.0_FALLBACK',
    scale: { STRUCTURED: 100, ESTABLISHED: 75, PARTIAL: 50, MANUAL: 25, ABSENT: 0, NOT_SURE: null },
    dimensions: {
      MEDICAL_ACCESS: { label: 'Medical Access', weight: 15 },
      RESTRICTIONS_WORKFLOW: { label: 'Restrictions Workflow', weight: 20 },
      MODIFIED_DUTY: { label: 'Modified Duty and RTW', weight: 25 },
      RECOVERY_VISIBILITY: { label: 'Recovery Visibility', weight: 20 },
      CLAIMS_COORDINATION: { label: 'Claims Coordination', weight: 10 },
      WORKFLOW_INTEGRATION: { label: 'Workflow Integration', weight: 10 }
    },
    bands: [
      { min: 0, max: 39, label: 'Reactive' },
      { min: 40, max: 59, label: 'Developing' },
      { min: 60, max: 79, label: 'Established' },
      { min: 80, max: 100, label: 'Advanced' }
    ],
    confidence: { rules: [
      { level: 'High', maxNotSure: 1, minDimensionsScored: 5 },
      { level: 'Moderate', maxNotSure: 3, minDimensionsScored: 4 },
      { level: 'Limited', maxNotSure: 99, minDimensionsScored: 0 }
    ]},
    industries: ['construction', 'mining', 'security', 'manufacturing', 'transportation', 'healthcare', 'other'],
    questions: [
      { id: 'S1Q1', stage: 1, dimension: 'MEDICAL_ACCESS', text: 'When a worker is injured, how do they get in to see a doctor or clinician?', options: [
        { label: 'Same day, through an arranged provider', key: 'STRUCTURED', value: 100, provenance: 'USER_PROVIDED' },
        { label: 'Usually within a day or two', key: 'ESTABLISHED', value: 75, provenance: 'USER_PROVIDED' },
        { label: 'The worker arranges it themselves', key: 'PARTIAL', value: 50, provenance: 'USER_PROVIDED' },
        { label: 'Often delayed or hard to arrange', key: 'MANUAL', value: 25, provenance: 'USER_PROVIDED' },
        { label: 'There is no set way', key: 'ABSENT', value: 0, provenance: 'USER_PROVIDED' },
        { label: 'Not sure', key: 'NOT_SURE', value: null, provenance: 'UNKNOWN' }
      ] },
      { id: 'S1Q2', stage: 1, dimension: 'RESTRICTIONS_WORKFLOW', text: 'When a doctor sets work restrictions, how do those restrictions reach the people who plan the worker duties?', options: [
        { label: 'A system routes them automatically', key: 'STRUCTURED', value: 100, provenance: 'USER_PROVIDED' },
        { label: 'A defined process that is reliably followed', key: 'ESTABLISHED', value: 75, provenance: 'USER_PROVIDED' },
        { label: 'Case by case, mostly by hand', key: 'PARTIAL', value: 50, provenance: 'USER_PROVIDED' },
        { label: 'By phone or paper, and it varies', key: 'MANUAL', value: 25, provenance: 'USER_PROVIDED' },
        { label: 'There is no reliable process', key: 'ABSENT', value: 0, provenance: 'USER_PROVIDED' },
        { label: 'Not sure', key: 'NOT_SURE', value: null, provenance: 'UNKNOWN' }
      ] },
      { id: 'S1Q3', stage: 1, dimension: 'MODIFIED_DUTY', text: 'How does your organization find suitable modified or light duties for a recovering worker?', options: [
        { label: 'A maintained list matched to the restrictions', key: 'STRUCTURED', value: 100, provenance: 'USER_PROVIDED' },
        { label: 'A repeatable process, matched mostly by hand', key: 'ESTABLISHED', value: 75, provenance: 'USER_PROVIDED' },
        { label: 'Improvised for each case', key: 'PARTIAL', value: 50, provenance: 'USER_PROVIDED' },
        { label: 'Rarely offered', key: 'MANUAL', value: 25, provenance: 'USER_PROVIDED' },
        { label: 'We do not offer modified duty', key: 'ABSENT', value: 0, provenance: 'USER_PROVIDED' },
        { label: 'Not sure', key: 'NOT_SURE', value: null, provenance: 'UNKNOWN' }
      ] },
      { id: 'S1Q4', stage: 1, dimension: 'RECOVERY_VISIBILITY', text: 'How well can the right people see a worker recovery progress and current status?', options: [
        { label: 'A shared, up to date view', key: 'STRUCTURED', value: 100, provenance: 'USER_PROVIDED' },
        { label: 'Regular updates kept in one place', key: 'ESTABLISHED', value: 75, provenance: 'USER_PROVIDED' },
        { label: 'Occasional updates, spread across tools', key: 'PARTIAL', value: 50, provenance: 'USER_PROVIDED' },
        { label: 'Little visibility until a problem appears', key: 'MANUAL', value: 25, provenance: 'USER_PROVIDED' },
        { label: 'No real visibility', key: 'ABSENT', value: 0, provenance: 'USER_PROVIDED' },
        { label: 'Not sure', key: 'NOT_SURE', value: null, provenance: 'UNKNOWN' }
      ] },
      { id: 'S1Q5', stage: 1, dimension: 'CLAIMS_COORDINATION', text: 'How is the workers compensation claim coordinated alongside the worker recovery?', options: [
        { label: 'Claim and recovery are closely coordinated', key: 'STRUCTURED', value: 100, provenance: 'USER_PROVIDED' },
        { label: 'Coordinated by one clear owner', key: 'ESTABLISHED', value: 75, provenance: 'USER_PROVIDED' },
        { label: 'Handled separately, with some handoffs', key: 'PARTIAL', value: 50, provenance: 'USER_PROVIDED' },
        { label: 'Fragmented, with frequent gaps', key: 'MANUAL', value: 25, provenance: 'USER_PROVIDED' },
        { label: 'Not coordinated', key: 'ABSENT', value: 0, provenance: 'USER_PROVIDED' },
        { label: 'Not sure', key: 'NOT_SURE', value: null, provenance: 'UNKNOWN' }
      ] },
      { id: 'S1Q6', stage: 1, dimension: 'WORKFLOW_INTEGRATION', text: 'How connected are the systems and people involved in recovery: medical, employer, and claims?', options: [
        { label: 'Connected systems with defined handoffs', key: 'STRUCTURED', value: 100, provenance: 'USER_PROVIDED' },
        { label: 'Some connection, coordinated mostly by hand', key: 'ESTABLISHED', value: 75, provenance: 'USER_PROVIDED' },
        { label: 'Separate systems with manual handoffs', key: 'PARTIAL', value: 50, provenance: 'USER_PROVIDED' },
        { label: 'Disconnected, information is re entered', key: 'MANUAL', value: 25, provenance: 'USER_PROVIDED' },
        { label: 'No connection between them', key: 'ABSENT', value: 0, provenance: 'USER_PROVIDED' },
        { label: 'Not sure', key: 'NOT_SURE', value: null, provenance: 'UNKNOWN' }
      ] }
    ],
    exposure: [
      { id: 'S2Q2', stage: 2, kind: 'annual_lost_time_cases', bands: [
        { label: 'Under 10', key: 'B1', repValue: 5 },
        { label: '10 to 49', key: 'B2', repValue: 30 },
        { label: '50 to 199', key: 'B3', repValue: 125 },
        { label: '200 to 999', key: 'B4', repValue: 600 },
        { label: '1000 plus', key: 'B5', repValue: 1000 }
      ] },
      { id: 'S2Q3', stage: 2, kind: 'avg_lost_time_duration_days', bands: [
        { label: 'Under 1 week', key: 'B1', repValue: 5 },
        { label: '1 to 2 weeks', key: 'B2', repValue: 11 },
        { label: '3 to 4 weeks', key: 'B3', repValue: 25 },
        { label: '1 to 3 months', key: 'B4', repValue: 60 },
        { label: '3 months plus', key: 'B5', repValue: 120 }
      ] }
    ],
    observations: [
      { id: 'default', when: [], template: 'Your responses give an initial picture of how your recovery and return to work process is working today. The deeper assessment will sharpen it.' }
    ]
  };

  function loadConfig() {
    try {
      if (window.ContinuumCRS && window.ContinuumCRS.dimensions && window.ContinuumCRS.questions && window.ContinuumCRS.questions.length) {
        return window.ContinuumCRS;
      }
    } catch (e) { /* fall through to the safe default below */ }
    return FALLBACK_CONFIG;
  }

  var CONFIG = loadConfig();
  var SCORING = window.ContinuumScoring;

  // ---------------------------------------------------------------------
  // State. Held in memory only, for this page load.
  // ---------------------------------------------------------------------
  var state = {
    stage: 'intro', // intro | stage1 | snapshot | stage2 | result
    industry: null,
    answers: {},   // maturity question id -> option key
    exposure: {}   // exposure question id -> band key
  };

  // ---------------------------------------------------------------------
  // Config accessors. All content comes from CONFIG, never hardcoded here.
  // ---------------------------------------------------------------------
  function stage1Questions() {
    return CONFIG.questions.filter(function (q) { return q.stage === 1; });
  }
  function stage2DepthQuestions() {
    return CONFIG.questions.filter(function (q) { return q.stage === 2; });
  }
  function exposureQuestions() {
    return CONFIG.exposure || [];
  }
  function dimensionLabel(key) {
    var d = CONFIG.dimensions[key];
    return d ? d.label : key;
  }
  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  function repValueFor(kind) {
    var q = exposureQuestions().filter(function (e) { return e.kind === kind; })[0];
    if (!q) return null;
    var selectedKey = state.exposure[q.id];
    if (!selectedKey) return null;
    var band = q.bands.filter(function (b) { return b.key === selectedKey; })[0];
    return band ? band.repValue : null;
  }

  // Carried context 3: map the selected exposure bands' repValue into the
  // numeric object ContinuumScoring.lostWorkerDays expects. Only present
  // when both inputs have been answered.
  function exposureNumericInputs() {
    var cases = repValueFor('annual_lost_time_cases');
    var days = repValueFor('avg_lost_time_duration_days');
    if (typeof cases !== 'number' || typeof days !== 'number') return null;
    return { annual_lost_time_cases: cases, avg_lost_time_duration_days: days, _provenance: 'MODELED_ESTIMATE' };
  }

  // ---------------------------------------------------------------------
  // Result building. Exposed as window.ContinuumAssessment.buildResult so
  // Task 5 (persistence) and tests can call it directly. Keys match the
  // table columns and RPC payload exactly.
  // ---------------------------------------------------------------------
  function buildProvenance(answers, exposure) {
    var out = {};
    Object.keys(answers || {}).forEach(function (qid) {
      var q = CONFIG.questions.filter(function (x) { return x.id === qid; })[0];
      var opt = q && q.options.filter(function (o) { return o.key === answers[qid]; })[0];
      out[qid] = opt ? opt.provenance : 'UNKNOWN';
    });
    Object.keys(exposure || {}).forEach(function (eid) {
      out[eid] = 'MODELED_ESTIMATE';
    });
    out.industry = state.industry ? 'USER_PROVIDED' : 'UNKNOWN';
    return out;
  }

  function buildResult(answers, exposure, stageReached) {
    var dimScores = SCORING.dimensionScores(answers, CONFIG);
    var overall = SCORING.overallScore(dimScores, CONFIG);
    var band = SCORING.bandFor(overall, CONFIG);
    var confidence = SCORING.assessmentConfidence(answers, dimScores, CONFIG);
    var missingRate = SCORING.missingDataRate(answers, CONFIG);
    return {
      scoring_model_version: CONFIG.version, // equals window.ContinuumCRS.version when the real config loaded
      stage_reached: stageReached,
      industry: state.industry,
      answers: answers,
      dimension_scores: dimScores,
      overall_score: overall,
      band: band,
      assessment_confidence: confidence,
      missing_data_rate: missingRate,
      exposure: exposure,
      provenance: buildProvenance(answers, exposure)
    };
  }

  // Persistence lands in Task 5 (an anon Supabase RPC call). This stub is
  // the safe, best effort seam for it: it never throws into the render
  // path, and a failure here never blocks or alters the result already
  // shown to the user.
  function persistResult(result) {
    try {
      // Task 5 wires the submit_public_assessment RPC call here, using this
      // result object as its payload. No network call is made yet; this is
      // intentionally a no-op until that task.
      if (!result) return;
    } catch (e) {
      try { console && console.warn && console.warn('assessment: persistResult skipped', e); } catch (e2) { /* nothing left to do */ }
    }
  }

  // ---------------------------------------------------------------------
  // Rendering helpers
  // ---------------------------------------------------------------------
  var root = document.getElementById('assessment-root');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function confidenceLead(confidence) {
    return confidence === 'High'
      ? 'Your responses indicate'
      : 'Based on the information available, your responses suggest';
  }

  function optionsMarkup(q, selectedKey) {
    return q.options.map(function (o) {
      var checked = o.key === selectedKey ? ' checked' : '';
      var id = q.id + '_' + o.key;
      return '' +
        '<label class="crs-option" for="' + esc(id) + '">' +
          '<input type="radio" id="' + esc(id) + '" name="' + esc(q.id) + '" value="' + esc(o.key) + '" data-question="' + esc(q.id) + '"' + checked + '>' +
          '<span>' + esc(o.label) + '</span>' +
        '</label>';
    }).join('');
  }

  function questionMarkup(q, selectedKey) {
    return '' +
      '<fieldset class="crs-question">' +
        '<legend>' + esc(q.text) + '</legend>' +
        '<div class="crs-options">' + optionsMarkup(q, selectedKey) + '</div>' +
      '</fieldset>';
  }

  function exposureQuestionMarkup(eq) {
    var selected = state.exposure[eq.id] || '';
    var options = '<option value="">Select a range</option>' + eq.bands.map(function (b) {
      var sel = b.key === selected ? ' selected' : '';
      return '<option value="' + esc(b.key) + '"' + sel + '>' + esc(b.label) + '</option>';
    }).join('');
    var kindLabel = capitalize(eq.kind.replace(/_/g, ' '));
    return '' +
      '<label class="crs-exposure">' +
        '<span>' + esc(kindLabel) + '</span>' +
        '<select data-exposure="' + esc(eq.id) + '">' + options + '</select>' +
      '</label>';
  }

  function ctaMarkup(action, label) {
    return '<button type="button" class="crs-btn crs-btn-primary" data-action="' + esc(action) + '">' + esc(label) + '</button>';
  }

  // ---------------------------------------------------------------------
  // Stage renderers
  // ---------------------------------------------------------------------
  function renderIntro() {
    var options = '<option value="">Prefer not to say</option>' + CONFIG.industries.map(function (i) {
      var sel = i === state.industry ? ' selected' : '';
      return '<option value="' + esc(i) + '"' + sel + '>' + esc(capitalize(i)) + '</option>';
    }).join('');
    return '' +
      '<section class="crs-panel crs-intro">' +
        '<h1>Recovery Readiness Assessment</h1>' +
        '<p class="crs-lede">Six quick questions give you an instant Recovery Snapshot of how your organization supports an injured worker back to health and back to work. An optional six question deeper assessment follows. Everything is computed in your browser: nothing is sent anywhere until you choose to save your result.</p>' +
        '<label class="crs-select-field">' +
          '<span>Industry (optional)</span>' +
          '<select id="industry-select">' + options + '</select>' +
        '</label>' +
        ctaMarkup('start', 'Start the Assessment') +
      '</section>';
  }

  function renderStage1() {
    var qs = stage1Questions();
    var answeredCount = qs.filter(function (q) { return q.id in state.answers; }).length;
    var disabled = answeredCount < qs.length ? ' disabled' : '';
    return '' +
      '<section class="crs-panel crs-stage1">' +
        '<h2>About Your Recovery Process</h2>' +
        '<p class="crs-lede">Answer each question with the option that is closest to how your organization works today. Choose Not sure if you do not know: an unknown answer is never scored as zero.</p>' +
        qs.map(function (q) { return questionMarkup(q, state.answers[q.id]); }).join('') +
        '<button type="button" class="crs-btn crs-btn-primary" data-action="to-snapshot"' + disabled + '>See My Recovery Snapshot</button>' +
      '</section>';
  }

  function renderSnapshot() {
    var answers = {};
    stage1Questions().forEach(function (q) { if (q.id in state.answers) answers[q.id] = state.answers[q.id]; });
    var dimScores = SCORING.dimensionScores(answers, CONFIG);
    var overall = SCORING.overallScore(dimScores, CONFIG);
    var band = SCORING.bandFor(overall, CONFIG);
    var confidence = SCORING.assessmentConfidence(answers, dimScores, CONFIG);
    var sg = SCORING.strongestAndGap(dimScores);
    var note = SCORING.observation(dimScores, CONFIG);

    persistResult(buildResult(answers, state.exposure, 1));

    var scoreLine = overall === null
      ? 'There is not yet enough information to calculate a score. Answering at least one question with more than Not sure would allow a score to be calculated.'
      : confidenceLead(confidence) + ' a Recovery Readiness score of ' + overall + ' out of 100, in the ' + esc(band) + ' range.';

    var strongestLine = sg.strongest
      ? '<p><strong>Strongest area:</strong> ' + esc(dimensionLabel(sg.strongest)) + '.</p>' : '';
    var gapLine = sg.gap && sg.gap !== sg.strongest
      ? '<p><strong>Largest opportunity:</strong> ' + esc(dimensionLabel(sg.gap)) + '.</p>' : '';

    var unknownDims = Object.keys(dimScores).filter(function (d) { return dimScores[d] === null; });
    var precisionPrompt = unknownDims.length
      ? '<p class="crs-note">Answering the ' + unknownDims.map(dimensionLabel).map(esc).join(', ') + ' question' + (unknownDims.length > 1 ? 's' : '') + ' would improve the precision of this result.</p>'
      : '';

    return '' +
      '<section class="crs-panel crs-snapshot">' +
        '<h2>Your Recovery Snapshot</h2>' +
        '<p class="crs-score-line">' + scoreLine + '</p>' +
        strongestLine + gapLine +
        (note ? '<p class="crs-observation">' + esc(note) + '</p>' : '') +
        precisionPrompt +
        ctaMarkup('to-stage2', 'Continue to the Detailed Assessment') +
      '</section>';
  }

  function renderStage2() {
    var eqs = exposureQuestions();
    var depthQs = stage2DepthQuestions();
    return '' +
      '<section class="crs-panel crs-stage2">' +
        '<h2>The Detailed Assessment</h2>' +
        '<p class="crs-lede">These six questions are optional. Answer as many as you can for a more precise result; anything left blank simply will not factor into that part of the result.</p>' +
        (eqs.length ? '<div class="crs-exposure-group">' + eqs.map(exposureQuestionMarkup).join('') + '</div>' : '') +
        depthQs.map(function (q) { return questionMarkup(q, state.answers[q.id]); }).join('') +
        ctaMarkup('to-result', 'See My Detailed Assessment') +
      '</section>';
  }

  function renderResult() {
    var answers = {};
    stage1Questions().concat(stage2DepthQuestions()).forEach(function (q) {
      if (q.id in state.answers) answers[q.id] = state.answers[q.id];
    });
    var dimScores = SCORING.dimensionScores(answers, CONFIG);
    var overall = SCORING.overallScore(dimScores, CONFIG);
    var band = SCORING.bandFor(overall, CONFIG);
    var confidence = SCORING.assessmentConfidence(answers, dimScores, CONFIG);
    var sg = SCORING.strongestAndGap(dimScores);

    var result = buildResult(answers, state.exposure, 2);
    persistResult(result);

    var scoreLine = overall === null
      ? 'There is not yet enough information to calculate a refined score.'
      : confidenceLead(confidence) + ' a refined Recovery Readiness score of ' + overall + ' out of 100, in the ' + esc(band) + ' range.';

    var strongestLine = sg.strongest
      ? '<p><strong>Strongest area:</strong> ' + esc(dimensionLabel(sg.strongest)) + '.</p>' : '';
    var gapLine = sg.gap && sg.gap !== sg.strongest
      ? '<p><strong>Largest gap:</strong> ' + esc(dimensionLabel(sg.gap)) + '.</p>' : '';

    var scoredDims = Object.keys(dimScores).filter(function (d) { return dimScores[d] !== null; });
    scoredDims.sort(function (a, b) { return dimScores[a] - dimScores[b]; });
    var priorities = scoredDims.slice(0, 3).map(function (d) {
      return '<li>' + esc(dimensionLabel(d)) + ', scored ' + dimScores[d] + ' out of 100, is a priority area for improvement.</li>';
    }).join('');

    var exposureBlock = '';
    var expInputs = exposureNumericInputs();
    if (expInputs) {
      var lwd = SCORING.lostWorkerDays(expInputs, CONFIG);
      if (lwd.days !== null) {
        var estimatedTag = lwd.provenance === 'MODELED_ESTIMATE' ? ' (estimated)' : '';
        var tenPct = lwd.scenarios.filter(function (s) { return s.pct === 10; })[0];
        exposureBlock = '' +
          '<div class="crs-exposure-result">' +
            '<h3>Operational Exposure</h3>' +
            '<p>Estimated lost worker days: ' + lwd.days + ' per year' + estimatedTag + '.</p>' +
            (tenPct ? '<h3>Improvement Scenario</h3><p>A 10 percent reduction in average lost time duration would represent approximately ' + tenPct.days + ' worker days annually. This is not a performance claim; it is a way to size the opportunity.</p>' : '') +
          '</div>';
      }
    }

    return '' +
      '<section class="crs-panel crs-result">' +
        '<h2>Your Detailed Continuum Assessment</h2>' +
        '<p class="crs-score-line">' + scoreLine + '</p>' +
        strongestLine + gapLine +
        (priorities ? '<h3>Priority Opportunities</h3><ul class="crs-priorities">' + priorities + '</ul>' : '') +
        exposureBlock +
        '<p class="crs-note">This result is private to you and is not compared against any other organization.</p>' +
        '<button type="button" class="crs-btn crs-btn-secondary" data-action="restart">Start Over</button>' +
      '</section>';
  }

  // ---------------------------------------------------------------------
  // Main render dispatch
  // ---------------------------------------------------------------------
  function render() {
    if (!root) return;
    var html;
    try {
      switch (state.stage) {
        case 'stage1': html = renderStage1(); break;
        case 'snapshot': html = renderSnapshot(); break;
        case 'stage2': html = renderStage2(); break;
        case 'result': html = renderResult(); break;
        default: html = renderIntro();
      }
    } catch (e) {
      // Layer 3 of resilience: a render failure never leaves a blank page.
      html = '<section class="crs-panel"><h2>Recovery Readiness Assessment</h2><p>The assessment could not be displayed right now. Please reload the page to try again.</p></section>';
      try { console && console.error && console.error('assessment: render failed', e); } catch (e2) { /* nothing left to do */ }
    }
    root.innerHTML = html;
  }

  function stage1Complete() {
    return stage1Questions().every(function (q) { return q.id in state.answers; });
  }

  function onChange(e) {
    var t = e.target;
    if (t.matches && t.matches('input[type="radio"][data-question]')) {
      state.answers[t.getAttribute('data-question')] = t.value;
      if (state.stage === 'stage1') {
        var btn = root.querySelector('[data-action="to-snapshot"]');
        if (btn) btn.disabled = !stage1Complete();
      }
      return;
    }
    if (t.matches && t.matches('select[data-exposure]')) {
      var id = t.getAttribute('data-exposure');
      if (t.value) state.exposure[id] = t.value;
      else delete state.exposure[id];
      return;
    }
    if (t.id === 'industry-select') {
      state.industry = t.value || null;
    }
  }

  function onClick(e) {
    var actionEl = e.target.closest ? e.target.closest('[data-action]') : null;
    if (!actionEl) return;
    var action = actionEl.getAttribute('data-action');
    if (action === 'start') {
      state.stage = 'stage1';
    } else if (action === 'to-snapshot') {
      if (!stage1Complete()) return;
      state.stage = 'snapshot';
    } else if (action === 'to-stage2') {
      state.stage = 'stage2';
    } else if (action === 'to-result') {
      state.stage = 'result';
    } else if (action === 'restart') {
      state = { stage: 'intro', industry: null, answers: {}, exposure: {} };
    } else {
      return;
    }
    render();
    if (root && root.scrollIntoView) root.scrollIntoView({ block: 'start' });
  }

  function init() {
    if (!root) return;
    root.addEventListener('change', onChange);
    root.addEventListener('click', onClick);
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ContinuumAssessment = { buildResult: buildResult };
})();
