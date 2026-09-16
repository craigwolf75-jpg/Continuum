# Prompt 49 acceptance criteria status

A criterion is passed only when a test proves it. No em dashes or en dashes.

| AC | Status | Proof |
|---|---|---|
| 1 | passed | Type catalogue + mapping; schema scan in `deploy/prompt49-canonical.test.mjs`; SQL scan in `prompt49_interop.sql` |
| 2 | passed | Worker projection and Patient constructor tests; schema scan |
| 3 | passed | Employer clinical FK throws; 0018 does not reference both schemas |
| 4 | passed | ConsentReference identifier only; revocation mid-test |
| 5 | passed | SQL: every interop table has organisation_id, RLS, FORCE, policy; allow-list scan |
| 6 | passed | SQL: org B cannot read org A inbound rows; WITH CHECK blocks cross-tenant insert |
| 7 | passed | Envelope tenant rejected in inbound test |
| 8 | passed | Band-only inbound leaves measured values null |
| 9 | passed | Legacy 25 pound fixture and unit helper |
| 10 | passed | Outbound and FHIR strip raw measurements |
| 11 | passed | 25-pair authorship cross-product |
| 12 | passed | Architecture grep on new interop code |
| 13 | passed | Four surfaces plus outbound and FHIR |
| 14 | passed | No `deriveWeightBand(` call in interop production files; signature remains the consumer |
| 15 | passed | Non-compliant adapter scan fails on band derivation |
| 16 | passed | Architecture scan; identity port fail-closed |
| 17 | passed | All five outcomes injected; default `review_required` writes no person |
| 18 | passed | Reference adapter scan clean; fixture adapter fails |
| 19 | passed | Fixture adapter fails SQL / jurisdiction / band scans |
| 20 | passed | Manifest strip inbound and outbound |
| 21 | passed | Unknown field in extension_payload, counted |
| 22 | passed | Reference adapter descriptor; non-compliant fixture fails |
| 23 | passed | Unmapped code rejects field and raises a gap |
| 24 | passed | Unmapped status shape |
| 25 | passed | `source_status_raw` retained on mapped status |
| 26 | passed | SQL: null `reviewed_by` fails |
| 27 | passed | Proposed mapping ignored |
| 28 | passed | Four-level resolution order |
| 29 | passed | Board-controlled tenant override rejected |
| 30 | passed | Malformed payload writes no domain rows |
| 31 | passed | Signed conflict record; domain not written |
| 32 | passed | Replay returns stored outcome |
| 33 | passed | Concurrent duplicate in-memory lock; SQL unique constraint |
| 34 | passed | Same external id, different digest is a conflict |
| 35 | passed | Offsetless timestamp unresolved |
| 36 | passed | Date-only stays a date |
| 37 | passed | Inexact unit null, source retained |
| 38 | passed | Unrecognised unit rejected |
| 39 | passed | Missing case fails stage 13 with a field-specific error |
| 40 | passed | Engine returns structured results; unclassified counter starts at zero |
| 41 | passed | Schema scan: no canonical_object table; IR not persisted |
| 42 | passed | Rebuild from raw plus envelope produces the same type |
| 43 | passed | SQL: raw payload not selectable; reason required; audit written |
| 44 | passed | No tenant-facing API added; metrics reject PII labels |
| 45 | passed | v1 to v2 translation and back |
| 46 | passed | Removing a field within a major fails CI helper |
| 47 | passed | `buildCanonicalFromDomain(..., "domain_direct")` throws |
| 48 | passed | Missing lawful basis throws |
| 49 | passed | `ai_draft` blocked; `ai_draft_edited` permitted |
| 50 | passed | Unsigned draft blocked |
| 51 | passed | PII label rejected; logs have no payload fragment |
| 52 | passed | 23 named fixtures, library version 1.0.0 |
| 53 | passed | Micro-benchmark under ceiling; forced ceiling returns `processing_failure` |
| 54 | passed | Backfill called out as a separate lower-priority budget (no shared live limiter implemented beyond the split) |
| 55 | not attempted as a single process | Existing Prompt 36 to 48 suites are not modified. They run unchanged in `suites.yml`. This job does not invoke every historical suite itself |
| 56 | passed | `snapshotHash(canonicalPayload(...))` is byte identical; sign path not edited |
| 57 | passed | Safety counters start at zero on a fresh metrics object. Suite increments some by testing the forbidden paths (upgrade, strip). Fresh object remains zero |
| 58 | passed | `docs/platform/interop-guide.md` covers all sixteen items |

## Residual holds

- Prompt 48 MPI is absent. Identity is fail-closed.
- Schema files only. Not applied live.
- No production vendor adapter.
- No gateway, retry, DLQ, screens, or clinical features.
- Section 19 values unset. No raw payload purge job.
- Prompt 44 STOP unchanged: no live Bedrock, no occupational seed.
- Hermes ships only when Craig names ship.
