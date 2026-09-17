/* Continuum Prompt 61 psychological injury pathway.

   Intake through restrictions, duty match, modified duty, graduated
   hours, and closure. Symptom check-in is absent at schema level.
   Retained worker day records: duty acknowledgment, secure message,
   document upload, hours confirmation.

   No dashes anywhere. */

import { CASE_TYPE_PSYCHOLOGICAL_INJURY, acceptSymptomCheckIn, acceptRetainedSurface, surfacesFor } from "./prompt61_surfaces.mjs";
import { snapshotAtClaim, employerConductReport } from "./prompt61_conduct.mjs";
import { evaluateHoursStepDate, hoursLadderFromRestriction, recordPsychHours } from "./prompt61_hours.mjs";
import { matchPrompt61Duties } from "./prompt61_match.mjs";
import { assembleBoardEvidence } from "./prompt61_board_evidence.mjs";
import { persistentSupportLink } from "./prompt61_crisis.mjs";

export function openPsychologicalInjuryCase(input) {
  const src = input || {};
  const snapshot = snapshotAtClaim({
    captured_at: src.claim_date || src.opened_at || "2026-09-01",
    site: src.site || null,
    shift_pattern: src.shift_pattern || null,
    supervisor_ref: src.supervisor_ref || null,
  });
  return {
    case_ref: src.case_ref || "SYNTH-CASE-PSYCH-01",
    case_type: CASE_TYPE_PSYCHOLOGICAL_INJURY,
    claim_date: src.claim_date || "2026-09-01",
    status: "open",
    snapshot,
    restrictions: src.restrictions || [],
    events: src.events || [],
    duty_acks: [],
    messages: [],
    documents: [],
    hours_confirmations: [],
    symptom_checkins: [],
    surfaces: surfacesFor(CASE_TYPE_PSYCHOLOGICAL_INJURY),
    support_link: persistentSupportLink({ case_type: CASE_TYPE_PSYCHOLOGICAL_INJURY, region: src.region || "AB" }),
  };
}

export function rejectSymptomCheckIn(caseRow, payload) {
  return acceptSymptomCheckIn(caseRow && caseRow.case_type, payload);
}

export function recordDutyAck(caseRow, ack) {
  const gate = acceptRetainedSurface(caseRow.case_type, "morning_duty_acknowledgment", ack);
  if (!gate.accepted) return { case: caseRow, result: gate };
  const row = {
    at: ack && ack.at,
    duties_approved: (ack && ack.duties_approved) || [],
    duties_not_approved: (ack && ack.duties_not_approved) || [],
    hours_approved: ack && ack.hours_approved != null ? ack.hours_approved : "UNKNOWN",
    is_health_information: false,
  };
  return { case: { ...caseRow, duty_acks: (caseRow.duty_acks || []).concat([row]) }, result: { accepted: true, surface: "morning_duty_acknowledgment" } };
}

export function recordMessage(caseRow, msg) {
  const gate = acceptRetainedSurface(caseRow.case_type, "secure_messaging", msg);
  if (!gate.accepted) return { case: caseRow, result: gate };
  const row = {
    at: msg && msg.at,
    from_role: msg && msg.from_role,
    body: msg && msg.body,
    classification: null,
  };
  return { case: { ...caseRow, messages: (caseRow.messages || []).concat([row]) }, result: { accepted: true, surface: "secure_messaging" } };
}

export function recordDocument(caseRow, doc) {
  const gate = acceptRetainedSurface(caseRow.case_type, "document_upload", doc);
  if (!gate.accepted) return { case: caseRow, result: gate };
  const row = {
    at: doc && doc.at,
    filename: doc && doc.filename,
    is_health_information: false,
  };
  return { case: { ...caseRow, documents: (caseRow.documents || []).concat([row]) }, result: { accepted: true, surface: "document_upload" } };
}

export function recordHoursConfirmation(caseRow, hours) {
  const gate = acceptRetainedSurface(caseRow.case_type, "hours_confirmation", hours);
  if (!gate.accepted) return { case: caseRow, result: gate };
  const row = recordPsychHours(hours);
  return { case: { ...caseRow, hours_confirmations: (caseRow.hours_confirmations || []).concat([row]) }, result: { accepted: row.accepted, surface: "hours_confirmation" } };
}

export function applyRestrictions(caseRow, restrictions) {
  return { ...caseRow, restrictions: restrictions || [] };
}

export function matchCaseDuties(caseRow, duties, context) {
  return matchPrompt61Duties(duties, caseRow.restrictions, context);
}

export function closeCase(caseRow, at) {
  return { ...caseRow, status: "closed", closed_at: at || null };
}

export function walkPsychPathway(input) {
  let row = openPsychologicalInjuryCase(input);
  const symptom = rejectSymptomCheckIn(row, input && input.symptom_payload);
  row = applyRestrictions(row, (input && input.restrictions) || []);
  const match = matchCaseDuties(row, (input && input.duties) || [], input && input.match_context);
  const ack = recordDutyAck(row, (input && input.duty_ack) || { at: "2026-09-02", duties_approved: ["Visitor log entry"], hours_approved: 4 });
  row = ack.case;
  const msg = recordMessage(row, (input && input.message) || { at: "2026-09-02", from_role: "worker", body: "I confirmed today's duties." });
  row = msg.case;
  const doc = recordDocument(row, (input && input.document) || { at: "2026-09-02", filename: "SYNTH-letter.pdf" });
  row = doc.case;
  const hours = recordHoursConfirmation(row, (input && input.hours) || { date: "2026-09-02", hours: 4, source: "worker_confirmation" });
  row = hours.case;
  const hoursEval = evaluateHoursStepDate(
    hoursLadderFromRestriction((row.restrictions || []).find((r) => r.code === "graduated_hours") || { code: "graduated_hours" }),
    (input && input.asOfDate) || "2026-09-17"
  );
  const conduct = employerConductReport({
    claim_date: row.claim_date,
    asOf: (input && input.asOfDate) || "2026-09-17",
    snapshot: row.snapshot,
    contacts: (input && input.contacts) || [{ at: "2026-09-02" }],
    modified_role_discussed_at: (input && input.modified_role_discussed_at) || "2026-09-03",
    modified_role_offered_at: (input && input.modified_role_offered_at) || "2026-09-04",
    restriction_issued_at: (input && input.restriction_issued_at) || "2026-09-02",
    first_modified_shift_at: (input && input.first_modified_shift_at) || "2026-09-05",
    current_assignment: (input && input.current_assignment) || { site: row.snapshot.site, shift_pattern: "days", supervisor_ref: row.snapshot.supervisor_ref },
    hours_eval: hoursEval,
    actual_hours: row.hours_confirmations[0],
    events: row.events,
  });
  const evidence = assembleBoardEvidence(null, {
    worker_display_name: (input && input.worker_display_name) || "SYNTH Worker",
    claim_date: row.claim_date,
    restriction_codes: (row.restrictions || []).map((r) => r.code),
    hours_plan: hoursEval,
    modified_role_offered_at: conduct.modified_role_offered_at,
  });
  row = closeCase(row, (input && input.closed_at) || "2026-09-17");
  return {
    case: row,
    symptom_rejected: symptom.accepted === false,
    symptom_code: symptom.code,
    match,
    hours_eval: hoursEval,
    conduct,
    evidence,
    retained: {
      morning_duty_acknowledgment: ack.result.accepted,
      secure_messaging: msg.result.accepted,
      document_upload: doc.result.accepted,
      hours_confirmation: hours.result.accepted,
    },
    removed: row.surfaces.removed,
  };
}
