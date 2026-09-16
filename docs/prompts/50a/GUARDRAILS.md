# Prompt 50a guardrail evidence

Status of each Decision 1 guardrail and each Decision 2 obligation.
A path is confirmed only when the cited file encodes or checks the
rule. Unverified means the mechanism exists but the live path is not
proven. Not connected means there is no automated check, or the
dependent document or apply step is absent.

Governing copy is Prompt 51. Schema files only. Athena does not ship.
0018 and 0019 remain files only. No live apply.

No em dashes or en dashes anywhere.

---

## Decision 1(a): RLS is defense in depth; banned-column and no-cross-schema-FK unchanged

Status: **confirmed**

- Grants as the primary wall: `platform/db/0001_platform_roles.sql`
  creates non-owner NOLOGIN app roles (`app_clinical`, `app_employer`,
  `app_release`, `app_readonly`, `migrator`). Per-schema GRANT and
  REVOKE land in `0002` and later platform migrations.
  `app_employer` has no grant on `clinical`.
- RLS as defense in depth: `platform/db/0002_tenancy.sql` header already
  names Prompt 50a guardrail (a). FORCE plus a fail-closed policy on
  tenancy tables. Coverage: `platform/ci/check_tenant_coverage.sql`.
- Banned-column test unchanged:
  `clinical/engine/employer_schema.mjs` (`bannedColumnsInSchema`);
  `clinical/engine/employer_schema.test.mjs`.
- No-cross-schema-FK unchanged:
  `clinical/db/015_migration_employer_view.sql` (opaque `case_ref` and
  `worker_ref`, not foreign keys).
  `.github/workflows/platform.yml` employer wall grep: no
  `platform/db/0*.sql` file may reference both `clinical.` and
  `employer.` in SQL.
  `platform/db/0015_fk_covering_indexes.sql` and
  `platform/db/0016_employer_fk_covering_indexes.sql` are split so no
  single migration names both schemas.

## Decision 1(b): non-owner app role; set_config local; never from client; fail closed; break glass separate

Status: **confirmed** in the platform harness. **Unverified** for live
hub wiring.

- Non-owner connect: `platform/db/0001_platform_roles.sql`;
  `platform/db/tests/tenancy_isolation.sql` (`set role app_clinical`);
  `deploy/tenant-executor.mjs` and `deploy/tenant-executor.test.mjs`;
  `deploy/tenant-executor.README.md`.
- `set_config` local=true: `deploy/tenant-executor.mjs`;
  `platform/service/tenant_context.mjs` (`setConfigStatements`);
  `deploy/prompt50-foundations.test.mjs` AC8.
- Never from client: `platform/service/tenant_context.mjs`
  (`resolveTenantContext`); `scanClientTenant` in
  `platform/service/architecture.mjs`.
- Fail closed, no default tenant: `0002` policies use strict
  `current_setting` (one argument). `tenancy_isolation.sql` test 7
  (blank tenant). Tenant-executor rejects a missing or malformed UUID.
- Break glass is a separate time-bounded mechanism:
  `platform/db/0019_prompt50_foundations.sql`
  (`activate_break_glass` / `expire_break_glass`);
  `clinic_ops.break_glass` in `platform/db/0017_prompt47_clinic_ops.sql`;
  `platform/service/break_glass.mjs`;
  `platform/db/tests/prompt50_foundations.sql` and
  `deploy/prompt50-foundations.test.mjs`. Holders unset (STOP).
- Live hub still uses `service_role` / `anon` / `authenticated`:
  **unverified** for the live path (`docs/prompts/50/SECTION_1.md`
  check 10). Do not rewrite live connection strings.

## Decision 1(c): idempotent, ordered, recorded; ALTER never drop

Status: **confirmed** for the platform stream. Live apply is
**not connected** / not done.

- Idempotent `IF NOT EXISTS` / `ON CONFLICT`. Ordered
  `platform/db/0000` to `0019`. Recorded in
  `platform.schema_migration` (`platform/db/0000_platform_meta.sql`).
- ALTER never drop or recreate for structural changes: inherited
  append-only migration law. `0014` is expand-only.
  `.github/workflows/platform.yml` DELETE grep.
  `platform/db/downs/0019.sql` drops only 0019 objects.
- Management API / live apply is Gary or Hermes when named. 0018 and
  0019 are files only. Live apply is not connected and not done.

## Decision 1(d): Master Architecture conflict stops under Section 0.1

Status: **confirmed** as a written rule. **Not connected** as an
automated check (the Master Architecture document is absent; CI cannot
check a missing document).

- Encoded in `docs/prompts/50a/DECISIONS.md` and the 50a note in
  `docs/prompts/50/STOPS.md`.
- Authority order already used in `platform/db/0014_wcb_report_amendment_chain.sql`
  (approved Prompt 39 to 46 behaviour outranks). If the Master
  Architecture arrives and conflicts, stop and report; do not silently
  rework. Do not invent Master Architecture text.

---

## Decision 2 obligation 1: inventory and label non-platform

Status: **confirmed** by `docs/prompts/50a/NON_PLATFORM_INVENTORY.md`.

## Decision 2 obligation 2: physical exclusion

Status: **confirmed** in source and by CI.

Source (inspected): no foreign key from `supabase/migrations` to
`tenancy.`, `clinical.`, `employer.`, `audit.`, `consent.`, `events.`,
or `config.`. No platform grant on `public.*` or `worker.*`.

CI (file text scans only, no live SQL apply):
`deploy/prompt50a-decisions.test.mjs`, picked up by
`.github/workflows/suites.yml`.

- Allow-list file still has exactly one non-comment entry and it starts
  with `mpi.person`.
- No `supabase/migrations/*.sql` create or alter adds a REFERENCES to
  `tenancy.`, `clinical.`, `employer.`, `audit.`, `consent.`,
  `events.`, or `config.` (line comments stripped first).
- No `platform/db/0*.sql` REFERENCES `public.` or `worker.` (line
  comments stripped).
- No `platform/db/0*.sql` GRANT to `app_clinical`, `app_employer`,
  `app_release`, `app_readonly`, or `migrator` on `public.` or
  `worker.`.
- 50a docs exist and contain no U+2013 or U+2014.
- `DECISIONS.md` contains the paste-back phrases
  "Proceed against Supabase as-is" and
  "The mpi.person allow-list stays at exactly one entry".
- Inventory lists at least `public.tenants`, `public.workers`,
  `public.access_codes`, `public.framer_demo_state`,
  `worker.worker_account`.

## Decision 2 obligation 3: promotion is its own migration

Status: **confirmed** as a written rule in `DECISIONS.md` and the
inventory. **Not connected** as CI (no promotion is in flight).

`platform/ci/check_tenant_coverage.sql` already excludes hub, site,
demo, and worker by schema boundary. The header now says those schemas
are excluded by schema boundary until a promotion migration takes a
table through full platform rules. The enforced schema lists are
unchanged.
