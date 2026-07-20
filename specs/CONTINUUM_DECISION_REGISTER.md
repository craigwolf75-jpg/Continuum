# Continuum Decision Register (Prompt 21)

Tracks the eight open decisions from Prompt 21 section 20, resolved one at a time per the brief's discipline. Where a resolution here conflicts with an earlier document, this register governs that decision once it is dated and ruled by Gary. See [[continuum-mvp-governance]] and specs/CONTINUUM_PROMPT_21.md.

All eight ruled by Gary on 2026-07-20.

## Resolved

### D1. Application stack
**Ruling: Next.js / Supabase / Capacitor.** Confirms the ratified series baseline (G1). The mainline continuum-app is already scaffolded and building on this stack: Next.js 14.2, Supabase client wired (server, browser, middleware), foundation schema migration in place (commit f3d5b9e). The v2 wiring specification's NestJS / PostgreSQL / React Native assumption is superseded. Supabase provides Postgres, so the database posture (row-level isolation as the projection-law floor) is unchanged. No rework; every migration already written stands.

### D2. Transition authority beyond physicians
**Ruling: physician-only for MVP, authority modeled as data.** Requirement F8 stays physician-only for the pilot: only the physician seat moves medical status through the legal transition table, all else rejected server-side. Build the transition-authority table as data (per-role, per-transition) so physiotherapist or nurse-practitioner authority can be enabled later as an insert, not a refactor. Revisit if the pilot's clinical partner is NP-led.

### D3. FHIR phase placement
**Ruling: phase 2, gated on EMR need; out of MVP.** Nothing in MVP depends on FHIR; the pilot clinical workflow runs on Continuum's own physician seat. Target phase 2 for the FHIR resource mappings (DocumentReference, Condition, CarePlan, Task, ServiceRequest) and SMART-on-FHIR launch, built only when a clinical partner's EMR supports it and wants the in-EMR seat.

### D4. Coordinator default access to consented video
**Ruling: professional-only by default.** Movement video is viewable only by the treating professional by default. The coordinator does not get default video access; a specific case that genuinely needs it requires an explicit, audited per-case grant. Satisfies the counsel flag and data minimization.

### D5. Retention schedules per record class
**Ruling: build configurable per-class retention with conservative interim defaults, counsel-gated.** Implement per-record-class retention as config now (video shortest, audit longest), hard-gated so counsel confirms the actual statutory minimums (PIPEDA + Alberta HIA + Ontario) before ANY first live data. Unblocks the build without a premature legal commitment. Actual periods remain a counsel dependency.

### D6. Ontario privacy instrument mapping for consent text
**Ruling: working posture + configurable consent, counsel-gated (assumption).** Build consent text as versioned and jurisdiction-configurable against a working assumption: Continuum operates as an agent/processor beside the authoritative health-information custodian, Ontario PHIPA-oriented with PIPEDA fallback. Logged in the assumption register; counsel confirms the actual instrument, Continuum's status under it, and the consent wording before first live data.

### D7. Claims-panel scope promised to GardaWorld
**Ruling: illustrative concept + submission tracking.** Pilot materials present the SIGMA-embedded Recovery Intelligence panel as an illustrative, phase-two concept (labeled not-live). The pilot's actual claims experience is submission-and-acknowledgement tracking on the board seat, intake-level integration only. Consistent with Prompt 19/20 doctrine; avoids the integration-overreach risk.

### D8. Marketing boundary for the word intelligence
**Ruling: keep the term, bound it by a verb lexicon.** "Recovery Intelligence" / "Continuous Recovery Intelligence" stays as the category (per Prompt 19). Allowed verbs: surfaces, organizes, connects, routes, informs, flags for review. Banned verbs: diagnoses, predicts, recommends, determines, detects, guarantees. Enforced by a standing marketing-review gate, preserving the framing while holding the device posture.

## Counsel dependencies carried forward

D5 (actual retention periods), D6 (Ontario instrument and consent wording), and the D2 revisit trigger (NP-led clinical partner) are the items that must clear before first live data or on partner confirmation. Everything else is buildable now.
