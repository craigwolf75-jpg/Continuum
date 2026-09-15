-- Continuum Prompt 45: provincial rules seed.
-- Apply AFTER 021_migration_provincial_rules.sql (and after 002, which already
-- inserted Alberta plus inactive BC through YT). One transaction. Idempotent.
--
-- Does NOT invent Ontario or BC form packs. Inactive 002 rows stay inactive
-- with placeholder profile fields only. ZZ is the unmistakably fake synthetic
-- pack (TEST prefixed forms, Synthetic in board_name).
-- No dashes anywhere.

begin;

-- Alberta: widen the existing row. submission_channel supersedes 002 batch_hl7.
update clinical.jurisdiction set
  board_name = 'WCB Alberta',
  submission_channel = 'batch_xml_upload',
  practitioner_credential_label = 'billing number',
  practitioner_credential_pattern = '^.{8}$',
  worker_identifier_label = 'Worker personal health number',
  worker_identifier_pattern = '^[0-9]{9}$',
  employer_disclosure_profile = 'alberta_pink_copy',
  consent_profile = 'alberta_statutory_report',
  timezone = 'America/Edmonton',
  active = true
where code = 'AB';

-- Inactive real provinces from 002: fill required columns, do not activate, do
-- not attach a form pack.
update clinical.jurisdiction set
  board_name = name || ' board (inactive, no pack)',
  submission_channel = 'none',
  practitioner_credential_label = 'unspecified',
  practitioner_credential_pattern = '^$',
  worker_identifier_label = 'unspecified',
  worker_identifier_pattern = '^$',
  employer_disclosure_profile = 'unspecified',
  consent_profile = 'unspecified',
  timezone = 'UTC',
  active = false
where code in ('BC','MB','NB','NL','NT','NS','NU','ON','PE','QC','SK','YT');

-- Synthetic ZZ. Inactive until activateJurisdiction proves the pack is complete.
insert into clinical.jurisdiction(
  code, name, board_name, submission_channel,
  practitioner_credential_label, practitioner_credential_pattern,
  worker_identifier_label, worker_identifier_pattern,
  employer_disclosure_profile, consent_profile, timezone, active
) values (
  'ZZ', 'Synthetic Test Jurisdiction', 'Synthetic Test Board', 'synthetic',
  'synthetic credential', '^SYN[0-9]{3}$',
  'Synthetic Worker Number', '^SW[0-9]{4}$',
  'synthetic_open', 'synthetic_test', 'UTC', false
) on conflict (code) do update set
  name = excluded.name,
  board_name = excluded.board_name,
  submission_channel = excluded.submission_channel,
  practitioner_credential_label = excluded.practitioner_credential_label,
  practitioner_credential_pattern = excluded.practitioner_credential_pattern,
  worker_identifier_label = excluded.worker_identifier_label,
  worker_identifier_pattern = excluded.worker_identifier_pattern,
  employer_disclosure_profile = excluded.employer_disclosure_profile,
  consent_profile = excluded.consent_profile,
  timezone = excluded.timezone,
  active = clinical.jurisdiction.active;

insert into clinical.jurisdiction_deadline(
  jurisdiction_code, deadline_kind, value_days, basis, cutoff_local_time, statutory_source
) values
  ('AB', 'first_report', 2, 'calendar', null, 'Workers Compensation Act s.34(1)'),
  ('AB', 'rtw_opinion', 3, 'calendar', null, 'C459 Physician Reference Guide'),
  ('AB', 'same_day_cutoff', 1, 'business', '10:00', 'WCB Fee Schedule, Appendix A'),
  ('ZZ', 'first_report', 5, 'calendar', null, 'Synthetic pack (not a real statute)'),
  ('ZZ', 'same_day_cutoff', 1, 'business', '12:00', 'Synthetic pack (not a real statute)')
on conflict (jurisdiction_code, deadline_kind) do nothing;

insert into clinical.statutory_holiday(jurisdiction_code, holiday_date, name) values
  ('AB', '2026-01-01', 'New Year Day'),
  ('AB', '2026-02-16', 'Family Day'),
  ('AB', '2026-04-03', 'Good Friday'),
  ('AB', '2026-05-18', 'Victoria Day'),
  ('AB', '2026-07-01', 'Canada Day'),
  ('AB', '2026-08-03', 'Heritage Day'),
  ('AB', '2026-09-07', 'Labour Day'),
  ('AB', '2026-10-12', 'Thanksgiving Day'),
  ('AB', '2026-11-11', 'Remembrance Day'),
  ('AB', '2026-12-25', 'Christmas Day'),
  ('ZZ', '2099-01-01', 'Synthetic Day')
on conflict (jurisdiction_code, holiday_date) do nothing;

insert into clinical.wcb_fee_schedule(
  jurisdiction_code, form_id, practitioner_role, fee_tier, amount, effective_from, source
)
select v.jurisdiction_code, v.form_id, v.practitioner_role, v.fee_tier, v.amount, v.effective_from::date, v.source
from (values
  ('ZZ', 'TEST01', 'GP', 'same_day', 1.00, '2026-01-01', 'Synthetic pack (not a real fee)'),
  ('ZZ', 'TEST01', 'GP', 'on_time', 0.75, '2026-01-01', 'Synthetic pack (not a real fee)'),
  ('ZZ', 'TEST02', 'GP', 'on_time', 0.50, '2026-01-01', 'Synthetic pack (not a real fee)')
) as v(jurisdiction_code, form_id, practitioner_role, fee_tier, amount, effective_from, source)
where not exists (
  select 1 from clinical.wcb_fee_schedule s
  where s.jurisdiction_code = v.jurisdiction_code
    and s.form_id = v.form_id
    and s.practitioner_role = v.practitioner_role
    and s.fee_tier = v.fee_tier
    and s.effective_from = v.effective_from::date
);

insert into clinical.form_definition(
  jurisdiction_code, form_id, form_name, version, element_count, max_attachments, effective_from
) values
  ('ZZ', 'TEST01', 'Synthetic First Report', '1.0', 6, 0, '2026-01-01'),
  ('ZZ', 'TEST02', 'Synthetic Progress Report', '1.0', 6, 0, '2026-01-01')
on conflict (jurisdiction_code, form_id, version) do nothing;

insert into clinical.form_element(
  form_definition_id, element_seq, element_name, ui_mapping, section_name, data_type,
  length_min, length_max, format, min_occurs, max_occurs, code_list_name, optionality, deprecated, hl7_xpath
)
select fd.id, e.element_seq, e.element_name, e.ui_mapping, e.section_name, e.data_type,
       e.length_min::int, e.length_max::int, e.format, e.min_occurs::int, e.max_occurs::int,
       e.code_list_name, e.optionality::clinical.optionality, e.deprecated::boolean, e.hl7_xpath
from clinical.form_definition fd
join (values
  ('1','Form ID',null,'General','Char',6,6,null,1,1,null,'always_required',false,'/SyntheticReport/Report/Type/'),
  ('2','Patient does not have a Synthetic Worker Number','A1','Worker','Alpha',1,1,null,1,1,'Synthetic Yes No','always_required',false,'/SyntheticReport/Worker/HasNoIdentifier/'),
  ('3','Synthetic Worker Number','A2','Worker','Char',6,6,null,0,1,null,'conditionally_available_required',false,'/SyntheticReport/Worker/Identifier/'),
  ('4','Status','B1','Report','Char',1,8,null,1,1,'Synthetic Status Codes','always_required',false,'/SyntheticReport/Report/Status/'),
  ('5','Narrative','B2','Report','Char',0,200,null,0,1,null,'always_optional',false,'/SyntheticReport/Report/Narrative/'),
  ('6','Practitioner credential','C1','Practitioner','Char',6,6,null,1,1,null,'always_required',false,'/SyntheticReport/Practitioner/Credential/')
) as e(element_seq,element_name,ui_mapping,section_name,data_type,length_min,length_max,format,min_occurs,max_occurs,code_list_name,optionality,deprecated,hl7_xpath) on true
where fd.jurisdiction_code='ZZ' and fd.form_id='TEST01' and fd.version='1.0'
on conflict (form_definition_id, element_seq, element_name) do nothing;

insert into clinical.form_element(
  form_definition_id, element_seq, element_name, ui_mapping, section_name, data_type,
  length_min, length_max, format, min_occurs, max_occurs, code_list_name, optionality, deprecated, hl7_xpath
)
select fd.id, e.element_seq, e.element_name, e.ui_mapping, e.section_name, e.data_type,
       e.length_min::int, e.length_max::int, e.format, e.min_occurs::int, e.max_occurs::int,
       e.code_list_name, e.optionality::clinical.optionality, e.deprecated::boolean, e.hl7_xpath
from clinical.form_definition fd
join (values
  ('1','Form ID',null,'General','Char',6,6,null,1,1,null,'always_required',false,'/SyntheticReport/Report/Type/'),
  ('2','Parent form','A1','General','Char',6,6,null,1,1,null,'always_required',false,'/SyntheticReport/Report/ParentForm/'),
  ('3','Synthetic Worker Number','A2','Worker','Char',6,6,null,1,1,null,'always_required',false,'/SyntheticReport/Worker/Identifier/'),
  ('4','Status','B1','Report','Char',1,8,null,1,1,'Synthetic Status Codes','always_required',false,'/SyntheticReport/Report/Status/'),
  ('5','Narrative','B2','Report','Char',0,200,null,0,1,null,'always_optional',false,'/SyntheticReport/Report/Narrative/'),
  ('6','Follow up flag','B3','Report','Alpha',1,1,null,1,1,'Synthetic Yes No','always_required',false,'/SyntheticReport/Report/FollowUp/')
) as e(element_seq,element_name,ui_mapping,section_name,data_type,length_min,length_max,format,min_occurs,max_occurs,code_list_name,optionality,deprecated,hl7_xpath) on true
where fd.jurisdiction_code='ZZ' and fd.form_id='TEST02' and fd.version='1.0'
on conflict (form_definition_id, element_seq, element_name) do nothing;

insert into clinical.form_rule(
  form_definition_id, rule_code, ordinal, rule_type, source_document, source_page,
  trigger_element_name, trigger_condition, affected_element_names, clears_on_hide
)
select fd.id, 'SYN1', 1, 'conditional', 'synthetic-pack', 1,
       'Patient does not have a Synthetic Worker Number',
       '{"equals":"N"}'::jsonb,
       array['Synthetic Worker Number']::varchar(200)[],
       true
from clinical.form_definition fd
where fd.jurisdiction_code='ZZ' and fd.form_id='TEST01' and fd.version='1.0'
on conflict do nothing;

insert into clinical.wcb_code_list(jurisdiction_code, list_name, source_version) values
  ('ZZ', 'Synthetic Status Codes', 'ZZ.1'),
  ('ZZ', 'Synthetic Yes No', 'ZZ.1')
on conflict do nothing;

insert into clinical.wcb_code_value(list_id, list_name, code, description, sort_order)
select l.id, v.list_name, v.code, v.description, v.sort_order
from clinical.wcb_code_list l
join (values
  ('Synthetic Status Codes', 'OPEN', 'Open', 1),
  ('Synthetic Status Codes', 'CLOSED', 'Closed', 2),
  ('Synthetic Yes No', 'Y', 'Yes', 1),
  ('Synthetic Yes No', 'N', 'No', 2)
) as v(list_name, code, description, sort_order) on v.list_name = l.list_name
where l.jurisdiction_code = 'ZZ' and l.source_version = 'ZZ.1'
on conflict do nothing;

insert into clinical.wcb_contract_role(contract_id, contract_desc, practitioner_role, role_desc, jurisdiction_code) values
  ('SYN001', 'Synthetic General', 'GP', 'General Practitioner', 'ZZ')
on conflict (contract_id, practitioner_role) do nothing;

insert into clinical.wcb_contract_role_form(
  contract_id, practitioner_role, form_id, report_kind, created_from_form_ids, source_version, jurisdiction_code
) values
  ('SYN001', 'GP', 'TEST01', 'initial', null, 'ZZ.1', 'ZZ'),
  ('SYN001', 'GP', 'TEST02', 'progress', null, 'ZZ.1', 'ZZ')
on conflict do nothing;

commit;
