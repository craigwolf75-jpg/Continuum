# MPI Decision Brief: does Continuum adopt a canonical person identity, and how

Prepared for Craig. Prepared 2026-08-14. Evidence base: `MPI_AS_BUILT_REPORT.md` (read-only source
extraction) and `G1_AUDIT_REPORT.md`. No dashes anywhere.

## The prior question, first

Before the decisions below: **is there an existing MPI design (the old Prompt 48) that already
settles this?** If so, send it and most of this brief becomes "apply the existing spec." If not, these
are open decisions and the answers become a fresh unified prompt (Prompt 57). The as-built extraction
found **no MPI in the codebase at all**, so whichever way you answer, nothing is being overwritten;
this is a greenfield identity decision.

## The one decision

**Does Continuum have a single canonical person identity that all person records point to, and if so
what is its key, its matching and merge policy, and its governance?** Today there is no such thing, and
its absence is a hard blocker (below). Everything else is detail hanging off that yes or no.

## What its absence blocks

- **The practitioner retrofit (Gate 3 of the RLS wall).** `clinical.practitioner` was left out of the
  tenancy retrofit because a practitioner is org-less: they work across clinics and tenants, so they
  cannot carry a single `organisation_id`. The intended anchor is `mpi.person`, the one deliberate
  exception to the tenant wall. No MPI means the practitioner table stays un-walled and un-granted, and
  the report-signing path cannot be fully secured.
- **Prompt 52 (Canonical Data Model).** Its Correction 1 requires exactly one canonical Person entity
  and isolates identity resolution behind `resolve_identity`. The as-built has two unlinked person
  models and no resolver, so Prompt 52 cannot start.
- **E2 (the global practitioner anchor).** Same root: an org-less person needs `mpi.person` to exist.

## The situation as built (from `MPI_AS_BUILT_REPORT.md`, verified from source)

- **No MPI exists.** No `mpi` schema, no `mpi.person`, no resolver, no matcher, no merge or unmerge. A
  live check confirms no `mpi` schema on the physician project.
- **Two unreconciled person models coexist, both live.** The hub stream (`public.users` and
  `public.workers`) and the physician stream (`clinical.worker`) are separate tables with no shared key
  and no link. The same human is two rows by construction.
- **The only resolution is deterministic phone match within a tenant** (`cases` edge function): exact
  match on `public.users.phone`, which carries a `unique` constraint. That is a **natural key on a
  phone number**, which Prompt 51 Section 10.2 and Prompt 52 Section 16 explicitly prohibit as
  reassignable and shared.
- **A `sin_hash` is stored on every worker but never used for matching.** The intended dedup input was
  never wired.
- **No merge, no unmerge, no identity-change actor or history.** A wrong duplicate, once created, has
  no correction path beyond a soft delete, and identity edits overwrite in place with no audit.

## The decisions, with a recommendation for each

**Decision 1 (the pivot): one canonical person, or keep two silos.**
- **Option A (recommended): build `mpi.person` as the single canonical, org-less person identity.**
  Tenant-scoped person records (`clinical.worker`, the hub worker) link to it by an `mpi.person` id;
  `mpi.person` itself is the one allow-list exception to the tenant wall. This is what Prompts 51 and
  52 already assume and reserve for.
- **Option B: keep the two models separate, no MPI.** Cheaper today, but it permanently blocks Prompt
  52, leaves cross-stream identity unresolved, keeps duplicates uncorrectable, and never anchors the
  practitioner. Not recommended.

**Decision 2: the identity key.** Recommended: an **internal opaque `mpi.person` id plus an external
identity map** (PHN, phone, and the SIN hash held as external identifiers in named namespaces), per
Prompt 52 Section 4. Retire the phone natural key as the resolution key. Phone becomes one external
identifier among several, not the person's identity.

**Decision 3: the matching model.** Recommended: **deterministic match on strong identifiers** (PHN,
SIN hash) with **review required for a probable but not certain match, never auto-merge** (Prompt 52
Section 0.2 treats a wrong merge as unbounded harm). Decide whether the SIN hash becomes a real match
input, and under what governance, given it is a federal identifier.

**Decision 4: merge and unmerge.** Recommended: a **reversible merge** with an **append-only,
actor-stamped identity-change log**, so a wrong merge can be undone and every identity change is
auditable. The as-built has neither; this is the correction mechanism the estate currently lacks.

**Decision 5: cross-tenant and cross-source resolution.** Recommended: `mpi.person` is cross-tenant;
the same human across tenants or across the hub and physician streams resolves to **one** `mpi.person`
via the external identity map, while their tenant-scoped records stay separate and walled.

**Decision 6: governance.** Recommended: creating, merging, or unmerging an `mpi.person` is the single
most sensitive operation in the platform, because it is the one object that crosses the tenant wall.
Restrict it to a dedicated role with its own audit trail, separate from ordinary tenant writes.

## Reconciliation of the two existing person models

Whatever you choose, the live `public.users`/`public.workers` and `clinical.worker` rows must reconcile
onto the canonical model. Recommended sequence: stand up `mpi.person` and the external identity map
first (empty), backfill `mpi.person` ids onto both existing models by their strongest shared identifier
under review, then make new writes resolve through `resolve_identity` rather than the direct phone
insert. This is an expand-then-migrate, not a rewrite, and it does not disturb the running hub.

## What I need from you

1. **Send the old Prompt 48 if it exists** (it likely settles most of the above), or confirm we author
   Prompt 57 from these decisions.
2. **Confirm Decision 1** (Option A, a single canonical `mpi.person`) or choose otherwise.
3. **Confirm Decisions 2 through 6**, or mark the ones you want to defer.
4. **The SIN call:** whether the stored SIN hash may be used as a match input at all, given it is a
   federal identifier, and if so under what consent and governance.

## What unblocks when you decide

On Option A plus the specifics, the build sequence is: create the `mpi` schema, `mpi.person`, and the
external identity map (as the one allow-list exception, with the coverage check updated); add
`resolve_identity` and the review-gated match; backfill and link the two existing person models; then
retrofit `clinical.practitioner` to anchor on `mpi.person`, which closes Gate 3 of the RLS wall; then
Prompt 52 (the canonical model) can begin. Gate 1 of the RLS wall (the `app_clinical` credential) and
Section 17 (the wcb_report lifecycle) are independent and tracked separately.
