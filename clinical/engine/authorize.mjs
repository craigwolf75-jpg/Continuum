/* Prompt 47 Part 4: PERMISSION = ROLE intersect SCOPE intersect ENTITLEMENT.

   AuthN may assume an existing IdP. This module is authorization domain logic.
   Enterprise roles (4.2) and Continuum-side roles (4.3) are data, not a UI.
   Admin may be delegated with expiry. Clinical authorship and signature are
   NEVER delegable. See docs/prompts/47/STOPS.md for unnamed 4.2 / 4.3 titles.
   No em dashes or en dashes anywhere. */

import { namedError, nowFrom } from "./clinic_ops_util.mjs";

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();

export const ENTERPRISE_ROLES = Object.freeze({
  clinic_admin: {
    key: "clinic_admin",
    clinical: false,
    read_only: false,
    delegable: true,
    never_delegate: ["clinical_authorship", "signature"],
  },
  reception: {
    key: "reception",
    clinical: false,
    read_only: false,
    delegable: false,
    hard: "no_clinical",
  },
  billing: {
    key: "billing",
    clinical: false,
    read_only: false,
    delegable: false,
    hard: "no_clinical",
  },
  physician: {
    key: "physician",
    clinical: true,
    read_only: false,
    delegable: false,
    never_delegate: ["clinical_authorship", "signature"],
  },
  clinic_auditor: {
    key: "clinic_auditor",
    clinical: false,
    read_only: true,
    delegable: false,
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
  continuum_cs: {
    key: "continuum_cs",
    clinical: false,
    read_only: true,
    hard: "no_clinical",
    sandbox_only: false,
  },
  sales: {
    key: "sales",
    clinical: false,
    read_only: true,
    hard: "sandbox_only",
    sandbox_only: true,
  },
  continuum_break_glass: {
    key: "continuum_break_glass",
    clinical: false,
    default_clinical_access: false,
    elevation: true,
  },
});

export const ALL_ROLES = Object.freeze({ ...ENTERPRISE_ROLES, ...CONTINUUM_ROLES });

const CLINICAL_ACTIONS = Object.freeze(["clinical_read", "clinical_write", "clinical_authorship", "signature"]);

function roleOf(roleKey) {
  const key = norm(roleKey);
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

export function resolvePermission(roleKey, scope, entitlement, opts) {
  const options = opts || {};
  const store = options.store || {};
  const role = roleOf(roleKey);
  const action = norm(options.action || (scope && scope.action) || "");
  const requestScopeType = norm((scope && scope.type) || options.scope_type);
  const requestScopeId = (scope && (scope.id || scope.scope_id)) || options.scope_id;
  const entitled = options.entitlements || store.entitlements || [];
  const required = entitlement || options.entitlement_required || null;

  if (role.hard === "no_clinical" && CLINICAL_ACTIONS.includes(action)) {
    return { allowed: false, reason: "hard-restriction-no-clinical", role: role.key };
  }
  if (role.read_only && (action === "clinical_write" || action === "clinical_authorship" || action === "signature")) {
    return { allowed: false, reason: "hard-restriction-read-only", role: role.key };
  }
  if (role.sandbox_only && options.environment && options.environment !== "sandbox") {
    return { allowed: false, reason: "hard-restriction-sandbox-only", role: role.key };
  }
  if (role.key === "continuum_cs" && CLINICAL_ACTIONS.includes(action)) {
    return { allowed: false, reason: "hard-restriction-no-clinical", role: role.key };
  }
  if (role.default_clinical_access === false && CLINICAL_ACTIONS.includes(action) && !options.break_glass_active) {
    return { allowed: false, reason: "default-no-continuum-clinical-access", role: role.key };
  }

  const grant = options.grant;
  if (!grant) return { allowed: false, reason: "grant-missing", role: role.key };
  if (norm(grant.role_key) !== role.key) return { allowed: false, reason: "role-mismatch", role: role.key };
  if (!scopeMatches(grant.scope_type, grant.scope_id, requestScopeType, requestScopeId)) {
    return { allowed: false, reason: "scope-mismatch", role: role.key };
  }

  const when = nowFrom(store, options.at);
  if (grant.expires_at && new Date(grant.expires_at) <= when) {
    return { allowed: false, reason: "grant-expired", role: role.key };
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
