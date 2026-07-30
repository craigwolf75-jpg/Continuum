# Continuum Hub: email + password accounts with approval gate, design

Status: approved by Gary 2026-07-30. Supersedes the deferred Prompt 39 hub gate (shared demo passcode) for the /hub sign-in.

## Goal
Replace the placeholder /hub sign-in (accepts any email + any one time code) with real email and password accounts. A visitor who is already past the SITE gate (Prompt 40) can sign up at /hub; the account is created PENDING and cannot reach any portal until gary@farmceuticawellness.com approves it and assigns an access group. This governs who reaches the dashboards, and the access log / user list tells us who.

## Roles and access groups
Approval assigns one access group. Access is group wide.
- Group 1: Employer, HSE, Worker dashboards (deploy/employer-dashboard.html, deploy/hse-portal.html, deploy/worker-dashboard.html).
- Group 2: Clinical Partner, WCB, Sigma dashboards (deploy/clinical-dashboard.html, deploy/wcb-portal.html, deploy/sigma-portal.html).
- Admin: the Platform Admin portal (deploy/admin-portal.html) plus everything. EXCLUSIVE to gary@farmceuticawellness.com. For every other signed in user the Admin portal is route blocked AND hidden from nav. Not shown to the public at all.

The specific role name inside a group (for example Employer vs HSE) is recorded for display only; it does not narrow access. The functional unit is the group.

## Approach: Supabase Auth + approval layer
Use Supabase Auth (email + password) for credentials. Supabase handles password hashing, sign in, and password reset. We add a thin approval layer:
- Server side serverless endpoints (matching the existing deploy/api/site-access.js pattern) call Supabase Auth REST with the service role key, then check the approval layer, then issue our own signed HMAC hub cookie ct_session (the existing deploy/api/_hub_session.js codec, separate secret from the site gate). The edge middleware verifies ct_session locally (no DB call per request) and gates portals by group.
- Rationale: consistent with the site gate already in production (signed cookie verified at the edge, hard wall between ct_site and ct_session), keeps credentials and the service key server side, and avoids shipping the service key to the browser.

Rejected alternative: client side supabase-js issuing a Supabase JWT that the middleware verifies. Workable, but it splits the session model (Supabase JWT for the hub vs signed cookie for the site gate), needs the middleware to validate Supabase JWTs, and leaks more of the auth surface to the client. The server endpoint approach reuses what is already built and proven.

## Data model
New table public.hub_profiles (RLS on, no anon or authenticated policies; only the service role, used by the endpoints, reaches it):
- id uuid primary key (equals the Supabase auth.users id)
- email text not null unique
- status text not null check in ('pending', 'approved', 'rejected') default 'pending'
- access_group text check in ('group1', 'group2', 'admin') (null until approved)
- role_label text (optional display label, for example 'Employer')
- created_at timestamptz default now()
- approved_at timestamptz
- approved_by text

gary@farmceuticawellness.com is the seeded admin: on first sign in (or by a one time seed) their profile is status='approved', access_group='admin'. The admin identity is also pinned in deploy/api/_hub_session.js ADMIN_EMAILS (already contains gary@farmceuticawellness.com). Admin is determined by the session email being in ADMIN_EMAILS, not only by the group column, so the admin can never be locked out by data.

## Flows
Sign up (POST /api/hub-signup, behind the site gate): email + password. Create the Supabase Auth user, create hub_profiles row status='pending'. Return a neutral result. The hub page shows "Your account is awaiting approval." No cookie is issued (pending users get no session).

Sign in (POST /api/hub-signin, behind the site gate): email + password verified against Supabase Auth. Then read hub_profiles:
- no profile or status='pending' -> 200 with an "awaiting approval" state, no cookie.
- status='rejected' -> 403 neutral "not available".
- status='approved' -> issue ct_session carrying { sub: user id, email, group } and land the user in the hub, scoped to their group. gary@ (ADMIN_EMAILS) always resolves to admin regardless of the group column.

Approve (admin only): the admin surface lists pending profiles; Approve sets status='approved' and access_group; Reject sets status='rejected'. Writes approved_at/by.

Sign out: clears ct_session.

Password reset: Supabase Auth reset by email (standard). Deferred to a later increment unless trivial; not required for launch of this feature.

## Enforcement (edge middleware, deploy/middleware.js)
The site gate (decideSiteAccess, ct_site) is unchanged and runs first: nothing is reachable without the site code. Add hub gating for the portal paths, keyed on the verified ct_session group:
- Group 1 paths (employer-dashboard, hse-portal, worker-dashboard and their assets) require ct_session group in { group1, admin }.
- Group 2 paths (clinical-dashboard, wcb-portal, sigma-portal and their assets) require ct_session group in { group2, admin }.
- Admin path (admin-portal and its assets) requires the ct_session email in ADMIN_EMAILS. Everyone else: route blocked (rewrite to the hub) and it is absent from any nav a non admin sees.
- /hub itself and the auth endpoints are reachable to any site gated visitor (so they can sign up and sign in).
A user hitting a portal outside their group is sent back to the hub, not shown the content. Hard wall preserved: ct_session and ct_site are separate cookies with separate secrets; neither grants the other.

## Admin approval surface
A hub user management view, admin only (gary@), reachable from the Admin portal (or a dedicated admin screen), served behind the hub gate. Lists pending and approved hub_profiles with Approve (choose Group 1 or Group 2) and Reject. Backed by deploy/api/hub-admin.js (service role, guarded by requireHubAdmin using the existing _hub_session verify + ADMIN_EMAILS). No check in or medical data appears here; enrollment and hub user management stay separate from clinical surfaces.

## Hub page changes
deploy/hub/index.html (and its compiled source hub-roles if applicable): replace "Work email + One time code + Sign in" with an email + password sign in AND a sign up path (create account), plus the awaiting approval state. Update the copy ("Dashboard access for HSE, employer, Clinical Partner, and WCB" stays accurate). The "Presenter Controls" panel becomes admin only (gary@) or is removed from the hub; it must not show to a signed out or non admin visitor.

## Infrastructure (Gary or a sbp_ token; not the code side)
- Enable the Supabase email + password auth provider on agzhnmunodrhsjbogzae.
- Email confirmation: OFF (approval is the gate).
- Apply the hub_profiles migration (table + RLS) via the Management API, same path as the site gate migration.
- Vercel env already present: CONTINUUM_HUB_SESSION_SECRET (set), SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (reused via fallback). No new Vercel secrets expected.

## Defaults (confirmed)
- No email confirmation on signup.
- No email notification to the admin on new signups; the admin checks the pending queue.
- role_label recorded for display only; group governs access.

## Non goals
- No SSO, no social login, no magic links.
- No self service role change; only the admin assigns/changes group.
- The worker app SMS enrollment (Prompt 39h) is separate and unchanged; the Worker DASHBOARD here is a Group 1 demo portal, not the injured worker enrollment flow.
- No multi tenant org separation; this is a gated pre launch demo.

## Relationship to prior work
- Replaces the deferred Prompt 39 shared passcode hub gate.
- Reuses deploy/api/_hub_session.js (ct_session, ADMIN_EMAILS with gary@farmceuticawellness.com) and the deploy/middleware.js edge pattern.
- Satisfies the standing rule that gary@farmceuticawellness.com is the admin, and the earlier "gate the Admin panel, keep Mount Olympus, admin only" change.

## Testing
- Unit: ct_session sign/verify (exists), group to portal mapping (decideHubAccess), signup input validation, admin guard, approve/reject state transitions.
- Integration (post creds): signup -> pending, sign in pending -> awaiting, approve -> group1, sign in -> reaches only group1 portals, group2 path -> blocked, admin path -> only gary@, rejected -> blocked.
