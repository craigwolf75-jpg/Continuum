-- Continuum: current published restrictions on the injury (07.5 clearance,
-- consumed read-only by HSE in 07.9). Append only; never edit once applied.
-- No em-dashes or en-dashes anywhere.
--
-- Set by the Nexus clearance (/clearance restrictions + effective_date). HSE
-- has no write path to these; the light-duty assignment renders them.

begin;

alter table public.injuries
  add column if not exists current_restrictions text,
  add column if not exists restrictions_effective_date date;

commit;
