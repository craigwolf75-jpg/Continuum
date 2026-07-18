# CONTINUUM PROMPT 11: Privacy Policy and Terms of Service, Drafted and Wired Into the Footers

**Deliverables:** the two document drafts below; privacy.html and terms.html as drop-in branded pages; the Prompt 08 working app updated with a persistent footer (landing and sign-in included); a Claude Code block for the demo repo and the mainline marketing site.
**Status of the texts:** DRAFTS. Prompt 09 makes counsel approval of these documents a release gate. They may be published on gated demo surfaces with the draft banner, and must not be presented to a real worker or tenant until counsel signs off.
**Date:** July 17, 2026

---

## PART A: PRIVACY POLICY (DRAFT FOR COUNSEL REVIEW)

**Continuum Privacy Policy**
Draft version 0.9, July 17, 2026. Not yet in force. Pending review by Canadian health-privacy counsel.

The full text is deployed as deploy/privacy.html (branded page with the DRAFT banner).

## PART B: TERMS OF SERVICE (DRAFT FOR COUNSEL REVIEW)

**Continuum Terms of Service**
Draft version 0.9, July 17, 2026. Not yet in force. Pending review by counsel.

The full text is deployed as deploy/terms.html (branded page with the DRAFT banner).

---

## PART C: IMPLEMENTATION (Claude Code block for the demo repo and mainline)

```
Wire the legal pages and footers. The two documents live as branded standalone pages and every entry surface links to them.

1. Files: add privacy.html and terms.html to deploy/ (the branded drafts supplied). Both carry the DRAFT banner until counsel sign-off; removing the banner is a one-line change gated on the Prompt 09 counsel release gate.
2. Landing page (/): add a footer at the bottom of the page: left side "Continuum" wordmark small; right side links "Privacy Policy" and "Terms of Service" plus the line "© 2026 [LEGAL ENTITY TO CONFIRM]. All rights reserved." Footer background matches the page, top border 1px var(--line), text 12.5px muted. No em or en dashes anywhere; use a middle dot or spacing between links.
3. Sign-in surfaces: the /hub login screen (demo repo) and every mainline sign-in screen (worker app OTP screen and dashboard login) add the same two links directly beneath the primary action, 12px, muted, center-aligned: "By continuing you agree to the Terms of Service and Privacy Policy", with both phrases linked. The worker app consent gate ALSO links both documents inside the consent copy.
4. Mainline marketing site: same footer on every page; the store submissions (Prompt 10.4) use these URLs as the privacy policy and support links.
5. Accessibility: links reachable by keyboard, visible focus, contrast at least 4.5 to 1 against the navy.
6. Verify: every entry surface (landing, hub login, worker OTP, dashboard login) renders both links; both pages return 200 on production; the demo gating posture (noindex on /hub and app routes) leaves privacy.html and terms.html INDEXABLE on the marketing origin since stores and users must reach them.
```

## PART D: What was changed in the working app this session

The Prompt 08 working app (continuum_workflow_app.html) now renders a persistent footer above the wiring rail on every section, including the hub sign-in (role picker): Privacy Policy and Terms of Service links opening the adjacent privacy.html and terms.html, the draft-status note, and the synthetic-data line. The three files travel together; drop all three into deploy/ and the links resolve.

---

## Implementation record (this repo)

- deploy/privacy.html and deploy/terms.html: added (commits 4f173a4, 50c34f2).
- deploy/index.html: footer Privacy Policy and Terms of Service links now point to /privacy and /terms (were in-page anchors). Indexability unchanged; robots.txt and vercel.json noindex only /app, /hub, /screens, /demo, so the legal pages stay indexable.
- deploy/hub/index.html: the "By continuing you agree to the Terms of Service and Privacy Policy" line added beneath the Sign in button, 12px muted center-aligned, both phrases linked.
- deploy/app/index.html: the consent gate copy now links the full Privacy Policy and Terms of Service.
- deploy/continuum_workflow_app.html: already carries the footer, the consent-copy links, and the role-picker consent line (Part D), no change needed.
- No em-dashes or en-dashes anywhere.
