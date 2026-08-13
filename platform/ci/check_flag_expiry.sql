-- Continuum Core Platform Foundations (Prompt 51). CI feature flag expiry check.
--
-- Section 9.3 item 2 and acceptance criterion 38: every feature flag has a retire_by date. This
-- check fails the build when any flag is past its retirement date, and raises a notice for any flag
-- retiring within thirty days. A permanent flag is configuration wearing a disguise. Run by psql
-- with ON_ERROR_STOP. No em dashes or en dashes anywhere.

do $flags$
declare
  v_expired int;
  v_soon    int;
begin
  select count(*) into v_expired from config.feature_flag where retire_by < current_date;
  select count(*) into v_soon    from config.feature_flag where retire_by >= current_date and retire_by < current_date + 30;

  if v_soon > 0 then
    raise notice 'warning: % feature flag(s) retire within 30 days', v_soon;
  end if;
  if v_expired > 0 then
    raise exception '% feature flag(s) are past their retire_by date and must be retired', v_expired;
  end if;

  raise notice 'feature flag expiry check passed';
end
$flags$;
