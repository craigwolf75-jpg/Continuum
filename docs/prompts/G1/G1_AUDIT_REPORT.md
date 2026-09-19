# G1 DISCOVERY AUDIT REPORT

No write, delete, region change, or configuration change was made anywhere during this audit.

Date: 19 September 2026.
Tip: `69615358f1ca20c93ffdf65532121d9d6d163a28`.
Prompt write date: 8 August 2026.
Prepared for Gary, for relay to Craig.
Reading lane. Not G1 closed. No stack is proposed. No fix is proposed. No migration is proposed.

Every answer is labelled VERIFIED with the evidence named, or UNVERIFIED with what blocked you. Evidence is a config path, a query result (counts and schemas), a region string, or a server response. Patient row contents were not read and are not copied here. Credentials are named by storage location only.

The 2026-08-13 file `G1_AUDIT_REPORT.md` at repo root is a prior claim with no live database access. This file is the programme report. It does not inherit that file. Where the two disagree, this file states the live evidence.

Citation map (Craig original numbers, not the unified ledger):
- "Prompt 47" and "47" in "47 through 50" = unified Prompt 51. NOT unified Prompt 47.
- "48" in "47 through 50" = Master Person Index prompt.
- "49" in "47 through 50" = unified Prompt 52.
- "50" in "47 through 50" = Product Behaviour prompt. NOT retired unified Prompt 50.
- Prompt 10, Prompts 27/28/29, Prompt 33, Prompt 34 = Craig original live-platform numbering. NOT chat lane P33/P34.

Section 00.6 discrepancy, logged, not resolved: Prompt 53 email named old stream 47 to 49. This prompt says 47 through 50. The wider range governs until Craig says otherwise.

---

## METHOD AND ACCESS

- Repo: `github.com/craigwolf75-jpg/Continuum`, default branch `main`, public. VERIFIED (`gh repo view` via Athena census; production deploy meta `githubOrg` / `githubRepo`).
- Working tree: tip `69615358f1ca20c93ffdf65532121d9d6d163a28` on branch `cursor/g1-discovery-audit-11af`. VERIFIED (`git rev-parse`).
- Live Supabase: project id `agzhnmunodrhsjbogzae`, name `craigwolf75-jpg's Project`, region string `ca-central-1`, status `ACTIVE_HEALTHY`, Postgres `17.6.1.147`, host `db.agzhnmunodrhsjbogzae.supabase.co`. Org `jghzileidjxrbfyffkie` named `craigwolf75-jpg's Org`, plan `pro`. `list_projects` returned exactly one project. Region string re-read from `get_project.region` on the Athena live-fill pass: `ca-central-1`. VERIFIED (Supabase MCP `list_projects`, `get_project`, `get_organization`).
- Live Vercel: project name `continuum-o51l`, id `prj_jbuGiSlcwM5PMxtBFxCBr2vYidoM`, accountId `team_ooNT4hM36tH125Vlgt23ZnXk`. Production deploy `dpl_91diubN6XBDtGVdmLZcZYny8Qz1y`, target `production`, source `git`, `githubCommitRef` `main`, `githubCommitSha` `69615358f1ca20c93ffdf65532121d9d6d163a28`, `regions` `["iad1"]`. VERIFIED (Vercel MCP `get_project`, `list_deployments`, `get_deployment`).
- Vercel function region pin: ABSENT from `deploy/vercel.json` (no `regions` key). `get_project` payload has no function-region or `serverlessFunctionRegion` field. VERIFIED absence of a config pin. Named project-level function region setting: UNVERIFIED (field not in this API payload). Deployment `regions` `["iad1"]` is deploy metadata, not a `vercel.json` pin.
- Vercel team plan: UNVERIFIED. `get_team` with that account scope returned 403.
- SQL in this report is count(*), `information_schema`, `pg_class` RLS flags, `pg_enum`, `cron.job` names, and `storage.buckets` names. No patient row contents.
- Athena live fill (this pass): public schema 26 tables via `list_tables` verbose, then column flags re-verified from `information_schema` before any VERIFIED claim. Prefer `count(*)` over `list_tables` row estimates. See Section 4.1.
- `supabase/config.toml`: ABSENT. VERIFIED (workspace glob).
- Root `vercel.json` and root `package.json`: ABSENT. Site config is `deploy/vercel.json` and `deploy/package.json`. VERIFIED.

---

## PRIOR CLAIMS TEST (verify, never inherit)

(a) No Montreal Supabase project exists.
VERIFIED as: `list_projects` returned one row, region `ca-central-1`, not a second project named for Montreal. `docs/prompts/45a/CONTINUUM_45A_MONTREAL_PROJECT_RUNBOOK.md` still describes a dedicated clinical Montreal project as a future hand apply. The live project already uses the `ca-central-1` region string. Those two facts are both true and are not the same claim.

(b) Prompt 39 to 44 work is local and CI only, production submission structurally disabled, no model called.
FALSE as a whole. Physician and platform schemas are on the live project.
- `list_migrations` includes `clinician_001` through `clinician_009`, `worker_w001` through `w007`, `worker_schema` 20260915*, `clinical_019` through `clinical_022`. VERIFIED (Supabase MCP `list_migrations`).
- Live schemas `clinical`, `clinician`, `worker`, `tenancy`, `consent`, `employer`, `audit`, `events`, `config`, `platform` exist. VERIFIED (`pg_class`).
- `clinical.worker`, `clinical.wcb_case`, `clinical.functional_measurement` counts are 0. Reference tables are populated (`clinical.form_element` 816, `form_rule` 333, `wcb_code_value` 610). VERIFIED (`pg_stat` / count).
- `clinician.worker` 2, `case_file` 2, `measurement` 1, `report` 3. VERIFIED (`n_live_tup`).
- `platform.schema_migration` count(*) 17 (versions 0000 through 0016). Repo files 0017, 0018, 0019 are not in that table. VERIFIED (count(*)).
- Production submission flags: `CONTINUUM_PRODUCTION_SUBMISSION`, `CONTINUUM_ALLOW_BOARD_SUBMISSION`, `MYWCB_USERNAME`, `MYWCB_PASSWORD` are ABSENT from the Vercel env key list. VERIFIED (key names only). Whether any other host has a flag on is UNVERIFIED.
- No anthropic / openai / bedrock live client in `supabase/functions`. Bedrock init stub refuses a live client. VERIFIED (source, Athena census).

(c) Bedrock go drafted, never sent.
VERIFIED as a document and as an env-name fact. `docs/prompts/45a/CONTINUUM_45A_BEDROCK_GO.md` states it is not live enablement. No AWS or Bedrock key name appears in the Vercel env key list. Whether a human sent the GO packet outside this repo is UNVERIFIED.

(d) Nothing seeded beyond SYNTH prefixed fixtures.
FALSE for the live public stream. `public.users` where `full_name`, `email`, or `phone` ILIKE `SYNTH%` is 0 of 6. `public.tenants` name ILIKE `SYNTH%` is 0 of 1. VERIFIED (count(*) only). Live rows match fixed UUIDs in `supabase/seed.sql` (presence counts of 1 for the demo tenant, user, worker, and injury UUIDs). That seed file is labeled demo data and does not use a SYNTH prefix. Row contents were not selected. Whether `clinician.*` and `worker.*` name columns use a SYNTH prefix is UNVERIFIED (name columns not read).

---

## SECTION 2. SERVICE AND HOSTING INVENTORY

| Name | Provider | What it does | Account | Plan / tier | Evidence | Status |
|---|---|---|---|---|---|---|
| App hosting | Vercel project `continuum-o51l` | Static site from `deploy/` plus Node serverless under `deploy/api` and Edge middleware `deploy/middleware.js` | Vercel account `craigwolf75-5699s-projects` / `team_ooNT4hM36tH125Vlgt23ZnXk` | Vercel plan UNVERIFIED (get_team 403) | `get_project`; `deploy/package.json`; `deploy/middleware.js` | VERIFIED host; tier UNVERIFIED |
| Production domains | Vercel | `www.continuumrtw.com` is the production host. `continuumrtw.com` 308-redirects to `www`. Also `continuum-o51l-craigwolf75-5699s-projects.vercel.app` and git-main alias | same Vercel account | n/a | `list_project_domains`; `get_project.domains` | VERIFIED |
| Database | Supabase managed Postgres 17 | Primary datastore, RLS, extensions | Org `craigwolf75-jpg's Org` (`jghzileidjxrbfyffkie`), project `agzhnmunodrhsjbogzae` | plan `pro` | `get_organization.plan`; `get_project` | VERIFIED |
| Auth | Supabase Auth (GoTrue) plus two Vercel cookie gates | `auth.users` count(*) 7. Hub email/password via `deploy/api/_hub_auth.js`. Site gate via `access_codes` and `ct_site`. Hub session via `hub_profiles` and `ct_session` | same Supabase project; Vercel keys `CONTINUUM_HUB_SESSION_SECRET`, `CONTINUUM_SITE_SESSION_SECRET` | included in Supabase pro | count(*); `_hub_auth.js`; `_hub_session.js`; `_site_session.js`; env key list | VERIFIED wiring; live password login UNVERIFIED (not attempted) |
| File / object storage | Supabase Storage | Buckets: `Continuum` (public false), `wcb-documents` (public false), `Hero Videos` (public true). `storage.objects` n_live_tup 2 | same project | included | `SELECT id, name, public FROM storage.buckets` | VERIFIED |
| SMS / telephony | Twilio planned, mock only | `smsProviderSend` logs to console. Comment says Twilio lands in 07.2 | none live | n/a | `supabase/functions/cases/index.ts:35-37`, `:199-203` | VERIFIED mock; Twilio not wired |
| Email | Resend | Transactional signup, lead, and access-invite from `deploy/api/_notify.js` to `SIGNUP_NOTIFY_TO` | Vercel keys `RESEND_API_KEY`, `SIGNUP_NOTIFY_TO`, `SIGNUP_NOTIFY_FROM` on preview and production | Resend plan UNVERIFIED | `_notify.js`; env key list | VERIFIED wired; send success UNVERIFIED (no send performed) |
| AI / inference | None live as a model call. ElevenLabs widget code exists. Bedrock stub exists. Firecrawl env key exists | `presenter.js` loads `@elevenlabs/convai-widget-embed`. Env key `eleven_labs_chatbox_agent` on preview and production. `FIRECRAWL` on production | Vercel env keys named above. No AWS keys in env list | n/a | `presenter.js`; env key list; `clinical/engine/bedrock_inference_init.mjs` | VERIFIED no model call in `supabase/functions`; whether the widget is on a public live page is UNVERIFIED |
| Error tracking | None found in product code | No Sentry, Datadog, Bugsnag, Rollbar import in `deploy/`, `supabase/functions`, `worker-app` | n/a | n/a | grep | VERIFIED none in code |
| Logging | Vercel platform logs; Supabase logs; `console.log` in edge functions | Native host logs. No third-party logger | Vercel / Supabase accounts above | included | functions use `console.log` | Platform logs exist as a product; retention and region UNVERIFIED |
| Analytics | No third-party product analytics wired | `deploy/privacy.html` states no third-party analytics. No PostHog, GA, Vercel Analytics package | n/a | n/a | grep; `deploy/privacy.html` | VERIFIED none in code |
| Uptime monitoring | GitHub Actions `agent-ops-observe` | cron `0 13 * * 1-5` plus `workflow_dispatch`. Hits `CONTINUUM_OBSERVE_BASE` `https://www.continuumrtw.com` | GitHub repo `craigwolf75-jpg/Continuum` | GitHub Actions plan UNVERIFIED | `.github/workflows/agent-ops-observe.yml` | VERIFIED as a scheduled observer, not a commercial uptime product |
| DNS | Squarespace DNS + Vercel DNS answers | NS `nsb1-4.squarespacedns.com`. www A/AAAA via Vercel DNS | Domain registrar UNVERIFIED | n/a | `dig` NS / A / AAAA (Athena census) | VERIFIED NS and A; registrar account UNVERIFIED |
| CDN | Vercel CDN | `server: Vercel`, `x-vercel-cache`, `x-vercel-id` `iad1` on live responses | same Vercel account | included | live response headers (Athena census) | VERIFIED |
| Backups | Supabase managed backups (tier dependent) | Pro plan typically includes daily backups. PITR add-on unknown. Restore history unknown | same Supabase org | pro; PITR UNVERIFIED | `get_organization.plan` only | Backup product UNVERIFIED beyond plan name; restore tested UNVERIFIED |
| Scheduled job runner | Supabase `pg_cron` 1.6.4 + `pg_net` 0.20.4 | Jobs: `continuum-auto-actions` `* * * * *` active; `continuum-escalation` `* * * * *` active; `continuum-wcb-generator` `* * * * *` active; `framer-demo-reset` `0 4 * * *` active | same project | included | `list_extensions`; `SELECT jobid, jobname, schedule, active FROM cron.job` | VERIFIED |
| Vault | Supabase Vault 0.3.1 | 1 secret, name `continuum_worker_secret` | same project | included | `list_extensions`; `SELECT name FROM vault.secrets` | VERIFIED name only |
| CI | GitHub Actions | `suites.yml`, `exposure-proof.yml`, `xsd-crosscheck.yml` on push/PR to main. `platform.yml` on `platform/**` paths. `agent-ops-observe` on schedule | `craigwolf75-jpg/Continuum` | UNVERIFIED | `.github/workflows/*` | VERIFIED |
| Source hosting | GitHub | Application source | `craigwolf75-jpg` | public repo | production deploy meta | VERIFIED |
| Worker mobile package | Capacitor + Next 14 in `worker-app/` | Local/package app, not its own Vercel project | n/a | n/a | `worker-app/package.json`; Vercel search returned one project | VERIFIED no separate worker Vercel project |
| Hub role bundle | Vite IIFE in `hub-roles/` | Built into static hub | n/a | n/a | `hub-roles/package.json` | VERIFIED as a build tool, not a host |
| Site gate access codes | `public.access_codes` (count(*) 2) + `deploy/api/site-access.js` | Unlocks `ct_site` cookie | same project | n/a | count(*); `middleware.js` | VERIFIED |
| Marketing lead capture | `public.marketing_leads` (count(*) 1) + `/api/marketing-lead` | Public email capture | same | n/a | count(*) 1. Athena `list_tables` and `n_live_tup` both said 2. Drift: prefer count(*). | VERIFIED count(*); list_tables estimate UNVERIFIED as a count |
| Public assessment | `/assessment` static + `public.public_assessment_response` (count(*) 0) | Public, not site-gated | Vercel | n/a | Athena HTTP 200; count(*) 0 | VERIFIED |
| Edge functions | Supabase Edge (Deno) | ACTIVE: `auto-actions-worker` v11, `injuries` v8, `escalation-engine` v8, `cases` v6, `wcb-generator` v6, `framer-demo` v5. All `verify_jwt` false | same project | included | `list_edge_functions` | VERIFIED |
| Custom Vercel environment | slug `supabaseaccesstoken` | Holds env key `supabase_access_token` | Vercel | accountLimit total 1 (Athena) | env list | VERIFIED name only |

### Repositories

| Name | Hosting | Default branch | Auto deploy |
|---|---|---|---|
| `craigwolf75-jpg/Continuum` | GitHub | `main` | VERIFIED: Vercel production deploys from `main` via Git integration (`list_deployments`: target `production`, `githubCommitRef` `main`, `source` `git`, sha matches tip). Preview deploys from feature branches (`target` null). Branch protection: UNVERIFIED (GitHub API 403). Human review required: UNVERIFIED. Recent main commits arrive as merged PRs (#181, #180, #179) but required review is not proven. |
| `worker-app`, `hub-roles`, `clinical/db`, `clinical/engine`, `deploy`, `platform`, `agents-kit` | directories in the same repo | same | Only `continuum-o51l` deploys. VERIFIED |

### Azure versus live stack

`docs/prompts/50/SECTION_1.md` and `SECTION_16.md` describe Prompt 50 assuming Azure Canada Central primary and Canada East secondary, then record that Azure is not the stack. Live stack is Vercel + Supabase + Resend. No Azure resource, Azure region string, or Azure config file found in the repo or in the two live accounts queried. VERIFIED absence.

---

## SECTION 3. DATA RESIDENCY, SERVICE BY SERVICE

Health information CAN reach a service means a path exists that could carry identity, case, restriction, score, or clinical fields, not that it is supposed to.

| Service | Region evidence | Can health information reach it | Label |
|---|---|---|---|
| Supabase Postgres | `get_project.region` = `ca-central-1` | Yes. Primary PHI and case store (`injuries`, `recovery_logs`, `users`, `workers`, `consents`, `clinician.*`, `clinical.*`, `worker.*`) | CANADA VERIFIED |
| Supabase Storage | No separate bucket region string returned. Hosted on the same project. Bucket-specific region UNVERIFIED | Yes. `wcb-documents` is private and used by `wcb-generator`. `Hero Videos` is public (world readable if an object is placed). `Continuum` bucket private. 2 objects exist (names not listed) | CANADA VERIFIED at project; bucket region string UNVERIFIED |
| Supabase Auth | Same project `ca-central-1` | Yes. Emails, phone, auth ids | CANADA VERIFIED |
| Supabase Edge Functions | Execution region not pinned in function source. `verify_jwt` false on all six. Service role used in function source | Yes. `cases`, `injuries`, `escalation-engine`, `wcb-generator` read/write case tables | Execution region UNVERIFIED (residency risk). Project home CANADA VERIFIED |
| Vercel functions and middleware | `deploy/vercel.json` has no `regions` key (VERIFIED file). `get_project` returned no function-region field. Production deploy `dpl_91diubN6XBDtGVdmLZcZYny8Qz1y` has `regions` `["iad1"]` (VERIFIED `get_deployment`). Live `x-vercel-id` starts with `iad1`. `CONTINUUM_REGION` and `VERCEL_REGION` are not in the project env key list. `/api/status` would read those env names and fall back to the string UNKNOWN (`deploy/api/status.js:13-19`); that route is site-gated | Yes. Hub signin/signup, admin user provision, site-access, marketing-lead, and service-role calls to Supabase run here. Access invite email builder can include name, email, role, temporary password | NOT CANADA for the production deploy region list (`iad1` VERIFIED). Config pin UNVERIFIED / absent. Not a Canadian pin |
| Vercel CDN / static HTML | Global CDN. Edge middleware also in `iad1` per `x-vercel-id` | Static portals can render case UI after gates. Holding page itself is marketing. `/worker` pages are public | CDN not pinned to Canada. UNVERIFIED as a single region |
| Twilio | Not wired | Today: mock `console.log` only, so no Twilio network path | UNVERIFIED (not live) |
| Resend | `api.resend.com`. No Canadian region pin in code. Provider default is outside Canada | Yes for identity: signup email, lead email, access invite with name, email, role, temporary password. Templates do not include diagnosis | NOT CANADA (provider path VERIFIED; processing region UNVERIFIED, default not Canada) |
| ElevenLabs | `unpkg.com/@elevenlabs/convai-widget-embed` in `presenter.js`. Env key present | Can receive audio / conversation if the widget mounts | NOT CANADA / UNVERIFIED region. Path exists in code and env |
| Firecrawl | Env key `FIRECRAWL` on production | Can if later invoked. Code path currently does not run it (`internal/agent-ops/lib/retrieval.mjs` `firecrawl_ran: false`) | UNVERIFIED whether any live call occurred. Provider not Canada by default |
| GitHub Actions observe | `ubuntu-latest` (GitHub-hosted, typically US) | Fetches the public site URL. Holding page only unless a cookie is present (the workflow sets no site cookie) | NOT CANADA for the runner. PHI on that path UNVERIFIED and unlikely on the holding page |
| Backups / PITR | Destination region not returned by MCP | Yes if backups exist (full database) | Destination UNVERIFIED. Restore tested UNVERIFIED. Who can restore: Supabase org members. Member list UNVERIFIED |
| Vault secret `continuum_worker_secret` | Same project | Used by scheduled workers. Can authorize PHI jobs | CANADA VERIFIED with the project |
| Preview Vercel deployments | Same `iad1` pattern. `POSTGRES_URL` and `SUPABASE_SERVICE_ROLE_KEY` target includes preview | Yes. Preview shares the live database keys (see Section 6) | NOT CANADA for compute. Data is the Canada project |

### Twilio message templates (code only, not live messages)

From `supabase/functions/cases/index.ts:200-203`, the only SMS body:

`Continuum: your recovery check-ins start now. Open the app: https://continuum-pink.vercel.app/app`

Worker name: no. Condition: no. Clinical detail: no.
It contains a hardcoded preview URL `continuum-pink.vercel.app`, not `continuumrtw.com`.

`escalation-engine/index.ts:169` comments that SMS is not sent; in-app notification only. No second SMS template found in `supabase/functions`.

### Email templates (code)

Signup: subject `New Continuum hub signup awaiting approval`. Body includes the signup email and `https://continuumrtw.com/admin-hub-users`.
Lead: subject `New Continuum access request`. Body includes email and source page.
Access invite: subject `New Continuum user provisioned: access invite`. Body includes name, email, role, optional temporary password, and `https://continuumrtw.com/hub`.

None of those three include diagnosis, restriction, or score. Access invite includes role and legal name.

### Backups

Where: Supabase managed, project `agzhnmunodrhsjbogzae`. Region of copies: UNVERIFIED.
Who can restore: members of org `jghzileidjxrbfyffkie`. Member roster UNVERIFIED.
Restore ever tested: UNVERIFIED. No restore-test record in repo.

---

## SECTION 4. SCHEMA AND CODE CENSUS

Three code streams, one live database.

1. Live-platform / hub stream: `supabase/migrations`, `supabase/functions`, `deploy/`, `hub-roles/`. Craig original numbering (Prompts 10, 27-29, 33, 34). Schema `public`.
2. Physician stream: `clinical/db`, `clinical/engine`. Unified Prompts 39-46 and later. Schema `clinical`. Applied live.
3. Platform foundations: `platform/db` (unified Prompt 51). Schemas `tenancy`, `consent`, `employer`, `audit`, `events`, `config`, `platform`. Versions 0000-0016 applied live. 0017-0019 exist in the repo and are not in `platform.schema_migration`.
4. Clinician fork schema `clinician.*`: applied live (`clinician_001`-`009`). Archive README calls the fork unused. Rows exist.
5. Worker schema `worker.*`: applied live (20260915* migrations).

Public schema rows below are `count(*)` from the Athena live-fill re-verify on 2026-09-19. Other schemas still use `approx` where only `n_live_tup` was taken. RLS is `pg_class.relrowsecurity`.

Flag definitions used for the public census (Athena live fill, then re-verified from `information_schema.columns` before any VERIFIED claim):
- tenantish: any of `tenant_id`, `organisation_id`, `organization_id`, `org_id`, `clinic_id`.
- provenanceish: any of `created_by`, `authored_by`, `provenance`, `actor_id`, `updated_by`.
- `approved_by` on `hub_profiles` is not in that provenanceish set, so the flag is false.

### 4.1 public (hub / Craig live platform)

26 tables. Format: name | rows (`count(*)`) | rls | has_tenantish_col | has_provenanceish_col. Matching column names from `information_schema` are in the notes column.

| name | rows | rls | has_tenantish_col | has_provenanceish_col | matching cols |
|---|---|---|---|---|---|
| tenants | 1 | true | false | false | none (`tenants` is the tenant) |
| users | 6 | true | true | false | tenant_id |
| workers | 1 | true | true | false | tenant_id |
| injuries | 1 | true | true | false | tenant_id |
| recovery_logs | 0 | true | true | false | tenant_id |
| light_duties | 0 | true | true | false | tenant_id |
| wcb_notifications | 1 | true | true | false | tenant_id |
| escalations | 0 | true | true | false | tenant_id |
| consents | 1 | true | true | false | tenant_id |
| access_grants | 2 | true | true | false | tenant_id |
| audit_log | 38 | true | true | true | tenant_id, actor_id |
| wearable_data | 0 | true | true | false | tenant_id |
| case_metrics | 0 | true | true | false | tenant_id |
| province_form_codes | 13 | true | false | false | none |
| status_transitions | 6 | true | false | false | none |
| auto_actions | 0 | true | true | false | tenant_id |
| escalation_keywords | 5 | true | false | false | none |
| escalation_checks | 0 | true | true | false | tenant_id |
| notifications | 0 | true | true | false | tenant_id |
| framer_demo_state | 1 | true | false | false | none |
| access_codes | 2 | true | false | false | none |
| access_log | 125 | true | false | false | none |
| hub_profiles | 3 | true | false | false | none (`approved_by` is not in the provenanceish set) |
| marketing_leads | 1 | true | false | false | none |
| public_assessment_response | 0 | true | false | true | provenance |
| opportunity_weights | 6 | true | false | false | none |

Athena `list_tables` verbose and `pg_stat_user_tables.n_live_tup` both reported `marketing_leads` = 2. `SELECT count(*) FROM public.marketing_leads` on the same project returned 1. Prompt 65 already named this list_tables versus count(*) drift. This report prefers count(*). The 2 is an estimate, not a VERIFIED row count.

`auth.users` count(*) 7 (one more than `public.users`).

Live views (not tables; listed because Section 5 walks them): `employer_case_view`, `hse_case_view`, `wcb_officer_view`, `active_consent_view`, `audit_admin_view`, `ops_*` views.

### 4.2 clinical (physician stream)

| Table | count | tenant/org | RLS | provenance |
|---|---|---|---|---|
| ai_audio_retention | approx 1 | no | no | no |
| ai_runtime | approx 1 | no | no | no |
| band_derivation_audit | approx 0 | organisation_id | yes forced | no |
| clinic | approx 0 | organisation_id | yes forced | no |
| clinic_batch_schedule | approx 0 | organisation_id | yes forced | no |
| consent | approx 0 | organisation_id | yes forced | no |
| form_definition | approx 10 | no | yes | no |
| form_element | approx 816 | no | yes | no |
| form_rule | approx 333 | no | yes | no |
| functional_axis_map | approx 60 | no | yes | no |
| functional_axis_value | approx 0 | organisation_id | yes forced | created_by (not named provenance) |
| functional_clinical_context | approx 0 | organisation_id | yes forced | no |
| functional_environment | approx 0 | organisation_id | yes forced | no |
| functional_grasping | approx 0 | organisation_id | yes forced | no |
| functional_measurement | approx 0 | organisation_id | yes forced | created_by |
| functional_reaching | approx 0 | organisation_id | yes forced | no |
| internal_restriction | approx 0 | organisation_id | yes forced | no |
| internal_restriction_code | count(*) 8 | no | yes | no |
| jurisdiction | approx 14 | no | yes | no |
| jurisdiction_deadline | count(*) 5 | no | no | no |
| legacy_restriction_label | approx 0 | organisation_id | yes forced | no |
| measurement_draft | approx 0 | organisation_id | yes forced | no |
| practitioner | approx 0 | no | no | no |
| statutory_holiday | approx 11 | no | yes | no |
| wcb_capability_code_set | approx 58 | no | yes | no |
| wcb_case | approx 0 | organisation_id | yes forced | no |
| wcb_code_list | approx 27 | no | yes | no |
| wcb_code_value | approx 610 | no | yes | no |
| wcb_contract_role | approx 15 | no | yes | no |
| wcb_contract_role_form | approx 68 | no | yes | no |
| wcb_error_catalogue | approx 1 | no | yes | no |
| wcb_fee_schedule | approx 9 | no | yes | no |
| wcb_hl7_wire_map | approx 678 | no | yes | no |
| wcb_obx_skeleton | approx 521 | no | yes | no |
| wcb_pob_noi_forbidden | approx 380 | no | yes | no |
| wcb_report | approx 0 | organisation_id | yes forced | no |
| wcb_report_field | approx 0 | organisation_id | yes forced | yes provenance |
| wcb_submission | approx 0 | organisation_id | yes forced | no |
| worker | approx 0 | organisation_id | yes forced | no |

### 4.3 clinician (fork, live rows)

| Table | count | tenant/org | RLS | provenance |
|---|---|---|---|---|
| audit_log | approx 4 | no | yes | no |
| axis_def | approx 75 | no | yes | no |
| band_threshold | approx 5 | no | yes | no |
| case_file | approx 2 | no | yes | no |
| clinic | approx 1 | no | yes | no |
| code_list | approx 39 | no | yes | no |
| consent | approx 0 | no | yes | no |
| employer | approx 2 | no | yes | no |
| employer_view | count(*) 1 | no | yes | no (duty arrays only: safe/conditional/excluded) |
| fee_tier | approx 3 | no | yes | no |
| forbidden_pair | approx 2 | no | yes | no |
| form_definition | approx 5 | no | yes | no |
| form_element | approx 75 | no | yes | no |
| jurisdiction | approx 3 | no | yes | no |
| jurisdiction_fee_config | approx 1 | no | yes | no |
| measurement | approx 1 | no | yes | no |
| practitioner | approx 1 | no | yes | no |
| prescription | count(*) 0 | no | yes | no |
| referral | approx 0 | no | yes | no |
| rejection_item | approx 0 | no | yes | no |
| rejection_map | approx 4 | no | yes | no |
| report | approx 3 | no | yes | no |
| report_field | count(*) 39 | no | yes | yes provenance |
| report_output | approx 0 | no | yes | no |
| report_section | count(*) 1 | no | yes | yes provenance |
| staff | approx 3 | no | yes | no |
| statutory_holiday | approx 2 | no | yes | no |
| submission | approx 0 | no | yes | no |
| worker | approx 2 | no | yes | no |

### 4.4 worker schema

| Table | count | tenant/org | RLS | provenance |
|---|---|---|---|---|
| worker_account | approx 3 | no | yes | auth_user_id unique |
| check_in | approx 1 | no | yes | no |
| check_in_answer | approx 1 | no | yes | no |
| consent | approx 3 | no | yes | no |
| case_invite | approx 0 | no (email column) | yes | no |
| companion_memory | approx 1 | no | yes | no |
| deployment_flag | approx 3 | no | yes | no |
| psych_capture | approx 0 | no | yes | no |
| movement_observation | approx 0 | no | yes | no |
| audit_log | count(*) 7 | no | yes | no |
| case_pathway | count(*) 1 | no | yes | no |
| operational_signal | count(*) 2 | no | yes | no |
| private_comment | count(*) 1 | no | yes | no |

### 4.5 platform / tenancy / consent / employer / audit / events / config

| Table | count | tenant/org | RLS | provenance |
|---|---|---|---|---|
| tenancy.organisation | count(*) 0 | is the org | yes forced | no |
| tenancy.region | approx 0 | organisation_id | yes forced | no |
| tenancy.location | approx 0 | organisation_id | yes forced | no |
| consent.ledger_entry | count(*) 0 | organisation_id | yes forced | captured_by, witnessed_by, text_version_id |
| consent.text_version | approx 0 | no | yes | approved_by |
| employer.published_restriction_set | approx 0 | organisation_id | yes forced | no |
| employer.duty_match_line | approx 0 | organisation_id | yes forced | no |
| employer.disclosure_release | approx 0 | organisation_id | yes forced | no |
| audit.record | approx 0 | organisation_id | yes forced | no |
| audit.event | approx 0 | organisation_id | yes forced | no |
| audit.ai_generation | approx 0 | organisation_id | yes forced | no |
| events.domain_event | approx 0 | organisation_id | yes forced | no |
| events.outbox | approx 0 | organisation_id | yes forced | no |
| events.subscription | approx 0 | organisation_id | yes forced | no |
| config.feature_flag | approx 0 | no | yes | no |
| config.feature_flag_rule | approx 0 | organisation_id | yes forced | no |
| config.value | approx 0 | organisation_id | yes forced | no |
| config.definition | approx 0 | no | yes | no |
| platform.schema_migration | count(*) 17 | no | no | no |

### 4.6 Managed platform schemas (not Continuum product tables)

Listed so "every table" is not silently dropped. Tenant/provenance: no Continuum tenant column unless noted. Counts are `n_live_tup`.

- `auth.*`: users 7, identities 4, sessions 29, refresh_tokens 29, schema_migrations 82, plus empty MFA/OAuth/SAML/WebAuthn tables. RLS mixed (GoTrue managed).
- `storage.*`: buckets 3, objects 2, migrations 68, plus empty multipart/vector tables. RLS yes.
- `cron.job` 4, `cron.job_run_details` 0. RLS yes.
- `net._http_response` approx 1080, `net.http_request_queue` 0. RLS no.
- `vault.secrets` 1. RLS no.
- `supabase_migrations.schema_migrations` 31. RLS no.
- `realtime.schema_migrations` 83. RLS no.

Public 26-table `count(*)` is done. Hook for a later exact count(*) pass on every remaining `approx` row (other schemas): a single read-only `count(*)` sweep. No schema change required.

### 4.7 Authentication and role model (Prompt 33)

Live enum `public.user_role`: `worker`, `hse`, `employer_admin`, `wcb_officer`, `nexus_physician`, `ops_admin`. VERIFIED (`pg_enum`). `foundation_core.sql` originally listed five; `ops_admin` was added later.

Live role counts on `public.users` (counts only, Athena census): `employer_admin` 1, `hse` 1, `nexus_physician` 1, `ops_admin` 1, `wcb_officer` 1, `worker` 1. VERIFIED.

Where roles are stored:
- `public.users.role` (Prompt 33 product roles).
- JWT claims `jwt_role()` / `jwt_tenant_id()` in foundation migrations (server RLS).
- `public.hub_profiles.status`, `access_group`, `role_label` (hub cookie gate). 3 rows, all status approved. `access_group` values not selected this pass.
- `ADMIN_EMAILS` allowlist in `deploy/api/_hub_session.js` (emails stored in source; values not copied here).
- Prompt 51 DB roles `app_clinical`, `app_employer`, `app_release`, `app_readonly`, `migrator` exist live as nologin roles. VERIFIED (`pg_roles`, Athena). These are connection roles, not visitor roles.

Where authorisation is enforced:
- Server: Postgres RLS on `public.*` and later schemas; role views; `security_invoker=false` views as described in the view migrations.
- Server: Vercel Edge middleware `decideSiteAccess` (`ct_site`) then `decideHubAccess` (`ct_session` group). `deploy/middleware.js`.
- Server: `deploy/api` hub-signin, hub-signup, hub-admin, admin-users, site-access, site-codes-admin.
- Client: hub and portal HTML hide/show UI. Not a substitute for RLS or middleware.
- Both: yes. The field firewall for employer/hse/wcb is server RLS/views. The portal URL firewall is Edge middleware. `/worker` is not site-gated.

| Route | Guard | Live unauthenticated result |
|---|---|---|
| `/`, `/hub`, `/employer-dashboard`, `/api/health-live`, `/api/status` | SITE gate (`ct_site`). Holding HTML if no cookie | HTTP 200 holding page (Athena). VERIFIED |
| `/hse-portal`, `/worker-dashboard` | SITE then HUB group1 (`middleware.js:114`) | Code VERIFIED. Live HTTP with a hub cookie UNVERIFIED |
| `/clinical-dashboard`, `/wcb-portal`, `/sigma-portal`, `/sigma-panel`, `/sigma-crtw-connection` | SITE then HUB group2 (`middleware.js:115`) | Code VERIFIED. Live HTTP UNVERIFIED |
| `/admin-portal`, `/admin-hub-users`, `/admin-site-codes` | SITE then HUB admin (group admin AND email in `ADMIN_EMAILS`) | Code VERIFIED. Live HTTP UNVERIFIED |
| `/worker-embed` | SITE then any hub session (`middleware.js:121`) | Code VERIFIED |
| `/worker` and `/worker/*` | Public (`ALWAYS_PUBLIC_BOUNDED_PREFIX`) | HTTP 200 worker index, meta refresh to `login.html` (Athena). VERIFIED |
| `/assessment` | Public | HTTP 200, not holding (Athena). VERIFIED |
| `/privacy`, `/terms`, `/book` | Public | privacy HTTP 200 (Athena). VERIFIED |
| `/api/site-access`, `/api/marketing-lead` | Public exact | holding page posts to these. VERIFIED in HTML |
| `/api/hub-signin`, `/api/hub-signup` | SITE gated; missing cookie returns JSON `SITE_ACCESS_REQUIRED` 403 | Code VERIFIED. Live JSON UNVERIFIED (not POSTed) |

Hub auth historically UNVERIFIED: this pass verifies the code, env key names, 3 approved `hub_profiles`, and 7 `auth.users`. A successful email/password sign-in was not exercised. Login outcome remains UNVERIFIED.

`SITE_GATE_ENABLED` is present as a production env key. Live `/` returns holding, so the gate is ON (value is not the literal `false`). VERIFIED by behavior.

Prompt 33 versus unified Prompt 51: both exist live. `tenancy.organisation` count(*) 0. `public.tenants` count(*) 1. Hub and worker traffic still use the Prompt 33 + cookie model. Prompt 51 `app_*` roles exist but nologin. Unreconciled. No claim is made here about which should win.

### 4.8 Consent (Prompt 10) and Prompt 51 ledger

Two models coexist.

Prompt 10 / live-platform `public.consents`. Quoted from `supabase/migrations/20260717120000_foundation_core.sql:185-196` and confirmed live via `information_schema`:

```
public.consents (
  id uuid PK default gen_random_uuid(),
  tenant_id uuid not null,
  user_id uuid not null,
  version text not null,
  scope jsonb not null default '{}',
  granted_at timestamptz not null default now(),
  revoked_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
)
```

Not a bare boolean. Has wording `version`, `scope`, `granted_at`, `revoked_at`. Actor is `user_id` (the subject), not a separate capturer. Mutable: `updated_at` exists; revocation is in-place `revoked_at`. Live count(*) 1.

Prompt 51 `consent.ledger_entry` (`platform/db/0004_consent.sql`), live columns match, count(*) 0:

id, organisation_id, location_id, subject_person_id, purpose, action (granted/refused/revoked/expired/superseded), text_version_id, scope_recipient, scope_data_classes, captured_by, capture_method, witnessed_by, captured_at, effective_from, effective_to, superseded_by_id, evidence_ref, created_at.

This is an append-only ledger with wording version (`text_version_id`), timestamp, actor (`captured_by`), and scope. `consent.text_version` approx 0.

Also present: `clinical.consent` 0, `clinician.consent` 0, `worker.consent` approx 3.

### 4.9 Modules 27, 28, 29: measured value versus band/label

Yes/no census. Not a judgement.

Live-platform `public` stream:
- `injuries.current_restrictions`: text. Band/label (free text). Not a measured value with unit.
- `injuries.body_part`: text. Category/label.
- `injuries.injury_type`: text. Category/label.
- `injuries.severity`: enum minor/moderate/major. Category.
- `injuries.prognosis_days`: integer days. Number + implicit day unit. Not a functional capacity axis.
- `injuries.diagnosis_notes`: text. Narrative, not a measurement.
- `recovery_logs.pain_score`: integer 1 to 10. Score/band, not kg or hours.
- `recovery_logs.mobility_score`: integer 1 to 10. Score/band.
- `light_duties.task_description`: text. Label.
- `light_duties.medical_restrictions`: text. Label.
- `wearable_data.metric`: text check (hrv, strain, recovery, hr). Category key.
- `wearable_data.value`: numeric. Number without a unit column (unit implied by metric).
- `case_metrics.value`: numeric with metric label. Number + metric name, not a clinical functional axis.

Physician stream columns exist on the live project and currently hold 0 measurement rows:
- `clinical.functional_axis_value.measured_hours`: measured value + hours.
- `clinical.functional_axis_value.measured_weight_kg`: measured value + kg.
- `clinical.functional_axis_value.derived_band`: derived band/label.
- `clinical.functional_measurement.work_hours_per_day`: measured hours.
- `clinical.functional_measurement.fit_for_work`: band/label.
- Environment / grasping / reaching / internal_restriction / legacy_restriction_label: categories, booleans, or labels.

Census result: the Craig 27-29 live-platform columns store labels and 1-10 scores (and wearable numeric + metric name). They do not store kg/hours functional-capacity measurements. The physician-stream columns that do store kg/hours exist on the live project and currently hold 0 rows.

### 4.10 Worker identity

Several person tables, not one.

- `auth.users` (7)
- `public.users` (6), unique on phone only. email not unique.
- `public.workers` (1), FK to users, no unique on `user_id` in the constraint dump.
- `clinical.worker` (0), columns include `phn`, phone parts, `organisation_id`. No unique on `phn`.
- `clinician.worker` (2), pkey only.
- `worker.worker_account` (3), unique on `auth_user_id`.
- `hub_profiles` (3), email column, uniqueness UNVERIFIED.

Keyed on: phone (unique on `public.users` only). Email present, not unique on `public.users`. Health number: `clinical.worker.phn` exists, not unique, 0 rows. Claim number: `clinical.wcb_case.claim_number`, `clinician.case_file.claim_number`, `public.wcb_notifications.wcb_claim_number`. Not an identity key for a person.

Can the same human exist twice? Yes, structurally. No Master Person Index table was found. Phone unique only inside `public.users`, and phone is nullable. A person can also appear in `clinician.worker` and `worker.worker_account` without a shared key to `public.users`.

### 4.11 Prompt 34 lockdown

The Craig-original Prompt 34 removed-name list is not in this repository. `specs/CONTINUUM_PROMPT_34.md` is the chat-stream SIGMA demonstration page, not a de-identification lockdown list. Name-by-name confirmation is UNVERIFIED. Blocker: list not in hand.

What was searched:
- `deploy/*.html` for `$` + digit: hits exist (see Section 5 / Argus). Prior 2026-08-13 "zero dollar hits" claim is REFUTED.
- `million-CAD` / `million CAD`: zero hits in product HTML, JS, and migrations. VERIFIED (Argus grep).
- `Worley`: zero in deploy HTML/JS. Present in `supabase/seed.sql` and comments. VERIFIED.
- `Garda`: present in `deploy/CONTINUUM_38A_GARDA_CONFIG_MODULE.js` filename and header. VERIFIED.
- `deploy/lockdown-guard.test.mjs` bans `nexus`, `worley`, `nx-` prefix, `predict` on the served deploy bundle. That is a scrub list, not labeled "Prompt 34 removed names".
- `deploy/terms.html` contains the phrase `one hundred Canadian dollars` (words, not `$`). VERIFIED (Athena).

---

## SECTION 5. THE BLOCKING PRIVACY QUESTION

**Answer: not none.** Clinical content is reachable on at least one employer-adjacent surface.

### URGENT FINDING

**URGENT.** Employer-adjacent HSE HTML contains diagnosis, symptom scores, and clinical narrative. Do not fix it in this mission.

HSE is an employer-organization role (`user_role` includes `hse` next to `employer_admin`). Hub group1 serves `/hse-portal` with `/employer-dashboard` (`deploy/middleware.js:114`). The HSE page is static demo data. It does not call the SQL views. Anyone with a group1 hub session can open it.

| File | Line | Exact string | Why it meets Section 5 |
|---|---|---|---|
| `deploy/hse-portal.html` | 148 | `"injury": "Right shoulder, grade 1 supraspinatus strain"` | Diagnosis on an employer-adjacent dashboard |
| `deploy/hse-portal.html` | 148 | `"injury": "L4-L5 lumbar disc"` | Diagnosis / clinical naming |
| `deploy/hse-portal.html` | 148 | `"note": "Recovering from a grade 1 supraspinatus strain. Duties must not involve elevation of the right arm above the chest plane. Breaks every 60 minutes."` | Clinical narrative |
| `deploy/hse-portal.html` | 148 | `"note": "Stalled at week 3. Imaging and a barrier screen under consideration."` | Clinical narrative |
| `deploy/hse-portal.html` | 148 | `"pain": [7, 7, 6, 6, 5, 5, 4, 4]` and `"mob": [3, 3, 4, 4, 5, 6, 6, 6]` | Symptom / mobility scores |
| `deploy/hse-portal.html` | 245 | `<th>Injury</th>...<th>Pain trend</th><th>Mobility</th>` | Symptom columns on the case queue |
| `deploy/hub/index.html` | 158 | `Recovery scores visible.` | Hub employer-adjacent card advertises scores |
| `deploy/store.js` | 64-65 | `diagnosis_summary: 'Grade 1 supraspinatus strain, right shoulder'` and `diagnosis_notes: 'Moderate supraspinatus strain. Conservative management. Reassess day 14.'` | Diagnosis in a site-gated bundle (`/store.js` is not hub-group locked) |

CONTEXT, not a close: `zeus-missions.md` records Gary 2026-07-20 keep-as-is for HSE injury-type naming and the employer Injury column. G1 asks field reachability, not whether that copy was later kept. The fields above remain reachable.

No fix. No migration. No proposal.

### Method

1. Listed every surface an employer role can reach: HTML dashboards, hub cards, API routes, SQL views, exports, SMS/email templates, bridge payloads.
2. Walked each against live view columns (`information_schema.columns` on `employer_case_view` and `hse_case_view`) and against source HTML/JS.
3. Distinguished `employer_admin` vs `hse` vs hub group1 vs physician-stream `employer.*`.
4. Did not read live case row contents.

### SQL views: live columns (P56 is applied)

The 2026-08-13 prior claim said `employer_case_view` exposes `body_part`, `injury_type`, `severity`, `current_restrictions`, and HSE also `latest_pain_score` / `latest_mobility_score`. That matched `20260717160000_role_case_views.sql` then.

Live `information_schema` on 2026-09-19 shows both views have the same columns:

`injury_id, tenant_id, worker_id, worker_name, job_title, status, date_of_injury, days_injured, next_review, current_restrictions, restrictions_effective_date, rtw_obligation_frame, province`

No `body_part`, `injury_type`, `severity`, `latest_pain_score`, or `latest_mobility_score`. VERIFIED (live columns). That matches `supabase/migrations/20260815140000_employer_hse_views_p56_firewall.sql`. The 2026-08-13 view-column claim is REFUTED on current source and on the live project.

`current_restrictions` remains free text on both views. `status` can be `escalated`. P56 names both as residual risk. Safety of `current_restrictions` is write discipline, not column type.

`wcb_officer_view` still has `body_part`, `injury_type`, `latest_pain_score`, `latest_mobility_score`. VERIFIED (live columns). `wcb_officer` is a board role, not an employer role.

Base PHI tables remain denied to `employer_admin` and `hse` (`foundation_core.sql` `continuum_injury_access` else false). VERIFIED (source).

`clinician.employer_view` live columns are `id, case_id, safe_duties, conditional_duties, excluded_duties, applies_until, next_reassessment, published_at`. Duty arrays, not diagnosis. count(*) 1. Row contents not read.

`employer.disclosure_release.payload` is jsonb with no SQL check that the JSON is duties-only. count approx 0.

### Employer HTML (`deploy/employer-dashboard.html`)

Hardcoded injuries are body-area / duty-limit naming (`Right shoulder`, `Lower back`). Table header is `Duty limit area`. Restrictions are mostly duty statements. One string mixes a clinical finding with a duty: `Limited range of motion, no long-distance driving`. No pain column. No medication. Export PDF reprints the same fields.

Bridge (`deploy/bridge.js:11-13`) allowlist includes `injury`, `restr`, `prognosisDays`, `escalated`. Pain, mobility, notes, diagnosis keys are not on the allowlist. Employer dashboard renders `injury` and `restr` from the live feed. Worker embed writes `injury:"Right shoulder strain"`.

### Notifications and audit

`notifications.body` is readable by `employer_admin` in tenant. Escalation writer can put `pain trending high for 3 check-ins` (`escalation-engine/index.ts:55`). Live `notifications` count approx 0.
`audit_log.action` is readable by `employer_admin`. Intake can write severity into the action text (`cases/index.ts:194`). Live `audit_log` approx 38. Action text contents were not read.

### Medication

No medication column on live-platform views, employer HTML, HSE HTML, bridge allowlist, or hub APIs. `clinician.prescription` count(*) 0. VERIFIED (source and count).

### Role distinction

| Role | Employer-facing? | Clinical fields reachable |
|---|---|---|
| `employer_admin` | Yes | View: `current_restrictions`, `status` (incl. escalated). HTML: body-area naming, restriction text, live `injury` from bridge. Notifications / audit text. No pain column on the employer HTML table |
| `hse` | Employer-adjacent operational seat | View (live P56): same as employer. **HTML: diagnosis, pain, mobility, clinical notes (URGENT)** |
| Hub group1 session | Can open both HTML seats | HSE clinical demo is one click from the same group |
| `wcb_officer` | Board, not employer | `wcb_officer_view` still has injury type, body part, pain, mobility |
| `app_employer` | Platform stream | Restriction set and disclosure payload. Live rows 0 |

Gary 2026-08-15 (P56 header): authorized override of Prompt 07.4 and the client MVP HSE ruling; **SQL** HSE scores revoked. **HTML HSE was not brought into line with that view.** That split is the finding.

---

## SECTION 6. CHANGE AND CONFIGURATION PATH

### How a code change reaches production

1. Branch: `main`. VERIFIED (Vercel production `githubCommitRef` `main`).
2. Review: UNVERIFIED as a required gate. Branch protection API 403. History shows PR merge messages on production deploys.
3. Deploy trigger: Vercel Git integration. Push or merge to `main` creates a production deployment (`source: git`). Feature branches create preview deployments (`target` null). VERIFIED (`list_deployments`).
4. Root Directory: `deploy/` (middleware and package comments; no root `vercel.json`). Framework preset Other / `framework` null. VERIFIED.
5. Database migrations: not applied by Vercel. Applied out of band to the live Supabase project. CI uses throwaway `postgres:15` and does not touch the live project. VERIFIED (workflow files; `list_migrations` timestamps).
6. Rollback: Vercel production deploys have `isRollbackCandidate` true. Instant rollback in the Vercel UI is the available product path. Whether it has been used: UNVERIFIED. DB rollback: platform downs exist from 0019 onward in repo; live is only through 0016. No tested restore record.

### Environments

| Environment | Compute | Data |
|---|---|---|
| Vercel production | `www.continuumrtw.com`, `iad1` | Same Supabase project `agzhnmunodrhsjbogzae` |
| Vercel preview | `*.vercel.app`, SSO protection `all_except_custom_domains` | Same DB keys: `POSTGRES_URL` and `SUPABASE_SERVICE_ROLE_KEY` target includes preview. Preview CAN reach production data. VERIFIED (`filter_project_envs` targets, names only) |
| Vercel development | local / vercel dev | Encrypted postgres and supabase keys targeted development |
| Custom env `supabaseaccesstoken` | no domains | key `supabase_access_token` |
| Supabase branch | `list_branches` returned only `main`, `with_data` false | No separate preview database. VERIFIED |
| GitHub Actions | throwaway `postgres:15` | Does not use live data. VERIFIED source |

Does any non-prod contain production data? Preview does not hold a copy. Preview is configured with the production database credentials, so it can read and write the production project. That is a shared-data path, not a cloned environment. VERIFIED as capability. Whether anyone uses preview against live rows is UNVERIFIED.

Framer demo: `public.framer_demo_state` approx 1; cron `framer-demo-reset` daily 04:00. Demo surface exists on the same project.

### Secrets: where they live (names only)

Vercel project env keys (`filter_project_envs`, decrypt false): `FIRECRAWL`; `SIGNUP_NOTIFY_FROM`; `SIGNUP_NOTIFY_TO`; `RESEND_API_KEY`; `CONTINUUM_HUB_SESSION_SECRET`; `CONTINUUM_SITE_SESSION_SECRET`; `SITE_GATE_ENABLED`; `eleven_labs_chatbox_agent`; `SUPABASE_ACCESS_TOKEN`; `POSTGRES_URL`; `POSTGRES_PRISMA_URL`; `POSTGRES_URL_NON_POOLING`; `POSTGRES_PASSWORD`; `POSTGRES_USER`; `POSTGRES_HOST`; `POSTGRES_DATABASE`; `SUPABASE_SERVICE_ROLE_KEY`; `SUPABASE_JWT_SECRET`; `SUPABASE_SECRET_KEY`; `SUPABASE_ANON_KEY`; `SUPABASE_URL`; `SUPABASE_PUBLISHABLE_KEY`; `NEXT_PUBLIC_SUPABASE_ANON_KEY`; `NEXT_PUBLIC_SUPABASE_URL`; `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; `supabase_access_token`.

Absent from that list (relevant): `CONTINUUM_PRODUCTION_SUBMISSION`, `CONTINUUM_ALLOW_BOARD_SUBMISSION`, `MYWCB_USERNAME`, `MYWCB_PASSWORD`, `CONTINUUM_REGION`, `VERCEL_REGION`, AWS keys, TWILIO keys.

Supabase Vault: `continuum_worker_secret` (1).

Git history secret-like paths (paths only, no values):
- `worker-app/.env.local.example`
- `platform/service/secrets.mjs`
- `clinical/engine/credential.mjs`
- `clinical/engine/credential.test.mjs`

No `*.pem` or `id_rsa` in history. A full entropy scan of every historical blob was not run. UNVERIFIED completeness of history scan.

### How configuration is changed

- Site and portal code: git on `main`, then Vercel auto deploy. Record: git history and Vercel deployments.
- Env vars: Vercel project settings (human). Last editor display name `craigwolf75-5699`. No in-repo record of values.
- Database schema: out-of-band apply to Supabase (MCP/CLI/dashboard). Record: `supabase_migrations` and `platform.schema_migration`. Who applied: UNVERIFIED.
- Feature flags: `config.feature_flag` approx 0. No live flag UI confirmed.
- Access codes: `public.access_codes` (2) via admin-site-codes surface (SITE+admin gated).
- Hub approvals: `public.hub_profiles` via admin-hub-users.
- Opportunity weights: `public.opportunity_weights` approx 6. Whether UI or SQL: UNVERIFIED.
- Cron: four jobs active. Changing them is a SQL/dashboard act. Record: `cron.job`.

---

## CLOSING LIST 1: CONFLICTS CONFIRMED

Against the six conflicts in Prompt G1 Section 1:

1. **Stack and residency (Azure vs Supabase/Vercel/Twilio).** CONFIRMED at the stack level. The live platform is Supabase + Vercel + Resend + planned Twilio, not Azure. VERIFIED (Section 2). Residency is mixed: Supabase project `ca-central-1` is CANADA VERIFIED (`get_project.region`); Vercel compute is NOT CANADA for the production deploy region list (`iad1` via `get_deployment`); `deploy/vercel.json` does not pin a function region; Resend is NOT CANADA; Supabase Edge Function execution region is UNVERIFIED.
2. **Prompt 33 auth/role model vs unified Prompt 51.** CONFIRMED. Live visitor roles are `public.users.role` plus hub cookies. Prompt 51 org/region/location tenancy and `app_*` nologin roles exist with zero organisations. Unreconciled. Evidence: `pg_enum` `user_role`; `tenancy.organisation` count(*) 0; `platform.schema_migration` 17.
3. **Prompt 10 consent vs Prompt 51 ledger.** CONFIRMED. Live `public.consents` is a mutable versioned record with in-place `revoked_at`. Prompt 51 `consent.ledger_entry` exists with 0 rows. Evidence: `foundation_core.sql:185-196`; `consent.ledger_entry` count(*) 0.
4. **Prompts 27 to 29 measurement vs band one-way door.** CONFIRMED as a census fact: live condition modules store restriction labels (`injuries.current_restrictions` text) and 1 to 10 scores, not kg/hours measurements. Physician-stream kg/hours columns exist and hold 0 rows. Whether that violates the door is Craig's judgement.
5. **Clinical content on an employer-facing surface.** CONFIRMED. HSE HTML carries diagnosis, pain, mobility, and clinical narrative (URGENT). Live SQL views no longer expose those columns (P56 applied). Hub group1 can open the HSE seat. See Section 5.
6. **No documented path to production.** CONFIRMED (partial). The path is reconstructable from live deploy metadata (main -> Vercel git; migrations out of band; five GitHub workflows) but is not a standing operator document. Review gate, rollback use, and restore test remain UNVERIFIED.

---

## CLOSING LIST 2: EVERYTHING UNVERIFIED, AND WHAT WOULD UNBLOCK IT

1. Vercel plan/tier. Unblocks with team-scoped `get_team` or the Vercel dashboard.
2. Branch protection and required reviewers. Unblocks with GitHub admin read (API 403 here).
3. Credentialed hub login outcome. Unblocks with a Craig-named test account. Do not invent credentials.
4. `hub_profiles.access_group` values and email uniqueness. Unblocks with a schema/constraint query (values need not be copied if they are emails).
5. Exact `count(*)` for every non-public row still marked `approx` (clinical, clinician, worker, platform-adjacent). Public 26-table `count(*)` is now VERIFIED. Unblocks with a read-only count sweep. Hook left for Athena.
5a. Vercel named project-level function region setting. `deploy/vercel.json` has no `regions` key (VERIFIED). `get_project` payload has no function-region field. Unblocks with a dashboard screenshot of the project Function Region control, or an API field that names it.
6. SYNTH prefix on `clinician.*` and `worker.*` name columns. Unblocks with count-only ILIKE, not row dump.
7. Storage object names and which bucket holds the 2 objects. Skip if names encode a person.
8. Edge Function execution region string. Unblocks with Supabase dashboard or function logs.
9. Storage bucket region string if Supabase exposes one.
10. Backup copies region, PITR on/off, restore test date, org member list.
11. Resend send logs (whether any email left the host).
12. Whether the ElevenLabs widget is mounted on any live public page besides `presenter.js`.
13. Whether `FIRECRAWL` has ever been invoked (runtime logs).
14. Craig Prompt 34 removed-name list. Name-by-name lockdown stays UNVERIFIED without it.
15. `public.workers.user_id` uniqueness (FK without UNIQUE in the constraint dump).
16. Content of `clinical.ai_runtime` (count 1; do not read if it can carry case data).
17. Registrar account behind Squarespace NS.
18. Whether anyone uses Vercel preview against live rows (capability is VERIFIED; use is UNVERIFIED).
19. Whether live `audit_log.action` already holds clinical text (38 rows; contents not read).
20. Whether a human sent the Bedrock GO packet outside this repo.

---

End of report. No stack decision is proposed. No migration is begun. Nothing found was fixed. The audit stops here, per Prompt G1 Section 7.
