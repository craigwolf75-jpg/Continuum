-- Continuum worker schema (SB-001). Append only; never edit once applied.
-- Vendored from the live worker dump and rebound to clinical.* and employer.*.
-- Do not apply to live Supabase from this mission.
--
-- Identity map (not legal copy):
--   public.hub_profiles is the hub approval gate
--   public.users and public.workers are the hub person and role projection
--   worker.worker_account is worker-app identity keyed to auth.users, with
--   clinical_worker_id pointing at clinical.worker
--
-- No secrets. Deployment flags default false. No em dashes or en dashes.

begin;

create schema if not exists worker;

do $$ begin
  create type worker.pathway_type as enum (
    'PHYSICAL', 'CONCUSSION', 'PSYCHOLOGICAL', 'CRITICAL_INCIDENT'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type worker.consent_kind as enum (
    'w1_participation',
    'w2_employer_disclosure',
    'w3_check_in_capture',
    'w4_voice_stt',
    'w5_motion_camera',
    'w6_clinician_handoff',
    'w7_psych_capture'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type worker.operational_code as enum (
    'ATTENDED_TODAY',
    'MODIFIED_DUTY_COMPLETED',
    'MODIFIED_DUTY_STOPPED',
    'HOURS_AS_APPROVED',
    'HOURS_UNDER_APPROVED',
    'DID_NOT_ATTEND',
    'RESTRICTIONS_UNCHANGED',
    'RESTRICTIONS_UPDATED',
    'NEXT_REVIEW_SCHEDULED',
    'RETURN_TO_WORK_STATUS_CHANGED'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type worker.memory_tier as enum ('session', 'case', 'durable');
exception when duplicate_object then null;
end $$;

create table if not exists worker.deployment_flag (
  flag text primary key,
  enabled boolean not null default false,
  set_by text,
  set_at timestamptz,
  statement text
);

insert into worker.deployment_flag (flag, enabled)
values
  ('PSYCH_CAPTURE_PRODUCTION_RELEASE', false),
  ('MOTION_PRODUCTION_RELEASE', false),
  ('GENERATIVE_ADAPTER_ENABLED', false)
on conflict (flag) do nothing;

create table if not exists worker.worker_account (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  clinical_worker_id uuid,
  display_name text,
  locale text not null default 'en',
  companion_character text,
  first_run_done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists worker.case_pathway (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  pathway_type worker.pathway_type not null,
  active boolean not null default true,
  opened_at timestamptz not null default now(),
  unique (case_id, pathway_type)
);

create table if not exists worker.consent (
  id uuid primary key default gen_random_uuid(),
  worker_account_id uuid not null references worker.worker_account (id),
  case_id uuid not null,
  kind worker.consent_kind not null,
  granted boolean not null,
  occurred_at timestamptz not null default now(),
  revoked_at timestamptz,
  text_version text not null,
  unique (worker_account_id, case_id, kind)
);

create table if not exists worker.check_in (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  worker_account_id uuid not null references worker.worker_account (id),
  pathway_type worker.pathway_type not null,
  occurred_at timestamptz not null default now(),
  hours_approved numeric,
  hours_worked numeric,
  reported_pain smallint
);

create table if not exists worker.check_in_answer (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid not null references worker.check_in (id) on delete cascade,
  duty_ref text,
  performed boolean,
  made_worse boolean,
  worsened_note text,
  settled_by_end boolean,
  created_at timestamptz not null default now()
);

create table if not exists worker.private_comment (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid references worker.check_in (id) on delete cascade,
  worker_account_id uuid not null references worker.worker_account (id),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists worker.psych_capture (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid references worker.check_in (id) on delete cascade,
  worker_account_id uuid not null references worker.worker_account (id),
  question_key text not null,
  answer text,
  created_at timestamptz not null default now()
);

create table if not exists worker.operational_signal (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  code worker.operational_code not null,
  occurred_at timestamptz not null default now(),
  released boolean not null default false
);

create table if not exists worker.movement_observation (
  id uuid primary key default gen_random_uuid(),
  worker_account_id uuid not null references worker.worker_account (id),
  case_id uuid not null,
  axis_label text not null,
  angle_degrees numeric,
  captured_by_worker boolean not null default true,
  captured_at timestamptz not null default now(),
  constraint movement_is_worker_captured check (captured_by_worker = true)
);

create table if not exists worker.companion_memory (
  worker_account_id uuid not null references worker.worker_account (id),
  tier worker.memory_tier not null,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (worker_account_id, tier)
);

create table if not exists worker.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  worker_account_id uuid,
  case_id uuid,
  action text not null,
  detail jsonb not null default '{}'
);

create or replace function worker.prevent_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception '% is immutable; % is not permitted', tg_table_name, tg_op
    using errcode = 'check_violation';
end;
$$;

drop trigger if exists no_mutation on worker.audit_log;
create trigger no_mutation
  before update or delete on worker.audit_log
  for each row
  execute function worker.prevent_mutation();

create index if not exists idx_wa_auth on worker.worker_account (auth_user_id);
create index if not exists idx_cp_case on worker.case_pathway (case_id);
create index if not exists idx_ci_case on worker.check_in (case_id);
create index if not exists idx_ci_worker on worker.check_in (worker_account_id);
create index if not exists idx_os_case on worker.operational_signal (case_id) where released;
create index if not exists idx_consent_wc on worker.consent (worker_account_id, case_id);

-- Employer projection for the worker client. Aggregates employer.duty_match_line
-- verdicts into text[] so the client shape (safe / conditional / excluded) stays
-- the same. Joins clinical.wcb_case with no deleted_at filter (all rows live).
-- Latest employer.published_restriction_set where withdrawn_at is null.
create or replace view worker.employer_worker_view as
select
  cf.id as case_id,
  coalesce((
    select array_agg(dml.duty_name::text order by dml.duty_name)
    from employer.duty_match_line dml
    where dml.restriction_set_id = prs.id
      and dml.verdict = 'safe'
  ), '{}'::text[]) as safe_duties,
  coalesce((
    select array_agg(dml.duty_name::text order by dml.duty_name)
    from employer.duty_match_line dml
    where dml.restriction_set_id = prs.id
      and dml.verdict = 'conditional'
  ), '{}'::text[]) as conditional_duties,
  coalesce((
    select array_agg(dml.duty_name::text order by dml.duty_name)
    from employer.duty_match_line dml
    where dml.restriction_set_id = prs.id
      and dml.verdict = 'excluded'
  ), '{}'::text[]) as excluded_duties,
  prs.reassessment_date as next_reassessment,
  coalesce((
    select array_agg(os.code::text order by os.occurred_at desc)
    from worker.operational_signal os
    where os.case_id = cf.id
      and os.released
  ), '{}'::text[]) as operational_signals
from clinical.wcb_case cf
left join lateral (
  select e.id, e.reassessment_date
  from employer.published_restriction_set e
  where e.case_ref = cf.id
    and e.withdrawn_at is null
  order by e.published_at desc
  limit 1
) prs on true;

commit;
