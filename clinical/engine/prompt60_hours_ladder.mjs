/* Continuum Prompt 60 Section 5: hours ladder.

   Plan holds hours_per_day and days_per_week by week. graduated_hours
   populates the plan. The platform NEVER auto-advances. A passed planned
   date HOLDS at the current step and raises the Calliope outstanding
   action. Advancement is clinician authorisation only.

   Missing approved hours render UNKNOWN, never 0. Hours are not health
   information. No dashes anywhere. */

import { normaliseRestrictionRecord } from "./prompt60_restriction_codes.mjs";

export const HOURS_HOLD_COORDINATOR =
  "The planned hours step date has passed. The plan holds. Outstanding action: clinician authorisation is still needed.";
export const HOURS_HOLD_WORKER =
  "Your hours stay as they are. The next hours step has not been authorised.";
export const HOURS_HOLD_CLINICIAN =
  "Planned hours step date has passed. The plan holds. Outstanding action: authorisation.";
export const HOURS_HOLD_EMPLOYER =
  "Hours stay as they are. The plan holds. Outstanding action.";

export function approvedHoursFace(hours) {
  if (hours === null || hours === undefined || hours === "") return "UNKNOWN";
  return String(hours);
}

export function hoursLadderFromRestriction(restriction, cached) {
  const rec = normaliseRestrictionRecord(restriction, cached);
  if (!rec || rec.code !== "graduated_hours") {
    return { steps: [], source: rec && rec.code ? rec.code : null, populated: false };
  }
  if (!rec.is_restriction) {
    return {
      steps: [],
      source: "graduated_hours",
      populated: false,
      outstanding_action: rec.outstanding_action || "restriction_no_clinician_author",
    };
  }
  const value = rec.value || {};
  const rawSteps = Array.isArray(value.weekly_steps) ? value.weekly_steps : null;
  if (rawSteps && rawSteps.length) {
    return {
      steps: rawSteps.map((s, i) => normaliseStep(s, i)),
      source: "graduated_hours",
      populated: true,
      current_index: 0,
    };
  }
  return {
    steps: [normaliseStep({
      week: 1,
      hours_per_day: value.hours_per_day,
      days_per_week: value.days_per_week,
      planned_date: value.planned_date || rec.date_issued || null,
    }, 0)],
    source: "graduated_hours",
    populated: true,
    current_index: 0,
  };
}

function normaliseStep(s, i) {
  const src = s || {};
  return {
    week: src.week != null ? src.week : i + 1,
    hours_per_day: src.hours_per_day != null ? src.hours_per_day : null,
    days_per_week: src.days_per_week != null ? src.days_per_week : null,
    planned_date: src.planned_date || null,
    authorised_at: src.authorised_at || null,
    authorised_by: src.authorised_by || null,
  };
}

export function currentLadderStep(plan) {
  if (!plan || !Array.isArray(plan.steps) || plan.steps.length === 0) return null;
  const idx = Number.isInteger(plan.current_index) ? plan.current_index : 0;
  return plan.steps[idx] || plan.steps[0];
}

export function evaluateHoursStepDate(plan, asOfDate) {
  const live = plan || null;
  const cached = live && live.cached_steps ? { steps: live.cached_steps, current_index: live.cached_index || 0 } : null;
  const use = live && Array.isArray(live.steps) && live.steps.length ? live : cached;
  if (!use) {
    return {
      held: true,
      advanced: false,
      step: null,
      hours_per_day: "UNKNOWN",
      days_per_week: "UNKNOWN",
      outstanding_action: HOURS_HOLD_COORDINATOR,
    };
  }
  const step = currentLadderStep(use);
  if (!step) {
    return {
      held: true,
      advanced: false,
      step: null,
      hours_per_day: "UNKNOWN",
      days_per_week: "UNKNOWN",
      outstanding_action: HOURS_HOLD_COORDINATOR,
    };
  }
  const passed = step.planned_date && asOfDate && String(step.planned_date) < String(asOfDate);
  const authorised = Boolean(step.authorised_at);
  if (passed && !authorised) {
    return {
      held: true,
      advanced: false,
      step,
      hours_per_day: approvedHoursFace(step.hours_per_day),
      days_per_week: approvedHoursFace(step.days_per_week),
      outstanding_action: HOURS_HOLD_COORDINATOR,
      worker_face: HOURS_HOLD_WORKER,
      clinician_face: HOURS_HOLD_CLINICIAN,
      employer_face: HOURS_HOLD_EMPLOYER,
    };
  }
  return {
    held: false,
    advanced: false,
    step,
    hours_per_day: approvedHoursFace(step.hours_per_day),
    days_per_week: approvedHoursFace(step.days_per_week),
    outstanding_action: null,
  };
}

export function authoriseHoursStep(plan, clinician, at) {
  if (!plan || !Array.isArray(plan.steps) || !clinician) {
    return { plan, advanced: false, reason: "clinician_authorisation_required" };
  }
  const idx = Number.isInteger(plan.current_index) ? plan.current_index : 0;
  const step = plan.steps[idx];
  if (!step) return { plan, advanced: false, reason: "no_current_step" };
  const stamped = {
    ...plan,
    steps: plan.steps.map((s, i) => i === idx ? { ...s, authorised_at: at || null, authorised_by: clinician } : s),
    current_index: Math.min(idx + 1, plan.steps.length - 1),
  };
  const moved = idx < plan.steps.length - 1;
  return { plan: stamped, advanced: moved, reason: null };
}

export function shiftConflictsCurrentStep(shift, plan) {
  const step = currentLadderStep(plan);
  if (!shift) return { conflict: false, before_shift: false };
  if (!step) {
    return { conflict: true, before_shift: true, reason: "approved_hours_UNKNOWN" };
  }
  const shiftHours = shift.hours_per_day;
  const shiftDays = shift.days_per_week;
  if (step.hours_per_day == null && shiftHours != null) {
    return { conflict: true, before_shift: true, reason: "approved_hours_UNKNOWN" };
  }
  if (shiftHours != null && step.hours_per_day != null && Number(shiftHours) > Number(step.hours_per_day)) {
    return { conflict: true, before_shift: true, reason: "scheduled_hours_exceed_step" };
  }
  if (shiftDays != null && step.days_per_week != null && Number(shiftDays) > Number(step.days_per_week)) {
    return { conflict: true, before_shift: true, reason: "scheduled_days_exceed_step" };
  }
  return { conflict: false, before_shift: false };
}

export function recordActualHours(entry) {
  const src = entry || {};
  const source = src.source === "roster" || src.source === "worker_checkin" ? src.source : null;
  return {
    date: src.date || null,
    hours: src.hours != null ? src.hours : null,
    source,
    is_health_information: false,
  };
}
