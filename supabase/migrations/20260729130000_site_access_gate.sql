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

-- SECURITY FIX (post review, M2): the original version of this function did
-- a plain select of use_count, checked it in application logic, then did a
-- separate update. Two concurrent calls against the same near exhausted code
-- could both pass the select check before either update committed, letting
-- use_count exceed max_uses. The fix folds the check and the increment into
-- one update statement, so the WHERE clause is evaluated atomically against
-- the current row: once a code is at max_uses, every concurrent caller's
-- update simply matches zero rows, not just the first one to arrive.
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
  select ac.id
    into v_id
    from public.access_codes ac
    where ac.code = p_code
      and ac.revoked_at is null
      and (ac.expires_at is null or ac.expires_at > now())
    limit 1;

  if v_id is not null then
    -- atomic check and increment: use_count < max_uses is re-checked as
    -- part of the same statement that increments it, so concurrent callers
    -- cannot together push use_count past max_uses
    update public.access_codes as ac
      set use_count = ac.use_count + 1
      where ac.id = v_id
        and (ac.max_uses is null or ac.use_count < ac.max_uses)
      returning ac.label into v_label;

    if v_label is not null then
      v_matched := true;
    end if;
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

-- SECURITY FIX (post review, I2): this migration used to seed a shared
-- fallback code ('shared demo', 'CHANGE-ME-BEFORE-DEPLOY'). A working code
-- checked into the repo, even an obviously named placeholder, is a
-- permanent credential in git history the moment this file is committed.
-- No seed is inserted here. The controller inserts the real, rotated shared
-- demo code directly against the live database, out of band, after this
-- migration has been applied and before the gate is enabled, for example:
--   insert into public.access_codes (label, code, category)
--   values ('shared demo', '<a real generated code>', 'internal');
-- That statement is intentionally not part of any migration file.

commit;
