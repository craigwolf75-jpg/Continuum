-- Continuum Core Platform Foundations (Prompt 51). S8a employer disclosure release tests.
--
-- Proves Section 4.1 and acceptance criterion 14: a disclosure release with a null
-- consent_ledger_entry_id fails at the database, the release is tenant isolated, and it is append
-- only by grant and by trigger. Run by psql with ON_ERROR_STOP.
--
-- The release is written by app_release, the dedicated release path role. No em dashes or en dashes.

\set ON_ERROR_STOP on

\set orgG   '88888888-8888-8888-8888-888888888801'
\set emp    '88888888-8888-8888-8888-888888888802'
\set src    '88888888-8888-8888-8888-888888888803'
\set cons   '88888888-8888-8888-8888-888888888804'
\set rel    '88888888-8888-8888-8888-888888888805'
\set other  '88888888-8888-8888-8888-8888888888ff'

grant insert on tenancy.organisation to app_clinical;
set role app_clinical;
select set_config('app.organisation_id', :'orgG', false);
insert into tenancy.organisation (id, legal_name, display_name, jurisdiction_code, status)
  values (:'orgG', 'Org G', 'Org G', 'AB', 'active') on conflict do nothing;
reset role;

-- a valid release, written by the release path role
set role app_release;
select set_config('app.organisation_id', :'orgG', false);
insert into employer.disclosure_release (
  organisation_id, employer_party_id, claim_reference, source_report_id, disclosure_profile,
  consent_ledger_entry_id, released_at, released_by, payload, payload_digest)
values (
  :'orgG', :'emp', 'CLAIM123', :'src', 'duties_only',
  :'cons', now(), :'rel', '{"duties":[]}'::jsonb, sha256(convert_to('release', 'UTF8')));

do $$
declare n int;
begin
  select count(*) into n from employer.disclosure_release;
  if n <> 1 then raise exception 'FAIL: org G should see exactly 1 release, saw %', n; end if;
end $$;

-- criterion 14: a null consent_ledger_entry_id fails at the database
do $$
begin
  begin
    insert into employer.disclosure_release (
      organisation_id, employer_party_id, claim_reference, source_report_id, disclosure_profile,
      consent_ledger_entry_id, released_at, released_by, payload, payload_digest)
    values (
      '88888888-8888-8888-8888-888888888801', '88888888-8888-8888-8888-888888888802', 'CLAIM999',
      '88888888-8888-8888-8888-888888888803', 'duties_only',
      null, now(), '88888888-8888-8888-8888-888888888805', '{}'::jsonb, sha256(convert_to('x', 'UTF8')));
  exception when others then return;  -- expected: consent_ledger_entry_id is not null
  end;
  raise exception 'FAIL: a disclosure with a null consent reference was allowed';
end $$;

-- WITH CHECK: a release cannot be written for another tenant
do $$
begin
  begin
    insert into employer.disclosure_release (
      organisation_id, employer_party_id, claim_reference, source_report_id, disclosure_profile,
      consent_ledger_entry_id, released_at, released_by, payload, payload_digest)
    values (
      '88888888-8888-8888-8888-8888888888ff', '88888888-8888-8888-8888-888888888802', 'CLAIM888',
      '88888888-8888-8888-8888-888888888803', 'duties_only',
      '88888888-8888-8888-8888-888888888804', now(), '88888888-8888-8888-8888-888888888805', '{}'::jsonb, sha256(convert_to('x', 'UTF8')));
  exception when others then return;  -- expected: WITH CHECK blocks a cross tenant release
  end;
  raise exception 'FAIL: a release was written for another tenant';
end $$;

-- append only by grant: app_release holds no update
do $$
begin
  begin
    update employer.disclosure_release set claim_reference = 'x';
  exception when others then return;  -- expected: grant wall
  end;
  raise exception 'FAIL: app_release updated a disclosure release';
end $$;

reset role;

-- append only by trigger: the owner update is rejected independently
do $$
begin
  begin
    update employer.disclosure_release set claim_reference = 'y' where organisation_id = '88888888-8888-8888-8888-888888888801';
  exception when others then return;  -- expected: guard_append_only
  end;
  raise exception 'FAIL: the owner updated an append only disclosure release';
end $$;

\echo 'employer disclosure release tests passed'
