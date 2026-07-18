# CONTINUUM PROMPT 12d: Fold the Worker App Into the Main Site

**Deliverables:** worker-embed.html (the standalone compact worker app), worker-app-section.html (the drop-in landing section), and the fold-in block below for the Claude Code session holding the site repo deployed at https://continuum-o51l.vercel.app/.
**Integration pattern:** iframe embed. The live site interpolates with framework templates, so injecting a script-driven section directly is fragile; the embed page is framework-proof, adds zero dependencies, and doubles as a directly linkable demo.
**Date:** July 17, 2026

## 1. The embed (worker-embed.html)

A self-contained compact worker app in one file, phone-width, no dependencies, no build step: the plain-language consent gate, Today with the recovery ring (animated stroke) and the twice-daily slider check-in, the saved state with Next day, light duties with tap-to-complete, the escalation banner breathing gold when pain reaches 8, drifting ambient orbs, a reset control, and privacy and terms links in its own footer. Copy invites the visitor to slide pain to 8. Marked noindex; nothing entered is sent or stored, and the page says so. Logic verified headlessly: consent, check-in, day advance, escalation at pain 8, duty toggle, and reset all pass.

## 2. The section (worker-app-section.html)

A drop-in block, id try-app: left column carries the kicker (Try it yourself), the headline (This is the whole ask of an injured worker), copy framing the thirty-second signal, the synthetic-data disclosure, and two buttons (Open the full demo to /hub, Start a Pilot to #cta); right column is the phone bezel framing the iframe, with a full-screen link beneath. Responsive: single column below 900px. All styles inline and scoped to #try-app; all interactivity lives inside the iframe.

## 3. Fold-in block (paste into the Claude Code session on the site repo)

```
Fold the worker app into the main site (production: https://continuum-o51l.vercel.app/).

1. Commit worker-embed.html at the site root so it serves at /worker-embed.html. It is standalone; do not restyle it or attach the site bundle to it. Keep its noindex meta; add /worker-embed.html to robots.txt disallow alongside the other gated routes.
2. Insert the contents of worker-app-section.html as a new section with id try-app, placed after the "Between visits" check-in narrative section and before the Privacy section.
3. Add the nav link "Try the App" pointing to #try-app, between "How It Works" and "For Employers". Add the same link to the footer Product column.
4. If the page is a framework single-file app, insert the section markup as a raw static block (v-pre or the framework's escape hatch) so template interpolation never parses it; the section contains no script, so this is safe either way.
5. Replace the static hero phone mockup ONLY if directed later; this prompt adds the section and does not touch the hero.
6. Verify after deploy: /worker-embed.html returns 200 and runs standalone; the section renders at #try-app on desktop 1440 and mobile 390; the iframe demo completes the full loop; the two buttons route to /hub and #cta; Lighthouse confirms the iframe lazy-loads.
```

## 4. Law held

Client hexes, Space Grotesk and Inter, grade-7 worker copy, gold never red for the worker-facing escalation, synthetic cast only, nothing sent or stored, no emojis, no em or en dashes anywhere, gating posture preserved (embed noindexed while the marketing section itself remains indexable).

---

## Implementation record (this repo)

- deploy/worker-embed.html: the standalone embed, noindex meta, no storage (pure in-memory state, reset returns to seed), privacy and terms links, iframe-friendly and directly linkable. Serves at /worker-embed.html on this repo's deploy origin; also added to deploy/robots.txt disallow.
- worker-app-section.html: the drop-in section fragment with styles scoped to #try-app and the iframe (loading lazy) at /worker-embed.html. No script.
- The section is NOT injected into this repo's deploy/index.html; the fold-in (section 3) targets the separate site repo at continuum-o51l whose structure (Between visits, Privacy sections) differs. The two files are the portable deliverables for that session.
- Verified: dash audit clean; embed inline JS syntax clean; headless logic suite green across consent, check-in window, escalation at pain 8, day advance, duty toggle, and reset. No em-dashes or en-dashes.
