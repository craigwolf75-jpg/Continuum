# Prompt 47: where E1 landed

E1 (organisation, region, location from the first tenant) is already in this
repo. It did not land as clinical.organisation or clinical.region.

- Hierarchy tables: `tenancy.organisation`, `tenancy.region`, `tenancy.location`
  in `platform/db/0002_tenancy.sql` (Prompt 51).
- Clinic link: `clinical.clinic.location_id` in `platform/db/0010_retrofit_clinical_tenant.sql`.
- `clinical.clinic.region` remains residency (`ca-central-1`). It is not the
  hierarchy region.
- Engine resolver: `clinical/engine/hierarchy.mjs` (ensureSingleSiteHierarchy,
  resolveLocationParents, assertE1Complete).

The stale spec `docs/superpowers/specs/2026-08-12-prompt-47-e1-e2-foundation-design.md`
is wrong for today's repo. Do not create clinical.organisation or clinical.region.

Schema files only. Gary or Hermes apply. Athena does not live apply.

No em dashes or en dashes anywhere.
