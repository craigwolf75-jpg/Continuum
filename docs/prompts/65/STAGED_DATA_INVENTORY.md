# Prompt 65 Section 2: staged data inventory

Inspected on 2026-09-17. Public site lane
only. SELECT count(*) only. Zero
deletions. Zero updates. No migration
apply. Section 4 purge MUST NOT run.

Supabase project (live):
`agzhnmunodrhsjbogzae`
(name `craigwolf75-jpg's Project`,
org `jghzileidjxrbfyffkie`,
region `ca-central-1`).
MCP: `list_organizations`,
`list_projects`, `list_tables`,
`execute_sql`. Never DELETE. Never
UPDATE. Never `apply_migration`.

Prefer count(*) for inventory totals.
This file does not authorize delete.
Confirmation text is not present.
STOP at the Section 3 gate.

No em dashes or en dashes. Credentials
never. No access-code values, emails,
or IPs printed.

---

## Commissioned inventory (THIS is N)

Confirmed via execute_sql count(*):

| Table | count(*) | Safe SYNTH | Non-SYNTH | Purge |
|---|---|---|---|---|
| `public.marketing_leads` | 0 | 0 (`email ILIKE 'SYNTH%'`) | EMPTY | none |
| `public.public_assessment_response` | 0 | 0 (none) | EMPTY | none |
| `public.access_log` | 110 | 0 (`code_label ILIKE 'SYNTH%'` only) | 110 | none. Operational gate traffic |
| `public.access_codes` | 2 | 0 (`label` or `code` ILIKE `SYNTH%`) | 2 | NEVER |
| `public.opportunity_weights` | 6 | 0 | 6 | NEVER. Config seed, not a visitor write |

How the site lane writes these, from
code only (`deploy/api/site-access.js`,
`deploy/api/marketing-lead.js`,
`deploy/assessment/assessment.js`,
migrations
`20260815120000_marketing_leads.sql`,
`20260815160000_public_assessment.sql`,
`20260817120000_opportunity_score.sql`,
`20260729130000_site_access_gate.sql`):

- `marketing_leads`: insert from
  `POST /api/marketing-lead`.
- `public_assessment_response`: insert
  via `submit_public_assessment` on
  Save my result; `record_engagement`
  updates the same row.
- `access_log`: insert from
  `validate_and_log_access` on every
  gate attempt.
- `access_codes`: RPC updates
  `use_count` on a matched admit. Hub
  admin create/expire/revoke is out of
  scope.
- `opportunity_weights`: seeded config
  read by `compute_opportunity_score`.
  Not a visitor write.

---

## Safe SYNTH rule (binding)

- `marketing_leads` SYNTH: `email
  ILIKE 'SYNTH%'`. Named census total
  is 0, so SYNTH 0 and non-SYNTH 0.
  Flag: non-SYNTH list EMPTY for leads.
- Assessment SYNTH: none. Total 0.
  Flag: non-SYNTH list EMPTY for
  assessment.
- `access_log` SAFE SYNTH rule is only
  `code_label ILIKE 'SYNTH%'`. That
  count was 0. Path / user_agent
  tagging from Section 1 probes is NOT
  a safe SYNTH deletion rule
  (unmatched attempts do not store the
  submitted code). Do NOT propose
  deleting `access_log` on path or UA.
- Do NOT propose deleting
  `access_codes`. 2 rows, 0 SYNTH.
- Flag: `access_log` 110 rows are
  operational gate traffic. Treat as
  NON-SYNTH / not proposed for
  deletion unless Gary rules
  otherwise.
- `opportunity_weights` remains NEVER.

---

## list_tables drift (UNVERIFIED)

Prefer count(*). Do not use
`list_tables` as the total.

- Earlier `list_tables` compact showed
  `marketing_leads` rows=1 while
  count(*)=0. UNVERIFIED drift between
  the `list_tables` estimate and
  count(*).
- Later Zeus `list_tables` (after
  Section 1 probes) showed
  `marketing_leads` rows=2 while
  count(*)=1. Same class of UNVERIFIED
  drift.

---

## Columns (prose, not dumps)

- `marketing_leads`: id, email,
  source_page, created_at
- `public_assessment_response`:
  response_id, created_at,
  scoring_model_version, stage_reached,
  industry, answers, dimension_scores,
  overall_score, band,
  assessment_confidence,
  missing_data_rate, exposure,
  provenance, save_source,
  opportunity_score,
  opportunity_factors,
  engagement_signals
- `access_log`: id, code_label,
  matched, ts, ip, user_agent, path
- `access_codes`: id, label, code,
  category, created_at, expires_at,
  revoked_at, max_uses, use_count
- `opportunity_weights`: factor,
  weight (NEVER a purge candidate)

---

## Proposed deletion list (SYNTH only)

None. Safe SYNTH counts on the
commissioned snapshot are all 0.
`access_log` path/UA tags are not a
safe rule. `access_codes` are NEVER.
`opportunity_weights` is NEVER.

0 rows proposed for deletion.

This file does not authorize delete.
Confirmation text is not present.
STOP at the Section 3 gate. Section 4
does not run until Gary replies
exactly `purge approved` plus this
same total, 0. A mismatch means stop.

---

## Later recount (honesty, not a second N)

After Section 1 SYNTH probes, a later
execute_sql count(*) on the same
project returned:

- `marketing_leads` = 1
  (`email ILIKE 'SYNTH%'` = 1)
- `public_assessment_response` = 0
- `access_log` = 125
- `access_codes` = 2
- `opportunity_weights` = 6

`access_log` `code_label ILIKE
'SYNTH%'` still 0. `list_tables` then
showed `marketing_leads` rows=2 vs
count(*)=1 (UNVERIFIED drift).

This later recount is subsequent
Section 1 probe writes, not a change
to the commissioned inventory totals.
Do not add those later rows to N.
Path/UA is still not a safe deletion
rule. The later SYNTH-prefixed lead
is a later-probe FLAG for Gary, not
part of N.

N stays 0.

---

## OUT OF SCOPE tables (named, not purge)

`list_tables` on `public` also
returned these. Site lane code does
not write them. Not purge candidates
even if visible:

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
coordinator / platform auth tables
that exist only in later clinician or
worker migrations are likewise out of
scope.

`framer_demo_state` is not a current
public marketing write path.

---

## Confirmation

Zero deletions this dispatch.
Zero updates.
Zero migrations applied.
N = 0.
0 rows proposed for deletion.
