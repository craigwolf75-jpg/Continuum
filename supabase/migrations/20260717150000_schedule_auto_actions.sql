-- Continuum auto-actions worker schedule (07.5 runtime layer).
-- Governed by CONTINUUM_PROMPT_07.md section 07.5. Append only; never edit once
-- applied. No em-dashes or en-dashes anywhere.
--
-- Invokes the auto-actions-worker edge function on a one-minute cron via
-- pg_cron + pg_net. The worker secret is read from Vault (secret name
-- continuum_worker_secret), never hard-coded here. The apikey header uses the
-- publishable key, which is public and only routes the request through the
-- functions gateway; the x-worker-secret header is the real authorization.
--
-- The Vault secret and the CONTINUUM_WORKER_SECRET function secret are set out
-- of band (not in this migration) and must hold the same value.

begin;

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Wrapper the cron job calls. Reads the worker secret from Vault and posts to
-- the edge function. Fail-soft: if the secret is missing, log and skip.
create or replace function public.run_auto_actions_worker()
returns void language plpgsql security definer set search_path = public, vault, net as $$
declare
  v_secret text;
  v_url text := 'https://agzhnmunodrhsjbogzae.supabase.co/functions/v1/auto-actions-worker';
  v_apikey text := 'sb_publishable_dEYjpgPSaLiMow0xe2a6sQ_4wBnt_Yp';
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
    where name = 'continuum_worker_secret'
    limit 1;

  if v_secret is null then
    raise notice 'continuum_worker_secret not set in Vault; skipping auto-actions run';
    return;
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', v_apikey,
      'x-worker-secret', v_secret
    ),
    body := '{}'::jsonb
  );
end;
$$;

revoke execute on function public.run_auto_actions_worker() from public, anon, authenticated;

-- Schedule every minute. Idempotent: drop an existing job of the same name
-- before creating it.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'continuum-auto-actions') then
    perform cron.unschedule('continuum-auto-actions');
  end if;
end $$;

select cron.schedule(
  'continuum-auto-actions',
  '* * * * *',
  $cron$ select public.run_auto_actions_worker(); $cron$
);

commit;
