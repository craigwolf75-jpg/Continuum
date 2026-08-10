-- Continuum Prompt 40 (Prompt 39A Section 2.3): the per (form, capability element)
-- code set table. Basic versus Extended is not a coding system carried in the HL7
-- message (OBX.5 is a WILDCARD string); it is a validation rule about which literal
-- restriction tokens are legal for a given capability element on a given form. This
-- table is that rule, stored as configuration and keyed on (form, OBX identifier),
-- never as branching logic (39A Section 2.3). The engine resolver in
-- clinical/engine/capability.mjs reads it to pick the code list for emit_code.
--
-- Apply after 001_migration_wcb_engine.sql. Idempotent, one transaction. Hand
-- applied by Gary. No dashes anywhere.

begin;

create table if not exists clinical.wcb_capability_code_set (
  id uuid primary key default gen_random_uuid(),
  form_id varchar(6) not null,
  obx_identifier varchar(60) not null,
  element_label varchar(80) not null,
  code_set varchar(20) not null
    check (code_set in ('basic', 'extended', 'conditional', 'able_unable_only')),
  -- for code_set = 'conditional' only (C151S): the flag element that selects the
  -- list, and the flag value that selects Basic (39A Section 2.4).
  conditional_flag_obx varchar(60),
  conditional_basic_value varchar(4),
  source_version varchar(20) not null,
  unique (form_id, obx_identifier),
  -- a conditional row must name its flag and the Basic selecting value; a non
  -- conditional row must not.
  check (
    (code_set = 'conditional' and conditional_flag_obx is not null and conditional_basic_value is not null)
    or (code_set <> 'conditional' and conditional_flag_obx is null and conditional_basic_value is null)
  )
);
create index if not exists ix_capset on clinical.wcb_capability_code_set(form_id, obx_identifier);

commit;
