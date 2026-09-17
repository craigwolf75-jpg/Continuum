/* Continuum Prompt 60 Section 3: named restriction catalogue.

   This is a NEW catalogue. It does not rewrite clinical.internal_restriction_code
   (varchar 10, R05/R10/R11/R13/R18/R19/R20/R22). Prompt 60 codes are longer
   than 10 characters.

   A restriction with no clinician author is not a restriction. It is an
   outstanding action. Source document types do not assume FAF: Ontario FAF
   2647A has no cognitive, psychological, or graduated hours fields.

   Display labels are the face names used in Calliope excluded lines
   (Excluded by: [restriction]). No dashes (em or en) anywhere. */

export const SOURCE_DOCUMENT_TYPES = Object.freeze([
  "functional_abilities_form",
  "clinic_note",
  "specialist_letter",
  "other",
]);

export const ONTARIO_FAF_2647A_NOTE =
  "Ontario FAF 2647A has no cognitive, psychological, or graduated hours fields. Do not assume FAF is the source document.";

export const PROMPT60_RESTRICTION_CODES = Object.freeze([
  { code: "max_continuous_screen_minutes", display_label: "Max continuous screen minutes", value_shape: { minutes: "number" } },
  { code: "max_continuous_vigilance_minutes", display_label: "Max continuous vigilance minutes", value_shape: { minutes: "number" } },
  { code: "no_driving_as_duty", display_label: "No driving as duty", value_shape: null },
  { code: "no_powered_mobile_equipment", display_label: "No powered mobile equipment", value_shape: null },
  { code: "no_work_at_heights", display_label: "No work at heights", value_shape: null },
  { code: "no_work_near_moving_equipment", display_label: "No work near moving equipment", value_shape: null },
  { code: "no_lone_work", display_label: "No lone work", value_shape: null },
  { code: "no_safety_critical_decision_making", display_label: "No safety critical decision making", value_shape: null },
  { code: "low_noise_environment_required", display_label: "Low noise environment required", value_shape: null },
  { code: "reduced_light_or_glare_required", display_label: "Reduced light or glare required", value_shape: null },
  { code: "no_night_or_rotating_shift", display_label: "No night or rotating shift", value_shape: null },
  { code: "graduated_hours", display_label: "Graduated hours", value_shape: { hours_per_day: "number", days_per_week: "number", weekly_steps: "array" } },
  { code: "scheduled_rest_breaks", display_label: "Scheduled rest breaks", value_shape: { frequency: "string", duration: "string" } },
  { code: "single_task_only_no_concurrent_demand", display_label: "Single task only, no concurrent demand", value_shape: null },
  { code: "supervised_or_partnered_only", display_label: "Supervised or partnered only", value_shape: null },
  { code: "no_contact_with_specified_individual", display_label: "No contact with specified individual", value_shape: { person_ref: "string", person_free_text: "string" } },
  { code: "no_assignment_to_specified_site", display_label: "No assignment to specified site", value_shape: { site_ref: "string" } },
  { code: "no_public_facing_duty", display_label: "No public facing duty", value_shape: null },
  { code: "no_conflict_or_crisis_response_duty", display_label: "No conflict or crisis response duty", value_shape: null },
  { code: "reduced_caseload_or_task_volume", display_label: "Reduced caseload or task volume", value_shape: { percent: "number", count: "number" } },
  { code: "predictable_schedule_required_no_on_call", display_label: "Predictable schedule required, no on call", value_shape: null },
]);

export function restrictionCodeById(code) {
  return PROMPT60_RESTRICTION_CODES.find((r) => r.code === code) || null;
}

export function restrictionDisplayLabel(code) {
  const row = restrictionCodeById(code);
  return row ? row.display_label : null;
}

// Live record, then cached last-known, then a safe outstanding-action default.
export function normaliseRestrictionRecord(raw, cached) {
  const src = raw || cached || null;
  if (!src) {
    return {
      code: null,
      authored_by: null,
      source_document: null,
      date_issued: null,
      review_or_expiry_date: null,
      transcribed_by: null,
      value: null,
      is_restriction: false,
      outstanding_action: "restriction_record_missing",
    };
  }
  const authored = src.authored_by != null && String(src.authored_by).trim() !== "";
  return {
    code: src.code || null,
    authored_by: authored ? src.authored_by : null,
    source_document: src.source_document || null,
    date_issued: src.date_issued || null,
    review_or_expiry_date: src.review_or_expiry_date || null,
    transcribed_by: src.transcribed_by != null ? src.transcribed_by : null,
    value: src.value != null ? src.value : null,
    is_restriction: authored,
    outstanding_action: authored ? null : "restriction_no_clinician_author",
  };
}

export function restrictionPastReview(restriction, asOfDate) {
  if (!restriction || !restriction.review_or_expiry_date || !asOfDate) return false;
  return String(restriction.review_or_expiry_date) < String(asOfDate);
}

export function makeRestriction(code, extras) {
  const e = extras || {};
  return normaliseRestrictionRecord({
    code,
    authored_by: e.authored_by,
    source_document: e.source_document || { type: "clinic_note", ref: "SYNTH-DOC-01" },
    date_issued: e.date_issued || "2026-09-01",
    review_or_expiry_date: e.review_or_expiry_date || "2026-12-31",
    transcribed_by: e.transcribed_by != null ? e.transcribed_by : null,
    value: e.value != null ? e.value : null,
  });
}
