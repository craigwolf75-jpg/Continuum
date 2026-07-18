-- Continuum escalation engine (07.7), database layer.
-- Governed by CONTINUUM_PROMPT_07.md section 07.7. Append only; never edit once
-- applied. No em-dashes or en-dashes anywhere.
--
-- Rule-based, no ML. A trigger enqueues a check on every check-in insert; the
-- escalation-engine edge function evaluates the rules and acts. Framing law:
-- decision support only. Alert copy states the observed trend, never a
-- diagnosis.
--
-- Rules (evaluated in the edge function):
--   1. pain_score at or above 8 for 3 consecutive check-ins
--   2. mobility_score declining across 2 or more days (3 readings strictly down)
--   3. a red-flag keyword (this table) in a recent check-in note
--
-- This migration builds the config table, the queue, the enqueue trigger, and
-- the cron wrapper. The evaluation and actions live in the edge function.

begin;

-- Configurable red-flag keyword list (07.7 seeds five).
create table public.escalation_keywords (
  id uuid primary key default gen_random_uuid(),
  keyword text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.escalation_keywords enable row level security;
create policy escalation_keywords_select on public.escalation_keywords
  for select to authenticated using (true);

insert into public.escalation_keywords (keyword) values
  ('numb'), ('tingling'), ('sharp'), ('worse at night'), ('cannot sleep')
on conflict (keyword) do nothing;

-- Evaluation queue. Service_role only (no authenticated policies).
create table public.escalation_checks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id),
  injury_id uuid not null references public.injuries (id),
  recovery_log_id uuid not null references public.recovery_logs (id),
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index idx_escalation_checks_status on public.escalation_checks (status) where status = 'pending';
create index idx_escalation_checks_injury on public.escalation_checks (injury_id);
alter table public.escalation_checks enable row level security;

-- Enqueue an evaluation on every new check-in.
create or replace function public.enqueue_escalation_check()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.source = 'check_in' then
    insert into public.escalation_checks (tenant_id, injury_id, recovery_log_id)
      values (new.tenant_id, new.injury_id, new.id);
  end if;
  return new;
end;
$$;

create trigger trg_recovery_logs_escalation after insert on public.recovery_logs
  for each row execute function public.enqueue_escalation_check();

-- Cron wrapper: invokes the escalation-engine edge function. Same auth pattern
-- as the auto-actions worker (Vault secret, publishable key routes the gateway).
create or replace function public.run_escalation_engine()
returns void language plpgsql security definer set search_path = public, vault, net as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'continuum_worker_secret' limit 1;
  if v_secret is null then
    raise notice 'continuum_worker_secret not set in Vault; skipping escalation run';
    return;
  end if;
  perform net.http_post(
    url := 'https://agzhnmunodrhsjbogzae.supabase.co/functions/v1/escalation-engine',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_dEYjpgPSaLiMow0xe2a6sQ_4wBnt_Yp',
      'x-worker-secret', v_secret
    ),
    body := '{}'::jsonb
  );
end;
$$;
revoke execute on function public.run_escalation_engine() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'continuum-escalation') then
    perform cron.unschedule('continuum-escalation');
  end if;
end $$;

select cron.schedule(
  'continuum-escalation',
  '* * * * *',
  $cron$ select public.run_escalation_engine(); $cron$
);

commit;
