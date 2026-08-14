# Section 17 Decision Brief: the wcb_report lifecycle and immutability model

Prepared for Craig. Prepared 2026-08-14. No dashes anywhere.

## The one decision

`clinical.wcb_report` needs a single, authoritative answer to: **what status transitions are legal, and
what does it mean for a signed report to be immutable?** Two approved prompts describe it differently,
so the enforcement (a DB guard plus the write grant) was deliberately left off until you settle it.
Everything below is to let you decide in one pass.

## Why this is on hold

The Prompt 51 platform build reconciles onto the existing physician schema under one authority rule
(Prompt 51 section 0.1): **the approved behaviour of Prompts 39 to 46 outranks Prompt 51 where they
conflict.** Prompt 51 section 5.2 redesigns `wcb_report` as a sign-then-supersede artifact, but Prompt
42 defines a submission lifecycle. Rather than pick a winner unilaterally, the build did only the safe,
additive half (the "expand" phase) and stopped at the half that requires your call (the "contract"
phase: turning on immutability and the state machine).

## The conflict, precisely

- **Prompt 42 (submission lifecycle):** a report is signed, then submitted to the WCB, then the WCB
  accepts or rejects it. Transitions: `draft -> signed -> submitted -> accepted | rejected`.
- **Prompt 51 section 5.2 (immutable, amend-by-supersede):** a signed report is immutable; the only
  post-sign change is to move it to `superseded` when a corrected report replaces it (or `withdrawn`).
  Its status vocabulary is `draft / signed / superseded / withdrawn`, with no submission states.

They disagree on two things: the **status vocabulary**, and whether a signed report may **advance**
(Prompt 42) or is **frozen except to supersede** (Prompt 51 section 5.2). The immutability guard that
Prompt 51 ships (`platform.guard_signed_immutable`) encodes the strict 51 model literally: on any
non-draft row it permits only a move to `superseded` and raises on anything else. Attaching it as-is
would reject `signed -> submitted`, `signed -> accepted`, and `signed -> withdrawn`, which are legal
under Prompt 42 and the current data model.

## Current live state (facts, physician project, 2026-08-14)

The expand phase already merged both vocabularies without enforcing either, so nothing is lost by
deciding now:

- `report_status` enum, in order: `draft -> signed -> submitted -> accepted -> rejected -> superseded
  -> withdrawn`. Both families coexist.
- Amendment and submission columns coexist on the table: `status`, `signed_at`, `signed_by`,
  `signature_digest`, `snapshot_hash`, `supersedes_report_id`, `superseded_by_id`, `amendment_reason`,
  `person_id`, `claim_reference`, `jurisdiction_code`, `location_id`.
- One check constraint: `ck_wcb_report_amendment_reason` (a superseding report must carry a reason).
- **Triggers: none.** Nothing enforces a legal transition, and nothing freezes a signed report. A
  signed clinical and legal document is currently mutable in the database. That is the compliance gap
  this decision closes.
- No live runtime writes `wcb_report` yet (the write path, `commitSignature`, is unwired), so this can
  be settled without disturbing anything in production.

## Options

**Option A (recommended): reconcile. Content-freeze plus a lifecycle that advances.**
A signed report's clinical content is frozen at signing, but its status may still advance along the
legal path. Legal transitions:
`draft -> signed -> submitted -> accepted | rejected`, and from any signed-or-later state
`-> superseded` (amendment, requires `superseded_by_id` and `amendment_reason`) or `-> withdrawn`.
"Immutable" means: once `status <> 'draft'`, the content columns cannot change; only `status` and the
lifecycle fields (`signed_at`, submission timestamps, supersession pointers) may change, and only along
the legal path. This honours the authority rule (Prompt 42 lifecycle survives), delivers Prompt 51's
intent (the content is genuinely frozen), and matches the data already live.

**Option B: adopt Prompt 51 section 5.2 strictly.**
A signed report can only be superseded or withdrawn; the submission lifecycle moves out of `wcb_report`
(tracked on a separate submission record). Cleaner immutability, but it contradicts Prompt 42 (which
the authority rule says wins) and strands the `submitted / accepted / rejected` states already in the
enum and in Prompt 40 and 42 code. Not recommended unless you intend to relocate submission tracking.

**Option C: leave enforcement off (status quo).**
No trigger, no state machine. Signed reports stay DB-mutable indefinitely. Not recommended: it leaves a
signed clinical and legal record editable, which is the gap the whole immutability substrate exists to
close.

## Recommendation

**Option A.** It is the only option consistent with the Prompt 51 authority rule, it realises the
immutability intent, and it fits the data that is already live. It also keeps the amendment chain
(supersession by a new report row) that the columns already support.

## What I need from you to build it

If you choose Option A, confirm the specifics so the guard encodes exactly your intent, not my guess:

1. **The legal transition table.** Confirm this set, or correct it:
   `draft->signed`, `signed->submitted`, `submitted->accepted`, `submitted->rejected`,
   `{signed,submitted,accepted,rejected}->superseded`, `{signed,submitted}->withdrawn`. Are
   `accepted`/`rejected` terminal (no further change except supersede)? May a `rejected` report be
   corrected and re-submitted, or must it be superseded by a new report?
2. **What "frozen" covers.** Confirm the content columns are frozen once `status <> 'draft'`, while
   `status`, `signed_at`, submission timestamps, and the supersession pointers remain writable. Flag
   any content column that must stay editable post-sign.
3. **Amendment = new row.** Confirm a correction is a NEW `wcb_report` row that points back via
   `supersedes_report_id`, and the original moves to `superseded` (the columns imply this). Confirm no
   in-place edit of a signed report is ever allowed.
4. **Signature semantics.** Confirm `signature_digest` / `snapshot_hash` freeze the content-at-signing
   (so a later verification can detect tampering), and which fields feed that hash.
5. **Enforcement layer.** Recommended: a DB trigger (the state machine plus content-freeze) AND a
   column-level `UPDATE` grant to `app_clinical` on the lifecycle columns only, so the wall and the
   trigger are two independent controls. Confirm, or say app-layer only.

## What unblocks when you decide

On your answer I build one platform migration: a `wcb_report`-specific guard function encoding your
transition table and content-freeze, attach it as a BEFORE UPDATE trigger, add the column-level
`UPDATE` grant for `app_clinical`, and add a CI test proving each legal transition passes and each
illegal one is rejected. That closes Gate 2 of the RLS wall activation and gives the signed report the
immutability the compliance story needs. Gate 1 (the `app_clinical` login credential) is separate and
sits with Gary; Gate 3 (the `practitioner` retrofit) stays blocked on the MPI.
