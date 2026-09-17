/* Continuum Prompt 60 Sections 3 and 4: named-restriction match.

   Separate from clinical/engine/dutymatch.mjs. Physical matchDuty stays
   axis prose. This module interprets mapping tokens from
   prompt60_restriction_map.data.mjs. It does not hardcode comparison
   rules inside matchDuty.

   Face text is Calliope CHECK_IN_COPY, character for character.
   Restriction VALUE numbers do not enter employer-facing reason strings.
   Unmapped fail is coordinator only. No dashes anywhere. */

import { resolveFactorScore } from "./c1447_factors.mjs";
import {
  mappingFor,
} from "./prompt60_restriction_map.data.mjs";
import {
  restrictionDisplayLabel,
  normaliseRestrictionRecord,
  restrictionPastReview,
} from "./prompt60_restriction_codes.mjs";

export const EXCLUDED_BY_PREFIX = "Excluded by: ";
export const CONDITIONAL_PAST_REVIEW = "Conditional: restriction past review date";
export const CONDITIONAL_UNSCORED = "Conditional: not yet assessed on this demand factor";
export const UNMAPPED_COORDINATOR =
  "Unmapped restriction. This demand cannot be matched. Do not assign from this result. Make contact.";

function labelOf(restriction) {
  return restrictionDisplayLabel(restriction && restriction.code) || "UNKNOWN";
}

function excludedBy(restriction) {
  return EXCLUDED_BY_PREFIX + labelOf(restriction);
}

function hasDigit(text) {
  return /\d/.test(String(text || ""));
}

export function resolveRestrictionList(live, cached) {
  if (Array.isArray(live) && live.length) {
    return live.map((r) => normaliseRestrictionRecord(r));
  }
  if (Array.isArray(cached) && cached.length) {
    return cached.map((r) => normaliseRestrictionRecord(null, r));
  }
  return [];
}

export function loudUnmappedFail(restriction) {
  return {
    loud: true,
    audience: "coordinator",
    restriction_code: restriction && restriction.code ? restriction.code : null,
    display_label: labelOf(restriction),
    message: UNMAPPED_COORDINATOR,
    employer_safe: false,
    do_not_assign: true,
  };
}

function scoreFor(duty, factorId) {
  return resolveFactorScore(duty, factorId);
}

function descriptorsOf(duty) {
  return (duty && duty.task_descriptors) || {};
}

function environmentOf(duty) {
  return (duty && duty.environment) || {};
}

function evaluateTest(test, duty, restriction, assignment) {
  const kind = test && test.kind;
  if (!kind) return null;

  if (kind === "factor_intensity") {
    const score = scoreFor(duty, test.factor_id);
    const excludeWhen = Array.isArray(test.exclude_when) ? test.exclude_when : [];
    if (!score || score.source === "unscored" || score.intensity == null) {
      return { hit: "conditional", reason: CONDITIONAL_UNSCORED, draft: false, factor_rating: score };
    }
    if (score.source === "ai_drafted") {
      return {
        hit: "conditional",
        reason: "Conditional: " + labelOf(restriction) + " (draft)",
        draft: true,
        factor_rating: score,
      };
    }
    if (excludeWhen.includes(score.intensity)) {
      return { hit: "exclude", reason: excludedBy(restriction), draft: false, factor_rating: score };
    }
    return null;
  }

  if (kind === "unaccompanied_posting") {
    const flag = descriptorsOf(duty).unaccompanied_posting === true;
    if (flag === (test.exclude_when === true)) {
      const score = scoreFor(duty, 6);
      return { hit: "exclude", reason: excludedBy(restriction), draft: false, factor_rating: score };
    }
    return null;
  }

  if (kind === "position_classification") {
    const cls = duty && duty.position_classification;
    const excludeWhen = Array.isArray(test.exclude_when) ? test.exclude_when : [];
    if (cls && excludeWhen.includes(cls)) {
      return { hit: "exclude", reason: excludedBy(restriction), draft: false, factor_rating: null };
    }
    return null;
  }

  if (kind === "recorded_minutes") {
    const attr = test.attribute;
    const dutyMinutes = duty ? duty[attr] : null;
    const limit = restriction && restriction.value && restriction.value.minutes;
    if (dutyMinutes == null || dutyMinutes === "") {
      return { hit: "conditional", reason: CONDITIONAL_UNSCORED, draft: false, factor_rating: null };
    }
    if (limit == null || limit === "") {
      return { hit: "conditional", reason: CONDITIONAL_UNSCORED, draft: false, factor_rating: null };
    }
    if (Number(dutyMinutes) > Number(limit)) {
      return { hit: "exclude", reason: excludedBy(restriction), draft: false, factor_rating: null };
    }
    const extras = Array.isArray(test.also_factors) ? test.also_factors : [];
    for (const fid of extras) {
      const score = scoreFor(duty, fid);
      if (!score || score.source === "unscored" || score.intensity == null) {
        return { hit: "conditional", reason: CONDITIONAL_UNSCORED, draft: false, factor_rating: score };
      }
      if (score.source === "ai_drafted") {
        return {
          hit: "conditional",
          reason: "Conditional: " + labelOf(restriction) + " (draft)",
          draft: true,
          factor_rating: score,
        };
      }
    }
    return null;
  }

  if (kind === "environment_field") {
    const env = environmentOf(duty);
    const val = env[test.field];
    if (val == null) {
      return { hit: "conditional", reason: CONDITIONAL_UNSCORED, draft: false, factor_rating: null };
    }
    if (val === true) {
      return { hit: "exclude", reason: excludedBy(restriction), draft: false, factor_rating: null };
    }
    return null;
  }

  if (kind === "task_descriptor") {
    if (descriptorsOf(duty)[test.descriptor] === true) {
      return { hit: "exclude", reason: excludedBy(restriction), draft: false, factor_rating: null };
    }
    return null;
  }

  if (kind === "assignment_shift") {
    if (!assignment || !assignment.shift) return null;
    const excludeWhen = Array.isArray(test.exclude_when) ? test.exclude_when : [];
    if (excludeWhen.includes(assignment.shift)) {
      return { hit: "exclude", reason: excludedBy(restriction), draft: false, factor_rating: null, assignment_only: true };
    }
    return null;
  }

  if (kind === "factor_present") {
    const score = scoreFor(duty, test.factor_id);
    if (score && score.frequency_band === "not_required") return null;
    if (!score || score.source === "unscored" || score.intensity == null) {
      return { hit: "conditional", reason: CONDITIONAL_UNSCORED, draft: false, factor_rating: score };
    }
    if (score.source === "ai_drafted") {
      return {
        hit: "conditional",
        reason: "Conditional: " + labelOf(restriction) + " (draft)",
        draft: true,
        factor_rating: score,
      };
    }
    return { hit: "exclude", reason: excludedBy(restriction), draft: false, factor_rating: score };
  }

  if (kind === "volume_conditional") {
    const ids = Array.isArray(test.factor_ids) ? test.factor_ids : [];
    for (const fid of ids) {
      const score = scoreFor(duty, fid);
      if (score && score.frequency_band === "not_required") continue;
      if (!score || score.source === "unscored" || score.intensity == null) {
        return { hit: "conditional", reason: CONDITIONAL_UNSCORED, draft: false, factor_rating: score };
      }
      if (score.source === "ai_drafted") {
        return {
          hit: "conditional",
          reason: "Conditional: " + labelOf(restriction) + " (draft)",
          draft: true,
          factor_rating: score,
        };
      }
      if (score.intensity === "moderate" || score.intensity === "high") {
        const val = restriction && restriction.value ? restriction.value : null;
        let shown = "";
        if (val && val.percent != null) shown = " (" + String(val.percent) + " percent)";
        else if (val && val.count != null) shown = " (count " + String(val.count) + ")";
        return {
          hit: "conditional",
          reason: "Conditional: " + labelOf(restriction) + shown,
          draft: false,
          factor_rating: score,
        };
      }
    }
    return null;
  }

  if (kind === "assignment_site") {
    if (!assignment || assignment.site_id == null || assignment.site_id === "") return null;
    const banned = restriction && restriction.value
      ? (restriction.value.site_ref || restriction.value.site_id)
      : null;
    if (banned != null && String(assignment.site_id) === String(banned)) {
      return { hit: "exclude", reason: excludedBy(restriction), draft: false, factor_rating: null, assignment_only: true };
    }
    return null;
  }

  if (kind === "roster_individual") {
    const val = restriction && restriction.value ? restriction.value : null;
    const named = val && (val.person_ref || val.person_free_text);
    const roster = (assignment && assignment.roster) || [];
    if (!named || !Array.isArray(roster) || roster.length === 0) return null;
    const hit = roster.some((p) => {
      if (p == null) return false;
      if (typeof p === "string") return p === named;
      return p.ref === named || p.name === named || p.person_ref === named;
    });
    if (hit) {
      return { hit: "exclude", reason: excludedBy(restriction), draft: false, factor_rating: null, assignment_only: true };
    }
    return null;
  }

  return null;
}

function emptyResult(duty) {
  return {
    duty_id: duty && duty.duty_id,
    duty_name: duty && duty.duty_name,
    verdict: "safe",
    excluded_because: null,
    condition_text: null,
    restriction_label: null,
    restriction_code: null,
    factor_rating: null,
    draft: false,
    unmapped: false,
    loud_fail: null,
    outstanding_action: null,
    employer_visible: true,
    employer_face: null,
    coordinator_face: null,
    assignment_excluded: false,
  };
}

export function matchPrompt60Duty(duty, restrictions, context) {
  const ctx = context || {};
  const asOfDate = ctx.asOfDate || null;
  const assignment = ctx.assignment || null;
  const list = resolveRestrictionList(restrictions, ctx.cached_restrictions);
  const acc = emptyResult(duty);
  let excluded = null;
  let conditional = null;
  let pastReviewConditional = null;
  let unmapped = null;
  let outstanding = null;

  for (const raw of list) {
    const restriction = normaliseRestrictionRecord(raw);
    if (!restriction.code) continue;

    if (!restriction.is_restriction) {
      outstanding = {
        hit: "conditional",
        reason: "Conditional: " + labelOf(restriction),
        restriction,
        outstanding_action: restriction.outstanding_action || "restriction_no_clinician_author",
      };
      continue;
    }

    const mapping = mappingFor(restriction.code);
    if (!mapping) {
      unmapped = loudUnmappedFail(restriction);
      continue;
    }

    const past = restrictionPastReview(restriction, asOfDate);
    const tests = Array.isArray(mapping.tests) ? mapping.tests : [];

    if (mapping.assignment_only && !mapping.duty_exclude) {
      if (assignment) {
        for (const test of tests) {
          const hit = evaluateTest(test, duty, restriction, assignment);
          if (hit && hit.hit === "exclude") {
            if (!excluded) {
              excluded = { ...hit, restriction, assignment_only: true };
            }
          } else if (hit && hit.hit === "conditional" && !excluded && !conditional) {
            conditional = { ...hit, restriction };
          }
        }
      }
      if (past && !excluded) {
        pastReviewConditional = { restriction, reason: CONDITIONAL_PAST_REVIEW };
      }
      continue;
    }

    let thisHit = null;
    for (const test of tests) {
      const hit = evaluateTest(test, duty, restriction, assignment);
      if (!hit) continue;
      if (hit.hit === "exclude") {
        thisHit = hit;
        break;
      }
      if (hit.hit === "conditional" && (!thisHit || thisHit.hit !== "exclude")) {
        thisHit = hit;
      }
    }

    if (thisHit && thisHit.hit === "exclude") {
      if (!excluded || excluded.assignment_only) {
        excluded = { ...thisHit, restriction };
      }
      continue;
    }
    if (thisHit && thisHit.hit === "conditional") {
      conditional = { ...thisHit, restriction };
      continue;
    }
    if (past) {
      pastReviewConditional = { restriction, reason: CONDITIONAL_PAST_REVIEW };
    }
  }

  if (excluded) {
    const factor = excluded.factor_rating;
    const factorBit = factor && factor.label && factor.intensity
      ? factor.label + " rated " + factor.intensity
      : null;
    const employer = excluded.reason;
    acc.verdict = "excluded";
    acc.excluded_because = employer;
    acc.restriction_label = labelOf(excluded.restriction);
    acc.restriction_code = excluded.restriction.code;
    acc.factor_rating = factor && factor.label ? { factor_id: factor.factor_id, label: factor.label, intensity: factor.intensity } : null;
    acc.employer_face = employer;
    acc.coordinator_face = factorBit ? employer + " (" + factorBit + ")" : employer;
    acc.assignment_excluded = excluded.assignment_only === true;
    acc.employer_visible = false;
    return acc;
  }

  if (unmapped) {
    acc.verdict = "conditional";
    acc.unmapped = true;
    acc.loud_fail = unmapped;
    acc.condition_text = UNMAPPED_COORDINATOR;
    acc.restriction_label = unmapped.display_label;
    acc.restriction_code = unmapped.restriction_code;
    acc.employer_visible = false;
    acc.employer_face = null;
    acc.coordinator_face = UNMAPPED_COORDINATOR;
    acc.outstanding_action = "unmapped_restriction";
    return acc;
  }

  if (conditional) {
    acc.verdict = "conditional";
    acc.condition_text = conditional.reason;
    acc.restriction_label = labelOf(conditional.restriction);
    acc.restriction_code = conditional.restriction.code;
    acc.draft = conditional.draft === true;
    acc.factor_rating = conditional.factor_rating && conditional.factor_rating.label
      ? { factor_id: conditional.factor_rating.factor_id, label: conditional.factor_rating.label, intensity: conditional.factor_rating.intensity }
      : null;
    acc.employer_visible = false;
    acc.employer_face = conditional.reason;
    acc.coordinator_face = conditional.reason;
    return acc;
  }

  if (outstanding) {
    acc.verdict = "conditional";
    acc.condition_text = outstanding.reason;
    acc.restriction_label = labelOf(outstanding.restriction);
    acc.restriction_code = outstanding.restriction.code;
    acc.outstanding_action = outstanding.outstanding_action;
    acc.employer_visible = false;
    acc.employer_face = outstanding.reason;
    acc.coordinator_face = outstanding.reason;
    return acc;
  }

  if (pastReviewConditional) {
    acc.verdict = "conditional";
    acc.condition_text = CONDITIONAL_PAST_REVIEW;
    acc.restriction_label = labelOf(pastReviewConditional.restriction);
    acc.restriction_code = pastReviewConditional.restriction.code;
    acc.employer_visible = false;
    acc.employer_face = CONDITIONAL_PAST_REVIEW;
    acc.coordinator_face = CONDITIONAL_PAST_REVIEW;
    return acc;
  }

  acc.verdict = "safe";
  return acc;
}

export function matchPrompt60Duties(duties, restrictions, context) {
  if (!duties || duties.length === 0) {
    return {
      published: false,
      reason: "no-job-profile",
      message: "The employer has no job profile for this worker's title. Nothing is published; route to the coordinator.",
      lines: [],
      employer_lines: [],
      coordinator_alerts: [],
      summary: { safe: 0, conditional: 0, excluded: 0 },
      binding_constraint_fact: null,
    };
  }
  const lines = duties.map((d) => matchPrompt60Duty(d, restrictions, context));
  const summary = {
    safe: lines.filter((l) => l.verdict === "safe").length,
    conditional: lines.filter((l) => l.verdict === "conditional").length,
    excluded: lines.filter((l) => l.verdict === "excluded").length,
  };
  const coordinator_alerts = lines.filter((l) => l.loud_fail).map((l) => l.loud_fail);
  const employer_lines = lines.filter((l) => l.verdict === "safe");
  return {
    published: true,
    lines,
    employer_lines,
    coordinator_alerts,
    summary,
    binding_constraint_fact: bindingConstraintFact(lines),
  };
}

export function bindingConstraintFact(lines) {
  if (!Array.isArray(lines)) {
    return { text: null, restriction: "UNKNOWN", excluded: "UNKNOWN", total_exclusions: "UNKNOWN" };
  }
  const excluded = lines.filter((l) => l.verdict === "excluded");
  const assessed = lines.length;
  if (assessed === 0) {
    return { text: null, restriction: "UNKNOWN", excluded: "UNKNOWN", total_exclusions: "UNKNOWN" };
  }
  if (excluded.length * 2 <= assessed) {
    return { text: null, restriction: null, excluded: excluded.length, total_exclusions: excluded.length };
  }
  const counts = {};
  for (const line of excluded) {
    const lab = line.restriction_label;
    if (!lab) continue;
    counts[lab] = (counts[lab] || 0) + 1;
  }
  let topLabel = null;
  let topN = null;
  for (const [lab, n] of Object.entries(counts)) {
    if (topN == null || n > topN) {
      topLabel = lab;
      topN = n;
    }
  }
  if (!topLabel || topN == null) {
    return { text: null, restriction: "UNKNOWN", excluded: "UNKNOWN", total_exclusions: excluded.length };
  }
  const total = excluded.length;
  const text = topLabel + " accounts for " + topN + " of " + total + " exclusions";
  return { text, restriction: topLabel, excluded: topN, total_exclusions: total };
}

function needsCoordinatorAck(duty) {
  const cls = duty && duty.position_classification;
  return cls === "safety_sensitive" || cls === "decision_critical";
}

export function assignConditionalDuty(duty, match, acknowledgment) {
  const log = [];
  const verdict = match && match.verdict;
  if (verdict === "excluded" || (match && match.unmapped) || (match && match.loud_fail)) {
    const entry = {
      event: "assignment_refused",
      duty_id: duty && duty.duty_id,
      reason: match && match.unmapped ? "unmapped_restriction" : "excluded",
    };
    log.push(entry);
    return { assigned: false, log, reason: entry.reason };
  }
  if (verdict === "safe") {
    return { assigned: true, log, reason: null };
  }
  if (verdict === "conditional" && needsCoordinatorAck(duty)) {
    const recorded = acknowledgment && acknowledgment.recorded === true && acknowledgment.by;
    if (!recorded) {
      const entry = {
        event: "assignment_refused_no_acknowledgment",
        duty_id: duty && duty.duty_id,
        position_classification: duty && duty.position_classification,
      };
      log.push(entry);
      return { assigned: false, log, reason: "coordinator_acknowledgment_required" };
    }
    log.push({
      event: "assignment_acknowledged",
      duty_id: duty && duty.duty_id,
      by: acknowledgment.by,
      at: acknowledgment.at || null,
    });
    return { assigned: true, log, reason: null, acknowledgment };
  }
  return { assigned: true, log, reason: null };
}

export function assignDuty(duty, match, acknowledgment) {
  return assignConditionalDuty(duty, match, acknowledgment);
}

export function employerReasonHasValueDigit(match) {
  return hasDigit((match && match.employer_face) || "") || hasDigit((match && match.excluded_because) || "");
}
