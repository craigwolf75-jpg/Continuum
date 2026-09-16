/* Prompt 47 Part 4: PERMISSION = ROLE intersect SCOPE intersect ENTITLEMENT.

   AuthN may assume an existing IdP. This module is authorization domain logic.
   Enterprise roles (Part 4.2) and Continuum-side roles (Part 4.3) are data, not
   a UI. Admin may be delegated with expiry. Clinical authorship and signature
   are NEVER delegable. No em dashes or en dashes anywhere. */

import { namedError, nowFrom } from "./clinic_ops_util.mjs";

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();

export const ENTERPRISE_ROLES = Object.freeze({
  clinic_owner: {
    key: "clinic_owner",
    clinical: false,
    read_only: false,
    delegable: false,
    can_sign: false,
    sign_if_also_practitioner: true,
    never_delegate: ["clinical_authorship", "signature"],
  },
  regional_manager: {
    key: "regional_manager",
    clinical: false,
    read_only: false,
    delegable: false,
    hard: "no_clinical",
    aggregate_and_operational_only: true,
  },
  clinic_admin: {
    key: "clinic_admin",
    clinical: false,
    read_only: false,
    delegable: true,
    can_sign: false,
    cannot_read_raw_measurement: true,
    cannot_audit_own_privilege_alone: true,
    never_delegate: ["clinical_authorship", "signature"],
  },
  reception: {
    key: "reception",
    clinical: false,
    read_only: false,
    delegable: false,
    hard: "no_clinical",
    forbidden_report_sections: Object.freeze(["C", "D", "E"]),
  },
  medical_office_assistant: {
    key: "medical_office_assistant",
    clinical: true,
    read_only: false,
    delegable: false,
    can_sign: false,
    never_delegate: ["signature"],
  },
  physician: {
    key: "physician",
    clinical: true,
    read_only: false,
    delegable: false,
    invoice_hidden_by_default: true,
    never_delegate: ["clinical_authorship", "signature"],
  },
  nurse_practitioner: {
    key: "nurse_practitioner",
    clinical: true,
    blocked: true,
    blocked_at: "configuration",
    membership_role: "NP",
  },
  physiotherapist: {
    key: "physiotherapist",
    clinical: true,
    read_only: false,
    delegable: false,
    can_sign: false,
    cannot_author_restriction: true,
    cannot_change_restriction: true,
    never_delegate: ["signature"],
  },
  occupational_therapist: {
    key: "occupational_therapist",
    clinical: true,
    read_only: false,
    delegable: false,
    cannot_author_restriction: true,
  },
  billing_administrator: {
    key: "billing_administrator",
    clinical: false,
    read_only: false,
    delegable: false,
    hard: "no_clinical",
  },
  employer_liaison: {
    key: "employer_liaison",
    clinical: false,
    read_only: false,
    delegable: false,
    hard: "no_clinical",
    duty_verdicts_only: true,
  },
  clinic_auditor: {
    key: "clinic_auditor",
    clinical: true,
    read_only: true,
    delegable: false,
    raw_measurements: true,
  },
  locum: {
    key: "locum",
    clinical: true,
    read_only: false,
    delegable: false,
    requires_membership_dates: true,
    never_delegate: ["clinical_authorship", "signature"],
  },
  clinic_emergency: {
    key: "clinic_emergency",
    clinical: true,
    read_only: false,
    delegable: false,
    elevation: true,
    never_delegate: ["signature"],
  },
});

export const CONTINUUM_ROLES = Object.freeze({
  continuum_administrator: {
    key: "continuum_administrator",
    clinical: false,
    read_only: false,
    hard: "no_clinical",
    tenant_lifecycle: true,
    entitlements: true,
    config_publication: true,
    break_glass: true,
    default_clinical_access: false,
  },
  implementation_specialist: {
    key: "implementation_specialist",
    clinical: false,
    read_only: false,
    hard: "no_clinical",
    full_config_on_implementation_tenants: true,
    access_ends_at_go_live: true,
    time_bound: true,
    break_glass: true,
    default_clinical_access: false,
  },
  continuum_cs: {
    key: "continuum_cs",
    clinical: false,
    read_only: true,
    hard: "no_clinical",
    aggregate_only: true,
    no_elevation: true,
    sandbox_only: false,
  },
  support: {
    key: "support",
    clinical: false,
    read_only: true,
    hard: "no_clinical",
    diagnostic_only: true,
    break_glass: true,
    default_clinical_access: false,
  },
  sales: {
    key: "sales",
    clinical: false,
    read_only: true,
    hard: "sandbox_only",
    sandbox_only: true,
    production_access: false,
  },
  continuum_break_glass: {
    key: "continuum_break_glass",
    clinical: false,
    default_clinical_access: false,
    elevation: true,
  },
});

export const ROLE_ALIASES = Object.freeze({
  billing: "billing_administrator",
  customer_success: "continuum_cs",
  np: "nurse_practitioner",
});

export const ALL_ROLES = Object.freeze({ ...ENTERPRISE_ROLES, ...CONTINUUM_ROLES });

const CLINICAL_ACTIONS = Object.freeze([
  "clinical_read", "clinical_write", "clinical_authorship", "signature", "raw_measurement_read",
  "restriction_author", "restriction_change",
  "report_section_C", "report_section_D", "report_section_E",
]);
const WRITE_ACTIONS = Object.freeze([
  "clinical_write", "clinical_authorship", "signature",
  "restriction_author", "restriction_change",
]);

function canonicalRoleKey(roleKey) {
  const key = norm(roleKey);
  return ROLE_ALIASES[key] || key;
}

function roleOf(roleKey) {
  const key = canonicalRoleKey(roleKey);
  const row = ALL_ROLES[key];
  if (!row) throw namedError("ROLE-UNKNOWN", "Role " + roleKey + " is not in the Prompt 47 named role catalog.", { role_key: roleKey });
  return row;
}

function scopeMatches(grantScopeType, grantScopeId, requestScopeType, requestScopeId) {
  const gType = norm(grantScopeType);
  const rType = norm(requestScopeType);
  if (!gType || !rType) return false;
  if (gType === "organisation" && (rType === "organisation" || rType === "region" || rType === "location" || rType === "own_records")) {
    if (rType === "organisation") return !grantScopeId || grantScopeId === requestScopeId;
    return true;
  }
  if (gType === rType) return !grantScopeId || grantScopeId === requestScopeId;
  return false;
}

function denied(role, reason) {
  return { allowed: false, reason, role: role.key };
}

export function resolvePermission(roleKey, scope, entitlement, opts) {
  const options = opts || {};
  const store = options.store || {};
  const role = roleOf(roleKey);
  const action = norm(options.action || (scope && scope.action) || "");
  const requestScopeType = norm((scope && scope.type) || options.scope_type);
  const requestScopeId = (scope && (scope.id || scope.scope_id)) || options.scope_id;
  const entitled = options.entitlements || store.entitlements || [];
  const required = entitlement || options.entitlement_required || null;

  if (role.blocked) {
    return denied(role, "role-blocked-at-configuration");
  }
  if (role.key === "sales" && CLINICAL_ACTIONS.includes(action)) {
    return denied(role, "hard-restriction-no-clinical");
  }
  if (role.hard === "no_clinical" && CLINICAL_ACTIONS.includes(action)) {
    return denied(role, "hard-restriction-no-clinical");
  }
  if (role.read_only && WRITE_ACTIONS.includes(action)) {
    return denied(role, "hard-restriction-read-only");
  }
  if (role.can_sign === false && action === "signature" && !(role.sign_if_also_practitioner && options.also_practitioner === true)) {
    return denied(role, role.sign_if_also_practitioner ? "owner-not-practitioner" : "cannot-sign");
  }
  if (role.cannot_read_raw_measurement && action === "raw_measurement_read") {
    return denied(role, "raw-measurement-forbidden");
  }
  if (role.forbidden_report_sections && /^report_section_/i.test(action)) {
    const section = action.slice("report_section_".length).toUpperCase();
    if (role.forbidden_report_sections.includes(section)) {
      return denied(role, "report-section-forbidden");
    }
  }
  if (role.cannot_author_restriction && action === "restriction_author") {
    return denied(role, "restriction-author-forbidden");
  }
  if (role.cannot_change_restriction && action === "restriction_change") {
    return denied(role, "restriction-change-forbidden");
  }
  if (role.invoice_hidden_by_default && action === "invoice_read" && options.invoice_revealed !== true) {
    return denied(role, "invoice-hidden-by-default");
  }
  if (role.cannot_audit_own_privilege_alone && action === "privilege_audit_own" && options.second_auditor !== true) {
    return denied(role, "second-auditor-required");
  }
  if ((role.sandbox_only || role.production_access === false) && options.environment !== "sandbox") {
    return denied(role, "hard-restriction-sandbox-only");
  }
  if (role.access_ends_at_go_live && (options.tenant_status === "live" || options.go_live === true)) {
    return denied(role, "implementation-access-ended");
  }
  if (role.no_elevation && (action === "elevation" || action === "break_glass")) {
    return denied(role, "elevation-forbidden");
  }
  if (role.key === "continuum_cs" && CLINICAL_ACTIONS.includes(action)) {
    return denied(role, "hard-restriction-no-clinical");
  }
  if (role.default_clinical_access === false && CLINICAL_ACTIONS.includes(action) && !options.break_glass_active) {
    return denied(role, "default-no-continuum-clinical-access");
  }

  const grant = options.grant;
  if (!grant) return denied(role, "grant-missing");
  if (canonicalRoleKey(grant.role_key) !== role.key) return denied(role, "role-mismatch");
  if (!scopeMatches(grant.scope_type, grant.scope_id, requestScopeType, requestScopeId)) {
    return denied(role, "scope-mismatch");
  }

  const when = nowFrom(store, options.at);
  if (grant.expires_at && new Date(grant.expires_at) <= when) {
    return denied(role, "grant-expired");
  }
  if (role.time_bound && !grant.expires_at) {
    return denied(role, "time-bound-expiry-required");
  }

  if (required) {
    const has = Array.isArray(entitled) && entitled.some((e) => (e.module_key || e) === required && (e.kind ? e.kind === "module" : true));
    if (!has) return { allowed: false, reason: "entitlement-missing", role: role.key, entitlement: required };
  }

  return { allowed: true, role: role.key, scope_type: requestScopeType, entitlement: required || null };
}

export function assertDelegation(roleKey, action, grant, opts) {
  const role = roleOf(roleKey);
  const act = norm(action);
  if (role.never_delegate && role.never_delegate.includes(act)) {
    throw namedError("DELEGATION-FORBIDDEN", "Clinical authorship and signature are never delegable.", { role: role.key, action: act });
  }
  if (act === "clinical_authorship" || act === "signature") {
    throw namedError("DELEGATION-FORBIDDEN", "Clinical authorship and signature are never delegable.", { role: role.key, action: act });
  }
  if (!role.delegable && grant && grant.delegated) {
    throw namedError("DELEGATION-FORBIDDEN", "Role " + role.key + " may not be delegated.");
  }
  if (role.delegable && grant && grant.delegated && !grant.expires_at) {
    throw namedError("DELEGATION-EXPIRY-REQUIRED", "Admin delegation requires an expiry.");
  }
  if (grant && grant.expires_at) {
    const when = nowFrom(opts && opts.store, opts && opts.at);
    if (new Date(grant.expires_at) <= when) {
      throw namedError("DELEGATION-EXPIRED", "Delegated admin access has expired.");
    }
  }
  return { ok: true };
}

export function emergencyElevationAllowed(kind, opts) {
  const k = norm(kind);
  if (k === "clinic") return { ok: true, kind: "clinic_emergency", time_limited: true };
  if (k === "continuum") {
    return {
      ok: true,
      kind: "continuum_break_glass",
      time_limited: true,
      default_clinical_access: false,
      requires_clinic_consent: true,
    };
  }
  throw namedError("ELEVATION-UNKNOWN", "Emergency elevation is clinic-side or Continuum break glass.");
}

export function namedEnterpriseRoleKeys() {
  return Object.keys(ENTERPRISE_ROLES);
}

export function namedContinuumRoleKeys() {
  return Object.keys(CONTINUUM_ROLES);
}
