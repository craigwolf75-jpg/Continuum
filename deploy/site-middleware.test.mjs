/* Continuum Prompt 40 site middleware suite. node deploy/site-middleware.test.mjs
   Proves decideSiteAccess (deploy/middleware.js): the kill switch, the
   ALWAYS_PUBLIC allowlist, the special "/" case, and gated paths with and
   without a valid cookie.
   PENDING CREDS: this proves the pure decision function only. The default
   exported middleware(request) function, and the x-middleware-rewrite /
   x-middleware-next header contract it depends on to rewrite (not redirect)
   to the holding page, can only be proven inside an actual Vercel Edge
   deployment, which is not available yet.
   No dashes anywhere. */
import { decideSiteAccess } from "./middleware.js";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// -- kill switch: gate off allows everything, cookie or not --
ok("gate off allows / without a cookie", decideSiteAccess("/", false, "false") === "allow");
ok("gate off allows /hub without a cookie", decideSiteAccess("/hub", false, "false") === "allow");
ok("gate off allows /admin-portal without a cookie", decideSiteAccess("/admin-portal", false, "false") === "allow");
ok(
  "gate off allows /continuum_workflow_app without a cookie",
  decideSiteAccess("/continuum_workflow_app", false, "false") === "allow"
);

// -- ALWAYS_PUBLIC exact paths allow without a cookie (gate on) --
ok("/privacy allows without a cookie", decideSiteAccess("/privacy", false, undefined) === "allow");
ok("/terms allows without a cookie", decideSiteAccess("/terms", false, undefined) === "allow");
ok("/robots.txt allows without a cookie", decideSiteAccess("/robots.txt", false, undefined) === "allow");
ok("/sitemap.xml allows without a cookie", decideSiteAccess("/sitemap.xml", false, undefined) === "allow");
ok("/api/site-access allows without a cookie", decideSiteAccess("/api/site-access", false, undefined) === "allow");

// -- ALWAYS_PUBLIC prefix paths allow without a cookie (gate on) --
ok("/favicon.ico allows without a cookie", decideSiteAccess("/favicon.ico", false, undefined) === "allow");
ok("/favicon-32x32.png allows without a cookie", decideSiteAccess("/favicon-32x32.png", false, undefined) === "allow");
ok("/og-image.png allows without a cookie", decideSiteAccess("/og-image.png", false, undefined) === "allow");
ok("/continuum-logo.svg allows without a cookie", decideSiteAccess("/continuum-logo.svg", false, undefined) === "allow");
ok("/continuum-logo-dark.svg allows without a cookie", decideSiteAccess("/continuum-logo-dark.svg", false, undefined) === "allow");
ok("/gate/holding.html allows without a cookie", decideSiteAccess("/gate/holding.html", false, undefined) === "allow");
ok("/gate/some-asset.css allows without a cookie", decideSiteAccess("/gate/some-asset.css", false, undefined) === "allow");

// -- "/" is special: it is NOT in ALWAYS_PUBLIC, it holds without a cookie
// and allows with one, same as any other gated path --
ok("/ without a cookie holds", decideSiteAccess("/", false, undefined) === "holding");
ok("/ with a valid cookie allows", decideSiteAccess("/", true, undefined) === "allow");

// -- ordinary gated paths hold without a cookie, allow with a valid one --
for (const gatedPath of ["/hub", "/admin-portal", "/continuum_workflow_app"]) {
  ok(gatedPath + " without a cookie holds", decideSiteAccess(gatedPath, false, undefined) === "holding");
  ok(gatedPath + " with a valid cookie allows", decideSiteAccess(gatedPath, true, undefined) === "allow");
}

// -- the kill switch only fires on the exact string "false"; any other
// gateEnabledEnv value (including unset) keeps the gate on, the secure
// default --
ok('gateEnabledEnv "true" still gates /hub', decideSiteAccess("/hub", false, "true") === "holding");
ok("gateEnabledEnv unset still gates /hub", decideSiteAccess("/hub", false, undefined) === "holding");
ok('gateEnabledEnv "" still gates /hub', decideSiteAccess("/hub", false, "") === "holding");

console.log("\nsite-middleware suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
