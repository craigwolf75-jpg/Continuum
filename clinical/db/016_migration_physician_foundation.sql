-- Continuum physician platform FOUNDATION (decided in Prompt 43a, gate 1).
--
-- The shared base layer every physician stream prompt waits on: Prompt 39's measurement
-- model (migration 011) preflight RAISES until clinic, wcb_case, wcb_report and
-- practitioner exist; Prompt 42's signature spine hashes into wcb_report.snapshot_hash;
-- Prompt 43's consent gates read clinical.consent; the employer view (015) references a
-- case only by an opaque case_ref, never a cross schema foreign key.
--
-- RESIDENCY (gate 1): this schema lives in the dedicated physician platform project in the
-- Canada region (Montreal). Gary creates that project and records its region string as the
-- prerequisite 7 evidence; Claude never creates or touches a Supabase project. The
-- clinical, employer and audit schemas are SEPARATE schemas in that one project (Prompt 43
-- wall). No Edge Function is introduced here; any function that later touches worker data
-- must have its execution region reported before use.
--
-- APPLY ORDER: after 001 through 010 (needs nothing from them, but they share the clinical
-- schema) and BEFORE 011 (which preflight gates on the parents this creates). Idempotent,
-- one transaction, hand applied by Gary. No dashes anywhere.

begin;

create schema if not exists clinical;
create schema if not exists audit;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $enums$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname='accreditation_status' and n.nspname='clinical') then
    create type clinical.accreditation_status as enum ('none', 'pending', 'accredited', 'suspended');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname='report_status' and n.nspname='clinical') then
    create type clinical.report_status as enum ('draft', 'signed', 'submitted', 'accepted', 'rejected');
  end if;
end
$enums$;

-- ---------------------------------------------------------------------------
-- clinic and its batch schedule (Prompt 42 crit 11 gates production submission on
-- accreditation_status; the batch worker reads the schedule)
-- ---------------------------------------------------------------------------
create table if not exists clinical.clinic (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  accreditation_status clinical.accreditation_status not null default 'none',
  region varchar(40) not null default 'ca-central-1',  -- residency evidence, prereq 7
  created_at timestamptz not null default now()
);

create table if not exists clinical.clinic_batch_schedule (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinical.clinic(id),
  run_time varchar(5) not null,        -- HH:MM Mountain Time, e.g. 09:00, 14:00, 17:00, 00:05
  active boolean not null default true,
  unique (clinic_id, run_time)
);

-- ---------------------------------------------------------------------------
-- practitioner (Prompt 42 blocks an inactive practitioner; practitioner_sees_all is the
-- Health Information Act question, Prompt 41 open item 4: built, defaulted true, flagged)
-- ---------------------------------------------------------------------------
create table if not exists clinical.practitioner (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinical.clinic(id),
  billing_number varchar(20) not null,
  name varchar(120) not null,
  role_code varchar(4) not null,       -- board Practitioner Role Codes (GP, OIS, ...)
  active boolean not null default true,
  practitioner_sees_all boolean not null default true,  -- open item 4, flagged
  created_at timestamptz not null default now(),
  unique (clinic_id, billing_number)
);

-- ---------------------------------------------------------------------------
-- worker: identifiable PHI. Never referenced by the employer schema except through an
-- opaque worker_ref (no cross schema foreign key).
-- ---------------------------------------------------------------------------
create table if not exists clinical.worker (
  id uuid primary key default gen_random_uuid(),
  phn varchar(9),                      -- Alberta PHN, exactly 9 digits (Prompt 40 phn gate)
  name varchar(120) not null,
  date_of_birth date,
  address varchar(200),
  phone varchar(30),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- wcb_case: within the clinical schema, foreign keys to clinic and worker are fine. The
-- employer is referenced by an opaque uuid, not a foreign key, so a case never joins into
-- an employer record and vice versa.
-- ---------------------------------------------------------------------------
create table if not exists clinical.wcb_case (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinical.clinic(id),
  worker_id uuid not null references clinical.worker(id),
  employer_ref uuid,                   -- opaque, NOT a cross schema foreign key
  claim_number varchar(7),
  date_of_injury date,
  part_of_body varchar(60),
  nature_of_injury varchar(60),
  created_at timestamptz not null default now()
);
create index if not exists ix_case_clinic on clinical.wcb_case(clinic_id);

-- ---------------------------------------------------------------------------
-- wcb_report: the signature spine. signed_at and snapshot_hash are set in the SAME
-- transaction that derives the bands (Prompt 42 Section 2.1, the sign_measurement engine).
-- ---------------------------------------------------------------------------
create table if not exists clinical.wcb_report (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references clinical.wcb_case(id),
  practitioner_id uuid not null references clinical.practitioner(id),
  form_id varchar(6) not null,
  version int not null default 1,
  status clinical.report_status not null default 'draft',
  completed boolean not null default false,
  signed_at timestamptz,
  snapshot_hash char(64),              -- SHA-256 over the canonical signed payload
  created_at timestamptz not null default now()
);
create index if not exists ix_report_case on clinical.wcb_report(case_id);

-- ---------------------------------------------------------------------------
-- wcb_submission: Prompt 42 return file and resubmission (attempt + 1, original untouched)
-- ---------------------------------------------------------------------------
create table if not exists clinical.wcb_submission (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references clinical.wcb_report(id),
  previous_submission_id uuid references clinical.wcb_submission(id),
  attempt int not null default 1,
  status varchar(24) not null default 'queued',
  batch_ref varchar(60),
  board_raw_response text,
  created_at timestamptz not null default now(),
  unique (report_id, attempt)
);

-- ---------------------------------------------------------------------------
-- consent: Prompt 43. Consent A is the clinical and board consent; Consent B gates the
-- employer view and the worker plan only, never the board submission.
-- ---------------------------------------------------------------------------
create table if not exists clinical.consent (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references clinical.wcb_case(id),
  consent_a_granted boolean not null default false,
  consent_a_at timestamptz,
  consent_b_granted boolean not null default false,
  consent_b_at timestamptz,
  consent_b_revoked_at timestamptz,
  unique (case_id)
);

-- ---------------------------------------------------------------------------
-- measurement_draft: the unsigned working set the sign_measurement routine reads and
-- freezes into the insert only functional_measurement (Prompt 39 Section 3.4). This is the
-- only mutable measurement store; once signed, the frozen rows are immutable (011).
-- ---------------------------------------------------------------------------
create table if not exists clinical.measurement_draft (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references clinical.wcb_case(id),
  report_id uuid references clinical.wcb_report(id),
  practitioner_id uuid not null references clinical.practitioner(id),
  form_id varchar(6) not null,
  draft jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (case_id, form_id)
);

-- ---------------------------------------------------------------------------
-- audit.event: append only. Every authorised data alteration is substantiated by an audit
-- (accreditation condition 0A.1). Immutable by revoked grants plus a blocking trigger, the
-- same defense in depth pattern as the measurement spine.
-- ---------------------------------------------------------------------------
create table if not exists audit.event (
  id uuid primary key default gen_random_uuid(),
  actor uuid,
  action varchar(60) not null,
  entity varchar(60) not null,
  entity_id uuid,
  detail jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);
create index if not exists ix_audit_entity on audit.event(entity, entity_id);

revoke update, delete on audit.event from anon, authenticated, service_role;

create or replace function audit.block_mutation() returns trigger
language plpgsql as $blk$
begin
  raise exception 'audit.event is append only. % is not permitted', tg_op;
end;
$blk$;

drop trigger if exists trg_audit_block on audit.event;
create trigger trg_audit_block before update or delete on audit.event
for each row execute function audit.block_mutation();

commit;
