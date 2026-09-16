# Prompt 53 paste-ready replies

## Status

These are the two paste-ready texts from the Prompt 53 brief.

G1 has not started: the G1 file is not in hand. The sentence in Gary's
draft that says "Starting G1 now" is held until Gary has
PROMPT_G1_DISCOVERY_AUDIT to paste. Do not treat this file as
permission to start G1.

Verification question in Gary's draft is now answered by Craig: WRONG
FILE / REDO REQUIRED. Prompt 47 redo is not started. Waiting on the
REV 2 attachment.

Prompt 54 is register-only and not released; this Prompt 53 PR does
not build it.

---

## Gary to Craig

Subject: Confirmed, attachment opens, audit starting

Craig,
Received and the attachment opens. Confirming the version list: keeping 44 RREV 2 and 45 REV 2, discarding earlier sends. One check on that: the Prompt 45 file I worked from this week, the clinic and enterprise document, please confirm it was the REV 2 from 12:32, and if not I will redo it from the right one.
One disclosure before the audit so your report reads clean: development work to date has been local and CI only. The physician stream engines are built and tested against a local database with production submission structurally disabled and no model connected. No hosted project has been created, nothing external has been sent, and nothing is seeded. The audit will show a development environment, not a live platform, and that is the true state.
Starting G1 now, read-only, fixing nothing, with the Section 5 check run first given its urgency flag. Report follows as G1_AUDIT_REPORT.md.
Gary

---

## Claude Code hold order

Programme order from Craig (registered as Prompt 53), effective now:
HOLD all live-platform actions: do not create or modify any hosted project, do not send anything external, do not enable any provider, and do not seed anything beyond SYNTH-prefixed fixtures. The 50a Decision 1 go is suspended; the platform decision is Craig's, made after the G1 audit report.
Local and CI work already complete stays as is; freeze it. Do not start new Section 3 and onward live-path work under Prompt 51.
The next task is PROMPT_G1_DISCOVERY_AUDIT, which Gary will paste when he has the file in hand. It is read-only: every service and host, where data physically lives, every table and its shape, how a change reaches production. Fix nothing you find; catalogue it. If you find any clinical content reachable from an employer-facing screen, table, API, or export, stop and report that finding immediately, before finishing the rest.
Old-stream prompts 44 to 46 are reading, not building. Build prompts halting at their own prerequisite checks is intended behaviour, not failure. More prompts exist that have not been sent; do not treat the current set as the complete programme.
