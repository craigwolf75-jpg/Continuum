-- Continuum Prompt 40: WCB Alberta form engine schema (migration parts A and B).
-- Source of truth: docs/superpowers/specs/2026-08-09-prompt-40-wcb-form-engine-design.md
-- sections 2 (code lists and reference data) and 2A (form definitions and rules).
--
-- Idempotent: every object is created IF NOT EXISTS and the whole file is safe to
-- re-run. Apply as ONE transaction on the Continuum Supabase project
-- (agzhnmunodrhsjbogzae) via the Management API or the SQL editor. Hand-applied by
-- Gary per the standing rule (Claude never changes the Supabase project directly).
-- No dashes anywhere.

begin;

create schema if not exists clinical;

-- Part A: code lists and reference data (spec Section 2) --------------------

create table if not exists clinical.jurisdiction (
  code varchar(4) primary key, name varchar(80) not null,
  submission_channel varchar(30) not null, active boolean not null default false);

create table if not exists clinical.wcb_code_list (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_code varchar(4) not null references clinical.jurisdiction(code),
  list_name varchar(80) not null,
  source_version varchar(20) not null,
  loaded_at timestamptz not null default now(),
  unique (jurisdiction_code, list_name, source_version));

create table if not exists clinical.wcb_code_value (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references clinical.wcb_code_list(id),
  list_name varchar(80) not null,
  code varchar(20) not null,
  description varchar(200) not null,
  sort_order int, extra jsonb,
  unique (list_id, code),
  unique (list_name, code, list_id));
create index if not exists ix_code_lookup on clinical.wcb_code_value(list_name, code);

create table if not exists clinical.wcb_pob_noi_forbidden (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_code varchar(4) not null,
  noi_code varchar(20) not null, pob_code varchar(20) not null,
  source_version varchar(20) not null,
  unique (jurisdiction_code, noi_code, pob_code, source_version));
create index if not exists ix_pobnoi on clinical.wcb_pob_noi_forbidden(jurisdiction_code, pob_code, noi_code);

create table if not exists clinical.wcb_contract_role (
  contract_id varchar(10) not null, contract_desc varchar(80) not null,
  practitioner_role varchar(10) not null, role_desc varchar(80) not null,
  primary key (contract_id, practitioner_role));

create table if not exists clinical.wcb_contract_role_form (
  id uuid primary key default gen_random_uuid(),
  contract_id varchar(10) not null, practitioner_role varchar(10) not null,
  form_id varchar(6) not null,
  report_kind varchar(10) not null,
  created_from_form_ids varchar(6)[],
  source_version varchar(20) not null,
  foreign key (contract_id, practitioner_role)
    references clinical.wcb_contract_role(contract_id, practitioner_role),
  unique (contract_id, practitioner_role, form_id, report_kind, source_version));
create index if not exists ix_crf_lookup
  on clinical.wcb_contract_role_form(contract_id, practitioner_role, report_kind);

create table if not exists clinical.wcb_fee_schedule (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_code varchar(4) not null, form_id varchar(6) not null,
  practitioner_role varchar(10) not null,
  fee_tier varchar(10) not null,
  amount numeric(10,2) not null,
  effective_from date not null, effective_to date,
  source varchar(200) not null);

create table if not exists clinical.statutory_holiday (
  jurisdiction_code varchar(4) not null, holiday_date date not null,
  name varchar(80) not null, primary key (jurisdiction_code, holiday_date));

-- Part B: form definitions and rules (spec Section 2A) ----------------------

do $enums$
begin
  if not exists (select 1 from pg_type where typname='optionality') then
    create type clinical.optionality as enum (
      'always_required','always_optional',
      'conditionally_available_required','conditionally_available_optional','dataset');
  end if;
end
$enums$;

create table if not exists clinical.form_definition (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_code varchar(4) not null,
  form_id varchar(6) not null, form_name varchar(120) not null,
  version varchar(20) not null, element_count int not null,
  max_attachments int not null default 0,
  effective_from date not null,
  unique (jurisdiction_code, form_id, version));

create table if not exists clinical.form_element (
  id uuid primary key default gen_random_uuid(),
  form_definition_id uuid not null references clinical.form_definition(id),
  element_seq varchar(10) not null,
  element_name varchar(200) not null,
  ui_mapping varchar(10),
  section_name varchar(60) not null,
  data_type varchar(20) not null,
  length_min int, length_max int, format varchar(40),
  min_occurs int not null default 0,
  max_occurs int not null default 1,
  code_list_name varchar(80),
  optionality clinical.optionality not null,
  deprecated boolean not null default false,
  hl7_xpath text not null,
  unique (form_definition_id, element_seq, element_name));
create index if not exists ix_element_form on clinical.form_element(form_definition_id, section_name);

create table if not exists clinical.form_rule (
  id uuid primary key default gen_random_uuid(),
  form_definition_id uuid not null references clinical.form_definition(id),
  rule_code varchar(20) not null,
  ordinal int not null default 1,
  rule_type varchar(20) not null,
  source_document varchar(80) not null,
  source_page int,
  trigger_element_name varchar(200),
  trigger_condition jsonb not null,
  affected_element_names varchar(200)[] not null,
  clears_on_hide boolean not null default true,
  switches_code_list_to varchar(80),
  transcribed_by uuid, transcribed_at timestamptz,
  verified_against_sample_xml boolean not null default false,
  unresolvable boolean not null default false,
  unique (form_definition_id, source_document, source_page, rule_code, ordinal));

commit;
