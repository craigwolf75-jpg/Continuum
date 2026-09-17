-- Continuum Prompt 60: named restriction catalogue, hours ladder, and
-- check-in record tables. Does NOT rewrite clinical.internal_restriction_code
-- (varchar 10). Prompt 60 codes are longer than 10 characters and live in a
-- new table. ALTER ADD only on employer tables (days_per_week,
-- excluding_restriction). No drops. No seed beyond SYNTH (this file creates
-- empty tables only).
--
-- Idempotent, one transaction, hand applied by Gary. Claude does not live apply. No dashes.

begin;

create schema if not exists clinical;
create schema if not exists employer;

create table if not exists clinical.prompt60_restriction_code (
  code varchar(80) primary key,
  display_label varchar(120) not null,
  value_shape jsonb,
  active boolean not null default true
);

create table if not exists clinical.prompt60_restriction_record (
  id uuid primary key default gen_random_uuid(),
  case_ref uuid not null,
  code varchar(80) not null references clinical.prompt60_restriction_code(code),
  authored_by varchar(120),
  source_document_type varchar(40),
  source_document_ref varchar(80),
  date_issued date,
  review_or_expiry_date date,
  transcribed_by varchar(120),
  value jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ix_p60_restriction_case on clinical.prompt60_restriction_record(case_ref);

create table if not exists clinical.prompt60_hours_step (
  id uuid primary key default gen_random_uuid(),
  case_ref uuid not null,
  week_index int not null,
  hours_per_day numeric(4,2),
  days_per_week numeric(3,1),
  planned_date date,
  authorised_at timestamptz,
  authorised_by varchar(120),
  created_at timestamptz not null default now()
);
create index if not exists ix_p60_hours_case on clinical.prompt60_hours_step(case_ref);

create table if not exists clinical.prompt60_checkin (
  id uuid primary key default gen_random_uuid(),
  case_ref uuid not null,
  checkin_date date not null,
  duties_performed jsonb not null default '[]',
  worsened_duties jsonb not null default '[]',
  settled_end_of_shift varchar(16),
  approved_hours numeric(4,2),
  hours_worked numeric(4,2),
  hours_source varchar(24),
  free_text varchar(2000),
  created_at timestamptz not null default now()
);
create index if not exists ix_p60_checkin_case on clinical.prompt60_checkin(case_ref, checkin_date);

do $employer_hours$
begin
  if to_regclass('employer.published_restriction_set') is null then
    raise exception 'employer.published_restriction_set is absent. Apply 015 first.';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'employer' and table_name = 'published_restriction_set' and column_name = 'days_per_week'
  ) then
    alter table employer.published_restriction_set
      add column days_per_week numeric(3,1);
  end if;
end
$employer_hours$;

do $employer_exclude$
begin
  if to_regclass('employer.duty_match_line') is null then
    raise exception 'employer.duty_match_line is absent. Apply 015 first.';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'employer' and table_name = 'duty_match_line' and column_name = 'excluding_restriction'
  ) then
    alter table employer.duty_match_line
      add column excluding_restriction text;
  end if;
end
$employer_exclude$;

commit;
