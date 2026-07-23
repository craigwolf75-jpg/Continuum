/* CONTINUUM 38A: the Garda configuration layer, as executable logic.
   Implements every Prompt 38 item that is pure logic, so the wiring into the
   portal artifacts (when they are in session) is binding, not building.
   House rules hold: walls are code, escalation vocabulary is verbatim,
   nothing here claims a connection that does not exist. No em-dashes anywhere. */

(function () {
  'use strict';

  var C38A = {
    VERSION: '38a-1',
    ROUTING_PHRASE: 'escalated to the clinician per program rules',
  };

  /* ---------- P38-01: division-aware model ---------- */

  C38A.registerDivisions = function (names) {
    var errors = [];
    var clean = [];
    var seen = Object.create(null);
    (names || []).forEach(function (n) {
      var v = String(n || '').trim();
      if (!v) { errors.push('empty division name'); return; }
      var key = v.toLowerCase();
      if (seen[key]) { errors.push('duplicate division: ' + v); return; }
      seen[key] = true;
      clean.push(v);
    });
    if (!clean.length) errors.push('at least one division is required');
    return { ok: errors.length === 0, divisions: clean, errors: errors };
  };

  /* ---------- P38-04 with P38-01: pilot scope ---------- */

  C38A.MSK_CATEGORIES = ['strain_or_sprain', 'repetitive_motion'];

  C38A.validatePilotScope = function (scope, registeredDivisions) {
    var errors = [];
    if (!scope) return { ok: false, errors: ['scope is required'] };
    var divs = registeredDivisions || [];
    if (scope.province !== 'ON') errors.push('pilot province must be ON per the July 23 agreement');
    if (!scope.division || divs.indexOf(scope.division) === -1) errors.push('pilot division must be exactly one registered division');
    if (scope.injury_scope !== 'MSK') errors.push('pilot injury scope must be MSK per the July 23 agreement');
    if (scope.duration_days !== 90) errors.push('pilot duration must be 90 days per the July 23 agreement');
    if (scope.start_date) errors.push('no pilot start date was specified in the meeting; the start date field must stay empty until Andree-Anne\'s review sets one');
    return { ok: errors.length === 0, errors: errors };
  };

  C38A.intakeDecision = function (category, scope) {
    if (C38A.MSK_CATEGORIES.indexOf(category) !== -1) {
      return { eligible: true, route: 'continuum_coordination' };
    }
    return {
      eligible: false,
      route: 'existing_process',
      note: 'Outside the pilot\'s MSK scope; handled by the existing process during the pilot.',
    };
  };

  /* ---------- P38-05: post-Form-7 intake trigger ---------- */

  C38A.validateIntake = function (record, scope, registeredDivisions) {
    var errors = [];
    if (!record) return { ok: false, errors: ['record is required'] };
    ['claim_number', 'board_report_filed_date', 'injury_category', 'division', 'province'].forEach(function (f) {
      if (!record[f]) errors.push('missing required intake field: ' + f + ' (Continuum begins after the employer report is filed, so filing facts are first-class at intake)');
    });
    if (errors.length) return { ok: false, errors: errors };
    var sv = C38A.validatePilotScope(scope, registeredDivisions);
    if (!sv.ok) return { ok: false, errors: ['pilot scope invalid: ' + sv.errors.join('; ')] };
    if (record.division !== scope.division || record.province !== scope.province) {
      errors.push('intake outside the pilot division or province routes to the existing process');
    }
    var d = C38A.intakeDecision(record.injury_category, scope);
    return { ok: errors.length === 0 && d.eligible, errors: errors, decision: d };
  };

  /* ---------- P38-03: objective-first check-in preset, wall enforced ---------- */

  C38A.CLINICAL_FIELDS = ['pain', 'pain_score', 'diagnosis', 'medical_notes', 'symptoms', 'restrictions_raw'];

  /* Stems match per underscore/dash/space/case segment, so singular and plural
     forms and common abbreviations are all caught (symptom/symptoms, note/notes,
     restriction/restrictions_raw, diagnos/dx/icd, pain/ache/soreness) while a
     functional field name is never a false positive. */
  C38A.CLINICAL_STEMS = ['pain', 'ache', 'soreness', 'discomfort', 'diagnos', 'dx', 'icd', 'symptom', 'medical', 'treatment', 'medication', 'prescription', 'clinical', 'disabilit', 'note', 'restrict'];

  function segments(name) {
    return String(name).replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  }
  function hasClinical(name) {
    var segs = segments(name);
    return segs.some(function (seg) {
      return C38A.CLINICAL_STEMS.some(function (st) { return seg.indexOf(st) === 0; });
    });
  }
  C38A.hasClinical = hasClinical;

  /* The employer view is an allowlist, the safest wall: only known functional
     fields can appear, so no clinical field and no mobility can reach the
     generic employer surface whatever a preset claims (13b bridge wall). */
  C38A.EMPLOYER_ALLOWED_FIELDS = ['duty_completion', 'checkin_streak', 'rtw_status', 'safe_duties', 'absence_status', 'claim_paperwork_state'];

  C38A.CHECKIN_PRESETS = {
    objective_first: {
      worker_questions: ['mobility_score', 'duties_completed', 'work_feel'],
      clinical_signals: ['pain'], /* pain stays clinical-side only and still drives the pain-8 escalation */
      employer_visible: ['duty_completion', 'checkin_streak'],
      claims_visible: ['mobility_trend', 'duty_completion', 'checkin_streak'],
    },
  };

  C38A.employerViewFields = function (preset) {
    return ((preset && preset.employer_visible) || []).filter(function (f) {
      return C38A.EMPLOYER_ALLOWED_FIELDS.indexOf(f) !== -1;
    });
  };

  /* Angelina's claims and HSSE hybrid seat is clinical-adjacent and legitimately
     carries functional mobility analytics; it never carries a raw clinical field. */
  C38A.claimsViewFields = function (preset) {
    return ((preset && preset.claims_visible) || []).filter(function (f) { return !hasClinical(f); });
  };

  /* ---------- P38-02: hybrid role composition, wall preserved ---------- */

  C38A.SEAT_FIELDS = {
    employer: ['rtw_status', 'safe_duties', 'absence_status', 'claim_paperwork_state'],
    hsse: ['case_stage', 'checkin_streak', 'duty_completion', 'mobility_trend', 'next_action', 'escalation_state'],
  };

  C38A.composeRoles = function (seats) {
    var fields = {};
    var errors = [];
    (seats || []).forEach(function (s) {
      var set = C38A.SEAT_FIELDS[s];
      if (!set) { errors.push('unknown seat: ' + s); return; }
      set.forEach(function (f) { fields[f] = true; });
    });
    var out = Object.keys(fields);
    /* Composition can widen convenience, never the wall: no clinical field
       survives composition, whatever seats were combined. Mobility rides through
       for the clinical-grade hybrid seat, which is correct; a raw clinical field
       (by any singular, plural, or abbreviated name) is stripped. */
    out = out.filter(function (f) { return !hasClinical(f); });
    return { ok: errors.length === 0, fields: out, errors: errors };
  };

  /* ---------- P38-07: universal modified duties offer ---------- */

  C38A.makeUniversalOffer = function (tenantOfferItems, workerId, nowIso) {
    var errors = [];
    if (!Array.isArray(tenantOfferItems) || !tenantOfferItems.length) errors.push('the tenant\'s universal offer needs at least one item');
    if (!workerId) errors.push('workerId is required');
    if (errors.length) return { ok: false, errors: errors };
    return {
      ok: true,
      offer: {
        worker_id: workerId,
        items: tenantOfferItems.slice(),
        offered_at: nowIso,
        response: null,
        responded_at: null,
      },
    };
  };

  C38A.recordOfferResponse = function (offer, response, nowIso) {
    if (!offer || offer.response) {
      return { ok: false, errors: ['offer missing or already answered; a signed response is recorded once'] };
    }
    if (response !== 'accepted' && response !== 'declined') {
      return { ok: false, errors: ['response must be accepted or declined'] };
    }
    offer.response = response;
    offer.responded_at = nowIso;
    return { ok: true, offer: offer };
  };

  /* ---------- P38-09: check-in lapse nudges, functional content only ---------- */

  C38A.computeNudges = function (cases, nowIso, thresholdDays) {
    var t = thresholdDays == null ? 3 : thresholdDays;
    var now = new Date(nowIso).getTime();
    var out = [];
    (cases || []).forEach(function (c) {
      if (!c || !c.worker_id || !c.last_checkin_at) return;
      var days = Math.floor((now - new Date(c.last_checkin_at).getTime()) / 86400000);
      if (isFinite(days) && days >= t) {
        out.push({
          worker_id: c.worker_id,
          days_since_checkin: days,
          message: 'Has not checked in for ' + days + ' days. Consider giving them a call.',
          audience: 'claims_or_hsse_team',
        });
      }
    });
    return out;
  };

  /* ---------- P38-14: pilot event metering ---------- */

  C38A.countBillableEvents = function (cases, scope, registeredDivisions) {
    var sv = C38A.validatePilotScope(scope, registeredDivisions);
    if (!sv.ok) return { ok: false, errors: sv.errors, count: 0 };
    /* A case counts once if ANY of its rows qualifies (eligible MSK, in the
       pilot division and province, entered coordination). Collecting qualifying
       case ids into a set makes the count order-independent, so an event log
       that records intake before coordination is counted correctly. */
    var qualified = Object.create(null);
    (cases || []).forEach(function (c) {
      if (!c || !c.case_id) return;
      var d = C38A.intakeDecision(c.injury_category, scope);
      if (d.eligible && c.division === scope.division && c.province === scope.province && c.entered_coordination_at) {
        qualified[c.case_id] = true;
      }
    });
    return { ok: true, count: Object.keys(qualified).length, definition: 'an eligible MSK case in the pilot division that entered coordination' };
  };

  if (typeof window !== 'undefined') window.CONTINUUM_38A = C38A;
  if (typeof module !== 'undefined' && module.exports) module.exports = C38A;
})();
