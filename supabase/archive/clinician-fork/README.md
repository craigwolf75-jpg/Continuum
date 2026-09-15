# Clinician-fork archive note (CI)

`clinician_*` migrations exist on the live project as an unused fork. They are
not part of the Continuum shipping graph.

Shipping graph:

- `clinical.*` lives in `clinical/db` (physician platform)
- worker schema lives in `supabase/migrations` (`20260915*` files), bound to
  `clinical.*` and `employer.*`
- exposure-proof does not apply `clinician_*`
- `public.workers` remains the hub role projection

Do not add `clinician_*` files under `supabase/migrations`. Do not drop live
clinician objects from this repo. No live apply from this note.
