/* Continuum Prompt 45: provincial rules source of truth.

   In memory mirror of migration 021 and seed 022. Tests and the engine resolvers
   load this module; Gary applies the SQL. Adding a real province is data plus a
   form pack, never a rewrite. Only Alberta (widened) and the unmistakably fake
   ZZ synthetic pack live here. The 002 seed already inserted inactive BC through
   YT rows with no packs: this file keeps them inactive and does not invent forms.

   No dashes anywhere. */

export const CONSENT_PROFILES = {
  alberta_statutory_report: {
    id: "alberta_statutory_report",
    board_submission: "statutory",
    employer_disclosure: "requires_consent_b",
    pink_copy: "always",
  },
  // ZZ pair: synthetic_test.employer_disclosure is none so it matches synthetic_open.employer_channel none (the pack is a fixture, not an employer publish path).
  synthetic_test: {
    id: "synthetic_test",
    board_submission: "requires_consent",
    employer_disclosure: "none",
    pink_copy: "always",
  },
  unspecified: {
    id: "unspecified",
    board_submission: "blocked",
    employer_disclosure: "blocked",
    pink_copy: "blocked",
  },
};

export const DISCLOSURE_PROFILES = {
  alberta_pink_copy: {
    id: "alberta_pink_copy",
    employer_channel: "worker_handoff",
    cognitive_fields: true,
    description: "Board mandated worker copy plus the narrower Continuum duty list",
  },
  synthetic_open: {
    id: "synthetic_open",
    employer_channel: "none",
    cognitive_fields: false,
    description: "Synthetic pack: nothing is disclosed to an employer",
  },
  unspecified: {
    id: "unspecified",
    employer_channel: "blocked",
    cognitive_fields: false,
    description: "Inactive jurisdiction placeholder: no disclosure profile is defined",
  },
};

// Alberta row: every value sourced (Prompt 45 Section 2).
export const ALBERTA_JURISDICTION = {
  code: "AB",
  name: "Alberta",
  board_name: "WCB Alberta",
  submission_channel: "batch_xml_upload",
  practitioner_credential_label: "billing number",
  practitioner_credential_pattern: "^.{8}$",
  worker_identifier_label: "Worker personal health number",
  worker_identifier_pattern: "^[0-9]{9}$",
  employer_disclosure_profile: "alberta_pink_copy",
  consent_profile: "alberta_statutory_report",
  timezone: "America/Edmonton",
  active: true,
};

export const SYNTHETIC_JURISDICTION = {
  code: "ZZ",
  name: "Synthetic Test Jurisdiction",
  board_name: "Synthetic Test Board",
  submission_channel: "synthetic",
  practitioner_credential_label: "synthetic credential",
  practitioner_credential_pattern: "^SYN[0-9]{3}$",
  worker_identifier_label: "Synthetic Worker Number",
  worker_identifier_pattern: "^SW[0-9]{4}$",
  employer_disclosure_profile: "synthetic_open",
  consent_profile: "synthetic_test",
  timezone: "UTC",
  active: false,
};

// 002 already seeded these inactive. No packs. Placeholders satisfy NOT NULL.
export const INACTIVE_PROVINCE_SEEDS = [
  ["BC", "British Columbia"],
  ["MB", "Manitoba"],
  ["NB", "New Brunswick"],
  ["NL", "Newfoundland and Labrador"],
  ["NT", "Northwest Territories"],
  ["NS", "Nova Scotia"],
  ["NU", "Nunavut"],
  ["ON", "Ontario"],
  ["PE", "Prince Edward Island"],
  ["QC", "Quebec"],
  ["SK", "Saskatchewan"],
  ["YT", "Yukon"],
];

export function inactiveJurisdictionRow(code, name) {
  return {
    code,
    name,
    board_name: name + " board (inactive, no pack)",
    submission_channel: "none",
    practitioner_credential_label: "unspecified",
    practitioner_credential_pattern: "^$",
    worker_identifier_label: "unspecified",
    worker_identifier_pattern: "^$",
    employer_disclosure_profile: "unspecified",
    consent_profile: "unspecified",
    timezone: "UTC",
    active: false,
  };
}

export const ALBERTA_DEADLINES = [
  {
    jurisdiction_code: "AB",
    deadline_kind: "first_report",
    value_days: 2,
    basis: "calendar",
    cutoff_local_time: null,
    statutory_source: "Workers Compensation Act s.34(1)",
  },
  {
    jurisdiction_code: "AB",
    deadline_kind: "rtw_opinion",
    value_days: 3,
    basis: "calendar",
    cutoff_local_time: null,
    statutory_source: "C459 Physician Reference Guide",
  },
  {
    jurisdiction_code: "AB",
    deadline_kind: "same_day_cutoff",
    value_days: 1,
    basis: "business",
    cutoff_local_time: "10:00",
    statutory_source: "WCB Fee Schedule, Appendix A",
  },
];

export const SYNTHETIC_DEADLINES = [
  {
    jurisdiction_code: "ZZ",
    deadline_kind: "first_report",
    value_days: 5,
    basis: "calendar",
    cutoff_local_time: null,
    statutory_source: "Synthetic pack (not a real statute)",
  },
  {
    jurisdiction_code: "ZZ",
    deadline_kind: "same_day_cutoff",
    value_days: 1,
    basis: "business",
    cutoff_local_time: "12:00",
    statutory_source: "Synthetic pack (not a real statute)",
  },
];

// 2026 Alberta statutory holidays used by the batch deadline path.
export const ALBERTA_HOLIDAYS = [
  { jurisdiction_code: "AB", holiday_date: "2026-01-01", name: "New Year Day" },
  { jurisdiction_code: "AB", holiday_date: "2026-02-16", name: "Family Day" },
  { jurisdiction_code: "AB", holiday_date: "2026-04-03", name: "Good Friday" },
  { jurisdiction_code: "AB", holiday_date: "2026-05-18", name: "Victoria Day" },
  { jurisdiction_code: "AB", holiday_date: "2026-07-01", name: "Canada Day" },
  { jurisdiction_code: "AB", holiday_date: "2026-08-03", name: "Heritage Day" },
  { jurisdiction_code: "AB", holiday_date: "2026-09-07", name: "Labour Day" },
  { jurisdiction_code: "AB", holiday_date: "2026-10-12", name: "Thanksgiving Day" },
  { jurisdiction_code: "AB", holiday_date: "2026-11-11", name: "Remembrance Day" },
  { jurisdiction_code: "AB", holiday_date: "2026-12-25", name: "Christmas Day" },
];

export const SYNTHETIC_HOLIDAYS = [
  { jurisdiction_code: "ZZ", holiday_date: "2099-01-01", name: "Synthetic Day" },
];

// Mirror of 002 Alberta GP rates. Loaded as data, never hard coded in the engine.
export const ALBERTA_FEES = [
  { jurisdiction_code: "AB", form_id: "C050E", practitioner_role: "GP", fee_tier: "same_day", amount: 96.98, effective_from: "2025-04-01", effective_to: null, source: "Alberta WCB GP rates 2025-04-01 (spec Section 2)" },
  { jurisdiction_code: "AB", form_id: "C050E", practitioner_role: "GP", fee_tier: "on_time", amount: 88.37, effective_from: "2025-04-01", effective_to: null, source: "Alberta WCB GP rates 2025-04-01 (spec Section 2)" },
  { jurisdiction_code: "AB", form_id: "C050E", practitioner_role: "GP", fee_tier: "late", amount: 55.70, effective_from: "2025-04-01", effective_to: null, source: "Alberta WCB GP rates 2025-04-01 (spec Section 2)" },
  { jurisdiction_code: "AB", form_id: "C151", practitioner_role: "GP", fee_tier: "same_day", amount: 58.91, effective_from: "2025-04-01", effective_to: null, source: "Alberta WCB GP rates 2025-04-01 (spec Section 2)" },
  { jurisdiction_code: "AB", form_id: "C151", practitioner_role: "GP", fee_tier: "on_time", amount: 53.69, effective_from: "2025-04-01", effective_to: null, source: "Alberta WCB GP rates 2025-04-01 (spec Section 2)" },
  { jurisdiction_code: "AB", form_id: "C151", practitioner_role: "GP", fee_tier: "late", amount: 33.85, effective_from: "2025-04-01", effective_to: null, source: "Alberta WCB GP rates 2025-04-01 (spec Section 2)" },
];

export const SYNTHETIC_FEES = [
  { jurisdiction_code: "ZZ", form_id: "TEST01", practitioner_role: "GP", fee_tier: "same_day", amount: 1.00, effective_from: "2026-01-01", effective_to: null, source: "Synthetic pack (not a real fee)" },
  { jurisdiction_code: "ZZ", form_id: "TEST01", practitioner_role: "GP", fee_tier: "on_time", amount: 0.75, effective_from: "2026-01-01", effective_to: null, source: "Synthetic pack (not a real fee)" },
  { jurisdiction_code: "ZZ", form_id: "TEST02", practitioner_role: "GP", fee_tier: "on_time", amount: 0.50, effective_from: "2026-01-01", effective_to: null, source: "Synthetic pack (not a real fee)" },
];

export const SYNTHETIC_FORMS = [
  { jurisdiction_code: "ZZ", form_id: "TEST01", form_name: "Synthetic First Report", version: "1.0", element_count: 6, max_attachments: 0, effective_from: "2026-01-01", report_kind: "initial" },
  { jurisdiction_code: "ZZ", form_id: "TEST02", form_name: "Synthetic Progress Report", version: "1.0", element_count: 6, max_attachments: 0, effective_from: "2026-01-01", report_kind: "progress" },
];

export const SYNTHETIC_ELEMENTS = [
  { jurisdiction_code: "ZZ", form_id: "TEST01", version: "1.0", element_seq: "1", element_name: "Form ID", ui_mapping: null, section_name: "General", data_type: "Char", length_min: 6, length_max: 6, format: null, min_occurs: 1, max_occurs: 1, code_list_name: null, optionality: "always_required", deprecated: false, path: "/SyntheticReport/Report/Type/" },
  { jurisdiction_code: "ZZ", form_id: "TEST01", version: "1.0", element_seq: "2", element_name: "Patient does not have a Synthetic Worker Number", ui_mapping: "A1", section_name: "Worker", data_type: "Alpha", length_min: 1, length_max: 1, format: null, min_occurs: 1, max_occurs: 1, code_list_name: "Synthetic Yes No", optionality: "always_required", deprecated: false, path: "/SyntheticReport/Worker/HasNoIdentifier/" },
  { jurisdiction_code: "ZZ", form_id: "TEST01", version: "1.0", element_seq: "3", element_name: "Synthetic Worker Number", ui_mapping: "A2", section_name: "Worker", data_type: "Char", length_min: 6, length_max: 6, format: null, min_occurs: 0, max_occurs: 1, code_list_name: null, optionality: "conditionally_available_required", deprecated: false, path: "/SyntheticReport/Worker/Identifier/" },
  { jurisdiction_code: "ZZ", form_id: "TEST01", version: "1.0", element_seq: "4", element_name: "Status", ui_mapping: "B1", section_name: "Report", data_type: "Char", length_min: 1, length_max: 8, format: null, min_occurs: 1, max_occurs: 1, code_list_name: "Synthetic Status Codes", optionality: "always_required", deprecated: false, path: "/SyntheticReport/Report/Status/" },
  { jurisdiction_code: "ZZ", form_id: "TEST01", version: "1.0", element_seq: "5", element_name: "Narrative", ui_mapping: "B2", section_name: "Report", data_type: "Char", length_min: 0, length_max: 200, format: null, min_occurs: 0, max_occurs: 1, code_list_name: null, optionality: "always_optional", deprecated: false, path: "/SyntheticReport/Report/Narrative/" },
  { jurisdiction_code: "ZZ", form_id: "TEST01", version: "1.0", element_seq: "6", element_name: "Practitioner credential", ui_mapping: "C1", section_name: "Practitioner", data_type: "Char", length_min: 6, length_max: 6, format: null, min_occurs: 1, max_occurs: 1, code_list_name: null, optionality: "always_required", deprecated: false, path: "/SyntheticReport/Practitioner/Credential/" },
  { jurisdiction_code: "ZZ", form_id: "TEST02", version: "1.0", element_seq: "1", element_name: "Form ID", ui_mapping: null, section_name: "General", data_type: "Char", length_min: 6, length_max: 6, format: null, min_occurs: 1, max_occurs: 1, code_list_name: null, optionality: "always_required", deprecated: false, path: "/SyntheticReport/Report/Type/" },
  { jurisdiction_code: "ZZ", form_id: "TEST02", version: "1.0", element_seq: "2", element_name: "Parent form", ui_mapping: "A1", section_name: "General", data_type: "Char", length_min: 6, length_max: 6, format: null, min_occurs: 1, max_occurs: 1, code_list_name: null, optionality: "always_required", deprecated: false, path: "/SyntheticReport/Report/ParentForm/" },
  { jurisdiction_code: "ZZ", form_id: "TEST02", version: "1.0", element_seq: "3", element_name: "Synthetic Worker Number", ui_mapping: "A2", section_name: "Worker", data_type: "Char", length_min: 6, length_max: 6, format: null, min_occurs: 1, max_occurs: 1, code_list_name: null, optionality: "always_required", deprecated: false, path: "/SyntheticReport/Worker/Identifier/" },
  { jurisdiction_code: "ZZ", form_id: "TEST02", version: "1.0", element_seq: "4", element_name: "Status", ui_mapping: "B1", section_name: "Report", data_type: "Char", length_min: 1, length_max: 8, format: null, min_occurs: 1, max_occurs: 1, code_list_name: "Synthetic Status Codes", optionality: "always_required", deprecated: false, path: "/SyntheticReport/Report/Status/" },
  { jurisdiction_code: "ZZ", form_id: "TEST02", version: "1.0", element_seq: "5", element_name: "Narrative", ui_mapping: "B2", section_name: "Report", data_type: "Char", length_min: 0, length_max: 200, format: null, min_occurs: 0, max_occurs: 1, code_list_name: null, optionality: "always_optional", deprecated: false, path: "/SyntheticReport/Report/Narrative/" },
  { jurisdiction_code: "ZZ", form_id: "TEST02", version: "1.0", element_seq: "6", element_name: "Follow up flag", ui_mapping: "B3", section_name: "Report", data_type: "Alpha", length_min: 1, length_max: 1, format: null, min_occurs: 1, max_occurs: 1, code_list_name: "Synthetic Yes No", optionality: "always_required", deprecated: false, path: "/SyntheticReport/Report/FollowUp/" },
];

export const SYNTHETIC_RULES = [
  {
    jurisdiction_code: "ZZ",
    form_id: "TEST01",
    version: "1.0",
    rule_code: "SYN1",
    ordinal: 1,
    rule_type: "conditional",
    source_document: "synthetic-pack",
    source_page: 1,
    trigger_element_name: "Patient does not have a Synthetic Worker Number",
    trigger_condition: { equals: "N" },
    affected_element_names: ["Synthetic Worker Number"],
    clears_on_hide: true,
  },
];

export const SYNTHETIC_CODE_LISTS = [
  { jurisdiction_code: "ZZ", list_name: "Synthetic Status Codes", source_version: "ZZ.1" },
  { jurisdiction_code: "ZZ", list_name: "Synthetic Yes No", source_version: "ZZ.1" },
];

export const SYNTHETIC_CODE_VALUES = [
  { jurisdiction_code: "ZZ", list_name: "Synthetic Status Codes", code: "OPEN", description: "Open" },
  { jurisdiction_code: "ZZ", list_name: "Synthetic Status Codes", code: "CLOSED", description: "Closed" },
  { jurisdiction_code: "ZZ", list_name: "Synthetic Yes No", code: "Y", description: "Yes" },
  { jurisdiction_code: "ZZ", list_name: "Synthetic Yes No", code: "N", description: "No" },
];

export const SYNTHETIC_CONTRACT_ROLES = [
  { jurisdiction_code: "ZZ", contract_id: "SYN001", contract_desc: "Synthetic General", practitioner_role: "GP", role_desc: "General Practitioner" },
];

export const SYNTHETIC_CONTRACT_ROLE_FORMS = [
  { jurisdiction_code: "ZZ", contract_id: "SYN001", practitioner_role: "GP", form_id: "TEST01", report_kind: "initial" },
  { jurisdiction_code: "ZZ", contract_id: "SYN001", practitioner_role: "GP", form_id: "TEST02", report_kind: "progress" },
];

export const ALBERTA_CONTRACT_ROLE_FORMS = [
  { jurisdiction_code: "AB", contract_id: "000001", practitioner_role: "GP", form_id: "C050E", report_kind: "initial" },
  { jurisdiction_code: "AB", contract_id: "000001", practitioner_role: "GP", form_id: "C151", report_kind: "progress" },
];

export function allJurisdictions() {
  return [
    { ...ALBERTA_JURISDICTION },
    { ...SYNTHETIC_JURISDICTION },
    ...INACTIVE_PROVINCE_SEEDS.map(([code, name]) => inactiveJurisdictionRow(code, name)),
  ];
}

// In memory store the resolvers read. Deep copied so activation tests can mutate active.
export function createProvincialStore(overrides = {}) {
  return {
    jurisdictions: (overrides.jurisdictions || allJurisdictions()).map((j) => ({ ...j })),
    deadlines: (overrides.deadlines || [...ALBERTA_DEADLINES, ...SYNTHETIC_DEADLINES]).map((d) => ({ ...d })),
    holidays: (overrides.holidays || [...ALBERTA_HOLIDAYS, ...SYNTHETIC_HOLIDAYS]).map((h) => ({ ...h })),
    fees: (overrides.fees || [...ALBERTA_FEES, ...SYNTHETIC_FEES]).map((f) => ({ ...f })),
    forms: (overrides.forms || SYNTHETIC_FORMS).map((f) => ({ ...f })),
    elements: (overrides.elements || SYNTHETIC_ELEMENTS).map((e) => ({ ...e })),
    rules: (overrides.rules || SYNTHETIC_RULES).map((r) => ({ ...r, trigger_condition: { ...r.trigger_condition }, affected_element_names: [...r.affected_element_names] })),
    codeLists: (overrides.codeLists || SYNTHETIC_CODE_LISTS).map((c) => ({ ...c })),
    codeValues: (overrides.codeValues || SYNTHETIC_CODE_VALUES).map((c) => ({ ...c })),
    forbidden: (overrides.forbidden || []).map((x) => ({ ...x })),
    contractRoles: (overrides.contractRoles || SYNTHETIC_CONTRACT_ROLES).map((c) => ({ ...c })),
    contractRoleForms: (overrides.contractRoleForms || [...SYNTHETIC_CONTRACT_ROLE_FORMS, ...ALBERTA_CONTRACT_ROLE_FORMS]).map((c) => ({ ...c })),
    consentProfiles: { ...CONSENT_PROFILES, ...(overrides.consentProfiles || {}) },
    disclosureProfiles: { ...DISCLOSURE_PROFILES, ...(overrides.disclosureProfiles || {}) },
  };
}
