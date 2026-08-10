-- Continuum Prompt 42: the HL7 wire map table. Per (form, element) HL7 placement
-- (segment, field position, and OBX.3 identifier for OBX encoded elements), loaded
-- from the accreditation workbook. This is what Prompt 40 did not load: form_element
-- carries only the canonical New XPath, not the wire format. Apply after 001. No dashes.

begin;

create table if not exists clinical.wcb_hl7_wire_map (
  id uuid primary key default gen_random_uuid(),
  form_id varchar(6) not null,
  element_seq varchar(10) not null,
  element_name varchar(200) not null,
  segment varchar(12),
  field_seq varchar(8),
  obx_identifier varchar(60),
  unique (form_id, element_seq, element_name)
);
create index if not exists ix_wire_map_form on clinical.wcb_hl7_wire_map(form_id);
create index if not exists ix_wire_map_obx on clinical.wcb_hl7_wire_map(form_id, obx_identifier);

commit;
