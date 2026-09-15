-- Continuum Prompt 45: provincial rules architecture (schema).
--
-- Prompt 40 created clinical.jurisdiction in a narrower shape (code, name,
-- submission_channel, active). This migration SUPERSEDES that shape by ALTER
-- TABLE only. It never drops or recreates the table. The 002 Alberta row and
-- the inactive BC through YT rows are preserved.
--
-- Also creates clinical.jurisdiction_deadline, widens clinic with
-- jurisdiction_code, widens worker.phn so a non 9 digit identifier can live in
-- data, and scopes the contract and role matrix with jurisdiction_code.
--
-- Schema is a human gate: Claude does not live apply. Gary applies by hand.
-- Idempotent, one transaction. No dashes anywhere.

begin;

create schema if not exists clinical;

-- ---------------------------------------------------------------------------
-- 1. Widen clinical.jurisdiction (Prompt 45 Section 2). Columns added:
--    board_name, practitioner_credential_label, practitioner_credential_pattern,
--    worker_identifier_label, worker_identifier_pattern,
--    employer_disclosure_profile, consent_profile, timezone.
-- ---------------------------------------------------------------------------
do $jur$
begin
  if to_regclass('clinical.jurisdiction') is null then
    raise exception 'clinical.jurisdiction is absent. Apply 001 first.';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'clinical' and table_name = 'jurisdiction' and column_name = 'board_name'
  ) then
    alter table clinical.jurisdiction
      add column board_name varchar(120) not null default 'UNSPECIFIED';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'clinical' and table_name = 'jurisdiction' and column_name = 'practitioner_credential_label'
  ) then
    alter table clinical.jurisdiction
      add column practitioner_credential_label varchar(60) not null default 'unspecified';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'clinical' and table_name = 'jurisdiction' and column_name = 'practitioner_credential_pattern'
  ) then
    alter table clinical.jurisdiction
      add column practitioner_credential_pattern varchar(60) not null default '^$';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'clinical' and table_name = 'jurisdiction' and column_name = 'worker_identifier_label'
  ) then
    alter table clinical.jurisdiction
      add column worker_identifier_label varchar(80) not null default 'unspecified';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'clinical' and table_name = 'jurisdiction' and column_name = 'worker_identifier_pattern'
  ) then
    alter table clinical.jurisdiction
      add column worker_identifier_pattern varchar(60) not null default '^$';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'clinical' and table_name = 'jurisdiction' and column_name = 'employer_disclosure_profile'
  ) then
    alter table clinical.jurisdiction
      add column employer_disclosure_profile varchar(40) not null default 'unspecified';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'clinical' and table_name = 'jurisdiction' and column_name = 'consent_profile'
  ) then
    alter table clinical.jurisdiction
      add column consent_profile varchar(40) not null default 'unspecified';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'clinical' and table_name = 'jurisdiction' and column_name = 'timezone'
  ) then
    alter table clinical.jurisdiction
      add column timezone varchar(40) not null default 'UTC';
  end if;
end
$jur$;

-- ---------------------------------------------------------------------------
-- 2. jurisdiction_deadline
-- ---------------------------------------------------------------------------
create table if not exists clinical.jurisdiction_deadline (
  jurisdiction_code varchar(4) not null references clinical.jurisdiction(code),
  deadline_kind varchar(40) not null,
  value_days int not null,
  basis varchar(40) not null,
  cutoff_local_time time,
  statutory_source varchar(200) not null,
  primary key (jurisdiction_code, deadline_kind)
);

-- ---------------------------------------------------------------------------
-- 3. clinic.jurisdiction_code (resolve_jurisdiction reads this)
-- ---------------------------------------------------------------------------
do $clinic$
begin
  if to_regclass('clinical.clinic') is not null
     and not exists (
       select 1 from information_schema.columns
       where table_schema = 'clinical' and table_name = 'clinic' and column_name = 'jurisdiction_code'
     ) then
    alter table clinical.clinic
      add column jurisdiction_code varchar(4) references clinical.jurisdiction(code);
  end if;
end
$clinic$;

-- ---------------------------------------------------------------------------
-- 4. Widen worker.phn so the identifier length lives in jurisdiction data,
--    not in a 9 character column.
-- ---------------------------------------------------------------------------
do $phn$
begin
  if to_regclass('clinical.worker') is not null then
    alter table clinical.worker alter column phn type varchar(32);
  end if;
end
$phn$;

-- ---------------------------------------------------------------------------
-- 5. Scope the contract and role matrix by jurisdiction (append only).
-- ---------------------------------------------------------------------------
do $cr$
begin
  if to_regclass('clinical.wcb_contract_role') is not null
     and not exists (
       select 1 from information_schema.columns
       where table_schema = 'clinical' and table_name = 'wcb_contract_role' and column_name = 'jurisdiction_code'
     ) then
    alter table clinical.wcb_contract_role
      add column jurisdiction_code varchar(4) references clinical.jurisdiction(code);
    update clinical.wcb_contract_role
      set jurisdiction_code = 'AB'
      where jurisdiction_code is null;
  end if;

  if to_regclass('clinical.wcb_contract_role_form') is not null
     and not exists (
       select 1 from information_schema.columns
       where table_schema = 'clinical' and table_name = 'wcb_contract_role_form' and column_name = 'jurisdiction_code'
     ) then
    alter table clinical.wcb_contract_role_form
      add column jurisdiction_code varchar(4) references clinical.jurisdiction(code);
    update clinical.wcb_contract_role_form
      set jurisdiction_code = 'AB'
      where jurisdiction_code is null;
  end if;
end
$cr$;

commit;
