# Prompt 52 Friction, moments, invisible software, loud failures, prohibited

Specification for builders. Source: Prompt 52 sections 4, 5, 6, 7 and
8. This file does not invent Prompt 38 screens and does not create a
coordinator dashboard.

Only removals that an existing specification supports are listed.
Section 4.3 names the friction that is load bearing, so that nobody
removes it in a later optimisation pass.

No em dashes or en dashes anywhere. Standing holds: no live Bedrock,
no occupational seed, no schema apply, `package.json` locked.

---

## Section 4. The friction audit

### 4.1 What stops being asked

| # | What changes | Where | Why it can change |
|---|---|---|---|
| 1 | Most of the twenty six case start fields stop being asked, without any of them being deleted from the record | SCR-CASE-01 | Prompt 50 section 3 classification and rule 6. Session context, the person index and the employer directory already hold them |
| 2 | The location and role question disappears | Application shell | Stated, not asked. One membership means no control renders |
| 3 | The `Pull availability from employer profile` button disappears | SCR-OIS-01 | Compute the suggestion before the practitioner arrives |
| 4 | The invoice screen leaves the practitioner's path entirely | SCR-INV-01 | Already an acceptance criterion. Requires the full errata D4 fix first |
| 5 | The full page sign in on session expiry disappears | SCR-AUTH-01 | Re-authenticate in a modal and return to the exact field. Losing your place mid encounter is the expensive part |
| 6 | The submit button on the MFA code field disappears | SCR-AUTH-02 | Submit on the last digit |
| 7 | The skeleton on the worklist disappears in the normal case | SCR-WL-01 | Target is 800 ms. Render skeletons only after 1000 ms has actually elapsed |
| 8 | The disabled state at case start disappears | SCR-CASE-01 | Render enabled with resolved values, load lists behind the screen |
| 9 | Three quarters of the referral dropdown disappears | SCR-TREAT-01 | Filter by report type, and by category per errata D20 |
| 10 | The spinner between signature and the next case disappears | SCR-REV-01 to SCR-OUT-01 | Prompt 50 section 6.1 |
| 11 | Every loading indicator under 1000 ms disappears | All | Prompt 51 section 8.1 |
| 12 | No status is ever available only by email or phone | Coordinator, employer | Prompt 50 rule 7 bans a status that must be emailed, not email itself. N12 and N13 remain, and each also has a permanent home on a surface |
| 13 | The individual stale value dialogs collapse into one | SCR-FUP-01 | One grouped confirmation naming the count and the oldest date |

### 4.2 What can disappear that nobody has counted yet

Instrument these and report before deciding.

1. Clicks from case open to signature, per form type. Median, not
   mean.
2. Screens touched per follow up where the trajectory is UNCHANGED.
   The two interaction claim is refuted; report the real number.
3. Fields a human types per case, for a known worker at a known
   employer. Prompt 50 section 3.5 already asks for it. The most
   quotable number the product will produce.
4. Warnings and errors shown per session, per role. Prompt 51
   section 8.3.
5. Notifications sent per role per week.

### 4.3 What must not disappear. Load bearing friction.

| Kept | Why |
|---|---|
| The bulk Able confirmation naming the count and the axes | The practitioner is making a clinical statement. The dialog is the product refusing to make it for them |
| The clearing warning on SCR-FUP-01 | Hidden field data is cleared and not submitted |
| The deliberate confirm on `Sign and submit` | A signature is an attestation about one worker |
| The decline control on both consent cards, at equal weight | A quiet decline control is coercion with good intentions |
| The stale value confirmation at ninety days | A carried value three months old is a clinical assertion nobody has checked |
| Consent capture failure blocking progression | An unrecorded consent is worse than a delayed visit |
| The privacy pack banner on every sign in until filed | Submission is blocked behind it |
| The break glass notification, N14 | The one notification that can never be muted |

---

## Section 5. The six moments, as behaviour

### 5.1 Opening the first patient

- **Why it matters:** the first evidence that the product knows
  anything.
- **How it should feel:** already underway.
- **How it must behave:** the row is prefetched on hover or keyboard
  focus so activation renders in under 100 ms. Prefetch only data the
  worklist already holds and the user is already entitled to see. A
  prefetch that pulls clinical detail about a case the user has not
  opened is an access event with an unresolved audit question, per
  Prompt 51 section 16 open item 6.

### 5.2 Completing the first report

- **Why it matters:** the practitioner is deciding, in this one
  encounter, whether Continuum costs them time or gives it back. They
  will not run the experiment twice.
- **How it should feel:** shorter than expected.
- **How it must behave:** the median seconds from case open to
  signature is instrumented from the first report and reported per
  form type, per Prompt 50 section 12. If the first report takes
  longer than the practitioner's current EMR, that is the product
  failing, and it must be visible to Craig the same day rather than
  discovered at the pilot review.

### 5.3 Signing

- **Why it matters:** the only irreversible act in the product and
  the only one carrying the practitioner's billing number.
- **How it should feel:** deliberate, then over.
- **How it must behave:** the blocking banner resolves to zero before
  the control enables. The confirm step is explicit. The transaction
  commits and control returns immediately. No animation, no spinner,
  no confirmation to dismiss, no celebration.

### 5.4 Employer notification

- **Why it matters:** the only moment an employer experiences the
  product directly. Their first thought should be that it was fast
  and their second that they did not have to ask.
- **How it must behave:** **[SPEC]** N12 fires on publication, to the
  supervisor, by email, on publication. N13 warns three days before
  the restriction period expires and escalates on the expiry date.
  **[NEW]** Both contain the duty list and nothing else, both carry
  the permanent disclosure line, and neither is ever an alert about
  clinical status. Each also has a permanent home on the employer
  surface, so no status exists only in an inbox.

### 5.5 Worker update

- **Why it matters:** thirty seconds given, clarity received. That
  trade has to be honest or they stop, and the check in data is what
  makes the next follow up short.
- **How it must behave:** every check in returns something in the
  same session. What the doctor said, in plain words. When the next
  visit is. What happens next. A check in that ends in a thank you is
  a check in that ends.

### 5.6 Return to work

- **Why it matters:** **[SPEC, Project Obsession]** "the only
  genuinely good news in the entire workers' compensation process",
  and it currently passes unremarked.
- **How it should feel:** noticed.
- **How it must behave:** announced to the worker, the physician and
  the employer on the same day, in each audience's register, as plain
  prominent news. Not an animation, not a badge, not a score, and not
  blocked by the celebration prohibition in Prompt 51 section 7,
  which covers celebrating a user's own routine output. Reporting a
  good clinical outcome is a different thing and is required. A build
  gate that blocks this is a defect in the gate.

---

## Section 6. The invisible software test

The highest compliment is not "this is beautiful". It is "I did not
think about the software." Measure its four shadows.

| Shadow | Measure | Target |
|---|---|---|
| They stopped noticing it | Median seconds from case open to signature, per form type, weekly, over a clinic's first eight weeks | Declines, then stops declining. Report the week at which the week over week change first falls below ten percent. That week is the number to watch |
| They stopped asking about it | Support contacts per clinic per week, categorised as how do I, it is broken, it is wrong | How do I falls to near zero by week four |
| They stopped being warned | Warnings and errors shown per session, per role | Falls. A rise is a defect in Continuum, not in the user |
| They stopped needing training | Minutes from account creation to first signed synthetic report | Median under 60 minutes, per Prompt 50 section 9.3 |

Two qualitative tests, run at the three orientations in Phase 3 of
the Market Entry Game Plan:

1. **The four minute test.** Prompt 45 says physician training is
   four minutes and covers one screen. Sit a physician down with four
   minutes of instruction and no help, and watch them complete a
   follow up. Anything they ask about is a defect with a screen
   attached.
2. **The unprompted sentence.** After a full clinic day, ask one open
   question: "What was that like?" Offer no options. Record the first
   sentence verbatim. The target is a sentence about their day, not
   about the software.

Clinical timing instrumentation of Prompt 50 section 12 is absent in
this repository. See `docs/prompts/52/STOPS.md`. Do not invent a live
telemetry sink. Acceptance criteria that need that instrumentation
stay not attempted until it exists.

---

## Section 7. What must fail loudly

| Condition | Resolution |
|---|---|
| A user facing string not present in the string catalogue | Build fails. Section 2 cannot be applied to strings scattered through components |
| A loading indicator rendering for an operation that completed under 1000 ms | Defect. Report the operation and its measured duration |
| A drafted field rendered at reduced text contrast | Defect. The border, tint and label carry the signal |
| An employer surface rendering partial data after an error | Hard failure. Render nothing and say so |
| An employer view published for a worker whose employer has no job profile | Hard failure. Publish nothing, surface the reason to the coordinator |
| Two screens showing different values for the same worker record | Hard failure, alarmed. Measured in the running application 30 to 31 July |
| A completed worker check in rendering as if still editable | Defect. Measured in the running application 30 to 31 July |
| An unanswered Consent B recorded as `declined` rather than `not_asked` | Defect. It asserts a refusal the worker never made |
| The refuted follow up copy appearing in wireframe 5.8, the clearing modal or journey 6.3 | Defect. Errata D1 corrected the specification and not those three places |
| A practitioner blocked at signature by skill code [G1] with no route to resolve it | Hard failure. Errata D4, and it blocks every practitioner on the platform |
| The return to work announcement blocked by a celebration gate | Defect in the gate, not in the announcement |

---

## Section 8. Prohibited, with the reason

| Prohibited | Reason |
|---|---|
| Softening any of the five protected strings in section 2.5 | Each carries a legal, clinical or trust obligation. Shorter and warmer means worse |
| A bulk sign control, or a select all column on the worklist | A signature is an attestation about one worker. A select all column's only purpose is a bulk action that must not exist |
| Making the consent decline control quieter than the consent control | Coercion with good intentions |
| A dismissible privacy pack banner | Submission is blocked behind it and the clinic will not know why nothing sends |
| Recording an unanswered Consent B as declined | Prompt 50 rule 6: unanswered and never asked are first class answers |
| Nagging, badging or returning to an unanswered Consent B | It may remain unanswered. That is permitted, not incomplete |
| A leaderboard of practitioners, on any metric | Prompt 45 section 5.5, Prompt 50 section 14 and Prompt 51 section 14 all forbid it |
| Clinical urgency routed to an employer, in any form | Nothing about a worker's clinical status is ever sent to an employer as a notification |
| Continuum sending the Pink Copy to an employer | The lawful channel is the worker handing it over. Continuum is not a party to that disclosure |
| Streaks, scores, compliance percentages or nudging language on the worker surface | The evidence says the process itself causes harm. Adding pressure to it is the opposite of the product |
| Guided exercise content activated by default | It activates only where the practitioner authorised it for that case |
| Building any screen in section 3 to a lower standard because it has no field level specification | Seventeen of thirty four screens have no specification, and that is what this prompt exists to prevent |
