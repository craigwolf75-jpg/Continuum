-- Continuum Core Platform Foundations (Prompt 51). Migration 0010: S8c, retrofit the mutable
-- tenant owned clinical tables to Prompt 51 tenant isolation (E1).
--
-- Under the Supabase stack decision and the confirmation that these tables are empty (SYNTH data
-- cleaned up), the mutable tenant owned clinical tables are brought under Prompt 51 tenancy:
-- organisation_id referencing tenancy.organisation, row level security enabled and FORCEd, and an
-- isolation policy that fails closed on a missing tenant context. Because the tables are empty, the
-- organisation_id column is added and set NOT NULL with no backfill; new rows must supply it (the
-- application supplies it from the session context, the same as every other tenant table).
--
-- clinic additionally gets a location_id link to tenancy.location, because Prompt 52 Correction 2
-- maps the canonical Clinic onto a Location. The link is nullable and is populated when the location
-- is provisioned; the clinic_id foreign keys are left in place (a physical merge of clinic into
-- tenancy.location is a later expand and contract step, not needed while the tables are empty).
--
-- NOT in this migration and why:
--   practitioner: E2 makes practitioner identity global, which requires the single org-less anchor
--     mpi.person (Master Person Index, old stream 48). That schema is absent and is out of Prompt 51
--     scope, so a global practitioner cannot be modelled without a prohibited second org-less table.
--     practitioner is left un-retrofitted and blocked on the MPI, reported to Gary.
--   functional_measurement and the other immutable tables: a later increment (S8d).
--   wcb_report Section 5.2 redesign: a later increment (S8d), a breaking change handled by expand
--     and contract; this migration only adds organisation_id and isolation to the existing shape.
--   clinical.consent boolean cutover to the consent ledger: separate (the hub reconciliation).
--
-- Idempotent, ALTER never drop. Hand applied by Gary after clinical/db and platform/db 0000 to 0009.
-- No em dashes or en dashes anywhere.

do $retrofit$
declare
  t      text;
  tables text[] := array[
    'worker',
    'wcb_case',
    'wcb_report',
    'wcb_report_field',
    'wcb_submission',
    'measurement_draft',
    'clinic',
    'clinic_batch_schedule',
    'consent'
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
      'create policy %I on clinical.%I using (organisation_id = (select current_setting(''app.organisation_id''))::uuid) with check (organisation_id = (select current_setting(''app.organisation_id''))::uuid)',
      t || '_isolation', t);
    execute format('grant select, insert on clinical.%I to app_clinical', t);

    raise notice 'retrofit tenant isolation: clinical.%', t;
  end loop;
end
$retrofit$;

-- clinic maps to a tenancy.location (Prompt 52 Correction 2). Nullable link, populated at provisioning.
alter table clinical.clinic add column if not exists location_id uuid references tenancy.location(id);

insert into platform.schema_migration (version) values ('0010')
  on conflict (version) do nothing;
