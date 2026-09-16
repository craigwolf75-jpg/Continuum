# Prompt 49 Section 18: required build output

Report of what was actually done. Tip at open of this landing is
`842514f` (Prompt 47). Schema files only. Not applied live.

No em dashes or en dashes.

## 1. Implementation summary

Built the Prompt 49 interoperability layer on top of Prompt 47, without
inventing Prompt 48. Canonical types are contracts and projections.
The `interop` schema holds envelopes, restricted raw payloads, maps,
gaps, versions, and results. A fourteen-stage engine, inbound and
outbound pipelines, a reference adapter, mapping, versioning, dual
validation, and in-process observability landed in
`clinical/engine/interop/`. Identity is a fail-closed port that returns
`review_required` until Prompt 48 lands.

## 2. Section 1 answers

See `docs/prompts/49/SECTION_1.md`. Headline: Prompt 48 is not present.
Defects found: no MPI; hub `cases` and `repo-live.mjs` write domain
rows; two unlinked person models; two band-derivation mirrors (SQL plus
JS). None of those existing writers were rewritten (out of scope). The
new inbound path cannot reach a business service without the pipeline.

## 3. Files created

- `docs/prompts/49/SECTION_1.md`
- `docs/prompts/49/STOPS.md`
- `docs/prompts/49/ACCEPTANCE.md`
- `docs/prompts/49/SECTION_18.md`
- `docs/platform/interop-guide.md`
- `platform/db/0018_interop.sql`
- `platform/db/tests/prompt49_interop.sql`
- `clinical/engine/interop/*.mjs` (engine, stages, types, identity,
  adapter, fixtures, pipelines)
- `deploy/prompt49-canonical.test.mjs`

## 4. Files modified

- `platform/ci/check_tenant_coverage.sql` (add `interop` to enforced)

No `package.json`, email templates, or Prompt 36 to 48 tests were
modified.

## 5. Database migrations

`platform/db/0018_interop.sql`. Append-only landing. No down migration:
platform migrations are append-only and are not applied live here.
Reason: Prompt 47 / 51 standing rule, and a down would drop history.

## 6. Schemas, tables, indexes, constraints, triggers, policies

Schema `interop`. Tables: `inbound_message`, `raw_payload`,
`result_summary`, `conflict_record`, `reconciliation_item`,
`outbound_message`, `vocabulary_map`, `mapping_gap`,
`canonical_version`, `adapter_registry`. Each has `organisation_id`,
RLS, FORCE, and a policy. Functions: `interop.resolve_identity` (fail
closed), `interop.store_raw_payload`, `interop.access_raw_payload`
(reason required, audit written). Unique
`(connection_id, idempotency_key)` on inbound. `reviewed_by` NOT NULL
on vocabulary_map.

## 7. Canonical types

All twenty nine, with mappings in `TYPE_MAPPINGS`. Worker is a role
projection. FunctionalCapacity is a projection. No new clinical
measurement table.

## 8. Services and internal contracts

Identity port, identifier validation (reuses `phn.mjs`), authorship
transition, date and unit normalisation, mapping, fourteen stages,
engine, inbound, outbound, FHIR export (lossy), versioning, consent
port, observability. No public HTTP API.

## 9. APIs created or modified

None. Existing auth, error, and versioning conventions are unchanged.

## 10. Adapter contract and reference adapter

`adapter.mjs` plus `reference_adapter.mjs`. Synthetic only.
`noncompliant_adapter.fixture.mjs` proves the suite can fail.

## 11. Mapping framework

`vocabulary_map` and `mapping_gap`. Resolution order implemented in
`mapping.mjs`. No production seed of vendor codes. Approver role is
unset (Section 19 item 5). Engine uses only `approved` rows.

## 12. Validation rules

Interop: payload size, content type, schema version, well-formedness.
Business: tenancy, case existence, signed-value rule, unmapped status,
consent at call time.

## 13. Tests

- Unit and integration: `deploy/prompt49-canonical.test.mjs`
- SQL: `platform/db/tests/prompt49_interop.sql`
- Categories: unit (stages, types, dates, units, mapping, authorship),
  integration (inbound/outbound), fixtures (23), contract (reference
  plus non-compliant), security (tenant, PII labels, raw payload),
  performance (ceiling), regression (sign hash unchanged)

## 14. Fixture library

Version `1.0.0`. Twenty three named fixtures in `fixtures.mjs`.

## 15. Documentation

Section 1, STOPS, ACCEPTANCE, Section 18, and
`docs/platform/interop-guide.md` (sixteen items).

## 16. CI checks and architecture tests

`deploy/prompt49-canonical.test.mjs` is picked up by `suites.yml`.
`platform.yml` applies `0018` and runs `prompt49_interop.sql` plus
tenant coverage (now includes `interop`). Fail conditions: bare
Prompt 41 identifier in new code, person insert outside the identity
port, band derivation call in interop, Worker/Patient entity, new
measurement table, interop on the allow-list, non-compliant adapter
passing the contract suite.

## 17. Metrics, traces, logs, alerts

In-process counters and spans in `observability.mjs`. No third-party
tooling. Alert policy is documented (page on the six zero counters).
Not wired to a live pager.

## 18. Security and privacy

Tenant FORCE RLS; envelope tenant ignored; employer has no interop
grant; raw payload revoke-select plus audited access; consent at call
time; no PII metric labels; Canadian in-process residency; authorship
cannot upgrade; identity fail-closed. Enforced by constraint, policy,
grant, architecture test, or CI grep as named above.

## 19. Acceptance criteria

See `docs/prompts/49/ACCEPTANCE.md`. One line per criterion.

## 20. Known limitations

- Prompt 48 is a port, not an MPI.
- Existing hub `cases` writer is unchanged.
- Performance proofs are micro-benchmarks, not a 50/s soak.
- Concurrent idempotency is proven in-process plus a unique
  constraint, not under a live connection pool.
- AC55 is not attempted as a single wrapped process.
- No live apply.

## 21. Open items

All Section 19 items, plus: Prompt 48 / Prompt 57 identity decisions
in `MPI_DECISION_BRIEF.md`; whether to migrate existing external
identifier columns; who may write platform-wide vocabulary rows.

## 22. What could not be implemented as written

- Reuse of Prompt 48 tables and `resolve_identity` as specified:
  they do not exist. Replaced by a fail-closed port.
- PHN checksum "the one from Prompt 37": `phn.mjs` has no algorithm
  (default OFF, refuses to guess). Referenced, not reimplemented.
- Architecture test framework from Prompt 47 check 3: it did not
  exist. Added scans in the Prompt 49 suite.
- Production-scale performance and backfill isolation under load.
- Migrating existing external identifiers into `mpi.external_identity`.
