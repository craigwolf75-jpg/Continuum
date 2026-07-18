-- Continuum Foundation (Core): schema, RLS, reference seed.
-- Governed by specs/CONTINUUM_PROMPT_07.md section 07.1. Append only; never
-- edit or delete this file once applied. No em-dashes or en-dashes anywhere.
--
-- Scope of this migration (Core pass):
--   - enums
--   - all 07.1 tables with tenant_id, soft delete, timestamps
--   - indexes and updated_at triggers
--   - append-only audit_log trigger
--   - RLS enabled on every table with claim-based policies
--   - reference seed: province_form_codes (4 provinces), status_transitions
--
-- Deferred to later prompts (seams left, not built here):
--   - custom access token auth hook that stamps role/tenant_id/user_id claims
--     (07.2). Until it exists, no JWT carries these claims, so RLS denies by
--     default. This is intentional and safe: the database has no PHI yet.
--   - per-role PHI views employer_case_view / hse_case_view / wcb views (07.4,
--     07.8). Base-table PHI reads for employer_admin, hse, wcb_officer are
--     DENIED here on purpose; they read through those views once built.
--   - advance_injury_status function and block trigger (07.5).
--   - demo seed (Worley tenant, one user per role, Marcus Bedard case).

begin;

-- ============================================================
-- Enums
-- ============================================================
create type public.injury_status as enum
  ('reported', 'off_work', 'light_duty', 'full_duty_pending', 'signed_off', 'escalated');
create type public.injury_severity as enum ('minor', 'moderate', 'major');
create type public.user_role as enum
  ('worker', 'hse', 'employer_admin', 'wcb_officer', 'nexus_physician');
create type public.province as enum ('ab', 'bc', 'sk', 'on');
create type public.rtw_frame as enum ('incentive', 'compliance');
create type public.tenant_status as enum ('active', 'suspended');
create type public.user_status as enum ('invited', 'active', 'disabled');
create type public.recovery_source as enum ('check_in', 'photo');
create type public.wcb_notification_type as enum ('initial', 'light_duty', 'full_duty');
create type public.wcb_notification_status as enum
  ('pending', 'generated', 'submitted', 'acknowledged', 'failed');
create type public.form_party as enum ('worker', 'employer', 'physician');

-- ============================================================
-- Shared trigger functions
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.audit_log_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_log is append only; % is not permitted', tg_op;
end;
$$;

-- ============================================================
-- Tables
-- ============================================================

-- tenants (no tenant_id; this is the tenant)
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  province public.province not null,
  wcb_account_number text,
  branding jsonb not null default '{}'::jsonb,
  light_duty_task_bank jsonb not null default '[]'::jsonb,
  rtw_obligation_frame public.rtw_frame not null default 'incentive',
  status public.tenant_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- users (tenant_id NULL for wcb_officer and nexus_physician)
create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users (id) on delete set null,
  phone text unique,
  email text,
  full_name text,
  role public.user_role not null,
  tenant_id uuid references public.tenants (id),
  status public.user_status not null default 'invited',
  language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.workers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id),
  user_id uuid not null references public.users (id),
  photo_url text,
  job_title text,
  shift_rotation text,
  hire_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.injuries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id),
  worker_id uuid not null references public.workers (id),
  date_of_injury date,
  body_part text,
  injury_type text,
  severity public.injury_severity,
  prognosis_days integer,
  diagnosis_notes text,
  status public.injury_status not null default 'reported',
  prior_status public.injury_status,
  estimated_return_date date,
  nexus_case_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.recovery_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id),
  injury_id uuid not null references public.injuries (id),
  client_generated_id uuid not null unique,
  logged_at timestamptz not null default now(),
  pain_score integer check (pain_score between 1 and 10),
  mobility_score integer check (mobility_score between 1 and 10),
  notes text,
  image_url text,
  source public.recovery_source not null default 'check_in',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.light_duties (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id),
  injury_id uuid not null references public.injuries (id),
  task_description text,
  medical_restrictions text,
  assigned_by uuid references public.users (id),
  assigned_date date,
  completed_date date,
  worker_feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.wcb_notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id),
  injury_id uuid not null references public.injuries (id),
  type public.wcb_notification_type not null,
  payload jsonb not null default '{}'::jsonb,
  wcb_claim_number text,
  sent_timestamp timestamptz,
  status public.wcb_notification_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.escalations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id),
  injury_id uuid not null references public.injuries (id),
  trigger text,
  notified_party text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id),
  user_id uuid not null references public.users (id),
  version text not null,
  scope jsonb not null default '{}'::jsonb,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- access_grants: cross-tenant registry; tenant_id and injury_id both nullable
create table public.access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id),
  tenant_id uuid references public.tenants (id),
  injury_id uuid references public.injuries (id),
  access text not null default 'read' check (access in ('read')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- audit_log: append only. No updated_at or deleted_at; rows are immutable.
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid references public.users (id),
  action text not null,
  entity text not null,
  entity_id uuid,
  occurred_at timestamptz not null default now(),
  ip_device text
);

create table public.wearable_data (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id),
  injury_id uuid not null references public.injuries (id),
  captured_at timestamptz,
  metric text check (metric in ('hrv', 'strain', 'recovery', 'hr')),
  value numeric,
  device text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.case_metrics (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id),
  injury_id uuid not null references public.injuries (id),
  metric text not null check (metric in
    ('days_to_first_checkin', 'days_in_status', 'checkin_adherence',
     'escalation_count', 'days_to_rtw')),
  value numeric,
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- province_form_codes: reference table, no tenant_id
create table public.province_form_codes (
  id uuid primary key default gen_random_uuid(),
  province public.province not null,
  party public.form_party not null,
  form_code text not null,
  form_name text not null,
  deadline_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- status_transitions: reference table for the 07.5 status machine.
-- from_state NULL means "any active state" (entry to escalated).
-- to_state NULL means "return to prior_status" (escalated reassess).
create table public.status_transitions (
  id uuid primary key default gen_random_uuid(),
  from_state public.injury_status,
  to_state public.injury_status,
  actor text not null,
  trigger_label text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index idx_users_tenant on public.users (tenant_id);
create index idx_users_auth on public.users (auth_user_id);
create index idx_workers_tenant on public.workers (tenant_id);
create index idx_workers_user on public.workers (user_id);
create index idx_injuries_tenant on public.injuries (tenant_id);
create index idx_injuries_worker on public.injuries (worker_id);
create index idx_recovery_logs_tenant on public.recovery_logs (tenant_id);
create index idx_recovery_logs_injury on public.recovery_logs (injury_id);
create index idx_light_duties_tenant on public.light_duties (tenant_id);
create index idx_light_duties_injury on public.light_duties (injury_id);
create index idx_wcb_notifications_tenant on public.wcb_notifications (tenant_id);
create index idx_wcb_notifications_injury on public.wcb_notifications (injury_id);
create index idx_escalations_tenant on public.escalations (tenant_id);
create index idx_escalations_injury on public.escalations (injury_id);
create index idx_consents_tenant on public.consents (tenant_id);
create index idx_consents_user on public.consents (user_id);
create index idx_access_grants_user on public.access_grants (user_id);
create index idx_access_grants_tenant on public.access_grants (tenant_id);
create index idx_access_grants_injury on public.access_grants (injury_id);
create index idx_audit_log_tenant on public.audit_log (tenant_id);
create index idx_audit_log_actor on public.audit_log (actor_id);
create index idx_wearable_data_tenant on public.wearable_data (tenant_id);
create index idx_wearable_data_injury on public.wearable_data (injury_id);
create index idx_case_metrics_tenant on public.case_metrics (tenant_id);
create index idx_case_metrics_injury on public.case_metrics (injury_id);

-- ============================================================
-- updated_at triggers (every table that carries updated_at)
-- ============================================================
create trigger trg_tenants_updated before update on public.tenants
  for each row execute function public.set_updated_at();
create trigger trg_users_updated before update on public.users
  for each row execute function public.set_updated_at();
create trigger trg_workers_updated before update on public.workers
  for each row execute function public.set_updated_at();
create trigger trg_injuries_updated before update on public.injuries
  for each row execute function public.set_updated_at();
create trigger trg_recovery_logs_updated before update on public.recovery_logs
  for each row execute function public.set_updated_at();
create trigger trg_light_duties_updated before update on public.light_duties
  for each row execute function public.set_updated_at();
create trigger trg_wcb_notifications_updated before update on public.wcb_notifications
  for each row execute function public.set_updated_at();
create trigger trg_escalations_updated before update on public.escalations
  for each row execute function public.set_updated_at();
create trigger trg_consents_updated before update on public.consents
  for each row execute function public.set_updated_at();
create trigger trg_access_grants_updated before update on public.access_grants
  for each row execute function public.set_updated_at();
create trigger trg_wearable_data_updated before update on public.wearable_data
  for each row execute function public.set_updated_at();
create trigger trg_case_metrics_updated before update on public.case_metrics
  for each row execute function public.set_updated_at();
create trigger trg_province_form_codes_updated before update on public.province_form_codes
  for each row execute function public.set_updated_at();

-- audit_log append-only enforcement
create trigger trg_audit_log_immutable before update or delete on public.audit_log
  for each row execute function public.audit_log_immutable();
revoke update, delete on public.audit_log from authenticated, anon;

-- ============================================================
-- Claim helper functions
-- The custom access token hook (07.2) stamps role, tenant_id, user_id.
-- We also fall back to app_metadata so the policies work whether the hook
-- puts claims at the top level or under app_metadata.
-- ============================================================
create or replace function public.jwt_role()
returns text language sql stable as $$
  select coalesce(
    nullif(auth.jwt() ->> 'role', ''),
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    ''
  );
$$;

create or replace function public.jwt_tenant_id()
returns uuid language sql stable as $$
  select nullif(coalesce(
    auth.jwt() ->> 'tenant_id',
    auth.jwt() -> 'app_metadata' ->> 'tenant_id'
  ), '')::uuid;
$$;

create or replace function public.jwt_user_id()
returns uuid language sql stable as $$
  select nullif(coalesce(
    auth.jwt() ->> 'user_id',
    auth.jwt() -> 'app_metadata' ->> 'user_id'
  ), '')::uuid;
$$;

-- Does the current cross-tenant caller hold a matching access grant?
create or replace function public.continuum_has_grant(row_tenant uuid, row_injury uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.access_grants ag
    where ag.deleted_at is null
      and ag.user_id = public.jwt_user_id()
      and public.jwt_role() in ('wcb_officer', 'nexus_physician')
      and (
        (ag.injury_id is not null and ag.injury_id = row_injury) or
        (ag.tenant_id is not null and ag.tenant_id = row_tenant)
      )
  );
$$;

-- Does the current worker own this injury (their own worker row)?
create or replace function public.continuum_owns_injury(row_injury uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.injuries i
    join public.workers w on w.id = i.worker_id
    where i.id = row_injury
      and w.user_id = public.jwt_user_id()
  );
$$;

-- Base-table access to injury-bearing PHI rows.
-- Field firewall (07.4): employer_admin, hse, wcb_officer get NO base access
-- here; they read scoped views built in later prompts. Only the worker (own
-- rows) and the granted nexus_physician (full detail) reach the base tables.
create or replace function public.continuum_injury_access(row_tenant uuid, row_injury uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case public.jwt_role()
    when 'worker' then row_tenant = public.jwt_tenant_id()
                     and public.continuum_owns_injury(row_injury)
    when 'nexus_physician' then public.continuum_has_grant(row_tenant, row_injury)
    else false
  end;
$$;

grant execute on function public.jwt_role() to authenticated, anon;
grant execute on function public.jwt_tenant_id() to authenticated, anon;
grant execute on function public.jwt_user_id() to authenticated, anon;
grant execute on function public.continuum_has_grant(uuid, uuid) to authenticated, anon;
grant execute on function public.continuum_owns_injury(uuid) to authenticated, anon;
grant execute on function public.continuum_injury_access(uuid, uuid) to authenticated, anon;

-- ============================================================
-- Enable RLS on every table
-- ============================================================
alter table public.tenants enable row level security;
alter table public.users enable row level security;
alter table public.workers enable row level security;
alter table public.injuries enable row level security;
alter table public.recovery_logs enable row level security;
alter table public.light_duties enable row level security;
alter table public.wcb_notifications enable row level security;
alter table public.escalations enable row level security;
alter table public.consents enable row level security;
alter table public.access_grants enable row level security;
alter table public.audit_log enable row level security;
alter table public.wearable_data enable row level security;
alter table public.case_metrics enable row level security;
alter table public.province_form_codes enable row level security;
alter table public.status_transitions enable row level security;

-- ============================================================
-- Policies
-- Writes to provisioning and clinical tables that are not covered by a
-- policy fall through to service_role only (service_role bypasses RLS), which
-- is where intake, the status machine, and auth hooks run. Health rows get no
-- DELETE policy anywhere: soft delete only, never hard-deleted.
-- ============================================================

-- tenants: members of the tenant, or a cross-tenant grantee, may read.
create policy tenants_select on public.tenants
  for select to authenticated
  using (
    deleted_at is null and (
      (public.jwt_role() in ('worker', 'hse', 'employer_admin')
        and id = public.jwt_tenant_id())
      or public.continuum_has_grant(id, null)
    )
  );

-- users: a user reads their own row; tenant admins and hse read users in their
-- tenant.
create policy users_select on public.users
  for select to authenticated
  using (
    deleted_at is null and (
      auth_user_id = auth.uid()
      or (public.jwt_role() in ('hse', 'employer_admin')
          and tenant_id = public.jwt_tenant_id())
    )
  );

-- workers: worker reads own; hse and employer_admin read within tenant; a
-- cross-tenant grantee on the tenant may read.
create policy workers_select on public.workers
  for select to authenticated
  using (
    deleted_at is null and (
      (public.jwt_role() = 'worker'
        and user_id = public.jwt_user_id()
        and tenant_id = public.jwt_tenant_id())
      or (public.jwt_role() in ('hse', 'employer_admin')
          and tenant_id = public.jwt_tenant_id())
      or public.continuum_has_grant(tenant_id, null)
    )
  );

-- injuries (PHI base table): worker own, granted nexus only.
create policy injuries_select on public.injuries
  for select to authenticated
  using (deleted_at is null and public.continuum_injury_access(tenant_id, id));
create policy injuries_insert on public.injuries
  for insert to authenticated
  with check (public.continuum_injury_access(tenant_id, id));
create policy injuries_update on public.injuries
  for update to authenticated
  using (deleted_at is null and public.continuum_injury_access(tenant_id, id))
  with check (public.continuum_injury_access(tenant_id, id));

-- recovery_logs (PHI): worker logs own check-ins; granted nexus reads.
create policy recovery_logs_select on public.recovery_logs
  for select to authenticated
  using (deleted_at is null and public.continuum_injury_access(tenant_id, injury_id));
create policy recovery_logs_insert on public.recovery_logs
  for insert to authenticated
  with check (public.continuum_injury_access(tenant_id, injury_id));
create policy recovery_logs_update on public.recovery_logs
  for update to authenticated
  using (deleted_at is null and public.continuum_injury_access(tenant_id, injury_id))
  with check (public.continuum_injury_access(tenant_id, injury_id));

-- light_duties (PHI): worker checks off own; granted nexus reads. HSE assign
-- path is added under policy in 07.9.
create policy light_duties_select on public.light_duties
  for select to authenticated
  using (deleted_at is null and public.continuum_injury_access(tenant_id, injury_id));
create policy light_duties_insert on public.light_duties
  for insert to authenticated
  with check (public.continuum_injury_access(tenant_id, injury_id));
create policy light_duties_update on public.light_duties
  for update to authenticated
  using (deleted_at is null and public.continuum_injury_access(tenant_id, injury_id))
  with check (public.continuum_injury_access(tenant_id, injury_id));

-- wcb_notifications (PHI): granted nexus reads; worker own reads. Writes flow
-- through the auto-actions worker (service_role).
create policy wcb_notifications_select on public.wcb_notifications
  for select to authenticated
  using (deleted_at is null and public.continuum_injury_access(tenant_id, injury_id));

-- escalations (PHI): granted nexus and worker own read. Writes flow through the
-- escalation engine (service_role).
create policy escalations_select on public.escalations
  for select to authenticated
  using (deleted_at is null and public.continuum_injury_access(tenant_id, injury_id));

-- wearable_data (PHI, table only): worker own and granted nexus read.
create policy wearable_data_select on public.wearable_data
  for select to authenticated
  using (deleted_at is null and public.continuum_injury_access(tenant_id, injury_id));

-- case_metrics (instrumentation): worker own and granted nexus read. Populated
-- by the state machine and check-in flow (service_role).
create policy case_metrics_select on public.case_metrics
  for select to authenticated
  using (deleted_at is null and public.continuum_injury_access(tenant_id, injury_id));

-- consents: the worker manages their own; employer_admin may read within tenant
-- for the active-version admin view.
create policy consents_select on public.consents
  for select to authenticated
  using (
    deleted_at is null and (
      user_id = public.jwt_user_id()
      or (public.jwt_role() = 'employer_admin' and tenant_id = public.jwt_tenant_id())
    )
  );
create policy consents_insert on public.consents
  for insert to authenticated
  with check (user_id = public.jwt_user_id());
create policy consents_update on public.consents
  for update to authenticated
  using (user_id = public.jwt_user_id())
  with check (user_id = public.jwt_user_id());

-- access_grants: the grantee may see their own grants. Grants are written by
-- the intake and admin flows (service_role).
create policy access_grants_select on public.access_grants
  for select to authenticated
  using (deleted_at is null and user_id = public.jwt_user_id());

-- audit_log: employer_admin reads within tenant; any actor reads their own
-- entries. Immutable by trigger; writes flow through the audit interceptor
-- (service_role).
create policy audit_log_select on public.audit_log
  for select to authenticated
  using (
    (public.jwt_role() = 'employer_admin' and tenant_id = public.jwt_tenant_id())
    or actor_id = public.jwt_user_id()
  );

-- province_form_codes and status_transitions: reference data, any authenticated
-- caller may read.
create policy province_form_codes_select on public.province_form_codes
  for select to authenticated using (true);
create policy status_transitions_select on public.status_transitions
  for select to authenticated using (true);

-- ============================================================
-- Reference seed
-- ============================================================

-- province_form_codes: verified codes per 07.1. MVP renders Alberta only; the
-- other provinces exist so no Alberta string is ever hard-coded.
insert into public.province_form_codes (province, party, form_code, form_name, deadline_text) values
  ('ab', 'worker',    'C060',      'Worker Report of Injury',        'As soon as possible'),
  ('ab', 'employer',  'C040',      'Employer Report of Injury',      'Within 72 hours of awareness'),
  ('ab', 'physician', 'C050',      'Physician First Report',         'Within 48 hours'),
  ('bc', 'worker',    'Form 6',    'Application for Compensation',   'As soon as possible'),
  ('bc', 'employer',  'Form 7',    'Employer Report of Injury',      'Within 72 hours'),
  ('bc', 'physician', 'Form 8',    'Physician First Report',         'At first visit'),
  ('sk', 'worker',    'W1',        'Worker Initial Report',          'As soon as possible'),
  ('sk', 'employer',  'E1',        'Employer Initial Report',        'Within 5 days'),
  ('sk', 'physician', 'PPI',       'Physician Report',               'As required'),
  ('on', 'worker',    'Form 6',    'Worker Report of Injury/Disease','Within 6 months'),
  ('on', 'employer',  'Form 7',    'Employer Report of Injury/Disease','Within 3 business days'),
  ('on', 'physician', 'Form 8',    'Health Professional Report',     'At first visit'),
  ('on', 'physician', 'FAF 2647A', 'Functional Abilities Form',      'As requested');

-- status_transitions: the 07.5 machine, seeded now as reference data.
insert into public.status_transitions (from_state, to_state, actor, trigger_label) values
  ('reported',          'off_work',          'system',          'first check-in'),
  ('off_work',          'light_duty',        'nexus_physician', 'clearance'),
  ('light_duty',        'full_duty_pending', 'nexus_physician', 'clearance'),
  ('full_duty_pending', 'signed_off',        'employer_admin',  'confirms return'),
  (null,                'escalated',         'system',          'escalation rule (any active state; records prior_status)'),
  ('escalated',         null,                'nexus_physician', 'reassess (returns to prior_status)');

commit;
