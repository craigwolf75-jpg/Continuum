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
   an actual Vercel Edge deployment, which is not available yet. That
   includes whether Vercel's frameworkless Edge Middleware contract accepts a
   path relative x-middleware-rewrite value (used below) the same way it
   accepts an absolute one; CONFIRM ON FIRST PREVIEW DEPLOY.

   SECURITY FIX (post review): the matcher below used to exclude requests by
   file extension (.js, .css, .json, .map, .svg, and friends). That let
   gated static bundles (for example /hub/roles.js, /store.js, /config.js)
   bypass the middleware entirely, since the middleware function never even
   ran for them. The matcher now excludes ONLY the two paths that must never
   be intercepted (_next/static, _next/image); every other request, static
   asset or not, goes through decideSiteAccess, whose allowlist is the ONLY
   thing that can mark a path public. No dashes anywhere. */

import { verifySession, parseCookies } from "./api/_site_session.js";

// Vercel Edge Middleware matcher. Deliberately minimal: it excludes only the
// two paths Vercel itself expects to bypass this way (_next internals). It
// does NOT exclude by file extension. Every gated static bundle (roles.js,
// store.js, config.js, hub HTML, admin HTML, etc.) MUST pass through this
// middleware and be evaluated by decideSiteAccess; only decideSiteAccess's
// allowlist may mark a path public.
const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};

// Exact path matches that are always reachable without a ct_site cookie.
// Anything with a hyphen or other non boundary character right after a
// bounded prefix (see ALWAYS_PUBLIC_PREFIX below) belongs here instead of in
// the prefix list, so a real filename like continuum-logo-dark.svg does not
// force the prefix rule to also accept an attacker suffix like
// continuum-logo-evil.
const ALWAYS_PUBLIC_EXACT = new Set([
  "/privacy",
  "/privacy.html",
  "/terms",
  "/terms.html",
  "/robots.txt",
  "/sitemap.xml",
  "/api/site-access",
  "/continuum-logo-dark.svg",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png"
]);

// Bounded prefix matches: pathname must start with the prefix AND the
// character immediately after the prefix must be a real path boundary
// ("." starting an extension, "/" starting a subpath, or end of string),
// never an ordinary word character. This is what stops /continuum-logo from
// also matching /continuum-logout, and /og-image from also matching
// /og-image-x: in both bad cases the character right after the prefix is a
// letter (or a hyphen introducing a different token), not a boundary.
const ALWAYS_PUBLIC_BOUNDED_PREFIX = ["/favicon", "/og-image", "/continuum-logo"];

// Raw prefix match: "/gate/" already ends in "/", so the boundary is baked
// into the string itself; anything under it is the holding page or its
// assets. Path traversal into or through this prefix is blocked separately,
// before any allowlist check runs (see isSuspiciousPath below).
const ALWAYS_PUBLIC_RAW_PREFIX = ["/gate/"];

function isBoundedPrefixMatch(pathname, prefix) {
  if (!pathname.startsWith(prefix)) return false;
  const nextChar = pathname.charAt(prefix.length);
  return nextChar === "" || nextChar === "." || nextChar === "/";
}

// SECURITY FIX (post review, I3): reject any pathname carrying a directory
// traversal sequence, raw or percent encoded, BEFORE it is checked against
// the allowlist. Without this, a path like /gate/%2e%2e/admin-portal.html
// would pass the /gate/ prefix check here, and could then resolve (once let
// through) against a static file resolver that decodes %2e%2e back to ..
// and walks up out of /gate/ to a gated file. Suspicious paths are not
// specially blocked outright; they simply never qualify for the allowlist,
// so they fall through to the same holding-unless-cookie rule as any other
// gated path.
function isSuspiciousPath(pathname) {
  if (typeof pathname !== "string") return true;
  const lower = pathname.toLowerCase();
  return lower.includes("..") || lower.includes("%2e") || lower.includes("%2f") || lower.includes("%5c");
}

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
    !isSuspiciousPath(pathname) &&
    pathname !== "/" &&
    (ALWAYS_PUBLIC_EXACT.has(pathname) ||
      ALWAYS_PUBLIC_BOUNDED_PREFIX.some((p) => isBoundedPrefixMatch(pathname, p)) ||
      ALWAYS_PUBLIC_RAW_PREFIX.some((p) => pathname.startsWith(p)));

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
      return rewriteToHolding();
    }

    return passThrough();
  } catch (e) {
    // Fail closed on any unexpected error: show the holding page rather than
    // risk leaking a gated route.
    return rewriteToHolding();
  }
}

// Rewrites (not redirects) to the Layer 0 holding page: the browser URL bar
// stays on the originally requested path, and no gated asset is ever served
// under it. Uses the documented low level Vercel Edge Middleware contract
// (the x-middleware-rewrite response header) so this works without a
// framework specific helper like next/server's NextResponse.
//
// SECURITY FIX (post review, I4): the rewrite target is now the path
// "/gate/holding.html" rather than an absolute URL built from the incoming
// request, in case Vercel's frameworkless contract expects a path (an
// absolute URL built from attacker-influenced request data is also simply
// more surface than necessary for a fixed, known destination). UNTESTED
// pending an actual Vercel Edge deployment; see the file header. If a first
// preview deploy shows Vercel requires an absolute URL here instead, this is
// the line to change back.
function rewriteToHolding() {
  return new Response(null, {
    status: 200,
    headers: { "x-middleware-rewrite": "/gate/holding.html" }
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

export { config, decideSiteAccess, isSuspiciousPath, isBoundedPrefixMatch };
export default middleware;
