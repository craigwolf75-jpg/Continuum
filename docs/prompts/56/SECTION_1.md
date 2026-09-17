# Prompt 56 Section 1: prerequisite inspection

Inspected on 2026-09-16 from tip
`282b3f7c149a73eb957a8e81352afb72d7f46a42`
(`Prompt 54 design system review and build (do not ship) (#159)`).

Read only for this document. No write, seed, live apply, or
credential use in this inspection. No worker product, persistence,
identity provider, Continuum Motion, conversational adapter, psych
capture release, screen, or live provisioning was implemented.

The governing .docx is not stored in this repository. Identity and
Section 00.1 are taken from the confirmed dispatch: PROMPT 56. THE
CONTINUUM WORKER EXPERIENCE (Craig original designation PROMPT 54).
Amendment 1 applied in place. Unified 56, not unified 54 Design
System. Section 00.1: REGISTERED, NOT RELEASED.

This file answers every named prerequisite with evidence or
**UNVERIFIED**. It does not invent a service to satisfy a check. It
does not invent Amendment 1 text. It does not invent G1.

No em dashes or en dashes anywhere.

**Headline.** Prompt 56 is registered, not released. It sits behind
G1. Prompt 53 holds were released 2026-09-16 by Craig. The first
unmet intended check is that release gate. Product execution
stops there. Remaining checks are recorded as inspection only.

---

## Check 1. Section 00.1 release gate (G1 and Prompt 53)

**UNMET. Intended halt. STOP product execution.**

Section 00.1: REGISTERED, NOT RELEASED. This prompt sits behind
G1. Prompt 53 holds were released 2026-09-16 by Craig. Former
Prompt 53 holds are no longer binding under Prompt 53. Hold
lift is not an auto-execute.

G1:

- `PROMPT_G1_DISCOVERY_AUDIT` is not in this repository.
- `G1_AUDIT_REPORT.md` exists at repo root, dated 2026-08-13,
  read-only discovery, no live access.
- Prompt 53 records that file as not completion of the assigned G1
  prompt. Do not treat it as G1 closed. Do not start G1. Do not
  invent G1.

Prompt 53:

- `docs/prompts/53/HOLDS.md` is a RELEASE record on this
  tip. Status: RELEASED by Craig on 2026-09-16.
- Former Prompt 53 holds are no longer binding under
  Prompt 53. Named human dispatch still required before
  Montreal, Bedrock, non-SYNTH seed, or live schema apply.
- 50a Decision 1 is RELEASED-from-53-hold. Platform GO
  still requires a Craig or Hermes named path. Do not
  invent live apply. Decision 2 stands.
- Do not invent REV 2. Do not start a Prompt 47 redo from
  invented contents.
- Craig has not sequenced a Prompt 56 worker-experience build.

**STOP.** Do not execute worker product, persistence, identity
provider, Continuum Motion, conversational adapter, psych capture
release, screens, or live provisioning. The remaining checks are
answered so the halt is honest. They are not permission to build.

**Defect.** None for this halt. The halt is intended.

---

## Check 2. Numbering map and collision with unified 54

**Answered. Keep them separate.**

| Name | Number | Folder on this tip |
|---|---|---|
| The Continuum Worker Experience | Craig 54, unified 56 | this folder |
| Amendment 1 | Craig 54A, unified 56a | file not supplied |
| Design System and Surface Standard | unified 54 | `docs/prompts/54/` |
| Earlier Design System landing | earlier unified 51 Design System | `docs/prompts/51-design-system/` |
| Core Platform Foundations | Prompt 50a uses 51 (old stream 47) | `docs/prompts/50/`, `docs/prompts/50a/` |

`docs/prompts/54/` is the Design System. This inspection does not
overwrite it. Cross-link only. See [REGISTER.md](REGISTER.md).

Legacy worker HTML already comments `Prompt 56 / Document 3.6`.
That is prior local and CI work. Prompt 52 classified
`SCR-WRK-01` and `SCR-WRK-02` as built as legacy
(`docs/prompts/52/SECTION_1.md` Check 2). Freeze that work. Do not
unwind it. Do not treat those files as a release of this prompt.

---

## Check 3. Amendment 1 file present and comparable

**UNVERIFIED. File not supplied.**

The governing file states Amendment 1 is applied in place.

Walk on this tip:

- No `PROMPT_54A_AMENDMENT_1.md`.
- No `*54A*` file.
- No worker-experience `*AMENDMENT*` file. The only amendment
  hits are WCB report amendment SQL
  (`platform/db/0014_wcb_report_amendment_chain.sql` and its
  test). Those are not 54A.

Applied-in-place cannot be verified against the amendment file.
Do not invent the missing file. Do not invent Amendment 1
sentences.

**Defect.** Amendment file absent. Applied-in-place stays
UNVERIFIED.

---

## Check 4. Version confirmed against Craig 44 to 49 list

**UNCONFIRMED. STOP for build.**

Prompt 53 canonical versions:

- Old Prompt 44 is RREV 2, sent 12:34 PM.
- Old Prompt 45 is REV 2, sent 12:32 PM.
- Old Prompts 46 through 49 are single versions.

This document is Craig original PROMPT 54 / unified 56. It is not
on that list. Nothing in this repository states that Craig
confirmed this file against that list.

CONFIRM WITH CRAIG before any future build. Do not treat this
registration as that confirmation.

**Defect.** Version canonicality UNCONFIRMED.

---

## Check 5. PSYCH_CAPTURE_PRODUCTION_RELEASE

**False in source. Do not flip.**

`supabase/migrations/20260915140000_worker_schema.sql` lines 66 to
71 insert:

- `PSYCH_CAPTURE_PRODUCTION_RELEASE`, false
- `MOTION_PRODUCTION_RELEASE`, false
- `GENERATIVE_ADAPTER_ENABLED`, false

`deploy/worker-schema-graph.test.mjs` line 39 asserts the psych
flag defaults false.

`worker.psych_capture` exists as a table (same migration, lines
135 to 142). A table is not a production release. Prompt 50a
labels that table non-platform
(`docs/prompts/50a/NON_PLATFORM_INVENTORY.md`).

This inspection does not enable the flag. This inspection does
not write psych capture.

---

## Check 6. Generative / conversational adapter

**Disabled in source. Do not enable.**

Flag: `GENERATIVE_ADAPTER_ENABLED` defaults false (Check 5).

Client seam: `deploy/worker/app/app.js` lines 134 to 151.

- `WK.companion.generativeEnabled` is hardcoded `false`.
- `say()` throws `generative adapter is disabled in version one`
  if that field is true.
- Comment: the generative adapter sits behind the same interface
  and is disabled pending provider, residency, contractual,
  privacy, and regulatory sign-off. There is no path by which
  generated text a human did not author reaches a worker action.

No provider is invented. No adapter is enabled.

---

## Check 7. Continuum Motion

**Dark. MOTION_PRODUCTION_RELEASE false. Do not enable.**

Flag: `MOTION_PRODUCTION_RELEASE` defaults false (Check 5).

RPC: `worker.record_movement` in
`supabase/migrations/20260915140200_worker_rpcs.sql` lines 357 to
361 raises `the movement check is not enabled in this deployment`
unless the flag is true.

Legacy screen: `deploy/worker/movement-check.html` comments
Prompt 56 / Document 3.6 + Document 5, and gates on
`MOTION_PRODUCTION_RELEASE` (lines 16 and 125). That file is
prior local and CI work. This mission does not add a Motion
screen and does not flip the flag.

Continuum Motion stays dark.

---

## Check 8. Document 13

**Unbuilt. UNVERIFIED as a source file.**

Grep of `*.md`, `*.js`, `*.mjs`, `*.sql`, `*.html`, and `*.txt`
for `Document 13`, `DOC-13`, and `doc 13` returns no worker
experience document and no implementing file.

Do not invent Document 13. Do not build it here.

**Defect.** Document 13 is unbuilt and not in this repository.

---

## Check 9. Phase 7b

**Absent. Recorded as deleted. Do not rebuild.**

Grep of the same trees for `Phase 7b` and a worker-experience
`7b` phase file returns no match. `CONTINUUM_37_MODULE_TESTS.js`
`t17b` is an unrelated module test name.

Do not invent Phase 7b. Do not restore a deleted phase.

---

## Check 10. Canadian-region speech provider, no-train term
(repo-cited Section 1 checks 7 and 8)

**Not configured. Voice input off. Do not invent a provider.**

`deploy/worker/app/app.js` lines 154 to 160:

- Text mode is always available.
- Voice input is gated on a Canadian region provider with a no
  training contractual term, cited there as Section 1 checks 7
  and 8.
- `WK.stt.available` is `false`.
- `WK.stt.start` throws `voice input is not available yet,
  please type your answer`.

Grep of application source for a configured Canadian STT
endpoint, a no-train contract record, or a live speech provider
returns none. Prompt 44 Canada / no-train still holds. Bedrock go
still requires named human dispatch. Hold lift is not an
auto-execute.

Do not invent a speech service to satisfy this check.

**Defect.** Provider and no-train term are not configured. That
is a stop for voice, not permission to wire one.

---

## Check 11. Identity provider

**Existing hub and worker auth only. No new provider. Do not
execute.**

Present on this tip, not created by this mission:

- Hub: HMAC cookie `ct_session` via `deploy/api/hub-signin.js`
  and `_hub_session.js`. Supabase Auth (GoTrue) password grant.
- Worker account: `worker.worker_account` keyed to `auth.users`,
  with `clinical_worker_id` pointing at `clinical.worker`
  (`20260915140000_worker_schema.sql` header and lines 73 to 82).
- Identity map comment (not legal copy) in that migration and in
  `deploy/worker/app/config.js`: `hub_profiles` is the hub
  approval gate; `public.users` and `public.workers` are the hub
  person and role projection.
- `MPI_AS_BUILT_REPORT.md` line 121: no external identity
  provider, no MPI service.

Craig verification of the Prompt 33 hub authentication fix is
still absent (Prompt 52 and Prompt 54 Section 1 Check 1).
**UNVERIFIED for ship.** This inspection does not re-test live
auth and does not add an identity provider.

Do not create Auth0, Cognito, Okta, or any other IdP. Do not
create `mpi.person`.

---

## Check 12. Persistence and live provisioning

**Files exist. Live apply is not this mission. Do not provision.**

Worker schema files on this tip (prior local and CI work):

- `supabase/migrations/20260915140000_worker_schema.sql`
- `supabase/migrations/20260915140100_worker_rls.sql`
- `supabase/migrations/20260915140200_worker_rpcs.sql`
- later 20260915 invite-gate and grant files
- CI proofs: `supabase/tests/worker_schema.sql`,
  `supabase/tests/worker_provision_gate.sql`,
  `deploy/worker-schema-graph.test.mjs`

`20260915140000_worker_schema.sql` line 3: `Do not apply to live
Supabase from this mission.`

Platform `0018` and `0019` remain files only, unapplied.

This inspection does not apply schema. It does not provision a
worker. It does not create a hosted project.

---

## Check 13. Worker screens

**No new screen. Legacy Prompt 56 comments stay frozen.**

Prompt 52 Check 2 already recorded legacy `SCR-WRK-01` and
`SCR-WRK-02` on `deploy/worker/today.html` and
`check-in.html`. Other companion HTML files comment Prompt 56 /
Document 3.6. Those are prior work. This mission adds none.

Do not add a worker screen to make a check pass.

---

## Check 14. package.json

**Locked. No change required.**

The governing registration does not require a `package.json`
edit. This inspection edits none.

Roots unchanged: `deploy/package.json`, `hub-roles/package.json`,
`worker-app/package.json`.

---

## Prompt 53 holds were released 2026-09-16 by Craig

Recorded from `docs/prompts/53/HOLDS.md` on this tip. Former
Prompt 53 holds are no longer binding under Prompt 53. Hold
lift is not an auto-execute. Not a ship of this registration.

- Named human dispatch still required before Montreal,
  Bedrock, non-SYNTH seed, or live schema apply. Do not
  start Section 3+ live-platform work under Prompt 51
  foundations without that named dispatch.
- 50a Decision 1 is RELEASED-from-53-hold. Platform GO
  still requires a Craig or Hermes named path. Do not
  invent live apply. Decision 2 stands. Do not create
  `mpi.person`.
- Do not invent REV 2. Do not start a Prompt 47 redo from
  invented contents.
- Do not invent G1. `G1_AUDIT_REPORT.md` (2026-08-13) is
  read-only discovery, not G1 closed.
- Athena does not ship.

---

## Conflicts and defects this inspection must record

1. **Check 1 STOP.** Section 00.1 registered not released. G1
   not closed. Prompt 53 holds were released 2026-09-16 by
   Craig. Hold lift is not an auto-execute. Product
   execution stops.
2. **Amendment 1 file absent.** Applied-in-place UNVERIFIED.
3. **Version UNCONFIRMED** against Craig 44 to 49 list.
4. **Document 13 unbuilt.**
5. **Phase 7b absent / deleted.**
6. **STT provider and no-train term not configured.** Voice
   stays off. Do not invent a provider.
7. **Psych capture, Motion, and generative flags stay false.**
8. **Unified 54 Design System is a different prompt.** Do not
   overwrite `docs/prompts/54/`.

---

## Human gates (untouched)

`package.json`, consent wording, legal pages, pricing, email
templates, credentials, live schema apply, occupational seed,
live Bedrock, Montreal, `platform/db`, `docs/prompts/50/`,
`docs/prompts/50a/`, `docs/prompts/54/`, `G1_AUDIT_REPORT.md`.
Athena does not ship. This phase wrote this file only.
