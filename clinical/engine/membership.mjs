/* Prompt 47 E2 and Part 5/6: global practitioner, location membership.

   clinical.practitioner is the global person (billing number belongs to the
   person). clinic_ops.membership is tenant and location scoped. Contract and
   role are validated in this engine against an injected wcb_contract_role
   store, not by inventing a composite FK to 021. NP is blocked pending a board
   answer. No em dashes or en dashes anywhere. */

import { namedError, requireStore, readLayer, nowFrom } from "./clinic_ops_util.mjs";

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();

export const BLOCKED_ROLES = Object.freeze(["NP"]);

function contractRows(store) {
  return readLayer(
    store,
    (s) => s.contractRoles,
    (s) => s.cache && s.cache.contractRoles,
    undefined,
    "CONTRACT-ROLE-STORE-MISSING",
    "A clinical.wcb_contract_role store is required to validate a contract and role pair."
  ).value;
}

function formRows(store) {
  const live = store.contractRoleForms;
  if (Array.isArray(live)) return live;
  if (store.cache && Array.isArray(store.cache.contractRoleForms)) return store.cache.contractRoleForms;
  return [];
}

export function upsertGlobalPractitioner(input, store) {
  requireStore(store, "MEMBERSHIP-STORE-MISSING", "A membership store is required. Never default.");
  const billing = norm(input && input.billing_number);
  if (!billing) {
    throw namedError("BILLING-NUMBER-MISSING", "A practitioner billing number belongs to the person and is required.");
  }
  store.practitioners = store.practitioners || [];
  const existing = store.practitioners.find((p) => norm(p.billing_number) === billing);
  if (existing) {
    return { practitioner: existing, created: false };
  }
  const row = {
    id: (input && input.id) || (store.nextId && store.nextId("practitioner")),
    billing_number: billing,
    family_name: input.family_name,
    given_name: input.given_name,
    middle_name: input.middle_name || null,
    clinic_id: input.clinic_id || null,
    role_code: input.role_code || null,
    active: input.active !== false,
  };
  if (!row.id) {
    throw namedError("PRACTITIONER-ID-MISSING", "upsertGlobalPractitioner needs an id or store.nextId.");
  }
  store.practitioners.push(row);
  return { practitioner: row, created: true };
}

export function validateContractRole(contractIdentifier, practitionerRole, store) {
  requireStore(store, "MEMBERSHIP-STORE-MISSING", "A membership store is required. Never default.");
  const contract = norm(contractIdentifier);
  const role = norm(practitionerRole);
  if (!contract || !role) {
    throw namedError("CONTRACT-ROLE-MISSING", "A membership requires both contract_identifier and practitioner_role.");
  }
  if (BLOCKED_ROLES.includes(role.toUpperCase())) {
    throw namedError(
      "ROLE-BLOCKED",
      "Role " + role + " is blocked pending a board answer. Do not invent other blocked roles.",
      { practitioner_role: role }
    );
  }
  const rows = contractRows(store) || [];
  const ok = rows.some((r) => norm(r.contract_id) === contract && norm(r.practitioner_role) === role);
  if (!ok) {
    throw namedError(
      "CONTRACT-ROLE-INVALID",
      "Contract " + contract + " and role " + role + " is not in clinical.wcb_contract_role. Invalid pair BLOCKS.",
      { contract_id: contract, practitioner_role: role }
    );
  }
  return { ok: true, contract_id: contract, practitioner_role: role };
}

export function assertLocationContext(locationId, organisationId, store) {
  requireStore(store, "MEMBERSHIP-STORE-MISSING", "A membership store is required. Never default.");
  const locId = norm(locationId);
  const orgId = norm(organisationId);
  if (!locId) throw namedError("LOCATION-MISSING", "A membership requires a location_id. Never default.");
  if (!orgId) throw namedError("ORGANISATION-MISSING", "A membership requires an organisation_id. Never default.");
  const loc = readLayer(
    store,
    (s) => (s.locations || []).find((l) => l.id === locId),
    (s) => s.cache && (s.cache.locations || []).find((l) => l.id === locId),
    undefined,
    "LOCATION-UNKNOWN",
    "Location " + locId + " is not in the store. Never default a location."
  ).value;
  if (norm(loc.organisation_id) !== orgId) {
    throw namedError("LOCATION-ORG-MISMATCH", "Location " + locId + " does not belong to organisation " + orgId + ".");
  }
  if (!norm(loc.jurisdiction_code)) {
    throw namedError("JURISDICTION-MISSING", "Location " + locId + " has no jurisdiction_code. Never inherit and never default.");
  }
  return loc;
}

export function addMembership(input, store) {
  requireStore(store, "MEMBERSHIP-STORE-MISSING", "A membership store is required. Never default.");
  const src = input || {};
  assertLocationContext(src.location_id, src.organisation_id, store);
  validateContractRole(src.contract_identifier, src.practitioner_role, store);
  const practitionerId = norm(src.practitioner_id);
  if (!practitionerId) {
    throw namedError("PRACTITIONER-ID-MISSING", "A membership requires practitioner_id.");
  }
  store.memberships = store.memberships || [];
  const dup = store.memberships.find((m) => m.practitioner_id === practitionerId && m.location_id === src.location_id);
  if (dup) {
    throw namedError("MEMBERSHIP-DUPLICATE", "A practitioner may have only one membership per location.");
  }
  const status = norm(src.status) || "invited";
  const isLocum = status === "locum" || src.locum === true;
  if (isLocum && (!src.start_date || !src.end_date)) {
    throw namedError("LOCUM-DATES-MISSING", "Locum membership requires start_date and end_date.");
  }
  if (src.end_date && src.start_date && String(src.end_date) < String(src.start_date)) {
    throw namedError("MEMBERSHIP-DATES-INVALID", "Membership end_date must be on or after start_date.");
  }
  const row = {
    id: src.id || (store.nextId && store.nextId("membership")),
    organisation_id: src.organisation_id,
    location_id: src.location_id,
    clinic_id: src.clinic_id || null,
    practitioner_id: practitionerId,
    contract_identifier: norm(src.contract_identifier),
    practitioner_role: norm(src.practitioner_role),
    skill_code: src.skill_code || null,
    status: isLocum ? "locum" : status,
    start_date: src.start_date || null,
    end_date: src.end_date || null,
  };
  if (!row.id) throw namedError("MEMBERSHIP-ID-MISSING", "addMembership needs an id or store.nextId.");
  store.memberships.push(row);
  return row;
}

export function formsForMembership(membership, store, reportKind) {
  requireStore(store, "MEMBERSHIP-STORE-MISSING", "A membership store is required. Never default.");
  if (!membership) throw namedError("MEMBERSHIP-MISSING", "formsForMembership requires a membership.");
  validateContractRole(membership.contract_identifier, membership.practitioner_role, store);
  const kind = norm(reportKind);
  const rows = formRows(store);
  return rows
    .filter((r) =>
      norm(r.contract_id) === norm(membership.contract_identifier)
      && norm(r.practitioner_role) === norm(membership.practitioner_role)
      && (!kind || norm(r.report_kind) === kind)
    )
    .map((r) => r.form_id);
}

export function membershipActiveOn(membership, at, store) {
  if (!membership) return false;
  const when = nowFrom(store, at);
  const start = membership.start_date ? new Date(membership.start_date) : null;
  const end = membership.end_date ? new Date(membership.end_date) : null;
  if (start && when < start) return false;
  if (end && when > end) return false;
  return ["active", "locum", "credentialed"].includes(norm(membership.status)) || membership.status === "active";
}
