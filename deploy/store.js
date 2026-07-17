/* Continuum demo engine. Plain vanilla JS, no dependencies, no build step.
   Shared by /app (worker) and /hub (HSE, Employer, Nexus, WCB).
   Source of truth: specs/Continuum_MVP_Wireframe_Reference_v2.md and
   specs/CONTINUUM_PROMPT_06.md. Governed by Prompt 05.

   Design law enforced here, not just in the UI:
   - Five roles: worker, hse, employer_admin, wcb_officer, nexus_physician.
   - viewModel(role) is a projection that strips forbidden fields BEFORE
     returning, so a render bug cannot leak a field a role may not see.
   - Status machine transitions are guarded by (from, caller role); every
     transition appends to the in-store audit log.
   - No photo, no messaging in the demo (Prompt 06). No copy implies a live
     WCB API; WCB is document lifecycle tracking only.
*/
(function (global) {
  'use strict';

  var KEY = 'continuum_demo_state_v2';
  var EVENT = 'continuum:statechange';
  var SCHEMA_VERSION = 2;

  // ---- config (single source; Prompt 06 s5) ----
  var RED_FLAG_KEYWORDS = ['numb', 'tingling', 'sharp', 'worse at night', 'cannot sleep'];
  var PROGNOSIS_DAYS = 21;
  var ACTIVE_STATES = ['reported', 'off_work', 'light_duty', 'full_duty_pending'];

  // Allowed medical/return transitions: to -> {from, actor}. escalated and
  // reassess are handled by dedicated guarded calls below.
  var TRANSITIONS = [
    { from: 'reported', to: 'off_work', actor: 'system' },
    { from: 'off_work', to: 'light_duty', actor: 'nexus_physician' },
    { from: 'light_duty', to: 'full_duty_pending', actor: 'nexus_physician' },
    { from: 'full_duty_pending', to: 'signed_off', actor: 'employer_admin' }
  ];

  // ---- small helpers ----
  function iso(d) { return (d || new Date()).toISOString(); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function daysAgoIso(n) { var d = new Date(); d.setDate(d.getDate() - n); return iso(d); }
  function addDaysIso(baseIso, n) { var d = new Date(baseIso); d.setDate(d.getDate() + n); return iso(d); }

  // ---- seed ----
  // The reference doc fixes Marcus's static facts but not his day-9 check-in
  // numbers; those are a documented minimal interpretation (Prompt 06: "propose
  // the smallest faithful interpretation"). Baseline status is light_duty with
  // restrictions published and a short recovery history.
  function seed() {
    var injuryDateIso = daysAgoIso(9); // day 9 of recovery
    var marcusId = 'w_marcus';
    var restriction = 'No lifting above shoulder height';

    // Employer table: Marcus plus deterministic functional-only co-workers.
    // Clinical fields exist ONLY on Marcus, so nothing clinical can leak.
    var workers = [
      {
        id: marcusId, name: 'Marcus Bedard', job_title: 'Scaffolder', company: 'Worley',
        nexus_case_ref: 'NX-2026-00481',
        // functional (visible per matrix)
        body_part: 'Right shoulder', injury_type: 'msk_strain', status: 'light_duty',
        days_off: 2, doctor_visits: 2, rtw_progress: 0.43, restriction: restriction,
        estimated_return_date: addDaysIso(injuryDateIso, PROGNOSIS_DAYS),
        // clinical (Marcus only; stripped for non-clinical roles by viewModel)
        clinical: {
          diagnosis_summary: 'Grade 1 supraspinatus strain, right shoulder',
          diagnosis_notes: 'Moderate supraspinatus strain. Conservative management. Reassess day 14.',
          severity: 'moderate', prognosis_days: PROGNOSIS_DAYS, date_of_injury: injuryDateIso,
          physician: 'Dr. A. Owusu'
        }
      },
      { id: 'w_okafor', name: 'D. Okafor', job_title: 'Pipefitter', company: 'Worley', nexus_case_ref: 'NX-2026-00463', body_part: 'Lower back', injury_type: 'msk_strain', status: 'off_work', days_off: 5, doctor_visits: 1, rtw_progress: 0.12, restriction: 'Awaiting assessment' },
      { id: 'w_tremblay', name: 'S. Tremblay', job_title: 'Welder', company: 'Worley', nexus_case_ref: 'NX-2026-00470', body_part: 'Left wrist', injury_type: 'msk_strain', status: 'light_duty', days_off: 1, doctor_visits: 2, rtw_progress: 0.68, restriction: 'No repetitive gripping' },
      { id: 'w_novak', name: 'R. Novak', job_title: 'Electrician', company: 'Worley', nexus_case_ref: 'NX-2026-00452', body_part: 'Right knee', injury_type: 'msk_strain', status: 'full_duty_pending', days_off: 0, doctor_visits: 3, rtw_progress: 0.9, restriction: 'Cleared, pending employer confirm' },
      { id: 'w_singh_p', name: 'P. Singh', job_title: 'Rigger', company: 'Worley', nexus_case_ref: 'NX-2026-00448', body_part: 'Right ankle', injury_type: 'msk_strain', status: 'signed_off', days_off: 0, doctor_visits: 4, rtw_progress: 1, restriction: 'None' }
    ];

    return {
      schema_version: SCHEMA_VERSION,
      seeded_at: iso(),
      day: 9,
      consent: { granted: false, timestamp: null },
      case: {
        worker_id: marcusId,
        status: 'light_duty',
        prior_status: null,
        restrictions_published: [restriction],
        ffw_form: null // fitness-for-work form (rendered when full_duty_pending)
      },
      workers: workers,
      recovery_logs: [
        { injury_id: marcusId, logged_at: daysAgoIso(8), period: 'AM', pain_score: 7, mobility_score: 3, notes: '', source: 'app' },
        { injury_id: marcusId, logged_at: daysAgoIso(6), period: 'AM', pain_score: 6, mobility_score: 4, notes: '', source: 'app' },
        { injury_id: marcusId, logged_at: daysAgoIso(4), period: 'AM', pain_score: 5, mobility_score: 5, notes: 'Feeling steadier', source: 'app' },
        { injury_id: marcusId, logged_at: daysAgoIso(2), period: 'AM', pain_score: 4, mobility_score: 6, notes: '', source: 'app' },
        { injury_id: marcusId, logged_at: daysAgoIso(1), period: 'AM', pain_score: 4, mobility_score: 6, notes: '', source: 'app' }
      ],
      light_duties: [
        { id: 'ld_1', injury_id: marcusId, task_description: 'Tool crib inventory (seated)', medical_restrictions: restriction, assigned_by: 'hse', assigned_date: daysAgoIso(3), completed_date: daysAgoIso(1), worker_feedback: 'manageable' },
        { id: 'ld_2', injury_id: marcusId, task_description: 'Site walk permit checks', medical_restrictions: restriction, assigned_by: 'hse', assigned_date: daysAgoIso(1), completed_date: null, worker_feedback: null }
      ],
      wcb_notifications: [
        { id: 'wcb_1', injury_id: marcusId, type: 'initial', status: 'acknowledged', wcb_claim_number: 'NX-2026-00481', generated_at: daysAgoIso(9), submitted_at: daysAgoIso(9), acknowledged_at: daysAgoIso(8) },
        { id: 'wcb_2', injury_id: marcusId, type: 'light_duty', status: 'submitted', wcb_claim_number: 'NX-2026-00481', generated_at: daysAgoIso(4), submitted_at: daysAgoIso(4), acknowledged_at: null }
      ],
      escalations: [],
      audit_log: [
        { actor: 'system', action: 'transition', from: 'reported', to: 'off_work', at: daysAgoIso(9) },
        { actor: 'nexus_physician', action: 'transition', from: 'off_work', to: 'light_duty', at: daysAgoIso(4) }
      ]
    };
  }

  // ---- persistence + cross-tab reactivity ----
  function load() {
    var raw = null;
    try { raw = global.localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (!raw) { var s = seed(); persist(s); return s; }
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.schema_version !== SCHEMA_VERSION) { var f = seed(); persist(f); return f; }
      return parsed;
    } catch (e) { var g = seed(); persist(g); return g; }
  }

  function persist(state) {
    try { global.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  // Every write goes through save(): persist, then dispatch an in-page event.
  // The window 'storage' event covers OTHER tabs; the CustomEvent covers THIS tab.
  function save(state) {
    persist(state);
    try { global.dispatchEvent(new CustomEvent(EVENT, { detail: { state: state } })); } catch (e) {}
    return state;
  }

  // subscribe(fn): fires on in-page writes AND cross-tab storage events.
  // Callers should also re-read on visibilitychange and hashchange (view layer).
  function subscribe(fn) {
    function onLocal() { fn(load()); }
    function onStorage(e) { if (e.key === KEY) fn(load()); }
    global.addEventListener(EVENT, onLocal);
    global.addEventListener('storage', onStorage);
    return function unsubscribe() {
      global.removeEventListener(EVENT, onLocal);
      global.removeEventListener('storage', onStorage);
    };
  }

  // ---- audit ----
  function audit(state, entry) {
    entry.at = iso();
    state.audit_log.push(entry);
  }

  // ---- status machine ----
  function canTransition(from, to, actor) {
    for (var i = 0; i < TRANSITIONS.length; i++) {
      var t = TRANSITIONS[i];
      if (t.from === from && t.to === to && t.actor === actor) return true;
    }
    return false;
  }

  // Guarded transition. Rejects anything not in the table.
  function transition(to, actor) {
    var state = load();
    var from = state.case.status;
    if (!canTransition(from, to, actor)) {
      return { ok: false, error: 'Transition ' + from + ' -> ' + to + ' by ' + actor + ' is not allowed' };
    }
    state.case.prior_status = from;
    state.case.status = to;
    syncCaseWorker(state);
    audit(state, { actor: actor, action: 'transition', from: from, to: to });
    onEnter(state, to, actor);
    save(state);
    return { ok: true, state: state };
  }

  // Auto-actions on entry (Prompt 06 s4), each visible on some surface.
  function onEnter(state, to, actor) {
    if (to === 'off_work') {
      queueWcb(state, 'initial');
    } else if (to === 'light_duty') {
      if (!state.case.restrictions_published || !state.case.restrictions_published.length) {
        state.case.restrictions_published = [marcus(state).restriction || 'No lifting above shoulder height'];
      }
      queueWcb(state, 'light_duty');
    } else if (to === 'full_duty_pending') {
      state.case.ffw_form = generateFfw(state);
    } else if (to === 'signed_off') {
      queueWcb(state, 'full_duty', state.case.ffw_form);
      marcus(state).rtw_progress = 1;
    }
  }

  function generateFfw(state) {
    var m = marcus(state);
    return {
      title: 'Fitness for Work',
      case_ref: m.nexus_case_ref,
      worker: m.name,
      employer: m.company,
      physician: (m.clinical && m.clinical.physician) || 'Dr. A. Owusu',
      body_part: m.body_part,
      determination: 'Fit for full duties',
      generated_at: iso(),
      note: 'Rendered document view. Not a real PDF. Document lifecycle tracking only.'
    };
  }

  // ---- WCB document lifecycle (no transmission; tracking only) ----
  function queueWcb(state, type, attachment) {
    var id = 'wcb_' + (state.wcb_notifications.length + 1);
    state.wcb_notifications.push({
      id: id, injury_id: marcus(state).id, type: type, status: 'generated',
      wcb_claim_number: marcus(state).nexus_case_ref, generated_at: iso(),
      submitted_at: null, acknowledged_at: null, attachment: attachment || null
    });
  }
  function markWcb(id, status) { // 'submitted' | 'acknowledged'
    var state = load();
    for (var i = 0; i < state.wcb_notifications.length; i++) {
      var n = state.wcb_notifications[i];
      if (n.id === id) {
        n.status = status;
        if (status === 'submitted') n.submitted_at = iso();
        if (status === 'acknowledged') n.acknowledged_at = iso();
        audit(state, { actor: 'wcb_officer', action: 'wcb_' + status, from: id, to: status });
      }
    }
    return save(state);
  }

  // ---- clinical actions (nexus only) ----
  function publishRestrictions(restrictions, actor) {
    if (actor !== 'nexus_physician') return { ok: false, error: 'Only Nexus Health sets restrictions' };
    var state = load();
    state.case.restrictions_published = restrictions.slice();
    marcus(state).restriction = restrictions[0] || marcus(state).restriction;
    audit(state, { actor: actor, action: 'publish_restrictions', from: null, to: restrictions.join('; ') });
    save(state);
    return { ok: true, state: state };
  }

  // escalated -> prior_status, nexus only (reassess)
  function reassess(actor) {
    if (actor !== 'nexus_physician') return { ok: false, error: 'Only Nexus Health reassesses' };
    var state = load();
    if (state.case.status !== 'escalated') return { ok: false, error: 'Case is not escalated' };
    var to = state.case.prior_status || 'light_duty';
    var from = 'escalated';
    state.case.status = to;
    state.case.prior_status = null;
    for (var i = 0; i < state.escalations.length; i++) { if (state.escalations[i].open) state.escalations[i].open = false; }
    syncCaseWorker(state);
    audit(state, { actor: actor, action: 'reassess', from: from, to: to });
    save(state);
    return { ok: true, state: state };
  }

  // ---- employer action ----
  function confirmReturn(actor) { return transition('signed_off', actor); }

  // ---- HSE light duties ----
  function assignDuty(task_description, actor) {
    if (actor !== 'hse' && actor !== 'employer_admin') return { ok: false, error: 'Only HSE or Employer assign duties' };
    var state = load();
    if (state.case.status !== 'light_duty') return { ok: false, error: 'Duties valid only in light_duty' };
    state.light_duties.push({
      id: 'ld_' + (state.light_duties.length + 1), injury_id: marcus(state).id,
      task_description: task_description, medical_restrictions: state.case.restrictions_published[0] || '',
      assigned_by: actor, assigned_date: iso(), completed_date: null, worker_feedback: null
    });
    audit(state, { actor: actor, action: 'assign_duty', from: null, to: task_description });
    return save(state);
  }
  function completeDuty(id, feedback) {
    var state = load();
    for (var i = 0; i < state.light_duties.length; i++) {
      if (state.light_duties[i].id === id) {
        state.light_duties[i].completed_date = iso();
        state.light_duties[i].worker_feedback = feedback || 'done';
      }
    }
    audit(state, { actor: 'worker', action: 'complete_duty', from: id, to: feedback || 'done' });
    return save(state);
  }

  // ---- worker: consent + check-in + escalation ----
  function grantConsent() {
    var state = load();
    state.consent = { granted: true, timestamp: iso() };
    audit(state, { actor: 'worker', action: 'consent_granted', from: null, to: 'granted' });
    return save(state);
  }
  function revokeConsent() {
    var state = load();
    state.consent = { granted: false, timestamp: iso() };
    audit(state, { actor: 'worker', action: 'consent_revoked', from: 'granted', to: 'revoked' });
    return save(state);
  }

  function submitCheckIn(entry) {
    var state = load();
    if (!state.consent.granted) return { ok: false, error: 'Consent required before data entry' };
    var log = {
      injury_id: marcus(state).id, logged_at: iso(), period: entry.period || 'AM',
      pain_score: clampScore(entry.pain), mobility_score: clampScore(entry.mobility),
      notes: (entry.notes || ''), source: 'app'
    };
    state.recovery_logs.push(log);

    // reported -> off_work on first ever check-in (system)
    if (state.case.status === 'reported') {
      state.case.prior_status = 'reported';
      state.case.status = 'off_work';
      syncCaseWorker(state);
      audit(state, { actor: 'system', action: 'transition', from: 'reported', to: 'off_work' });
      onEnter(state, 'off_work', 'system');
    }

    var esc = evaluateEscalation(state);
    if (esc && ACTIVE_STATES.indexOf(state.case.status) !== -1 && state.case.status !== 'escalated') {
      raiseEscalation(state, esc);
    }
    save(state);
    return { ok: true, state: state, escalated: !!esc, trigger: esc };
  }

  function clampScore(n) { n = Number(n); if (isNaN(n)) return 0; return Math.max(0, Math.min(10, Math.round(n))); }

  // Escalation engine (Prompt 06 s5): three rules, evaluated on every submit.
  function evaluateEscalation(state) {
    var logs = marcusLogs(state);
    // Rule 1: pain >= 8 for 3 consecutive check-ins.
    if (logs.length >= 3) {
      var last3 = logs.slice(-3);
      if (last3.every(function (l) { return l.pain_score >= 8; })) return 'Pain 8 or higher for 3 consecutive check-ins';
    }
    // Rule 2: mobility declining across 2+ consecutive check-ins.
    if (logs.length >= 3) {
      var a = logs[logs.length - 3], b = logs[logs.length - 2], c = logs[logs.length - 1];
      if (c.mobility_score < b.mobility_score && b.mobility_score < a.mobility_score) return 'Mobility declining across 2 or more days';
    }
    // Rule 3: red-flag keyword in the latest note.
    var latest = logs[logs.length - 1];
    if (latest && latest.notes) {
      var low = latest.notes.toLowerCase();
      for (var i = 0; i < RED_FLAG_KEYWORDS.length; i++) {
        if (low.indexOf(RED_FLAG_KEYWORDS[i]) !== -1) return 'Red-flag keyword in notes: ' + RED_FLAG_KEYWORDS[i];
      }
    }
    return null;
  }

  function raiseEscalation(state, triggerText) {
    state.case.prior_status = state.case.status;
    state.case.status = 'escalated';
    syncCaseWorker(state);
    state.escalations.push({ id: 'esc_' + (state.escalations.length + 1), injury_id: marcus(state).id, trigger: triggerText, notified: 'nexus', open: true, at: iso() });
    audit(state, { actor: 'system', action: 'escalation', from: state.case.prior_status, to: 'escalated' });
  }

  // ---- reset + presenter controls (Prompt 06 s5) ----
  function reset() { return save(seed()); }
  function seedDay9() { return reset(); }
  function seedEscalationReady() {
    // One bad check-in away from firing rule 1: two consecutive pain-8 logs.
    var state = seed();
    var id = 'w_marcus';
    state.recovery_logs = state.recovery_logs.concat([
      { injury_id: id, logged_at: daysAgoIso(1), period: 'AM', pain_score: 8, mobility_score: 3, notes: '', source: 'app' },
      { injury_id: id, logged_at: daysAgoIso(0), period: 'PM', pain_score: 8, mobility_score: 3, notes: '', source: 'app' }
    ]);
    return save(state);
  }
  function advanceDay() {
    var state = load();
    state.day = (state.day || 9) + 1;
    audit(state, { actor: 'system', action: 'advance_day', from: state.day - 1, to: state.day });
    return save(state);
  }

  // ---- internal helpers on state ----
  function marcus(state) {
    for (var i = 0; i < state.workers.length; i++) { if (state.workers[i].id === state.case.worker_id) return state.workers[i]; }
    return state.workers[0];
  }
  function marcusLogs(state) { var id = state.case.worker_id; return state.recovery_logs.filter(function (l) { return l.injury_id === id; }); }
  function syncCaseWorker(state) { marcus(state).status = state.case.status === 'escalated' ? (state.case.prior_status || 'light_duty') : state.case.status; }

  // ---- VIEW-MODEL PROJECTIONS (the privacy boundary; strip before return) ----
  // Field-level visibility matrix, reference doc s7. Forbidden fields are never
  // included in the returned object, so a render bug cannot leak them.
  function functionalWorker(w) {
    return {
      id: w.id, name: w.name, job_title: w.job_title, company: w.company,
      nexus_case_ref: w.nexus_case_ref, body_part: w.body_part, injury_type: w.injury_type,
      status: w.status, days_off: w.days_off, doctor_visits: w.doctor_visits,
      rtw_progress: w.rtw_progress, restriction: w.restriction, estimated_return_date: w.estimated_return_date
    };
  }
  function scoredWorker(w, logs) {
    var f = functionalWorker(w);
    var mine = logs.filter(function (l) { return l.injury_id === w.id; });
    var latest = mine[mine.length - 1] || null;
    f.pain_score = latest ? latest.pain_score : null;
    f.mobility_score = latest ? latest.mobility_score : null;
    f.score_history = mine.map(function (l) { return { logged_at: l.logged_at, pain_score: l.pain_score, mobility_score: l.mobility_score }; });
    return f; // still NO diagnosis, NO free text, NO photos
  }
  function kpis(workers) {
    var active = workers.filter(function (w) { return w.status !== 'signed_off'; });
    return {
      active: active.length,
      light_duty: workers.filter(function (w) { return w.status === 'light_duty'; }).length,
      off_work: workers.filter(function (w) { return w.status === 'off_work'; }).length,
      pending_return: workers.filter(function (w) { return w.status === 'full_duty_pending'; }).length,
      signed_off: workers.filter(function (w) { return w.status === 'signed_off'; }).length,
      rtw_rate: workers.length ? Math.round(100 * workers.filter(function (w) { return w.status === 'signed_off'; }).length / workers.length) : 0
    };
  }

  function viewModel(role) {
    var s = load();
    var m = marcus(s);
    // WCB notifications are NOT in the shared base: only the WCB and Nexus
    // view-models carry them, on a need-to-know basis.
    var base = { role: role, day: s.day, case_status: s.case.status, restrictions: s.case.restrictions_published.slice() };

    if (role === 'worker') {
      return Object.assign(base, {
        consent: s.consent,
        me: { name: m.name, job_title: m.job_title, body_part: m.body_part, status: s.case.status, day: s.day, of: PROGNOSIS_DAYS, estimated_return_date: m.estimated_return_date, diagnosis_summary: m.clinical ? m.clinical.diagnosis_summary : null },
        check_ins: marcusLogs(s),
        duties: s.light_duties.slice()
      });
    }
    if (role === 'employer_admin') {
      // functional ONLY. No pain, mobility, diagnosis, free text, photos.
      return Object.assign(base, {
        kpis: kpis(s.workers),
        workers: s.workers.map(functionalWorker),
        can_confirm_return: s.case.status === 'full_duty_pending'
      });
    }
    if (role === 'hse') {
      // scores YES; no diagnosis notes, no free text, no photos.
      return Object.assign(base, {
        workers: s.workers.map(function (w) { return scoredWorker(w, s.recovery_logs); }),
        duties: s.light_duties.slice(),
        restrictions_readonly: s.case.restrictions_published.slice()
      });
    }
    if (role === 'wcb_officer') {
      // read-only claims; scores per matrix; no diagnosis notes, no free text.
      return Object.assign(base, {
        claims: s.workers.map(function (w) { return scoredWorker(w, s.recovery_logs); }),
        notifications: s.wcb_notifications.slice()
      });
    }
    if (role === 'nexus_physician') {
      // full medical detail.
      return Object.assign(base, {
        patient: { name: m.name, body_part: m.body_part, injury_type: m.injury_type, clinical: m.clinical, status: s.case.status, prior_status: s.case.prior_status },
        check_ins: marcusLogs(s),
        escalations: s.escalations.slice(),
        ffw_form: s.case.ffw_form,
        wcb: s.wcb_notifications.slice(),
        patients: s.workers.map(function (w) { return scoredWorker(w, s.recovery_logs); })
      });
    }
    return base;
  }

  global.ContinuumStore = {
    KEY: KEY, EVENT: EVENT, SCHEMA_VERSION: SCHEMA_VERSION,
    RED_FLAG_KEYWORDS: RED_FLAG_KEYWORDS, PROGNOSIS_DAYS: PROGNOSIS_DAYS,
    seed: seed, load: load, save: save, subscribe: subscribe,
    transition: transition, canTransition: canTransition, reassess: reassess,
    publishRestrictions: publishRestrictions, confirmReturn: confirmReturn,
    assignDuty: assignDuty, completeDuty: completeDuty,
    grantConsent: grantConsent, revokeConsent: revokeConsent, submitCheckIn: submitCheckIn,
    evaluateEscalation: evaluateEscalation, markWcb: markWcb,
    reset: reset, seedDay9: seedDay9, seedEscalationReady: seedEscalationReady, advanceDay: advanceDay,
    viewModel: viewModel
  };
})(typeof window !== 'undefined' ? window : this);
