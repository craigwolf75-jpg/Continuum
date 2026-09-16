/* Prompt 50 Section 4.3. Permission checks happen at the service boundary
   before any repository call. Denials are audited. Fail closed.
   Aligns with Prompt 47 role catalog. No em dashes or en dashes. */

import { namedError } from "./errors.mjs";
import { increment } from "./metrics.mjs";

export const PERMISSIONS = Object.freeze([
  "sign_report",
  "release_to_employer",
  "review_identity_match",
  "tenant_provision",
  "tenant_lifecycle",
  "break_glass_activate",
  "config_write",
  "audit_read",
]);

export const ROLE_PERMISSIONS = Object.freeze({
  physician: ["sign_report", "release_to_employer"],
  clinic_admin: ["release_to_employer", "tenant_lifecycle", "config_write"],
  clinic_owner: ["tenant_provision", "tenant_lifecycle", "config_write"],
  clinic_auditor: ["audit_read"],
  continuum_administrator: ["tenant_provision", "tenant_lifecycle", "break_glass_activate", "config_write"],
  support: ["break_glass_activate", "audit_read"],
  onboarding: ["tenant_provision", "config_write"],
});

function scopeMatches(grant, request) {
  if (!grant || !request) return false;
  if (grant.scope_type === "organisation") return true;
  return grant.scope_type === request.scope_type && (!grant.scope_id || grant.scope_id === request.scope_id);
}

export function authorize(input, store) {
  const src = input || {};
  if (!store || typeof store !== "object") {
    throw namedError("AUTHZ-STORE-MISSING", "An authorisation store is required.");
  }
  store.audit = store.audit || [];
  if (!src.principal_id || !src.permission || !src.scope_type) {
    increment("authz_denied_total", { permission: src.permission || "unknown", outcome: "denied" });
    store.audit.push({ action: "authorise", outcome: "denied", denial_reason: "missing arguments" });
    throw namedError("AUTHZ-ARGS-MISSING", "This action could not check permission. Sign in again, then retry.");
  }
  if (!PERMISSIONS.includes(src.permission)) {
    increment("authz_denied_total", { permission: src.permission, outcome: "denied" });
    store.audit.push({ action: "authorise", outcome: "denied", denial_reason: "unknown permission" });
    throw namedError("AUTHZ-PERMISSION-UNKNOWN", "That permission is not recognised.");
  }
  const grants = (store.grants || []).filter((g) =>
    g.principal_id === src.principal_id && (!g.expires_at || new Date(g.expires_at) > new Date(src.at || Date.now()))
  );
  const allowed = grants.some((g) => {
    const perms = ROLE_PERMISSIONS[g.role_key] || [];
    return perms.includes(src.permission) && scopeMatches(g, src);
  });
  if (!allowed) {
    increment("authz_denied_total", { permission: src.permission, outcome: "denied" });
    store.audit.push({
      action: "authorise",
      outcome: "denied",
      entity_type: src.permission,
      denial_reason: "permission not granted at the requested scope",
    });
    throw namedError(
      "AUTHZ-DENIED",
      "You do not have permission for this action. Ask a clinic administrator if you need access."
    );
  }
  store.audit.push({ action: "authorise", outcome: "permitted", entity_type: src.permission });
  return { allowed: true, permission: src.permission, boundary: "service" };
}

export function assertServiceBoundary(callerKind) {
  if (callerKind === "repository" || callerKind === "ui") {
    throw namedError(
      "AUTHZ-BOUNDARY",
      "Permission must be checked at the service boundary before data is read or written."
    );
  }
  return true;
}
