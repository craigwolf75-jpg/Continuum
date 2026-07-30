/* Continuum Hub middleware access mapping suite. node deploy/hub-middleware-access.test.mjs
   Proves decideHubAccess (deploy/middleware.js): group to portal prefix
   mapping, admin path exclusivity (email in ADMIN_EMAILS AND group ===
   'admin'), admin covering group1/group2 paths, every portal path against
   every group, the impostor case (a group: 'admin' claim whose email is
   not allowlisted), and that non portal paths are never hub gated (the
   SITE gate already governs them). No dashes anywhere. */
import { decideHubAccess } from "./middleware.js";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const GROUP1_PATHS = ["/employer-dashboard.html", "/hse-portal.html", "/worker-dashboard.html"];
const GROUP2_PATHS = ["/clinical-dashboard.html", "/wcb-portal.html", "/sigma-portal.html"];
const ADMIN_PATHS = ["/admin-portal.html", "/admin-hub-users.html", "/admin-site-codes.html"];
const ADMIN_EMAIL = "gary@farmceuticawellness.com";

function session(email, group) { return { sub: "u1", email, group, iat: 0, exp: 9999999999 }; }

for (const p of [...GROUP1_PATHS, ...GROUP2_PATHS, ...ADMIN_PATHS]) {
  ok(p + " blocked with no session", decideHubAccess(p, null) === "blocked");
}

for (const p of GROUP1_PATHS) ok(p + " allowed for group1", decideHubAccess(p, session("e@x.com", "group1")) === "allow");
for (const p of GROUP2_PATHS) ok(p + " blocked for group1", decideHubAccess(p, session("e@x.com", "group1")) === "blocked");
for (const p of ADMIN_PATHS) ok(p + " blocked for group1", decideHubAccess(p, session("e@x.com", "group1")) === "blocked");

for (const p of GROUP2_PATHS) ok(p + " allowed for group2", decideHubAccess(p, session("e@x.com", "group2")) === "allow");
for (const p of GROUP1_PATHS) ok(p + " blocked for group2", decideHubAccess(p, session("e@x.com", "group2")) === "blocked");
for (const p of ADMIN_PATHS) ok(p + " blocked for group2", decideHubAccess(p, session("e@x.com", "group2")) === "blocked");

for (const p of [...GROUP1_PATHS, ...GROUP2_PATHS, ...ADMIN_PATHS]) {
  ok(p + " allowed for gary's admin session", decideHubAccess(p, session(ADMIN_EMAIL, "admin")) === "allow");
}

for (const p of ADMIN_PATHS) {
  ok(p + " blocked for a non allowlisted email even with group admin", decideHubAccess(p, session("nobody@example.com", "admin")) === "blocked");
}
for (const p of [...GROUP1_PATHS, ...GROUP2_PATHS]) {
  ok(p + " blocked for a non allowlisted admin claim email", decideHubAccess(p, session("nobody@example.com", "admin")) === "blocked");
}

for (const p of ["/hub", "/hub/", "/api/hub-signin", "/api/hub-signup", "/privacy", "/"]) {
  ok(p + " is not a hub gated path", decideHubAccess(p, null) === "allow");
}

console.log("\nhub-middleware-access suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
