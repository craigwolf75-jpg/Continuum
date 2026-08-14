-- Continuum Core Platform Foundations (Prompt 51). Migration 0013: S8f, retrofit the physician
-- stream employer tables to Prompt 51 tenant isolation.
--
-- employer.published_restriction_set and employer.duty_match_line (migration 015) are the physician
-- stream's employer view tables. They reference the clinical case only by opaque case_ref and
-- worker_ref (no cross schema foreign key), which is the employer wall, and the only foreign key is
-- duty_match_line to published_restriction_set within the employer schema. This retrofit adds
-- organisation_id referencing tenancy.organisation (a foreign key to tenancy, never to clinical, so
-- the wall is untouched), row level security enabled and FORCEd, and a fail closed isolation policy.
-- The tables are mutable (a restriction set is withdrawn by setting withdrawn_at), so they are not
-- made append only here; that is a separate decision. The tables are empty, so organisation_id is
-- set NOT NULL with no backfill.
--
-- Grants: the release path (app_release) creates and maintains these rows; the employer role reads
-- them. This brings the employer view under the same tenancy the platform employer.disclosure_release
-- already has.
--
-- Idempotent, ALTER never drop. Hand applied by Gary after clinical/db and platform/db 0000 to 0012.
-- No em dashes or en dashes anywhere.

do $retrofit$
declare
  t      text;
  tables text[] := array['published_restriction_set', 'duty_match_line'];
begin
  foreach t in array tables loop
    if to_regclass('employer.' || t) is null then
      raise notice 'skip: employer.% is absent', t;
      continue;
    end if;

    execute format('alter table employer.%I add column if not exists organisation_id uuid', t);
    execute format('alter table employer.%I alter column organisation_id set not null', t);

    if not exists (select 1 from pg_constraint where conname = 'fk_' || t || '_organisation') then
      execute format(
        'alter table employer.%I add constraint %I foreign key (organisation_id) references tenancy.organisation(id)',
        t, 'fk_' || t || '_organisation');
    end if;

    execute format('alter table employer.%I enable row level security', t);
    execute format('alter table employer.%I force  row level security', t);
    execute format('drop policy if exists %I on employer.%I', t || '_isolation', t);
    execute format(
      'create policy %I on employer.%I using (organisation_id = current_setting(''app.organisation_id'')::uuid) with check (organisation_id = current_setting(''app.organisation_id'')::uuid)',
      t || '_isolation', t);
    execute format('grant select, insert, update on employer.%I to app_release', t);
    execute format('grant select on employer.%I to app_employer', t);

    raise notice 'retrofit employer isolation: employer.%', t;
  end loop;
end
$retrofit$;

insert into platform.schema_migration (version) values ('0013')
  on conflict (version) do nothing;
