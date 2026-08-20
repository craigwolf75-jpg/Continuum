# Continuum Core Platform Foundations: developer guide

Prompt 51. This guide is Section 13. A new engineer should be able to add a module using only
this document, without reading the prompt. It describes what is built in `platform/db` (sub-builds
S1 to S6) and the contracts the later sub-builds and the application service will meet.

No em dashes or en dashes anywhere.

## 0. What exists today, and what does not

Built and proven in the `platform` CI workflow (a throwaway postgres 15 container, never the live
project):

- `tenancy` schema: organisation, region, location, with row level security (S1).
- `platform` guard functions: guard_append_only, guard_signed_immutable (S2).
- `consent` schema: text_version (shared), ledger_entry (append only), the consent_state resolver (S3).
- `audit` schema: audit.record with a per organisation hash chain, append_record, verify_chain (S4).
- `events` schema: domain_event, subscription, outbox, the emit function (S5).
- `config` schema: definition, value, feature_flag, feature_flag_rule, set_value, resolve (S6).

Not yet built, and where:

- The live retrofit of the existing `clinical`, `employer` and `audit.event`, `audit.ai_generation`
  tables (adding the tenant column and row level security to them), the wcb_report redesign, the
  consent boolean cutover, and the employer.disclosure_release table: sub-build S8.
- The application service that sets tenant context, enforces authorisation at the boundary, and
  emits metrics, traces and logs: not in this repository yet. The current runtime is a static site,
  Supabase, Deno edge functions and pure engine modules. Section 10 of this guide is a contract for
  that service, not a description of a running one.

## 1. Tenancy

The hierarchy is organisation to region to location, modelled from the first tenant even when a
customer has exactly one of each (one way door E1). A single site clinic is an organisation with one
region and one location.

Every tenant owned table carries `organisation_id`. Location specific tables also carry
`location_id`. The one and only exception in the whole platform is `mpi.person` (built later); the
allow-list stays at exactly one entry forever.

Context is set from the authenticated session, server side, inside the transaction:

```sql
select set_config('app.organisation_id', $1, true);   -- true = transaction scoped
select set_config('app.location_id',     $2, true);
select set_config('app.actor_id',        $3, true);
```

Never take the tenant identifier from a request parameter, header, body or message envelope. That is
not authentication, it is letting the caller choose whose data to touch.

An operation with no context fails. The isolation policies read `current_setting('app.organisation_id')`
with the strict (one argument) form, which raises when the value is unset, so a missing tenant is a
refusal, never a default. A background job sets context explicitly per tenant and processes one
tenant per transaction.

## 2. Adding a table

Checklist for a tenant owned table:

1. `organisation_id uuid not null references tenancy.organisation(id)`, and `location_id uuid` if it
   is location specific.
2. A uuid primary key. Never a sequential integer, never a natural key (Section 9).
3. Row level security enabled and FORCEd, with an isolation policy.
4. If it is append only, revoke UPDATE and DELETE and attach guard_append_only (Section 4).
5. Names follow Section 9: singular table, `ck_`, `ux_`, `ix_`, `fk_`, `tr_` prefixes.
6. Grants: SELECT and INSERT to the roles that use it; never UPDATE or DELETE beyond what is
   explicitly mutable.
7. Add the schema to the enforced list in `platform/ci/check_tenant_coverage.sql`, or the table to
   the enforced tables list if its schema also holds out of scope tables.
8. Add a test to `platform/db/tests`.

Copy paste template:

```sql
create table if not exists <schema>.<table> (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references tenancy.organisation(id),
  -- location_id  uuid,   -- add when the table is location specific
  -- ... columns ...
  created_at      timestamptz not null default now());

alter table <schema>.<table> enable row level security;
alter table <schema>.<table> force  row level security;
drop policy if exists <table>_isolation on <schema>.<table>;
create policy <table>_isolation on <schema>.<table>
  using      (organisation_id = current_setting('app.organisation_id')::uuid)
  with check (organisation_id = current_setting('app.organisation_id')::uuid);

grant select, insert on <schema>.<table> to app_clinical;
-- if append only:
-- revoke update, delete on <schema>.<table> from app_clinical, app_employer, app_release, app_readonly;
-- create trigger tr_<table>_append_only before update or delete on <schema>.<table>
--   for each row execute function platform.guard_append_only();
```

A shared reference table (identical for every tenant, written only by a migration or an
administrator) is the exception to the tenant column: it enables row level security with a
`for select using (true)` policy, carries no `organisation_id` and is not FORCEd (the owner writes
it). Register it in `shared_ref` in the coverage check. This is not an allow-list entry.

## 3. The employer wall

Employer and clinical are physically separate schemas (one way door D2). There is no foreign key
from employer to clinical, ever, because a foreign key is a join waiting to be written. The employer
schema holds a filtered copy taken at release time; if the clinical record later changes, the release
does not, because a disclosure that was made cannot be unmade. The `app_employer` role holds no grant
of any kind on clinical. The release path is the only code that reads clinical and writes employer,
and it writes an audit record on every execution. CI rejects any query, view or migration referencing
both schemas outside the release path, and any grant to `app_employer` on clinical. The platform
`employer.disclosure_release` table lands in S8; the physician stream's employer wall (migration 015)
is already in place.

## 4. Immutability

Append only tables (events.domain_event, audit.record, consent.ledger_entry, employer.disclosure_release,
and the functional measurement family) are immutable from insert. A correction is a new row, never an
edit. The signed report is immutable from signature: a correction is a new report with
`supersedes_report_id` set and an `amendment_reason`, and the only permitted change to a signed row is
`status` moving to `superseded`.

Two independent controls, both required: revoked UPDATE and DELETE grants, and a trigger. A grant can
be re-granted; a trigger can be disabled. Attach `platform.guard_append_only` as a
`before update or delete` trigger on an append only table, and `platform.guard_signed_immutable` as a
`before update` trigger on the signed report. The audit hash chain is a third control on top of these.

## 5. Consent

Consent is a ledger, never a boolean. Read it only through the resolver:

```sql
select consent.consent_state(person_id, purpose, recipient, at_datetime);
  -- returns granted | refused | revoked | expired | never_asked
```

All four arguments are required and the resolver raises rather than assuming any of them: `at_datetime`
because a disclosure made last March is evaluated against last March, `recipient` because consent for
one recipient is not consent for another. `never_asked` is distinct from `refused`. Do not cache the
answer across a request. Revocation is a new ledger entry and is not retroactive.

The Worker 36 rule that must not be got wrong: the statutory duty to report to the board survives a
refusal and requires no consent, so a `refused` or `revoked` state must not block a board submission.
Employer disclosure does require consent: a missing, refused or revoked consent blocks the release
path unconditionally. This split is a jurisdiction profile, not a constant, and does not hold in
another province without confirmation.

## 6. Audit

The audit record answers who saw what, when, and under what authority, which is the question a privacy
commissioner asks. It is separate from the event log, which answers what happened to the data. Write a
record through the only write path:

```sql
select audit.append_record(action, entity_type, outcome, ... );
```

Reads are audited, not only writes, because unauthorised viewing is the most common health privacy
incident. Denials are audited with `outcome = denied`. A disclosure must carry a lawful basis (type
and reference) or `append_record` fails closed. `subject_person_id` is populated whenever a person's
information was touched. `correlation_id` is generated at the edge of the request and threaded through
every audit record, event and log line. The record is written in the same transaction as the action.

The hash chain (`record_sequence`, `previous_digest`, `record_digest`) is per organisation. Run
`audit.verify_chain(organisation_id)`: it returns the first altered sequence, or null when intact. A
chain break is a security incident, not a data quality issue.

## 7. Events

Emit an event in the same transaction as the state change, through the only write path:

```sql
select events.emit(event_class, event_type, aggregate_type, aggregate_id, payload, ... );
```

Three classes: `domain` never leaves the platform, `integration` is a fact an entitled external system
may know, `notification` tells a human and carries no clinical content. External dispatch happens after
commit through `events.outbox`, never inside the transaction. `emit` creates an outbox row only for an
entitled subscription, and never for a domain event or a draft event (an `event_type` ending in
`.drafted`), so an unsigned draft cannot leave the platform.

Events carry identifiers and minimum context, never a full clinical payload. Ordering is per aggregate
through `sequence_in_aggregate`, never global. Events are immutable; a correction is a new event.
`schema_version` is present from the first event and evolution is additive only: never remove or rename
a field, and never reuse an event type name with different semantics, because a replay in year six would
silently reinterpret year two events.

## 8. Configuration and feature flags

Configuration resolves most specific first with no implicit default:

```sql
select config.resolve(key, organisation_id, region_id, location_id);   -- location, region, organisation, global
```

A required key with no value at any scope raises. Set a value through `config.set_value`, which
validates the scope against `allowed_scopes`, versions the value (never in place) and writes an audit
record. To add a key, insert a `config.definition` row. Reference data (form definitions, code lists,
fee schedules, holidays, jurisdiction rulesets) follows the same rule: a new version is a new row.

Every feature flag has a `retire_by` date. CI warns within thirty days and fails after the date, so a
permanent flag cannot hide. Rollout is by explicit scope, never a percentage. A kill switch flag only
disables a capability. A flag never gates a security, tenancy, immutability, consent or audit control.

## 9. Database standards

- Names: snake_case, singular tables, `_at` for timestamptz, `_on` or a plain noun for date, positive
  booleans, `ck_`/`ux_`/`ix_`/`fk_`/`tr_` prefixes.
- Keys: every primary key is a uuid, generated by the application so the identity is known before
  insert. No sequential integer key. No natural key (a health number, claim number, email or phone is
  mis-keyed, reassigned and shared). UUID version 7 is permitted only on the two high volume internal
  append only tables and is never exposed externally.
- Migrations: a file in version order, applied once, recorded in `platform.schema_migration`. Idempotent
  and ALTER based, never drop and recreate. A migration adding a table adds the tenant column, row level
  security, FORCE and a policy in the same migration or CI fails. No migration deletes clinical, audit,
  consent or event data.
- Expand and contract for a breaking change: add the new structure, dual write, backfill, switch reads,
  stop writing the old, remove the old later. Never a single migration that renames or drops a column in
  use.
- Partitioning: `events.domain_event` and `audit.record` are range partitioned by month (this lands with
  the retrofit and volume). Old partitions move to a cheaper tier and are never dropped.

## 10. Observability contract

No application service runs in this repository yet, so this section is the contract the service will
meet, not a running implementation. When the service is built:

- No metric name, label, tag, span attribute, URL or log field carries personal information. Permitted
  dimensions are organisation id, location id, connection id, environment, action, outcome, error class.
- Structured logs are JSON with a field allow-list enforced by the logging wrapper; any field not on
  the list is dropped. Every line carries correlation_id, organisation_id, environment and severity. A
  CI check scans source for a logging call passing a value from a clinical or person entity and fails
  the build.
- Tracing propagates W3C traceparent; span names and attributes carry identifiers only; every database
  call is a span named by the statement, never the statement with bound values.
- No observability or error reporting tool receives payloads outside Canada.

## 11. Local development

There is no local application to run yet. To run the platform database and prove isolation locally, use
the same harness CI uses:

```
docker run --rm -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15
export PGHOST=localhost PGUSER=postgres PGPASSWORD=postgres PGDATABASE=postgres
for f in platform/db/0*.sql; do psql -v ON_ERROR_STOP=1 -f "$f"; done
psql -v ON_ERROR_STOP=1 -f platform/ci/check_tenant_coverage.sql
for t in platform/db/tests/*.sql; do psql -v ON_ERROR_STOP=1 -f "$t"; done
```

The tenancy isolation test seeds two organisations and proves that a session set to one cannot read,
write or cross link the other. Run it as the non superuser role (the tests do this with `set role
app_clinical`), because a superuser bypasses row level security, which is exactly why the application
never connects as one.

## 12. The five must-be-zero counters

When the application service exists, five counters must read zero across the whole test suite, and any
increase pages a human within the hour:

- `tenant_context_missing_total`: an operation reached the database with no tenant context. A code path
  failed to set context from the session. Find it and set context, never add a default.
- `rls_denied_total`: a cross tenant read or write was attempted. Treat as a potential breach: find the
  query that tried to reach another tenant.
- `immutability_violation_total`: an append only or signed row mutation was attempted. Find the write
  path that tried to edit evidence.
- `employer_wall_violation_total`: a query touched both the employer and clinical schemas outside the
  release path. Find and remove the join.
- `config_required_missing_total`: a required configuration key had no value. Set the value at a scope,
  never default it in code.

A non zero counter is never normalised away. Each is a specific defect with a specific fix.
