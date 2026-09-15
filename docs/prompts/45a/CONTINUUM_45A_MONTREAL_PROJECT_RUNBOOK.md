# CONTINUUM 45A: Montreal clinical project runbook

Paste-ready runbook for the dedicated Continuum clinical Supabase project in Canada Central (`ca-central-1`, Montreal). Gary applies by hand. Claude never applies to a live project.

Status of this 45a run: no Montreal clinical project exists. The existing site project `agzhnmunodrhsjbogzae` is not this project. Do not pretend one exists.

No em dashes and no en dashes. A missing region is UNKNOWN, never 0, and is a stop.

Proposed occupational data never seeds without line-by-line sign-off. This runbook does not seed proposed occupational data.

## 0. Standing facts (read before either path)

1. The Continuum site / hub project already on main is `agzhnmunodrhsjbogzae`. That project is not the clinical Montreal project. Do not reuse its URL, its anon key, its service role, or its dashboard session as if they were clinical credentials.
2. Identifiable Canadian worker data must reside in Canada. Prompt 39 prerequisite 7 requires the database project region to be recorded. If the region is not `ca-central-1`, STOP.
3. Claude never applies SQL to a live Continuum Supabase project. Gary applies by hand via the dashboard SQL editor or the Management API. This runbook names the real filenames in `clinical/db/`.
4. Schema 021 and 022 exist on main and remain HELD (human gate, Prompt 45). Do not apply them in 45a. Do not widen Prompt 45 to Ontario or BC provincial packs.
5. Production submission stays disabled (`clinical/engine/submission_gate.mjs`). Creating a project does not enable board transmit.
6. Access tokens never go in git, never go in chat, never go in Olympus. A token that has appeared in chat is burned: rotate it.
7. This 45a run does not create a project, does not retry a connected create, does not apply migrations, and does not run advisors. There is no project to advise.

## 1. Path A: connected integration path (attempted, not approved, not retried)

### 1.1 What happened in the originating 45a session

The originating 45a session attempted the connected integration path (the in-session Supabase project-create tool). The tool call reached a permission prompt. No approval was received. No organization was created. No project was created. No project reference exists to record.

### 1.2 What this follow-on run does

This follow-on run does not retry create. State that honestly: awaiting Gary approval. Retrying a connected create without that approval would be inventing a project the human gate has not opened.

### 1.3 If Gary later approves the connected path

The connected path must still land in all of the following. If any item fails, STOP.

1. Region: Canada (Central) / `ca-central-1` (Montreal). Not `ca-west-1`. Not a US Region. Not a default the tool picks silently.
2. A new dedicated organization (or a dedicated org Gary already named for clinical), and a new dedicated project. Not a schema bolted onto `agzhnmunodrhsjbogzae`.
3. Name it clearly as the Continuum clinical Montreal project (suggested display name: `continuum-clinical-montreal`).
4. Do not reuse hub or worker credentials from `agzhnmunodrhsjbogzae`.
5. After create, follow Section 3 (the after-creation sequence). The after-creation sequence is identical for Path A and Path B.

Until Gary approves, Path A stays idle. Use Path B if Gary prefers the dashboard.

## 2. Path B: ten minute dashboard path (Gary)

Do this in the Supabase dashboard, not in chat, not in Claude Code, not in a 45a agent turn.

### 2.1 Organization

1. Sign in to the Supabase dashboard as Gary.
2. If a dedicated clinical organization already exists, use it. If it does not, create a new organization. Suggested name: `Continuum Clinical`.
3. Do not create the clinical project under an organization that is only for the public site or the worker app unless Gary has already decided that sharing an org is acceptable. The project itself must still be new and dedicated.

### 2.2 Project

1. New project. Not a restore of `agzhnmunodrhsjbogzae`. Not a branch of the site project unless Gary later opens that as a separate mission (45a does not).
2. Region: Canada (Central) / `ca-central-1`. The dashboard label may read "Canada (Central)" or "Montreal". The recorded evidence string must be exactly `ca-central-1`.
3. Name it clearly. Suggested name: `continuum-clinical-montreal`.
4. Database password: generate one, store it in Gary's password manager. Do not paste it into chat. Do not commit it. Do not put it in Olympus.
5. Do not reuse hub or worker credentials (URL, anon key, service role, or dashboard login notes from `agzhnmunodrhsjbogzae`).
6. Wait until the project shows healthy. Copy the region string from the project settings page.

### 2.3 Prerequisite 7 evidence (region string)

Copy the region string exactly as the dashboard or Management API returns it. Paste it into the Prompt 39 prerequisite 7 evidence note Gary keeps outside the repo (or into an agent environment variable Gary controls). The recorded value must be exactly `ca-central-1`.

If the string is anything else (`ca-west-1`, a US Region, empty, `UNKNOWN`, or `0`), STOP. Do not apply SQL. UNKNOWN is never recorded as 0.

### 2.4 Access token (agent environment only)

1. In the Supabase dashboard, create a personal access token (or a project-scoped token if that is what Gary uses for Management API apply).
2. Put it only in the Claude Code / agent environment (local env or a secret store the agent is already allowed to read). Suggested name: `SUPABASE_ACCESS_TOKEN`.
3. Never commit the token. Never paste it into chat. Never print it in a prompt, a commit, or an Olympus line.
4. Treat a leaked token as burned: revoke and rotate.
5. Confirm `.env` / `.env.local` files that hold the token are gitignored before the file is created. `git status` must show no secret files. This repo has no root `.gitignore` today; `worker-app/.gitignore` ignores `.env.local`. Gary must not add a token file that git will see. If Gary wants a root ignore, that is a later hygiene mission, not a 45a side effect.

## 3. After-creation sequence (identical for Path A and Path B)

Do not start this sequence until a project exists and the region string is recorded. This 45a run has no project, so this sequence is not executed here. Gary executes it after create.

### 3.1 Record the region (Prompt 39 prerequisite 7)

1. Read the region from project settings or the Management API.
2. Record the string as prerequisite 7 evidence.
3. If the region is not exactly `ca-central-1`, STOP. Do not apply 001. Do not continue.

### 3.2 Token hygiene (again)

Access token stays in the Claude Code / agent environment only. Never commit secrets. Never print them. `git status` clean of secret files.

### 3.3 Migration order from the real repo filenames

Gary applies by hand. Claude never applies to a live project.

Real files live in `clinical/db/`. Use these exact names. Do not invent parallel filenames.

#### 45a apply-now sequence (Gary uses this)

Apply in this order, including seeds where listed. This matches the brief and `clinical/db/README.md`.

1. `001_migration_wcb_engine.sql`
2. `002_seed_reference_and_lookups.sql`
3. `003_seed_form_elements.sql`
4. `004_seed_form_rules.sql`
5. `005_migration_capability_code_set.sql`
6. `006_seed_capability_code_set.sql`
7. `007_migration_error_catalogue.sql`
8. `008_seed_error_catalogue.sql`
9. `009_migration_obx_skeleton.sql`
10. `010_seed_obx_skeleton.sql`
11. `016_migration_physician_foundation.sql` (MUST be after 010 and BEFORE 011)
12. `011_migration_functional_measurement_model.sql`
13. `012_seed_functional_measurement.sql`
14. `013_migration_hl7_wire_map.sql`
15. `014_seed_hl7_wire_map.sql`
16. `015_migration_employer_view.sql`
17. `017_migration_ai_provenance_and_isolation.sql`

Call out: `016_migration_physician_foundation.sql` is numbered 016 but applies after 010 and before 011. The number is historical. The dependency is not. `011` has a preflight gate that refuses to run until the physician platform foundation exists (`clinic`, `wcb_case`, `wcb_report`, `practitioner`). Applying 011 before 016 aborts.

Seeds 002, 003, 004, 006, 008, 010, 012, and 014 are part of the 45a apply-now sequence. They are generated from the files named in `clinical/db/README.md`. Do not hand edit the generated SQL in this mission.

`015_migration_employer_view.sql` creates the separate `employer` schema. There is no column there capable of holding clinical content. `case_ref` and `worker_ref` are opaque UUIDs, not cross-schema foreign keys to `clinical`.

#### Later files that EXIST and are NOT in the 45a apply-now sequence

Do not apply these in 45a unless Gary later authorizes them in a later mission.

- `018_migration_search_path_hardening.sql` (later optional, Gary authorize)
- `019_migration_functional_measurement_gap_fill.sql` (later optional, Gary authorize)
- `020_migration_ai_components_boundaries.sql` (later optional, Gary authorize)
- `021_migration_provincial_rules.sql` HELD (human gate, Prompt 45). Do not apply in 45a.
- `022_seed_provincial_rules.sql` HELD. Do not apply in 45a. Do not widen to Ontario or BC packs.

021 widens `clinical.jurisdiction` and related objects. 022 fills Alberta from sourced values and keeps BC through YT inactive with placeholder profiles and no form packs. Schema is a human gate. 45a does not decide it and does not apply it.

#### Apply-order proof line (copy after Gary applies)

Record this line in the verification note:

`001-010 (including seeds), then 016, then 011-015 (including seeds 012 and 014), then 017. 018-020 not applied. 021/022 not applied.`

### 3.4 What Gary does not apply, seed, or enable

- No proposed occupational seed. Proposed occupational data never seeds without line-by-line sign-off. `PROPOSED_OCCUPATIONAL_DATASET_V1.md` is a frame only. It is not imported by the engine. Do not replace live synth data in `clinical/db/occupational_synth.data.mjs`.
- No production submission enablement.
- No live Bedrock call.
- No Ontario or BC provincial pack.
- No edit to `package.json` or email templates.

## 4. Five item verification checklist

Gary runs this after create and after the 45a apply-now sequence. This 45a run cannot tick these boxes: no project exists.

### 4.1 Region string is exactly `ca-central-1`

Prerequisite 7 evidence recorded. The string is exactly `ca-central-1`. If it is not, STOP. Do not write UNKNOWN as 0.

Result this 45a run: not recorded. No project exists.

### 4.2 Access token hygiene

Access token is present only in the agent environment. `git status` shows no secret files. Any `.env` or `.env.local` that holds the token is gitignored. The token has never been pasted into chat.

Result this 45a run: no token created. None should be.

### 4.3 Apply-order proof

Applied: 001 through 010 (including seeds), then 016, then 011 through 015 (including seeds 012 and 014), then 017.

018 through 020: listed as later optional only if Gary authorizes in a later mission. Not applied in 45a.

021 and 022: not applied.

Result this 45a run: nothing applied. Claude did not apply. Gary has not applied. That is correct.

### 4.4 Advisors run once, findings reported in writing

After the project exists and the 45a apply-now sequence is on it, Gary (or a later authorized agent session with a token in the environment) runs the Supabase security advisor and the Supabase performance advisor once.

Findings are reported in writing. Do not silently dismiss. A finding that is accepted stays accepted in the note, with the reason. A finding that is fixed is re-run.

This 45a run does NOT run advisors because no project exists. There is nothing to query. Do not point advisors at `agzhnmunodrhsjbogzae` and call that the Montreal clinical result.

### 4.5 Smoke

After apply, confirm all of the following:

1. The `clinical` schema exists.
2. The `employer` schema exists.
3. The employer schema still has no clinical columns (no diagnosis, symptom, medication, prescription, opioid, finding, narrative, pain, and no raw measurement columns such as `measured_weight_kg`). The structural test is `clinical/engine/employer_schema.test.mjs` against `015_migration_employer_view.sql`.
4. Production submission is still disabled (`clinical/engine/submission_gate.mjs`).
5. No proposed occupational seed is present. No `PROP-POS-` rows in the database. The live synth fixture in `clinical/db/occupational_synth.data.mjs` is unchanged. Proposed occupational data never seeds without line-by-line sign-off.

Result this 45a run: smoke not run. No project exists.

## 5. Copy-paste apply list (Gary SQL editor)

Use only after Section 3.1 passes. Order is the 45a apply-now sequence. 016 sits between 010 and 011.

```
001_migration_wcb_engine.sql
002_seed_reference_and_lookups.sql
003_seed_form_elements.sql
004_seed_form_rules.sql
005_migration_capability_code_set.sql
006_seed_capability_code_set.sql
007_migration_error_catalogue.sql
008_seed_error_catalogue.sql
009_migration_obx_skeleton.sql
010_seed_obx_skeleton.sql
016_migration_physician_foundation.sql
011_migration_functional_measurement_model.sql
012_seed_functional_measurement.sql
013_migration_hl7_wire_map.sql
014_seed_hl7_wire_map.sql
015_migration_employer_view.sql
017_migration_ai_provenance_and_isolation.sql
```

Do not add:

```
018_migration_search_path_hardening.sql
019_migration_functional_measurement_gap_fill.sql
020_migration_ai_components_boundaries.sql
021_migration_provincial_rules.sql
022_seed_provincial_rules.sql
```

## 6. Holds this runbook surfaces

- No Montreal clinical project exists as of this 45a writing. Path A reached a permission prompt in the originating session; no approval; no retry in this run. Awaiting Gary.
- Existing site project `agzhnmunodrhsjbogzae` is not the clinical project.
- Schema 021 / 022: HELD. Do not apply. Do not widen Prompt 45 to Ontario or BC.
- 018 / 019 / 020: exist, not in the 45a apply-now sequence, later optional only if Gary authorizes.
- Advisors: not run (no project).
- Proposed occupational data: never seeds without line-by-line sign-off.
- Production submission: still disabled.
- `package.json` and email templates: locked. Consent language, legal pages, pricing, and schema live apply remain human-gated.
