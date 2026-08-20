# MPI AS-BUILT EXTRACTION REPORT

Read only extraction of the Master Person Index as it exists in the repository, per the MPI As-Built Extraction brief. Prepared by Claude Code for Gary, as the evidence base for the PROPOSED unified Prompt 57.

**No write, fix, rename, seed, or service call was made. No production access, no live query, no credential used.**

## Scope note and the headline finding

The brief's Section 1 states the MPI code is "implemented and reused across the completed Prompt 39 to 44 work." **The code does not bear this out. There is no Master Person Index in the repository.** There is no `mpi` schema, no `mpi.person`, no `mpi.person_record`, no `mpi.identifier_namespace`, no `mpi.person_identifier`, no `mpi.external_identity`, and no `resolve_identity`, `lookup_external`, merge, unmerge, or match function anywhere. `VERIFIED`: a repository wide grep for `master person`, `mpi.`, `resolve_identity`, `external_identity`, `identifier_namespace`, `person_identifier`, `merge`, `unmerge`, `dedup`, `match_person`, `lookup_external` returns only (a) comments in the platform migrations and the developer guide describing `mpi.person` as a future allow-list entry, (b) the G1 audit's own finding, and (c) unrelated uses of the word merge (git, PostgREST `merge-duplicates`, an admin ingest watermark). This matches the G1 audit conclusion.

What does exist is a **person model with a deterministic phone based worker resolution**, in the hub and worker stream, plus a **separate physician worker table** that is not reconciled with it. That, and a stored but unused SIN hash, is the entire as-built identity substrate. This report documents it.

Two streams are relevant throughout:
- **Hub and worker stream** (`supabase/migrations/*`, `supabase/functions/*`): `public.users`, `public.workers`.
- **Physician stream** (`clinical/db/*`): `clinical.worker`.

---

## SECTION 2. INVENTORY

**MPI implementation files: none.** `VERIFIED` by the grep above. No file implements identity resolution, external identity mapping, matching, or merging as a Master Person Index.

**Files that constitute the as-built person model and its resolution:**

| File | Lines | Role |
|---|---|---|
| `supabase/migrations/20260717120000_foundation_core.sql` | `users` at 82 to 95, `workers` at ~108 to 118 | The hub person model: `public.users` (one row per person) and `public.workers` (role projection). `VERIFIED` |
| `supabase/migrations/20260717180000_worker_intake_fields.sql` | 1 to 17 | Adds `dob`, `sin_masked`, `sin_hash` to `public.workers`. Comment (lines 4 to 6): the SIN is stored only as a mask plus a hash for "dedup and match"; the raw SIN is never persisted. `VERIFIED` |
| `supabase/functions/cases/index.ts` | worker resolution 109 to 138, `insertWorker` ~209 to 227, `maskSin`/`sha256Hex` helpers | The only identity write path: resolve or create a worker by phone within a tenant, then insert the `workers` row with `sin_masked` and `sin_hash`. `VERIFIED` |
| `clinical/db/016_migration_physician_foundation.sql` | `worker` at 98 to 117 | The physician stream person: `clinical.worker` (PHN, structured name, address, phone components). Separate from `public.users`, no link. `VERIFIED` |

**Consumers.** The only code that resolves or creates a person is `supabase/functions/cases/index.ts` (the case intake edge function). `injuries/index.ts` does not resolve identity; its `.maybeSingle()` at line 111 reads a status value, not a person (`VERIFIED`, lines 104 to 116). The physician engine (`clinical/engine/*`) does not create workers; `clinical.worker` is populated by whatever applies the physician schema, not by an MPI (`UNVERIFIED` who writes `clinical.worker` in practice, no live access).

**Tests exercising MPI behaviour: none found.** `VERIFIED`: no test references identity resolution, matching, or merging. The `deploy/*.test.mjs` and `clinical/engine/*.test.mjs` suites cover the physician engine and hub auth, not person resolution.

**Documentation about the MPI:** only forward references, quoted with locations. `docs/platform/developer-guide.md:38` "The one and only exception in the whole platform is `mpi.person` (built later)". `platform/db/0002_tenancy.sql:20`, `platform/db/0010_retrofit_clinical_tenant.sql:18 to 20`, `platform/ci/check_tenant_coverage.sql:11,42`, `platform/db/0014_wcb_report_amendment_chain.sql:37` all describe `mpi.person` as absent or future. These are this build's own comments, not an MPI design.

---

## SECTION 3. THE PERSON MODEL AS BUILT

### 3.1 Definitions (quoted)

`public.users` (`foundation_core.sql:82 to 95`), `VERIFIED`:
```
id uuid primary key default gen_random_uuid(),
auth_user_id uuid references auth.users (id) on delete set null,
phone text unique,
email text,
full_name text,
role public.user_role not null,
tenant_id uuid references public.tenants (id),
status public.user_status not null default 'invited',
language text not null default 'en',
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
deleted_at timestamptz
```

`public.workers` (`foundation_core.sql`, plus `worker_intake_fields.sql`), `VERIFIED`: `id`, `tenant_id`, `user_id references public.users`, `photo_url`, `job_title`, `shift_rotation`, `hire_date`, `created_at`, `updated_at`, `deleted_at`, and the added `dob`, `sin_masked`, `sin_hash`.

`clinical.worker` (`016:98 to 117`), `VERIFIED`, separate: `id`, `phn varchar(9)`, structured name (`family_name`, `given_name`, `middle_name`), `sex`, `date_of_birth`, structured address, structured phone. Plus `organisation_id` added by the S8c retrofit (`platform/db/0010`).

### 3.2 Keys and uniqueness, and the natural key census

`VERIFIED`:
- `public.users.phone` carries a `unique` constraint (`foundation_core.sql:84`). **This is a natural key on a phone number, used as a global uniqueness constraint.**
- `public.workers.sin_hash` is a `text` column, no unique constraint (`worker_intake_fields.sql`). It is not keyed on.
- `public.users.email` is not unique.
- `clinical.worker.phn` (the Worker 36 personal health number) has no unique constraint (`016`).
- No table keys or uniquely constrains a claim number for a person. Claim numbers live on `wcb_case`/`injuries`, not on the person.

**Census result:** a person is uniquely constrained on a **phone number** (`public.users.phone`), which is a natural key that health information systems treat as reassignable and shared. Nothing is keyed on a health number, an email, or a claim number. The SIN is stored only as a mask and a hash and is not keyed on.

### 3.3 Whether the same human can exist twice

`VERIFIED`, and yes, in two ways:
1. **Across streams.** `public.users`/`public.workers` (hub) and `clinical.worker` (physician) are separate tables with no link, no shared key, and no reconciliation. The same human is two rows, one per stream, by construction.
2. **Across tenants and identifiers within the hub.** Worker resolution (Section 4) matches on phone within a tenant. `public.users.phone` is globally unique, so a second registration with the same phone is blocked at the constraint, but a registration with a different phone, or the same person at a different tenant with a new number, produces a second `users` row. There is no cross-source or cross-tenant identity resolution to prevent it.

### 3.4 Provenance and authorship

`VERIFIED`: `public.users` and `public.workers` carry `created_at` and `updated_at` (auto), and a `deleted_at` soft delete marker. **Neither records which actor created or changed the identity record** (no `created_by`, no `updated_by`). `clinical.worker` carries only `created_at`. There is no append-only history of identity changes; `updated_at` is overwritten in place.

---

## SECTION 4. MATCH, MERGE AND SPLIT AS BUILT

### 4.1 Matching logic

`VERIFIED`, `supabase/functions/cases/index.ts:109 to 138`. The comment at line 109 reads "Resolve or create the worker (users + workers) by phone within the tenant." The logic:
```
select id from users where phone = worker.phone and tenant_id = tenantId and deleted_at is null limit 1
```
- **Deterministic, single field: an exact match on `phone`, scoped to `tenant_id`.** No scoring, no thresholds, no fuzzy matching, no tie handling. There is one candidate or none.
- On a match, the existing `users.id` is reused and its `workers` row is found or created (lines 119 to 122).
- The `sin_hash` is computed and stored on every `insertWorker` (lines ~221 to 222) but **is never consulted for matching in any code path found.** The schema comment calls it "dedup and match", but no code dedups or matches on it. `VERIFIED` by grep: `sin_hash` appears only in the migration and in the insert, never in a `select ... where sin_hash`.

### 4.2 Merge behaviour

`VERIFIED`: **none exists.** There is no code that merges two person records, reconciles their foreign keys, or combines their history. A wrong duplicate, once created, stays a duplicate.

### 4.3 Split or unmerge behaviour

`VERIFIED`: **none exists.** This is a finding, not a footnote: the as-built system has neither a merge nor an unmerge, so the identity estate has no correction mechanism at all beyond the `deleted_at` soft delete on a `users` or `workers` row.

### 4.4 Every path that can create a person

`VERIFIED`: exactly one, `cases/index.ts:123 to 138`. It inserts a new `public.users` row (phone, full_name, role worker, tenant_id, status invited) only after the phone lookup in 4.1 returns nothing, then inserts the `workers` row. **The only check before creation is the exact phone match within the tenant.** No SIN check, no name check, no cross-tenant check, no external identifier check. `clinical.worker` creation is not in this path and its creator is `UNVERIFIED` from source (no live access).

---

## SECTION 5. INTERFACES AND BOUNDARIES

### 5.1 Exposed interface

`VERIFIED`: the MPI exposes no dedicated interface. The person resolution is an internal step inside the `cases` edge function's case intake handler (`POST` creating a case). Signature, from the header comment: input `{ tenant, worker: { full_name, phone, dob, sin, job_title }, injury: {...} }`, output `{ injury_id, status, sms_dispatched }` (`cases/index.ts:6 to 20`). There is no `resolveIdentity(...)`, no `lookupExternal(...)`, no person endpoint.

### 5.2 What it consumes

`VERIFIED`: the `cases` function uses the Supabase JS client with the service role key, and writes `tenants`, `users`, `workers`, `injuries`, `wcb_notifications`. It depends on `public.user_role` and `public.user_status` enums. It calls `sha256Hex` (a local helper) for the SIN hash. No external identity provider, no MPI service.

### 5.3 Position relative to the three lanes and the canonical model

`VERIFIED`: the as-built person data is **operational and identity data in the hub schema** (`public.users`, `public.workers`, `public.injuries`), and the `cases` function writes clinical fields directly onto `public.injuries` (`body_part`, `injury_type`, `severity`, `diagnosis_notes` at lines 150 to 154). So the intake path touches identity and clinical data in the same write, in the hub `public` schema. This is the opposite of the canonical boundary Prompt 52 specifies (identity resolution isolated behind `resolve_identity`, no adapter writing domain rows directly). The physician stream's `clinical.worker` is separate and is not written by this path.

### 5.4 What would touch a live service if run

`VERIFIED`, named not executed: `cases/index.ts` reads `Deno.env.get("SUPABASE_URL")`, `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")`, `Deno.env.get("CONTINUUM_NEXUS_TOKEN")` and creates a Supabase client that would write to the live database. It applies no migration itself. Running it would create real `users`, `workers` and `injuries` rows. Not executed.

---

## SECTION 6. DELTAS AND OPEN QUESTIONS

### 6.1 Where the code and the known frame disagree (flagged, not resolved)

1. **The premise itself.** The brief and Prompt 52 state the MPI is implemented and to be reused; the code has no MPI (Section 2). Prompt 52's stage 12 (`resolve_identity`), its Section 4.1 (`mpi.*` tables), and Prompt 51's single `mpi.person` allow-list exception have **no backing code**. Cited: brief Section 1; Prompt 52 Section 0.2 Correction 1 and Section 4.1; against the grep in Section 2.
2. **Natural key on phone.** `public.users.phone unique` (`foundation_core.sql:84`) is a natural-key uniqueness that Prompt 51 Section 10.2 and Prompt 52 Section 16 prohibit ("not a phone number ... mis-keyed, reassigned and shared").
3. **Two unreconciled person models.** `public.users`/`workers` and `clinical.worker` (Section 3.3). Prompt 52 Correction 1 requires exactly one canonical Person entity. The as-built has two, unlinked.
4. **Clinical and identity in one write.** `cases/index.ts` writes `diagnosis_notes` and other clinical fields alongside identity onto `public.injuries` (Section 5.3). Prompt 52 Section 0.5 requires the canonical boundary to be the only door into the domain and forbids an adapter writing domain rows directly.
5. **No merge, no unmerge, no provenance actor** (Sections 3.4, 4.2, 4.3). Prompt 52 Section 0.2 treats a wrong merge as unbounded and requires review rather than auto-merge; the as-built has no merge to govern, and no identity-change audit actor.
6. **`sin_hash` stored but unused for matching** (Section 4.1). The schema comment promises "dedup and match"; no code path uses it. Either the intended matching was never built, or it lives in an unbuilt generator path (`worker_intake_fields.sql:6` points at a separate 07.8 secure-store path).

### 6.2 Everything UNVERIFIED

- Who writes `clinical.worker` in practice, and whether the physician and hub person models are ever reconciled at runtime. **DEFERRED TO G1** (needs live behaviour).
- Row counts, and whether duplicate persons already exist in production. **DEFERRED TO G1** (no live access).
- Whether any deployed job or function outside the inspected set performs matching or merging. Searched the repository exhaustively; a deployed-only artifact not in the repo cannot be ruled out here. **DEFERRED TO G1.**

### 6.3 Questions the Prompt 57 author must decide

1. **One person entity or two.** Whether the physician `clinical.worker` and the hub `public.users`/`workers` unify into a single canonical `mpi.person`, and how existing rows reconcile.
2. **The identity key.** Whether phone remains the resolution key (it is a prohibited natural key), or an internal `mpi.person` id with an external identity map replaces it, per Prompt 52 Section 4.
3. **SIN hash matching.** Whether `sin_hash` becomes a real deterministic match input, and under what governance, given it is a federal identifier.
4. **Merge and unmerge policy.** Whether a merge exists at all, whether it is reversible, and the review versus auto rule (Prompt 52 Section 0.2 forbids auto-merge on a probable match).
5. **Cross-tenant and cross-source resolution.** Whether the same human across tenants or across the hub and physician streams is one person or many.
6. **Identity change provenance.** Whether identity writes become audited and append-only, since the as-built overwrites `updated_at` in place with no actor.

---

**End of report. No MPI was built. No fix was proposed. No production was touched. Prompt 57 is not begun. The extraction stops here.**
