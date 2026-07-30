-- Continuum Hub email + password accounts, approval gate. Append only; never
-- edit once applied. No dashes anywhere.
--
-- Backs the HUB gate approval layer (deploy/api/hub-signup.js,
-- deploy/api/hub-signin.js, deploy/api/hub-admin.js). Hard wall vs the SITE
-- gate: this migration never reads or references either of the SITE gate's
-- access control tables (supabase/migrations/20260729130000_site_access_gate.sql).
--
-- RLS is on with NO policies for anon or authenticated: only the service
-- role (used exclusively by the three endpoints above) ever reaches this
-- table. There is no client side path to it.

begin;

create table if not exists public.hub_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  access_group text check (access_group in ('group1', 'group2', 'admin')),
  role_label text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by text
);

-- Supports the admin queue read (deploy/api/hub-admin.js lists pending and
-- approved rows, newest first).
create index if not exists hub_profiles_status_idx on public.hub_profiles (status);
create index if not exists hub_profiles_created_at_idx on public.hub_profiles (created_at desc);

alter table public.hub_profiles enable row level security;

-- No policies are created for anon or authenticated. Only the service role
-- (which bypasses RLS entirely) can reach this table, and only from
-- deploy/api/hub-signup.js (insert pending), deploy/api/hub-signin.js (read,
-- and the ADMIN_EMAILS self heal upsert), and deploy/api/hub-admin.js
-- (read, approve, reject).

-- No seed insert here, on purpose, matching the SITE gate migration's own
-- rule against checking in a working credential or identity row. gary@
-- farmceuticawellness.com's admin row is created by deploy/api/hub-signin.js
-- itself, the first time that address signs in successfully (see
-- upsertAdminProfile), once the real auth.users row for that address exists;
-- a row inserted here ahead of that user existing would violate the foreign
-- key to auth.users.

commit;
