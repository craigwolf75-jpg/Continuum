/* Continuum Prompt 40 site middleware suite. node deploy/site-middleware.test.mjs
   Proves decideSiteAccess (deploy/middleware.js): the kill switch, the
   ALWAYS_PUBLIC allowlist, the special "/" case, gated paths with and
   without a valid cookie, and (post security review) that gated static
   bundles are never exempted by file extension, that the public allowlist
   uses bounded matches instead of loose prefixes, and that path traversal
   sequences never qualify for the allowlist.
   PENDING CREDS: this proves the pure decision function only. The default
   exported middleware(request) function, and the x-middleware-rewrite /
   x-middleware-next header contract it depends on to rewrite (not redirect)
   to the holding page, can only be proven inside an actual Vercel Edge
   deployment, which is not available yet.
   No dashes anywhere. */
import { decideSiteAccess, isSuspiciousPath, isBoundedPrefixMatch } from "./middleware.js";

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
// -- Prompt 40 hygiene fix: privacy.html and terms.html footers link to the
// literal ./privacy.html and ./terms.html paths, which resolve to
// /privacy.html and /terms.html, not /privacy and /terms. Both must be
// allowlisted exactly, same as the extensionless paths, or those footer
// links hold under the gate. --
ok("/privacy.html allows without a cookie", decideSiteAccess("/privacy.html", false, undefined) === "allow");
ok("/terms.html allows without a cookie", decideSiteAccess("/terms.html", false, undefined) === "allow");
ok("/robots.txt allows without a cookie", decideSiteAccess("/robots.txt", false, undefined) === "allow");
ok("/sitemap.xml allows without a cookie", decideSiteAccess("/sitemap.xml", false, undefined) === "allow");
ok("/api/site-access allows without a cookie", decideSiteAccess("/api/site-access", false, undefined) === "allow");
ok("/api/marketing-lead allows without a cookie (lead form posts from the gate)", decideSiteAccess("/api/marketing-lead", false, undefined) === "allow");

// -- ALWAYS_PUBLIC prefix and exact asset paths allow without a cookie --
ok("/favicon.ico allows without a cookie", decideSiteAccess("/favicon.ico", false, undefined) === "allow");
ok("/favicon-32x32.png allows without a cookie", decideSiteAccess("/favicon-32x32.png", false, undefined) === "allow");
ok("/favicon-16x16.png allows without a cookie", decideSiteAccess("/favicon-16x16.png", false, undefined) === "allow");
ok("/apple-touch-icon.png allows without a cookie", decideSiteAccess("/apple-touch-icon.png", false, undefined) === "allow");
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

// -- Prompt 40 hygiene fix regression: /admin-portal.html (a real gated
// page, unlike the allowlisted /privacy.html and /terms.html) is still held
// without a cookie, confirming the new exact allowlist entries above did
// not accidentally widen into a broader prefix. --
ok("/admin-portal.html without a cookie still holds", decideSiteAccess("/admin-portal.html", false, undefined) === "holding");
ok("/admin-portal.html with a valid cookie allows", decideSiteAccess("/admin-portal.html", true, undefined) === "allow");

// -- the kill switch only fires on the exact string "false"; any other
// gateEnabledEnv value (including unset) keeps the gate on, the secure
// default --
ok('gateEnabledEnv "true" still gates /hub', decideSiteAccess("/hub", false, "true") === "holding");
ok("gateEnabledEnv unset still gates /hub", decideSiteAccess("/hub", false, undefined) === "holding");
ok('gateEnabledEnv "" still gates /hub', decideSiteAccess("/hub", false, "") === "holding");

// -- C1 regression: gated static bundles are never exempted by extension.
// The matcher used to exclude .js/.css/.json/.map/.svg etc, letting these
// through without ever reaching decideSiteAccess at all. Now the matcher
// only excludes _next internals, so these paths reach decideSiteAccess, and
// decideSiteAccess itself must hold them (they are not on the allowlist). --
ok("/hub/roles.js without a cookie holds (gated bundle, not exempted by extension)", decideSiteAccess("/hub/roles.js", false, undefined) === "holding");
ok("/store.js without a cookie holds (gated bundle, not exempted by extension)", decideSiteAccess("/store.js", false, undefined) === "holding");
ok("/config.js without a cookie holds (gated bundle, not exempted by extension)", decideSiteAccess("/config.js", false, undefined) === "holding");
ok("/hub/roles.js with a valid cookie allows", decideSiteAccess("/hub/roles.js", true, undefined) === "allow");
ok("/store.js with a valid cookie allows", decideSiteAccess("/store.js", true, undefined) === "allow");
ok("/config.js with a valid cookie allows", decideSiteAccess("/config.js", true, undefined) === "allow");

// -- M1 regression: bounded prefix matches do not swallow neighboring words.
// /continuum-logo must not also match /continuum-logout, and /og-image must
// not also match /og-image-x, /favicon must not also match /faviconEXTRA. --
ok("/continuum-logout without a cookie holds (not swallowed by /continuum-logo)", decideSiteAccess("/continuum-logout", false, undefined) === "holding");
ok("/og-image-x.png without a cookie holds (not swallowed by /og-image)", decideSiteAccess("/og-image-x.png", false, undefined) === "holding");
ok("/faviconEXTRA.js without a cookie holds (not swallowed by /favicon)", decideSiteAccess("/faviconEXTRA.js", false, undefined) === "holding");
ok(
  "isBoundedPrefixMatch rejects a same prefix word continuation",
  isBoundedPrefixMatch("/continuum-logout", "/continuum-logo") === false
);
ok(
  "isBoundedPrefixMatch accepts a dot boundary",
  isBoundedPrefixMatch("/continuum-logo.svg", "/continuum-logo") === true
);
ok(
  "isBoundedPrefixMatch accepts a slash boundary",
  isBoundedPrefixMatch("/gate/holding.html", "/gate") === true
);
ok(
  "isBoundedPrefixMatch accepts an exact end of string boundary",
  isBoundedPrefixMatch("/favicon", "/favicon") === true
);

// -- I3 regression: path traversal sequences never qualify for the
// allowlist, raw or percent encoded, so a crafted path cannot ride the
// /gate/ prefix out to a gated file. --
ok("isSuspiciousPath flags a raw .. segment", isSuspiciousPath("/gate/../admin-portal.html") === true);
ok("isSuspiciousPath flags a lowercase %2e%2e sequence", isSuspiciousPath("/gate/%2e%2e/admin-portal.html") === true);
ok("isSuspiciousPath flags an uppercase %2E%2E sequence", isSuspiciousPath("/gate/%2E%2E/admin-portal.html") === true);
ok("isSuspiciousPath flags an encoded forward slash %2f", isSuspiciousPath("/gate%2fadmin-portal.html") === true);
ok("isSuspiciousPath flags an encoded backslash %5c", isSuspiciousPath("/gate%5c..%5cadmin-portal.html") === true);
ok("isSuspiciousPath does not flag an ordinary /gate/ asset path", isSuspiciousPath("/gate/holding.html") === false);
ok(
  "a /gate/ path carrying .. holds without a cookie, it does not ride the /gate/ prefix out",
  decideSiteAccess("/gate/%2e%2e/admin-portal.html", false, undefined) === "holding"
);
ok(
  "the same traversal path is not specially blocked when a valid cookie is present (ordinary gated path rule applies)",
  decideSiteAccess("/gate/%2e%2e/admin-portal.html", true, undefined) === "allow"
);

console.log("\nsite-middleware suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
