# Continuum interoperability layer: developer guide

Prompt 49. A developer should be able to add a vendor adapter using only
this document, without reading the prompt. Schema files only. Gary or
Hermes apply migrations. Athena does not live apply.

No em dashes or en dashes anywhere.

## 1. Canonical model purpose

The Canonical Model is Continuum's language at the boundary between an
external system and a business service. FHIR vocabulary is used at the
edge for Person, Practitioner, Organization, Encounter,
DiagnosisReference, and Document. The core is not FHIR. FunctionalCapacity
has no FHIR home: Observation cannot express a value authored once and
carried forward, then rounded DOWN into a board band at signature. A FHIR
export is one directional and lossy, and the resource itself says so.

## 2. Every canonical type

Twenty nine types. Each is a contract, not a table. See
`clinical/engine/interop/types.mjs` (`CANONICAL_TYPES`, `TYPE_MAPPINGS`).

- Person: Prompt 48 `mpi.person` when it lands. Today the identity port
  fails closed.
- Worker: role projection of a Person within an OccupationalInjuryCase.
  Not an entity.
- Practitioner: `clinical.practitioner`
- Organization: `tenancy.organisation`
- Clinic: `tenancy.location`
- Employer: `employer` schema only. Never joined to clinical.
- Coverage, ClaimReference, OccupationalInjuryCase, Encounter,
  Appointment, DiagnosisReference, Assessment: mappings over existing
  storage or contracts where no table exists.
- FunctionalCapacity: projection over `clinical.functional_measurement`
  and `clinical.functional_axis_value`. No new measurement table.
- FunctionalRestriction: derived band and code only. Never authored.
- ReturnToWorkStatus, ReturnToWorkPlan, ClinicalNote, Document,
  Submission, Communication: existing rows or contracts.
- ConsentReference: `consent.ledger_entry` identifier. Never a state.
- Identifier, ExternalIdentifier, Address, Contact, Coding, Status,
  Provenance (the pair `authorship_provenance` plus `source_provenance`):
  value objects.

## 3. The four invariants

1. A measured value is never derived from a band. A band-only inbound
   payload becomes a FunctionalRestriction with null `measured_hours` and
   null `measured_weight_kg`. The legacy 25 pound label is unmapped.
   Test: `inboundBandOnly` in the Prompt 49 suite.
2. `authorship_provenance` never upgrades on transport. The transition
   function is exhaustive over the Prompt 41 enumeration. Test: 25-pair
   cross-product.
3. An unanswered axis is never Able, unrestricted, or omitted. It is
   emitted with a data-absent reason on the interface, XML, FHIR export,
   and print path.
4. Band derivation happens once, at signature, in
   `clinical/engine/sign_measurement.mjs`. Adapters and interop must not
   call `deriveWeightBand`. Test: architecture scan.

4a. `measured_hours` and `measured_weight_kg` never leave Continuum.

## 4. Two lineage concepts

Use `authorship_provenance` for who authored a clinical value
(`human`, `ai_draft`, `ai_draft_edited`, `carried_forward`, `system`).
Use `source_provenance` for integration lineage (system, connection,
adapter, mapping version, times). They are different. Do not reuse a
single identifier for both.

## 5. Adapter contract

Implement `descriptor`, `capabilities`, `fieldManifest`, `authenticate`,
`parseInbound`, `buildOutbound`, and `healthProbe`.
`parseInbound` returns an intermediate representation only.
`buildOutbound` receives a canonical object only.

Forbidden: domain data-access imports, SQL, business rules, band
derivation, writing `authorship_provenance`, resolving identity, reading
consent, logging a raw payload, calling another adapter, branching on
jurisdiction.

The reference adapter (`clinical/engine/interop/reference_adapter.mjs`)
is the worked example. It talks to nothing real.

## 6. How to add a new adapter

1. Register the adapter in `interop.adapter_registry` (migration or seed)
   against a `interop.canonical_version` the adapter targets.
2. Declare `descriptor()` (name, version, vendor, transport pattern,
   canonical version, schema versions) and `capabilities()`.
3. Write `fieldManifest()`: every field that crosses, with direction,
   canonical target, and purpose (this is the PIA field list).
4. Implement `parseInbound` and `buildOutbound` only. No domain writes.
5. Run `node deploy/prompt49-canonical.test.mjs`. The contract suite must
   pass. A deliberately non-compliant fixture adapter must fail it.
6. Seed vocabulary maps with `mapping_status = 'proposed'` and a human
   `reviewed_by`. The engine ignores proposed rows.
7. Request human approval. Only `approved` mappings are used.
8. Certify the adapter (`status = certified` then `active`) after the
   contract suite and the fixture library pass.

Do not modify core business logic. Do not add a production vendor
adapter in this landing.

## 7. Field manifest

The manifest is enforced. Inbound fields not on it land in
`extension_payload` and are counted, never interpreted. Outbound fields
not on it are stripped before transport. A manifest change is an adapter
version change.

## 8. Mapping framework

Tables: `interop.vocabulary_map`, `interop.mapping_gap`.

Resolution order, most specific wins:

organisation plus jurisdiction, then organisation, then jurisdiction,
then platform wide.

A tenant cannot override a board-controlled code list. No component
branches on jurisdiction: the override is a lookup key.
`reviewed_by` is not nullable. A proposed mapping is never used.

To close a gap: add an approved, effective-dated map row. Do not update
in place.

## 9. Status mapping

An unmapped status leaves `canonical_state` null, sets `mapping_status`
to `unmapped`, sets `requires_reconciliation`, and retains
`source_status_raw`. It never becomes a valid canonical status.
`source_status_raw` is retained even on a successful mapping.

## 10. Fourteen stages

1. PAYLOAD_VALIDATION (pure)
2. SCHEMA_VALIDATION (pure)
3. FIELD_MAPPING (pure)
4. TYPE_CONVERSION (pure)
5. CODE_MAPPING (pure)
6. STATUS_MAPPING (pure)
7. DATE_NORMALISATION (pure)
8. UNIT_NORMALISATION (pure)
9. IDENTIFIER_EXTRACTION (pure)
10. CANONICAL_GENERATION (pure)
11. PROVENANCE_CAPTURE
12. IDENTITY_RESOLUTION (`resolveIdentity`, never bypassed)
13. DOMAIN_VALIDATION
14. RESULT

Stages 1 to 10 are pure functions of their input.

## 11. Seven outcomes

- `normalised`: apply the canonical object through business services.
- `normalised_with_warnings`: apply, and keep the warnings.
- `rejected_invalid_source`: write nothing.
- `rejected_unsupported_mapping`: write nothing.
- `rejected_unsupported_schema`: write nothing.
- `requires_manual_reconciliation`: create a work item, write nothing
  to domain tables.
- `processing_failure`: unclassified or ceiling breach. Write nothing.
  Hold no transaction.

## 12. Two validation stages

Interop validation (stages 1 and 2) answers: can this payload be
normalised at all. Business validation (stage 13) answers: does the
canonical object satisfy Continuum's rules. Keep them separate so a
clinic sees a field-specific message, not a transport error.

## 13. Canonical versioning

`canonical_version` is independent of every adapter. Additive changes
are minor. A field may not be removed, renamed, or have its meaning
changed within a major version. Two majors run concurrently with a
translation function. A vendor concept with no home stays in
`extension_payload` until three independent vendors need it.

## 14. What is persisted

Persisted: inbound envelope, raw payload (restricted), outbound
digest record, vocabulary map, mapping gap, canonical versions,
adapter registry, summarised results, conflict and reconciliation
rows, `source_provenance` attached to domain rows it produced.

Transient: the canonical object, the intermediate representation,
stage timings (metrics only).

Replay rebuilds the canonical object from the raw payload, envelope,
adapter version, and mapping version.

## 15. Observability rules

Permitted metric dimensions: organisation, connection, adapter,
adapter version, canonical version, stage, outcome, error class,
code set, reason, source_system. No personal information in a name,
label, tag, span, URL, or error. No payload fragment. Canadian
residency: in-process counters only in this landing.

## 16. Six must-be-zero counters

Page on any increase:

- `normalisation_unclassified_failure_total`
- `identity_bypass_attempt_total`
- `raw_measurement_emitted_total`
- `band_derived_outside_signature_total`
- `provenance_upgrade_attempt_total`
- `unanswered_axis_omitted_total`

If one is not zero, stop. Find the path. Do not reset the counter to
keep a schedule.

## Identity seam (Prompt 48 gap)

Prompt 48 did not land. `resolveIdentity` returns `review_required`
with reason `PROMPT_48_NOT_LANDED` and never creates a person. Do not
invent `mpi.*` tables. Do not auto-merge. Do not look up an external
identifier by value alone.
