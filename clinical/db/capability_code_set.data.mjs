/* Continuum Prompt 40 (Prompt 39A Section 2.3): the human reviewable source for
   the per (form, capability element) code set table. This is the 39A table
   verbatim, one row per capability element with its code set on each of the four
   clinical forms. Every OBX identifier was confirmed character for character
   against the board samples 5.01 (C050E Max) and 5.04 (C050S Max), per 39A
   Section 0. capabilitycodesetgen.mjs expands this to (form, OBX) rows and emits
   006_seed_capability_code_set.sql. The engine reads the same rows.

   code set values:
     extended         -> Extended Work Restriction Codes (ABLE, UNABLE, LIMITEDTO)
     basic            -> Basic Work Restriction Codes (ABLE, UNABLE, LIMITED)
     conditional      -> C151S only: Basic when RTWPATIENTSTATUSCHANGED = 'N',
                         Extended when 'Y' (39A Section 2.4). Five elements.
     able_unable_only -> ABLE or UNABLE only, no limited option (39A Section 2.3
                         note 3). Grasping and reaching. A graded value must be
                         raised to a human, never collapsed silently.
     not_on_form      -> the element does not exist on that form. Not stored;
                         the resolver returns not_on_form for any absent row so a
                         mismatched mapping fails loudly (39A note 2: do not map a
                         Continuum overhead reaching restriction onto a C050S).

   No dashes anywhere. */

// The 39A Section 2.3 table, one entry per capability element. Column order is
// the four forms. Keep this in exactly the shape 39A presents so it stays 1:1
// auditable against that file and the workbook.
export const AXES = [
  // element label, OBX identifier, C050E, C050S, C151, C151S
  ["Sitting", "RTWPATIENTSITTINGCAPABILITY", "extended", "extended", "extended", "extended"],
  ["Standing", "RTWPATIENTSTANDINGCAPABILITY", "extended", "extended", "extended", "extended"],
  ["Walking", "RTWPATIENTWALKINGCAPABILITY", "extended", "extended", "extended", "extended"],
  ["Bending", "RTWPATIENTBENDINGCAPABILITY", "basic", "extended", "basic", "conditional"],
  ["Twisting", "RTWPATIENTTWISTINGCAPABILITY", "basic", "extended", "basic", "conditional"],
  ["Kneeling or squatting", "RTWPATIENTKNEELINGSQUATTINGCAPABILITY", "basic", "extended", "basic", "conditional"],
  ["Climbing", "RTWPATIENTCLIMBINGCAPABILITY", "basic", "extended", "basic", "conditional"],
  ["Pushing or pulling", "RTWPATIENTPUSHINGPULLINGCAPABILITY", "basic", "extended", "basic", "conditional"],
  ["Overhead reaching", "RTWPATIENTOVERHEADREACHINGCAPABILITY", "basic", "not_on_form", "basic", "not_on_form"],
  ["Lifting (single)", "RTWPATIENTLIFTINGCAPABILITY", "extended", "not_on_form", "extended", "not_on_form"],
  ["Lifting floor to waist", "RTWPATIENTLIFTINGFLOORTOWAIST", "not_on_form", "extended", "not_on_form", "extended"],
  ["Lifting waist to shoulder", "RTWPATIENTLIFTINGWAISTTOSHOULDER", "not_on_form", "extended", "not_on_form", "extended"],
  ["Lifting above shoulder", "RTWPATIENTLIFTINGABOVESHOULDER", "not_on_form", "extended", "not_on_form", "extended"],
  ["Driving", "RTWPATIENTDRIVINGCAPABILITY", "extended", "extended", "extended", "extended"],
  ["Grasping right", "RTWPATIENTGRASPINGRIGHT", "not_on_form", "able_unable_only", "not_on_form", "able_unable_only"],
  ["Grasping left", "RTWPATIENTGRASPINGLEFT", "not_on_form", "able_unable_only", "not_on_form", "able_unable_only"],
  ["Reaching above right shoulder", "RTWPATIENTREACHINGABOVERIGHTSHOULDER", "not_on_form", "able_unable_only", "not_on_form", "able_unable_only"],
  ["Reaching above left shoulder", "RTWPATIENTREACHINGABOVELEFTSHOULDER", "not_on_form", "able_unable_only", "not_on_form", "able_unable_only"],
  ["Reaching below right shoulder", "RTWPATIENTREACHINGBELOWRIGHTSHOULDER", "not_on_form", "able_unable_only", "not_on_form", "able_unable_only"],
  ["Reaching below left shoulder", "RTWPATIENTREACHINGBELOWLEFTSHOULDER", "not_on_form", "able_unable_only", "not_on_form", "able_unable_only"]
];

const FORMS = ["C050E", "C050S", "C151", "C151S"];
const CONDITIONAL_FLAG = "RTWPATIENTSTATUSCHANGED"; // 39A Section 2.4
const CONDITIONAL_BASIC_VALUE = "N";                // = No (status not changed) selects Basic

// Expand AXES to one row per (form, OBX identifier), skipping not_on_form (the
// resolver treats an absent row as not_on_form).
export const ROWS = (() => {
  const out = [];
  for (const [label, obx, ...sets] of AXES) {
    FORMS.forEach((form, i) => {
      const code_set = sets[i];
      if (code_set === "not_on_form") return;
      const row = { form_id: form, obx_identifier: obx, element_label: label, code_set };
      if (code_set === "conditional") {
        row.conditional_flag_obx = CONDITIONAL_FLAG;
        row.conditional_basic_value = CONDITIONAL_BASIC_VALUE;
      }
      out.push(row);
    });
  }
  return out;
})();
