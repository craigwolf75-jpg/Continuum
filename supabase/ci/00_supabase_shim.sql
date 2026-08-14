-- Continuum exposure-proof CI shim. CI ONLY, never applied to the real Supabase project.
--
-- Recreates, on a stock postgres:15 container, the Supabase managed objects the hub
-- migrations assume so the exposure-proof gate can build the whole schema and seed from
-- scratch with no external database and no secret:
--   - the platform roles (anon, authenticated, service_role, supabase_auth_admin)
--   - the auth claim helpers (auth.jwt / auth.uid / auth.role) reading request.jwt.claims
--     exactly like Supabase, plus a minimal auth.users table the seed links to
--   - stubs for the managed extensions and schemas the migrations touch but the exposure
--     test does not exercise: cron, net, vault, storage, and extensions.digest (pgcrypto)
--
-- The two managed-extension creates (pg_cron, pg_net) are neutralized at apply time by the
-- workflow, since a stock container cannot install them; their call surface is stubbed below.
-- No em dashes or en dashes anywhere.

-- ---------------------------------------------------------------------------
-- Roles. Supabase provisions these; the migrations grant to and revoke from them.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then create role supabase_auth_admin nologin noinherit; end if;
end $$;

-- ---------------------------------------------------------------------------
-- extensions schema + pgcrypto (provides extensions.digest; pgcrypto ships in the
-- postgres:15 contrib packages, so this is a real extension, not a stub).
-- ---------------------------------------------------------------------------
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- auth: the claim helpers read request.jwt.claims the same way Supabase does, so the
-- migrations' jwt_role / jwt_tenant_id / jwt_user_id helpers and RLS work unchanged.
-- ---------------------------------------------------------------------------
create schema if not exists auth;

create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
$$;

create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid;
$$;

create or replace function auth.role() returns text language sql stable as $$
  select auth.jwt() ->> 'role';
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.jwt() to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant execute on function auth.role() to anon, authenticated, service_role;

-- auth.users: GoTrue owns this in Supabase. The seed inserts exactly these columns and
-- public.users.auth_user_id / hub_profiles.id carry foreign keys to auth.users(id).
create table if not exists auth.users (
  id                uuid primary key,
  aud               varchar(255),
  role              varchar(255),
  email             varchar(255),
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  created_at        timestamptz,
  updated_at        timestamptz
);

-- ---------------------------------------------------------------------------
-- pg_cron stub. The container has no scheduler; the migrations only register jobs, and
-- the exposure test never runs them. cron.job carries the jobname the migrations look up.
-- ---------------------------------------------------------------------------
create schema if not exists cron;
create table if not exists cron.job (
  jobid    bigserial primary key,
  jobname  text unique,
  schedule text,
  command  text
);
create or replace function cron.schedule(p_jobname text, p_schedule text, p_command text)
returns bigint language sql as $$
  insert into cron.job (jobname, schedule, command) values (p_jobname, p_schedule, p_command)
    on conflict (jobname) do update set schedule = excluded.schedule, command = excluded.command
  returning jobid;
$$;
create or replace function cron.unschedule(p_jobname text)
returns boolean language plpgsql as $$
begin delete from cron.job where jobname = p_jobname; return true; end;
$$;

-- ---------------------------------------------------------------------------
-- pg_net stub. Outbound HTTP is fire and forget in the migrations (perform net.http_post);
-- the signature matches pg_net so both positional and named-argument calls resolve.
-- ---------------------------------------------------------------------------
create schema if not exists net;
create or replace function net.http_post(
  url text,
  body jsonb default '{}'::jsonb,
  params jsonb default '{}'::jsonb,
  headers jsonb default '{}'::jsonb,
  timeout_milliseconds integer default 5000)
returns bigint language sql as $$ select 0::bigint; $$;

-- ---------------------------------------------------------------------------
-- Supabase Vault stub. Empty by design: no secrets in CI, and every caller selects into a
-- variable that then stays null (the http calls are stubbed anyway).
-- ---------------------------------------------------------------------------
create schema if not exists vault;
create or replace view vault.decrypted_secrets as
  select null::uuid as id, null::text as name, null::text as decrypted_secret where false;

-- ---------------------------------------------------------------------------
-- Supabase Storage stub. Only storage.buckets is written (one bucket row in framer_demo).
-- ---------------------------------------------------------------------------
create schema if not exists storage;
create table if not exists storage.buckets (
  id         text primary key,
  name       text,
  public     boolean default false,
  created_at timestamptz default now()
);
