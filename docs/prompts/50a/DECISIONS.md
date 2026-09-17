# Prompt 50a decisions

Companion decisions that resolve Prompt 50 Section 00 and Section 1
stops. Architecture and docs only. Schema files only. Athena does not
ship.

50a attaches to Core Platform Foundations. The governing copy is Prompt
51 (Prompt 50 is retired by supersession). Repo comments on 0000 to 0018
still say Prompt 51; that is correct to keep.

No em dashes or en dashes anywhere. Do not invent Master Architecture
text. Do not create `mpi.person`. Do not expand the tenant exception
allow-list. 0018 and 0019 remain files only, unapplied.

---

## Prompt 53 banner: Decision 1 is RELEASED-from-53-hold

50a Decision 1 is no longer SUSPENDED by Prompt 53. Status:
RELEASED-from-53-hold. Prompt 53 holds were released 2026-09-16
by Craig. See `docs/prompts/53/RELEASE.md`.

Platform GO still requires a Craig or Hermes named path. Do
not invent live apply. Hold lift is not an auto-execute.
Decision 2 still stands.

## Decision 1: GO against Supabase as-is (RELEASED-from-53-hold)

Status: RELEASED-from-53-hold. Prompt 53 no longer suspends
this decision. This is not an invented live GO. Agents must
not treat this as a live apply. Platform GO still requires a
Craig or Hermes named path. Named human dispatch still
required before Montreal, Bedrock, non-SYNTH seed, or live
schema apply.

Approved with four binding guardrails. The stop clause in Section 00
covers Master Architecture content beyond what Prompt 51 restates.
Nothing in the mechanisms (RLS with a non-owner app role, tenant
policies via `current_setting`, Management API migrations) requires the
absent document. Waiting for a document with no arrival date stalls the
entire foundation. Go under the four guardrails.

(a) RLS is defense in depth on top of grant-based physical separation.
The grants remain the primary wall, along with the banned-column test
and the no-cross-schema-FK rule. Those two tests stay unchanged.

(b) Application code connects only as the non-owner app role. Tenant is
injected server side via `set_config` with the local flag inside the
transaction, never from client input. Every policy fails closed with no
default tenant. Break glass stays a separate time-bounded mechanism.

(c) Migrations are idempotent, ordered, and recorded. ALTER never
drop or recreate for structural changes.

(d) If the Master Architecture arrives and conflicts, stop and report
the delta under Prompt 51 Section 0.1 authority order. Do not silently
rework. Do not invent Master Architecture text. The existing repo
restatement of Section 0.1 (see `platform/db/0014_wcb_report_amendment_chain.sql`)
is: approved Prompt 39 to 46 behaviour outranks this prompt where they
conflict. That is the authority order. Do not quote or invent doors from
an absent Master Architecture document.

## Decision 2: scope of every table

Decision 2 still stands: platform versus hub,
site, demo, and worker; exclusion by schema; one-entry `mpi.person`
allow-list.

The rule's purpose is preventing quiet exceptions on data that matters,
not conscripting demo scaffolding.

The rule covers every table in the schemas Prompt 51 owns and creates
(clinical, employer, audit, tenancy, consent, configuration, event)
plus any table that will ever hold identifiable worker, patient, or
tenant data.

`clinic_ops` and `interop` hold tenant data and are in scope (not
excluded). Platform metadata (`platform.schema_migration` and similar)
holds no identifiable data.

Hub, site, demo, and worker tables in existing migrations are excluded
at schema level with three obligations:

1. Inventory and label them non-platform in the prerequisite / decision
   report (`docs/prompts/50a/NON_PLATFORM_INVENTORY.md`).
2. Physical exclusion: outside platform schemas, no foreign keys across
   the boundary in either direction, no shared grants with the platform
   app role.
3. Promotion rule: any later promotion of such a table to real user
   data is its own migration through the full platform rules.

The `mpi.person` allow-list stays at exactly one entry forever. Never
exclude anything by adding to it. Exclusion is by schema boundary.

## Reasoning

Decision 1: Prompt 51 Section 0.2 says it implements doors D1, D2, D3,
D5, and D10, and the operative requirements of those doors are written
into its sections (physical separation enforced by grants, immutability
by revoked UPDATE and DELETE, the tenant column rule, the audit and
event foundations). The Section 00 stop is about content beyond those
restatements. Go under the four guardrails. Do not invent further
Master Architecture prose.

Decision 2: Scope is schemas Prompt 51 owns and creates, plus any table
that will ever hold identifiable worker, patient, or tenant data.
Hub, site, demo, and worker existing tables are out of scope for
tenant-column and immutability enforcement now, with the three
obligations. The allow-list stays one entry.

0018 and 0019 remain files only. Live apply is Gary or Hermes when
named. Athena does not ship.

---

## Paste-back reply

Historical 50a paste-back. Leave this section in place as the historical
50a paste-back. The paste-back line "Proceed against Supabase as-is" is
historical. Prompt 53 no longer suspends it. Live apply still
requires a named path. Do not invent live apply.

Decisions, per the 50a brief, citing Prompt 51 as the governing Core Platform Foundations copy:
Proceed against Supabase as-is. RLS with a non-owner app role, tenant policies via current_setting, and Management API migrations are approved with four binding guardrails: (a) RLS is defense in depth on top of grant-based physical separation, which remains the primary wall along with the banned-column test and the no-cross-schema-FK rule; (b) application code connects only as the non-owner app role, tenant is injected server side via set_config with the local flag inside the transaction, never from client input, and every policy fails closed with no default tenant; (c) migrations are idempotent, ordered, recorded, ALTER never drop; (d) if the Master Architecture arrives and conflicts, stop and report the delta under the Section 0.1 authority order rather than reworking silently. Report each guardrail with evidence as you land Section 3 and onward.
Scope of "every table": the rule covers every table in the schemas Prompt 51 owns and creates, plus any table that will ever hold identifiable worker, patient, or tenant data. The hub, site, demo, and worker tables are excluded at schema level with three obligations: inventory and label them non-platform in your report; enforce the exclusion physically (outside platform schemas, no FKs across the boundary in either direction, no shared grants with the platform app role); and treat any future promotion of such a table to real user data as its own migration through the full platform rules. The mpi.person allow-list stays at exactly one entry; never exclude anything by adding to it.
