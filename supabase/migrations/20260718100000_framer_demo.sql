-- Continuum Framer demo service (Prompt 12a). Append only; never edit once
-- applied. No em-dashes or en-dashes anywhere.
--
-- Guardrail (Prompt 12a section 1, Prompt 09 G3): the live Framer demo connects
-- ONLY to synthetic state. This service touches ONLY framer_demo_state. That is
-- enforced structurally: a dedicated role framer_demo owns the SECURITY DEFINER
-- operations and is granted access to that one table alone, so any query to any
-- other table fails with permission denied (asserted in verification). The
-- token is the sole gate; public keys cannot read the table (RLS denies them).

begin;

-- restricted role that owns the demo operations
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'framer_demo') then
    create role framer_demo nologin;
  end if;
end $$;
grant framer_demo to postgres;

create table if not exists public.framer_demo_state (
  id uuid primary key default gen_random_uuid(),
  token_hash text unique,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.framer_demo_state enable row level security;

grant usage on schema public to framer_demo;
-- CREATE lets framer_demo OWN its operation functions in public (needed for the
-- ownership reassignment below). It grants no read access to any existing table.
grant create on schema public to framer_demo;
-- USAGE on extensions so the operations can call digest() for the token hash.
grant usage on schema extensions to framer_demo;
grant select, insert, update on public.framer_demo_state to framer_demo;

-- only framer_demo may touch the table; nobody else has a policy, so anon and
-- authenticated (the public keys) get nothing and the token cannot be bypassed
drop policy if exists framer_demo_all on public.framer_demo_state;
create policy framer_demo_all on public.framer_demo_state for all to framer_demo using (true) with check (true);

-- sha256 hex of a token
create or replace function public.framer_demo_hash(p text)
returns text language sql immutable as $$
  select encode(extensions.digest(p, 'sha256'), 'hex');
$$;

-- GET /state
create or replace function public.framer_demo_get(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select state into v from public.framer_demo_state where token_hash = public.framer_demo_hash(p_token);
  return v;
end;
$$;

-- POST /checkins: append {pain, mob} (cap 16), set checkedInToday, set escalated
-- when the last three trend entries have pain 8 or higher
create or replace function public.framer_demo_checkin(p_token text, p_pain int, p_mob int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  h text := public.framer_demo_hash(p_token);
  s jsonb;
  arr jsonb;
  n int;
  esc boolean := false;
begin
  select state into s from public.framer_demo_state where token_hash = h for update;
  if s is null then return null; end if;
  arr := coalesce(s->'trend', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('pain', p_pain, 'mob', p_mob));
  n := jsonb_array_length(arr);
  if n > 16 then
    arr := (select jsonb_agg(value order by ord) from jsonb_array_elements(arr) with ordinality e(value, ord) where ord > n - 16);
    n := 16;
  end if;
  if n >= 3 then
    esc := (arr->(n-1)->>'pain')::int >= 8 and (arr->(n-2)->>'pain')::int >= 8 and (arr->(n-3)->>'pain')::int >= 8;
  end if;
  s := jsonb_set(s, '{trend}', arr);
  s := jsonb_set(s, '{checkedInToday}', 'true'::jsonb);
  s := jsonb_set(s, '{escalated}', to_jsonb(esc));
  update public.framer_demo_state set state = s, updated_at = now() where token_hash = h;
  return s;
end;
$$;

-- POST /duties/toggle
create or replace function public.framer_demo_toggle(p_token text, p_id int, p_done boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare h text := public.framer_demo_hash(p_token); s jsonb; arr jsonb;
begin
  select state into s from public.framer_demo_state where token_hash = h for update;
  if s is null then return null; end if;
  arr := (
    select jsonb_agg(case when (e->>'id')::int = p_id then jsonb_set(e, '{done}', to_jsonb(p_done)) else e end)
    from jsonb_array_elements(coalesce(s->'duties', '[]'::jsonb)) e
  );
  s := jsonb_set(s, '{duties}', coalesce(arr, '[]'::jsonb));
  update public.framer_demo_state set state = s, updated_at = now() where token_hash = h;
  return s;
end;
$$;

-- POST /advance-day: increment day up to prognosisDays, reset the check-in window
create or replace function public.framer_demo_advance(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare h text := public.framer_demo_hash(p_token); s jsonb; d int; pg int;
begin
  select state into s from public.framer_demo_state where token_hash = h for update;
  if s is null then return null; end if;
  d := coalesce((s->>'day')::int, 0);
  pg := coalesce((s->>'prognosisDays')::int, 21);
  if d < pg then d := d + 1; end if;
  s := jsonb_set(s, '{day}', to_jsonb(d));
  s := jsonb_set(s, '{checkedInToday}', 'false'::jsonb);
  s := jsonb_set(s, '{escalated}', 'false'::jsonb);
  update public.framer_demo_state set state = s, updated_at = now() where token_hash = h;
  return s;
end;
$$;

-- the operations run as framer_demo (single-table privilege); expose to the
-- anon key that the edge function uses; the token check inside is the gate
alter function public.framer_demo_get(text) owner to framer_demo;
alter function public.framer_demo_checkin(text, int, int) owner to framer_demo;
alter function public.framer_demo_toggle(text, int, boolean) owner to framer_demo;
alter function public.framer_demo_advance(text) owner to framer_demo;
revoke execute on function public.framer_demo_get(text) from public;
revoke execute on function public.framer_demo_checkin(text, int, int) from public;
revoke execute on function public.framer_demo_toggle(text, int, boolean) from public;
revoke execute on function public.framer_demo_advance(text) from public;
grant execute on function public.framer_demo_get(text) to anon, authenticated;
grant execute on function public.framer_demo_checkin(text, int, int) to anon, authenticated;
grant execute on function public.framer_demo_toggle(text, int, boolean) to anon, authenticated;
grant execute on function public.framer_demo_advance(text) to anon, authenticated;

-- daily reset to the Marcus baseline so the public demo never drifts. Owned by
-- postgres (maintenance), not exposed to anon.
create or replace function public.framer_demo_reset()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.framer_demo_state set state = jsonb_build_object(
    'workerName', 'Marcus',
    'bodyPart', 'Right shoulder',
    'day', 9,
    'prognosisDays', 21,
    'checkedInToday', false,
    'escalated', false,
    'trend', jsonb_build_array(
      jsonb_build_object('pain', 7, 'mob', 3),
      jsonb_build_object('pain', 6, 'mob', 4),
      jsonb_build_object('pain', 6, 'mob', 5),
      jsonb_build_object('pain', 5, 'mob', 5),
      jsonb_build_object('pain', 4, 'mob', 6)
    ),
    'duties', jsonb_build_array(
      jsonb_build_object('id', 1, 't', 'Ground-level material staging', 'done', true),
      jsonb_build_object('id', 2, 't', 'Tool crib inventory and tagging', 'done', false),
      jsonb_build_object('id', 3, 't', 'Toolbox talk delivery', 'done', false)
    )
  ), updated_at = now();
end;
$$;
revoke execute on function public.framer_demo_reset() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'framer-demo-reset') then
    perform cron.unschedule('framer-demo-reset');
  end if;
end $$;
select cron.schedule('framer-demo-reset', '0 4 * * *', $cron$ select public.framer_demo_reset(); $cron$);

commit;
