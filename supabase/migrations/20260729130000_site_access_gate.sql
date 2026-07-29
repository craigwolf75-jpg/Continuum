-- Continuum Prompt 40 SITE access gate. Append only; never edit once applied.
-- No dashes anywhere.
--
-- This service backs the SITE gate (deploy/middleware.js, the Layer 0
-- holding page). Hard wall vs the Prompt 39 hub gate: separate cookie
-- (ct_site, not ct_session), separate secret (CONTINUUM_SITE_SESSION_SECRET).
-- This migration never reads or references any hub session table or column.
--
-- The edge middleware never queries these tables. It verifies the signed
-- ct_site cookie locally with HMAC. Only the code entry endpoint
-- (deploy/api/site-access.js), using the service role key, ever reaches
-- these tables; RLS below grants nothing to anon or authenticated.

begin;

create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  code text unique not null,
  category text not null check (category in ('prospect', 'investor', 'partner', 'internal')),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  max_uses int,
  use_count int not null default 0
);

create table if not exists public.access_log (
  id bigserial primary key,
  code_label text,
  matched boolean not null,
  ts timestamptz not null default now(),
  ip text,
  user_agent text,
  path text
);

-- Supports the rate limit read in deploy/api/site-access.js (recent attempts
-- for a given IP within a rolling window).
create index if not exists access_log_ip_ts_idx on public.access_log (ip, ts desc);

alter table public.access_codes enable row level security;
alter table public.access_log enable row level security;

-- No policies are created for anon or authenticated on either table. That is
-- intentional: only the service role (which bypasses RLS entirely) can reach
-- these tables, and only from the code entry endpoint. There is no client
-- side path to either table.

create or replace function public.validate_and_log_access(
  p_code text,
  p_ip text,
  p_ua text,
  p_path text
)
returns table(matched boolean, label text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_label text;
  v_matched boolean := false;
begin
  select ac.id, ac.label
    into v_id, v_label
    from public.access_codes ac
    where ac.code = p_code
      and ac.revoked_at is null
      and (ac.expires_at is null or ac.expires_at > now())
      and (ac.max_uses is null or ac.use_count < ac.max_uses)
    limit 1;

  if v_id is not null then
    v_matched := true;
    update public.access_codes
      set use_count = use_count + 1
      where id = v_id;
  end if;

  -- every attempt is logged, matched or not; this is the only write path for
  -- access_log so it can never be bypassed by a caller that only wants a
  -- silent lookup
  insert into public.access_log (code_label, matched, ip, user_agent, path)
    values (case when v_matched then v_label else null end, v_matched, p_ip, p_ua, p_path);

  return query select v_matched, case when v_matched then v_label else null end;
end;
$$;

-- Only the service role may call this function. It is security definer so it
-- can update access_codes and insert into access_log even though neither
-- table has a policy for the caller's own role.
revoke all on function public.validate_and_log_access(text, text, text, text) from public;
grant execute on function public.validate_and_log_access(text, text, text, text) to service_role;

-- Seed one shared fallback code so the gate has at least one working code the
-- moment this migration is applied. This is a placeholder, not a real
-- secret: the controller rotates this code before the site goes live.
insert into public.access_codes (label, code, category)
values ('shared demo', 'CHANGE-ME-BEFORE-DEPLOY', 'internal')
on conflict (code) do nothing;

commit;
