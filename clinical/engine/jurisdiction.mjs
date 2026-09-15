/* Continuum Prompt 45: provincial rules resolvers.

   Alberta is a row. Callers never branch on a jurisdiction code. Every resolver
   requires an explicit jurisdiction (or a clinic that carries one) and fails
   named if it is missing, inactive when access is required, or if the looked
   up rule is absent. No silent default. No dashes anywhere. */

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();

export function namedError(code, message, extra) {
  const e = new Error(message);
  e.code = code;
  if (extra && typeof extra === "object") Object.assign(e, extra);
  return e;
}

function requireStore(store) {
  if (!store || typeof store !== "object") {
    throw namedError("JURISDICTION-STORE-MISSING", "A provincial rules store is required. Never default.");
  }
  return store;
}

function requireCode(jurisdiction) {
  const code = typeof jurisdiction === "string"
    ? norm(jurisdiction)
    : norm(jurisdiction && (jurisdiction.code || jurisdiction.jurisdiction_code));
  if (!code) {
    throw namedError("JURISDICTION-MISSING", "A resolver was called with no jurisdiction. Never default.");
  }
  return code.toUpperCase();
}

export function findJurisdiction(store, code) {
  requireStore(store);
  const c = requireCode(code);
  return (store.jurisdictions || []).find((j) => norm(j.code).toUpperCase() === c) || null;
}

// resolve_jurisdiction(clinic) -> jurisdiction row. Clinic must carry
// jurisdiction_code. Missing clinic, missing code, or unknown code fails.
export function resolveJurisdiction(clinic, store) {
  requireStore(store);
  if (!clinic) {
    throw namedError("JURISDICTION-MISSING", "A clinic is required to resolve a jurisdiction. Never default.");
  }
  const code = norm(clinic.jurisdiction_code || clinic.jurisdiction);
  if (!code) {
    throw namedError("JURISDICTION-MISSING", "Clinic " + (clinic.id || clinic.name || "(unnamed)") + " has no jurisdiction_code. Never default.");
  }
  const row = findJurisdiction(store, code);
  if (!row) {
    throw namedError("JURISDICTION-UNKNOWN", "Jurisdiction " + code + " is not in the store. Never default.", { jurisdiction: code });
  }
  return { ...row };
}

export function assertClinicAccess(clinic, store) {
  const row = resolveJurisdiction(clinic, store);
  if (!row.active) {
    throw namedError(
      "INACTIVE-JURISDICTION",
      "Clinic access blocked: jurisdiction " + row.code + " (" + row.name + ") is inactive. No fallback jurisdiction is applied.",
      { jurisdiction: row.code, clinic_id: clinic && clinic.id }
    );
  }
  return row;
}

export function resolveDisclosureProfile(jurisdiction, store) {
  requireStore(store);
  const code = requireCode(jurisdiction);
  const row = findJurisdiction(store, code);
  if (!row) {
    throw namedError("JURISDICTION-UNKNOWN", "Jurisdiction " + code + " is not in the store. Never default.", { jurisdiction: code });
  }
  const id = norm(row.employer_disclosure_profile);
  const profile = store.disclosureProfiles && store.disclosureProfiles[id];
  if (!profile) {
    throw namedError("DISCLOSURE-PROFILE-MISSING", "Jurisdiction " + code + " has no disclosure profile " + id + ".", { jurisdiction: code, profile: id });
  }
  return { ...profile, jurisdiction: code };
}

export function resolveConsentProfile(jurisdiction, store) {
  requireStore(store);
  const code = requireCode(jurisdiction);
  const row = findJurisdiction(store, code);
  if (!row) {
    throw namedError("JURISDICTION-UNKNOWN", "Jurisdiction " + code + " is not in the store. Never default.", { jurisdiction: code });
  }
  const id = norm(row.consent_profile);
  const profile = store.consentProfiles && store.consentProfiles[id];
  if (!profile) {
    throw namedError("CONSENT-PROFILE-MISSING", "Jurisdiction " + code + " has no consent profile " + id + ".", { jurisdiction: code, profile: id });
  }
  return { ...profile, jurisdiction: code };
}

export function resolveForms(jurisdiction, contract, role, reportKind, store) {
  requireStore(store);
  const code = requireCode(jurisdiction);
  if (!findJurisdiction(store, code)) {
    throw namedError("JURISDICTION-UNKNOWN", "Jurisdiction " + code + " is not in the store. Never default.", { jurisdiction: code });
  }
  const c = norm(contract);
  const r = norm(role);
  const k = norm(reportKind);
  if (!c || !r || !k) {
    throw namedError("FORMS-ARGS-MISSING", "resolveForms requires jurisdiction, contract, role, and report_kind.");
  }
  const ids = (store.contractRoleForms || [])
    .filter((row) =>
      norm(row.jurisdiction_code).toUpperCase() === code
      && norm(row.contract_id) === c
      && norm(row.practitioner_role) === r
      && norm(row.report_kind) === k
    )
    .map((row) => row.form_id);
  return ids;
}

export function resolveCodeList(jurisdiction, formId, element, store) {
  requireStore(store);
  const code = requireCode(jurisdiction);
  if (!findJurisdiction(store, code)) {
    throw namedError("JURISDICTION-UNKNOWN", "Jurisdiction " + code + " is not in the store. Never default.", { jurisdiction: code });
  }
  const form = norm(formId);
  const elName = typeof element === "string" ? norm(element) : norm(element && (element.element_name || element.name));
  if (!form || !elName) {
    throw namedError("CODE-LIST-ARGS-MISSING", "resolveCodeList requires jurisdiction, form_id, and an element.");
  }
  const el = (store.elements || []).find((e) =>
    norm(e.jurisdiction_code).toUpperCase() === code
    && norm(e.form_id) === form
    && norm(e.element_name) === elName
  );
  if (!el || !el.code_list_name) return [];
  return (store.codeValues || [])
    .filter((v) =>
      norm(v.jurisdiction_code).toUpperCase() === code
      && norm(v.list_name) === norm(el.code_list_name)
    )
    .map((v) => ({ code: v.code, description: v.description, list_name: v.list_name }));
}

export function resolveFee(jurisdiction, formId, role, tier, onDate, store) {
  requireStore(store);
  const code = requireCode(jurisdiction);
  if (!findJurisdiction(store, code)) {
    throw namedError("JURISDICTION-UNKNOWN", "Jurisdiction " + code + " is not in the store. Never default.", { jurisdiction: code });
  }
  const form = norm(formId);
  const r = norm(role);
  const t = norm(tier);
  const day = norm(onDate).slice(0, 10);
  if (!form || !r || !t || !day) {
    throw namedError("FEE-ARGS-MISSING", "resolveFee requires jurisdiction, form_id, role, tier, and on_date.");
  }
  const hits = (store.fees || []).filter((f) => {
    if (norm(f.jurisdiction_code).toUpperCase() !== code) return false;
    if (norm(f.form_id) !== form) return false;
    if (norm(f.practitioner_role) !== r) return false;
    if (norm(f.fee_tier) !== t) return false;
    const from = norm(f.effective_from).slice(0, 10);
    const to = f.effective_to ? norm(f.effective_to).slice(0, 10) : null;
    if (from && day < from) return false;
    if (to && day > to) return false;
    return true;
  });
  if (!hits.length) {
    throw namedError(
      "FEE-MISSING",
      "No fee row is effective for " + code + " " + form + " " + r + " " + t + " on " + day + ". Nearest row is not used.",
      { jurisdiction: code, form_id: form, role: r, tier: t, on_date: day }
    );
  }
  hits.sort((a, b) => norm(b.effective_from).localeCompare(norm(a.effective_from)));
  return Number(hits[0].amount);
}

const addCalendarDays = (dateStr, n) => {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const dow = (dateStr) => new Date(dateStr + "T00:00:00Z").getUTCDay();

export function holidaySet(store, jurisdiction) {
  const code = requireCode(jurisdiction);
  return new Set(
    (store.holidays || [])
      .filter((h) => norm(h.jurisdiction_code).toUpperCase() === code)
      .map((h) => norm(h.holiday_date).slice(0, 10))
  );
}

export function isStoreBusinessDay(dateStr, holidays) {
  const hol = holidays instanceof Set ? holidays : new Set(holidays || []);
  const d = dow(dateStr);
  return d !== 0 && d !== 6 && !hol.has(dateStr);
}

function addBusinessDays(dateStr, n, holidays) {
  let d = dateStr;
  let added = 0;
  let guard = 0;
  while (added < n && guard++ < 60) {
    d = addCalendarDays(d, 1);
    if (isStoreBusinessDay(d, holidays)) added++;
  }
  return d;
}

function localTime(fromDatetime) {
  const s = norm(fromDatetime);
  const m = s.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : "00:00";
}

function localDate(fromDatetime) {
  return norm(fromDatetime).slice(0, 10);
}

export function resolveDeadline(jurisdiction, kind, fromDatetime, store) {
  requireStore(store);
  const code = requireCode(jurisdiction);
  if (!findJurisdiction(store, code)) {
    throw namedError("JURISDICTION-UNKNOWN", "Jurisdiction " + code + " is not in the store. Never default.", { jurisdiction: code });
  }
  const k = norm(kind);
  if (!k || !norm(fromDatetime)) {
    throw namedError("DEADLINE-ARGS-MISSING", "resolveDeadline requires jurisdiction, kind, and from_datetime.");
  }
  const rule = (store.deadlines || []).find((d) =>
    norm(d.jurisdiction_code).toUpperCase() === code && norm(d.deadline_kind) === k
  );
  if (!rule) {
    throw namedError(
      "DEADLINE-MISSING",
      "No deadline rule " + k + " is configured for " + code + ". 48 hours is not assumed.",
      { jurisdiction: code, kind: k }
    );
  }
  const start = localDate(fromDatetime);
  const holidays = holidaySet(store, code);
  let date;
  if (norm(rule.basis) === "business") {
    date = addBusinessDays(start, Number(rule.value_days), holidays);
  } else {
    date = addCalendarDays(start, Number(rule.value_days));
  }
  const time = rule.cutoff_local_time
    ? String(rule.cutoff_local_time).slice(0, 5)
    : localTime(fromDatetime);
  return { date, time, kind: k, jurisdiction: code, basis: rule.basis };
}

const PACK_REQUIRED = [
  "jurisdiction_row",
  "form_definition",
  "form_element",
  "code_list",
  "code_value",
  "contract_role",
  "contract_role_form",
  "fee_schedule",
  "deadline",
  "disclosure_profile",
  "consent_profile",
];

export function packGaps(jurisdiction, store) {
  requireStore(store);
  const code = requireCode(jurisdiction);
  const missing = [];
  const row = findJurisdiction(store, code);
  if (!row) {
    return PACK_REQUIRED.slice();
  }
  const has = (arr, pred) => (arr || []).some(pred);
  const inJ = (r) => norm(r.jurisdiction_code).toUpperCase() === code;
  if (!row.board_name || !row.practitioner_credential_pattern || !row.timezone) missing.push("jurisdiction_row");
  if (!has(store.forms, inJ)) missing.push("form_definition");
  if (!has(store.elements, inJ)) missing.push("form_element");
  if (!has(store.codeLists, inJ)) missing.push("code_list");
  if (!has(store.codeValues, inJ)) missing.push("code_value");
  if (!has(store.contractRoles, inJ)) missing.push("contract_role");
  if (!has(store.contractRoleForms, inJ)) missing.push("contract_role_form");
  if (!has(store.fees, inJ)) missing.push("fee_schedule");
  if (!has(store.deadlines, inJ)) missing.push("deadline");
  if (!store.disclosureProfiles || !store.disclosureProfiles[row.employer_disclosure_profile]) missing.push("disclosure_profile");
  if (!store.consentProfiles || !store.consentProfiles[row.consent_profile]) missing.push("consent_profile");
  return missing;
}

export function activateJurisdiction(jurisdiction, store) {
  requireStore(store);
  const code = requireCode(jurisdiction);
  const missing = packGaps(code, store);
  if (missing.length) {
    throw namedError(
      "JURISDICTION-PACK-INCOMPLETE",
      "Jurisdiction " + code + " cannot activate. Missing: " + missing.join(", ") + ".",
      { jurisdiction: code, missing }
    );
  }
  const row = findJurisdiction(store, code);
  row.active = true;
  return { ...row };
}

export function workerIdentifierProfile(jurisdiction, store) {
  const row = typeof jurisdiction === "object" && jurisdiction.worker_identifier_pattern
    ? jurisdiction
    : (findJurisdiction(store, jurisdiction) || null);
  if (!row) {
    throw namedError("JURISDICTION-MISSING", "A worker identifier profile requires an explicit jurisdiction.");
  }
  return {
    worker_identifier_label: row.worker_identifier_label,
    worker_identifier_pattern: row.worker_identifier_pattern,
  };
}

export function practitionerCredentialProfile(jurisdiction, store) {
  const row = typeof jurisdiction === "object" && jurisdiction.practitioner_credential_pattern
    ? jurisdiction
    : (findJurisdiction(store, jurisdiction) || null);
  if (!row) {
    throw namedError("JURISDICTION-MISSING", "A practitioner credential profile requires an explicit jurisdiction.");
  }
  return {
    practitioner_credential_label: row.practitioner_credential_label,
    practitioner_credential_pattern: row.practitioner_credential_pattern,
  };
}

export function boardNameForCode(code, store) {
  if (!norm(code)) return "UNKNOWN";
  const row = store ? findJurisdiction(store, code) : null;
  return row && row.board_name ? row.board_name : "UNKNOWN";
}

export const resolve_jurisdiction = resolveJurisdiction;
export const resolve_forms = resolveForms;
export const resolve_code_list = resolveCodeList;
export const resolve_fee = resolveFee;
export const resolve_deadline = resolveDeadline;
export const resolve_disclosure_profile = resolveDisclosureProfile;
