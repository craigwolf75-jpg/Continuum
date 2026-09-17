# Prompt 49 stop notes

Real stops only. Schema files only. Gary or Hermes apply. Athena does not
live apply. Hermes ships only when Craig names ship.

No em dashes or en dashes anywhere.

## Prompt 48 Master Person Index

Prompt 49 assumed Prompt 48 had landed. The repository has no `mpi` schema
and no `resolve_identity`. This build does **not** invent those tables.

What landed instead: a fail-closed identity port
(`clinical/engine/interop/identity_port.mjs` and
`interop.resolve_identity` in `platform/db/0018_interop.sql`). Until Prompt
48 lands the port returns `review_required` and never creates a person.
No auto-merge. No identity bypass.

`mpi.person` remains the single tenant-exception allow-list entry. This
build does not add a second entry and does not create that table.

## Existing person models

`public.users` / `public.workers` and `clinical.worker` stay unlinked.
Reconciling them is a Prompt 48 / Craig decision (`MPI_DECISION_BRIEF.md`).

## Existing direct writers

`supabase/functions/cases` and `deploy/repo-live.mjs` still write domain
rows. They are reported, not rewritten. Production adapters and the
gateway are out of scope.

## Band derivation

The Prompt 39 SQL and JS mirror pair remains. This build adds no third
implementation and must not call derivation from interop, adapters, or
outbound mapping.

## Prompt 44 STOP unchanged

No live Bedrock. No occupational dataset seed. Canada residency. No-train
remains.

## Section 19 values

Mechanisms exist. Values stay unset. Fail closed where a value is
required. No raw payload purge job.

## Human gates

`package.json`, consent language, legal pages, pricing, email templates,
credentials, and live schema apply. Untouched.

## Out of scope (not built)

Production vendor adapters, integration gateway, retry, circuit breaker,
dead letter processor, board gateway, reconciliation orchestration,
screens, clinical features, live apply.
