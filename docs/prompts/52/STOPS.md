# Prompt 52 stop notes

Real stops only. This prompt adds no module, no workflow, and no AI
component. Hermes ships only when Craig names ship.
No em dashes or en dashes anywhere.

---

## Check 1. Prompt 33 authentication fix is unverified

The brief requires a live re-test: sign in with an address that does not
exist and a code of `000000`, and request each portal route by URL with
no session. Report exactly what happens. Nothing in this prompt ships
before that report is Craig-verified.

What this inspection found is in `docs/prompts/52/SECTION_1.md` Check 1:

- No repository record that Craig verified Prompt 33.
- Hub auth is email and password, not a one-time code. Code `000000` is
  not a current hub field.
- Unit suites for hub sign-in and no-session portal blocking are green.
  They are not a live re-test.
- An unauthenticated probe of continuumrtw.com reached the site holding
  page on every portal path, and `/api/hub-signin` returned
  `SITE_ACCESS_REQUIRED`. The exact credential re-test did not run
  because the site gate answered first.

**STOP for ship.** Draft documentation, catalogue scaffolding, and
linter extension may land. Do not claim ship-ready. Do not invent a pass.

---

## Check 8. Coordinator daily dashboard has no screen ID

Prompt 45 section 9.2 names a daily dashboard for the clinic
administrator and coordinator. The thirty four screen inventory has no
ID for it. This repository has no Prompt 45 section 9.2 source and no
implementing screen.

The Developer Build Package gives the coordinator no dedicated screen.
Their home is SCR-WL-01. Prompt 45 section 9.2 names a separate surface
and lists five contents. Those accounts are incompatible.

**STOP.** This prompt does not create that screen and does not assign it
an ID. Open item 8 is Craig's. Items that depend on that decision
(priority list items 13-surface parts, 20, 26 dashboard parts, and 28)
wait.

Do not build a coordinator dashboard as a new screen in this pull
request.

---

## Prompt 44 Canada / no-train, and standing holds

Unchanged from prior prompts:

- No live Bedrock.
- No occupational seed.
- `0018` and `0019` unapplied. Schema files only. No live schema apply.
- `package.json` and email templates stay locked.
- No Azure invention.
- Prompt 51 Design System may still be landing on a separate PR. Do not
  overwrite `docs/prompts/51-design-system/SECTION_1.md`.

---

## Timing instrumentation of Prompt 50 section 12 is absent

The Prompt 52 brief depends on behaviour-prompt timing instrumentation
(case open to signature, warnings per session, notifications per role).
That document is not in this repository. This repo's Prompt 50 section 12
is platform observability, not clinical timing.

**STOP** inventing a live telemetry sink or a second metrics product.
Acceptance criteria that need that instrumentation stay not attempted.

---

## Do not invent Prompt 38 screens

Check 2 found zero screens built to the Prompt 38 specification.
Seventeen physician and administration screens remain not built. This
prompt is the feel specification for those screens as they are built.

**STOP** inventing full Prompt 38 screens, field lists, or a measurement
or follow-up rewrite in this pull request. Legacy Prompt 41
`SCR-MEAS-01` and `SCR-FUP-01` stay as they are.

---

## July 30 to 31 QA report is not in the repository

The brief asks which empty states that report named so they are
protected rather than replaced. The report is not here. Existing empty
strings are listed in Section 1 Check 5. Do not replace them in this
build.
