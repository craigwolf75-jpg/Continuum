-- Continuum Core Platform Foundations (Prompt 51). Migration 0011: S8d, retrofit the immutable
-- clinical tables to Prompt 51 tenant isolation.
--
-- The functional measurement family and the band derivation audit are insert only and immutable
-- from creation (migration 011 revokes UPDATE and DELETE and attaches a blocking trigger). Adding
-- organisation_id is data definition, which the row level triggers do not block, and the tables are
-- empty (SYNTH data cleaned up), so the column is added and set NOT NULL with no backfill and no
-- trigger is ever disabled. Each table gets organisation_id referencing tenancy.organisation, row
-- level security enabled and FORCEd, and a fail closed isolation policy. The grant is SELECT and
-- INSERT only: these tables stay immutable, so no UPDATE or DELETE is granted, and the existing
-- revoke plus the blocking trigger from migration 011 remain the two enforcement controls.
--
-- Idempotent, ALTER never drop. Hand applied by Gary after clinical/db and platform/db 0000 to 0010.
-- No em dashes or en dashes anywhere.

do $retrofit$
declare
  t      text;
  tables text[] := array[
    'functional_measurement',
    'functional_axis_value',
    'functional_grasping',
    'functional_reaching',
    'functional_environment',
    'functional_clinical_context',
    'internal_restriction',
    'legacy_restriction_label',
    'band_derivation_audit'
  ];
begin
  foreach t in array tables loop
    if to_regclass('clinical.' || t) is null then
      raise notice 'skip: clinical.% is absent', t;
      continue;
    end if;

    execute format('alter table clinical.%I add column if not exists organisation_id uuid', t);
    execute format('alter table clinical.%I alter column organisation_id set not null', t);

    if not exists (select 1 from pg_constraint where conname = 'fk_' || t || '_organisation') then
      execute format(
        'alter table clinical.%I add constraint %I foreign key (organisation_id) references tenancy.organisation(id)',
        t, 'fk_' || t || '_organisation');
    end if;

    execute format('alter table clinical.%I enable row level security', t);
    execute format('alter table clinical.%I force  row level security', t);
    execute format('drop policy if exists %I on clinical.%I', t || '_isolation', t);
    execute format(
      'create policy %I on clinical.%I using (organisation_id = current_setting(''app.organisation_id'')::uuid) with check (organisation_id = current_setting(''app.organisation_id'')::uuid)',
      t || '_isolation', t);
    -- insert only: immutable, so no UPDATE or DELETE grant. Migration 011 revoke plus its trigger stand.
    execute format('grant select, insert on clinical.%I to app_clinical', t);

    raise notice 'retrofit immutable isolation: clinical.%', t;
  end loop;
end
$retrofit$;

insert into platform.schema_migration (version) values ('0011')
  on conflict (version) do nothing;
