<!-- Source: Continuum_MVP_Wireframe_for_Gary_v2.docx (Craig, v2, June 2026).
     Text extracted verbatim; the Data Model, Status Machine, Capability
     Matrix, and Field-Level Visibility tables were reconstructed as markdown
     (the .docx paste linearized them). No wording changed.

     IMPORTANT: this is the REFERENCE DOC, not the clickable wireframe. The doc
     itself (section intro) names a separate companion file
     `Continuum_MVP_Wireframe.html` that "shows every screen" — that HTML is the
     pixel source Prompt 06's §0 gate requires, and is NOT yet in the repo.

     Demo-scope deviations from this reference (Prompt 06 governs the demo build):
       - NO photo capture in the DEMO (this doc includes an optional check-in
         photo, image_url, and "or photo" in the escalation trigger; Prompt 06 §1
         removes photo from the demo). The mainline MVP keeps photo UPLOAD in
         scope; only photo AI triage is fast-follow.
       - NO in-app messaging in the DEMO (this doc lists messaging as a feature;
         Prompt 06's worker tabs are Today/History/Duties/More, no Messages). -->

# Continuum MVP Wireframe and Build Reference (v2) — reference doc

**Continuum · RETURN TO WORK · Version 2 · June 2026 · Prepared by Craig**

This document describes the Continuum MVP: the screens, the data model, the recovery lifecycle, and the access rules. It is the build reference for the prototype. A companion clickable wireframe (`Continuum_MVP_Wireframe.html`) shows every screen (**not yet supplied**).

## 1. What Continuum Is

A worker centered injury recovery and return to work platform. A worker is injured on a job site, a Nexus Health physician diagnoses them through SiteDocs, and if the injury is more than minor the case is handed to Continuum. Continuum guides the worker's recovery with check-ins, tracks every recovery metric, assigns and monitors light duties, escalates to Nexus Health when recovery stalls, and gives the employer, the WCB claims officer, and Nexus Health their own real time views, in one continuous loop until the worker is signed off for full duty.

## 2. Scope of the MVP

**In scope (core loop):** multi-tenant foundation with row level security and SMS OTP auth; worker app (consent, injury summary, twice daily check-in, history, light-duty checklist); employer dashboard (functional status only); Nexus Health dashboard (intake, monitoring, escalation, clearance, fitness-for-work form); WCB read-only view with three milestone notifications; light duties (assign within restrictions, daily check-off); injury status state machine with server side guards and rule based escalation; intake API built to the proposed contract and stubbed until the spec lands.

**Out of scope (fast follow):** photo AI triage and conversational AI check-ins; video mobility assessment; wearable ingestion (build the table, no ingest yet); SiteDocs SSO (email + OTP until the spec lands).

## 3. The Surfaces

- **Worker App** — mobile, offline first. SMS OTP login, then a privacy consent screen captured and timestamped on first launch. Home shows the injury summary and the twice daily check-in: pain slider (0-10), mobility slider (0-10), notes, and an optional photo. Below is the history of recent check-ins. A light-duty checklist and an in-app message thread with the care team are reachable from the bottom navigation. *Build note:* check-ins write to `recovery_logs` and queue locally when offline, syncing when connectivity returns; photos upload to signed URL storage.
- **Employer Dashboard** — web, real time. Worker table color coded by recovery status, KPI tiles, charts, filters, reviews-and-alerts side rail. Company assigns modified-duty tasks within doctor set restrictions from the Light Duties view. *Privacy boundary:* the employer sees functional status, restrictions, days off, doctor visits, RTW progress, plus injury type for accommodation. It does NOT show diagnosis notes, photos, check-in free text, or raw pain and mobility scores. *Build note:* reads `injuries` + latest `recovery_logs`, scoped by `company_id` through RLS; field level rules enforced in the API response, not just the UI.
- **Light Duties** — Company assigns modified-duty tasks within doctor set restrictions; worker checks them off daily; completion and feedback flow back. Medical restrictions are set by Nexus Health and read only to the company. *Build note:* writes `light_duties`; valid only while the injury is in the light duty state.
- **Nexus Health (Clinician)** — the front door and clinical control center. The assessment form creates the injury and sends it to the Continuum API, which fires the worker SMS. Dashboard shows KPIs, escalation alerts, patient list with recovery progress, clearance actions, and the auto generated fitness-for-work form. *Build note:* only the Nexus Health role can advance medical status; intake endpoint built to the proposed contract and stubbed until the spec arrives.
- **WCB Dashboard** — read only. Claims table and the three milestone notifications: initial injury, light duty cleared, full duty cleared. WCB-Alberta has no public API, so Continuum generates the documents (including the FFW form) for filing through myWCB or HCP online services, and tracks each to acknowledgement. *Build note:* `wcb_notifications` records every payload; WCB access is read only through `access_grants`, scoped to assigned employers.
- **Reference tabs** — Status Flow (lifecycle below), Roles and Access (permission rules below), Data Model (tables below).

## 4. Data Model

Common columns on every table: `id, tenant_id, created_at, updated_at, deleted_at` (soft delete; health records never hard deleted).

| Table | Fields (in addition to common columns) |
|---|---|
| workers | name, email, phone (E.164), company_id, hire_date, job_title, photo_url |
| injuries | worker_id, date_of_injury, body_part, injury_type, severity, prognosis_days, notes, status, estimated_return_date, nexus_case_ref |
| recovery_logs | injury_id, logged_at, pain_score (0-10), mobility_score (0-10), notes, image_url, source |
| light_duties | injury_id, task_description, medical_restrictions, assigned_by, assigned_date, completed_date, worker_feedback |
| wcb_notifications | injury_id, type (initial / light_duty / full_duty), payload, wcb_claim_number, sent_timestamp, status |
| **Supporting** | tenants, users, access_grants, escalations, audit_log, wearable_data (phase two) |

## 5. User Flows

- **Worker.** Injured on site. HSE advisor documents the incident in SiteDocs. A Nexus Health physician assesses. If minor, Continuum is not engaged. If moderate or major, Nexus sends the case to the Continuum API. Continuum sends an SMS app link. The worker logs in with an SMS code and completes check-ins twice daily.
- **Employer.** The moment the SMS fires, a worker card appears on the dashboard and updates in real time, functional status only.
- **WCB.** Three automatic notifications: initial injury, light duty cleared, full duty cleared.
- **Nexus Health.** Receives the case, monitors its own patients, alerted automatically when pain trends poorly.

## 6. Injury Status State Machine

| From | To | Owner | Trigger | Auto-action |
|---|---|---|---|---|
| Reported | Off work | Worker | Worker downloads app and completes first check-in | Worker card appears on employer dashboard; WCB initial notification generated |
| Off work | Light duty | Nexus Health | Physician clears for modified duty | Restrictions publish to employer; WCB light-duty notification; Company can assign duties |
| Light duty | Full-duty pending | Nexus Health | Physician clears for full duty | Fitness-for-work form generated |
| Full-duty pending | Signed off | Company | Employer confirms return to regular duties | WCB full-duty notification with form attached; case closed |
| Any active | Escalated | System | Pain 8+ for 3 check-ins, mobility declining 2+ days, or red-flag note or photo | Escalation created; Nexus Health alerted; light-duty progression may pause |

**Guard rules (server enforced):** only Nexus Health advances medical status; the company acts within a state (assign tasks, confirm return) and cannot clear the worker; no skipping states (validate each transition against current status and caller role); every transition writes an `audit_log` entry (actor, from, to, timestamp).

## 7. Roles and Access

Workers, HSE, and the company are tenant scoped through RLS. WCB and Nexus Health are cross tenant readers, gated through `access_grants` rather than by relaxing RLS. All permissions enforced at the API and DB layer, not just the UI.

### Capability matrix

| Capability | Worker | HSE / Foreman | Company | WCB | Nexus Health |
|---|---|---|---|---|---|
| Log own recovery | Yes | No | No | No | No |
| View full medical detail | Summary | No | No | No | Yes |
| See workers in their company | No | Yes | Yes | No | No |
| See workers across companies | No | No | No | Assigned | Own patients |
| Assign light duties | No | Yes | Yes | No | No |
| Set medical restrictions | No | No | No | No | Yes |
| Advance medical status / clear | No | No | No | No | Yes |
| Confirm return to work | No | No | Yes | No | No |
| Trigger WCB notifications | No | No | Auto | No | Auto |
| In app messaging | Yes | Yes | Yes | No | Yes |

### Field-level visibility (the privacy boundary)

Locked: the employer sees functional status only, never raw pain or mobility scores. HSE sees scores for operational reasons; the company admin does not.

| Data field | Worker | HSE | Company | WCB | Nexus |
|---|---|---|---|---|---|
| Diagnosis notes | Summary | No | No | No | Yes |
| Check-in free text and photos | Own | No | No | No | Yes |
| Pain and mobility scores | Own | Yes | No | Yes | Yes |
| Body part / injury type | Own | Yes | Yes | Yes | Yes |
| Light-duty restrictions | Yes | Yes | Yes | Yes | Sets |
| RTW status and dates | Yes | Yes | Yes | Yes | Yes |
| SIN / date of birth | Own | No | No | Yes | Yes |

## 8. Features

Twice daily recovery check-ins; rule based escalation to Nexus Health when pain trends poorly; photo uploads (AI triage is a fast follow); in app messaging between worker, doctor, company, and care team; medical restrictions attached to light duties; optional wearable integration in phase two.

## 9. Authentication

Workers authenticate with a one time code sent by SMS to the phone on file. No passwords. Dashboard roles (company, WCB, Nexus Health) use email plus a one time code, with SiteDocs SSO as a later option. Codes expire in five minutes; sends are rate limited.

## 10. Open Decisions and Dependencies

- Nexus Health and SiteDocs API specs arrive next week; build to the proposed contracts and stub intake until then.
- WCB-Alberta submission resolved: document generation plus portal filing, no live API.
- Employer visibility resolved: functional status only.
- Brand resolved: Continuum, with Return To Work, in navy and gold.
- Stack confirmation is with Gary.
- A Canadian privacy lawyer should review before launch.
