-- Continuum public assessment, Step 2D follow up (Prompt 63 Step 2, section 19).
-- Append only, never edit once applied. No em dashes or en dashes anywhere.
--
-- 20260817120000_opportunity_score.sql already revoked execute on the internal
-- scorer public.compute_opportunity_score from public, intending the helper to
-- stay internal only: never callable by anon or authenticated, only by the
-- two SECURITY DEFINER RPCs (submit_public_assessment, record_engagement)
-- running as the function owner, which retains its own implicit execute
-- privilege regardless of any revoke.
--
-- Supabase (and the CI shim's default privileges block, which replicates it)
-- auto-grants execute on every new function in schema public directly to the
-- anon and authenticated roles via ALTER DEFAULT PRIVILEGES at creation time.
-- A revoke from public does not remove a direct grant already held by a role,
-- so anon and authenticated could still execute the helper. This migration
-- revokes those direct grants so the scorer stays internal only, without
-- touching the client facing grants on submit_public_assessment or
-- record_engagement, which must stay callable by anon.

revoke all on function public.compute_opportunity_score(public.public_assessment_response) from public, anon, authenticated;
