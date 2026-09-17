# Prompt 65 Section 2: staged data inventory

Inspected on 2026-09-17. Public site lane
only. SELECT counts only. Zero deletions.
Section 4 purge MUST NOT run.

Supabase project (live):
`agzhnmunodrhsjbogzae`
(name `craigwolf75-jpg's Project`,
org `jghzileidjxrbfyffkie`,
region `ca-central-1`,
status `ACTIVE_HEALTHY`).
MCP: `list_organizations`,
`list_projects`, `list_tables`,
`list_migrations`, `execute_sql`.
Never DELETE. Never UPDATE. Never
`apply_migration`.

Census time: after Athena SYNTH probes
plus Zeus live re-verify. Athena: one
marketing lead, thirteen wrong-code
posts tagged `/SYNTH-p65-probe` /
`SYNTH-p65-athena-probe`. Zeus:
one more `POST /api/site-access` with
path `/SYNTH-p65-verify` (HTTP 401
`invalid code`). Zeus did not send a
second marketing lead. Email addresses,
access codes, and IP values are not
written here.

No em dashes or en dashes.

---

## Site lane write tables

From site-lane code only
(`deploy/api/site-access.js`,
`deploy/api/marketing-lead.js`,
`deploy/assessment/assessment.js`,
migrations
`20260815120000_marketing_leads.sql`,
`20260815160000_public_assessment.sql`,
`20260817120000_opportunity_score.sql`,
`20260729130000_site_access_gate.sql`).

| Table | How the site lane writes it | Total | SYNTH | Non-SYNTH | Purge |
|---|---|---|---|---|---|
| `public.marketing_leads` | `POST /api/marketing-lead` insert (`email`, `source_page`, `created_at` default `now()`) | 1 | 1 | 0 | SYNTH only |
| `public.public_assessment_response` | `submit_public_assessment` insert on Save my result; `record_engagement` updates `engagement_signals` on the same row | 0 | 0 | 0 | none |
| `public.access_log` | `validate_and_log_access` insert on every gate attempt (match or miss) | 124 | 14 | 110 | SYNTH only |
| `public.access_codes` | RPC updates `use_count` on a matched admit. Hub admin create/expire/revoke is out of scope | 2 | 0 | 2 | NEVER. Non-SYNTH codes |
| `public.opportunity_weights` | Not a visitor write. Seeded config read by `compute_opportunity_score` | 6 | 0 | 6 | NEVER. Config seed |

SYNTH rules used (counts only, no
payloads):

- `marketing_leads`: `email ILIKE 'SYNTH%'`
- `public_assessment_response`: industry,
  `scoring_model_version`, `answers` text,
  or `save_source` ILIKE / contains SYNTH
- `access_log`: `user_agent` contains
  SYNTH, or `path` contains SYNTH, or
  `code_label` ILIKE `SYNTH%`. Unmatched
  historical rows store no submitted
  code, so only this session's tagged
  path / UA identify SYNTH probes.
- `access_codes`: `label` or `code`
  ILIKE `SYNTH%` (code values not
  selected)

`list_tables` first returned
`marketing_leads` rows: 1 before any
insert this session. A SELECT
immediately after that read returned
total 0. After the SYNTH POST, SELECT
returned total 1, SYNTH 1. Zeus recount
`list_tables` briefly showed rows: 2;
SELECT remains total 1, SYNTH 1,
non-SYNTH 0. The SELECT census is the
inventory.

`list_migrations` on this project starts
at `20260817230245` `opportunity_score`.
Earlier site-lane files are applied in
the live catalog (tables exist) even if
they are not in that later migration
list.

---

## Columns (schema only)

`information_schema.columns` SELECT:

`marketing_leads`: `id` bigint, `email`
text, `source_page` text, `created_at`
timestamptz.

`public_assessment_response`:
`response_id` uuid, `created_at`
timestamptz, `scoring_model_version`
text, `stage_reached` int, `industry`
text, `answers` jsonb,
`dimension_scores` jsonb,
`overall_score` int, `band` text,
`assessment_confidence` text,
`missing_data_rate` numeric, `exposure`
jsonb, `provenance` jsonb,
`save_source` text, `opportunity_score`
int, `opportunity_factors` jsonb,
`engagement_signals` jsonb.

`access_log`: `id` bigint, `code_label`
text, `matched` boolean, `ts`
timestamptz, `ip` text, `user_agent`
text, `path` text.

`access_codes`: `id` uuid, `label` text,
`code` text, `category` text,
`created_at` timestamptz, `expires_at`
timestamptz, `revoked_at` timestamptz,
`max_uses` int, `use_count` int.

`opportunity_weights`: `factor` text,
`weight` int.

---

## SYNTH row detail (no secrets)

`marketing_leads` SYNTH 1:
`source_page = '/SYNTH-p65'`,
`created_at` 2026-09-17
05:24:53.875229+00. Email value not
printed. Pattern:
`SYNTH-p65-athena@example.com`. Zeus
did not send a second marketing lead.

`access_log` SYNTH 14: Athena probe
13 (path `/SYNTH-p65-probe` and/or UA
`SYNTH-p65-athena-probe`) plus Zeus
verify 1 (path `/SYNTH-p65-verify`).
Wrong-code probes (`matched` false).
Athena burst used 6 distinct IPs
(values not printed).

`public_assessment_response`: 0.

`access_codes`: 0 SYNTH. 2 non-SYNTH
launch/admin codes. NEVER delete.

`opportunity_weights`: 6 seed factors.
NEVER delete.

---

## NON-SYNTH: never delete

- `access_log` 110 rows (124 minus 14
  SYNTH). Historical admits and misses.
  Flag NON-SYNTH never delete.
- `access_codes` 2 rows. Live gate
  credentials. Flag NON-SYNTH never
  delete. Do not print codes.
- `opportunity_weights` 6 rows. Config.
  Flag NON-SYNTH never delete.
- Every platform / worker / clinical /
  hub table named below. Out of scope.
  Not purge candidates.

---

## Proposed deletion list (SYNTH only)

1. `public.marketing_leads` where
   `email ILIKE 'SYNTH%'`: 1 row.
2. `public.access_log` where
   `path = '/SYNTH-p65-probe'`
   OR `user_agent = 'SYNTH-p65-athena-probe'`:
   13 rows (Athena probe).
3. `public.access_log` where
   `path = '/SYNTH-p65-verify'`:
   1 row (Zeus verify).

No `public_assessment_response` rows.
No `access_codes` rows.
No `opportunity_weights` rows.

**15 rows proposed for deletion.**

This file does not authorize the delete.
Section 4 does not run until Gary
replies exactly `purge approved` plus
this same total, 15. A mismatch means
stop. This draft executed zero deletes.

---

## OUT OF SCOPE tables (named, not purge)

`list_tables` on `public` also returned
these. Site lane code does not write
them. Not purge candidates even if
visible:

`tenants`, `users`, `workers`,
`injuries`, `recovery_logs`,
`light_duties`, `wcb_notifications`,
`escalations`, `consents`,
`access_grants`, `audit_log`,
`wearable_data`, `case_metrics`,
`province_form_codes`,
`status_transitions`, `auto_actions`,
`escalation_keywords`,
`escalation_checks`, `notifications`,
`framer_demo_state`, `hub_profiles`.

Worker / physician / employer /
coordinator / platform auth tables that
exist only in later clinician or worker
migrations are likewise out of scope.

`framer_demo_state` (1 row in
`list_tables`) is not a current public
marketing write path.

---

## Confirmation

Zero deletions this dispatch.
Zero updates.
Zero migrations applied.
N = 15.
