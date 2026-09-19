/* Continuum Prompt 40 site middleware suite. node deploy/site-middleware.test.mjs
   Proves decideSiteAccess (deploy/middleware.js): the kill switch, the
   ALWAYS_PUBLIC allowlist, the public landing / and /index.html, gated paths with and
   without a valid cookie, and (post security review) that gated static
   bundles are never exempted by file extension, that the public allowlist
   uses bounded matches instead of loose prefixes, and that path traversal
   sequences never qualify for the allowlist.
   PENDING CREDS: holding page rewrites still depend on the Vercel Edge
   rewrite contract. The JSON site_access_required path on POST
   /api/hub-signin and /api/hub-signup is proven here by calling middleware.
   No dashes anywhere. */
import middleware, { decideSiteAccess, isSuspiciousPath, isBoundedPrefixMatch, decideHubAccess, isHubAuthApiPath } from "./middleware.js";
import { issueSiteCookie, parseCookies } from "./api/_site_session.js";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// -- kill switch: gate off allows everything, cookie or not --
ok("gate off allows / without a cookie", decideSiteAccess("/", false, "false") === "allow");
ok("gate off allows /hub without a cookie", decideSiteAccess("/hub", false, "false") === "allow");
ok("gate off allows /admin-portal without a cookie", decideSiteAccess("/admin-portal", false, "false") === "allow");
ok(
  "gate off allows /demo without a cookie",
  decideSiteAccess("/demo", false, "false") === "allow"
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
ok("/book allows without a cookie (access-request page)", decideSiteAccess("/book", false, undefined) === "allow");
ok("/book.html allows without a cookie", decideSiteAccess("/book.html", false, undefined) === "allow");
ok("/continuum-vars.css allows without a cookie", decideSiteAccess("/continuum-vars.css", false, undefined) === "allow");
ok("/continuum_tokens.css allows without a cookie", decideSiteAccess("/continuum_tokens.css", false, undefined) === "allow");
ok("/legal-config.js allows without a cookie", decideSiteAccess("/legal-config.js", false, undefined) === "allow");
ok("/worker allows without a cookie (live worker sign in and sign up)", decideSiteAccess("/worker", false, undefined) === "allow");
ok("/worker/login.html allows without a cookie", decideSiteAccess("/worker/login.html", false, undefined) === "allow");

// -- ALWAYS_PUBLIC prefix and exact asset paths allow without a cookie --
ok("/favicon.ico allows without a cookie", decideSiteAccess("/favicon.ico", false, undefined) === "allow");
ok("/favicon-32x32.png without a cookie holds (missing PNG, hyphen is not a /favicon boundary)", decideSiteAccess("/favicon-32x32.png", false, undefined) === "holding");
ok("/favicon-16x16.png without a cookie holds (missing PNG, hyphen is not a /favicon boundary)", decideSiteAccess("/favicon-16x16.png", false, undefined) === "holding");
ok("/apple-touch-icon.png without a cookie holds (missing file, not on exact allowlist)", decideSiteAccess("/apple-touch-icon.png", false, undefined) === "holding");
ok("/og-image.png allows without a cookie", decideSiteAccess("/og-image.png", false, undefined) === "allow");
ok("/continuum-logo.svg allows without a cookie", decideSiteAccess("/continuum-logo.svg", false, undefined) === "allow");
ok("/continuum-logo-dark.svg allows without a cookie", decideSiteAccess("/continuum-logo-dark.svg", false, undefined) === "allow");
ok("/gate/holding.html allows without a cookie", decideSiteAccess("/gate/holding.html", false, undefined) === "allow");
ok("/gate/some-asset.css allows without a cookie", decideSiteAccess("/gate/some-asset.css", false, undefined) === "allow");

// -- Prompt 67: the landing ("/" and "/index.html") is PUBLIC again
// (Craig named gate holds lifted 2026-09-19). No cookie allows through.
// A valid cookie still allows. Access code stays on the holding page,
// reached via gated paths such as Sign In /hub. --
ok("/ without a cookie allows (public landing)", decideSiteAccess("/", false, undefined) === "allow");
ok("/ with a valid cookie allows", decideSiteAccess("/", true, undefined) === "allow");
ok("/index.html without a cookie allows (public landing)", decideSiteAccess("/index.html", false, undefined) === "allow");
ok("/index.html with a valid cookie allows", decideSiteAccess("/index.html", true, undefined) === "allow");

// -- Prompt 67: the public assessment and its shared script deps allow without
// a cookie. --
ok("/assessment without a cookie allows", decideSiteAccess("/assessment", false, undefined) === "allow");
ok("/assessment/ without a cookie allows", decideSiteAccess("/assessment/", false, undefined) === "allow");
ok("/assessment/assessment.js without a cookie allows", decideSiteAccess("/assessment/assessment.js", false, undefined) === "allow");
ok("/assessment/config/crs-1.1.js without a cookie allows", decideSiteAccess("/assessment/config/crs-1.1.js", false, undefined) === "allow");
ok("/supabase.js without a cookie allows (assessment dep)", decideSiteAccess("/supabase.js", false, undefined) === "allow");
ok("/site-links.js without a cookie allows (assessment dep)", decideSiteAccess("/site-links.js", false, undefined) === "allow");

// -- Prompt 67 must NOT open the portals or the hub sign in. --
for (const stillGated of ["/hse-portal", "/employer-dashboard", "/clinical-dashboard", "/wcb-portal", "/sigma-portal", "/sigma-panel", "/sigma-crtw-connection", "/admin-portal", "/admin-hub-users", "/admin-site-codes", "/worker-dashboard"]) {
  ok(stillGated + " without a cookie still holds (portal stays gated, Prompt 67)", decideSiteAccess(stillGated, false, undefined) === "holding");
}

// -- ordinary gated paths hold without a cookie, allow with a valid one --
for (const gatedPath of ["/hub", "/admin-portal", "/demo"]) {
  ok(gatedPath + " without a cookie holds", decideSiteAccess(gatedPath, false, undefined) === "holding");
  ok(gatedPath + " with a valid cookie allows", decideSiteAccess(gatedPath, true, undefined) === "allow");
}

// -- Prompt 40 hygiene fix regression: /admin-portal.html (a real gated
// page, unlike the allowlisted /privacy.html and /terms.html) is still held
// without a cookie, confirming the new exact allowlist entries above did
// not accidentally widen into a broader prefix. --
ok("/admin-portal.html without a cookie still holds", decideSiteAccess("/admin-portal.html", false, undefined) === "holding");
ok("/admin-portal.html with a valid cookie allows", decideSiteAccess("/admin-portal.html", true, undefined) === "allow");
ok("/sigma-panel.html without a cookie still holds", decideSiteAccess("/sigma-panel.html", false, undefined) === "holding");
ok("/sigma-panel.html with a valid cookie allows", decideSiteAccess("/sigma-panel.html", true, undefined) === "allow");
ok("/sigma-crtw-connection.html without a cookie still holds", decideSiteAccess("/sigma-crtw-connection.html", false, undefined) === "holding");
ok("/sigma-crtw-connection.html with a valid cookie allows", decideSiteAccess("/sigma-crtw-connection.html", true, undefined) === "allow");

// -- PATH-006: SIGMA sibling surfaces join the same hub Group 2 family as
// /sigma-portal. No session and group1 are blocked; group2 is allowed.
// /sigma-portal.html is the control in the same loop. --
const PATH006_GROUP2 = { sub: "u1", email: "e@x.com", group: "group2", iat: 0, exp: 9999999999 };
const PATH006_GROUP1 = { sub: "u1", email: "e@x.com", group: "group1", iat: 0, exp: 9999999999 };
for (const path of ["/sigma-portal.html", "/sigma-panel.html", "/sigma-crtw-connection.html"]) {
  ok(path + " hub blocked with no session (PATH-006)", decideHubAccess(path, null) === "blocked");
  ok(path + " hub allowed for group2 (PATH-006)", decideHubAccess(path, PATH006_GROUP2) === "allow");
  ok(path + " hub blocked for group1 (PATH-006)", decideHubAccess(path, PATH006_GROUP1) === "blocked");
}

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
ok("/config.js without a cookie allows (public assessment dep, Prompt 67)", decideSiteAccess("/config.js", false, undefined) === "allow");
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

// -- SB-005: production and default hard-404 /api/test; not on ALWAYS_PUBLIC.
ok("/api/test/reset without cookie on default is not_found", decideSiteAccess("/api/test/reset", false, undefined) === "not_found");
ok("/api/test/reset without cookie on production is not_found", decideSiteAccess("/api/test/reset", false, undefined, "production") === "not_found");
ok("/api/test/reset without cookie on default is never allow", decideSiteAccess("/api/test/reset", false, undefined) !== "allow");
ok("/api/test/reset without cookie on production is never allow", decideSiteAccess("/api/test/reset", false, undefined, "production") !== "allow");
ok("/api/test/other without cookie on default is not_found", decideSiteAccess("/api/test/other", false, undefined) === "not_found");
ok("/api/test/reset with cookie on default is not_found", decideSiteAccess("/api/test/reset", true, undefined) === "not_found");
ok("/api/test/reset with cookie on production is not_found", decideSiteAccess("/api/test/reset", true, undefined, "production") === "not_found");
ok("/api/test/other with cookie on default is not_found", decideSiteAccess("/api/test/other", true, undefined) === "not_found");
ok("/api/test/other with cookie on production is not_found", decideSiteAccess("/api/test/other", true, undefined, "production") === "not_found");
ok("/api/testing without cookie on default still holds (not swallowed by /api/test)", decideSiteAccess("/api/testing", false, undefined) === "holding");
ok("/api/test-foo without cookie on default still holds (hyphen is not a /api/test boundary)", decideSiteAccess("/api/test-foo", false, undefined) === "holding");
ok("/api/test/reset without cookie on preview holds", decideSiteAccess("/api/test/reset", false, undefined, "preview") === "holding");
ok("/api/test/reset with cookie on preview allows", decideSiteAccess("/api/test/reset", true, undefined, "preview") === "allow");
ok('kill switch "false" on preview allows /api/test/reset', decideSiteAccess("/api/test/reset", false, "false", "preview") === "allow");
ok('kill switch "false" on production still not_found for /api/test/reset', decideSiteAccess("/api/test/reset", false, "false", "production") === "not_found");
ok('kill switch "false" on default still not_found for /api/test/reset', decideSiteAccess("/api/test/reset", false, "false") === "not_found");

// -- Hub auth APIs stay SITE gated: missing ct_site is site_access_required,
//    never allow, and never a holding rewrite that would 405 a POST. --
ok("isHubAuthApiPath matches /api/hub-signin", isHubAuthApiPath("/api/hub-signin") === true);
ok("isHubAuthApiPath matches /api/hub-signup", isHubAuthApiPath("/api/hub-signup") === true);
ok("isHubAuthApiPath matches a trailing slash", isHubAuthApiPath("/api/hub-signin/") === true);
ok("isHubAuthApiPath rejects a suffix ride", isHubAuthApiPath("/api/hub-signin-foo") === false);
ok("isHubAuthApiPath rejects /api/hub-whoami", isHubAuthApiPath("/api/hub-whoami") === false);
ok("/api/hub-signin without a cookie is site_access_required, not allow", decideSiteAccess("/api/hub-signin", false, undefined) === "site_access_required");
ok("/api/hub-signup without a cookie is site_access_required, not allow", decideSiteAccess("/api/hub-signup", false, undefined) === "site_access_required");
ok("/api/hub-signin without a cookie is never allow", decideSiteAccess("/api/hub-signin", false, undefined) !== "allow");
ok("/api/hub-signin without a cookie is never holding (JSON, not HTML rewrite)", decideSiteAccess("/api/hub-signin", false, undefined) !== "holding");
ok("/api/hub-signin/ without a cookie is site_access_required", decideSiteAccess("/api/hub-signin/", false, undefined) === "site_access_required");
ok("/API/hub-signin without a cookie is site_access_required", decideSiteAccess("/API/hub-signin", false, undefined) === "site_access_required");
ok("/api/hub-signin with a valid cookie allows", decideSiteAccess("/api/hub-signin", true, undefined) === "allow");
ok("/api/hub-signup with a valid cookie allows", decideSiteAccess("/api/hub-signup", true, undefined) === "allow");
ok("/api/hub-signin-foo without a cookie still holds (not swallowed)", decideSiteAccess("/api/hub-signin-foo", false, undefined) === "holding");
ok("/api/hub-whoami without a cookie still holds (other APIs stay gated)", decideSiteAccess("/api/hub-whoami", false, undefined) === "holding");
ok('kill switch "false" still allows /api/hub-signin without a cookie', decideSiteAccess("/api/hub-signin", false, "false") === "allow");

async function assertHubAuthJsonDeny(pathname, cookieHeader) {
  const headers = { "content-type": "application/json" };
  if (cookieHeader) headers.cookie = cookieHeader;
  const res = await middleware(new Request("https://continuumrtw.com" + pathname, {
    method: "POST",
    headers,
    body: "{}"
  }));
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch (e) { body = null; }
  const label = pathname + (cookieHeader ? " invalid cookie" : " missing cookie");
  ok(label + " middleware status is 403, not 405", res.status === 403 && res.status !== 405);
  ok(label + " middleware content-type is JSON", (res.headers.get("content-type") || "").indexOf("application/json") !== -1);
  ok(label + " middleware body is not HTML", text.indexOf("<") === -1);
  ok(label + " middleware code is SITE_ACCESS_REQUIRED", body && body.code === "SITE_ACCESS_REQUIRED");
  ok(label + " middleware error is the site access string", body && body.error === "Site access required. Unlock the site then try again.");
  ok(label + " middleware ok is false", body && body.ok === false);
  ok(label + " middleware errors[0] matches error", body && Array.isArray(body.errors) && body.errors[0] === body.error);
}

const prevGate = process.env.SITE_GATE_ENABLED;
const prevSecret = process.env.CONTINUUM_SITE_SESSION_SECRET;
const prevVercel = process.env.VERCEL_ENV;
try {
  delete process.env.SITE_GATE_ENABLED;
  delete process.env.VERCEL_ENV;
  delete process.env.CONTINUUM_SITE_SESSION_SECRET;

  await assertHubAuthJsonDeny("/api/hub-signin");
  await assertHubAuthJsonDeny("/api/hub-signup");

  process.env.CONTINUUM_SITE_SESSION_SECRET = "site-middleware-hub-auth-test-secret";
  await assertHubAuthJsonDeny("/api/hub-signin", "ct_site=not-a-valid-token");
  await assertHubAuthJsonDeny("/api/hub-signup", "ct_site=not-a-valid-token");

  const issued = await issueSiteCookie(process.env.CONTINUUM_SITE_SESSION_SECRET, Math.floor(Date.now() / 1000));
  const validToken = parseCookies(issued).ct_site;
  const allowed = await middleware(new Request("https://continuumrtw.com/api/hub-signin", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: "ct_site=" + validToken },
    body: "{}"
  }));
  ok("valid ct_site on /api/hub-signin is not SITE_ACCESS_REQUIRED", allowed.status !== 403);
  ok("valid ct_site on /api/hub-signin is not 405", allowed.status !== 405);
} finally {
  if (prevGate === undefined) delete process.env.SITE_GATE_ENABLED;
  else process.env.SITE_GATE_ENABLED = prevGate;
  if (prevSecret === undefined) delete process.env.CONTINUUM_SITE_SESSION_SECRET;
  else process.env.CONTINUUM_SITE_SESSION_SECRET = prevSecret;
  if (prevVercel === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = prevVercel;
}

console.log("\nsite-middleware suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
