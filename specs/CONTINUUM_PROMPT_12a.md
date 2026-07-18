# CONTINUUM PROMPT 12a: Wiring the Framer Worker App

**Deliverable:** ContinuumWorkerApp.tsx v2 (wired), plus the demo service contract and a paste-ready edge function block. Compile-verified (esbuild) and spec-audited this session.
**Extends:** Prompt 12. Everything in Prompt 12 still holds; this adds a live data mode.
**Date:** July 17, 2026

## 1. The guardrail before anything else

The live mode connects EXCLUSIVELY to a synthetic demo service serving the fictional Marcus case. Prompt 09 G3 prohibits real health information from reaching third-party runtimes, marketing surfaces, or analytics; a Framer-hosted page is all three. The demo service therefore runs against a dedicated demo state row, never against production tables, and its token grants access to nothing else. This is not a deployment choice; it is law.

## 2. What v2 adds to the component

- A Data source control: Demo (built in, identical to Prompt 12) or Live (demo service). Live reveals three more controls: Service URL, Demo token, Poll seconds (5 to 60, default 12).
- Three link states surfaced as a header chip: Linking (muted), Live (gold, breathing dot), Demo (link unavailable). The component NEVER breaks when the service is down: any fetch or post failure drops it into fallback and it keeps running on internal state, silently.
- Optimistic writes: check-in save, duty toggle, and next day update the UI instantly and post to the service in the background. Reads poll on the configured interval with AbortController cleanup and full unmount hygiene.
- Live identity: if the service supplies workerName and bodyPart they override the props.
- No new imports: fetch is a browser global, guarded behind typeof window checks.

## 3. The demo service contract (the seam)

Base URL supplied via the Service URL control. Bearer token optional but recommended. All responses application/json. CORS allows any origin (data is synthetic by law).

    GET  {base}/state           200 { workerName, bodyPart, day, prognosisDays, checkedInToday, escalated, trend[{pain,mob}], duties[{id,t,done}] }
    POST {base}/checkins        body { pain, mob }        200 { ok: true }
    POST {base}/duties/toggle   body { id, done }         200 { ok: true }
    POST {base}/advance-day     body { }                  200 { ok: true }

Unknown fields ignored; missing fields leave local state untouched, so the contract can grow without breaking deployed sites.

## 4. The demo service as a Supabase edge function

Built and deployed to the Continuum project (agzhnmunodrhsjbogzae, ca-central-1). See the implementation record below.

## 5. Failure and abuse posture

Token leaks cost nothing but synthetic-state vandalism, healed by the daily reset. The component tolerates outage, 401, malformed JSON, and CORS failure identically: fallback chip, internal state, no errors thrown. The service holds no personal information, so it sits outside the Prompt 09 breach-notification scope by construction.

## 6. Usage recipes

- Marketing hero: Data source Live, autoplay off, phone frame on.
- Ambient hero background: Data source Demo, autoplay on, pointer events off on the layer.
- Sales call: Data source Live with the service URL; multiple visitors see each other's toggles within one poll interval.

---

## Implementation record (this repo)

- Migration supabase/migrations/20260718100000_framer_demo.sql: table framer_demo_state; a restricted role framer_demo that OWNS the SECURITY DEFINER operations and is granted access to ONLY that table, so any other-table query fails with permission denied (verified). RLS denies public keys, so the token is the sole gate. Operations framer_demo_get / _checkin / _toggle / _advance (trend cap 16, escalation on three consecutive pain 8+, day advance up to prognosis, window reset) granted to anon. Daily framer_demo_reset cron restores the Marcus baseline.
- Edge function supabase/functions/framer-demo: verify_jwt off; GET /state, POST /checkins, /duties/toggle, /advance-day; open CORS; reachable with only the demo token as bearer; calls the operations with the anon key.
- Component framer/ContinuumWorkerApp.tsx v2: the additions in section 2. Compile-verified with esbuild.
- Verified end to end over HTTP: reads, writes, escalation rule, 401 without token, preflight CORS, isolation (framer_demo cannot read injuries).
- The demo token is provisioned live (one synthetic row) and handed to Gary out of band; only its hash is stored. Rotate by reseeding a new token.
- No em-dashes or en-dashes anywhere.
