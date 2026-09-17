/* Continuum Prompt 60 Section 2: C1447 cognitive and psychosocial demand
   factors. Labels and intensity definitions are stored as retrieved from
   docs/prompts/60/C1447_VERIFICATION.md, including OCR artefacts. This module
   does not claim a customer surface is aligned to a board form. Section 8.2 stays with Craig.

   Frequency bands are DERIVED from frequency_percent (Prompt 2.2). The printed
   C1447 key has a gap (5.5 sits between Rare 1-5 and Occasional 6-33). Prompt
   2.2 assigns >5 and <=33 to occasional. That is a derivation fill, not a
   claim that the printed key is complete.

   Custom slots 14 and 15 store retrieved form wording. They are not
   normalised. Items 14 and 15 have empty Low / Moderate / High shells.

   unscored is explicit. A missing percent is UNKNOWN, never a numeric zero.
   SYNTH only. No dashes (em or en) anywhere. */

export const C1447_PRINTED_HEADER = "C1447 REV NOV 2025";
export const C1447_METADATA_TITLE = "C1447 - REV JAN 2025";

export const PRINTED_FREQUENCY_KEY_GAP =
  "The printed C1447 frequency key has a gap: 5.5 sits between Rare 1-5 and Occasional 6-33. Prompt 2.2 derivation assigns values >5 and <=33 to occasional. This fill is a derivation note, not a board form claim.";

export const POSITION_CLASSIFICATIONS = Object.freeze([
  "safety_sensitive",
  "risk_sensitive",
  "decision_critical",
]);

export const TASK_DESCRIPTOR_KEYS = Object.freeze([
  "driving",
  "equipment_operation",
  "tool_usage",
  "direct_care_provision",
  "unaccompanied_posting",
  "heights",
  "near_moving_equipment",
]);

export const SCORE_SOURCES = Object.freeze(["tenant_authored", "ai_drafted", "unscored"]);

export const INTENSITY_VALUES = Object.freeze(["low", "moderate", "high"]);

export const CUSTOM_DEMAND_SLOTS = Object.freeze([
  {
    slot: 14,
    summary_extract: "14.Additional tasks:",
    detail_heading: "Additional task",
    intensity_definitions: { low: "", moderate: "", high: "" },
  },
  {
    slot: 15,
    summary_extract: "15. Additional tasks:",
    detail_heading: "Additional task",
    intensity_definitions: { low: "", moderate: "", high: "" },
  },
]);

export const C1447_FACTORS = Object.freeze([
  {
    id: 1,
    label: "Short-term memory and recall",
    intensity_definitions: {
      low: "Minimal need to remember and recall information that is applied to work tasks and/or there are clear processes and instructions available to carry out work tasks.",
      moderate: "Recall information that is harder to remember because it is not often used or there are time constraints within which to recall the information.",
      high: "Recall many difference pieces of detailed information and/or sequences which may have ot be recalled in demanding situations (e.g., tight timeline pressures or being out of control).",
    },
  },
  {
    id: 2,
    label: "Attention to detail",
    intensity_definitions: {
      low: "Minimal attention or concentration is required, and this is not an intense level. Errors made would not create serious difficulty.",
      moderate: "Significant attention of concentration is required for many tasks. Errors made would not impact safety of others.",
      high: "Intense level of attention or concentration is required. Errors made would have detrimental consequences (e.g., safety of others).",
    },
  },
  {
    id: 3,
    label: "Completing multiple tasks",
    intensity_definitions: {
      low: "Completion of one task at a time with few interruptions until completion or until further direction from a supervisor.",
      moderate: "Completion of multiple tasks at a time with need to exercise some time management and judgement to determine priorities.",
      high: "Completion of multiple, concurrent tasks with need to exercise a high degree of time management and judgement to determine when to attend to each task.",
    },
  },
  {
    id: 4,
    label: "Mental endurance",
    intensity_definitions: {
      low: "Ability to take regular breaks throughout the workday and most often work shift ends at a consistent time.",
      moderate: "May need to move breaks around, working extended periods of time without stopping and/or often need to work overtime.",
      high: "Not able to take breaks at regular intervals, working non-stop for extended periods of time and/or performing overnight or on-call shifts.",
    },
  },
  {
    id: 5,
    label: "Problem solving and decision making",
    intensity_definitions: {
      low: "Minimal degree of judgment where any lapses would not create serious difficulty.",
      moderate: "Some level of judgement is required but does not assume the safety of others.",
      high: "Significant level of judgment required and/or is responsible for safety of others.",
    },
  },
  {
    id: 6,
    label: "Self-supervision",
    intensity_definitions: {
      low: "Minimal self-supervision required and supervisor often provides work direction.",
      moderate: "Self-supervision is required with occasional direction from supervisor.",
      high: "Predominantly self-supervised with ability to contact supervisor if needed.",
    },
  },
  {
    id: 7,
    label: "Supervision of others",
    intensity_definitions: {
      low: "May be required to provide work direction to others with no other supervisory duties.",
      moderate: "Provides work direction and manages some elements of work performance of others.",
      high: "Full supervisory responsibility of other employees.",
    },
  },
  {
    id: 8,
    label: "Time pressures",
    intensity_definitions: {
      low: "Majority of work is self-paced with minimal time constraints.",
      moderate: "Pressure to meet deadlines or work within time constraints and/or the volume of work is high, and work pace is moderately fast.",
      high: "Most work is performed under rigid time constraints and the volume of work is high (fast work pace or worker must extend the workday to manage work volumes).",
    },
  },
  {
    id: 9,
    label: "Exposure to environmental distractions",
    intensity_definitions: {
      low: "Minimal distracting visual, auditory or other sensory stimuli present during some tasks or portions of the shift.",
      moderate: "Some presence of distracting stimuli during some tasks or portions of the shift.",
      high: "Significant presence of distracting stimuli during most tasks or portions of the shift where it is essential.",
    },
  },
  {
    id: 10,
    label: "Interpersonal relationships (working cooperatively with others)",
    intensity_definitions: {
      low: "Minimal need to work cooperatively with others; however, may be in close proximity to others.",
      moderate: "May need to work in cooperation with others for some tasks and/or consult with others to complete tasks.",
      high: "Work requires close cooperation with others and/r work within a team to complete tasks.",
    },
  },
  {
    id: 11,
    label: "Exposure to emotional situations and/or distressed individuals",
    intensity_definitions: {
      low: "Minimal exposure to emotionally stressful circumstances or emotionally distressed individuals and no direct interaction from worker is required to complete job duties.",
      moderate: "Some exposure to emotionally stressful circumstances or emotionally distressed individuals with whom the worker must interact with in order to complete job duties. Assistance is available.",
      high: "Significant exposure to emotionally stressful circumstances or emotionally distressed individuals with whom the worker must interact with in order to complete job duties. Assistance is not available, and implementation of de-escalation techniques is required.",
    },
  },
  {
    id: 12,
    label: "Exposure to confrontational situations",
    intensity_definitions: {
      low: "Minimal exposure to confrontational situations and no direct interaction from worker is required to complete job duties.",
      moderate: "Some exposure to confrontational situations with whom the worker must interact with in order to complete job duties. Assistance is available.",
      high: "Significant exposure to confrontational situations or hostile individuals with whom the worker must interact with in order to complete job duties. Assistance is not available, and implementation of de escalation techniques is required.",
    },
  },
  {
    id: 13,
    label: "Verbal communication",
    intensity_definitions: {
      low: "Basic communication skills required to comprehend and communicate information at a basic level within well defined parameters (e.g., communicate status of job or job task with supervisor to work crews).",
      moderate: "Moderate communication skills required to comprehend and communicate information fluently (e.g., to work crews).",
      high: "Highly developed communication skills are required to comprehend and communicate complex information and ideas or communicate effectively in complex situations (e.g., explaining the design of a complex system, exchange information with physicians regarding public health issues, policy discussions, conflict resolution).",
    },
  },
]);

export function factorById(id) {
  return C1447_FACTORS.find((f) => f.id === Number(id)) || null;
}

export function intensityDefinition(factorId, intensity) {
  const f = factorById(factorId);
  if (!f) return null;
  const key = String(intensity || "").toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(f.intensity_definitions, key)) return null;
  return f.intensity_definitions[key];
}

// Prompt 2.2 derivation. Missing percent is UNKNOWN, never treated as 0.
export function frequencyBandFromPercent(percent) {
  if (percent === null || percent === undefined || percent === "") return "UNKNOWN";
  const n = Number(percent);
  if (!Number.isFinite(n)) return "UNKNOWN";
  if (n === 0) return "not_required";
  if (n > 0 && n <= 5) return "rare";
  if (n > 5 && n <= 33) return "occasional";
  if (n > 33 && n <= 66) return "frequent";
  if (n > 66) return "constant";
  return "UNKNOWN";
}

export function makeCognitiveScore(factorId, spec) {
  const factor = factorById(factorId);
  const source = SCORE_SOURCES.includes(spec && spec.source) ? spec.source : "unscored";
  const intensity = source === "unscored" ? null : (spec && spec.intensity) || null;
  const frequency_percent = spec && spec.frequency_percent != null ? spec.frequency_percent : null;
  return {
    factor_id: Number(factorId),
    label: factor ? factor.label : "UNKNOWN",
    intensity,
    intensity_definition: intensity ? intensityDefinition(factorId, intensity) : (source === "unscored" ? null : null),
    frequency_percent,
    frequency_band: frequencyBandFromPercent(frequency_percent),
    not_daily: spec && spec.not_daily === true,
    scored_by: source === "unscored" ? (spec && spec.scored_by != null ? spec.scored_by : null) : ((spec && spec.scored_by) || null),
    scored_on: source === "unscored" ? (spec && spec.scored_on != null ? spec.scored_on : null) : ((spec && spec.scored_on) || null),
    source,
  };
}

export function cognitiveDemandSet(partialById, meta) {
  const src = partialById || {};
  return C1447_FACTORS.map((f) => {
    const spec = src[f.id] || src[String(f.id)];
    if (!spec) {
      return makeCognitiveScore(f.id, { source: "unscored", scored_by: null, scored_on: null });
    }
    return makeCognitiveScore(f.id, {
      scored_by: (meta && meta.scored_by) || null,
      scored_on: (meta && meta.scored_on) || null,
      ...spec,
    });
  });
}

// Live score, then cached or last-known, then explicit unscored default.
export function resolveFactorScore(duty, factorId) {
  const live = ((duty && duty.cognitive_demands) || []).find((s) => s.factor_id === Number(factorId));
  if (live) return live;
  const cached = ((duty && duty.cached_cognitive_demands) || []).find((s) => s.factor_id === Number(factorId));
  if (cached) return cached;
  return makeCognitiveScore(factorId, { source: "unscored", scored_by: null, scored_on: null });
}

export function tenantAuthoredCoverageByFactor(duties) {
  const list = Array.isArray(duties) ? duties : [];
  if (list.length === 0) {
    return C1447_FACTORS.map((f) => ({
      factor_id: f.id,
      label: f.label,
      tenant_authored: "UNKNOWN",
      total: "UNKNOWN",
      percent: "UNKNOWN",
    }));
  }
  return C1447_FACTORS.map((f) => {
    const authored = list.filter((d) => {
      const s = ((d && d.cognitive_demands) || []).find((x) => x.factor_id === f.id);
      return s && s.source === "tenant_authored";
    }).length;
    return {
      factor_id: f.id,
      label: f.label,
      tenant_authored: authored,
      total: list.length,
      percent: Math.round((authored / list.length) * 1000) / 10,
    };
  });
}

export function customDemandSlotWording(slot) {
  return CUSTOM_DEMAND_SLOTS.find((s) => s.slot === Number(slot)) || null;
}
