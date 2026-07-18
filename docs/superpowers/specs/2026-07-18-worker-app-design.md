# Continuum Worker App, Increment 1 Design

**Date:** 2026-07-18
**Prompt:** CONTINUUM_PROMPT_07.md section 07.3 (worker app), online-first slice.
**Status:** Approved design, ready for implementation plan.

No em-dashes or en-dashes anywhere in this document, the code, or the copy.

## 1. Goal

Build the mobile-first Continuum worker app as a Next.js 14 surface, packaged
for Capacitor, wired to the live Supabase project (agzhnmunodrhsjbogzae,
ca-central-1). This increment delivers all six screens running online against
the real backend. The offline-first queue, push notifications, native
compilation, Vercel deployment of the app, and Twilio SMS are explicitly
deferred to later increments.

## 2. Decisions (locked in brainstorming)

- **Stack:** Next.js 14 App Router, TypeScript, Tailwind, static export
  (`output: 'export'`), Capacitor. Lives in a new `worker-app/` folder in this
  repo. This introduces the repo's first `package.json`; the dependency set is
  limited to the 07.3-named Capacitor packages plus Next, React, Tailwind, and
  supabase-js (Section 8).
- **Auth:** SMS phone OTP per 07.2, using Supabase test OTP numbers so the seed
  worker can log in with a fixed code and no Twilio. Twilio drops in later with
  no app changes.
- **Scope:** all six screens (login, consent, home, check-in, history, duties),
  online-first. Offline sync deferred.

## 3. Architecture

### 3.1 App shape

A client-rendered single-page app built with the App Router and static export.
Every component is a client component. There is no server code: all data flows
through supabase-js in the browser using the publishable key, and Row Level
Security scopes every read and write to the logged-in worker.

```
worker-app/
  package.json
  next.config.js            output: 'export', images unoptimized
  tsconfig.json
  tailwind.config.ts
  postcss.config.js
  capacitor.config.ts       appId com.continuum.worker, webDir out
  .env.local.example        NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  src/
    lib/
      supabase.ts           single browser client (url + publishable key)
      auth.ts               AuthStrategy seam: requestOtp(phone), verifyOtp(phone, code)
      types.ts              Injury, RecoveryLog, LightDuty, Consent, Tenant
      format.ts             day-of-prognosis, dates, grade-7 status labels
    state/
      SessionProvider.tsx   context: session, workerProfile, consent, tenant branding
    app/
      layout.tsx            root html, fonts, SessionProvider, branding vars
      globals.css           Tailwind + navy/gold tokens
      page.tsx              gate: no session -> Login; session but no consent -> ConsentGate; else AppShell
    components/
      Login.tsx             phone entry -> code entry
      ConsentGate.tsx       grade-7 consent, writes consents, blocks until granted
      AppShell.tsx          header (branding) + active tab + BottomNav
      BottomNav.tsx         Home, History, Duties, Settings (48px targets)
      Home.tsx              injury summary + current check-in card
      CheckIn.tsx           pain/mobility sliders, notes, submit
      History.tsx           recent check-ins sparkline + list
      Duties.tsx            today's duties, restriction pinned, mark done + feedback
      Settings.tsx          consent status + revoke, sign out
```

### 3.2 Supabase client

`lib/supabase.ts` creates one browser client from `NEXT_PUBLIC_SUPABASE_URL`
and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the same client-safe publishable key
already committed in `deploy/config.js`; it is not a secret). `persistSession`
and `autoRefreshToken` are on so the worker stays logged in. The logged-in
worker's JWT (with the `user_role`, `user_id`, `tenant_id` claims stamped by the
auth hook) rides on every request, so RLS returns only the worker's own rows.

### 3.3 Session and profile

`SessionProvider` holds:
- `session` from `supabase.auth.getSession()` and `onAuthStateChange`.
- `workerProfile`: the worker's `public.users` row plus their `workers` and
  current `injuries` row (own, via RLS).
- `consent`: the current non-revoked `consents` row for the worker, if any.
- `tenant`: the worker's `tenants` row for branding (name, colors, logo).

The provider exposes refresh helpers so screens can re-pull after a write.

## 4. Auth flow (SMS OTP with test numbers)

### 4.1 App side

`lib/auth.ts` wraps a single `AuthStrategy` interface so the mechanism is
swappable (07.2 seam):
- `requestOtp(phone)` calls `supabase.auth.signInWithOtp({ phone })`.
- `verifyOtp(phone, code)` calls
  `supabase.auth.verifyOtp({ phone, token: code, type: 'sms' })`.

`Login.tsx` is two steps: enter phone (E.164, prefilled `+1`), then enter the
6-digit code. Errors (bad code, expired, rate limit) render inline.

### 4.2 Project side (setup, done during implementation)

1. Enable phone auth on the project (`external_phone_enabled`) and register a
   test OTP for the seed worker: phone `+15875550101` maps to a fixed code
   (for example `123456`) via the `sms_test_otp` auth config. No real SMS is
   sent for test numbers; the fixed code verifies.
2. Set the phone on Marcus's existing seed auth user
   (`a0000000-0000-0000-0000-000000000001`) to `+15875550101` and mark it
   confirmed, so phone OTP resolves to that auth user, which is already linked
   to Marcus's `public.users` row. The auth hook then stamps his `worker`
   claims and RLS scopes him to his own case.

Risk: if Supabase requires a configured SMS provider before phone auth can be
enabled at all, we fall back to email OTP for this increment behind the same
AuthStrategy seam and note it. This is verified as the first implementation
step so it does not block the screens.

## 5. Screens

All screens are mobile-first single column, 48px minimum tap targets, grade-7
copy, navy `#0E1B2C` and gold `#C8972F` with tenant branding overrides.

1. **Login.** Phone then code, per Section 4.
2. **Consent gate.** First launch after login. Plain grade-7 explanation of who
   sees what (employer sees abilities only; clinician sees everything; WCB gets
   the milestone documents; Continuum is not the medical record). Captures a
   timestamped `consents` row (version, scope jsonb) on agree. Until a current
   consent exists the rest of the app is blocked. Revocable in Settings;
   revoking blocks further collection immediately (the server consent trigger
   enforces this on writes).
3. **Home.** Injury summary: body part, status badge, day X of prognosis,
   estimated return date, current restriction line. Below it, the current
   check-in card (AM or PM window) or a "both check-ins done today" state.
4. **Check-in.** Pain slider 0-10, mobility slider 0-10, optional notes, submit.
   Writes a `recovery_logs` row with a client-generated UUID (idempotency
   backstop is the existing unique constraint). The insert fires the server
   escalation engine and is blocked by the server consent trigger if consent was
   revoked. AM and PM windows tracked per day.
5. **History.** Recent check-ins as a pain and mobility sparkline plus a short
   list of the latest entries. Reads the worker's own `recovery_logs`.
6. **Duties.** Today's light duties with the clinician restriction pinned on
   top (read-only), each with a mark-done toggle and optional feedback. Reads
   and updates the worker's own `light_duties` rows. Only meaningful while the
   injury is in `light_duty` status; otherwise shows an empty state.

## 6. Data model and RLS reliance

The app performs no privileged operations; it relies entirely on existing RLS:
- `injuries` select: worker sees own (via `continuum_injury_access`).
- `recovery_logs` select and insert: worker own; insert is consent-gated and
  fires escalation evaluation server-side.
- `light_duties` select and update: worker own (check-off and feedback).
- `consents` select, insert, update: worker manages own.
- `tenants` select: worker sees own tenant (branding).

No new migrations are required for this increment. The only backend change is
the auth config and the one-row update to Marcus's seed auth user (Section 4.2),
which is live provisioning, not a committed migration.

## 7. Look and feel

- Tokens: navy `#0E1B2C`, panel `#16243B`, gold `#C8972F`, gold-soft `#E3B85C`,
  ink `#E9EEF6`, muted `#9AA9BF`, good `#6FBF8F`. Status colors match the demo.
- Tenant branding: on load, read `tenants.branding` (display_name, colors,
  logo_url) and apply as CSS variables so the header and accents reflect the
  employer. Defaults to navy and gold.
- Typography: Space Grotesk for headings, Inter for body (Google Fonts).
- Every interactive target is at least 48px. Sliders are large and thumb-friendly.
- Copy is grade-7 throughout, functional not clinical, no em or en dashes.

## 8. Dependencies (package.json)

Runtime: `next@14`, `react`, `react-dom`, `@supabase/supabase-js@2`,
`@capacitor/core`, `@capacitor/ios`, `@capacitor/android`,
`@capacitor/preferences`.
Dev: `typescript`, `@types/react`, `@types/node`, `tailwindcss`, `postcss`,
`autoprefixer`, `@capacitor/cli`.

Nothing beyond this set is added without explicit approval.

## 9. Out of scope (next increments)

- Offline queue and idempotent sync (Capacitor Preferences or IndexedDB).
- Push notifications and reminders.
- Native compilation to `.ipa` and `.apk` (needs Xcode and Android Studio on
  your machine).
- Vercel deployment of the app (separate project or monorepo config).
- Twilio SMS for real phone numbers.

## 10. Verification

Local only, no build in the working tree:
1. `npm install` and `npm run dev` in `worker-app/`.
2. Drive the flow in a browser as Marcus: request OTP for `+15875550101`, enter
   the test code, land on the consent gate, agree, see Home with his real
   injury summary, submit a check-in, and confirm the row appears in
   `recovery_logs` (scoped to him) via a Supabase query.
3. Open History and see the new check-in in the trend; open Duties and mark one
   done, then confirm the `light_duties` row updated.
4. Revoke consent in Settings and confirm a further check-in is blocked by the
   server consent trigger.

`npm run build` is not run in the working tree (standing rule). The static
export and Capacitor native builds are exercised in a later increment.

## 11. Open risks

- Phone-auth-without-provider feasibility (Section 4.2); fallback is email OTP
  behind the AuthStrategy seam.
- Static export plus App Router client-only routing must avoid server-only
  features; all data is client-side so this is expected to be clean.
- Deploying a Next app from a subfolder of a repo whose root is a static site
  needs a separate Vercel project or monorepo settings; deferred with the rest
  of deployment.
