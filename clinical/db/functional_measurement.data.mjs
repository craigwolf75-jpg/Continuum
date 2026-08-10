/* Continuum Prompt 39: the human reviewed source for the functional measurement
   model seed. Two data sets:

   1. RESTRICTION_CODES: the eight internal restriction codes (Prompt 39 Section 2.3),
      each with the free text phrase that is emitted into the board element "Other
      restrictions or additional comments" (2048 char limit). Internal only.

   2. AXIS_MAP: the per (form, axis) measurement matrix (Prompt 39 Section 4.4, the
      board workbook ground truth), refined by Prompt 39A Section 2.4 which makes the
      C151S bending group and pushing conditional on RTWPATIENTSTATUSCHANGED instead of
      flat Extended. This is the table clinical.resolve_axes reads. The spec's Section
      4.3 SELECT over form_element does not apply: the shipped Prompt 40 form_element
      carries no functional_axis mapping and no quantity_unit, so the axis set lives
      here as stored configuration, never hard coded in a branch. See the migration
      header and the 39A reconciliation for the full deviation note.

   code_set values mirror clinical.wcb_capability_code_set exactly:
     basic            emits ABLE | UNABLE | LIMITED     (Basic Work Restriction Codes)
     extended         emits ABLE | UNABLE | LIMITEDTO   (Extended Work Restriction Codes)
     conditional      resolves to basic or extended at emit time via the flag (C151S)
     able_unable_only emits ABLE | UNABLE only; a graded answer raises to a human
     weight           emits a Weight Category Code band (LIMITED | LIGHT | MEDIUM | HEAVY)
     environment      a parent flag plus seven booleans, not a capability code

   quantity_kind is one of none | hours | weight. No dashes anywhere. */

export const SOURCE_VERSION = "prompt-39-2026-08-10";

export const RESTRICTION_CODES = [
  { code: "R05", label: "No repetitive lifting", free_text_phrase: "No repetitive lifting" },
  { code: "R10", label: "No use of force or physical intervention", free_text_phrase: "No use of force or physical intervention" },
  { code: "R11", label: "No restraint or take downs", free_text_phrase: "No restraint or take downs" },
  { code: "R13", label: "No night shift or shift work", free_text_phrase: "No night shift or rotating shift work" },
  { code: "R18", label: "Concussion restrictions", free_text_phrase: "Concussion protocol restrictions apply, see comments" },
  { code: "R19", label: "Psychological restrictions", free_text_phrase: "Psychological injury restrictions apply, see comments" },
  { code: "R20", label: "Post surgical restrictions", free_text_phrase: "Post surgical restrictions apply, see comments" },
  { code: "R22", label: "Weight bearing restriction", free_text_phrase: "Weight bearing restriction, see comments" },
];

// The tolerance axes shared by every form, in display order. sitting, standing,
// walking and driving are Extended plus hours on all four report forms.
const TOLERANCE = ["sitting", "standing", "walking", "driving"];

// Build the axis rows for one form from a compact description. Every row carries the
// form, the axis dimension key, the UI control descriptor, the real board code list
// name (null when conditional, able_unable_only, weight or environment), the code_set
// (the wcb_capability_code_set vocabulary), the quantity kind, and a display order.
function rows(formId, spec) {
  let order = 0;
  const out = [];
  const push = (axis, ui_mapping, code_list_name, code_set, quantity_kind) =>
    out.push({ form_id: formId, axis, ui_mapping, code_list_name, code_set, quantity_kind, display_order: ++order });

  for (const a of TOLERANCE) push(a, "hours", "Extended Work Restriction Codes", "extended", "hours");

  // bending, twisting, kneeling_squatting, climbing: the "posture" group.
  const posture = ["bending", "twisting", "kneeling_squatting", "climbing"];
  for (const a of posture) {
    if (spec.postureCodeSet === "basic") push(a, "able_limited_unable", "Basic Work Restriction Codes", "basic", "none");
    else if (spec.postureCodeSet === "extended") push(a, "hours", "Extended Work Restriction Codes", "extended", "hours");
    else push(a, "hours", null, "conditional", "hours"); // C151S: resolves via the flag at emit time
  }

  // pushing_pulling.
  if (spec.pushCodeSet === "basic") push("pushing_pulling", "able_limited_unable", "Basic Work Restriction Codes", "basic", "none");
  else if (spec.pushCodeSet === "extended") push("pushing_pulling", "weight_kg", "Extended Work Restriction Codes", "extended", "weight");
  else push("pushing_pulling", "weight_kg", null, "conditional", "weight"); // C151S

  // lifting: one general axis on the single field forms, three planes on the OIS forms.
  if (spec.lifting === "general") push("lifting_general", "weight_kg", "Weight Category Codes", "weight", "weight");
  else {
    push("lifting_floor_to_waist", "weight_kg", "Weight Category Codes", "weight", "weight");
    push("lifting_waist_to_shoulder", "weight_kg", "Weight Category Codes", "weight", "weight");
    push("lifting_above_shoulder", "weight_kg", "Weight Category Codes", "weight", "weight");
  }

  // reaching: single overhead axis (Basic) on the single field forms, four sided
  // reaching values (able or unable only) on the OIS forms.
  if (spec.reaching === "overhead") push("overhead_reaching", "able_limited_unable", "Basic Work Restriction Codes", "basic", "none");
  else {
    push("reaching_left_above", "able_unable", null, "able_unable_only", "none");
    push("reaching_left_below", "able_unable", null, "able_unable_only", "none");
    push("reaching_right_above", "able_unable", null, "able_unable_only", "none");
    push("reaching_right_below", "able_unable", null, "able_unable_only", "none");
  }

  // grasping: absent on the single field forms, per hand (able or unable only) on OIS.
  if (spec.grasping) {
    push("grasping_left", "able_unable", null, "able_unable_only", "none");
    push("grasping_right", "able_unable", null, "able_unable_only", "none");
  }

  // environment: absent on the single field forms, a parent flag plus seven booleans on OIS.
  if (spec.environment) push("environment", "environment_flags", null, "environment", "none");

  return out;
}

export const AXIS_MAP = [
  // C050E and C151: the single field forms. Posture and reaching are Basic, lifting is
  // one general Max of, no grasping, no environment.
  ...rows("C050E", { postureCodeSet: "basic", pushCodeSet: "basic", lifting: "general", reaching: "overhead", grasping: false, environment: false }),
  ...rows("C151", { postureCodeSet: "basic", pushCodeSet: "basic", lifting: "general", reaching: "overhead", grasping: false, environment: false }),

  // C050S: the OIS form. Posture and pushing move to Extended, lifting splits into three
  // planes, four sided reaching, grasping per hand, environment.
  ...rows("C050S", { postureCodeSet: "extended", pushCodeSet: "extended", lifting: "planes", reaching: "sided", grasping: true, environment: true }),

  // C151S: mirrors C050S, except the posture group and pushing are conditional on
  // RTWPATIENTSTATUSCHANGED (Prompt 39A Section 2.4): N selects Basic, Y selects Extended.
  ...rows("C151S", { postureCodeSet: "conditional", pushCodeSet: "conditional", lifting: "planes", reaching: "sided", grasping: true, environment: true }),
];
