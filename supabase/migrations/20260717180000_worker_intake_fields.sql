-- Continuum: worker intake fields (07.6). Append only; never edit once applied.
-- No em-dashes or en-dashes anywhere.
--
-- dob and SIN arrive in the intake contract. The SIN is stored ONLY as a mask
-- (display) plus a hash (dedup and match). The raw SIN is never persisted here
-- and is never returned by any endpoint. The WCB initial-notification generator
-- (07.8) that must embed the full SIN will source it through a separate audited
-- secure-store path, decided in that prompt; this scaffold does not keep it.

begin;

alter table public.workers
  add column if not exists dob date,
  add column if not exists sin_masked text,
  add column if not exists sin_hash text;

commit;
