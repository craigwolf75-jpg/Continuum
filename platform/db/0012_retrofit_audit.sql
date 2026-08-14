-- Continuum Core Platform Foundations (Prompt 51). Migration 0012: S8e, retrofit the physician
-- stream audit tables to Prompt 51 tenant isolation.
--
-- audit.event (migration 016) and audit.ai_generation (migration 017) are the physician stream's
-- append only audit tables (each revokes UPDATE and DELETE and attaches audit.block_mutation).
-- audit.record (the platform audit, migration 0005) already carries organisation_id and isolation.
-- This brings the two physician audit tables to the same standard: organisation_id referencing
-- tenancy.organisation, row level security enabled and FORCEd, a fail closed policy, and a SELECT
-- and INSERT only grant so they stay append only (the migration 016 and 017 revoke and trigger
-- remain the enforcement). The tables are empty, so the column is set NOT NULL with no backfill.
--
-- Note: audit.ai_generation has a bigserial primary key, which predates Prompt 51 Section 10.2 and
-- is left unchanged here; changing a primary key is not part of a tenant isolation retrofit.
--
-- Idempotent, ALTER never drop. Hand applied by Gary after clinical/db and platform/db 0000 to 0011.
-- No em dashes or en dashes anywhere.

do $retrofit$
declare
  t      text;
  tables text[] := array['event', 'ai_generation'];
begin
  foreach t in array tables loop
    if to_regclass('audit.' || t) is null then
      raise notice 'skip: audit.% is absent', t;
      continue;
    end if;

    execute format('alter table audit.%I add column if not exists organisation_id uuid', t);
    execute format('alter table audit.%I alter column organisation_id set not null', t);

    if not exists (select 1 from pg_constraint where conname = 'fk_audit_' || t || '_organisation') then
      execute format(
        'alter table audit.%I add constraint %I foreign key (organisation_id) references tenancy.organisation(id)',
        t, 'fk_audit_' || t || '_organisation');
    end if;

    execute format('alter table audit.%I enable row level security', t);
    execute format('alter table audit.%I force  row level security', t);
    execute format('drop policy if exists %I on audit.%I', t || '_isolation', t);
    execute format(
      'create policy %I on audit.%I using (organisation_id = (select current_setting(''app.organisation_id''))::uuid) with check (organisation_id = (select current_setting(''app.organisation_id''))::uuid)',
      t || '_isolation', t);
    -- append only: no UPDATE or DELETE grant. The migration 016 and 017 revoke and trigger stand.
    execute format('grant select, insert on audit.%I to app_clinical', t);

    raise notice 'retrofit audit isolation: audit.%', t;
  end loop;
end
$retrofit$;

insert into platform.schema_migration (version) values ('0012')
  on conflict (version) do nothing;
