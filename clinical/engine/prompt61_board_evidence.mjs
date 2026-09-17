/* Continuum Prompt 61 Section 5.4: board evidence assembly.

   Assemble ONLY what the board's own form requires. Never widen a
   submission because a field could technically be populated. Nothing
   auto submits. A human files.

   No dashes anywhere. */

export const SYNTH_BOARD_FORM = Object.freeze({
  form_id: "SYNTH-BOARD-PSYCH-01",
  required_fields: Object.freeze([
    "worker_display_name",
    "claim_date",
    "restriction_codes",
    "hours_plan",
    "modified_role_offered_at",
  ]),
});

export function assembleBoardEvidence(form, available) {
  const spec = form || SYNTH_BOARD_FORM;
  const src = available || {};
  const fields = {};
  for (const key of spec.required_fields) {
    fields[key] = Object.prototype.hasOwnProperty.call(src, key) ? src[key] : "UNKNOWN";
  }
  const extra = Object.keys(src).filter((k) => spec.required_fields.indexOf(k) === -1);
  return {
    form_id: spec.form_id,
    fields,
    extras_ignored: extra,
    widened: false,
    submitted: false,
    auto_submit: false,
  };
}

export function fileBoardEvidence(assembly, actor) {
  if (!actor || !actor.human) {
    return { submitted: false, reason: "human_files" };
  }
  return {
    submitted: true,
    filed_by: actor.human,
    at: actor.at || null,
    form_id: assembly && assembly.form_id,
    auto_submit: false,
  };
}
