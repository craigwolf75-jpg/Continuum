-- Continuum clinical identity shim. CI ONLY, never applied to the live
-- Supabase project. Same class as supabase/ci/00_supabase_shim.sql.
--
-- Stock postgres:15 has no clinical or employer schemas. Worker shipping
-- migrations bind to clinical.worker, clinical.wcb_case,
-- employer.published_restriction_set, and employer.duty_match_line. This
-- file stubs those objects IF NOT EXISTS so exposure-proof can apply the
-- worker graph. No passwords. No secrets. No em dashes or en dashes.

create schema if not exists clinical;
create schema if not exists employer;

grant usage on schema clinical to authenticated, anon, service_role;
grant usage on schema employer to authenticated, anon, service_role;

create table if not exists clinical.worker (
  id uuid primary key,
  given_name text,
  family_name text
);

create table if not exists clinical.wcb_case (
  id uuid primary key,
  worker_id uuid,
  clinic_id uuid,
  claim_number text,
  date_of_injury date
);

create table if not exists employer.published_restriction_set (
  id uuid primary key,
  case_ref uuid,
  published_at timestamptz default now(),
  withdrawn_at timestamptz,
  reassessment_date date
);

create table if not exists employer.duty_match_line (
  restriction_set_id uuid,
  duty_name text,
  verdict text
);
