/* Prompt 47 Part 4 authorize suite. node clinical/engine/authorize.test.mjs
   No em dashes or en dashes anywhere. */

import { resolvePermission, assertDelegation, emergencyElevationAllowed, ENTERPRISE_ROLES, CONTINUUM_ROLES, ROLE_ALIASES } from "./authorize.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const throws = (fn, code) => { try { fn(); return false; } catch (e) { return !code || e.code === code; } };

ok("enterprise roles are data", ENTERPRISE_ROLES.reception.hard === "no_clinical" && ENTERPRISE_ROLES.clinic_auditor.read_only === true && ENTERPRISE_ROLES.clinic_auditor.clinical === true);
ok("continuum roles are data", CONTINUUM_ROLES.continuum_cs.clinical === false && CONTINUUM_ROLES.sales.sandbox_only === true);
ok("Part 4.2 named roles exist", [
  "clinic_owner", "regional_manager", "clinic_admin", "reception", "medical_office_assistant",
  "physician", "nurse_practitioner", "physiotherapist", "occupational_therapist",
  "billing_administrator", "employer_liaison", "clinic_auditor",
].every((k) => ENTERPRISE_ROLES[k] && ENTERPRISE_ROLES[k].key === k));
ok("Part 4.3 named roles exist", [
  "continuum_administrator", "implementation_specialist", "continuum_cs", "support", "sales",
].every((k) => CONTINUUM_ROLES[k] && CONTINUUM_ROLES[k].key === k));
ok("customer_success aliases continuum_cs", ROLE_ALIASES.customer_success === "continuum_cs");

const locGrant = { role_key: "physician", scope_type: "location", scope_id: "loc-a", expires_at: null };
ok("physician can sign at granted location when entitled", resolvePermission("physician", { type: "location", id: "loc-a" }, "clinical_core", {
  action: "signature", grant: locGrant, entitlements: [{ module_key: "clinical_core", kind: "module" }],
}).allowed === true);

ok("reception cannot take a clinical action", resolvePermission("reception", { type: "location", id: "loc-a" }, null, {
  action: "clinical_read", grant: { role_key: "reception", scope_type: "location", scope_id: "loc-a" },
}).allowed === false);

ok("billing cannot take a clinical action", resolvePermission("billing", { type: "location", id: "loc-a" }, null, {
  action: "clinical_write", grant: { role_key: "billing", scope_type: "location", scope_id: "loc-a" },
}).reason === "hard-restriction-no-clinical");

ok("clinic auditor clinical_read is allowed", resolvePermission("clinic_auditor", { type: "organisation", id: "org-1" }, null, {
  action: "clinical_read", grant: { role_key: "clinic_auditor", scope_type: "organisation", scope_id: "org-1" },
}).allowed === true);
ok("clinic auditor clinical_write is denied", resolvePermission("clinic_auditor", { type: "organisation", id: "org-1" }, null, {
  action: "clinical_write", grant: { role_key: "clinic_auditor", scope_type: "organisation", scope_id: "org-1" },
}).allowed === false && resolvePermission("clinic_auditor", { type: "organisation", id: "org-1" }, null, {
  action: "clinical_write", grant: { role_key: "clinic_auditor", scope_type: "organisation", scope_id: "org-1" },
}).reason === "hard-restriction-read-only");
ok("clinic auditor signature is denied", resolvePermission("clinic_auditor", { type: "organisation", id: "org-1" }, null, {
  action: "signature", grant: { role_key: "clinic_auditor", scope_type: "organisation", scope_id: "org-1" },
}).allowed === false);

ok("continuum CS has no clinical access", resolvePermission("continuum_cs", { type: "organisation", id: "org-1" }, null, {
  action: "clinical_read", grant: { role_key: "continuum_cs", scope_type: "organisation", scope_id: "org-1" },
}).reason === "hard-restriction-no-clinical");

ok("sales is sandbox only", resolvePermission("sales", { type: "organisation", id: "org-1" }, null, {
  action: "clinical_read", grant: { role_key: "sales", scope_type: "organisation", scope_id: "org-1" }, environment: "production",
}).reason === "hard-restriction-sandbox-only");

ok("physician cannot delegate signature", throws(() => assertDelegation("physician", "signature", { delegated: true, expires_at: "2099-01-01" }), "DELEGATION-FORBIDDEN"));
ok("admin delegation requires expiry", throws(() => assertDelegation("clinic_admin", "invite_user", { delegated: true }), "DELEGATION-EXPIRY-REQUIRED"));
ok("admin may be delegated with expiry", assertDelegation("clinic_admin", "invite_user", { delegated: true, expires_at: "2099-01-01" }, { at: "2026-01-01" }).ok === true);

ok("clinic emergency elevation is named", emergencyElevationAllowed("clinic").kind === "clinic_emergency");
ok("continuum elevation defaults no clinical access", emergencyElevationAllowed("continuum").default_clinical_access === false);

console.log("\nauthorize suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
