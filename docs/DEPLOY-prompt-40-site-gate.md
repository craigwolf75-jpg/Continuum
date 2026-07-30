# Prompt 40 Site Gate, Deploy Hand-off

This is the exact list of things only you can do (Supabase + Vercel), so I never touch either. Do them in order. Nothing here contains a secret value: you generate those yourself with the commands provided.

The code is staged on branch `feat/continuum-40-site-gate` (off `main`). It is NOT on `main`, so production is unaffected until you merge and deploy.

## What it does (so the steps make sense)
Two separate gates, two separate cookies, no shared secret:
- SITE gate (Prompt 40): walls the whole site behind named access codes. Unauthenticated visitors get the public holding page at `/`. Cookie `ct_site`, secret `CONTINUUM_SITE_SESSION_SECRET`.
- HUB gate (Prompt 39, still to build): gates the portals and the admin code view. Cookie `ct_session`, secret `CONTINUUM_HUB_SESSION_SECRET`.
A valid SITE code never grants portal access. The admin code view is gated by the HUB gate.

---

## Step 1: Apply the Supabase migration
File: `supabase/migrations/20260729130000_site_access_gate.sql`
Apply it to the Continuum Supabase project (SQL editor, or `supabase db push` if you use the CLI). It creates:
- table `public.access_codes` (id, label, code unique, category, created_at, expires_at, revoked_at, max_uses, use_count)
- table `public.access_log` (id, code_label, matched, ts, ip, user_agent, path)
- index `access_log_ip_ts_idx` (used by the per-IP rate limit, which reads from `access_log`, there is no separate rate-limit table)
- function `public.validate_and_log_access(p_code, p_ip, p_ua, p_path)` (security definer, service-role only)

RLS is enabled with no anon/authenticated policies, so only the service role reaches these tables. Nothing else in your database is touched.

## Step 2: Set 5 Vercel environment variables
Set these on the `continuum-o51l` project for **Production and Preview** (Settings, Environment Variables). Do not commit any of them.

| Variable | Value |
|---|---|
| `SITE_GATE_ENABLED` | `true` (the gate is ON; set to the literal string `false` later to open the site with no redeploy) |
| `CONTINUUM_SITE_SESSION_SECRET` | a fresh random secret, generate: `openssl rand -base64 48` |
| `CONTINUUM_HUB_SESSION_SECRET` | a DIFFERENT fresh random secret, generate a second time: `openssl rand -base64 48` |
| `CONTINUUM_SUPABASE_URL` | the Continuum Supabase project URL (Settings, API, Project URL) |
| `CONTINUUM_SUPABASE_SERVICE_KEY` | the Continuum Supabase `service_role` key (Settings, API). This is a secret, server-only. |

The two session secrets MUST be different values (that is the hard wall between the site gate and the hub gate).

## Step 3: Dependencies
None. `middleware.js` and the API functions import only local files and `node:crypto`. There is no `@vercel/edge` or other package to add, and no `package.json` change. Skip this step.

## Step 4: Deploy a preview and verify
Once Steps 1 and 2 are done, deploy a preview of the branch (push it, or `vercel deploy` from the branch). Then verify the acceptance list below on the preview URL BEFORE merging to `main`.

Two things I could not verify without a live deploy, check these first:
1. **Edge rewrite contract (I4).** `middleware.js` rewrites unauthenticated requests to `/gate/holding.html` using the raw `x-middleware-rewrite` header (no Next.js). If the preview shows a blank or broken page for gated paths instead of the holding page, tell me and I will adjust the rewrite mechanism.
2. **ESM runtime for the API functions.** `deploy/api/site-access.js` and `deploy/api/site-codes-admin.js` use ESM `import` in `.js` files. If a request to `/api/site-access` throws `Cannot use import statement outside a module`, tell me: the fix is to convert those functions to `.mjs` (or scope a `deploy/api/package.json`), which I will do, it cannot break `api/status.js`.

## Step 5: Seed access codes (after the migration)
The migration ships NO working code (by design). Create the first shared-demo code by inserting a row (SQL editor). Generate a strong code value first, do not reuse an example:
```
node -e "console.log(require('crypto').randomBytes(12).toString('base64url'))"
```
Then:
```sql
insert into public.access_codes (label, code, category, expires_at, max_uses)
values ('shared demo', 'PASTE_GENERATED_VALUE_HERE', 'internal', null, null);
```
Create named per-prospect codes the same way (label = person/org, category = prospect/investor/partner/internal, set `expires_at` and `max_uses` as you like). Once the hub gate (Prompt 39) is live, you create and revoke codes from the admin view at `/admin-site-codes.html` instead of raw SQL. Deliver every code to its recipient out-of-band, never in the repo.

---

## Acceptance checklist (verify on the preview)
- [ ] An unauthenticated request to any path except the always-public list returns the holding page, and the response body and every served asset contain NONE of the gated content (check `/`, `/hub`, `/admin-portal`, and a bundle like `/hub/roles.js`).
- [ ] Always-public still load without a code: `/` (holding), `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, the logo/favicon/og-image.
- [ ] A wrong code fails and is written to `access_log`.
- [ ] 11 rapid code attempts from one IP trigger the 1-hour lockout.
- [ ] A forged or tampered `ct_site` cookie fails signature validation.
- [ ] Pasting the root URL into Outlook, Gmail, and LinkedIn unfurls a clean branded card (needs the og:image asset, see below).
- [ ] A valid SITE code does NOT grant access to any portal.
- [ ] Revoking one code blocks only that code.
- [ ] Setting `SITE_GATE_ENABLED=false` serves the full site with no content redeploy.
- [ ] `access_log` shows label, timestamp, IP, user agent, and path per attempt.

## Two content assets still needed for the holding page
- Booking URL: the "Book a demo" button currently points at `#booking-url-pending`. Give me the Continuum booking page URL (30/45/60 min) and I will wire it.
- og:image: the holding page references `/og-image.png` (1200x630, locked logo + "Where care ends, Continuum begins."). Supply it, or ask me to generate a simple branded one.

## Rollback / kill switch
If anything about the gate misbehaves in production, set `SITE_GATE_ENABLED=false` (no redeploy needed) to open the site immediately, then tell me.

## Not in this hand-off (still deferred, needs its own work)
- The Prompt 39 HUB gate (the sign-in that issues `ct_session`). The admin code view fails closed until it exists.
- When the hub gate issues per-user sessions, flip `isAuthorizedAdmin` in `deploy/api/_hub_session.js` to deny-by-default requiring an email in `ADMIN_EMAILS` (which already includes `gary@farmceuticawellness.com`).
