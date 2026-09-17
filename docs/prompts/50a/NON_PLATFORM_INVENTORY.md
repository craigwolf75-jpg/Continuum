# Prompt 50a non-platform inventory

Hub, site, demo, and worker tables (and hub-side views) labeled
non-platform under Prompt 50a Decision 2. Enumerated from
`create table` / `create view` in `supabase/migrations`. They sit
outside the schemas Prompt 51 owns and creates.

Governing copy is Prompt 51. Schema files only.
`mpi.person` is not in this inventory and is not created. The
allow-list remains one reserved entry.

Exclusion is schema-level even when a table already looks like a real
user table. If any of these later receive real user data as a platform
concern, that promotion is its own migration through the full platform
rules (Decision 2 obligation 3). Never exclude by adding to
`platform/db/tenant_exception_allowlist.txt`.

No em dashes or en dashes anywhere.

---

## Hub (`public.*` tables)

Source: `supabase/migrations/20260717120000_foundation_core.sql`
unless noted.

| Table | Label | Identifiable-data risk |
|---|---|---|
| `public.tenants` | hub | Looks like a real tenant register (name, WCB account). Exclusion is still schema-level. |
| `public.users` | hub | Email, phone, full name, `auth_user_id`. Looks like a real user table. |
| `public.workers` | hub | Linked to users; job title and hire date. Looks like a real worker table. |
| `public.injuries` | hub | Body part, injury type, `diagnosis_notes`. Looks like clinical case data. |
| `public.recovery_logs` | hub | Pain and mobility scores, notes, images. Looks like clinical capture. |
| `public.light_duties` | hub | Task text and `medical_restrictions`. Looks like duty / restriction data. |
| `public.wcb_notifications` | hub | Claim numbers and payloads. Looks like board traffic. |
| `public.escalations` | hub | Injury-linked operational alerts. |
| `public.consents` | hub | User-scoped consent ledger. Parallel to platform `consent`. |
| `public.access_grants` | hub | Cross-tenant registry of user and injury access. |
| `public.audit_log` | hub | Actor, entity, IP / device. Parallel to platform `audit`. |
| `public.wearable_data` | hub | HRV, strain, recovery, heart rate. Looks like health telemetry. |
| `public.case_metrics` | hub | Injury-linked computed metrics. |
| `public.province_form_codes` | hub | Shared form-code reference. Low identifiable risk. |
| `public.status_transitions` | hub | Status machine reference. Low identifiable risk. |
| `public.auto_actions` | hub | Injury-linked action queue (`20260717140000_status_machine.sql`). |
| `public.escalation_keywords` | hub | Shared keyword list (`20260717170000_escalation_engine.sql`). Low identifiable risk. |
| `public.escalation_checks` | hub | Injury-linked evaluation queue (`20260717170000_escalation_engine.sql`). |
| `public.notifications` | hub | User and injury-linked send log (`20260717210000_cross_cutting.sql`). |
| `public.hub_profiles` | hub | Email and approval status (`20260730120000_hub_profiles.sql`). Looks like a real account table. |
| `public.marketing_leads` | hub | Prospect email (`20260815120000_marketing_leads.sql`). Identifiable contact, not worker clinical. |
| `public.opportunity_weights` | hub | Internal score weights (`20260817120000_opportunity_score.sql`). No person data. |
| `public.public_assessment_response` | hub | Anonymous org-level answers (`20260815160000_public_assessment.sql`). File claims no name, email, or health information. |

## Hub views (`public.*`)

| View | Label | Source | Note |
|---|---|---|---|
| `public.employer_case_view` | hub | `20260717160000_role_case_views.sql`, replaced by `20260815140000_employer_hse_views_p56_firewall.sql` | Employer projection of hub case rows. |
| `public.hse_case_view` | hub | same pair | HSE projection of hub case rows. |
| `public.active_consent_view` | hub | `20260717210000_cross_cutting.sql` | Extra view on hub consents. |
| `public.audit_admin_view` | hub | `20260717210000_cross_cutting.sql` | Extra view on hub audit. |
| `public.wcb_officer_view` | hub | `20260717190000_wcb_generation.sql` | Extra view on hub WCB rows. |
| `public.ops_tenants_view` | hub | `20260718090000_ops_admin.sql` | Extra ops view. |
| `public.ops_cases_view` | hub | `20260718090000_ops_admin.sql` | Extra ops view. |
| `public.ops_wcb_view` | hub | `20260718090000_ops_admin.sql` | Extra ops view. |
| `public.ops_audit_view` | hub | `20260718090000_ops_admin.sql` | Extra ops view. |
| `public.ops_metrics_view` | hub | `20260718090000_ops_admin.sql` | Extra ops view. |

## Site (`public.*`)

Source: `supabase/migrations/20260729130000_site_access_gate.sql`.

| Table | Label | Identifiable-data risk |
|---|---|---|
| `public.access_codes` | site | Site gate codes and labels. Not worker clinical. |
| `public.access_log` | site | IP, user agent, path. Identifiable access telemetry. |

## Demo (`public.*`)

Source: `supabase/migrations/20260718100000_framer_demo.sql`.

| Table | Label | Identifiable-data risk |
|---|---|---|
| `public.framer_demo_state` | demo | Synthetic Framer state only. Dedicated `framer_demo` role. |

## Worker (`worker.*`)

Source: `supabase/migrations/20260915140000_worker_schema.sql`
unless noted.

| Table | Label | Identifiable-data risk |
|---|---|---|
| `worker.deployment_flag` | worker | Feature flags. No person row. |
| `worker.worker_account` | worker | `auth_user_id`, display name, `clinical_worker_id` (opaque, no FK). Looks like a real account table. |
| `worker.case_pathway` | worker | Case pathway flags. |
| `worker.consent` | worker | Granted / revoked consent by account and case. Looks like a real consent table. |
| `worker.check_in` | worker | Hours and `reported_pain`. Looks like clinical check-in data. |
| `worker.check_in_answer` | worker | Duty performance and worsening notes. |
| `worker.private_comment` | worker | Free-text comments. Looks like identifiable narrative. |
| `worker.psych_capture` | worker | Question and answer text. Looks like clinical capture. |
| `worker.operational_signal` | worker | Case-linked operational codes. |
| `worker.movement_observation` | worker | Angle observations. Looks like functional capture. |
| `worker.companion_memory` | worker | Per-account jsonb memory. |
| `worker.audit_log` | worker | Account and case audit. Parallel to platform `audit`. |
| `worker.case_invite` | worker | Email plus case (`20260915150000_worker_provision_invite_gate.sql`). Looks like a real invite table. |

Worker view: `worker.employer_worker_view` (same 20260915140000 file)
reads `employer.duty_match_line`, `employer.published_restriction_set`,
and `clinical.wcb_case`. That is a SELECT join, not a foreign key. It
is listed here as a worker-side view. Decision 2 obligation 2 CI
checks REFERENCES and grants only; it does not rewrite this view.

## Not in this inventory

- `mpi.person` is not created and is not listed. It remains the single
  reserved allow-list entry.
- Platform schemas (`tenancy`, `clinical`, `employer`, `audit`,
  `consent`, `config`, `events`, `clinic_ops`, `interop`) are in scope
  for Decision 2, not excluded.
- `platform.schema_migration` and similar metadata hold no identifiable
  data.
