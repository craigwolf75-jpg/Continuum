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

// -- C1: path normalization defense, mirroring the SITE gate's
//    isSuspiciousPath. A group1 session must never reach a group2 or admin
//    portal via an encoded or traversal path, and a suspicious path is
//    blocked outright before any prefix check runs, even off a portal path
//    entirely. --
const GROUP1_SESSION = session("e@x.com", "group1");

ok("/clinical-dashboard%2ehtml blocked for group1 (encoded dot traversal)", decideHubAccess("/clinical-dashboard%2ehtml", GROUP1_SESSION) === "blocked");
ok("/employer-dashboard/..%2fclinical-dashboard.html blocked for group1 (traversal out of own prefix)", decideHubAccess("/employer-dashboard/..%2fclinical-dashboard.html", GROUP1_SESSION) === "blocked");
ok("/admin-portal%2ehtml blocked for group1 (encoded dot into admin)", decideHubAccess("/admin-portal%2ehtml", GROUP1_SESSION) === "blocked");
ok("/CLINICAL-dashboard.html blocked for group1 (case variant still gated)", decideHubAccess("/CLINICAL-dashboard.html", GROUP1_SESSION) === "blocked");
ok("/%2e%2e/secret blocked outright (suspicious, non portal path)", decideHubAccess("/%2e%2e/secret", GROUP1_SESSION) === "blocked");
ok("/%2e%2e/secret blocked outright even with no session at all", decideHubAccess("/%2e%2e/secret", null) === "blocked");

// -- clean path assertions still pass after the C1 change (case normalized
//    matching does not break the legitimate lowercase paths) --
for (const p of GROUP1_PATHS) ok(p + " still allowed for group1 after C1", decideHubAccess(p, GROUP1_SESSION) === "allow");
ok("/CLINICAL-dashboard.html allowed for a group2 session (case variant still matches its own prefix)", decideHubAccess("/CLINICAL-dashboard.html", session("e@x.com", "group2")) === "allow");

console.log("\nhub-middleware-access suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
