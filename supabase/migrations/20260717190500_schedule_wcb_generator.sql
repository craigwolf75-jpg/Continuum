-- Continuum: schedule the WCB generator (07.8). Append only; never edit once
-- applied. No em-dashes or en-dashes anywhere.
--
-- Same pattern as the auto-actions worker and escalation engine: a Vault-backed
-- wrapper posts to the wcb-generator edge function, scheduled every minute.

begin;

create or replace function public.run_wcb_generator()
returns void language plpgsql security definer set search_path = public, vault, net as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'continuum_worker_secret' limit 1;
  if v_secret is null then
    raise notice 'continuum_worker_secret not set in Vault; skipping wcb generation';
    return;
  end if;
  perform net.http_post(
    url := 'https://agzhnmunodrhsjbogzae.supabase.co/functions/v1/wcb-generator',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_dEYjpgPSaLiMow0xe2a6sQ_4wBnt_Yp',
      'x-worker-secret', v_secret
    ),
    body := '{}'::jsonb
  );
end;
$$;
revoke execute on function public.run_wcb_generator() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'continuum-wcb-generator') then
    perform cron.unschedule('continuum-wcb-generator');
  end if;
end $$;

select cron.schedule(
  'continuum-wcb-generator',
  '* * * * *',
  $cron$ select public.run_wcb_generator(); $cron$
);

commit;
