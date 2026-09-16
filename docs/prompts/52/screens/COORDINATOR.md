# Prompt 52 Coordinator surface: feel specification

Specification for builders. Not a visitor-facing product screen.
Source: Prompt 52 section 3.3.

**This file does not create a screen and does not assign a screen ID
to the Prompt 45 section 9.2 coordinator daily dashboard.** STOP
before inventing an ID.

Reading convention:

- **[SPEC]** reports what an existing document already requires.
  Verify it, do not redecide it.
- **[NEW]** is authored by this prompt because no specification
  exists.
- **[CHANGE]** overrides an existing specification, and says what it
  overrides and why.

No em dashes or en dashes anywhere. Standing holds: no live Bedrock,
no occupational seed, no schema apply, `package.json` locked. See
also `docs/prompts/52/STOPS.md` Check 8.

---

## Two incompatible accounts. Read this first.

There are two incompatible accounts of the coordinator's surface, and
this prompt does not resolve them.

1. **The Developer Build Package** gives the coordinator no dedicated
   screen. Their home is SCR-WL-01, shared with every internal role,
   and the fee tier rollup lives there.
2. **Prompt 45 section 9.2** names a separate daily dashboard for the
   clinic administrator and coordinator, calls it "the operational
   screen and it is the most used surface in the entire product for
   the coordinator role", and lists five contents: Today, submission
   and batch status, rejections needing action, credential expiries,
   configuration drift. It has no screen ID, no fields, no actions
   and no task anywhere.

**This prompt does not create that screen and does not assign it an
ID.** Whether the coordinator's daily surface is SCR-WL-01 with
additional sections, or a distinct screen, is an architecture
decision for Craig. See open item 8.

**STOP.** Do not invent a screen ID here. Document the feel of
whichever surface wins, then stop creating an ID.

---

## Feel of whichever surface wins

These lines govern the winning surface. They do not create a new
screen.

- **Feels like: knowing where you stand before you sit down.**
  **[NEW]** The target is that the coordinator stops holding four
  variables in their head.
- **Eye lands on:** the Today rollup, in words, not a chart. **[SPEC,
  Prompt 50 section 7.3, timezone corrected per section 7.4.]**
- **The governing interaction rule.** **[SPEC, Prompt 45 section
  9.1]** "Every dashboard answers a question a specific person has,
  and every number links to the action that changes it." And: "A
  dashboard that reports without prompting an action is a report, and
  reports get ignored." **[NEW]** Apply this to metric values, not to
  every numeral. A time, a page count or a row index is not a
  metric.
- **Section order.** **[SPEC]** Prompt 45 lists Today, submission and
  batch status, rejections needing action, credential expiries,
  configuration drift. Keep that order. An earlier draft of this
  prompt reordered it by cost, which was authored preference
  presented as specification.
- **Empty:** **[NEW]** each section states what would put something
  in it. `No rejections. Anything the board returns lands here within
  an hour of the batch.`
- **Density:** **[SPEC, Prompt 51 section 5.2]** Compact is the
  coordinator default where Compact ships, and Prompt 51 recommends
  shipping Comfortable only in MVP. Compact is also unavailable on a
  touch capable viewport, which matters for a coordinator on a
  tablet.
- **Two actions with no home.** **[SPEC, Prompt 45 section 4.2]**
  `retry submissions` and `mark pack filed` are clinic administrator
  permissions. **[NEW]** Both belong on the row that raised the need,
  not in a settings screen.

---

## SCR-BAT-01, Submission batch monitor

**No specification. [NEW] unless marked.**

- **Feels like: a train timetable.** **[NEW]** Batches at fixed
  times, each with a state and a count.
- **Eye lands on:** **[NEW]** the next batch time and how many
  reports are in it.
- **The one thing that must be true:** **[SPEC]** three attempts with
  exponential backoff. **[NEW]** A retrying batch shows the attempt
  count against the maximum. A retry with no attempt count is
  indistinguishable from a hang.
- **Failure surfaces to a named human, never to a log.** **[SPEC]** A
  file that fails validation must never enter the batch.

---

## SCR-DIR-01 to 03, Employer directory, employer detail, modified duty library

**No specification. [NEW] unless marked.**

- **Feel like: reference material you maintain once.** **[NEW]**
  Nobody's daily work. Optimise for finding, not browsing.
- **Eye lands on:** **[NEW]** search.
- **The one thing that must be true:** **[NEW]** an employer with no
  job profile is visibly marked as such in the directory list,
  because that absence silently suppresses every duty match
  downstream **[SPEC, BR-WF-009]** and is invisible today until an
  employer receives nothing. If a count of affected cases is
  computable from data the screen already holds, show it. If it
  requires a new aggregation, mark the absence without a count and
  report that as a separate item.
- **Empty:** **[SPEC, BR-WF-010]** a duty with no demand rating on a
  restricted axis is `conditional`, never `safe`. **[NEW]** The duty
  library states how many duties are unrated, on the same condition
  about computability as above. That number is the employer
  engagement loop.

---

## SCR-BIL-01 and 02, Billing and remittance, invoice correction

**No specification.**

- **Feel like: bookkeeping.** Quiet, tabular, reconciled.
- **The one thing that must be true:** **[SPEC]** the board's $250
  administrative fee on payment reversal, code RAF01, is tracked as a
  clinic level metric. **[SPEC, Prompt 50 section 8]** Show the count
  of prevented errors and no dollar figure until a clinic's own
  remittance baseline exists.

The $250 RAF01 figure is [SPEC] from the board schedule. This file
does not set pricing.

---

## SCR-AUD-01, Audit log viewer

**No specification. [NEW] unless marked.**

- **Feels like: a filing cabinet that answers immediately.** **[NEW]**
  This is the screen Project Obsession identifies as the thing nobody
  buys the product for and everybody stays for.
- **The one thing that must be true:** **[SPEC]** the separation of
  duty rule, that a clinic administrator cannot read entries
  recording their own privilege changes without an auditor present.
  **[NEW]** When a row is withheld for that reason, say so in place
  of the row. A silently filtered audit log is worse than no audit
  log.

---

## SCR-ANL-01, Clinic operational metrics

**No specification.**

- **Users:** **[SPEC]** clinic admin and coordinator. **This is not
  the clinic owner dashboard**, which is a separate surface in Prompt
  45 section 9.2 scoped to five minutes monthly with one recommended
  action, and which has no screen ID in the inventory. Same open item
  8. This prompt does not create that owner dashboard and does not
  assign it an ID.
- **Feels like: a number you can act on, or no number.**
- **The one thing that must be true:** **[SPEC, Prompt 45 section
  5.5, Prompt 50 section 14, Prompt 51 section 14]** never a
  leaderboard of practitioners, on any metric. A location league is
  permitted; a practitioner league is not. The AI draft edit rate and
  the documentation time median will both tempt someone.
- **[SPEC, BR-RPT-005]** Every modelled dollar is labelled an
  estimate with its formula shown. Trend is direction with a
  confidence band, labelled trend and never prediction.

---

## SCR-NOT-01, Notification centre

**No specification. [NEW] unless marked.**

- **Feels like: nothing, most of the time.** **[NEW]** The bell
  should be empty on a normal day. If it is not, the product is
  emailing itself.
- **The one thing that must be true:** **[SPEC]** every notification
  deep links to the exact screen and record, and every type is
  individually mutable except N14.
- **Count the notifications sent per role per week and treat a rise
  as a defect.** **[NEW]** Measured override rates for clinical
  alerts in comparable systems run from 52.6 percent in one large
  study to a pooled 90 percent in a 2024 meta analysis. Every
  notification Continuum sends is drawn from an account the adjacent
  EMR has already overdrawn.
