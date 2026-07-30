/* Continuum Hub sign out endpoint. Vercel Node.js serverless function at
   /api/hub-signout. POST clears the ct_session cookie. No Supabase call: a
   sign out is a pure local cookie clear; a replayed token (if one somehow
   survived) simply expires naturally at its own exp.

   isCrossSiteRequest runs before anything else so a cross site page cannot
   force a visitor's hub session closed; copied verbatim (by convention, no
   shared helper import between these API files) from
   deploy/api/site-access.js / deploy/api/hub-signin.js.

   Idempotent: clears the cookie the same way whether or not one was present
   on the request, so this is safe to call from a page that is not sure
   whether the visitor is currently signed in.

   HARD WALL vs the SITE gate: only ever touches ct_session, via
   deploy/api/_hub_session.js's clearHubCookie. Never reads or writes
   ct_site. No dashes anywhere. */

import { clearHubCookie } from "./_hub_session.js";

function isCrossSiteRequest(req) {
  const headers = (req && req.headers) || {};
  const secFetchSite = headers["sec-fetch-site"];
  if (typeof secFetchSite === "string" && secFetchSite.toLowerCase() === "cross-site") return true;
  const origin = headers["origin"];
  const host = headers["host"];
  if (typeof origin === "string" && origin && typeof host === "string" && host) {
    try {
      const originHost = new URL(origin).host.toLowerCase();
      if (originHost !== host.toLowerCase()) return true;
    } catch (e) {
      return true;
    }
  }
  return false;
}

async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "method not allowed" });
      return;
    }
    if (isCrossSiteRequest(req)) {
      res.status(403).json({ ok: false, error: "cross site request rejected" });
      return;
    }
    res.setHeader("set-cookie", clearHubCookie());
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(503).json({ ok: false, error: "hub signout error" });
  }
}

export { isCrossSiteRequest };
export default handler;
