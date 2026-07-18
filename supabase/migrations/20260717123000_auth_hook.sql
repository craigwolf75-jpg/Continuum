-- Continuum auth: custom access token hook (07.2).
-- Governed by specs/CONTINUUM_PROMPT_07.md section 07.2. Append only; never
-- edit or delete this file once applied. No em-dashes or en-dashes anywhere.
--
-- The hook stamps user_id, user_role, tenant_id claims from public.users at
-- token issuance; RLS (07.1) consumes them.
--
-- IMPORTANT: the app role is stamped as "user_role", NOT the reserved "role"
-- claim. PostgREST uses the top-level "role" claim as the Postgres role
-- (authenticated); overwriting it would break every authenticated query. So
-- this migration also redefines public.jwt_role() to read "user_role".

begin;

-- ------------------------------------------------------------
-- Redefine jwt_role() to read the app role from "user_role"
-- (the 07.1 version read "role", which collides with the Postgres role claim).
-- The other two claim helpers already read non-reserved claim names and are
-- left unchanged.
-- ------------------------------------------------------------
create or replace function public.jwt_role()
returns text language sql stable as $$
  select coalesce(
    nullif(auth.jwt() ->> 'user_role', ''),
    nullif(auth.jwt() -> 'app_metadata' ->> 'user_role', ''),
    ''
  );
$$;

-- ------------------------------------------------------------
-- The hook function. Supabase calls it as the supabase_auth_admin role at
-- token issuance, passing { user_id, claims, authentication_method }, and
-- expects the event back with modified claims.
-- ------------------------------------------------------------
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable as $$
declare
  claims jsonb;
  v_id uuid;
  v_role public.user_role;
  v_tenant uuid;
begin
  claims := coalesce(event -> 'claims', '{}'::jsonb);

  select u.id, u.role, u.tenant_id
    into v_id, v_role, v_tenant
  from public.users u
  where u.auth_user_id = (event ->> 'user_id')::uuid
    and u.deleted_at is null
  limit 1;

  if v_id is not null then
    claims := jsonb_set(claims, '{user_id}', to_jsonb(v_id::text));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role::text));
    if v_tenant is not null then
      claims := jsonb_set(claims, '{tenant_id}', to_jsonb(v_tenant::text));
    else
      -- cross-tenant roles (wcb_officer, nexus_physician) carry no tenant claim
      claims := jsonb_set(claims, '{tenant_id}', 'null'::jsonb);
    end if;
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- ------------------------------------------------------------
-- Permissions per the Supabase custom-access-token-hook contract: only
-- supabase_auth_admin may execute the hook and read the users table it needs;
-- everyone else is revoked.
-- ------------------------------------------------------------
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant select on public.users to supabase_auth_admin;

-- RLS on users still applies to supabase_auth_admin; allow it to read the rows
-- the hook needs.
create policy users_auth_admin_read on public.users
  for select to supabase_auth_admin
  using (true);

commit;
