/* Continuum Prompt 40: the structured form_rule source. Human reviewable, one
   entry per rule, re-encoded faithfully from the transcription docs under
   docs/superpowers/specs/ (which were read from the board UI design PDFs). This
   is the artifact Hannah signs off before any rule goes live. formrulegen.mjs
   turns it into clinical/db/004_seed_form_rules.sql.

   Coverage in this pass:
   - C050E: complete (all sections, the canonical clinical form the others share).
   - C151S: the no change chain (SR30, SR28, E1 code_list_switch) plus the RTW
     gate chain (SR1, SR2, SR3). This is the criteria 9 and 10 block that an
     earlier Continuum spec transcribed WRONG; captured here verbatim from
     docs/.../2026-08-09-prompt-40-C151S-rules-transcription.md.
   The remaining forms' rules (C050S, C151, invoice forms, and C151S's shared
   sections) are the follow up: add them here from their transcription docs, then
   regenerate. See clinical/db/README.md.

   verified_against_sample_xml is TRUE only where the verification pass confirmed
   the rule against the board 5.xx samples (so far: BR5 page 1 / VAL-X01, the PHN
   inversion, criterion 15). Everything else stays false until asserted against
   its sample XML (the transcription docs' definition of done, not yet met).

   Shapes match clinical.form_rule. trigger_condition becomes jsonb. No dashes. */

// helper to keep entries terse; realizes/note/switches default sensibly
const r = (o) => ({
  ordinal: 1, clears_on_hide: true, switches_code_list_to: null,
  verified_against_sample_xml: false, unresolvable: false, ...o
});

const C050E = "2.01 - C050E - User Interface Design.pdf";
const C151S = "2.04 - C151S - User Interface Design.pdf";

export const RULES = [
  // ===== C050E: Participant Details (page 1) =====
  r({ form_id: "C050E", rule_code: "BR5", ordinal: 1, rule_type: "business", source_document: C050E, source_page: 1,
    trigger_element_name: "Alberta PHN; Patient does not have an Alberta PHN",
    trigger_condition: { description: "exactly one of the two is provided", realizes: "VAL-X01", note: "PHN polarity inversion source (engine Section 6.3); does NOT hide" },
    affected_element_names: ["Alberta PHN"], verified_against_sample_xml: true }),

  // ===== C050E: Accident Details (page 2) =====
  r({ form_id: "C050E", rule_code: "BR1", ordinal: 1, rule_type: "business", source_document: C050E, source_page: 2,
    trigger_element_name: "Date of Injury",
    trigger_condition: { description: "Date of Injury <= current date and >= patient date of birth" },
    affected_element_names: ["Date of Injury"] }),
  r({ form_id: "C050E", rule_code: "SR4", ordinal: 1, rule_type: "business", source_document: C050E, source_page: 2,
    trigger_element_name: "Did the injury/condition develop over time",
    trigger_condition: { description: "= Yes", note: "warning: date of injury should equal date of exam" },
    affected_element_names: ["Date of Injury"] }),

  // ===== C050E: Injury Details (pages 2 to 3) =====
  r({ form_id: "C050E", rule_code: "BR1", ordinal: 2, rule_type: "business", source_document: C050E, source_page: 2,
    trigger_element_name: "Date of Examination",
    trigger_condition: { description: "Date of Examination <= current date and >= Date of Injury" },
    affected_element_names: ["Date of Examination"] }),
  r({ form_id: "C050E", rule_code: "BR2", ordinal: 1, rule_type: "business", source_document: C050E, source_page: 2,
    trigger_element_name: "Part of body; Nature of injury",
    trigger_condition: { description: "must be a valid combination (POB-NOI Validations)", realizes: "VAL-X03" },
    affected_element_names: ["Part of body", "Nature of injury"] }),
  r({ form_id: "C050E", rule_code: "BR3", ordinal: 1, rule_type: "business", source_document: C050E, source_page: 2,
    trigger_element_name: "Part of body; Side of body; Nature of injury (tabular)",
    trigger_condition: { description: "each combination in the table must be unique", realizes: "VAL-X04" },
    affected_element_names: ["injury table"] }),
  r({ form_id: "C050E", rule_code: "BR5", ordinal: 2, rule_type: "business", source_document: C050E, source_page: 3,
    trigger_element_name: "Part of body; Side of body (tabular)",
    trigger_condition: { description: "must be a valid combination", realizes: "VAL-X02", note: "open item 3: cites nonexistent SOB POB Relations tab; use the Side of Body Required flag on Part Of Body Codes" },
    affected_element_names: ["Side of body"] }),
  r({ form_id: "C050E", rule_code: "BR6", ordinal: 1, rule_type: "business", source_document: C050E, source_page: 3,
    trigger_element_name: "Diagnostic code 2; Diagnostic code 3",
    trigger_condition: { description: "code 2 requires code 1; code 3 requires codes 1 and 2", realizes: "VAL-X05" },
    affected_element_names: ["Diagnostic code 2", "Diagnostic code 3"] }),
  r({ form_id: "C050E", rule_code: "BR8", ordinal: 1, rule_type: "business", source_document: C050E, source_page: 3,
    trigger_element_name: "injury table",
    trigger_condition: { description: "at least one valid row in Part/Side/Nature" },
    affected_element_names: ["injury table"] }),
  r({ form_id: "C050E", rule_code: "BR9", ordinal: 1, rule_type: "business", source_document: C050E, source_page: 3,
    trigger_element_name: "Part of body; Side of body; Nature of injury (row)",
    trigger_condition: { description: "if any one populated the others must be (BR5 dictates whether Side is required)", realizes: "VAL-X06" },
    affected_element_names: ["injury row"] }),
  r({ form_id: "C050E", rule_code: "SR1", ordinal: 1, rule_type: "show_hide", source_document: C050E, source_page: 2,
    trigger_element_name: "Are you aware of any prior conditions in the same anatomical area",
    trigger_condition: { description: "= Yes" },
    affected_element_names: ["Please provide diagnosis and treatment(s) for prior conditions"] }),
  r({ form_id: "C050E", rule_code: "SR3", ordinal: 1, rule_type: "show_hide", source_document: C050E, source_page: 3,
    trigger_element_name: "Part of body",
    trigger_condition: { description: "in {Arm, Elbow, Finger, Hand, Shoulder, Wrist, Thumb, Neck}", realizes: "VAL-X07" },
    affected_element_names: ["Dominant hand"] }),
  r({ form_id: "C050E", rule_code: "SR4", ordinal: 2, rule_type: "show_hide", source_document: C050E, source_page: 3,
    trigger_element_name: "injury table row count",
    trigger_condition: { description: "= 5 rows enabled", realizes: "VAL-X08" },
    affected_element_names: ["If more than 5 parts of body, please describe any additional injuries"] }),
  r({ form_id: "C050E", rule_code: "IBR1", ordinal: 1, rule_type: "business", source_document: C050E, source_page: 2,
    trigger_element_name: "Are you aware of any prior conditions in the same anatomical area",
    trigger_condition: { description: "blank or No -> dependent must be blank; Yes -> dependent must not be blank" },
    affected_element_names: ["Please provide diagnosis and treatment(s) for prior conditions"] }),
  r({ form_id: "C050E", rule_code: "IBR2", ordinal: 1, rule_type: "business", source_document: C050E, source_page: 3,
    trigger_element_name: "Has the diagnosis changed",
    trigger_condition: { description: "blank or No -> dependent must be blank; Yes -> dependent must not be blank" },
    affected_element_names: ["Describe what has changed and include current diagnosis"] }),

  // ===== C050E: Treatment Plan Details (pages 3 to 4) =====
  r({ form_id: "C050E", rule_code: "BR1", ordinal: 3, rule_type: "business", source_document: C050E, source_page: 3,
    trigger_element_name: "Consultations/Referrals/Investigations Type",
    trigger_condition: { description: "Type = Other -> Details (same row) becomes required" },
    affected_element_names: ["Details (same row)"] }),
  r({ form_id: "C050E", rule_code: "BR2", ordinal: 2, rule_type: "business", source_document: C050E, source_page: 4,
    trigger_element_name: "Prescription name; Strength; Daily intake (row)",
    trigger_condition: { description: "any one populated -> the other two become required" },
    affected_element_names: ["Prescription name", "Strength", "Daily intake"] }),
  r({ form_id: "C050E", rule_code: "BR3", ordinal: 2, rule_type: "business", source_document: C050E, source_page: 4,
    trigger_element_name: "Category; Type; Details (row)",
    trigger_condition: { description: "Category or Type populated -> other required; Details populated -> Category and Type required" },
    affected_element_names: ["Category", "Type"] }),
  r({ form_id: "C050E", rule_code: "SR1", ordinal: 2, rule_type: "show_hide", source_document: C050E, source_page: 4,
    trigger_element_name: "Were narcotics/opioids prescribed on this visit",
    trigger_condition: { description: "= Yes", realizes: "VAL-X09" },
    affected_element_names: ["Prescription name", "Strength", "Daily intake (tab/ml)"] }),
  r({ form_id: "C050E", rule_code: "SR5", ordinal: 1, rule_type: "business", source_document: C050E, source_page: 4,
    trigger_element_name: "Consultations/Referrals/Investigations Type",
    trigger_condition: { description: "on choose, validate expedite eligibility (Category Type Expedite Codes)", realizes: "VAL-X10" },
    affected_element_names: ["expedite flag"] }),
  r({ form_id: "C050E", rule_code: "SR7", ordinal: 1, rule_type: "help_text", source_document: C050E, source_page: 4,
    trigger_element_name: "expedite checkbox",
    trigger_condition: { description: "service checked to expedite" },
    affected_element_names: ["Your request for expedited service will be reviewed by WCB and your patient will be advised accordingly."] }),
  r({ form_id: "C050E", rule_code: "SR13", ordinal: 1, rule_type: "code_list_switch", source_document: C050E, source_page: 4,
    trigger_element_name: "Category",
    trigger_condition: { description: "dropdown options from Category Type Expedite Codes", realizes: "VAL-X11" },
    affected_element_names: ["Category options"], switches_code_list_to: "Category Type Expedite Codes" }),
  r({ form_id: "C050E", rule_code: "SR17", ordinal: 1, rule_type: "help_text", source_document: C050E, source_page: 4,
    trigger_element_name: "Category",
    trigger_condition: { description: "= Investigation" },
    affected_element_names: ["Please attach the appropriate diagnostic requisition form when requesting an Investigation."] }),

  // ===== C050E: Return to Work Details (pages 5 to 6). The primary show/hide block. =====
  r({ form_id: "C050E", rule_code: "BR2", ordinal: 3, rule_type: "business", source_document: C050E, source_page: 5,
    trigger_element_name: "Estimated date you expect the patient will be able to perform pre-accident level work",
    trigger_condition: { description: ">= Date of Examination" },
    affected_element_names: ["Estimated date you expect the patient will be able to perform pre-accident level work"] }),
  r({ form_id: "C050E", rule_code: "BR8", ordinal: 2, rule_type: "business", source_document: C050E, source_page: 5,
    trigger_element_name: "Date the patient returned to work",
    trigger_condition: { description: "> Date of Injury" },
    affected_element_names: ["Date the patient returned to work"] }),
  r({ form_id: "C050E", rule_code: "BR9", ordinal: 2, rule_type: "business", source_document: C050E, source_page: 5,
    trigger_element_name: "Number of hours patient is capable of working per day",
    trigger_condition: { description: "> 0 and <= 24", realizes: "VAL-X12" },
    affected_element_names: ["Number of hours patient is capable of working per day"] }),
  r({ form_id: "C050E", rule_code: "SR1", ordinal: 3, rule_type: "show_hide", source_document: C050E, source_page: 5,
    trigger_element_name: "Will/has the patient miss(ed) work beyond the date of accident",
    trigger_condition: { description: "Yes -> enable Has the patient returned to work, hide Modified duties and Modified hours. No -> enable Modified duties and Modified hours, clear and hide Has the patient returned to work" },
    affected_element_names: ["Has the patient returned to work", "Modified duties", "Modified hours"] }),
  r({ form_id: "C050E", rule_code: "SR2", ordinal: 1, rule_type: "show_hide", source_document: C050E, source_page: 5,
    trigger_element_name: "Has the patient returned to work",
    trigger_condition: { description: "Yes -> enable Date returned, Modified duties, Modified hours; hide Current Capabilities, Other reasons, Other restrictions, Estimated date pre-accident. No -> the inverse" },
    affected_element_names: ["Date the patient returned to work", "Modified duties", "Modified hours", "Current Capabilities", "Other reasons why the patient cannot work", "Other restrictions or additional comments", "Estimated date you expect the patient will be able to perform pre-accident work"] }),
  r({ form_id: "C050E", rule_code: "SR3", ordinal: 2, rule_type: "show_hide", source_document: C050E, source_page: 6,
    trigger_element_name: "Modified duties; Modified hours",
    trigger_condition: { description: "both No -> enable Other restrictions, clear and hide the block. both Yes -> enable all five. the two mixed branches per the board text", note: "SR3 is the rule that collapses the capability block (engine Section 4.4)" },
    affected_element_names: ["Number of hours patient is capable of working per day", "Current Capabilities", "Other reasons why the patient cannot work", "Other restrictions or additional comments", "Estimated date you expect the patient will be able to perform pre-accident work"] }),
  r({ form_id: "C050E", rule_code: "SR5", ordinal: 2, rule_type: "show_hide", source_document: C050E, source_page: 5,
    trigger_element_name: "Sitting", trigger_condition: { description: "= Limited to" },
    affected_element_names: ["Hours (approx.) (sitting)"] }),
  r({ form_id: "C050E", rule_code: "SR6", ordinal: 1, rule_type: "show_hide", source_document: C050E, source_page: 5,
    trigger_element_name: "Standing", trigger_condition: { description: "= Limited to" },
    affected_element_names: ["Hours (approx.) (standing)"] }),
  r({ form_id: "C050E", rule_code: "SR7", ordinal: 2, rule_type: "show_hide", source_document: C050E, source_page: 5,
    trigger_element_name: "Walking", trigger_condition: { description: "= Limited to" },
    affected_element_names: ["Hours (approx.) (walking)"] }),
  r({ form_id: "C050E", rule_code: "SR17", ordinal: 2, rule_type: "show_hide", source_document: C050E, source_page: 6,
    trigger_element_name: "Lifting", trigger_condition: { description: "= Limited to" },
    affected_element_names: ["Max of"] }),
  r({ form_id: "C050E", rule_code: "SR21", ordinal: 1, rule_type: "show_hide", source_document: C050E, source_page: 6,
    trigger_element_name: "Driving", trigger_condition: { description: "= Limited to" },
    affected_element_names: ["Hours (approx.) (driving)"] }),

  // ===== C050E: Other Information, Attachments (pages 6 to 7) =====
  r({ form_id: "C050E", rule_code: "BR6", ordinal: 2, rule_type: "business", source_document: C050E, source_page: 6,
    trigger_element_name: "Attachment Type", trigger_condition: { description: "populated -> File becomes required" },
    affected_element_names: ["File"] }),
  r({ form_id: "C050E", rule_code: "BR7", ordinal: 1, rule_type: "business", source_document: C050E, source_page: 6,
    trigger_element_name: "Attachment Type", trigger_condition: { description: "= Other -> Description becomes required" },
    affected_element_names: ["Description"] }),
  r({ form_id: "C050E", rule_code: "SR9", ordinal: 1, rule_type: "business", source_document: C050E, source_page: 7,
    trigger_element_name: "attachments", trigger_condition: { description: "max count per form (Form ID Maximum Attachments)" },
    affected_element_names: ["attachment count"] }),
  r({ form_id: "C050E", rule_code: "SR11", ordinal: 1, rule_type: "business", source_document: C050E, source_page: 7,
    trigger_element_name: "attachments", trigger_condition: { description: "max size (Form ID To Attachment Codes)" },
    affected_element_names: ["attachment size"] }),
  r({ form_id: "C050E", rule_code: "SR12", ordinal: 1, rule_type: "business", source_document: C050E, source_page: 7,
    trigger_element_name: "attachments", trigger_condition: { description: "allowed types per report (Form ID To Attachment Codes)" },
    affected_element_names: ["attachment type"] }),

  // ===== C050E: Invoice Details (page 7) =====
  r({ form_id: "C050E", rule_code: "BR1", ordinal: 3, rule_type: "business", source_document: C050E, source_page: 7,
    trigger_element_name: "Modifier field 2; Modifier field 3",
    trigger_condition: { description: "field 2 requires field 1; field 3 requires 1 and 2" },
    affected_element_names: ["Modifier fields"] }),
  r({ form_id: "C050E", rule_code: "BR3", ordinal: 3, rule_type: "business", source_document: C050E, source_page: 7,
    trigger_element_name: "Calls", trigger_condition: { description: "numeric, > 0 and <= 9999.99" },
    affected_element_names: ["Calls"] }),
  r({ form_id: "C050E", rule_code: "BR6", ordinal: 3, rule_type: "business", source_document: C050E, source_page: 7,
    trigger_element_name: "Encounters", trigger_condition: { description: "> 0 and <= 9" },
    affected_element_names: ["Encounters"] }),
  r({ form_id: "C050E", rule_code: "BR18", ordinal: 1, rule_type: "business", source_document: C050E, source_page: 7,
    trigger_element_name: "invoice line", trigger_condition: { description: "if visible, all required line fields must be populated" },
    affected_element_names: ["invoice line"] }),
  r({ form_id: "C050E", rule_code: "SR6", ordinal: 3, rule_type: "business", source_document: C050E, source_page: 7,
    trigger_element_name: "Calls", trigger_condition: { description: "empty on submit -> value 1 (invoice default, not a clinical value)" },
    affected_element_names: ["Calls"] }),
  r({ form_id: "C050E", rule_code: "SR7", ordinal: 3, rule_type: "business", source_document: C050E, source_page: 7,
    trigger_element_name: "Encounters", trigger_condition: { description: "empty on submit -> value 1 (invoice default, not a clinical value)" },
    affected_element_names: ["Encounters"] }),
  r({ form_id: "C050E", rule_code: "SR11", ordinal: 2, rule_type: "business", source_document: C050E, source_page: 7,
    trigger_element_name: "Practitioner Role; Skill code", trigger_condition: { description: "if a role to skill relationship exists, default Skill code to it" },
    affected_element_names: ["Skill code"] }),
  r({ form_id: "C050E", rule_code: "SR13", ordinal: 2, rule_type: "business", source_document: C050E, source_page: 7,
    trigger_element_name: "Submit Report", trigger_condition: { description: "copy Facility type, Date of exam (From and To), Skill code to each completed invoice line" },
    affected_element_names: ["invoice line tabular fields"] }),
  r({ form_id: "C050E", rule_code: "SR17", ordinal: 2, rule_type: "help_text", source_document: C050E, source_page: 7,
    trigger_element_name: "invoice section", trigger_condition: { description: "3 invoice lines displayed by default" },
    affected_element_names: ["invoice lines default count"] }),

  // ===== C151S: the no change chain (SR30, SR28, E1) and the RTW gate (SR1, SR2, SR3) =====
  // Verbatim from the C151S transcription. Criteria 9 and 10. Previously transcribed WRONG.
  r({ form_id: "C151S", rule_code: "SR30", ordinal: 1, rule_type: "show_hide", source_document: C151S, source_page: 5,
    trigger_element_name: "Has the patient's Return to Work status changed",
    trigger_condition: { description: "Yes or No -> enable Will/has the patient miss(ed) work beyond the date of accident. Never short circuits to signature." },
    affected_element_names: ["Will/has the patient miss(ed) work beyond the date of accident"], clears_on_hide: false }),
  r({ form_id: "C151S", rule_code: "SR28", ordinal: 1, rule_type: "show_hide", source_document: C151S, source_page: 5,
    trigger_element_name: "Has the patient's Return to Work status changed (E1)",
    trigger_condition: { description: "not changed -> hide the OIS specific questions, Reviewed work capabilities, Patient was assessed and now deemed, OIS follow up visit required; show Estimated date pre-accident. changed -> the inverse. Hides FIVE fields, not sixty six." },
    affected_element_names: ["OIS specific questions", "Reviewed work capabilities with patient", "Patient was assessed and now deemed", "OIS follow-up visit required", "Estimated date you expect the patient will be able to perform pre-accident work"] }),
  r({ form_id: "C151S", rule_code: "E1", ordinal: 1, rule_type: "code_list_switch", source_document: C151S, source_page: 5,
    trigger_element_name: "Has the patient's Return to Work status changed (E1)",
    trigger_condition: { description: "= No (N) -> the capability axes E14, E16, E18, E20, E22 use Basic Work Restriction Codes instead of Extended. Does NOT hide the fields.", note: "sourced from the workbook annotation, not the UI PDF (engine Section 4.4). Criterion 9." },
    affected_element_names: ["E14", "E16", "E18", "E20", "E22"], clears_on_hide: false, switches_code_list_to: "Basic Work Restriction Codes" }),
  r({ form_id: "C151S", rule_code: "SR1", ordinal: 1, rule_type: "show_hide", source_document: C151S, source_page: 5,
    trigger_element_name: "Will/has the patient miss(ed) work beyond the date of accident",
    trigger_condition: { description: "Yes -> enable Has the patient returned to work, hide Modified duties and Modified hours. No -> enable Modified duties and Modified hours, clear and hide Has the patient returned to work" },
    affected_element_names: ["Has the patient returned to work", "Modified duties", "Modified hours"] }),
  r({ form_id: "C151S", rule_code: "SR2", ordinal: 1, rule_type: "show_hide", source_document: C151S, source_page: 6,
    trigger_element_name: "Has the patient returned to work",
    trigger_condition: { description: "Yes -> enable Date returned, Modified duties, Modified hours; hide Current Capabilities, Other reasons, Other restrictions, Estimated date. No -> the inverse" },
    affected_element_names: ["Date the patient returned to work", "Modified duties", "Modified hours", "Current Capabilities", "Other reasons why the patient cannot work", "Other restrictions or additional comments", "Estimated date you expect the patient will be able to perform pre-accident work"] }),
  r({ form_id: "C151S", rule_code: "SR3", ordinal: 1, rule_type: "show_hide", source_document: C151S, source_page: 6,
    trigger_element_name: "Modified duties; Modified hours",
    trigger_condition: { description: "both No -> collapse the capability block (enable Other restrictions; clear and hide Number of hours, Current Capabilities, Other reasons, Estimated date). both Yes and the two mixed branches per the board text", note: "SR3 is what actually collapses the capability block, the same as every clinical form" },
    affected_element_names: ["Number of hours patient is capable of working per day", "Current Capabilities", "Other reasons why the patient cannot work", "Other restrictions or additional comments", "Estimated date you expect the patient will be able to perform pre-accident work"] })
];
