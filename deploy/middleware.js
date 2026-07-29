/* Continuum Prompt 40 SITE gate edge middleware. Vercel Edge Middleware
   (Edge runtime: Web APIs only, no node built ins). Verifies the ct_site
   cookie LOCALLY via HMAC (no database call happens here); only the code
   entry endpoint (deploy/api/site-access.js) touches Supabase.

   HARD WALL vs the Prompt 39 hub gate: this file reads and writes ONLY the
   ct_site cookie, verified with ONLY CONTINUUM_SITE_SESSION_SECRET. It never
   reads, sets, or references ct_session (the hub gate's cookie) or the hub
   gate's secret.

   PENDING CREDS: decideSiteAccess is pure and is unit tested directly
   (deploy/site-middleware.test.mjs). The default export below, and the
   x-middleware-rewrite / x-middleware-next header contract it relies on to
   rewrite to the holding page without a redirect, can only be proven inside
   an actual Vercel Edge deployment, which is not available yet.

   No dashes anywhere. */

import { verifySession, parseCookies } from "./api/_site_session.js";

// Vercel Edge Middleware matcher: this is a hard, build time exclusion so the
// middleware function does not even run for literal static asset requests
// (fonts, images, _next internals). It is intentionally broader than the
// ALWAYS_PUBLIC allowlist below: paths like /gate/ and /api/site-access still
// pass through the matcher and are handled by decideSiteAccess instead, since
// they are ordinary routes, not static files.
const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|mjs|map|woff|woff2|ttf|mp4|txt|xml|json)$).*)"
  ]
};

// Exact path matches that are always reachable without a ct_site cookie.
const ALWAYS_PUBLIC_EXACT = new Set([
  "/privacy",
  "/terms",
  "/robots.txt",
  "/sitemap.xml",
  "/api/site-access"
]);

// Prefix matches that are always reachable without a ct_site cookie. "/" is
// deliberately NOT here: it is handled as a normal gated path below (holding
// unless a valid cookie is present), it is just called out separately in the
// spec because it is the path most people will hit first.
const ALWAYS_PUBLIC_PREFIX = [
  "/favicon",
  "/og-image",
  "/continuum-logo",
  "/gate/"
];

// Pure decision function: no I/O, no crypto, no globals. Given a pathname, a
// pre computed "is the cookie valid" boolean, and the raw SITE_GATE_ENABLED
// env string, decide whether the request should be allowed through or shown
// the holding page. Fully unit testable in plain node.
function decideSiteAccess(pathname, hasValidCookie, gateEnabledEnv) {
  // kill switch: the literal string "false" disables the gate entirely,
  // regardless of cookie state. Any other value (including unset) keeps the
  // gate on, so the secure default is ON, not OFF.
  if (gateEnabledEnv === "false") return "allow";

  const isAlwaysPublic =
    pathname !== "/" &&
    (ALWAYS_PUBLIC_EXACT.has(pathname) || ALWAYS_PUBLIC_PREFIX.some((p) => pathname.startsWith(p)));

  if (isAlwaysPublic) return "allow";

  return hasValidCookie ? "allow" : "holding";
}

async function middleware(request) {
  const url = new URL(request.url);
  try {
    const cookieHeader = request.headers.get("cookie");
    const cookies = parseCookies(cookieHeader);
    const token = cookies.ct_site;

    // process.env in Vercel Edge Middleware exposes only the configured
    // project env vars; this is edge safe.
    const secret = typeof process !== "undefined" && process.env ? process.env.CONTINUUM_SITE_SESSION_SECRET : undefined;
    const gateEnabledEnv = typeof process !== "undefined" && process.env ? process.env.SITE_GATE_ENABLED : undefined;

    let hasValidCookie = false;
    // Fail closed: with no secret configured, no cookie can ever verify, so
    // every gated path falls through to holding rather than being let
    // through by accident.
    if (token && secret) {
      const nowSec = Math.floor(Date.now() / 1000);
      const payload = await verifySession(token, secret, nowSec);
      hasValidCookie = payload !== null;
    }

    const decision = decideSiteAccess(url.pathname, hasValidCookie, gateEnabledEnv);

    if (decision === "holding") {
      return rewriteToHolding(url);
    }

    return passThrough();
  } catch (e) {
    // Fail closed on any unexpected error: show the holding page rather than
    // risk leaking a gated route.
    return rewriteToHolding(url);
  }
}

// Rewrites (not redirects) to the Layer 0 holding page: the browser URL bar
// stays on the originally requested path, and no gated asset is ever served
// under it. Uses the documented low level Vercel Edge Middleware contract
// (the x-middleware-rewrite response header) so this works without a
// framework specific helper like next/server's NextResponse. UNTESTED
// pending an actual Vercel Edge deployment; see the file header.
function rewriteToHolding(requestUrl) {
  const holdingUrl = new URL("/gate/holding.html", requestUrl);
  return new Response(null, {
    status: 200,
    headers: { "x-middleware-rewrite": holdingUrl.toString() }
  });
}

// Lets the request continue to its originally requested destination.
// UNTESTED pending an actual Vercel Edge deployment; see the file header.
function passThrough() {
  return new Response(null, {
    status: 200,
    headers: { "x-middleware-next": "1" }
  });
}

export { config, decideSiteAccess };
export default middleware;
