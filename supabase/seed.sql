-- Continuum demo seed (07.1 deliverable).
-- One tenant (Worley, ab), one user per role, the Marcus Bedard case
-- (NX-2026-00481). Idempotent via fixed UUIDs + on conflict do nothing.
-- No em-dashes or en-dashes anywhere.
--
-- This is DEMO data for the pre-pilot preview environment, not production
-- record data. Kept out of the migrations chain on purpose.
--
-- Fixed UUID scheme:
--   tenant  1111...1111
--   auth.users   a000...000N
--   public.users b000...000N
--   worker  c000...0001    injury d000...0001

-- ------------------------------------------------------------
-- Tenant
-- ------------------------------------------------------------
insert into public.tenants
  (id, name, province, wcb_account_number, branding, light_duty_task_bank, rtw_obligation_frame, status)
values (
  '11111111-1111-1111-1111-111111111111',
  'Worley', 'ab', 'AB-1002547',
  '{"display_name":"Worley","logo_url":null,"colors":{"navy":"#0E1B2C","gold":"#C8972F"}}'::jsonb,
  '[
     {"task":"Tool crib inventory count","lift_limit_kg":5,"standing":false,"hours":4},
     {"task":"Safety documentation filing","lift_limit_kg":2,"standing":false,"hours":6},
     {"task":"Yard walkdown and tagging","lift_limit_kg":0,"standing":true,"hours":4}
   ]'::jsonb,
  'incentive', 'active'
)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- auth.users (minimal rows so public.users.auth_user_id links resolve)
-- ------------------------------------------------------------
insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('a0000000-0000-0000-0000-000000000001','authenticated','authenticated','marcus.bedard@worley.demo','{}'::jsonb,'{}'::jsonb, now(), now()),
  ('a0000000-0000-0000-0000-000000000002','authenticated','authenticated','dana.whitecloud@worley.demo','{}'::jsonb,'{}'::jsonb, now(), now()),
  ('a0000000-0000-0000-0000-000000000003','authenticated','authenticated','priya.nair@worley.demo','{}'::jsonb,'{}'::jsonb, now(), now()),
  ('a0000000-0000-0000-0000-000000000004','authenticated','authenticated','officer.tremblay@wcb.demo','{}'::jsonb,'{}'::jsonb, now(), now()),
  ('a0000000-0000-0000-0000-000000000005','authenticated','authenticated','dr.tanaka@nexus.demo','{}'::jsonb,'{}'::jsonb, now(), now())
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- public.users (one per role; tenant_id NULL for cross-tenant roles)
-- ------------------------------------------------------------
insert into public.users (id, auth_user_id, phone, email, full_name, role, tenant_id, status, language)
values
  ('b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','+15875550101','marcus.bedard@worley.demo','Marcus Bedard','worker','11111111-1111-1111-1111-111111111111','active','en'),
  ('b0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000002','+15875550102','dana.whitecloud@worley.demo','Dana Whitecloud','hse','11111111-1111-1111-1111-111111111111','active','en'),
  ('b0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000003','+15875550103','priya.nair@worley.demo','Priya Nair','employer_admin','11111111-1111-1111-1111-111111111111','active','en'),
  ('b0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000004','+15875550104','officer.tremblay@wcb.demo','Officer Tremblay','wcb_officer',null,'active','en'),
  ('b0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000005','+15875550105','dr.tanaka@nexus.demo','Dr Aiko Tanaka','nexus_physician',null,'active','en')
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- Worker (Marcus Bedard)
-- ------------------------------------------------------------
insert into public.workers (id, tenant_id, user_id, job_title, shift_rotation, hire_date)
values (
  'c0000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'b0000000-0000-0000-0000-000000000001',
  'Journeyman Pipefitter', '14 on 7 off', date '2021-03-15'
)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- Injury: the client intake example, status reported (fresh intake)
-- ------------------------------------------------------------
insert into public.injuries
  (id, tenant_id, worker_id, date_of_injury, body_part, injury_type, severity,
   prognosis_days, diagnosis_notes, status, estimated_return_date, nexus_case_ref)
values (
  'd0000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'c0000000-0000-0000-0000-000000000001',
  date '2026-07-14', 'right shoulder', 'msk_strain', 'moderate',
  21,
  'Right shoulder musculoskeletal strain. Initial restriction: no lifting above shoulder height.',
  'reported', date '2026-08-04', 'NX-2026-00481'
)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- Access grants for the cross-tenant roles (RLS gate)
--   nexus physician: grant on the specific injury
--   wcb officer:     grant on the tenant
-- ------------------------------------------------------------
insert into public.access_grants (id, user_id, tenant_id, injury_id, access)
values
  ('e0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000005', null, 'd0000000-0000-0000-0000-000000000001','read'),
  ('e0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111', null,'read')
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- Consent for the worker (collection is gated on a current consent, 07.10)
-- ------------------------------------------------------------
insert into public.consents (id, tenant_id, user_id, version, scope, granted_at)
values (
  'f0000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'b0000000-0000-0000-0000-000000000001',
  'v1',
  '{"employer":"functional_status_only","clinician":"full_detail","wcb":"legal_milestones"}'::jsonb,
  now()
)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- WCB initial notification queued at intake (pending), SIN masked
-- ------------------------------------------------------------
insert into public.wcb_notifications (id, tenant_id, injury_id, type, payload, status)
values (
  '90000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'd0000000-0000-0000-0000-000000000001',
  'initial',
  '{"wcb_account_number":"AB-1002547","worker_name":"Marcus Bedard","sin_masked":"***-**-1234","dob":"1989-06-02","date_of_injury":"2026-07-14","body_part":"right shoulder","incident_description":"Overhead lift strain during pipe rack assembly.","time_lost":true}'::jsonb,
  'pending'
)
on conflict (id) do nothing;
