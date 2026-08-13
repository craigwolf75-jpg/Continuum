-- Continuum Core Platform Foundations (Prompt 51). Migration 0002: the tenancy foundation.
--
-- Section 3.1 hierarchy (Prompt 47 one way door E1): organisation to region to location, modelled
-- even when a customer has exactly one of each. Section 3.2 tenant column on every row. Section
-- 3.4 isolation enforced by row level security with FORCE and WITH CHECK. Section 10 naming and
-- key standards.
--
-- Guardrails (Prompt 50a):
--   (a) The per schema grants below are the primary wall; row level security is defense in depth
--       on top of them. The banned column test and the no cross schema foreign key rule are not
--       touched by this migration.
--   (b) The policies read the tenant from current_setting('app.organisation_id') using the strict
--       form, so an ABSENT tenant context RAISES and the operation fails closed. There is no
--       default tenant. The value is set server side inside the transaction with set_config and
--       is never accepted from client input.
--   (c) Idempotent, ordered, ALTER never drop.
--
-- The tenancy.organisation table is the tenant root: it is isolated by its own id, not by an
-- organisation_id column, which is a structural property of being the root and is NOT a second
-- entry in the tenant exception allow list (that list stays at exactly one, mpi.person).
--
-- No em dashes or en dashes anywhere.

create schema if not exists tenancy;

-- ---------------------------------------------------------------------------
-- organisation: the tenant root. Isolated by id.
-- ---------------------------------------------------------------------------
create table if not exists tenancy.organisation (
  id                uuid primary key default gen_random_uuid(),
  legal_name        varchar(200) not null,
  display_name      varchar(200) not null,
  jurisdiction_code varchar(4) not null,
  status            varchar(20) not null,
  created_at        timestamptz not null default now(),
  activated_at      timestamptz,
  suspended_at      timestamptz,
  closed_at         timestamptz,
  archived_at       timestamptz,
  constraint ck_organisation_status
    check (status in ('prospect','onboarding','active','suspended','closed','archived')));

-- ---------------------------------------------------------------------------
-- region: carries organisation_id (tenant column). The unique (id, organisation_id) exists so
-- location can carry a composite foreign key that pins a region to its organisation.
-- ---------------------------------------------------------------------------
create table if not exists tenancy.region (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references tenancy.organisation(id),
  name            varchar(200) not null,
  status          varchar(20) not null,
  created_at      timestamptz not null default now(),
  constraint ck_region_status check (status in ('active','suspended','closed','archived')),
  constraint ux_region_id_organisation unique (id, organisation_id));

-- ---------------------------------------------------------------------------
-- location: carries organisation_id (tenant column) and its own jurisdiction and timezone,
-- because a customer will run sites in two provinces and a board deadline is a local time.
-- The composite foreign key (region_id, organisation_id) is load bearing: without it a location
-- could point at a region belonging to a different organisation, a cross tenant path that row
-- level security would not catch.
-- ---------------------------------------------------------------------------
create table if not exists tenancy.location (
  id                      uuid primary key default gen_random_uuid(),
  organisation_id         uuid not null references tenancy.organisation(id),
  region_id               uuid not null references tenancy.region(id),
  name                    varchar(200) not null,
  jurisdiction_code       varchar(4) not null,
  board_clinic_identifier varchar(40),
  timezone                varchar(40) not null,
  status                  varchar(20) not null,
  created_at              timestamptz not null default now(),
  constraint ck_location_status check (status in ('active','suspended','closed','archived')),
  constraint fk_location_region_organisation
    foreign key (region_id, organisation_id)
    references tenancy.region (id, organisation_id));

create index if not exists ix_region_organisation on tenancy.region(organisation_id);
create index if not exists ix_location_organisation on tenancy.location(organisation_id);
create index if not exists ix_location_region on tenancy.location(region_id);

-- ---------------------------------------------------------------------------
-- Row level security: enable, FORCE (so the owner is subject to it too), and a fail closed
-- policy per table. The strict current_setting call RAISES when the tenant is unset.
-- ---------------------------------------------------------------------------
alter table tenancy.organisation enable row level security;
alter table tenancy.organisation force  row level security;
alter table tenancy.region       enable row level security;
alter table tenancy.region       force  row level security;
alter table tenancy.location     enable row level security;
alter table tenancy.location     force  row level security;

drop policy if exists organisation_isolation on tenancy.organisation;
create policy organisation_isolation on tenancy.organisation
  using      (id = current_setting('app.organisation_id')::uuid)
  with check (id = current_setting('app.organisation_id')::uuid);

drop policy if exists region_isolation on tenancy.region;
create policy region_isolation on tenancy.region
  using      (organisation_id = current_setting('app.organisation_id')::uuid)
  with check (organisation_id = current_setting('app.organisation_id')::uuid);

drop policy if exists location_isolation on tenancy.location;
create policy location_isolation on tenancy.location
  using      (organisation_id = current_setting('app.organisation_id')::uuid)
  with check (organisation_id = current_setting('app.organisation_id')::uuid);

-- ---------------------------------------------------------------------------
-- Grants (the primary wall). The application roles may resolve their own organisation, region
-- and location; row level security limits every read and write to their own tenant. Writes to
-- the tenancy tables (provisioning and lifecycle) are a separate administrative path built later,
-- so no application role is granted insert, update or delete here.
-- ---------------------------------------------------------------------------
grant usage on schema tenancy to app_clinical, app_employer, app_release, app_readonly;
grant select on tenancy.organisation, tenancy.region, tenancy.location
  to app_clinical, app_employer, app_release, app_readonly;

insert into platform.schema_migration (version) values ('0002')
  on conflict (version) do nothing;
