# Prompt 50 stop notes

Real stops only. Schema files only. Gary or Hermes apply. Athena does not
live apply and does not ship. Hermes ships only when Craig names ship.

No em dashes or en dashes anywhere.

## Master Architecture and Interoperability Architecture not in hand

The Master Architecture (old stream 44) and the Interoperability
Architecture (old stream 46) are not in this repository as source of
truth documents. This build implements only what Prompt 50 restates:

- D1: tenant column on every tenant-owned row, one allow-list exception
- D2: physical employer and clinical separation, no FK, no employer grant
- D3 / D5 / D10: only as restated in Sections 3, 5, and 10 of this prompt
- I1 / I2 / I3: substrate only. No adapter, no gateway, no canonical model
  (Prompt 49 already landed a fail-closed interop port; this build does
  not extend it)

Anything load-bearing beyond those restatements is not inferred. No text
from the absent architecture prompts is copied into code or comments.

### Prompt 50a ruling (2026-09-16)

Historical 50a ruling, 2026-09-16: Decision 1 is GO against Supabase
as-is (the actual stack), with four binding guardrails (a)(b)(c)(d).
See `docs/prompts/50a/DECISIONS.md` and `docs/prompts/50a/GUARDRAILS.md`.
That GO is SUSPENDED by Prompt 53.

Do not infer Master Architecture text beyond Prompt 51 restatements. If
that document arrives and conflicts, stop and report the delta under
Prompt 51 Section 0.1 (approved Prompt 39 to 46 behaviour outranks).
That is guardrail (d). Do not silently rework.

Interoperability Architecture absence is not resolved by 50a. I1, I2,
and I3 remain substrate only. No adapter, no gateway, no canonical
model. That history still holds.

### Prompt 53 suspension (sequencing hold)

Decision 1 is no longer an active GO. It is withdrawn as a decision and
survives as analysis. The platform decision is reserved to Craig after
the G1 report. Decision 2 still stands.

## Azure Canada assumption (Section 1 check 21)

Prompt 50 assumes Azure Canada Central primary and Canada East secondary.
The repo stack is Vercel plus Supabase, with an unverified `ca-central-1`
memory and no Azure resources. **Stop:** do not invent Azure, ARM, or a
secondary region. Mechanisms are cloud-agnostic.

### Prompt 50a ruling (2026-09-16)

Historical 50a ruling, 2026-09-16: Decision 1 is GO against Supabase
as-is (the actual stack), with four binding guardrails (a)(b)(c)(d).
See `docs/prompts/50a/DECISIONS.md` and `docs/prompts/50a/GUARDRAILS.md`.
That GO is SUSPENDED by Prompt 53.

Do not invent Azure, ARM, or a secondary region. That part of this stop
still holds. Historical 50a reading: Decision 1 was a go on the Vercel
plus Supabase stack, not a claim that Azure arrived. Prompt 53 suspends
that Decision 1 GO. Azure still has not arrived.

### Prompt 53 suspension (sequencing hold)

Decision 1 is no longer an active GO. It is withdrawn as a decision and
survives as analysis. The platform decision is reserved to Craig after
the G1 report. Decision 2 still stands.

## Secret manager (Section 1 check 23)

No secret manager is wired. Live credential placement is stopped. The
mechanism reads environment names only and fails closed. Holders are not
named.

## Backup and recovery residency (Section 1 check 22 / 25, open item 7)

What exists: unverified Supabase PITR, unknown retention, unknown last
restore, unknown backup region. Whether that suffices is a compliance
determination, not a builder decision. No purge job.

## Range partition versus unique constraints (Section 10.4 vs 8.1 / 7.2)

PostgreSQL 15 requires a unique constraint on a range-partitioned table
to include the partition key. `events.domain_event` uniqueness is
`(aggregate_type, aggregate_id, sequence_in_aggregate)`. `audit.record`
uniqueness is `(organisation_id, record_sequence)`. Neither includes
`occurred_at`. Weakening uniqueness is a defect. Converting the live
tables is therefore **not implemented**. A partition watch and missing
future-partition alert mechanism is built so the job can land after this
conflict is decided. Acceptance criterion 50 is not marked passed.

## Signed report trigger versus Prompt 42 (Section 5.3 / 5.4)

Attaching `platform.guard_signed_immutable` to `clinical.wcb_report`
would block signed to submitted. 0014 already deferred the contract
phase. This build does not attach that trigger to the live table. That
hold is the STOP. This PR's probe (`prompt50_expand_contract.sql`) is
expand and contract dual-write only. It does not prove
`guard_signed_immutable`. The reconstruction helper proves stored-artifact
byte identity, not the signed-row trigger.

## Prompt 48 / mpi.person

`mpi.person` is reserved in `platform/db/tenant_exception_allowlist.txt`
as the single entry. This build does not create the table and does not
add a second exception.

## Consent booleans (Section 1 check 20)

`clinical.consent` still stores booleans. Cutting those over would change
Prompt 43 behaviour and its tests. Deferred. New callers use
`consent.consent_state` only. No counsel-owned wording is seeded.

## Live apply, Bedrock, occupational seed

Migration 0018 and 0019 are files only. No live Bedrock. No occupational
dataset. No break-glass holders invented. No purge job.

## Pre-existing tests

If any Prompt 39 to 46 test fails unchanged, that is a stop, not an edit.
This build adds new tests only.

## Out of scope (not built)

Any screen, Master Person Index, canonical model, adapter, gateway, board
integration, clinic feature, billing feature, Azure landing zone, mTLS
mesh, replica routing, percentage flag rollout.
