/* Continuum Prompt 60 Section 5: task-linked check-in / provocation.

   NOT pain or mobility reuse. Twenty-four hour settle boundary ONLY.
   Nothing is summed, averaged, weighted, graded, banded, scored, or
   colour coded. No sort or rank of workers by check-in content.

   Face text is Calliope CHECK_IN_COPY, character for character.
   Visibility is a server-side projection, not a CSS hide.
   No dashes anywhere. */

import { approvedHoursFace } from "./prompt60_hours_ladder.mjs";
import { employerPrompt60Leak } from "./employer_schema.mjs";

export const CLINICIAN_REQUIRED_LINE =
  "The treating physician makes every medical and return to work decision.";
export const CLINICIAN_VISIBILITY_LINE =
  "Surfaces for the doctor to review. This is not a recommendation.";
export const CLINICIAN_TABLE_LABEL = "Routed record for review";
export const CLINICIAN_EMPTY = "No check-in is on file for this date.";
export const WORKER_REPORTED_LABEL = "worker reported";

export const COORDINATOR_UNSETTLED_24H =
  "A worsening was reported and did not settle within 24 hours. Per program rules, make contact. Check that the current assignment still matches the current restrictions.";
export const COORDINATOR_UNANSWERED_FOLLOW_UP =
  "A follow-up is unanswered. Per program rules, make contact. Check that the current assignment still matches the current restrictions.";
export const COORDINATOR_HOURS_HOLD =
  "The planned hours step date has passed. The plan holds. Outstanding action: clinician authorisation is still needed.";
export const COORDINATOR_MAKE_CONTACT = "Make contact";

export const EMPLOYER_STATUS = Object.freeze([
  "Duties on track",
  "Duty plan under review",
  "Awaiting clinical review",
]);
export const EMPLOYER_SAFE_HEADING = "Work that is safe on the current plan";
export const EMPLOYER_SAFE_EMPTY = "No safe duties are on the current plan.";
export const EMPLOYER_LIST_EXPIRED = "This duty list is past its review date. Do not assign from it.";

export const SYNTH_CHECKIN_DUTIES = Object.freeze([
  { duty_id: "SYNTH-DUTY-0101", duty_name: "Gatehouse monitoring", fixture: true },
  { duty_id: "SYNTH-DUTY-0201", duty_name: "Yard foot patrol", fixture: true },
  { duty_id: "SYNTH-DUTY-0302", duty_name: "Light bin sorting", fixture: true },
]);

function yn(v) {
  if (v === true || v === "yes") return "yes";
  if (v === false || v === "no") return "no";
  return null;
}

export function captureCheckIn(input, cached, fallbackDuties) {
  const src = input || cached || null;
  const planDuties = (src && src.plan_duties) || fallbackDuties || SYNTH_CHECKIN_DUTIES;
  if (!src) {
    return {
      date: null,
      duties_performed: [],
      worsened_duties: [],
      settled_end_of_shift: null,
      approved_hours: "UNKNOWN",
      hours_worked: null,
      free_text: null,
      plan_duties: planDuties,
    };
  }
  const allowed = new Set((planDuties || []).map((d) => d.duty_name || d));
  const performed = (src.duties_performed || []).filter((n) => allowed.has(n));
  const worsened = performed.length === 0
    ? []
    : (src.worsened_duties || []).filter((n) => performed.includes(n));
  const settled = worsened.length === 0 ? null : yn(src.settled_end_of_shift);
  return {
    date: src.date || null,
    duties_performed: performed,
    worsened_duties: worsened,
    settled_end_of_shift: settled,
    approved_hours: src.approved_hours == null || src.approved_hours === "" ? "UNKNOWN" : src.approved_hours,
    hours_worked: src.hours_worked != null ? src.hours_worked : null,
    hours_source: src.hours_source === "roster" || src.hours_source === "worker_checkin" ? src.hours_source : "worker_checkin",
    free_text: src.free_text != null && String(src.free_text).trim() !== "" ? src.free_text : null,
    plan_duties: planDuties,
  };
}

export function provocationRecords(checkin) {
  const row = checkin || {};
  const date = row.date || null;
  const performed = row.duties_performed || [];
  const worsened = new Set(row.worsened_duties || []);
  const settled = row.settled_end_of_shift;
  return performed.map((duty) => {
    const w = worsened.has(duty) ? "yes" : "no";
    let settled_within_24h = "unanswered";
    if (w === "no") settled_within_24h = "yes";
    else if (settled === "yes") settled_within_24h = "yes";
    else if (settled === "no") settled_within_24h = "no";
    return { duty, date, worsened: w, settled_within_24h };
  });
}

export function followUpNeeded(checkin) {
  const recs = provocationRecords(checkin);
  const follow = (checkin && checkin.follow_ups) || {};
  return recs.filter((r) => r.worsened === "yes" && r.settled_within_24h === "no" && !follow[r.duty]);
}

export function followUpQuestion(dutyName) {
  return "Yesterday you said " + dutyName + " made your symptoms worse. Has that now settled?";
}

export function applyFollowUp(checkin, answer, asOfDate) {
  const needed = followUpNeeded(checkin);
  if (!needed.length) return { checkin, records: provocationRecords(checkin), unanswered: [] };
  const next = { ...(checkin || {}), follow_ups: { ...((checkin && checkin.follow_ups) || {}) } };
  const unanswered = [];
  for (const rec of needed) {
    const a = answer && answer[rec.duty];
    if (a === "yes" || a === "no") {
      next.follow_ups[rec.duty] = { settled: a, date: asOfDate || null };
    } else {
      next.follow_ups[rec.duty] = { settled: "unanswered", date: asOfDate || null };
      unanswered.push({
        duty: rec.duty,
        date: rec.date,
        state: "unanswered",
        outstanding_action: COORDINATOR_UNANSWERED_FOLLOW_UP,
      });
    }
  }
  return { checkin: next, records: orderedProvocationWithFollowUp(next), unanswered };
}

export function orderedProvocationWithFollowUp(checkin) {
  const recs = provocationRecords(checkin);
  const follow = (checkin && checkin.follow_ups) || {};
  return recs.map((r) => {
    if (r.worsened !== "yes") return r;
    const f = follow[r.duty];
    if (f && f.settled === "yes") return { ...r, settled_within_24h: "yes" };
    if (f && f.settled === "no") return { ...r, settled_within_24h: "no" };
    if (f && f.settled === "unanswered") return { ...r, settled_within_24h: "unanswered" };
    return r;
  });
}

export function clinicianProjection(checkins, hoursPlan) {
  const rows = (checkins || []).map((c) => {
    const recs = orderedProvocationWithFollowUp(c);
    const worsened = recs.filter((r) => r.worsened === "yes").map((r) => r.duty);
    const settleEnd = c.settled_end_of_shift == null ? null : (c.settled_end_of_shift === "yes" ? "Yes" : "No");
    const nextDay = recs.some((r) => r.worsened === "yes" && r.settled_within_24h === "unanswered")
      ? "unanswered"
      : recs.some((r) => r.worsened === "yes" && r.settled_within_24h === "no")
        ? "No"
        : recs.some((r) => r.worsened === "yes" && r.settled_within_24h === "yes")
          ? "Yes"
          : null;
    return {
      date: c.date || null,
      duties_performed: c.duties_performed || [],
      duties_worsened: worsened,
      settled_by_end_of_shift: settleEnd,
      approved_hours: approvedHoursFace(c.approved_hours === "UNKNOWN" ? null : c.approved_hours),
      hours_worked: c.hours_worked != null ? c.hours_worked : null,
      next_day_settle: nextDay,
      free_text: c.free_text || null,
      free_text_label: WORKER_REPORTED_LABEL,
    };
  });
  return {
    label: CLINICIAN_TABLE_LABEL,
    required_line: CLINICIAN_REQUIRED_LINE,
    visibility_line: CLINICIAN_VISIBILITY_LINE,
    columns: [
      "Date",
      "Duties performed",
      "Duties the worker said made symptoms worse",
      "Settled by end of shift",
      "Approved hours / hours worked",
      "Next-day settle",
      WORKER_REPORTED_LABEL,
    ],
    rows,
    empty: CLINICIAN_EMPTY,
    hours_plan: hoursPlan || null,
  };
}

export function coordinatorProjection(checkins, hoursHold) {
  const prompts = [];
  for (const c of checkins || []) {
    const recs = orderedProvocationWithFollowUp(c);
    const follow = (c && c.follow_ups) || {};
    const unsettled = recs.some((r) => r.worsened === "yes" && follow[r.duty] && follow[r.duty].settled === "no");
    const unanswered = recs.some((r) => r.worsened === "yes" && r.settled_within_24h === "unanswered");
    if (unsettled) {
      prompts.push({ kind: "unsettled_24h", date: c.date, text: COORDINATOR_UNSETTLED_24H, action: COORDINATOR_MAKE_CONTACT });
    }
    if (unanswered) {
      prompts.push({ kind: "unanswered_follow_up", date: c.date, text: COORDINATOR_UNANSWERED_FOLLOW_UP, action: COORDINATOR_MAKE_CONTACT });
    }
  }
  if (hoursHold) {
    prompts.push({ kind: "hours_hold", date: null, text: COORDINATOR_HOURS_HOLD, action: COORDINATOR_MAKE_CONTACT });
  }
  return { prompts };
}

export function employerProjection(safeDuties, statusLine, approvedHours, listExpired) {
  const duties = Array.isArray(safeDuties) ? safeDuties : [];
  const payload = {
    status: EMPLOYER_STATUS.includes(statusLine) ? statusLine : "Duty plan under review",
    safe_duty_heading: EMPLOYER_SAFE_HEADING,
    safe_duties: duties.map((d) => ({ duty_id: d.duty_id, duty_name: d.duty_name, verdict: "safe" })),
    safe_empty: duties.length ? null : EMPLOYER_SAFE_EMPTY,
    list_expired: listExpired ? EMPLOYER_LIST_EXPIRED : null,
    approved_hours: approvedHoursFace(approvedHours),
  };
  return payload;
}

export function assertEmployerCheckinWall(payload) {
  return employerPrompt60Leak(payload);
}

function uneventful(date) {
  return captureCheckIn({
    date,
    duties_performed: ["Gatehouse monitoring"],
    worsened_duties: [],
    settled_end_of_shift: null,
    approved_hours: 4,
    hours_worked: 4,
    hours_source: "worker_checkin",
    plan_duties: SYNTH_CHECKIN_DUTIES,
  });
}

export function sevenDayFixture() {
  const day10 = captureCheckIn({
    date: "2026-09-10",
    duties_performed: ["Yard foot patrol"],
    worsened_duties: ["Yard foot patrol"],
    settled_end_of_shift: "yes",
    approved_hours: 4,
    hours_worked: 4,
    hours_source: "worker_checkin",
    plan_duties: SYNTH_CHECKIN_DUTIES,
  });
  const day11 = uneventful("2026-09-11");
  const day12raw = captureCheckIn({
    date: "2026-09-12",
    duties_performed: ["Gatehouse monitoring"],
    worsened_duties: ["Gatehouse monitoring"],
    settled_end_of_shift: "no",
    approved_hours: 4,
    hours_worked: 4,
    hours_source: "worker_checkin",
    plan_duties: SYNTH_CHECKIN_DUTIES,
  });
  const day12 = applyFollowUp(day12raw, { "Gatehouse monitoring": "no" }, "2026-09-13");
  const day13 = uneventful("2026-09-13");
  const day14raw = captureCheckIn({
    date: "2026-09-14",
    duties_performed: ["Light bin sorting"],
    worsened_duties: ["Light bin sorting"],
    settled_end_of_shift: "no",
    approved_hours: 4,
    hours_worked: 3,
    hours_source: "worker_checkin",
    plan_duties: SYNTH_CHECKIN_DUTIES,
  });
  const day14 = applyFollowUp(day14raw, {}, "2026-09-15");
  const day16 = uneventful("2026-09-16");
  const checkins = [day10, day11, day12.checkin, day13, day14.checkin, day16];
  return {
    span: ["2026-09-10", "2026-09-11", "2026-09-12", "2026-09-13", "2026-09-14", "2026-09-15", "2026-09-16"],
    missed_date: "2026-09-15",
    checkins,
    records: checkins.flatMap((c) => orderedProvocationWithFollowUp(c)),
  };
}
