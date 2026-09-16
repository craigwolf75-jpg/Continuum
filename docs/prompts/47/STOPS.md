# Prompt 47 BUILD-NOW stop notes

Athena stopped these slices rather than invent Master Architecture or Prompt 47
text that is not in hand. No em dashes or en dashes.

## D7 beyond the Prompt 47 restatement

Prompt 47 Part 3.1 restates D7 as: anything that varies by customer,
jurisdiction, board, payer or year is data; invariants are code; config is
versioned, effective dated, auditable, and diffable. Part 3.2 names override
policies inherited, default, and locked. Part 6.2 says jurisdiction and board
credentials are location-owned and never inherited.

This mission implements that restatement on the existing `config` framework
(`platform/db/0007_config.sql` plus `override_policy` in 0017) and
`clinical/engine/config_policy.mjs`. It does not invent further Master
Architecture D7 tables, inheritance graphs, or payer-year pack formats.

## Part 8.1 health score numeric weights

Part 8.1 numeric weights are not in the Prompt 47 excerpt in this repo. The
engine exports named weight keys as constants. Missing numeric weights render
as UNKNOWN, never as 0. Do not treat the named keys as a CS platform.

## Part 9.3 metric catalog beyond named product metrics

Prompt 47 text for the full 9.3 catalog is not in this repo. The engine encodes
the metrics the mission names: fees forgone (derived), return to work
(aggregate only), benchmark (hidden below min cohort), and trend (label trend,
never prediction). No occupational dataset seed. No live Bedrock.

## Part 4 role catalogs beyond named roles

Enterprise and Continuum roles encoded as data are only those named in the
mission (reception, billing, physician, clinic auditor, admin, locum,
Continuum CS, sales, plus clinic-side emergency elevation and Continuum break
glass). Additional 4.2 / 4.3 titles are not invented.

## NP and other blocked clinical roles

NP is blocked pending a board answer. Other unspecified blocked roles are not
invented.

## mpi.person / Prompt 48

E2 does not create `mpi.person` and does not add a second tenant-exception
allow-list entry. `clinical.practitioner` is the global person identity for
this landing. `clinic_id` stays as a legacy hint.

## Residency

New tables live in the existing Canada-region clinical and platform database.
No US service, Resend, Twilio, or Vercel region change. Prompt 44 Canada and
no-train remains: live inference is not enabled.

## Plan catalog keys

`pilot`, `standard`, and `enterprise` in `clinical/engine/entitlement.mjs` are
synthetic mapping keys for plan to module and capacity rows. They are not a
pricing page and they are not a billed product catalog.

## Human gates

Consent language, legal pages, pricing pages, and live schema apply are not
done here.
