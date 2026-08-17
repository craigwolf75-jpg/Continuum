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
    version: 'CRS_1.1_FALLBACK',
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
    ],
    // A minimal opportunity line per dimension, so the result surface never
    // renders a blank Priority Opportunities section even in this smallest
    // safe fallback path. CRS_1.1's real config carries the fuller, config
    // authored versions of these lines.
    opportunityTemplates: {
      MEDICAL_ACCESS: 'Getting an injured worker to a doctor quickly and consistently is an opportunity area based on your responses.',
      RESTRICTIONS_WORKFLOW: 'Getting medical restrictions to the people who plan daily work is an opportunity area based on your responses.',
      MODIFIED_DUTY: 'Finding suitable modified duties is an opportunity area based on your responses.',
      RECOVERY_VISIBILITY: 'Giving the right people a clear, current view of recovery status is an opportunity area based on your responses.',
      CLAIMS_COORDINATION: 'Keeping the claim and the recovery plan coordinated is an opportunity area based on your responses.',
      WORKFLOW_INTEGRATION: 'Connecting the medical, employer, and claims pieces is an opportunity area based on your responses.'
    }
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
    exposure: {},  // exposure question id -> { band:key, exact:number }
    financial: {}  // financial input key -> number
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

  // Maps the per-question exposure state (keyed by exposure question id, each
  // an optional { band, exact } pair) into the per-kind shape
  // ContinuumScoring.resolveExposure expects. A question with neither a band
  // nor an exact value contributes nothing, so resolveExposure resolves it to
  // UNKNOWN rather than a fabricated value.
  function exposureAnswersByKind(exposureState) {
    var out = {};
    exposureQuestions().forEach(function (eq) {
      var entry = exposureState && exposureState[eq.id];
      if (!entry) return;
      var mapped = {};
      if (typeof entry.exact === 'number') mapped.exact = entry.exact;
      if (entry.band) mapped.band = entry.band;
      out[eq.kind] = mapped;
    });
    return out;
  }

  // ---------------------------------------------------------------------
  // Result building. Exposed as window.ContinuumAssessment.buildResult so
  // Task 5 (persistence) and tests can call it directly. Keys match the
  // table columns and RPC payload exactly.
  // ---------------------------------------------------------------------
  function buildProvenance(answers) {
    var out = {};
    Object.keys(answers || {}).forEach(function (qid) {
      var q = CONFIG.questions.filter(function (x) { return x.id === qid; })[0];
      var opt = q && q.options.filter(function (o) { return o.key === answers[qid]; })[0];
      out[qid] = opt ? opt.provenance : 'UNKNOWN';
    });
    out.industry = state.industry ? 'USER_PROVIDED' : 'UNKNOWN';
    return out;
  }

  // exposureState is the per-question exposure state (state.exposure's shape:
  // question id -> { band, exact }). It is resolved here to the per-kind
  // { value, provenance } object (CRS_1.1 shape) via resolveExposure, which
  // becomes both the stored "exposure" field and an input to the financial
  // model and the extended confidence signature.
  function buildResult(answers, exposureState, stageReached) {
    var dimScores = SCORING.dimensionScores(answers, CONFIG);
    var overall = SCORING.overallScore(dimScores, CONFIG);
    var band = SCORING.bandFor(overall, CONFIG);
    var exposureResolved = SCORING.resolveExposure(exposureAnswersByKind(exposureState), CONFIG);
    var confidence = SCORING.assessmentConfidence(answers, dimScores, exposureResolved, CONFIG);
    var missingRate = SCORING.missingDataRate(answers, CONFIG);
    var financial = SCORING.financialModel(exposureResolved, state.financial, CONFIG);
    var provenance = buildProvenance(answers);
    provenance.financial = financial.assumptions;
    return {
      // Prefers the live loaded config's version; CONFIG.version covers the
      // case where window.ContinuumCRS never loaded and CONFIG fell back to
      // FALLBACK_CONFIG (Layer 1 of three layer resilience).
      scoring_model_version: (window.ContinuumCRS && window.ContinuumCRS.version) || CONFIG.version,
      stage_reached: stageReached,
      industry: state.industry,
      answers: answers,
      dimension_scores: dimScores,
      overall_score: overall,
      band: band,
      assessment_confidence: confidence,
      missing_data_rate: missingRate,
      exposure: exposureResolved,
      provenance: provenance
    };
  }

  // Best effort anonymous persistence (Task 5). Calls the submit_public_assessment
  // RPC on an anon Supabase client. Never throws: always resolves { ok:boolean }.
  // A failure here never blocks or alters the result already shown to the user.
  // Nothing in this file calls persist on render or navigation: it fires only
  // from the opt in Save my result control below (Prompt 63c).
  function persist(result, client) {
    try {
      if (!client || typeof client.rpc !== 'function') {
        return Promise.resolve({ ok: false });
      }
      return client.rpc('submit_public_assessment', { p_payload: result })
        .then(function (res) { return { ok: !res || !res.error }; })
        .catch(function () { return { ok: false }; });
    } catch (e) {
      return Promise.resolve({ ok: false });
    }
  }

  // Tags a copy of the result as a user initiated save, without mutating the
  // original object. This is the same anonymous summary buildResult produces;
  // the only addition is the tag and created_at (set server side) that mark
  // it as a deliberate save rather than an automatic one.
  function taggedForSave(result) {
    var tagged = {};
    Object.keys(result || {}).forEach(function (k) { tagged[k] = result[k]; });
    tagged.save_source = 'user_initiated';
    return tagged;
  }

  // Prompt 63c save handler core. Exposed on window.ContinuumAssessment so
  // tests can call it directly with a spy client, exactly like persist()
  // above. This is the only place a save is tagged and sent.
  function saveResult(result, client) {
    return persist(taggedForSave(result), client);
  }

  // Integration point: deploy/assessment/index.html loads the marketing
  // site's existing anon Supabase client (deploy/config.js then
  // deploy/supabase.js) ahead of this script, which exposes
  // window.ContinuumSupabaseReady, a Promise resolving to the client. If
  // those scripts are ever removed from the page, or fail to load, the save
  // action resolves to no client and simply fails gracefully: the shown
  // result never depends on this.
  function resolveClient() {
    try {
      if (window.ContinuumSupabaseReady && typeof window.ContinuumSupabaseReady.then === 'function') {
        return window.ContinuumSupabaseReady.then(function (client) { return client; }, function () { return null; });
      }
    } catch (e) { /* fall through to no client below */ }
    return Promise.resolve(null);
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
    var current = state.exposure[eq.id] || {};
    var selectedBand = current.band || '';
    var options = '<option value="">Select a range</option>' + eq.bands.map(function (b) {
      var sel = b.key === selectedBand ? ' selected' : '';
      return '<option value="' + esc(b.key) + '"' + sel + '>' + esc(b.label) + '</option>';
    }).join('');
    var kindLabel = capitalize(eq.kind.replace(/_/g, ' '));
    var exactField = '';
    if (eq.allowExact === true) {
      var exactVal = (typeof current.exact === 'number') ? current.exact : '';
      exactField = '' +
        '<label class="crs-exposure-exact">' +
          '<span>or enter the exact number</span>' +
          '<input type="number" min="0" step="1" inputmode="numeric" data-exposure-exact="' + esc(eq.id) + '" value="' + esc(exactVal) + '">' +
        '</label>';
    }
    return '' +
      '<div class="crs-exposure">' +
        '<label>' +
          '<span>' + esc(kindLabel) + '</span>' +
          '<select data-exposure="' + esc(eq.id) + '">' + options + '</select>' +
        '</label>' +
        exactField +
      '</div>';
  }

  // Optional collapsible financial input block (design section 5, 6):
  // loaded daily labour cost is the primary field (required for any dollar
  // output), the rest are optional. Rendered only when config.financial
  // carries at least one declared input; absent for CRS_1.0 and for
  // FALLBACK_CONFIG, which is graceful degradation, not a bug: without it
  // the result simply stays operational only (worker days, no dollars).
  function financialBlockMarkup() {
    var inputs = (CONFIG.financial && CONFIG.financial.inputs) || [];
    if (!inputs.length) return '';
    var fields = inputs.map(function (inp) {
      var val = (typeof state.financial[inp.key] === 'number') ? state.financial[inp.key] : '';
      var reqTag = inp.required ? ' (required for dollar figures)' : ' (optional)';
      return '' +
        '<label class="crs-financial-field">' +
          '<span>' + esc(inp.label) + ' (' + esc(inp.unit) + ')' + reqTag + '</span>' +
          '<input type="number" min="0" step="1" inputmode="numeric" data-financial="' + esc(inp.key) + '" value="' + esc(val) + '">' +
        '</label>';
    }).join('');
    var note = CONFIG.financial.operational_only_note
      ? '<p class="crs-note">' + esc(CONFIG.financial.operational_only_note) + '</p>' : '';
    return '' +
      '<details class="crs-financial-block">' +
        '<summary>Add financial figures (optional)</summary>' +
        note +
        fields +
      '</details>';
  }

  function ctaMarkup(action, label) {
    return '<button type="button" class="crs-btn crs-btn-primary" data-action="' + esc(action) + '">' + esc(label) + '</button>';
  }

  // Prompt 63c opt in save control. One offer per result surface, reusing
  // the existing button classes. States plainly what saving does; no pre
  // checked state, no repeated prompting. saveOfferInner is reused for the
  // failure retry state so the same honest sentence and button reappear.
  function saveOfferInner(stageReached) {
    return '' +
      '<p class="crs-note">Saving records an anonymous summary of your result to help improve the assessment.</p>' +
      '<button type="button" class="crs-btn crs-btn-secondary" data-action="save-result" data-stage-reached="' + esc(stageReached) + '">Save my result</button>';
  }

  function saveOfferMarkup(stageReached) {
    return '<div class="crs-save" data-save-slot>' + saveOfferInner(stageReached) + '</div>';
  }

  // Runs on Save my result activation. Persists exactly once: builds the
  // same anonymous summary buildResult produces from the current answers,
  // then hands it to saveResult (which tags and calls persist). The save
  // slot's own markup is replaced with the outcome; nothing else on the
  // page changes.
  function handleSaveResult(stageReached) {
    var slot = root.querySelector('[data-save-slot]');
    if (!slot) return;
    slot.innerHTML = ''; // remove the button immediately so a second activation cannot resubmit
    var qs = stageReached === 2 ? stage1Questions().concat(stage2DepthQuestions()) : stage1Questions();
    var answers = {};
    qs.forEach(function (q) { if (q.id in state.answers) answers[q.id] = state.answers[q.id]; });
    var result = buildResult(answers, state.exposure, stageReached);
    resolveClient().then(function (client) {
      return saveResult(result, client);
    }).then(function (res) {
      if (res && res.ok) {
        slot.innerHTML = '<p class="crs-note">Your result is saved.</p>';
      } else {
        slot.innerHTML = '<p class="crs-note">Could not save right now.</p>' + saveOfferInner(stageReached);
      }
    });
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
        saveOfferMarkup(1) +
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
        financialBlockMarkup() +
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
    var exposureResolved = SCORING.resolveExposure(exposureAnswersByKind(state.exposure), CONFIG);
    var confidence = SCORING.assessmentConfidence(answers, dimScores, exposureResolved, CONFIG);
    var sg = SCORING.strongestAndGap(dimScores);

    var scoreLine = overall === null
      ? 'There is not yet enough information to calculate a refined score.'
      : confidenceLead(confidence) + ' a refined Recovery Readiness score of ' + overall + ' out of 100, in the ' + esc(band) + ' range.';

    var strongestLine = sg.strongest
      ? '<p><strong>Strongest area:</strong> ' + esc(dimensionLabel(sg.strongest)) + '.</p>' : '';
    var gapLine = sg.gap && sg.gap !== sg.strongest
      ? '<p><strong>Largest gap:</strong> ' + esc(dimensionLabel(sg.gap)) + '.</p>' : '';

    // Three priority opportunities from config authored opportunityTemplates
    // (design section 6). A missing template (older or fallback config) falls
    // back to the plain scored line rather than rendering blank.
    var po = SCORING.priorityOpportunities(dimScores, CONFIG);
    var priorities = po.map(function (p) {
      var label = dimensionLabel(p.dimension);
      if (p.line) {
        return '<li><strong>' + esc(label) + ':</strong> ' + esc(p.line) + '</li>';
      }
      return '<li>' + esc(label) + ', scored ' + dimScores[p.dimension] + ' out of 100, is a priority area for improvement.</li>';
    }).join('');

    var lwd = SCORING.lostWorkerDays(exposureResolved, CONFIG);
    var fin = SCORING.financialModel(exposureResolved, state.financial, CONFIG);

    // Financial scenario lines render only when financialModel resolves
    // dollars (a stated loaded daily labour cost plus a worker day total).
    // Otherwise the operational lines stand alone (design section 5, 6).
    var financialLines = '';
    if (fin.dollars) {
      var byPct = {};
      fin.dollars.perScenario.forEach(function (s) { byPct[s.pct] = s; });
      var lines = [5, 10, 20].map(function (pct) {
        var d = lwd.scenarios.filter(function (s) { return s.pct === pct; })[0];
        var m = byPct[pct];
        if (!d || !m) return '';
        var estTag = m.provenance === 'MODELED_ESTIMATE' ? ' (estimate)' : '';
        return '<li>A ' + pct + ' percent reduction is about ' + d.days + ' worker days, roughly $' + m.dollars.toLocaleString('en-US') + estTag + '.</li>';
      }).filter(function (s) { return s; }).join('');
      financialLines = '' +
        '<h3>Financial Scenario</h3>' +
        '<ul class="crs-financial-lines">' + lines + '</ul>' +
        '<p class="crs-note">This is a scenario based on the figures you provided, not a guarantee.</p>';
    }

    var exposureBlock = '';
    if (lwd.days !== null) {
      var estimatedTag = lwd.provenance === 'MODELED_ESTIMATE' ? ' (estimated)' : '';
      var tenPct = lwd.scenarios.filter(function (s) { return s.pct === 10; })[0];
      exposureBlock = '' +
        '<div class="crs-exposure-result">' +
          '<h3>Operational Exposure</h3>' +
          '<p>Estimated lost worker days: ' + lwd.days + ' per year' + estimatedTag + '.</p>' +
          (tenPct ? '<h3>Improvement Scenario</h3><p>A 10 percent reduction in average lost time duration would represent approximately ' + tenPct.days + ' worker days annually. This is not a performance claim; it is a way to size the opportunity.</p>' : '') +
          financialLines +
        '</div>';
    }

    return '' +
      '<section class="crs-panel crs-result">' +
        '<h2>Your Detailed Continuum Assessment</h2>' +
        '<p class="crs-score-line">' + scoreLine + '</p>' +
        strongestLine + gapLine +
        (priorities ? '<h3>Priority Opportunities</h3><ul class="crs-priorities">' + priorities + '</ul>' : '') +
        exposureBlock +
        '<p class="crs-note">This result is private to you and is not compared against any other organization.</p>' +
        saveOfferMarkup(2) +
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

  // Returns a number for a non-blank, numeric raw input value, otherwise
  // null (covers both an emptied field and non-numeric text). Used so a
  // cleared exact or financial field removes the stored value rather than
  // storing NaN or an empty string.
  function parsedNumberOrNull(raw) {
    if (raw === '' || raw === null || raw === undefined) return null;
    var n = Number(raw);
    return isNaN(n) ? null : n;
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
      state.exposure[id] = state.exposure[id] || {};
      if (t.value) state.exposure[id].band = t.value;
      else delete state.exposure[id].band;
      return;
    }
    if (t.matches && t.matches('input[data-exposure-exact]')) {
      var exId = t.getAttribute('data-exposure-exact');
      state.exposure[exId] = state.exposure[exId] || {};
      var exactNum = parsedNumberOrNull(t.value);
      if (exactNum !== null) state.exposure[exId].exact = exactNum;
      else delete state.exposure[exId].exact;
      return;
    }
    if (t.matches && t.matches('input[data-financial]')) {
      var fkey = t.getAttribute('data-financial');
      var finNum = parsedNumberOrNull(t.value);
      if (finNum !== null) state.financial[fkey] = finNum;
      else delete state.financial[fkey];
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
      state = { stage: 'intro', industry: null, answers: {}, exposure: {}, financial: {} };
    } else if (action === 'save-result') {
      handleSaveResult(parseInt(actionEl.getAttribute('data-stage-reached'), 10));
      return; // the save slot updates itself; nothing else on the page changes
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

  window.ContinuumAssessment = { buildResult: buildResult, persist: persist, saveResult: saveResult };
})();
