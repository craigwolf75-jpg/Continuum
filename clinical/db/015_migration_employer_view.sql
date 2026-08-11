-- Continuum Prompt 43: the employer view schema (Section 4.3).
--
-- A SEPARATE schema, not a view and not a permission (Section 4, Section 7). There is no
-- column here capable of holding clinical content and there must never be one: a banned
-- column in the employer schema fails the build (clinical/engine/employer_schema.test.mjs,
-- criterion 1). The employer schema NEVER carries a raw measurement, a diagnosis, a
-- symptom, a medication, a finding, a narrative, pain, or any board element from a form's
-- clinical sections (Section 0A.2).
--
-- case_ref and worker_ref are OPAQUE uuids, NOT cross schema foreign keys (Section 7): a
-- cross schema foreign key from employer to clinical creates a join path a future query
-- can follow into clinical data. The only foreign key here is duty_match_line to
-- published_restriction_set, both inside the employer schema.
--
-- Idempotent, one transaction, hand applied by Gary. No dashes anywhere.

begin;

create schema if not exists employer;

-- The published restriction set: what the employer is shown, per consent B. It carries
-- the derived band outputs and the computed duty match, never the raw measurement. The
-- clinical case is referenced only by an opaque case_ref.
create table if not exists employer.published_restriction_set (
  id uuid primary key default gen_random_uuid(),
  case_ref uuid not null,            -- opaque, NOT a cross schema foreign key
  employer_id uuid not null,
  worker_ref uuid not null,          -- opaque, NOT a cross schema foreign key
  worker_display_name varchar(60) not null,
  job_title varchar(50) not null,
  work_status varchar(24) not null
    check (work_status in ('fit', 'fit_with_restrictions', 'unfit')),
  effective_from date not null,
  effective_to date,
  reassessment_date date,
  hours_per_day numeric(4,2),
  measurement_version int not null,
  published_at timestamptz not null default now(),
  withdrawn_at timestamptz
);
create index if not exists ix_prs_case on employer.published_restriction_set(case_ref);
create index if not exists ix_prs_employer on employer.published_restriction_set(employer_id, published_at desc);

-- The computed duty match: what the supervisor can act on. A verdict and a FUNCTIONAL
-- reason, never a clinical one.
create table if not exists employer.duty_match_line (
  id uuid primary key default gen_random_uuid(),
  restriction_set_id uuid not null references employer.published_restriction_set(id),
  duty_id uuid not null,
  duty_name varchar(200) not null,
  verdict varchar(12) not null
    check (verdict in ('safe', 'conditional', 'excluded')),
  condition_text varchar(300),
  excluded_because varchar(300),     -- FUNCTIONAL reason, never clinical
  unmapped_demand boolean not null default false
);
create index if not exists ix_dml_set on employer.duty_match_line(restriction_set_id);

commit;
