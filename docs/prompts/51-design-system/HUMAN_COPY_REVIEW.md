# Prompt 51 Design System, human copy review gate.

**Prompt 54 / Prompt 58 cross-link.** The design-system /
surface-standard prompt is now unified Prompt 58. Prompt 54
remains the earlier sequenced review-and-build record. This
folder is the earlier #152/#153 landing. It is not Core Platform Foundations.
Prompt 58 [REGISTER.md](../58/REGISTER.md) is the
governing register. Prompt 58
[SECTION_1.md](../58/SECTION_1.md) is the current inspection. The
Prompt 58 local/CI substrate adds no new visitor-facing string.
Do not invent visitor copy here.

This is process documentation for humans. It is not visitor-facing product
copy. It does not invent labels, empty states, errors, or announcements.
It names the review that ships with the existing banned-string linter.

This review is part of the Design System 51 gate (sections 0.2, 11.7, and
11.13). It is required before release. It is not a suggestion. A linter
catches literals. A linter cannot detect first-person voice or chirpiness
in strings it has not seen. That gap is why this review exists.

Calliope (24f) owns every word a visitor reads and holds this review.
Athena (12a) does not rewrite voice. Apollo (12b) does not substitute
imagery for a failed string. Heracles (24c) does not treat a green suite
as a copy pass. Hermes (12d) does not ship a string this review has not
cleared.

---

## Numbering

This is Prompt 51 Design System, the surface standard. Prompt 50a also
uses the number 51 for Core Platform Foundations. The two share a number
and must stay separate.

This file belongs to Design System 51 only. It does not own, describe, or
change Core Platform Foundations. Existing suite comments still say
Prompt 58 for the token and banned-string work (unified stream, Craig's
Prompt 51). That naming in `deploy/banned-strings.test.mjs` is the same
gate this review completes. Do not add a second linter or a second
review file for it.

---

## Pair with the existing linter. Do not add another.

The linter is `deploy/banned-strings.test.mjs`. It is already globbed by
`.github/workflows/suites.yml`. It already knows `data-board`.

Do not propose a second linter. Do not split tone into its own suite.
Do not auto-fix voice. Live copy is a content decision. Regulatory
literals are a hard fail. Tone literals are reported for this review.

What the linter already does:

- Scans product HTML in `deploy/`, not the marketing landing
  (`index.html`), not the legal pages (`privacy.html`, `terms.html`),
  not `404.html`.
- Reads visible text plus copy-bearing attributes: `placeholder`,
  `title`, `alt`, `aria-label`.
- Blanks any element that carries `data-board` before it scores the
  string.
- Hard-fails the regulatory list.
- Reports tone hits, emoji, and exclamation marks for section 11.7.
  Those reports do not yet fail the build.

What the linter does not do, and must not be asked to do:

- It does not read first-person voice in a new construction.
- It does not read chirp in a paraphrase.
- It does not read JS-built strings, worker-app copy, or hub-roles copy
  unless those strings are also present as scanned HTML.
- It does not decide whether news is celebration.
- It does not lift a ship STOP.

---

## Honest limit

The linter catches literals only.

A string can pass `deploy/banned-strings.test.mjs` and still fail this
review. New cheer, a new first-person helper voice, a cheerful
sentence, or an emoji the regex does not list are all in scope here.
"Not on the list" is not a pass.

---

## Regulatory banned list (hard fail)

These strings are banned on product surfaces. A hit is a hard fail.
False positives are near zero. They must never appear in a label,
tooltip, empty state, or error.

- `predicted`
- `suggested diagnosis`
- `recommended restriction`
- `smart`
- `automatic assessment`
- `AI decided`

The linter matches these case-insensitively (`ai decided` in
`deploy/banned-strings.test.mjs`). The words are the ban, not the
capitalization.

If the linter reports one of these, stop. Do not ship. Do not soften
the string in place and call it reviewed. Replace the claim with a
lawful sentence in a later copy pass, then re-run the linter and this
review. This file does not draft that replacement.

---

## Tone banned list (linter reports, human review catches voice)

The linter reports these literals. This review catches the same voice
when the words are new.

Banned literals:

- `Oops`
- `Whoops`
- `Great job`
- `Nice work`
- `Awesome`
- `You're all set!`
- `Hang tight`
- `Just a sec`

Also banned, whether or not the linter has the exact characters:

- Any emoji.
- Any first-person software voice. The listed examples are
  `I've saved that` and `Let me check`. The ban is the voice, not
  those two sentences. `I'll get that`, `We're on it`, and `I found
  three items` fail the same way.

Product copy does not joke about a failed save. It does not congratulate
the reader for doing the work the product asked for. It does not speak
as a person.

---

## Exclamation marks

Exclamation marks are banned in product copy.

The only exception is a board-sourced string reproduced verbatim and
marked as board-sourced (see Board marker). A mark that is not on a
board-sourced, marked string is a fail.

The linter reports exclamation marks in visible product text. This
review still reads attributes, JS-built strings, and any surface the
linter does not scan.

---

## Board marker

`data-board` already exists in `deploy/banned-strings.test.mjs`. Do not
invent a second marker for HTML.

If a string is reproduced verbatim from a board document, it must carry
that marker:

- HTML: `data-board` on the element that holds the verbatim string.
- Keyed copy: a `board:` key prefix on that string.

A board-sourced string may contain a word or an exclamation mark that
would otherwise fail, because the board wrote it and the marker says so.
Paraphrase is not board-sourced. A paraphrase drops the marker and
returns to the full ban lists.

Section 1 recorded that `data-board` exists in the linter and not on
live copy. That is a fact about the tip, not a reason to skip the
marker on the next verbatim board string.

---

## Review is required for every new user-facing string

Before release, every new user-facing string needs this review.
Blocking for ship, not a suggestion.

User-facing includes, at least:

- Visible labels, headings, helper text, empty states, errors, toasts,
  and confirmations.
- Button and link text.
- `aria-label`, `alt`, `title`, and `placeholder`.
- Strings built in JS and inserted into the page.
- Worker-app, hub, and portal copy a person can read while they work.

A string is new when it was not on the last released surface, or when
its words changed. Reused canon phrases still need a pass if they move
to a new audience or a new surface.

This review does not replace Gary's human gates. Consent language,
legal pages, and pricing stop for Gary. If a new string is consent,
legal, or pricing, record that and stop. Do not clear it here.

---

## What the reviewer checks

Read the string in place, on the surface a person will see, in the
audience register that surface uses.

1. **Regulatory.** None of the hard-fail terms. None of their claims
   in other words (`the system decided`, `smart result`, `suggested
   diagnosis` rewritten as a hint). The platform informs. People
   decide.
2. **Tone literals.** None of the tone list. No emoji. No exclamation
   mark unless the string is board-sourced and marked.
3. **Voice.** No first-person software voice. No chirp. No guilt.
   No celebration of the reader's compliance.
4. **Register.** Worker copy is warm. Employer copy is functional.
   Clinician copy is precise, with no jargon theater. Executive copy
   is outcomes with no promises.
5. **Vocabulary law.** Employer-facing status uses the standing
   phrases: duties on track, duty plan under review, awaiting
   clinical review. Routing uses "Per program rules." Clinical
   vocabulary stays off employer and admin surfaces.
6. **Uncertainty.** No promised outcome. Predictive material, if
   present at all, is labeled illustrative in the copy itself.
7. **Canon.** Names, statuses, and numbers match the canon ledger.
   Worker 15 is at day 9, pain 4. Worker 08 is off work as of day 18.
   Per-tenant numbers sum.
8. **Board.** Verbatim board text carries `data-board` or a `board:`
   key prefix. Anything else is product copy and follows the bans.
9. **Next step.** The reader can see what to do next. Errors say what
   happened, then what to do, in that order, with no blame.

Do not invent a replacement string inside this checklist. Fail the
string, name the rule, and return it to the copy pass.

---

## Return-to-work announcement (section 2.7a)

The return-to-work announcement is required news, not a celebration.

It must not be blocked by the celebration or tone gate. A lawful
announcement that a return to work is happening is operational news.
Do not hold it because the news is good. Do not treat "the reader
might feel glad" as a tone fail.

The announcement still may not use the tone banned list, emoji,
first-person software voice, or an unmarked exclamation mark. News
stays news. It does not become `Great job` or `You're all set!`.

This file does not draft the announcement.

---

## Standing ship STOP this review does not lift

Section 1 Check 1 stands: hub authentication from Prompt 33 is not
verified by Craig. **STOP for ship.**

This review gate does not lift that STOP. A clean copy review is not
a Craig verification and is not a ship verdict. Hermes does not treat
a pass here as clearance to push.

---

## How to run the pair

1. Run `deploy/banned-strings.test.mjs` (or the full `deploy/*.test.mjs`
   glob via `suites.yml`).
2. Regulatory hits: hard fail. Do not ship. Do not treat a
   regulatory hit as a tone question.
3. Tone, emoji, and exclamation reports: open this review on each hit
   and on every new string the linter did not see.
4. Record the review (template below). Failures return to the copy
   pass. Passes clear only the copy gate.
5. Re-run the linter after any word change. Then review the new words.

Do not add a second suite for step 3.

---

## Review record

Copy this block for each new user-facing string, or for each linter
tone report.

```
Location (file and surface):
Audience (worker / employer / clinician / executive / other):
Board-sourced (no / yes, data-board / yes, board: prefix):
Regulatory (pass / hard fail):
Tone literals and emoji (pass / fail):
Voice (pass / fail): name any first-person or chirp:
Exclamation (none / board-marked / fail):
Register and vocabulary law (pass / fail):
Canon numbers (pass / not applicable / fail):
Section 2.7a news (not applicable / required news, not celebration):
Gary gate (no / consent / legal / pricing):
Decision (copy pass / copy fail / stop for Gary):
Notes (rule that failed, or "clears copy gate only"):
```

A copy pass clears this gate only. It does not clear Heracles, Argus,
canon, or the Prompt 33 hub-auth STOP.

---

## Out of scope for this file

- No second linter.
- No visitor-facing strings drafted here.
- No product HTML edited here.
- No edit to `docs/prompts/50/` or `docs/prompts/50a/`.
- No claim that Core Platform Foundations is this prompt.
- No ship.

No em dashes or en dashes in this file, in product copy, or in the
review record.
