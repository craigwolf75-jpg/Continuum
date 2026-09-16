# Prompt 52 Priority: the Gary build list

Specification for builders. Source: Prompt 52, the Gary build list
after section 11. This file does not invent Prompt 38 screens and
does not create a coordinator dashboard.

**Two orderings, and they are not the same. Read this before using
the list.**

- **Priority (P0, P1, P2)** is *within* the prompt each item attaches
  to. It says what matters, not what happens first.
- **Roadmap position** is what happens first. The approved order is
  G1 to 47 to 48 to 36 to 37 to 41 to 42 to 38 to 39 to 40 to 43 to
  49. Prompts 50, 51 and 52 attach to that sequence rather than
  sitting in it. An item attached to Prompt 40 does not start before
  an item attached to Prompt 37, whatever its priority letter says.
- **Nothing starts before G1 reports and Craig decides the stack.**

Coordinator daily dashboards and clinic owner dashboards are **not
on this list**. Neither has a screen ID. Creating one is open item 8,
not a build decision. This prompt does not assign that ID.

No em dashes or en dashes anywhere. Standing holds: no live Bedrock,
no occupational seed, no schema apply, `package.json` locked.

---

## P0. Blocks something, or is a defect in a document Gary will build from.

| # | Item | Reason | Expected impact | Difficulty | Affects | Roadmap |
|---|---|---|---|---|---|---|
| 1 | Re-test the Prompt 33 authentication fix and report | Recorded as executed on the evidence of the prompt, never verified against code | Removes the largest unknown in the programme | Trivial | 33, G1 | Before G1 completes |
| 2 | Fix the errata D4 signature deadlock, both halves. Derive [G1] and [G5] at report creation with `system` provenance, and add section scoped write authorisation to `PUT /reports/{id}/fields` | As specified, every practitioner is blocked at signature by a field they cannot reach | Unblocks signature, which is the product | Medium | 38 | With 38 |
| 3 | Delete the refuted follow up copy from wireframe 5.8, the clearing warning modal and journey 6.3 step 9 | Errata D1 corrected the specification prose and left those three places uncorrected. Gary will build what the wireframe says | Prevents shipping a screen that promises two interactions and delivers four | Trivial | Developer Build Package | Before 38 |
| 4 | Build the string catalogue and move every user facing string into it | Sections 2 and 9 are unenforceable without it | Makes every subsequent copy decision testable | Medium | 38, 50, 51, 52 | With 38, extended per screen |
| 5 | Specify and build the four authentication screens | They gate every module, mandate multi factor, and have no P0 line and no backlog task. Depends on tenancy and audit from 47 and 48 | Removes the only category of screen that is unowned and unavoidable | Large | 33, 47, 48 | After 48 |
| 6 | Write the worker facing copy for SCR-WRK-01 and SCR-WRK-02, to draft | No worker facing string exists anywhere, and this is the surface where the evidence says design tracks outcomes. Completion requires user testing, which is Craig's to schedule, open item 6. Deliver the draft; do not wait on the test to ship the draft | Converts the worker app from a data collector into the intervention the evidence supports | Medium | 10, 40 | With 40 |
| 7 | The 1000 ms loading rule, product wide | Prompt 51 section 8.1. The worklist currently specifies a skeleton on a screen targeting 800 ms | Removes the most common false signal in the product | Small | 38, 51 | With 38 |
| 8 | Record an unanswered Consent B as `not_asked` | Errata D20 and Prompt 50 rule 6. The current conflation asserts a refusal the worker never made | Closes a recorded errata and a privacy record defect | Small | 38, 40 | With 38 |

---

## P1. High impact, low cost, and cheapest at build time.

| # | Item | Reason | Expected impact | Difficulty | Affects | Roadmap |
|---|---|---|---|---|---|---|
| 9 | Case start field classification and the touched input count | Prompt 50 section 3 applied to the real twenty six fields | The most quotable number the product will produce | Small | 50, 38 | With 38 |
| 10 | Render case start fields enabled with resolved values | A receptionist typing into a disabled field is the worst first second in the product | First impression on the highest frequency non clinical screen | Small | 38 | With 38 |
| 11 | Show the derived band at the point of measurement | Learning at the signature gate that 8 kg became 5 kg is a surprise. Learning it at entry is a clinical decision | Removes a likely cause of a regretted signature | Small | 36, 38 | With 38 |
| 12 | Filter the referral dropdown by report type and by category | Report type filtering removes the fourfold duplication; category filtering is the errata D20 legality fix | Removes visible incompetence on a clinical screen | Small | 37, 38 | With 37 |
| 13 | Persistent estimate qualifier on the countdown, replacing hover | Hover is unavailable to keyboard users and Prompt 51 Article 4 forbids hover only information | Closes an accessibility gap on the highest traffic column | Trivial | 38, 50, 51 | With 38 |
| 14 | In place session re-authentication returning to the exact field | Routing to a full sign in page mid encounter loses the encounter | Protects the measurement screen, which is where the value is | Medium | 33, 38 | With 38, after item 5 |
| 15 | The permanent employer disclosure line on every employer screen | Obsession improvement 19 requires it every time. The wall is invisible unless stated | Turns a compliance asset into a trust asset | Trivial | 40 | With 40 |
| 16 | Expired restriction sets render at the same weight as the work status line | A supervisor acting on a stale duty list believes it is current | Removes a safety failure mode | Trivial | 40 | With 40 |
| 17 | No employer view at all where the employer has no job profile | Prompt 40 section 5 and acceptance 3. Corrects the build package journey text | Closes a privacy contradiction between two governing documents | Small | 40 | With 40 |
| 18 | One record, one value, everywhere on the worker surface | A measured live defect: Pain 5 on one screen, Pain 9 on another, same record | Removes the defect most likely to make a worker distrust the app | Small | 10 | With 40 |
| 19 | A completed check in renders as complete | Measured live defect. "This is your least technical user hitting your worst interface defect" | Removes the worst interface defect on the least technical surface | Small | 10 | With 40 |
| 20 | Employer surface renders nothing on error | The one surface where blank is safer than partial | Removes a privacy failure mode | Trivial | 40 | With 40 |
| 21 | Suggestion precomputed on SCR-OIS-01, removing the fetch button | A button whose only job is to fetch something the system knows it needs | One click per C050S visit | Small | 38 | With 38 |
| 22 | Group the stale value confirmations into one dialog | A sequence of dialogs teaches a practitioner to click through warnings | Protects the warning that matters | Small | 38 | With 38 |
| 23 | MFA submits on the last digit | One of the most frequent daily interactions in the product | One click per challenge, every user | Trivial | 33 | With item 5 |
| 24 | The audit log states when a row is withheld for separation of duty | A silently filtered audit log is worse than no audit log | Protects the product's strongest retention argument | Small | Build Package SCR-AUD-01 | With item 25 |
| 25 | Apply the SCR-REJ-01 error pattern to every error surface | Field, plain reason, one action, named owner. Prompt 51 section 8.3 requires it everywhere and only one screen's specification carries it | Makes every error in the product actionable | Medium | 38, 39, 51 | With 39 |

---

## P2. Real, and correctly deferred.

| # | Item | Reason | Expected impact | Difficulty | Affects | Roadmap |
|---|---|---|---|---|---|---|
| 26 | Specify the remaining thirteen unspecified screens to the full template: DIR 1 to 3, BAT, BIL 1 and 2, AUD, NOT, ANL, EMP-01, EMP-02 field level, WRK-01 and WRK-02 field level | Section 3 gives each a feel and a governing rule; the field level work is owed. Seventeen unspecified minus the four in item 5 | Removes the last unowned screens | Large | Developer Build Package | After 40 |
| 27 | Expand the four administration screens to the full template, per errata D19 | The errata ordered it and it was never done | Closes a recorded errata | Medium | Developer Build Package | After 40 |
| 28 | Relocate `retry submissions` and `mark pack filed` onto the row that raised the need | Both are clinic administrator actions with no home today | Removes two trips to a settings screen | Small | 45, 38 | Depends on open item 8 |
| 29 | Instrument the four invisible software measures in section 6 | They are how anyone will know whether this prompt worked | Converts feel from opinion into a number | Medium | 50 | With 38 onward |
| 30 | The consent employer preview modal, rendering a realistic example | It decides whether workers grant Consent B, which decides whether the employer door exists | High, and currently unbuilt | Medium | 38, 40 | With 40 |
| 31 | The four minute test with a real physician | Prompt 45 claims physician training is four minutes and one screen. Nobody has tested that claim | Validates or kills the core usability assumption | Small | Market Entry Game Plan Phase 3 | Phase 3 |
| 32 | Compact density and the dark theme | Both recommended for deferral in Prompt 51, on assumptions the Phase 3 visits may overturn | None until the visits happen | Medium | 51 | After Phase 3 |

---

## Not on this list, deliberately

The coordinator daily dashboard and the clinic owner dashboard,
because neither has a screen ID and creating one is open item 8, not
a build decision. Item 28 and the dashboard parts of item 26 wait on
that answer.

This prompt does not create those screens and does not assign them
IDs.

**One thing absent from the whole list:** nothing here asks for a new
module, a new AI component or a new workflow. Thirty two items, and
every one makes something that already exists in a specification
better.

---

## Standing holds that apply before any item starts

- Nothing starts before G1 reports and Craig decides the stack.
- Prompt 33 authentication re-test (item 1) is UNVERIFIED. See
  `docs/prompts/52/SECTION_1.md` Check 1 and
  `docs/prompts/52/STOPS.md`.
- No live Bedrock.
- No occupational seed.
- No schema apply.
- `package.json` locked.
- Athena does not ship. Hermes ships only when Craig names ship.
