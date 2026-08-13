-- Continuum Core Platform Foundations (Prompt 51). S3 consent ledger tests.
--
-- Proves Section 6 and acceptance criteria 21 and 22: the resolver returns the correct state for
-- grant, revocation, re-grant and expiry evaluated at several at_datetime values; a resolver call
-- missing recipient or at_datetime fails rather than assuming one; the ledger is append only; and
-- the shared wording table is read only to a tenant. Run by psql with ON_ERROR_STOP.
--
-- The ledger entries are written as app_clinical under a tenant context, so row level security and
-- the append only wall both apply. The shared text_version row is written as the owner, because a
-- shared table is written through a migration or an administrator, never by a tenant.
--
-- No em dashes or en dashes anywhere.

\set ON_ERROR_STOP on

\set orgC  '44444444-4444-4444-4444-44444444444c'
\set tv    '44444444-4444-4444-4444-4444444444d1'
\set capBy '44444444-4444-4444-4444-4444444444b1'
\set pA    '44444444-4444-4444-4444-4444444444f1'
\set pE    '44444444-4444-4444-4444-4444444444f2'
\set pR    '44444444-4444-4444-4444-4444444444f3'
\set pU    '44444444-4444-4444-4444-4444444444f9'

-- shared wording (owner write)
insert into consent.text_version (id, jurisdiction_code, purpose, version_label, body_text, language_code, approved_by, effective_from)
  values (:'tv', 'AB', 'employer_disclosure', 'v1', 'placeholder wording, not counsel approved', 'en', 'test', '2020-01-01')
  on conflict do nothing;

-- the test provisions its own organisation, so it does not depend on another test file
grant insert on tenancy.organisation to app_clinical;

set role app_clinical;
select set_config('app.organisation_id', :'orgC', false);
insert into tenancy.organisation (id, legal_name, display_name, jurisdiction_code, status)
  values (:'orgC', 'Org C', 'Org C', 'AB', 'active') on conflict do nothing;

-- ledger entries for person A: granted, revoked, re-granted
insert into consent.ledger_entry (organisation_id, subject_person_id, purpose, action, text_version_id, scope_recipient, scope_data_classes, captured_by, capture_method, captured_at, effective_from)
  values (:'orgC', :'pA', 'employer_disclosure', 'granted', :'tv', 'employer:acme', '["restrictions"]'::jsonb, :'capBy', 'in_person', '2026-01-01', '2026-01-01');
insert into consent.ledger_entry (organisation_id, subject_person_id, purpose, action, text_version_id, scope_recipient, scope_data_classes, captured_by, capture_method, captured_at, effective_from)
  values (:'orgC', :'pA', 'employer_disclosure', 'revoked', :'tv', 'employer:acme', '["restrictions"]'::jsonb, :'capBy', 'in_person', '2026-07-01', '2026-07-01');
insert into consent.ledger_entry (organisation_id, subject_person_id, purpose, action, text_version_id, scope_recipient, scope_data_classes, captured_by, capture_method, captured_at, effective_from)
  values (:'orgC', :'pA', 'employer_disclosure', 'granted', :'tv', 'employer:acme', '["restrictions"]'::jsonb, :'capBy', 'in_person', '2026-09-01', '2026-09-01');
-- person E: a grant that expires
insert into consent.ledger_entry (organisation_id, subject_person_id, purpose, action, text_version_id, scope_recipient, scope_data_classes, captured_by, capture_method, captured_at, effective_from, effective_to)
  values (:'orgC', :'pE', 'employer_disclosure', 'granted', :'tv', 'employer:acme', '["restrictions"]'::jsonb, :'capBy', 'in_person', '2026-01-01', '2026-01-01', '2026-11-01');
-- person R: refused
insert into consent.ledger_entry (organisation_id, subject_person_id, purpose, action, text_version_id, scope_recipient, scope_data_classes, captured_by, capture_method, captured_at, effective_from)
  values (:'orgC', :'pR', 'employer_disclosure', 'refused', :'tv', 'employer:acme', '["restrictions"]'::jsonb, :'capBy', 'in_person', '2026-01-01', '2026-01-01');

-- resolver assertions across several at_datetime values
do $$
declare s text;
begin
  s := consent.consent_state('44444444-4444-4444-4444-4444444444f1','employer_disclosure','employer:acme','2025-12-01'::timestamptz);
  if s <> 'never_asked' then raise exception 'FAIL: person A before grant expected never_asked, got %', s; end if;
  s := consent.consent_state('44444444-4444-4444-4444-4444444444f1','employer_disclosure','employer:acme','2026-06-15'::timestamptz);
  if s <> 'granted' then raise exception 'FAIL: person A after grant expected granted, got %', s; end if;
  s := consent.consent_state('44444444-4444-4444-4444-4444444444f1','employer_disclosure','employer:acme','2026-08-01'::timestamptz);
  if s <> 'revoked' then raise exception 'FAIL: person A after revoke expected revoked, got %', s; end if;
  s := consent.consent_state('44444444-4444-4444-4444-4444444444f1','employer_disclosure','employer:acme','2026-10-01'::timestamptz);
  if s <> 'granted' then raise exception 'FAIL: person A after re-grant expected granted, got %', s; end if;
  s := consent.consent_state('44444444-4444-4444-4444-4444444444f2','employer_disclosure','employer:acme','2026-06-01'::timestamptz);
  if s <> 'granted' then raise exception 'FAIL: person E before expiry expected granted, got %', s; end if;
  s := consent.consent_state('44444444-4444-4444-4444-4444444444f2','employer_disclosure','employer:acme','2026-12-01'::timestamptz);
  if s <> 'expired' then raise exception 'FAIL: person E after effective_to expected expired, got %', s; end if;
  s := consent.consent_state('44444444-4444-4444-4444-4444444444f3','employer_disclosure','employer:acme','2026-06-01'::timestamptz);
  if s <> 'refused' then raise exception 'FAIL: person R expected refused, got %', s; end if;
  s := consent.consent_state('44444444-4444-4444-4444-4444444444f9','employer_disclosure','employer:acme','2026-06-01'::timestamptz);
  if s <> 'never_asked' then raise exception 'FAIL: unknown person expected never_asked, got %', s; end if;
end $$;

-- criterion 22: missing recipient or at_datetime fails, never assumes
do $$
begin
  begin
    perform consent.consent_state('44444444-4444-4444-4444-4444444444f1','employer_disclosure', null, '2026-06-01'::timestamptz);
  exception when others then return;  -- expected: recipient is required
  end;
  raise exception 'FAIL: resolver assumed a recipient';
end $$;
do $$
begin
  begin
    perform consent.consent_state('44444444-4444-4444-4444-4444444444f1','employer_disclosure','employer:acme', null);
  exception when others then return;  -- expected: at_datetime is required
  end;
  raise exception 'FAIL: resolver assumed a datetime';
end $$;

-- append only from the application: app_clinical holds no update grant
do $$
begin
  begin
    update consent.ledger_entry set evidence_ref = 'x' where subject_person_id = '44444444-4444-4444-4444-4444444444f1';
  exception when others then return;  -- expected: grant wall
  end;
  raise exception 'FAIL: app_clinical updated the consent ledger';
end $$;

-- shared wording is read only to a tenant
do $$
begin
  begin
    insert into consent.text_version (jurisdiction_code, purpose, version_label, body_text, language_code, approved_by, effective_from)
      values ('AB', 'employer_disclosure', 'v2', 'tenant authored', 'en', 'tenant', '2026-01-01');
  exception when others then return;  -- expected: no tenant write on a shared table
  end;
  raise exception 'FAIL: a tenant wrote the shared consent wording';
end $$;

reset role;

-- append only from the owner: the trigger rejects the update independently of grants
do $$
begin
  begin
    update consent.ledger_entry set evidence_ref = 'y' where subject_person_id = '44444444-4444-4444-4444-4444444444f1';
  exception when others then return;  -- expected: guard_append_only trigger
  end;
  raise exception 'FAIL: the owner updated the append only consent ledger (trigger missing)';
end $$;

\echo 'consent ledger tests passed'
