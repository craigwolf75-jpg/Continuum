-- Continuum RLS patch: cross-tenant readers reach a worker via an injury grant.
-- Governed by CONTINUUM_PROMPT_07.md (07.1 field firewall, 07.6 Nexus).
-- Append only; never edit once applied. No em-dashes or en-dashes anywhere.
--
-- Gap fixed: the 07.1 workers_select policy honored only a tenant-level grant
-- (continuum_has_grant(tenant_id, null)), so a nexus_physician granted on a
-- specific injury could read that injury but NOT the patient's worker row.
-- 07.6 needs the physician to see the worker record for patients they hold a
-- grant on. This adds injury-level reach without widening tenant exposure.

begin;

-- True when the current cross-tenant caller holds a grant that reaches this
-- worker: either a tenant-level grant on the worker's tenant, or an
-- injury-level grant on any of the worker's injuries.
create or replace function public.continuum_can_see_worker(row_tenant uuid, row_worker uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.access_grants ag
    where ag.deleted_at is null
      and ag.user_id = public.jwt_user_id()
      and public.jwt_role() in ('wcb_officer', 'nexus_physician')
      and (
        (ag.tenant_id is not null and ag.tenant_id = row_tenant)
        or (ag.injury_id is not null and exists (
              select 1 from public.injuries i
              where i.id = ag.injury_id
                and i.worker_id = row_worker))
      )
  );
$$;

grant execute on function public.continuum_can_see_worker(uuid, uuid) to authenticated, anon;

-- Swap the tenant-only grant clause for the tenant-or-injury reach.
alter policy workers_select on public.workers
  using (
    deleted_at is null and (
      (public.jwt_role() = 'worker'
        and user_id = public.jwt_user_id()
        and tenant_id = public.jwt_tenant_id())
      or (public.jwt_role() in ('hse', 'employer_admin')
          and tenant_id = public.jwt_tenant_id())
      or public.continuum_can_see_worker(tenant_id, id)
    )
  );

commit;
