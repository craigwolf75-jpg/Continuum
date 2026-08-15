-- Continuum Prompt 62: marketing lead capture. Append only; never edit once
-- applied. Prospect contact data captured from the public site's Request access
-- form (not worker data, not clinical data). Reachable only via the service key
-- from the /api/marketing-lead route: RLS is on and NO anon/authenticated policy
-- is created, the same pattern as public.access_codes / public.access_log.
-- No dashes anywhere.

create table if not exists public.marketing_leads (
  id          bigserial primary key,
  email       text not null,
  source_page text,
  created_at  timestamptz not null default now()
);

create index if not exists marketing_leads_created_idx on public.marketing_leads (created_at desc);

alter table public.marketing_leads enable row level security;
-- No policies for anon or authenticated on purpose: the only writer is the
-- server route holding the service key, exactly like the access gate tables.
