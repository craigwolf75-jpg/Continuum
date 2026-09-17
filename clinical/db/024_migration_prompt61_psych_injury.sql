-- Continuum Prompt 61: psychological injury pathway tables.
-- Append only. Does NOT rewrite clinical.internal_restriction_code.
-- Does NOT create a symptom check-in table for this case type.
-- Does NOT flip PSYCH_CAPTURE_PRODUCTION_RELEASE.
-- Empty tables only. No seed beyond SYNTH. File only. Claude does not live apply.
-- Idempotent, one transaction, hand applied by Gary. No dashes.

begin;

create schema if not exists clinical;
create schema if not exists employer;

create table if not exists clinical.prompt61_case (
  case_ref uuid primary key default gen_random_uuid(),
  case_type varchar(40) not null,
  claim_date date,
  snapshot_site varchar(80),
  snapshot_shift_pattern varchar(80),
  snapshot_supervisor_ref varchar(120),
  snapshot_captured_at timestamptz,
  status varchar(24) not null default 'open',
  created_at timestamptz not null default now(),
  constraint prompt61_case_type_psych check (case_type = 'psychological_injury')
);

create table if not exists clinical.prompt61_duty_ack (
  id uuid primary key default gen_random_uuid(),
  case_ref uuid not null references clinical.prompt61_case(case_ref),
  ack_date date not null,
  hours_approved numeric(4,2),
  duties_approved jsonb not null default '[]',
  duties_not_approved jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index if not exists ix_p61_duty_ack_case on clinical.prompt61_duty_ack(case_ref, ack_date);

create table if not exists clinical.prompt61_message (
  id uuid primary key default gen_random_uuid(),
  case_ref uuid not null references clinical.prompt61_case(case_ref),
  from_role varchar(40) not null,
  body text,
  created_at timestamptz not null default now()
);
create index if not exists ix_p61_message_case on clinical.prompt61_message(case_ref);

create table if not exists clinical.prompt61_document (
  id uuid primary key default gen_random_uuid(),
  case_ref uuid not null references clinical.prompt61_case(case_ref),
  filename varchar(200) not null,
  created_at timestamptz not null default now()
);
create index if not exists ix_p61_document_case on clinical.prompt61_document(case_ref);

create table if not exists clinical.prompt61_hours_confirmation (
  id uuid primary key default gen_random_uuid(),
  case_ref uuid not null references clinical.prompt61_case(case_ref),
  work_date date not null,
  hours_worked numeric(4,2),
  source varchar(24) not null,
  created_at timestamptz not null default now(),
  constraint prompt61_hours_source check (source in ('roster', 'worker_confirmation'))
);
create index if not exists ix_p61_hours_case on clinical.prompt61_hours_confirmation(case_ref, work_date);

create table if not exists clinical.prompt61_named_individual (
  id uuid primary key default gen_random_uuid(),
  case_ref uuid not null references clinical.prompt61_case(case_ref),
  person_ref varchar(120),
  person_free_text varchar(200),
  created_at timestamptz not null default now()
);
create index if not exists ix_p61_named_case on clinical.prompt61_named_individual(case_ref);

create table if not exists clinical.prompt61_named_individual_access (
  id uuid primary key default gen_random_uuid(),
  restriction_id uuid not null references clinical.prompt61_named_individual(id),
  user_ref varchar(120),
  accessed_at timestamptz not null default now(),
  purpose varchar(120)
);

create table if not exists clinical.prompt61_tenant_flag (
  tenant_ref varchar(80) primary key,
  named_individual_restriction_enabled boolean not null default true
);

create table if not exists clinical.prompt61_coordinator_escalation (
  id uuid primary key default gen_random_uuid(),
  case_ref uuid not null references clinical.prompt61_case(case_ref),
  triggered_by varchar(120) not null,
  recipient varchar(120),
  triggered_at timestamptz not null default now(),
  stored_as_clinical_finding boolean not null default false
);
create index if not exists ix_p61_escalation_case on clinical.prompt61_coordinator_escalation(case_ref);

create table if not exists clinical.prompt61_board_evidence (
  id uuid primary key default gen_random_uuid(),
  case_ref uuid not null references clinical.prompt61_case(case_ref),
  form_id varchar(80) not null,
  fields jsonb not null default '{}',
  assembled_at timestamptz not null default now(),
  submitted boolean not null default false,
  auto_submit boolean not null default false
);

create table if not exists clinical.prompt61_conduct_event (
  id uuid primary key default gen_random_uuid(),
  case_ref uuid not null references clinical.prompt61_case(case_ref),
  kind varchar(40) not null,
  occurred_at date not null,
  created_at timestamptz not null default now(),
  constraint prompt61_conduct_kind check (kind in ('contact', 'clinical_update', 'duty_change', 'employer_touch'))
);
create index if not exists ix_p61_conduct_case on clinical.prompt61_conduct_event(case_ref, occurred_at);

commit;
