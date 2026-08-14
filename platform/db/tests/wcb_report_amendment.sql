-- Continuum Core Platform Foundations (Prompt 51). wcb_report amendment chain tests (S8 redesign,
-- expand phase).
--
-- Proves migration 0014: wcb_report carries the Section 5.2 amendment chain columns, the report_status
-- enum gained superseded and withdrawn without losing the Prompt 42 submission values, a superseding
-- report records a supersedes_report_id and an amendment_reason and the original moves to superseded,
-- and a superseding report with no amendment_reason is rejected by the new check. The submission
-- lifecycle is left intact (no immutability trigger is attached that would block signed to submitted).
--
-- Run as the owner (the amendment chain and the check are what is under test; row level security on
-- wcb_report is proven in the S8c tenant retrofit test). The foreign key parents are seeded first.
-- Run by psql with ON_ERROR_STOP, after clinical/db and the platform migrations. No em dashes.

\set ON_ERROR_STOP on

-- seed the foreign key chain (owner bypasses row level security)
insert into tenancy.organisation (id, legal_name, display_name, jurisdiction_code, status)
  values ('11112222-3333-4444-5555-666677778888', 'Org Z', 'Org Z', 'AB', 'active') on conflict do nothing;
insert into clinical.clinic (id, organisation_id, name)
  values ('11112222-3333-4444-5555-66667777aaaa', '11112222-3333-4444-5555-666677778888', 'Clinic One') on conflict do nothing;
insert into clinical.worker (id, organisation_id, family_name, given_name)
  values ('11112222-3333-4444-5555-66667777bbbb', '11112222-3333-4444-5555-666677778888', 'Sub', 'Ject') on conflict do nothing;
insert into clinical.practitioner (id, clinic_id, billing_number, family_name, given_name, role_code)
  values ('11112222-3333-4444-5555-66667777cccc', '11112222-3333-4444-5555-66667777aaaa', 'G00001', 'Doc', 'Tor', 'GP') on conflict do nothing;
insert into clinical.wcb_case (id, organisation_id, clinic_id, worker_id)
  values ('11112222-3333-4444-5555-66667777dddd', '11112222-3333-4444-5555-666677778888',
          '11112222-3333-4444-5555-66667777aaaa', '11112222-3333-4444-5555-66667777bbbb') on conflict do nothing;

-- the original signed report
insert into clinical.wcb_report (id, organisation_id, case_id, practitioner_id, form_id, version, status)
  values ('11112222-3333-4444-5555-6666777e0001', '11112222-3333-4444-5555-666677778888',
          '11112222-3333-4444-5555-66667777dddd', '11112222-3333-4444-5555-66667777cccc', 'C050E', 1, 'signed');

-- the superseding report: carries supersedes_report_id and an amendment_reason (the check is satisfied)
insert into clinical.wcb_report (id, organisation_id, case_id, practitioner_id, form_id, version, status, supersedes_report_id, amendment_reason)
  values ('11112222-3333-4444-5555-6666777e0002', '11112222-3333-4444-5555-666677778888',
          '11112222-3333-4444-5555-66667777dddd', '11112222-3333-4444-5555-66667777cccc', 'C050E', 2, 'signed',
          '11112222-3333-4444-5555-6666777e0001', 'corrected the lifting value');

-- the original moves to superseded (the submission lifecycle is not blocked, no immutability trigger)
update clinical.wcb_report
  set status = 'superseded', superseded_by_id = '11112222-3333-4444-5555-6666777e0002'
  where id = '11112222-3333-4444-5555-6666777e0001';

do $$
declare v_status text; v_supersedes uuid;
begin
  select status into v_status from clinical.wcb_report where id = '11112222-3333-4444-5555-6666777e0001';
  if v_status <> 'superseded' then raise exception 'FAIL: the original report should be superseded, is %', v_status; end if;
  select supersedes_report_id into v_supersedes from clinical.wcb_report where id = '11112222-3333-4444-5555-6666777e0002';
  if v_supersedes <> '11112222-3333-4444-5555-6666777e0001' then raise exception 'FAIL: the superseding report does not point at the original'; end if;
end $$;

-- a superseding report with no amendment_reason is rejected by the new check
do $$
begin
  begin
    insert into clinical.wcb_report (id, organisation_id, case_id, practitioner_id, form_id, version, status, supersedes_report_id)
      values (gen_random_uuid(), '11112222-3333-4444-5555-666677778888',
              '11112222-3333-4444-5555-66667777dddd', '11112222-3333-4444-5555-66667777cccc', 'C050E', 3, 'signed',
              '11112222-3333-4444-5555-6666777e0001');
  exception when others then return;  -- expected: ck_wcb_report_amendment_reason
  end;
  raise exception 'FAIL: a superseding report with no amendment reason was allowed';
end $$;

-- the new withdrawn status exists and is usable (proves the enum add), and the submission values
-- from Prompt 42 are still present
do $$
declare n int;
begin
  update clinical.wcb_report set status = 'withdrawn' where id = '11112222-3333-4444-5555-6666777e0002';
  select count(*) into n from pg_enum e join pg_type t on t.oid = e.enumtypid
    where t.typname = 'report_status' and e.enumlabel in ('submitted','accepted','rejected','superseded','withdrawn');
  if n <> 5 then raise exception 'FAIL: report_status should keep the submission values and gain superseded and withdrawn, found % of 5', n; end if;
end $$;

\echo 'wcb_report amendment chain tests passed'
