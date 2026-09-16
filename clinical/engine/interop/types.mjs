/* Prompt 49 canonical types.

   A canonical type is a contract, not a table. Worker is a role projection
   of a Person within an OccupationalInjuryCase. There is no Worker entity
   and no Patient entity. Clinic maps to tenancy.location. Organization
   maps to tenancy.organisation. Employer lives in the employer schema
   only. ConsentReference holds an identifier, never a state.
   No em dashes or en dashes. */

import { namedError } from "./util.mjs";
import { createIdentifier, createExternalIdentifier } from "./identifier.mjs";
import { createProvenancePair } from "./authorship.mjs";

export const CANONICAL_VERSION = "1.0.0";
export const CANONICAL_TYPES = Object.freeze([
  "Person",
  "Worker",
  "Practitioner",
  "Organization",
  "Clinic",
  "Employer",
  "Coverage",
  "ClaimReference",
  "OccupationalInjuryCase",
  "Encounter",
  "Appointment",
  "DiagnosisReference",
  "Assessment",
  "FunctionalCapacity",
  "FunctionalRestriction",
  "ReturnToWorkStatus",
  "ReturnToWorkPlan",
  "ClinicalNote",
  "Document",
  "Submission",
  "Communication",
  "ConsentReference",
  "Identifier",
  "ExternalIdentifier",
  "Address",
  "Contact",
  "Coding",
  "Status",
  "Provenance",
]);

export const TYPE_MAPPINGS = Object.freeze({
  Person: "Prompt 48 mpi.person plus mpi.person_record (absent: identity port only)",
  Worker: "Role projection of a Person within an OccupationalInjuryCase. Not an entity",
  Practitioner: "clinical.practitioner",
  Organization: "tenancy.organisation",
  Clinic: "tenancy.location",
  Employer: "employer schema only. Never joined to clinical",
  Coverage: "Existing coverage or claim columns. No dedicated table",
  ClaimReference: "clinical.wcb_case.claim_number plus board plus jurisdiction",
  OccupationalInjuryCase: "clinical.wcb_case",
  Encounter: "Contract only. No encounter table",
  Appointment: "Contract only. No appointment table",
  DiagnosisReference: "Coded diagnosis on the case. A reference, never a judgement",
  Assessment: "Existing assessment where present",
  FunctionalCapacity: "Projection over clinical.functional_measurement and clinical.functional_axis_value",
  FunctionalRestriction: "functional_axis_value.derived_band and derived_capability_code. Derived only",
  ReturnToWorkStatus: "functional_measurement.fit_for_work, modified hours, modified duties",
  ReturnToWorkPlan: "Existing plan payload where present",
  ClinicalNote: "Existing note fields",
  Document: "Rendered signed artifact and digest",
  Submission: "clinical.wcb_submission",
  Communication: "Outbound message record",
  ConsentReference: "consent.ledger_entry identifier. Never a state",
  Identifier: "Value object. Namespaces owned by Prompt 48",
  ExternalIdentifier: "Value object. mpi.external_identity when Prompt 48 lands",
  Address: "Value object",
  Contact: "Value object",
  Coding: "Value object: system, code, display, version",
  Status: "Value object: canonical state plus retained source status",
  Provenance: "Value object: authorship_provenance and source_provenance",
});

function base(type, fields) {
  if (!CANONICAL_TYPES.includes(type)) {
    throw namedError("CANONICAL-TYPE-UNKNOWN", "Unrecognised canonical type.");
  }
  return Object.freeze({
    type,
    canonical_version: CANONICAL_VERSION,
    maps_onto: TYPE_MAPPINGS[type],
    ...fields,
  });
}

export function createPerson(fields) {
  const f = fields || {};
  return base("Person", {
    id: f.id || null,
    identifiers: Object.freeze([...(f.identifiers || [])]),
    name: f.name || null,
    birth_date: f.birth_date || null,
  });
}

export function projectWorkerRole(person, occupationalInjuryCase) {
  if (!person || person.type !== "Person") {
    throw namedError("WORKER-NOT-ENTITY", "Worker is a role projection of a Person within an OccupationalInjuryCase. It is not an entity.");
  }
  return base("Worker", {
    role: "worker",
    person_id: person.id,
    case_reference: occupationalInjuryCase && occupationalInjuryCase.id ? occupationalInjuryCase.id : null,
    entity: false,
  });
}

export function createPatientEntity() {
  throw namedError("PATIENT-NOT-ENTITY", "Patient is a context, not a canonical entity. Use Person.");
}

export function createPractitioner(fields) {
  return base("Practitioner", { id: fields && fields.id, billing_number: fields && fields.billing_number });
}

export function projectOrganization(organisation) {
  return base("Organization", {
    id: organisation && organisation.id,
    legal_name: organisation && organisation.legal_name,
    maps_onto: "tenancy.organisation",
  });
}

export function projectClinic(location) {
  return base("Clinic", {
    id: location && location.id,
    name: location && location.name,
    timezone: location && location.timezone,
    maps_onto: "tenancy.location",
  });
}

export function createEmployer(fields) {
  const f = fields || {};
  if (f.clinical_fk || f.clinical_id) {
    throw namedError("EMPLOYER-CLINICAL-FK", "Employer never carries a foreign key into clinical.");
  }
  return base("Employer", {
    id: f.id || null,
    schema: "employer",
    joined_to_clinical: false,
  });
}

export function createCoverage(fields) {
  return base("Coverage", fields || {});
}

export function createClaimReference(fields) {
  const f = fields || {};
  return base("ClaimReference", {
    claim_number: f.claim_number || null,
    board: f.board || null,
    jurisdiction_code: f.jurisdiction_code || null,
    is_record: false,
  });
}

export function createOccupationalInjuryCase(fields) {
  return base("OccupationalInjuryCase", { id: fields && fields.id, claim: fields && fields.claim || null });
}

export function createEncounter(fields) { return base("Encounter", fields || {}); }
export function createAppointment(fields) { return base("Appointment", fields || {}); }

export function createDiagnosisReference(fields) {
  const f = fields || {};
  return base("DiagnosisReference", {
    coding: f.coding || null,
    is_judgement: false,
  });
}

export function createAssessment(fields) { return base("Assessment", fields || {}); }
export function createReturnToWorkStatus(fields) { return base("ReturnToWorkStatus", fields || {}); }
export function createReturnToWorkPlan(fields) { return base("ReturnToWorkPlan", fields || {}); }
export function createClinicalNote(fields) { return base("ClinicalNote", fields || {}); }
export function createDocument(fields) { return base("Document", fields || {}); }
export function createSubmission(fields) { return base("Submission", fields || {}); }
export function createCommunication(fields) { return base("Communication", fields || {}); }

export function createConsentReference(ledgerEntryId) {
  return base("ConsentReference", {
    ledger_entry_id: ledgerEntryId,
    consent_state: undefined,
    cached_state: undefined,
  });
}

export function createAddress(fields) { return base("Address", fields || {}); }
export function createContact(fields) { return base("Contact", fields || {}); }
export function createCoding(fields) {
  const f = fields || {};
  return base("Coding", {
    system: f.system || null,
    code: f.code || null,
    display: f.display || null,
    version: f.version || null,
  });
}

export function createStatus(fields) {
  const f = fields || {};
  return base("Status", {
    canonical_state: f.canonical_state || null,
    source_status_raw: f.source_status_raw,
    source_status_system: f.source_status_system || null,
    mapping_status: f.mapping_status || "unmapped",
    requires_reconciliation: f.requires_reconciliation === true,
  });
}

export { createIdentifier, createExternalIdentifier, createProvenancePair };

export function constructCanonical(type, fields) {
  const builders = {
    Person: createPerson,
    Worker: () => projectWorkerRole(fields && fields.person, fields && fields.case),
    Practitioner: createPractitioner,
    Organization: () => projectOrganization(fields),
    Clinic: () => projectClinic(fields),
    Employer: createEmployer,
    Coverage: createCoverage,
    ClaimReference: createClaimReference,
    OccupationalInjuryCase: createOccupationalInjuryCase,
    Encounter: createEncounter,
    Appointment: createAppointment,
    DiagnosisReference: createDiagnosisReference,
    Assessment: createAssessment,
    FunctionalCapacity: () => { throw namedError("FUNCTIONAL-USE-PROJECTION", "Use projectFunctionalCapacity."); },
    FunctionalRestriction: () => { throw namedError("FUNCTIONAL-USE-PROJECTION", "Use projectFunctionalRestriction."); },
    ReturnToWorkStatus: createReturnToWorkStatus,
    ReturnToWorkPlan: createReturnToWorkPlan,
    ClinicalNote: createClinicalNote,
    Document: createDocument,
    Submission: createSubmission,
    Communication: createCommunication,
    ConsentReference: () => createConsentReference(fields && fields.ledger_entry_id),
    Identifier: () => createIdentifier(fields),
    ExternalIdentifier: () => createExternalIdentifier(fields),
    Address: createAddress,
    Contact: createContact,
    Coding: createCoding,
    Status: createStatus,
    Provenance: () => createProvenancePair(fields && fields.authorship_provenance, fields && fields.source_provenance),
  };
  return builders[type](fields);
}
