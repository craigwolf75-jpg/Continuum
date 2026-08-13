-- Continuum physician platform: migration 018, function search_path hardening.
--
-- Resolves the Supabase advisor finding function_search_path_mutable on the five physician
-- platform functions that ship without a fixed search_path:
--   audit.block_mutation()                     (migration 016)
--   clinical.block_mutation()                  (migration 011)
--   clinical.derive_weight_band(numeric)       (migration 011)
--   clinical.emit_code(capability, varchar, varchar)  (migration 011)
--   clinical.resolve_axes(varchar)             (migration 011)
--
-- A mutable search_path lets a caller's session search_path change how an unqualified name
-- resolves inside the function, which is the advisor's concern. All five reference only
-- built in operations or schema qualified objects (resolve_axes reads clinical.functional_axis_map
-- by its qualified name; the others reference no schema objects at all), so pinning the
-- search_path to the empty string (only pg_catalog is then implicitly searched) changes no
-- behaviour and closes the finding.
--
-- OPTIONAL hardening: nothing depends on it; it only quiets the advisor. Idempotent (ALTER
-- FUNCTION is repeatable and each function is guarded by to_regprocedure so the migration is
-- safe to apply on a database where a function is absent), one transaction, hand applied by Gary
-- per the standing rule (Claude never touches the Continuum Supabase project). Apply any time
-- after migrations 011 and 016. No dashes anywhere.

begin;

do $harden$
declare
  fn text;
  sigs text[] := array[
    'audit.block_mutation()',
    'clinical.block_mutation()',
    'clinical.derive_weight_band(numeric)',
    'clinical.emit_code(clinical.capability, character varying, character varying)',
    'clinical.resolve_axes(character varying)'
  ];
begin
  foreach fn in array sigs loop
    if to_regprocedure(fn) is not null then
      execute format('alter function %s set search_path = %L', fn, '');
      raise notice 'hardened search_path on %', fn;
    else
      raise notice 'skip: function % is absent', fn;
    end if;
  end loop;
end
$harden$;

commit;
