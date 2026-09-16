-- Deliberate bad fixture: a table in an enforced schema with no tenant
-- column, no RLS, no FORCE, and no policy. CI must fail coverage when this
-- file is applied. Dropped after the expected failure. No em dashes.

create table if not exists tenancy.bad_fixture (
  id uuid primary key
);
