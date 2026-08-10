-- Continuum Prompt 40 (Prompt 39A Section 3.1, acceptance criterion 4): the per
-- form OBX skeleton. The board's convention is to emit the form's FULL OBX
-- skeleton in a fixed order and leave unused observations present with an empty
-- value (<OBX.5 />), never absent and never the HL7 null. So the skeleton and its
-- order are configuration, driven from the board's own sample XML for each form.
-- The XML generation prompt reads this table to emit the observations in order;
-- the engine verifier (clinical/engine/obx.mjs) asserts a generated set matches.
--
-- Apply after 001_migration_wcb_engine.sql. Idempotent, one transaction. Hand
-- applied by Gary. No dashes anywhere.

begin;

create table if not exists clinical.wcb_obx_skeleton (
  id uuid primary key default gen_random_uuid(),
  form_id varchar(6) not null,
  -- position of the observation in the fixed OBX order for the form (1 based).
  ordinal int not null,
  obx_identifier varchar(60) not null,
  -- the board sample the skeleton was read from (provenance).
  source_sample varchar(80) not null,
  unique (form_id, ordinal),
  unique (form_id, obx_identifier)
);
create index if not exists ix_obx_skeleton on clinical.wcb_obx_skeleton(form_id, ordinal);

commit;
