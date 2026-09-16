# Prompt 47 BUILD-NOW stop notes

Real stops only. Part 4.2, 4.3, 8.1, and 9.3 named items from Prompt 47 are
encoded as data in the engines. No em dashes or en dashes.

## Prompt 47 lineage (Prompt 53 stop)

Prompt 47 lineage is not canonical until a redo from old 45 REV 2
12:32 PM. Craig confirmed WRONG FILE / REDO REQUIRED: the Prompt 45
clinic and enterprise file used for shipped Prompt 47 was not REV 2
from 12:32 PM. Waiting on the REV 2 attachment. Do not start the redo
here. See `docs/prompts/53/`.

## Master Architecture D7 extra

Prompt 47 Part 3.1 restates D7 as: anything that varies by customer,
jurisdiction, board, payer or year is data; invariants are code; config is
versioned, effective dated, auditable, and diffable. Part 3.2 names override
policies inherited, default, and locked. Part 6.2 says jurisdiction and board
credentials are location-owned and never inherited.

This landing implements that restatement on the existing `config` framework
(`platform/db/0007_config.sql` plus `override_policy` in 0017) and
`clinical/engine/config_policy.mjs`. It does not invent further Master
Architecture D7 tables, inheritance graphs, or payer-year pack formats.

## mpi.person / Prompt 48

E2 does not create `mpi.person` and does not add a second tenant-exception
allow-list entry. `clinical.practitioner` is the global person identity for
this landing. `clinic_id` stays as a legacy hint.

## Buy and defer systems

Not built: CRM, implementation platform, CS platform (plays, QBR, tooling),
billing engine (Stripe, tax, dunning, invoicing), helpdesk, KB, ticketing,
live chat, status page. Health score weights are a constant definition only.

## Live apply

Schema files only. Gary or Hermes apply. Athena does not live apply. Consent
language, legal pages, and pricing pages remain human gates.

## Residency and inference

New tables live in the existing Canada-region clinical and platform database.
No US service, Resend, Twilio, or Vercel region change. Prompt 44 Canada and
no-train remains: live inference is not enabled. No occupational dataset seed.

## Plan catalog keys

`pilot`, `standard`, and `enterprise` in `clinical/engine/entitlement.mjs` are
synthetic mapping keys for plan to module and capacity rows. They are not a
pricing page and they are not a billed product catalog.
