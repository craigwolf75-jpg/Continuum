# CONTINUUM PROMPT 05 — Spec Reconciliation: Client MVP Handoff vs Design Track

**Project:** Continuum, worker injury recovery and return-to-work platform
**Prepared for:** Gary (build lead)
**Client source documents:** Continuum_MVP_Build_Handoff.md (Craig, June 27, 2026), Continuum_MVP_Build_Prompts.md, Continuum_Master_Deck_Rev_6.pptx
**Internal track:** Continuum Prompts 01, 02, 2a, 2b, 2c, 03, 04 (design system, screen specs, demo mode, gating, Claude Code static build)
**Date:** July 17, 2026
**Status:** Governing document. Where this reconciliation and any earlier Continuum prompt disagree, this document wins until Gary rules otherwise.

---

## 1. PURPOSE

The client has delivered an authoritative MVP build kit: locked scope decisions, a five-plus-six table data model, a server-guarded status machine, a field-level visibility matrix, proposed API contracts pending the Nexus Health and SiteDocs specs, a WCB-Alberta integration finding, and a ten-prompt agent build series. The internal design track (Prompts 01 through 04) was developed to a related but not identical specification. This document registers every conflict, states which side governs, and defines the corrected baseline for all future Continuum prompts.

**Precedence rule:** Client-locked decisions (handoff section 0 and any row marked Resolved in section 11) govern. Internal design law survives only where it does not contradict the client. Items the client left open belong to Gary.

---

## 2. CONFLICT REGISTER

### C1. Role model — CLIENT GOVERNS
- Client enum: worker, hse, employer_admin, wcb_officer, nexus_physician. Five roles.
- Internal track used six workspaces: coordinator, supervisor, HSE, physician, claims, leadership. The coordinator role and the leadership analytics workspace do not exist in the client model.
- **Ruling:** production builds the five client roles exactly. The coordinator concept is retired from MVP; the employer dashboard carries the KPI and worker-table function. Leadership analytics is not an MVP surface. Prior recommendation to fold employer confirmation into a supervisor workspace is withdrawn: employer_admin is a first-class role and is the only role that triggers full_duty_pending to signed_off.

### C2. HSE visibility of pain and mobility scores — CLIENT GOVERNS
- Client matrix: HSE sees pain and mobility scores (operational need). Employer_admin does not.
- Internal design law: supervisor and HSE both saw functional language only.
- **Ruling:** internal law was stricter than the client wants. HSE surfaces may display scores. Employer_admin remains functional-only, enforced in the API response shape, never just the UI. Diagnosis notes, photos, and check-in free text remain Nexus-only regardless of role.

### C3. Check-in mechanics — CLIENT GOVERNS
- Client: twice-daily check-in, pain slider 0 to 10, mobility slider 0 to 10, optional notes, push plus SMS-fallback reminders, offline queue with idempotent sync.
- Internal track: once-daily three-step tap check-in plus a camera movement session.
- **Ruling:** production check-in is the client's slider model. The camera movement session, photo AI triage, conversational check-ins, and video assessment are all client-designated fast-follow and MUST NOT be built for the MVP or demoed as current capability.

### C4. Status machine — ALIGNED WITH TWO CORRECTIONS
- Both sides: reported, off_work, light_duty, full_duty_pending, signed_off, plus escalated.
- Correction 1: reported to off_work advances automatically on the worker's first check-in. No human role advances it.
- Correction 2: escalated is a value in the injuries.status enum (side state reachable from any active state, returning to the prior state on Nexus reassessment). Implementation requires a prior_status memory field so return-to-prior is deterministic. The internal overlay-flag recommendation is withdrawn in favor of the client enum, with prior_status as the implementation detail that makes it safe.
- Transition authority table (server-enforced): worker auto-advance reported to off_work; nexus_physician for both medical advancements and escalated-to-prior; employer_admin for full_duty_pending to signed_off; system raises escalated.

### C5. Brand tokens — CLIENT GOVERNS
- Client: navy #0E1B2C, gold #C8972F, white-labels to tenant logo via tenants.branding jsonb.
- Internal: navy #0E1B2E, gold #C9963C plus an extended palette.
- **Ruling:** client hexes are canonical. Internal extended palette (cream, ink, slate, mist, gold-soft) may continue as secondary tokens where they do not conflict. All future deliverables and code use #0E1B2C and #C8972F.

### C6. Cast and seed data — SPLIT RULING
- Client worked example: Marcus Bedard, scaffolder, Worley (approx. 3,000 workers), Dr. A. Owusu, case NX-2026-00481, right shoulder, grade 1 supraspinatus strain, 21-day prognosis.
- Internal demo cast: Mateo R., Northline Industrial, Dr. Osei, claim 2408841.
- **Ruling:** production seed scripts and anything shown to the client use the client's cast and tenant (seed tenant is Worley per client Prompt 1). The internal cast remains permitted only inside the internal static demo if that track continues. No real data ever, in either track.

### C7. WCB-Alberta integration — CLIENT GOVERNS (research finding)
- Finding: no public third-party claims API. Reporting runs through myWCB (employer report of injury, legally required within 72 hours), physician forms via HCP online services, and case-manager-routed forms (fitness-for-work, Notice to Injured Employee, PDA).
- **Ruling:** no WCB API integration in MVP. Build document generation for the three milestone payloads, a submit-to-WCB hand-off step, and the wcb_notifications lifecycle: pending, generated, submitted, acknowledged, failed. Any internal screen implying a live WCB feed is re-labeled as document lifecycle tracking. Future EDI inquiry goes to WCB eBusiness Support before go-live.
- Exact WCB form field sets must be confirmed against current WCB-Alberta forms before go-live (client open item 9).

### C8. Escalation rules — CLIENT GOVERNS
- Rules: pain at or above 8 for 3 consecutive check-ins, OR mobility declining across 2 or more days, OR a configurable red-flag keyword in notes. Rule-based only, no ML in MVP. Escalations never auto-advance medical status; Nexus closes the loop via reassess.
- Internal demo used a single-check-in pain threshold; corrected to the three-rule model.

### C9. Authentication — CLIENT GOVERNS
- Workers: SMS OTP (6-digit, 5-minute expiry, single-use, rate-limited, E.164, managed provider). Dashboards: email plus OTP now, SiteDocs SSO seam for later. Never roll your own OTP infrastructure.

### C10. Data protection baseline — CLIENT GOVERNS, ALIGNED
- PIPEDA plus Alberta Health Information Act posture; explicit timestamped revocable consent gating all collection; Canadian-region hosting for all PHI; TLS in transit, AES-256 at rest; signed-URL-only file access; append-only immutable audit_log on every read, edit, and export of health data; soft delete only, health records never hard-deleted; minimum-necessary field exposure per role. Canadian privacy-lawyer review before launch (client-owned).

---

## 3. TRACK RULING: PRODUCTION MVP IS THE MAINLINE

The internal static demo (Prompt 04) existed to win design partners. The client is committed and supplied his own clickable wireframe as the screen reference. Effective this document:

1. The client's Prompts 0 through 10 are the mainline build.
2. The internal static demo track is PARKED unless Gary rules it continues as a marketing asset. Its missing-screens blocker is no longer on the critical path.
3. If the demo continues, it must first re-baseline to this document: five roles, HSE score visibility, slider check-ins, client hexes, no camera session presented as a current feature.

---

## 4. STACK MAPPING (Gary's decision, client open item 7)

Client-recommended stack: NestJS, PostgreSQL with RLS, React Native, React or Next.js dashboards, Twilio, Canadian-region hosting, signed-URL object storage. The handoff explicitly defers final stack choice to Gary's toolchain.

**Recommended mapping to Gary's proven stack (pending Gary's ratification):**

| Client requirement | Mapping | Notes |
|---|---|---|
| PostgreSQL with row-level security | Supabase (Postgres, RLS first-class) | New project, new org, ca-central-1. Fully separate from all other Supabase projects and credentials. |
| Canadian data residency | Supabase ca-central-1 (AWS Canada) | Satisfies the PHI residency hard requirement. |
| Signed-URL-only file storage | Supabase Storage, private buckets, signed URLs | Encrypted at rest. |
| Session-variable RLS mechanism | JWT claims (tenant_id, role, user_id) consumed by RLS policies | Same guarantee, idiomatic to the platform. Cross-tenant roles gated via access_grants checks in policies. |
| NestJS API layer | Next.js route handlers plus Supabase Edge Functions | Typed with TypeScript throughout. Guard rules and field-stripping live server-side. |
| React Native worker app, offline-first | Next.js plus Capacitor (iOS and Android) | Offline queue in local storage, client-generated idempotency IDs, sync-state UI, exactly per client Prompt 3. |
| React/Next.js dashboards | Next.js 14, responsive from the start | Employer, Nexus, WCB views. |
| Twilio SMS, Canadian number | Twilio via server routes or edge functions, behind an SmsProvider interface | Mockable in dev per client Prompt 2. |

Every non-negotiable in client Prompt 0 survives this translation. If Gary prefers the client stack verbatim, the prompt series runs as written with no adaptation.

**Hard isolation rule:** the Continuum Supabase project, GitHub repo, Vercel project, and all credentials are dedicated to Continuum. Nothing is shared with any other platform or entity.

---

## 5. TIMING FLAGS

1. **Nexus Health / SiteDocs specs.** Due "next week" from June 27, meaning on or around July 6. It is now July 17. Status unknown. If landed: reconcile intake and clearance field names, replace static service-token auth, wire SSO seam per the client's post-spec prompt. If not landed: the section 12 stub plan governs and nothing blocks.
2. **72-hour employer reporting.** The WCB employer report of injury is legally required within 72 hours of injury. The initial-notification generator is therefore not a nice-to-have; it is the first document generator to get right.
3. **Missing companion file.** Continuum_MVP_Wireframe.html is referenced by client Prompts 3, 4, 6, and 9 as the screen reference and was not supplied in this session. Obtain it before running those prompts.

---

## 6. OPEN ITEMS FOR GARY

| # | Item | Options | Recommended default |
|---|---|---|---|
| G1 | Stack ratification | Supabase/Next.js/Capacitor mapping vs client stack verbatim | The mapping (section 4) |
| G2 | Demo track fate | Park vs continue as marketing asset after re-baseline | Park until MVP foundation ships |
| G3 | Nexus/SiteDocs spec status | Landed vs not landed | Confirm with Craig this week |
| G4 | Wireframe file | Obtain Continuum_MVP_Wireframe.html | Request from Craig immediately |
| G5 | Prompt series adaptation | Run client Prompts 0-10 as-is vs a translated series in Gary's numbered library format targeting the ratified stack | Translated series, preserving client contract shapes verbatim at every API boundary |

---

## 7. WHAT DOES NOT CHANGE

The product spine is identical on both sides and is reaffirmed: privacy by translation (employers see functional capacity, never medical detail, enforced at API and DB layers); only the physician advances medical status; the employer confirms return; escalation routes to the clinician, never auto-advances; every transition and every health-data access is audited append-only; consent gates all collection and is revocable; tenant isolation on every table, query, and file. Where care ends, Continuum begins.

---

<!-- Folded into the Continuum repo 2026-07-17 as the governing reconciliation doc.
     Verbatim copy of the source; do not edit the body. Decisions G1-G5 are Gary's. -->
