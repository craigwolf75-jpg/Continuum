# Prompt 52 Physician encounter: feel specification

Specification for builders. Not a visitor-facing product screen.
Source: Prompt 52 section 3.2. This file does not invent Prompt 38
screens. Field lists, validation rules and business rules are
unchanged and are not restated.

Prompt 45 Phase 9 puts physician training at four minutes covering
one screen: the measurement and the follow up control. Every other
screen in the encounter is overhead the physician did not ask for.
Design each to be got through, not admired.

Reading convention:

- **[SPEC]** reports what an existing document already requires.
  Verify it, do not redecide it.
- **[NEW]** is authored by this prompt because no specification
  exists.
- **[CHANGE]** overrides an existing specification, and says what it
  overrides and why.

No em dashes or en dashes anywhere. Standing holds: no live Bedrock,
no occupational seed, no schema apply, `package.json` locked.

---

## SCR-WL-01, Clinic worklist

- **Feels like: a departures board.** Dense, sorted, unambiguous,
  instant. **[SPEC]** "This screen must be instant and boring."
- **Eye lands on:** **[NEW]** the fee tier column. It is the highest
  value column on the highest traffic screen and the only one that
  changes while you look at it.
- **The one thing that must be true:** **[SPEC]** 800 ms first
  contentful paint at 500 open cases. Everything else on this screen
  is negotiable and that is not.
- **The rollup line belongs here.** **[SPEC, Prompt 50 section 7.3]**
  `4 due today. 2 safe. 1 at risk, needs Dr. Chen's signature by
  15:40. 1 will miss.` **[CHANGE]**: Prompt 50 section 7.4 separately
  requires every time to display with its timezone stated, so the
  rendered line reads `by 15:40 MDT`. This corrects Prompt 50's own
  example against Prompt 50's own rule.
- **Empty, two variants.** **[SPEC]** Keep the exact strings. `"No
  open cases. Start one when a worker arrives."` is correct because
  it states what causes the screen to fill.
- **Loading:** **[SPEC]** ten skeleton rows. **[CHANGE]**, overriding
  that: Prompt 51 section 8.1 forbids a loading indicator under 1000
  ms and this screen targets 800 ms, so render skeleton rows only
  after 1000 ms has actually elapsed. A skeleton that flashes for 200
  ms manufactures the wait it claims to explain.
- **Error:** **[SPEC]** "Never a blank screen." The table retains its
  last good data.
- **The countdown qualifier.** **[SPEC]** Prompt 38 open item 2 puts
  the estimate qualifier on hover. **[CHANGE]**: render it as
  persistent text. Hover is unavailable to a keyboard user and Prompt
  51 Article 4 forbids hover only information. **[SPEC, Prompt 50
  section 7.2]** Every at risk and will miss row names its blocking
  cause and the person who can clear it.
- **Friction:** **[SPEC]** there is deliberately no bulk sign.
  **[NEW]** Do not add a select all column either, because its only
  possible purpose is a bulk action that must not exist.

---

## SCR-CASE-01, Start a case

- **Feels like: reception work, not clinical work.** **[SPEC]**
  Ninety seconds, done standing up, while a person waits.
- **Eye lands on:** **[NEW]** the worker search. Not the practitioner
  select, which resolves itself.
- **The one thing that must be true:** **[SPEC, Prompt 50 section 3]**
  every field is classified resolvable or human only, and none of the
  twenty six fields is deleted from the record; this changes who
  fills them, not whether they exist. **[NEW]** Applied to the real
  set: the practitioner, contract, role, resolved form, jurisdiction,
  holiday calendar and deadline basis resolve from session context;
  every demographic field resolves from the master person index on a
  returning worker; every employer field resolves from the directory
  on a match. What a human still types for a known worker at a known
  employer is the date of injury, the job title, whether the injury
  developed over time, and a claim number if the worker brought one.
  Report the measured count. The target is single digits.
- **Loading:** **[SPEC]** fields disabled with a spinner while code
  lists load. **[CHANGE]**, overriding that: render the fields
  enabled with resolved values already in them and load the code
  lists behind the screen. A receptionist typing a family name into a
  disabled field is the worst first second in the product.
- **Error:** **[SPEC]** field level, inline, in text and not colour
  alone, and a server error preserves everything entered. Correct as
  written.
- **Character counters:** **[SPEC]** appear at eighty percent of the
  limit and never truncate silently. **[NEW]** The field never stops
  accepting characters. A name too long for the board is resolved
  once at the person index per Prompt 50 section 5, not blocked at
  reception.
- **The blocking rule feels like help, not refusal:** **[SPEC]**
  never default to General Practitioner. **[NEW]** The block names
  the contract, the role, and who at the clinic can change it.

---

## SCR-CONS-01, Consent

Consent language on this screen is [SPEC] from the build package and
Prompt 38. This file does not rewrite Consent A or Consent B. Human
gate for Gary if anyone proposes a change. Protected strings live in
`docs/prompts/52/VOICE.md` section 2.5.

- **Feels like: being told the truth by someone who does not need
  anything from you.** The two minutes spent here decide whether the
  worker believes the rest.
- **Eye lands on:** the body text, not the buttons. On a phone the
  buttons are below the fold and that is correct.
- **The one thing that must be true:** **[SPEC]** the decline control
  has equal visual weight to the consent control. **[NEW]** Any
  styling that makes decline quieter is a defect, and it is the most
  likely well intentioned change a developer will make.
- **Two records, one screen.** **[SPEC]** Consent A and Consent B are
  legally distinct and must never be merged as records. **[SPEC]**
  The wireframe already renders both cards on one screen with a
  single `Continue`. Nothing here changes that.
- **Unanswered is not declined.** **[SPEC]** `Continue` is enabled
  once Card A has an explicit answer, and Card B may remain
  unanswered. **[CHANGE]**, correcting the build package's own errata
  D20, "Consent cannot distinguish not asked from declined": record
  an unanswered Card B as `not_asked`, which is a distinct value in
  state machine 14.4, and never as `declined`. **[SPEC, Prompt 50
  rule 6]** Unanswered and never asked are first class answers, and
  silence never resolves to safe. The downstream effect is identical,
  the employer view is suppressed either way, but the record must not
  assert a refusal the worker never made.
- **No nagging.** **[NEW]** Do not badge, prompt or return to an
  unanswered Card B later.
- **`SHOW ME EXACTLY WHAT MY EMPLOYER SEES` is the most important
  secondary control in the product.** **[NEW]** It must open a
  realistic rendered example, not a description of one. Budget real
  work for it.
- **Success:** **[SPEC]** inline confirmation, no toast. **Error:**
  **[SPEC]** consent capture failure blocks progression. **[NEW]**
  The copy says why in one line, because a receptionist who does not
  understand a block will work around it.

---

## SCR-EXAM-01, Examination capture

- **Feels like: dictating to a colleague who writes fast and checks
  nothing.** The judgement is entirely the practitioner's and the
  screen must never appear to have an opinion.
- **Eye lands on:** **[NEW]** the recording indicator. It is a
  consent artefact before it is a control.
- **The one thing that must be true:** **[SPEC]** the recording
  indicator cannot be hidden by scrolling. Consent is ongoing, not a
  single click.
- **Every drafted field is loud.** **[SPEC]** Prompt 51 section 6.4
  specifies the treatment and makes it a regulatory control.
  **[CHANGE]**: the build package specifies drafted text at "slightly
  reduced text contrast". Do not reduce the contrast of drafted
  text. The border, tint and persistent label already carry the
  signal, and reducing contrast on the field that most needs reading
  is the wrong instrument.
- **Loading:** **[SPEC]** per field shimmer during drafting. **[NEW]**
  This is one of the few places in the product where a progress
  indicator is honest, because the wait is real and the user cannot
  proceed.
- **Error:** **[SPEC]** "A model failure must never block the visit."
  Transcription failure keeps the audio. Drafting failure leaves the
  field empty and editable.
- **Forbidden pairs.** **[SPEC]** 380 combinations, checked at the
  moment of entry. The rejection message attributes the rule to the
  board rather than to Continuum, which is correct. **[SPEC, Prompt
  50 section 4]** Selection time filtering removes the illegal option
  before it can be chosen, with a visible count line. Where that is
  built, the rejection message becomes unreachable, and that is the
  goal.

---

## SCR-MEAS-01, The measurement

**The core screen of the product.**

- **Feels like: the only screen you meant to be on.** **[SPEC]**
  Ninety seconds, one column. This and the follow up control are the
  two screens where invention is permitted, per Prompt 51 section
  2.1.
- **Eye lands on:** **[NEW]** the first focused axis, expanded and
  ready. Not the summary rail, not the zone headings.
- **The one thing that must be true:** **[SPEC]** Zone 2 defaults to
  unanswered, never to Able. Restated here because it is the rule
  most likely to be quietly relaxed by someone trying to save a
  click.
- **Loading:** **[SPEC]** and worth quoting, because it should govern
  every screen in the product: "Carry forward values load before the
  screen is interactive so the practitioner never sees values appear
  under their cursor."
- **The summary rail is the feedback loop.** **[NEW]** It is the only
  element that should move as the practitioner works. Nothing else
  animates.
- **Error:** **[SPEC]** "A measurement must never be lost to a
  network failure." Local retain, automatic retry, a visible unsaved
  indicator in the one permanent position of Prompt 51 section 8.2.
  Never a dialog.
- **The bulk Able confirmation is not friction and must not be
  removed.** **[SPEC]** It names the count and the axes and records
  `This is recorded as your clinical judgement.` **[NEW]** The dialog
  is the product refusing to make a clinical statement on the
  practitioner's behalf. It is the most defensible interruption in
  the product.
- **The band, shown at entry.** **[SPEC]** Prompt 38 section 3.3
  shows the measured value and the derived band together at review.
  **[CHANGE]**, extending it: show it beside the field at entry too,
  in the Prompt 38 wording. The practitioner enters 8 kg; LIMITED,
  which is 5 kg, is what is submitted. Learning that at the signature
  gate is a surprise. Learning it at the point of measurement is a
  clinical decision.

Prompt 38 measured-value wording, recorded in
`docs/prompts/52/VOICE.md`: `Limited to, LIMITED (5 kg / 11 lb)` with
the note `you measured 8 kg, rounded down for safety`.

---

## SCR-OIS-01, OIS coordination

- **Feels like: a form somebody else should have filled in.**
  **[SPEC]** Twenty two fields, C050S only. The practitioner's honest
  reaction is that this is administration, and the screen should
  agree and get out of the way.
- **Eye lands on:** the suggestion card, when there is one.
- **The one thing that must be true:** **[SPEC]** the suggestion is
  never pre selected, and where the employer has no job profile the
  proposal is suppressed entirely. Never guess duties.
- **Empty:** **[SPEC]** no employer profile shows an explanatory
  line, not an error. **[NEW]** The line says what would make it
  appear, per section 2.2 rule 3.
- **Error:** **[SPEC]** duty match failure suppresses silently and
  logs: "a failed convenience must not block a visit."
- **Friction removed:** **[NEW]** `Pull availability from employer
  profile` should not be a button. If the profile exists, the
  suggestion is computed and rendered before the practitioner
  arrives. A button whose only job is to fetch something the system
  already knows it needs is a click that can disappear.

---

## SCR-TREAT-01, Treatment and referrals

- **Feels like: short, unless it is not.** **[SPEC]** For a C151 with
  opioids it is twenty three additional fields, and the screen must
  be honest about which of the two is happening.
- **Eye lands on:** the opioid question [D1], because the answer
  determines the size of the screen.
- **The one thing that must be true:** **[SPEC]** the twenty three
  field module renders only on a C151 with opioids prescribed, and is
  explicitly not asked on a C151S.
- **The carry forward control is a clinical statement.** **[SPEC]**
  "This is not the same as defaulting. The practitioner is affirming
  that nothing changed, which is a clinical statement they are
  qualified to make, and it is recorded as such." **[NEW]** The
  control's copy must carry that meaning. `No change since last
  visit` is right. `Skip` is wrong.
- **Sixteen flags, one fieldset, one legend.** **[SPEC]** Specified
  for accessibility, and it is also the correct visual grouping:
  sixteen orphan checkboxes read as sixteen decisions, one fieldset
  reads as one review.
- **The referral dropdown.** **[SPEC]** The board's table holds forty
  rows and only ten distinct treatment types, repeated once per
  report type. Filtering by report type is the fix for the fourfold
  duplication, not the cause of it. Errata D20 adds a second
  requirement, that the dropdown filter by report type and selected
  category, which addresses legality rather than duplication. Build
  both filters.

---

## SCR-FUP-01, Follow up entry

**The wedge.**

- **Feels like: being handed a case you already know.** **[SPEC]**
  "If this screen is mediocre the product fails commercially,
  regardless of how good the rest is."
- **Eye lands on:** the trajectory control. Everything above it is
  context for one decision.
- **The one thing that must be true:** **[SPEC]** the trajectory
  control is interactive immediately, before the chart loads.
- **The correction that must reach the interface.** **[SPEC]** Errata
  D1 refutes the claim that UNCHANGED "collapses 66 fields, straight
  to signature" and states the minimum path is four answers, not two.
  D1 records the correction as applied inline at SCR-FUP-01,
  BR-WF-005, CT-025 and journey 6.3. **[CHANGE]**: the refuted copy
  still stands in wireframe 5.8, in the clearing warning modal, and
  at journey 6.3 step 9, "Two fields touched." Fix those three. A
  screen that promises two interactions and delivers four will be
  counted by the practitioner.
- **What is true, and is enough:** **[SPEC]** roughly 78 of 136
  elements arrive already filled, each labelled with when it was
  measured. That is the wedge. It does not need exaggerating.
- **Empty:** **[SPEC]** and the reasoning should be copied across the
  product: a first follow up with no check in data shows `No check
  ins recorded` rather than hiding the section, "so the practitioner
  knows the difference between no data and no problem."
- **Error:** **[SPEC]** "Never present an empty follow up as though
  it were a first report."
- **The clearing warning is mandatory** and must not be softened. It
  is the one modal on this screen and it exists because hidden field
  data is cleared and not submitted.
- **Stale values past ninety days require explicit confirmation.**
  **[SPEC]** **[NEW]** Present them as one grouped confirmation
  naming the count and the oldest date, not as a sequence of
  dialogs. A sequence teaches a practitioner to click through
  warnings.

---

## SCR-INV-01, Invoice

**The practitioner must never see this screen.**

- **Feels like: someone else's job.** **[SPEC]** Acceptance
  criterion: "The screen is not rendered in the practitioner
  navigation by default."
- **The one thing that must be true, and it is currently broken.**
  **[SPEC]** Errata D4 records a signature deadlock: skill code [G1]
  is always required and blocks signature, but the practitioner has
  no access to the invoice section and no route to it. The stated
  fix has two halves and both are required: derive [G1] and [G5]
  from the practitioner and clinic profile at report creation with
  `system` provenance, and add section scoped write authorisation to
  `PUT /reports/{id}/fields`. **[NEW]** Note that Prompt 38 section 5
  permits `system` provenance on non clinical fields only; skill
  code and facility type are administrative, so the derivation is
  permitted, and this should be stated in the implementation note so
  nobody later reads it as a precedent for clinical fields.
- **The fee tier warning.** **[SPEC, Prompt 50 section 7.5]**
  Suppress the dollar framing entirely for an OIS clinic, which is
  contractually same day.

---

## SCR-REV-01, Review and sign

**The regulatory gate.**

- **Feels like: a document, not an application.** **[SPEC]** The
  complete report in the board's own field structure and order.
- **Eye lands on:** **[NEW]** the blocking banner if there is one,
  otherwise the first section heading. Never the signature control,
  which is at the bottom, at the end of the reading.
- **The one thing that must be true:** **[SPEC]** this screen is
  inert. Nothing generates here. A generation on this screen means
  the thing being signed changed while it was being reviewed. The
  verification of that is Prompt 38 acceptance criterion 10 and is
  not restated as a criterion here.
- **The blocking banner is the whole experience of this screen.**
  **[SPEC]** It counts untouched drafts, missing required fields,
  failed validations and unconfirmed stale values, each count linking
  to the first offending field, in an `aria-live` assertive region.
- **Loading:** **[SPEC]** the full report renders server side.
  **[NEW]** No skeleton, no progressive reveal, no section by section
  fade. A document that assembles itself in front of a person about
  to sign it undermines the one thing this screen sells.
- **Success:** **[SPEC]** routes to SCR-OUT-01. No celebration, per
  Prompt 51 section 7.
- **Error:** **[SPEC]** a validation failure never loses data and the
  screen scrolls to the first error. **[NEW]** Scroll, do not jump.
  This is one of the few places where motion earns its place, because
  it preserves the reader's sense of position in a long document.
- **`Sign and submit` carries destructive styling and a deliberate
  confirm step.** **[SPEC]** Correct, and must not be optimised away.
  A signature is an attestation about one worker; it cannot be
  delegated, batched or automated.
- **`Skip this field with a reason` is the humane control on this
  screen.** **[SPEC]** Four options and a free text; where the board
  marks the field required, warn and offer `Sign and hold`. **[NEW]**
  The product never forces a practitioner to invent a clinical value
  to get past a gate.

---

## SCR-OUT-01, Submission and outputs

- **Feels like: already handled.** The practitioner should be gone by
  the time this screen finishes.
- **Eye lands on:** the signed confirmation line: form, worker
  initials, timestamp, tier.
- **The one thing that must be true:** **[SPEC, Prompt 50 section
  6.1]** the sign action returns control immediately and no spinner
  waits on the fan out.
- **The count is eight, not seven.** **[SPEC]** Errata D19 resolves
  the prose against the wireframe: say eight.
- **Partial failure is the normal case.** **[SPEC]** "Never present a
  partial success as a success."
- **A failed output is never the practitioner's problem.** **[SPEC]**
  It routes to the coordinator with a named owner.
- **This is the correct place for operational transparency**, per
  Prompt 51 section 12: the user is waiting on a machine on behalf of
  other people, and showing the work here raises confidence rather
  than manufacturing a wait.

---

## SCR-REJ-01, Rejections and corrections

**Where clinic trust is won or lost.**

- **Feels like: a to do list, not an inbox.**
- **Eye lands on:** **[NEW]** the plain language explanation, not the
  board's raw error text. The raw text is evidence and belongs below.
- **The one thing that must be true:** **[SPEC]** `OPEN AT THIS
  FIELD` puts the cursor in the wrong value in one action. **[NEW]**
  This single control is the difference between a rejection that
  costs ninety seconds and one that costs an afternoon.
- **An unmapped error is never swallowed and never guessed at.**
  **[SPEC]** The existing string breaches section 2.2 rule 1 and is
  listed in section 2.5 for a copy decision. Recommended replacement
  in `docs/prompts/52/VOICE.md`: `Not mapped to a field
  automatically. Logged for review.`
- **This screen's specification already matches the error contract of
  Prompt 51 section 8.3** more closely than any other in the build
  package: field, plain reason, one action, named owner. **[NEW]**
  Use it as the pattern for every other error surface. Nothing here
  is a claim about built code; no screen in this document is built.
- **Escalation after three business days** **[SPEC]** appears on the
  row as a state, not as an email, per Prompt 50 rule 7.

Open item 4: the rejection workflow is undecided. Three sections of
the build package disagree on whether a board rejection requires a
new practitioner signature. Until Craig decides, this screen cannot
state what happens next, and section 2.2 rule 3 requires it to.
