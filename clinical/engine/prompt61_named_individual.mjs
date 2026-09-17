/* Continuum Prompt 61 Section 6: named individual restriction.

   Built this way pending counsel. REPORT AND STOP on the privacy
   officer wording and counsel review. Do not invent that wording.
   Do not resolve Section 10.1 in code.

   6.1 Store the named person in a restricted field. System user
       reference OR free text.
   6.2 Visible to the coordinator and whoever must build the roster.
       Not visible on the general employer dashboard.
   6.3 Scheduler receives a scheduling constraint, not a reason.
   6.4 Log every access: user, timestamp, purpose.
   6.5 Never surface in aggregate, export, report, or intelligence.
   6.6 Tenant flag disables the capability cleanly.

   No dashes anywhere. */

export const COUNSEL_REVIEW = "STOP";
export const PRIVACY_OFFICER_WORDING = null;

export function tenantNamedIndividualEnabled(tenant) {
  if (!tenant) return true;
  if (tenant.named_individual_restriction_enabled === false) return false;
  return true;
}

export function storeNamedIndividual(input, tenant) {
  if (!tenantNamedIndividualEnabled(tenant)) {
    return { stored: false, code: "named_individual_disabled_by_tenant" };
  }
  const src = input || {};
  const person_ref = src.person_ref != null && String(src.person_ref).trim() !== "" ? String(src.person_ref) : null;
  const person_free_text = src.person_free_text != null && String(src.person_free_text).trim() !== "" ? String(src.person_free_text) : null;
  if (!person_ref && !person_free_text) {
    return { stored: false, code: "named_person_required" };
  }
  return {
    stored: true,
    restricted: true,
    person_ref,
    person_free_text,
    counsel_review: COUNSEL_REVIEW,
    privacy_officer_wording: PRIVACY_OFFICER_WORDING,
  };
}

function displayName(record) {
  if (!record) return "UNKNOWN";
  return record.person_free_text || record.person_ref || "UNKNOWN";
}

export function visibleNamedIndividual(record, viewer) {
  const role = viewer && viewer.role;
  if (role === "coordinator" || role === "roster_builder") {
    return { visible: true, record };
  }
  return { visible: false, record: null };
}

export function employerDashboardProjection(record) {
  return {
    named_individual: null,
    named_person: null,
    restriction_present: record && (record.person_ref || record.person_free_text) ? true : false,
  };
}

export function schedulerConstraint(record) {
  const name = displayName(record);
  return {
    constraint: "cannot be co rostered with " + name,
    reason: null,
  };
}

export function logNamedIndividualAccess(record, access, log) {
  const entry = {
    user: access && access.user ? access.user : null,
    at: access && access.at ? access.at : null,
    purpose: access && access.purpose ? access.purpose : null,
    field: "named_individual",
  };
  const next = Array.isArray(log) ? log.concat([entry]) : [entry];
  return { log: next, entry };
}

export function stripNamedIndividual(payload) {
  if (!payload || typeof payload !== "object") return payload;
  const out = Array.isArray(payload) ? payload.map(stripNamedIndividual) : { ...payload };
  if (!Array.isArray(out)) {
    delete out.person_ref;
    delete out.person_free_text;
    delete out.named_individual;
    delete out.named_person;
  }
  return out;
}

export function exportOrIntelligenceView(record, kind) {
  return {
    kind,
    payload: stripNamedIndividual(record || {}),
    named_individual: null,
  };
}
