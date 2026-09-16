# Prompt 54 Section 16: acceptance map

Tip of this draft after the review and build. Tokens and gates only.
Not shipped. Not deployed. Hub auth remains unverified by Craig.
Athena does not ship. No em dashes or en dashes anywhere.

This is the Prompt 54 Design System / Surface Standard acceptance
map. It is not Core Platform Foundations. The earlier map at
`docs/prompts/51-design-system/SECTION_16.md` remains the #152/#153
landing record. Current-tip inspection is
[SECTION_1.md](SECTION_1.md).

A criterion is passed only when a test or named file proves it.
Failed means the written rule is not fully true in this repo. Not
attempted means this draft did not try that proof, usually because
of a STOP (including Product Behaviour exact text) or because it
needs a rendered pipeline this mission must not add.

Open items in section 16 of the brief stay open. They are listed at
the end. They are not resolved here.

`book.html` sets `data-surface="hub"` (request-access, hub-adjacent).

Criteria that need Product Behaviour exact text (cited 0.2, 4.2,
6.1, 6.2, 6.5, 7.2, 7.4, 9, 9.2, 12, 14) stay **STOP / not
attempted** unless Prompt 54 already restates the rule and a suite
proves that restatement.

---

## Acceptance criteria 1 to 24

1. Zero hard-coded colour outside `continuum_tokens.css`, and no
   theme block assigns raw hex to a semantic token: **failed** for
   the leftover colour list (Section 1 check 4, not migrated).
   **passed** for the theme and print hex-on-semantic gate
   (`deploy/a11y-tokens.test.mjs`). Print assigns from the palette
   layer (`var(--ink-900)` and the rest) in
   `deploy/continuum_tokens.css`. Already true on tip `3c256de`
   (#153). Not rewritten here.

2. Token contrast test in CI, covers section 11.2 backgrounds,
   fails a 4.0:1 text token: **passed**. Evidence:
   `deploy/tokens-contrast.test.mjs` (planted 4.0:1 and brand-green
   negatives; dark `--state-*-text` and print paper contrast).

3. Greyscale test in CI, fails a colour-only state: **passed** as
   the existing Node silhouette proxy
   (`deploy/status-greyscale.test.mjs`). A planted colour-only
   component fail was not added. The 1366x768 pixel screenshot
   remains the manual check.

4. All five states render with named icon, text, and colour, and
   are distinguishable in a greyscale screenshot at 1366x768: **not
   attempted** for the rendered screenshot. Module contract
   **passed** in `deploy/status-greyscale.test.mjs` and
   `deploy/status-icons.mjs`. Icons are not mounted on a product
   page. Do not mount them here.

5. `--draft-700` resolves in exactly two components (draft field
   treatment and draft status icon): **passed** for the reservation
   gate. Evidence: `deploy/draft-700-reservation.test.mjs`. Palette
   and `--state-draft` alias in `deploy/continuum_tokens.css` and
   `deploy/continuum-vars.css`. Not used as a raw colour on product
   HTML or JS. Not mounted on a page.

6. Draft treatment renders the 4 px border, the tint, and a real
   DOM label; `Draft, not yet reviewed` in the accessibility tree
   with `aria-describedby`: token CSS **passed**
   (`deploy/a11y-tokens.test.mjs` gate 7;
   `deploy/prompt54-design-system.test.mjs` asserts
   `.provenance-label`, never `::before` / `content:`). Rendered
   accessibility-tree snapshot **not attempted** (not mounted; no
   headless workflow). Product Behaviour 6.x exact wording: **STOP
   / not attempted** beyond the Prompt 54 restatement that the
   label is real DOM text.

7. Worklist first contentful paint under 800 ms at 500 open cases:
   **not attempted**. No measurement exists (lab). No measurement
   exists (field). No fake 800 ms gate. Evidence:
   `deploy/lab-budget-reporter.test.mjs`.

8. Every lab budget in section 10 enforced in CI; every field
   metric reported with percentile and window, or unavailable:
   field half **passed** as a reporter (`no measurement exists` for
   FCP, INP, CLS in `deploy/lab-budget-reporter.test.mjs`). Lab
   half **not attempted** (no RUM, no Lighthouse, no Playwright;
   would need a new pipeline and likely `package.json`).

9. Cold load with cache disabled produces zero font-attributable
   layout shift; fallback fonts render digits at uniform advance
   width: **not attempted**. Inter woff2 is missing. No measurement
   exists.

10. No loading indicator for an operation under 1000 ms: **not
    attempted**. No indicator instrumentation. No new screen.
    Product Behaviour timing exact text: **STOP / not attempted**.

11. No model-endpoint request and no animation bound to the sign
    action: **not attempted**. This draft adds no sign-action work.
    Product Behaviour 7.2 / 7.4 exact text: **STOP / not
    attempted**.

12. Every screen operable with the pointer disconnected, case open
    to signature: **not attempted**. Manual walkthrough. No
    headless keyboard suite. Product Behaviour 9 / 9.2 exact text:
    **STOP / not attempted**.

13. Every screen complete at 1366x768, 200% zoom, and 320 CSS px
    reflow with no two-dimensional scrolling: **not attempted**.
    Needs a headless-browser workflow.

14. With `prefers-reduced-motion: reduce`, every `--motion-*` token
    is `0ms`, no animation runs, every state change completes:
    token half **passed** (`deploy/a11y-tokens.test.mjs` gate 6).
    Runtime "no animation runs" **not attempted** (needs a
    rendered check).

15. No interactive element below 24x24 px except a documented
    SC 2.5.8 exception; none below 44x44 px where
    `any-pointer: coarse` or on the worker surface: token half
    **passed** (`deploy/a11y-tokens.test.mjs` gate 4). Rendered
    hit-testing **not attempted**. holding.html 44px targets
    **passed** as asserted current values
    (`deploy/prompt54-design-system.test.mjs`). Do not change
    holding.html.

16. Banned-string linter over every user-facing string;
    board-sourced strings exempt by marker; human copy review
    recorded for every new string: linter **passed** on the
    existing top-level `deploy/*.html` walk
    (`deploy/banned-strings.test.mjs`, `data-board` exemption).
    Human copy review file **passed** as process
    (`docs/prompts/51-design-system/HUMAN_COPY_REVIEW.md`). This
    draft added no visitor copy, so no new-string review record.
    Nested worker companion HTML is outside the existing walk
    (51-design-system STOPS). Tone, emoji, and exclamation stay
    reported, not hard-fail. Product Behaviour 0.2 exact text:
    **STOP / not invented**.

17. Density defaults to Comfortable for a practitioner and Compact
    for a coordinator where Compact has shipped; persists per
    device; one visible control; never an onboarding question;
    coarse pointer hides the control and forces Comfortable:
    default attribute **passed** (`data-density="comfortable"` on
    product-shell `<html>`, `deploy/html-attrs.test.mjs`). Compact
    **not shipped** (section 16 open item 1; tokens only). Density
    control **not attempted** (would ship Compact). Coarse-pointer
    force **passed** as tokens (`deploy/continuum_tokens.css`).

18. Light theme active for a newly created account regardless of
    `prefers-color-scheme`; `color-scheme` is `light` at `:root`:
    **passed** for the live default. Evidence: `data-theme="light"`
    on product-shell `<html>` (`deploy/html-attrs.test.mjs`);
    `color-scheme: light` on `:root` in `deploy/continuum_tokens.css`
    and `deploy/continuum-vars.css`. No account-creation path was
    changed. Dark remains tokens only.

19. Print and PDF render light with the account set to dark, and
    every semantic token is reset in the print block: token
    contract **passed**. Evidence: print block in
    `deploy/continuum_tokens.css` remaps from `--ink-*` / `--white`
    / `--ok-*` and the rest; `deploy/a11y-tokens.test.mjs` asserts
    `var(--...)` on every listed semantic and forbids raw hex;
    `deploy/tokens-contrast.test.mjs` asserts print
    `--text-secondary` and `--state-caution` clear 4.5:1 on white.
    Rendered print output **not attempted**.

20. Every error carries the field, the plain reason, one action
    opening that field, and a named owner: **not attempted**. No
    error surface work. Product Behaviour 12 exact text: **STOP /
    not attempted**.

21. Per-session warning and error count instrumented per role and
    rendered on the Prompt 50 section 12 platform health dashboard:
    **not attempted**. Product Behaviour 14 / Prompt 50 section 12
    exact text: **STOP / not attempted**. No dashboard added.

22. Synthetic-data watermark clears 3:1 in both themes and on every
    output: **not attempted**. No watermark work.

23. Return-to-work announcement renders on all three surfaces on
    the same day, carries no animation and no score, and is not
    blocked by the celebration gate: **not attempted**. No screen.
    Product Behaviour exact text: **STOP / not attempted**.

24. No copy string contains a hard-coded weekday: **failed** for
    complete surface coverage. Detector **passed** on the existing
    top-level `deploy/*.html` walk (`deploy/banned-strings.test.mjs`,
    planted-string and `data-board` self-tests). Live weekday copy
    remains on `deploy/worker/get-help.html`,
    `deploy/worker/clinician-handoff.html`, and
    `deploy/worker/check-in.html` (51-design-system STOPS). Those
    pages are outside the existing walk. Visitor words were not
    rewritten.

---

## Open items from section 16 of the brief (stay open)

1. The 1366x768 floor, exam-room lighting, standing physician
   versus seated coordinator, and older-user belief are unverified.
   Compact and dark stay tokens only.
2. Prompt 38 open item 1: who completes the return-to-work
   section.
3. Retrofit versus replace a component library is a Craig
   decision. Nothing to replace today.
4. Whether the brand may appear on the working interface is a
   Craig decision. Green stays reserved.
5. Worker-surface reading level has not been tested with a real
   user.
6. Whether a worklist prefetch is an auditable access event.
7. Three cited figures could not be verified to primary source.

---

## What this draft proved

- Prompt 54 Section 1 was written on current tip `3c256de` before
  other writes, with evidence for checks 1 to 8.
- REGISTER records Craig confirmed the governing version and
  sequenced review and build.
- STOPS names Product Behaviour absence and the Prompt 53
  live-platform holds.
- `docs/prompts/51-design-system/` still exists and is not Core
  Platform Foundations.
- Dark and compact token blocks remain. No product html defaults
  to dark or compact.
- Brand green `#1E8A6E` is absent from working UI.
- Draft label CSS uses a real `.provenance-label` element.
- holding.html keeps the 44px targets (asserted, not restyled).
- `package.json` was not edited.
- No new product screen file was added.

Existing Node suites remain globbed by `.github/workflows/suites.yml`.
`package.json` was not edited.
