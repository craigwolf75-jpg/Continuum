# Activating the tenancy RLS wall (physician platform)

The tenancy and RLS work (Prompt 51, S1 to S8) is applied to the live physician schema and is
proven enforced in CI (`platform/db/tests/clinical_tenant_retrofit.sql` connects as the non-owner
`app_clinical` role, injects a tenant, and shows scoped reads, cross-tenant `WITH CHECK` denial, and
fail-closed on a blank tenant). The wall is dormant only because **nothing connects as `app_clinical`
yet**: there is no live physician runtime, and the Management API path used for migrations runs as
the owner role, which bypasses RLS.

This document is the contract for turning the wall on for a real runtime. No dashes anywhere.

## The connection contract (guardrail 50a b)

1. Connect as the non-owner `app_clinical` role over a real Postgres connection (the pooler), never
   the Supabase Management API and never `service_role` or the owner (both bypass RLS).
2. Every unit of work is ONE transaction that injects the tenant server side before any query:
   `begin; select set_config('app.organisation_id', <org>, true); <work>; commit;`
   The tenant comes from the trusted server session, never from client input. `set_config(..., true)`
   is transaction local, so a pooled connection cannot leak one tenant into the next request.
3. A missing or malformed tenant fails closed: no query runs.

`deploy/tenant-executor.mjs` (`createTenantScopedExecute`) is the app-layer half of this contract and
is unit tested in `deploy/tenant-executor.test.mjs`. It produces the `execute(sql)` that
`deploy/repo-live.mjs` (`createLiveRepository`) already consumes, so wiring is:

```js
import { createTenantScopedExecute } from "./tenant-executor.mjs";
import { createLiveRepository } from "./repo-live.mjs";

const execute = createTenantScopedExecute({ withConnection, organisationId });
const repo = createLiveRepository({ execute });
```

`withConnection(fn)` is the only piece left to supply: it acquires a connection as `app_clinical`,
calls `fn(raw)` where `raw(sql) => Promise<rows>` runs on that one session, and releases it. Example
with `postgres` (the driver is not yet a dependency; adding it is part of wiring a runtime):

```js
import postgres from "postgres";
const sql = postgres(process.env.CONTINUUM_APP_CLINICAL_URL, { max: 5, prepare: false });
const withConnection = (fn) => sql.reserve().then(async (conn) => {
  try { return await fn(async (text) => conn.unsafe(text)); }
  finally { conn.release(); }
});
```

## Step 1: provision the app_clinical credential (Gary, DB owner)

The role exists but is `NOLOGIN`. Give it a login and a password (choose the password; do not paste it
in chat), then hand back only the connection string as an env var. SQL to run against the physician
project:

```sql
alter role app_clinical login password 'CHOOSE_A_STRONG_PASSWORD';
grant connect on database postgres to app_clinical;
```

Connection string shape (session pooler, IPv4, as app_clinical):
`postgresql://app_clinical:PASSWORD@aws-0-ca-central-1.pooler.supabase.com:5432/postgres`
Store it as `CONTINUUM_APP_CLINICAL_URL` in the runtime env. `app_clinical` is a non-owner with no
`BYPASSRLS`, so the wall applies to it.

## Step 2: grant reconciliation before the write path can go live

Verified live on 2026-08-14, `app_clinical` grants vs what `repo-live.mjs` actually does:

- Reads of `clinic`, `wcb_case`, `wcb_report`, `wcb_report_field`, `worker`, `wcb_obx_skeleton`: SELECT
  is granted. OK.
- Inserts to `functional_measurement`, `functional_axis_value`, `band_derivation_audit`: INSERT is
  granted. OK. The measurement read and insert path works under the wall today.
- **`wcb_report` UPDATE is NOT granted.** `commitSignature` does `update clinical.wcb_report set
  status = 'signed' ...`, which would be denied. Before granting UPDATE, attach the signed-immutable
  guard: `clinical.wcb_report` currently has NO immutability trigger (the `guard_signed_immutable`
  planned in S2 was never attached), so a bare UPDATE grant would let `app_clinical` mutate a signed
  report freely. Reconcile as one migration: attach `platform.guard_signed_immutable` to
  `clinical.wcb_report`, then grant UPDATE to `app_clinical`. Both, not just the grant.
- **`clinical.practitioner` has no grant and no RLS.** It was deliberately excluded from the tenancy
  retrofit because a practitioner is org-less (the E2 wall, blocked on the absent MPI). `repo-live`
  reads it, so the read would be denied; and granting a blind SELECT would open a cross-tenant read
  hole, since there is no `organisation_id`/policy to scope it. This stays blocked until the
  practitioner retrofit lands with the MPI. The report-signing write path cannot be fully walled
  until then.

## Step 3: stage it, do not flip it live

There is no live runtime to switch today, so nothing breaks by leaving this dormant. When a physician
runtime is wired, prove the full path on a preview first: connect as `app_clinical`, exercise the
measurement read/insert path (works now), and confirm the two gaps above are closed before the
report-signing path is enabled. Keep the owner/Management-API path out of any runtime code.
