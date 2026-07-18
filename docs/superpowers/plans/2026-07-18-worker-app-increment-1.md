# Continuum Worker App Increment 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Continuum worker app (six screens, online-first) as a Next.js 14 + Capacitor surface in `worker-app/`, wired to the live Supabase project and scoped to the logged-in worker by RLS.

**Architecture:** A client-rendered SPA using the Next.js App Router with static export. Every component is a client component; all data flows through supabase-js in the browser using the publishable key, with the logged-in worker's JWT enforcing RLS. A SessionProvider holds session, worker profile, consent, and tenant branding; `page.tsx` gates between Login, Consent, and the tabbed app shell.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, @supabase/supabase-js v2, Capacitor 6 (core/ios/android/preferences).

## Global Constraints

- Next.js 14 App Router, TypeScript, Tailwind, static export: `next.config.js` sets `output: 'export'` and `images.unoptimized: true`.
- Dependencies limited to: `next@14`, `react`, `react-dom`, `@supabase/supabase-js@^2`, `@capacitor/core@^6`, `@capacitor/ios@^6`, `@capacitor/android@^6`, `@capacitor/preferences@^6`; dev: `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `tailwindcss`, `postcss`, `autoprefixer`, `@capacitor/cli@^6`. No test framework is added this increment; verification is running the dev server and driving the flow plus Supabase queries.
- Supabase URL: `https://agzhnmunodrhsjbogzae.supabase.co`. Publishable key (client-safe, public): `sb_publishable_dEYjpgPSaLiMow0xe2a6sQ_4wBnt_Yp`.
- Colors: navy `#0E1B2C`, panel `#16243B`, gold `#C8972F`, gold-soft `#E3B85C`, ink `#E9EEF6`, muted `#9AA9BF`, good `#6FBF8F`. 48px minimum tap targets. Grade-7 copy, functional not clinical.
- No em-dashes or en-dashes anywhere: code, comments, copy, docs.
- Never run `npm run build` in the working tree (poisons state); use `npm run dev` only.
- No new migrations. All data access relies on existing RLS. The only backend change is auth config plus one update to Marcus's seed auth user.
- Fixtures (seed): tenant `11111111-1111-1111-1111-111111111111`, worker user `b0000000-0000-0000-0000-000000000001`, worker `c0000000-0000-0000-0000-000000000001`, injury `d0000000-0000-0000-0000-000000000001`, seed auth user `a0000000-0000-0000-0000-000000000001`, Marcus phone `+15875550101`, test OTP `123456`.
- Management token for backend config calls is provided out of band by the operator; never commit it. All SQL and config go through the Supabase Management API as used elsewhere in this repo.

## File Structure

```
worker-app/
  package.json                 deps + scripts (dev, cap:sync)
  next.config.js               output export, images unoptimized
  tsconfig.json
  tailwind.config.ts           color tokens, content globs
  postcss.config.js
  capacitor.config.ts          appId, appName, webDir 'out'
  .env.local.example           NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  .gitignore                   node_modules, .next, out, .env.local
  src/
    lib/supabase.ts            single browser client
    lib/types.ts               row types
    lib/format.ts              pure helpers (dayOfPrognosis, statusLabel, checkinWindow)
    lib/auth.ts                AuthStrategy: requestOtp, verifyOtp, signOut
    state/SessionProvider.tsx  context: session, profile, injury, consent, tenant + refreshers
    app/layout.tsx             html shell, fonts, SessionProvider
    app/globals.css            Tailwind + tokens
    app/page.tsx               gate: Login | ConsentGate | AppShell
    components/Login.tsx
    components/ConsentGate.tsx
    components/AppShell.tsx
    components/BottomNav.tsx
    components/Home.tsx
    components/CheckIn.tsx
    components/History.tsx
    components/Duties.tsx
    components/Settings.tsx
```

---

### Task 1: Scaffold the Next.js + Tailwind + Capacitor project

**Files:**
- Create: `worker-app/package.json`, `worker-app/next.config.js`, `worker-app/tsconfig.json`, `worker-app/tailwind.config.ts`, `worker-app/postcss.config.js`, `worker-app/capacitor.config.ts`, `worker-app/.env.local.example`, `worker-app/.gitignore`, `worker-app/src/app/layout.tsx`, `worker-app/src/app/globals.css`, `worker-app/src/app/page.tsx`

**Interfaces:**
- Produces: a runnable Next.js app; `page.tsx` renders a placeholder that Task 6 replaces.

- [ ] **Step 1: Create `worker-app/package.json`**

```json
{
  "name": "continuum-worker",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "lint": "next lint",
    "cap:sync": "cap sync"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "@supabase/supabase-js": "^2.45.0",
    "@capacitor/core": "^6.1.0",
    "@capacitor/ios": "^6.1.0",
    "@capacitor/android": "^6.1.0",
    "@capacitor/preferences": "^6.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@capacitor/cli": "^6.1.0"
  }
}
```

- [ ] **Step 2: Create config files**

`worker-app/next.config.js`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = { output: 'export', images: { unoptimized: true }, reactStrictMode: true };
module.exports = nextConfig;
```

`worker-app/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020", "lib": ["dom", "dom.iterable", "esnext"], "allowJs": true,
    "skipLibCheck": true, "strict": true, "noEmit": true, "esModuleInterop": true,
    "module": "esnext", "moduleResolution": "bundler", "resolveJsonModule": true,
    "isolatedModules": true, "jsx": "preserve", "incremental": true,
    "plugins": [{ "name": "next" }], "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`worker-app/postcss.config.js`:
```js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

`worker-app/tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0E1B2C', panel: '#16243B', panel2: '#1C2C47', line: '#27395A',
        ink: '#E9EEF6', muted: '#9AA9BF', gold: '#C8972F', goldsoft: '#E3B85C',
        good: '#6FBF8F', chipbg: '#122036'
      },
      fontFamily: { head: ['"Space Grotesk"', 'sans-serif'], body: ['Inter', 'sans-serif'] }
    }
  },
  plugins: []
};
export default config;
```

`worker-app/capacitor.config.ts`:
```ts
import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.continuum.worker',
  appName: 'Continuum',
  webDir: 'out'
};
export default config;
```

`worker-app/.env.local.example`:
```
NEXT_PUBLIC_SUPABASE_URL=https://agzhnmunodrhsjbogzae.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_dEYjpgPSaLiMow0xe2a6sQ_4wBnt_Yp
```

`worker-app/.gitignore`:
```
node_modules
.next
out
.env.local
next-env.d.ts
ios
android
```

- [ ] **Step 3: Create the app shell files**

`worker-app/src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
:root { color-scheme: dark; }
html, body { background: #0E1B2C; color: #E9EEF6; margin: 0; font-family: Inter, sans-serif; }
button { font: inherit; }
/* every interactive control is at least 48px tall */
button, input, a[role="button"] { min-height: 48px; }
```

`worker-app/src/app/layout.tsx`:
```tsx
import './globals.css';
import type { ReactNode } from 'react';
import { SessionProvider } from '@/state/SessionProvider';

export const metadata = { title: 'Continuum', description: 'Your recovery check-ins' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

`worker-app/src/app/page.tsx` (placeholder, replaced in Task 6):
```tsx
'use client';
export default function Page() {
  return <main className="p-6"><h1 className="font-head text-2xl">Continuum worker app</h1></main>;
}
```

Note: `layout.tsx` imports SessionProvider (Task 3). To keep Task 1 runnable on its own, temporarily render `{children}` without the provider, then restore the import in Task 3. Implementer choice: build Task 1 and Task 3 back to back.

- [ ] **Step 4: Install and run**

Run:
```bash
cd worker-app && npm install && npm run dev
```
Expected: dev server starts on `http://localhost:3000` (or next free port); the placeholder heading renders with no console errors. Do NOT run `npm run build`.

- [ ] **Step 5: Commit**

```bash
git add worker-app/package.json worker-app/*.js worker-app/*.ts worker-app/*.json worker-app/.gitignore worker-app/.env.local.example worker-app/src/app
git commit -m "feat(worker): scaffold Next.js + Tailwind + Capacitor app"
```

---

### Task 2: Enable SMS OTP test auth and link Marcus's phone (backend, de-risks the open question)

**Files:**
- No repo files. Live Supabase config via the Management API. Record the steps in the commit body of Task 4 where they are first exercised, or as a note.

**Interfaces:**
- Produces: phone OTP login works for `+15875550101` with code `123456`, resolving to Marcus's `worker` claims.

- [ ] **Step 1: Enable phone auth and register the test OTP**

PATCH `https://api.supabase.com/v1/projects/agzhnmunodrhsjbogzae/config/auth` with:
```json
{ "external_phone_enabled": true, "sms_test_otp": "+15875550101=123456" }
```
(`sms_test_otp` is a comma-separated `phone=code` map. If the API rejects enabling phone auth without a provider, set the SMS provider to a placeholder or fall back to email OTP for this increment behind the AuthStrategy seam, and note it.)

- [ ] **Step 2: Put the phone on Marcus's seed auth user**

Run via the Management API database/query endpoint:
```sql
update auth.users
set phone = '15875550101', phone_confirmed_at = now(), updated_at = now()
where id = 'a0000000-0000-0000-0000-000000000001';
```
Note: `auth.users.phone` is stored without the leading `+`.

- [ ] **Step 3: Verify the full OTP round-trip returns worker claims**

```bash
PUB="sb_publishable_dEYjpgPSaLiMow0xe2a6sQ_4wBnt_Yp"
curl -s -X POST "https://agzhnmunodrhsjbogzae.supabase.co/auth/v1/otp" -H "apikey: $PUB" -H "Content-Type: application/json" -d '{"phone":"+15875550101","create_user":false}'
curl -s -X POST "https://agzhnmunodrhsjbogzae.supabase.co/auth/v1/verify" -H "apikey: $PUB" -H "Content-Type: application/json" -d '{"type":"sms","phone":"+15875550101","token":"123456"}'
```
Expected: the verify call returns an `access_token`. Decode its payload and confirm `user_role: "worker"`, `user_id: "b0000000-0000-0000-0000-000000000001"`, `tenant_id: "11111111-1111-1111-1111-111111111111"`.

- [ ] **Step 4: Commit (note only, no repo change)**

No repo files change. If a helper note is desired, add `worker-app/README.md` documenting the test login and commit:
```bash
git add worker-app/README.md && git commit -m "docs(worker): document SMS OTP test login"
```

---

### Task 3: Supabase client, row types, pure helpers, auth strategy, SessionProvider

**Files:**
- Create: `worker-app/src/lib/supabase.ts`, `worker-app/src/lib/types.ts`, `worker-app/src/lib/format.ts`, `worker-app/src/lib/auth.ts`, `worker-app/src/state/SessionProvider.tsx`

**Interfaces:**
- Produces:
  - `supabase` (SupabaseClient) from `lib/supabase.ts`.
  - Types `Tenant, WorkerProfile, Injury, RecoveryLog, LightDuty, Consent` from `lib/types.ts`.
  - `dayOfPrognosis(dateOfInjury: string | null): number`, `statusLabel(status: string): string`, `checkinWindow(logsToday: RecoveryLog[]): 'AM' | 'PM' | 'done'` from `lib/format.ts`.
  - `requestOtp(phone: string): Promise<void>`, `verifyOtp(phone: string, code: string): Promise<void>`, `signOut(): Promise<void>` from `lib/auth.ts`.
  - `useSession()` hook returning `{ session, profile, injury, consent, tenant, loading, refreshConsent, refreshInjury }` from `state/SessionProvider.tsx`.

- [ ] **Step 1: `lib/supabase.ts`**

```ts
import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});
```

- [ ] **Step 2: `lib/types.ts`**

```ts
export type Tenant = { id: string; name: string; branding: { display_name?: string; logo_url?: string | null; colors?: { navy?: string; gold?: string } } };
export type Injury = { id: string; tenant_id: string; worker_id: string; body_part: string | null; injury_type: string | null; status: string; prognosis_days: number | null; date_of_injury: string | null; estimated_return_date: string | null; current_restrictions: string | null };
export type WorkerProfile = { user_id: string; tenant_id: string | null; full_name: string | null; worker_id: string | null };
export type RecoveryLog = { id: string; injury_id: string; logged_at: string; pain_score: number | null; mobility_score: number | null; notes: string | null; source: string };
export type LightDuty = { id: string; injury_id: string; task_description: string | null; medical_restrictions: string | null; completed_date: string | null; worker_feedback: string | null };
export type Consent = { id: string; user_id: string; version: string; granted_at: string; revoked_at: string | null };
```

- [ ] **Step 3: `lib/format.ts` (pure helpers)**

```ts
import type { RecoveryLog } from './types';
export function dayOfPrognosis(dateOfInjury: string | null): number {
  if (!dateOfInjury) return 0;
  const start = new Date(dateOfInjury + 'T00:00:00Z').getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / 86400000));
}
const LABELS: Record<string, string> = {
  reported: 'Reported', off_work: 'Off work', light_duty: 'Light duty',
  full_duty_pending: 'Return pending', signed_off: 'Signed off', escalated: 'Escalated'
};
export function statusLabel(status: string): string { return LABELS[status] ?? status; }
export function checkinWindow(logsToday: RecoveryLog[]): 'AM' | 'PM' | 'done' {
  if (logsToday.length >= 2) return 'done';
  if (logsToday.length === 1) return 'PM';
  return 'AM';
}
```

- [ ] **Step 4: `lib/auth.ts` (AuthStrategy seam)**

```ts
import { supabase } from './supabase';
export async function requestOtp(phone: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: false } });
  if (error) throw error;
}
export async function verifyOtp(phone: string, code: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
  if (error) throw error;
}
export async function signOut(): Promise<void> { await supabase.auth.signOut(); }
```

- [ ] **Step 5: `state/SessionProvider.tsx`**

```tsx
'use client';
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { WorkerProfile, Injury, Consent, Tenant } from '@/lib/types';

type Ctx = { session: Session | null; profile: WorkerProfile | null; injury: Injury | null; consent: Consent | null; tenant: Tenant | null; loading: boolean; refreshConsent: () => Promise<void>; refreshInjury: () => Promise<void>; };
const SessionCtx = createContext<Ctx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [injury, setInjury] = useState<Injury | null>(null);
  const [consent, setConsent] = useState<Consent | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const { data: u } = await supabase.from('users').select('id, tenant_id, full_name').limit(1).maybeSingle();
    if (!u) { setProfile(null); return; }
    const { data: w } = await supabase.from('workers').select('id').eq('user_id', u.id).maybeSingle();
    setProfile({ user_id: u.id, tenant_id: u.tenant_id, full_name: u.full_name, worker_id: w?.id ?? null });
    if (u.tenant_id) {
      const { data: t } = await supabase.from('tenants').select('id, name, branding').eq('id', u.tenant_id).maybeSingle();
      setTenant(t as Tenant | null);
    }
  }, []);
  const refreshInjury = useCallback(async () => {
    const { data } = await supabase.from('injuries').select('id, tenant_id, worker_id, body_part, injury_type, status, prognosis_days, date_of_injury, estimated_return_date, current_restrictions').is('deleted_at', null).order('created_at', { ascending: false }).limit(1).maybeSingle();
    setInjury(data as Injury | null);
  }, []);
  const refreshConsent = useCallback(async () => {
    const { data } = await supabase.from('consents').select('id, user_id, version, granted_at, revoked_at').is('deleted_at', null).is('revoked_at', null).order('granted_at', { ascending: false }).limit(1).maybeSingle();
    setConsent(data as Consent | null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    (async () => {
      if (!session) { setProfile(null); setInjury(null); setConsent(null); setTenant(null); setLoading(false); return; }
      setLoading(true);
      await loadProfile(); await refreshInjury(); await refreshConsent();
      setLoading(false);
    })();
  }, [session, loadProfile, refreshInjury, refreshConsent]);

  return <SessionCtx.Provider value={{ session, profile, injury, consent, tenant, loading, refreshConsent, refreshInjury }}>{children}</SessionCtx.Provider>;
}
export function useSession(): Ctx { const c = useContext(SessionCtx); if (!c) throw new Error('useSession outside provider'); return c; }
```

- [ ] **Step 6: Restore the provider import in `layout.tsx`** (if Task 1 stubbed it) so `SessionProvider` wraps `{children}`.

- [ ] **Step 7: Verify**

Run `npm run dev`, open the app. Expected: no console errors; `useSession()` resolves (placeholder page still renders). Copy `.env.local.example` to `.env.local` first so the client has its keys.

- [ ] **Step 8: Commit**

```bash
git add worker-app/src/lib worker-app/src/state worker-app/src/app/layout.tsx
git commit -m "feat(worker): supabase client, types, helpers, auth, session provider"
```

---

### Task 4: Login screen

**Files:**
- Create: `worker-app/src/components/Login.tsx`

**Interfaces:**
- Consumes: `requestOtp`, `verifyOtp` from `lib/auth.ts`.
- Produces: `<Login />` default export; on success the auth state change flips the gate in `page.tsx`.

- [ ] **Step 1: `components/Login.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { requestOtp, verifyOtp } from '@/lib/auth';

export default function Login() {
  const [phone, setPhone] = useState('+1');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true); setError(null);
    try { await requestOtp(phone.trim()); setSent(true); }
    catch (e: any) { setError(e.message || 'Could not send the code.'); }
    finally { setBusy(false); }
  }
  async function verify() {
    setBusy(true); setError(null);
    try { await verifyOtp(phone.trim(), code.trim()); }
    catch (e: any) { setError(e.message || 'That code did not work.'); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen flex flex-col justify-center px-6 max-w-md mx-auto">
      <div className="font-head text-2xl font-bold mb-1">Contin<span className="text-gold">uum</span></div>
      <p className="text-muted mb-6">Sign in to your recovery check-ins.</p>
      {!sent ? (
        <>
          <label className="text-sm font-semibold">Your phone number</label>
          <input className="w-full bg-chipbg border border-line rounded-xl px-4 my-2 text-ink" value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" />
          <button className="w-full bg-gold text-navy font-semibold rounded-xl mt-2" disabled={busy} onClick={send}>Send me a code</button>
        </>
      ) : (
        <>
          <label className="text-sm font-semibold">Enter the 6-digit code</label>
          <input className="w-full bg-chipbg border border-line rounded-xl px-4 my-2 text-ink tracking-widest text-center text-xl" value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" maxLength={6} />
          <button className="w-full bg-gold text-navy font-semibold rounded-xl mt-2" disabled={busy} onClick={verify}>Sign in</button>
          <button className="w-full border border-line text-ink rounded-xl mt-2" onClick={() => setSent(false)}>Use a different number</button>
        </>
      )}
      {error && <p className="text-goldsoft mt-3 text-sm">{error}</p>}
    </main>
  );
}
```

- [ ] **Step 2: Wire Login into `page.tsx` temporarily to verify**

Temporarily set `page.tsx` to render `<Login />` when there is no session (final gate is Task 6):
```tsx
'use client';
import { useSession } from '@/state/SessionProvider';
import Login from '@/components/Login';
export default function Page() {
  const { session } = useSession();
  if (!session) return <Login />;
  return <main className="p-6">Signed in.</main>;
}
```

- [ ] **Step 3: Verify the login flow end to end**

Run `npm run dev`. In the browser: enter `+15875550101`, tap Send, enter `123456`, tap Sign in. Expected: the screen flips to "Signed in." Confirm in the console there are no errors and `supabase.auth.getSession()` now returns a session.

- [ ] **Step 4: Commit**

```bash
git add worker-app/src/components/Login.tsx worker-app/src/app/page.tsx
git commit -m "feat(worker): SMS OTP login screen"
```

---

### Task 5: Consent gate

**Files:**
- Create: `worker-app/src/components/ConsentGate.tsx`

**Interfaces:**
- Consumes: `useSession()` (`profile`, `refreshConsent`), `supabase`.
- Produces: `<ConsentGate />` default export; writes a `consents` row and calls `refreshConsent()`.

- [ ] **Step 1: `components/ConsentGate.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/SessionProvider';

export default function ConsentGate() {
  const { profile, tenant, refreshConsent } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function agree() {
    if (!profile) return;
    setBusy(true); setError(null);
    const { error } = await supabase.from('consents').insert({
      tenant_id: tenant?.id ?? profile.tenant_id,
      user_id: profile.user_id,
      version: 'v1',
      scope: { employer: 'functional_status_only', clinician: 'full_detail', wcb: 'legal_milestones' }
    });
    if (error) { setError('Could not save your choice. Please try again.'); setBusy(false); return; }
    await refreshConsent();
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-md mx-auto">
      <div className="text-gold font-head text-xs uppercase tracking-widest">Before we start</div>
      <h1 className="font-head text-2xl font-bold mt-2 mb-4">Your privacy, in plain words</h1>
      <ul className="space-y-3 text-[15px]">
        <li><b>Your employer</b> sees what you can do at work. Never your medical details, pain scores, or notes.</li>
        <li><b>Your clinician</b> sees everything, so they can help you recover.</li>
        <li><b>WCB</b> receives the required paperwork at three points in your claim.</li>
        <li><b>Continuum</b> manages this information for you. It is not your medical record.</li>
      </ul>
      <p className="text-muted text-sm mt-4">You can change your mind any time in Settings. Saying no stops all collection.</p>
      <button className="w-full bg-gold text-navy font-semibold rounded-xl mt-6" disabled={busy} onClick={agree}>I agree, let us go</button>
      {error && <p className="text-goldsoft mt-3 text-sm">{error}</p>}
    </main>
  );
}
```

- [ ] **Step 2: Verify**

With the temporary gate, after login manually render `<ConsentGate />` (or wait for Task 6). Tap "I agree". Expected: no error; querying Supabase shows a fresh `consents` row for `b0000000-0000-0000-0000-000000000001` with `revoked_at` null.

- [ ] **Step 3: Commit**

```bash
git add worker-app/src/components/ConsentGate.tsx
git commit -m "feat(worker): consent gate wired to consents table"
```

---

### Task 6: App shell, bottom nav, and the routing gate

**Files:**
- Create: `worker-app/src/components/AppShell.tsx`, `worker-app/src/components/BottomNav.tsx`
- Modify: `worker-app/src/app/page.tsx`

**Interfaces:**
- Consumes: `useSession()`, and the screen components `Home, History, Duties, Settings` (Tasks 7 to 11; stub them as empty exports first so the shell compiles, then fill in).
- Produces: `page.tsx` gate: `loading -> spinner`; `!session -> Login`; `session && !consent -> ConsentGate`; else `AppShell`. `AppShell` holds the active tab state and renders the header (tenant branding) plus `BottomNav`.

- [ ] **Step 1: `components/BottomNav.tsx`**

```tsx
'use client';
export type Tab = 'home' | 'history' | 'duties' | 'settings';
const TABS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Home' }, { id: 'history', label: 'History' },
  { id: 'duties', label: 'Duties' }, { id: 'settings', label: 'Settings' }
];
export default function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-panel2 border-t border-line flex">
      {TABS.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)}
          className={'flex-1 text-xs font-semibold ' + (tab === t.id ? 'text-gold' : 'text-muted')}>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: `components/AppShell.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { useSession } from '@/state/SessionProvider';
import BottomNav, { type Tab } from './BottomNav';
import Home from './Home';
import History from './History';
import Duties from './Duties';
import Settings from './Settings';

export default function AppShell() {
  const { tenant } = useSession();
  const [tab, setTab] = useState<Tab>('home');
  const name = tenant?.branding?.display_name || tenant?.name || 'Continuum';
  return (
    <div className="max-w-md mx-auto min-h-screen pb-16">
      <header className="sticky top-0 bg-navy/95 border-b border-line px-5 py-3 font-head font-bold">
        {name}<span className="text-gold">.</span>
      </header>
      <div className="px-5 py-4">
        {tab === 'home' && <Home />}
        {tab === 'history' && <History />}
        {tab === 'duties' && <Duties />}
        {tab === 'settings' && <Settings />}
      </div>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}
```

- [ ] **Step 3: Final `app/page.tsx` gate**

```tsx
'use client';
import { useSession } from '@/state/SessionProvider';
import Login from '@/components/Login';
import ConsentGate from '@/components/ConsentGate';
import AppShell from '@/components/AppShell';

export default function Page() {
  const { session, consent, loading } = useSession();
  if (loading) return <main className="min-h-screen grid place-items-center text-muted">Loading...</main>;
  if (!session) return <Login />;
  if (!consent) return <ConsentGate />;
  return <AppShell />;
}
```

- [ ] **Step 4: Create empty stub components so the shell compiles** (Tasks 7 to 11 fill them):

```tsx
// Home.tsx, History.tsx, Duties.tsx, Settings.tsx (temporary)
'use client';
export default function Home() { return <div>Home</div>; }
```

- [ ] **Step 5: Verify the whole gate**

Run `npm run dev`. Fresh (signed out) shows Login. Sign in as Marcus. If a consent already exists from Task 5, land on the shell; otherwise ConsentGate, then agree, then shell with the four tabs and Worley branding in the header.

- [ ] **Step 6: Commit**

```bash
git add worker-app/src/components/AppShell.tsx worker-app/src/components/BottomNav.tsx worker-app/src/app/page.tsx worker-app/src/components/Home.tsx worker-app/src/components/History.tsx worker-app/src/components/Duties.tsx worker-app/src/components/Settings.tsx
git commit -m "feat(worker): app shell, bottom nav, and routing gate"
```

---

### Task 7: Home screen (injury summary + check-in card entry)

**Files:**
- Modify: `worker-app/src/components/Home.tsx`

**Interfaces:**
- Consumes: `useSession()` (`injury`), `dayOfPrognosis`, `statusLabel`, and `<CheckIn />` (Task 8; import and render).
- Produces: injury summary card and a `<CheckIn />` block.

- [ ] **Step 1: Implement `Home.tsx`**

```tsx
'use client';
import { useSession } from '@/state/SessionProvider';
import { dayOfPrognosis, statusLabel } from '@/lib/format';
import CheckIn from './CheckIn';

export default function Home() {
  const { injury } = useSession();
  if (!injury) return <p className="text-muted">No active injury on file.</p>;
  const day = dayOfPrognosis(injury.date_of_injury);
  return (
    <div className="space-y-4">
      <section className="bg-panel border border-line rounded-2xl p-5">
        <div className="text-gold font-head text-xs uppercase tracking-widest">Your recovery</div>
        <h1 className="font-head text-xl font-bold mt-1">{injury.body_part} injury</h1>
        <div className="flex gap-2 flex-wrap mt-3 text-xs">
          <span className="bg-chipbg border border-line rounded-full px-3 py-1">{statusLabel(injury.status)}</span>
          <span className="bg-chipbg border border-line rounded-full px-3 py-1">Day {day} of {injury.prognosis_days ?? '?'}</span>
          {injury.estimated_return_date && <span className="bg-chipbg border border-line rounded-full px-3 py-1">Back around {injury.estimated_return_date}</span>}
        </div>
        {injury.current_restrictions && <p className="text-muted text-sm mt-3">Work limit right now: {injury.current_restrictions}</p>}
      </section>
      {injury.status !== 'signed_off' && <CheckIn />}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run dev, sign in. Expected: Home shows Marcus's right shoulder injury, status badge, day of prognosis. (`CheckIn` is a stub until Task 8; import compiles once Task 8 exists, so build Task 8 next.)

- [ ] **Step 3: Commit**

```bash
git add worker-app/src/components/Home.tsx
git commit -m "feat(worker): home injury summary"
```

---

### Task 8: Check-in (sliders + submit to recovery_logs)

**Files:**
- Create: `worker-app/src/components/CheckIn.tsx`

**Interfaces:**
- Consumes: `useSession()` (`injury`, `refreshInjury`), `supabase`, `checkinWindow`.
- Produces: `<CheckIn />` default export; inserts a `recovery_logs` row with a `crypto.randomUUID()` `client_generated_id`.

- [ ] **Step 1: `components/CheckIn.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/SessionProvider';
import { checkinWindow } from '@/lib/format';
import type { RecoveryLog } from '@/lib/types';

function todayRange() {
  const d = new Date(); const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
  return start;
}

export default function CheckIn() {
  const { injury } = useSession();
  const [pain, setPain] = useState(3);
  const [mob, setMob] = useState(6);
  const [notes, setNotes] = useState('');
  const [todayLogs, setTodayLogs] = useState<RecoveryLog[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadToday() {
    if (!injury) return;
    const { data } = await supabase.from('recovery_logs').select('id, injury_id, logged_at, pain_score, mobility_score, notes, source').eq('injury_id', injury.id).gte('logged_at', todayRange()).order('logged_at', { ascending: true });
    setTodayLogs((data as RecoveryLog[]) ?? []);
  }
  useEffect(() => { loadToday(); }, [injury?.id]);

  const window = checkinWindow(todayLogs);
  async function submit() {
    if (!injury || window === 'done') return;
    setBusy(true); setError(null);
    const { error } = await supabase.from('recovery_logs').insert({
      tenant_id: injury.tenant_id, injury_id: injury.id, client_generated_id: crypto.randomUUID(),
      pain_score: pain, mobility_score: mob, notes: notes || null, source: 'check_in'
    });
    if (error) {
      setError(error.message.includes('CONTINUUM_NO_CONSENT') ? 'Check-ins are paused because consent was turned off.' : 'Could not save your check-in.');
      setBusy(false); return;
    }
    setNotes(''); await loadToday(); setBusy(false);
  }

  if (window === 'done') return <section className="bg-panel border border-line rounded-2xl p-5"><h3 className="font-head font-semibold">Both check-ins done today</h3><p className="text-muted text-sm">See you tomorrow.</p></section>;

  return (
    <section className="bg-panel border border-line rounded-2xl p-5">
      <div className="text-gold font-head text-xs uppercase tracking-widest">{window} check-in</div>
      <label className="flex justify-between font-semibold mt-3">How is your pain? <span className="text-gold font-head">{pain}</span></label>
      <input type="range" min={0} max={10} value={pain} onChange={e => setPain(+e.target.value)} className="w-full accent-gold" />
      <label className="flex justify-between font-semibold mt-3">How is your movement? <span className="text-gold font-head">{mob}</span></label>
      <input type="range" min={0} max={10} value={mob} onChange={e => setMob(+e.target.value)} className="w-full accent-gold" />
      <textarea className="w-full bg-chipbg border border-line rounded-xl p-3 mt-3 text-ink" placeholder="Anything you want your clinician to know? (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
      <button className="w-full bg-gold text-navy font-semibold rounded-xl mt-3" disabled={busy} onClick={submit}>Save check-in</button>
      <p className="text-muted text-xs mt-2">Only your clinician sees your scores and notes.</p>
      {error && <p className="text-goldsoft mt-2 text-sm">{error}</p>}
    </section>
  );
}
```

- [ ] **Step 2: Verify a check-in lands in the database**

Run dev, sign in, submit a check-in with pain 5, mobility 6. Then query Supabase:
```sql
select pain_score, mobility_score, source, logged_at from public.recovery_logs
where injury_id = 'd0000000-0000-0000-0000-000000000001' order by logged_at desc limit 3;
```
Expected: the new row is present with pain 5, mobility 6. The card should flip to the PM window (or "done" after two).

- [ ] **Step 3: Cleanup the test check-in (keep the demo seed clean)**

```sql
delete from public.escalation_checks where injury_id = 'd0000000-0000-0000-0000-000000000001';
delete from public.recovery_logs where injury_id = 'd0000000-0000-0000-0000-000000000001';
```

- [ ] **Step 4: Commit**

```bash
git add worker-app/src/components/CheckIn.tsx
git commit -m "feat(worker): twice-daily slider check-in writing recovery_logs"
```

---

### Task 9: History (sparkline trend)

**Files:**
- Modify: `worker-app/src/components/History.tsx`

**Interfaces:**
- Consumes: `useSession()` (`injury`), `supabase`.
- Produces: recent check-ins list and an inline SVG sparkline of pain (gold) and mobility (muted).

- [ ] **Step 1: Implement `History.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/SessionProvider';
import type { RecoveryLog } from '@/lib/types';

export default function History() {
  const { injury } = useSession();
  const [logs, setLogs] = useState<RecoveryLog[]>([]);
  useEffect(() => {
    if (!injury) return;
    supabase.from('recovery_logs').select('id, injury_id, logged_at, pain_score, mobility_score, notes, source').eq('injury_id', injury.id).order('logged_at', { ascending: true }).limit(16).then(({ data }) => setLogs((data as RecoveryLog[]) ?? []));
  }, [injury?.id]);

  const w = 340, h = 70, step = logs.length > 1 ? w / (logs.length - 1) : w;
  const y = (v: number | null) => h - ((v ?? 0) / 10) * h;
  const path = (key: 'pain_score' | 'mobility_score') => logs.map((p, i) => (i ? 'L' : 'M') + (i * step).toFixed(1) + ' ' + y(p[key]).toFixed(1)).join(' ');

  return (
    <div className="space-y-4">
      <section className="bg-panel border border-line rounded-2xl p-5">
        <div className="text-gold font-head text-xs uppercase tracking-widest">Your trend</div>
        <h3 className="font-head font-semibold mt-1 mb-2">Pain (gold) and movement (light)</h3>
        {logs.length ? (
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" role="img" aria-label="Pain and movement trend">
            <path d={path('mobility_score')} fill="none" stroke="#9AA9BF" strokeWidth={2} />
            <path d={path('pain_score')} fill="none" stroke="#C8972F" strokeWidth={2.5} />
          </svg>
        ) : <p className="text-muted text-sm">No check-ins yet.</p>}
      </section>
      <section className="bg-panel border border-line rounded-2xl p-5">
        {[...logs].reverse().slice(0, 8).map(l => (
          <div key={l.id} className="flex justify-between border-b border-line py-2 text-sm last:border-0">
            <span className="text-muted">{new Date(l.logged_at).toLocaleString()}</span>
            <span>pain {l.pain_score} / move {l.mobility_score}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Submit two check-ins, open History. Expected: the sparkline renders and the list shows the entries. Clean up with the SQL from Task 8 Step 3 afterward.

- [ ] **Step 3: Commit**

```bash
git add worker-app/src/components/History.tsx
git commit -m "feat(worker): history sparkline and recent check-ins"
```

---

### Task 10: Duties (checklist, restriction pinned, mark done + feedback)

**Files:**
- Modify: `worker-app/src/components/Duties.tsx`

**Interfaces:**
- Consumes: `useSession()` (`injury`), `supabase`.
- Produces: list of the worker's `light_duties`; toggling done updates `completed_date` and `worker_feedback`.

- [ ] **Step 1: Implement `Duties.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/SessionProvider';
import type { LightDuty } from '@/lib/types';

export default function Duties() {
  const { injury } = useSession();
  const [duties, setDuties] = useState<LightDuty[]>([]);
  async function load() {
    if (!injury) return;
    const { data } = await supabase.from('light_duties').select('id, injury_id, task_description, medical_restrictions, completed_date, worker_feedback').eq('injury_id', injury.id).is('deleted_at', null).order('created_at', { ascending: true });
    setDuties((data as LightDuty[]) ?? []);
  }
  useEffect(() => { load(); }, [injury?.id]);

  async function toggle(d: LightDuty) {
    const done = !d.completed_date;
    await supabase.from('light_duties').update({ completed_date: done ? new Date().toISOString().slice(0, 10) : null }).eq('id', d.id);
    await load();
  }

  if (injury && injury.status !== 'light_duty') return <p className="text-muted">No duties right now. Your site assigns these once your clinician clears you for light duty.</p>;
  return (
    <div className="space-y-4">
      {injury?.current_restrictions && (
        <section className="bg-panel border border-line rounded-2xl p-4">
          <div className="text-gold font-head text-xs uppercase tracking-widest">Your limit</div>
          <p className="mt-1">{injury.current_restrictions}</p>
        </section>
      )}
      <section className="bg-panel border border-line rounded-2xl p-4">
        {duties.length ? duties.map(d => (
          <div key={d.id} className="flex justify-between items-center border-b border-line py-3 last:border-0">
            <span className={d.completed_date ? 'line-through text-muted' : ''}>{d.task_description}</span>
            <button className="border border-line rounded-lg px-3 text-sm" onClick={() => toggle(d)}>{d.completed_date ? 'Undo' : 'Done'}</button>
          </div>
        )) : <p className="text-muted text-sm">No duties assigned yet.</p>}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Seed a duty for Marcus while on light duty (via SQL as service): insert a `light_duties` row for injury `d0000000-...0001`, set injury status to `light_duty` if needed. Open Duties, mark it done, confirm `completed_date` updates in the DB, then undo. Clean up the seeded duty and restore status afterward.

- [ ] **Step 3: Commit**

```bash
git add worker-app/src/components/Duties.tsx
git commit -m "feat(worker): light-duty checklist with check-off"
```

---

### Task 11: Settings (consent status, revoke, sign out) and final end-to-end verification

**Files:**
- Modify: `worker-app/src/components/Settings.tsx`

**Interfaces:**
- Consumes: `useSession()` (`consent`, `profile`, `refreshConsent`), `supabase`, `signOut`.
- Produces: consent status display, revoke button (sets `revoked_at`), sign-out button.

- [ ] **Step 1: Implement `Settings.tsx`**

```tsx
'use client';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/SessionProvider';
import { signOut } from '@/lib/auth';

export default function Settings() {
  const { consent, refreshConsent } = useSession();
  async function revoke() {
    if (!consent) return;
    await supabase.from('consents').update({ revoked_at: new Date().toISOString() }).eq('id', consent.id);
    await refreshConsent();
  }
  return (
    <div className="space-y-4">
      <section className="bg-panel border border-line rounded-2xl p-5">
        <div className="text-gold font-head text-xs uppercase tracking-widest">Privacy center</div>
        <p className="mt-2 text-sm">Consent given {consent ? new Date(consent.granted_at).toLocaleDateString() : 'not yet'}. You can take it back any time; collection stops right away.</p>
        {consent && <button className="border border-line rounded-xl px-4 mt-3" onClick={revoke}>Revoke consent</button>}
      </section>
      <button className="w-full border border-line rounded-xl" onClick={() => signOut()}>Sign out</button>
    </div>
  );
}
```

Note: revoking consent sets `consent` to null in the provider, so `page.tsx` re-shows the ConsentGate. That is the intended behavior (collection blocked until re-consent).

- [ ] **Step 2: Full end-to-end verification**

Run `npm run dev` and walk the whole flow as Marcus:
1. Sign in with `+15875550101` / `123456`.
2. Land on Home with the right shoulder injury summary.
3. Submit a check-in; confirm it lands in `recovery_logs` (SQL from Task 8 Step 2).
4. Open History; see the trend.
5. Settings: Revoke consent. Return to Home and confirm the app now shows the ConsentGate again, and a check-in insert is blocked by the server consent trigger (re-agree to restore).
6. Sign out returns to Login.
Clean up any test check-ins and restore the seed with the SQL from Task 8 Step 3.

- [ ] **Step 3: Commit**

```bash
git add worker-app/src/components/Settings.tsx
git commit -m "feat(worker): settings with consent revoke and sign out"
```

---

## Self-Review notes

- Spec coverage: Login (Task 4), Consent (Task 5), Home (Task 7), Check-in (Task 8), History (Task 9), Duties (Task 10), Settings/revoke (Task 11), branding (Task 6 header + tenant read in Task 3), 48px targets (globals.css), grade-7 copy (each screen). Auth setup and the phone-link risk (Task 2). All six screens plus the auth model are covered.
- Deferred per spec: offline queue, push, native compile, Vercel deploy, Twilio. Not in any task by design.
- Type consistency: `RecoveryLog`, `LightDuty`, `Injury`, `Consent`, `Tenant`, `WorkerProfile` defined in Task 3 and used unchanged in Tasks 7 to 11. `useSession()` shape defined once in Task 3.
- No test framework is used; every verification step is a dev-server drive plus a Supabase query, consistent with the approved dependency set.
