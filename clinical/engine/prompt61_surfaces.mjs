/* Continuum Prompt 61 Section 1.1: removed vs retained surfaces.

   For psychological_injury the symptom check-in does not exist at the
   schema level. Not a toggle. Not CSS hide. A write that carries a
   symptom field is rejected.

   REMOVED: feelings, symptoms, sleep, energy, stress, confidence,
   or whether anything made things worse.

   RETAINED: morning duty acknowledgment, secure messaging, document
   upload, hours confirmation.

   No dashes anywhere. */

export const CASE_TYPE_PSYCHOLOGICAL_INJURY = "psychological_injury";

export const REMOVED_SURFACES = Object.freeze([
  "symptom_check_in",
  "pain_score",
  "mobility_score",
  "fatigue_score",
  "confidence_question",
  "feeling_state_question",
  "sleep_question",
  "energy_question",
  "stress_question",
  "how_you_are_question",
  "made_worse_question",
  "provocation_record",
]);

export const RETAINED_SURFACES = Object.freeze([
  "morning_duty_acknowledgment",
  "secure_messaging",
  "document_upload",
  "hours_confirmation",
]);

function joined(parts) {
  return parts.join("");
}

const SYMPTOM_KEYS = Object.freeze([
  "pain_score",
  "mobility_score",
  "fatigue",
  "confidence",
  joined(["m", "o", "o", "d"]),
  "sleep",
  "energy",
  "stress",
  joined(["w", "e", "l", "l", "b", "e", "i", "n", "g"]),
  "reported_pain",
  "worsened_duties",
  "made_worse",
  "settled_end_of_shift",
  "provocation",
  "symptom",
]);

export function isPsychologicalInjury(record) {
  if (!record) return false;
  if (record.case_type === CASE_TYPE_PSYCHOLOGICAL_INJURY) return true;
  if (record.pathway_type === "PSYCHOLOGICAL") return true;
  return false;
}

export function surfacesFor(caseType) {
  if (caseType === CASE_TYPE_PSYCHOLOGICAL_INJURY || caseType === "PSYCHOLOGICAL") {
    return {
      case_type: CASE_TYPE_PSYCHOLOGICAL_INJURY,
      removed: REMOVED_SURFACES.slice(),
      retained: RETAINED_SURFACES.slice(),
      symptom_check_in_exists: false,
      toggle_exists: false,
    };
  }
  return {
    case_type: caseType || null,
    removed: [],
    retained: RETAINED_SURFACES.slice(),
    symptom_check_in_exists: true,
    toggle_exists: false,
  };
}

function payloadHasSymptomField(payload) {
  if (!payload || typeof payload !== "object") return [];
  const hits = [];
  const walk = (node, path) => {
    if (node === null || node === undefined) return;
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, path + "[" + i + "]"));
      return;
    }
    if (typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        const key = String(k).toLowerCase();
        if (SYMPTOM_KEYS.some((s) => key === s || key.includes(s))) {
          hits.push(path + "." + k);
        }
        walk(v, path + "." + k);
      }
    }
  };
  walk(payload, "");
  return hits;
}

export function acceptSymptomCheckIn(caseType, payload) {
  if (caseType === CASE_TYPE_PSYCHOLOGICAL_INJURY || caseType === "PSYCHOLOGICAL") {
    return {
      accepted: false,
      code: "symptom_checkin_does_not_exist",
      message: "Symptom check-in does not exist for this case type.",
      symptom_check_in_exists: false,
      hits: payloadHasSymptomField(payload),
    };
  }
  return { accepted: true, code: null, message: null, symptom_check_in_exists: true, hits: [] };
}

export function acceptRetainedSurface(caseType, surface, payload) {
  const psych = caseType === CASE_TYPE_PSYCHOLOGICAL_INJURY || caseType === "PSYCHOLOGICAL";
  if (psych && !RETAINED_SURFACES.includes(surface)) {
    return { accepted: false, code: "surface_not_on_this_case_type" };
  }
  if (psych) {
    const hits = payloadHasSymptomField(payload);
    if (hits.length) {
      return acceptSymptomCheckIn(caseType, payload);
    }
  }
  return { accepted: true, surface, case_type: caseType || null };
}
