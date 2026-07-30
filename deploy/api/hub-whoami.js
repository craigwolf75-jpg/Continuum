/* Continuum Hub whoami endpoint. Vercel Node.js serverless function at
   /api/hub-whoami. GET reads the caller's own ct_session cookie and reports
   its verified identity, or a plain deny if there is none.

   Response contract mirrors deploy/api/hub-signin.js's neutral shapes: a
   valid session is 200 { ok:true, email, group } straight from the verified
   payload; anything else (no cookie, a tampered token, an expired token) is
   a neutral 401 { ok:false }, never distinguishing which. Missing
   CONTINUUM_HUB_SESSION_SECRET fails closed with 503, same as
   deploy/api/hub-signin.js and deploy/api/site-access.js do for their own
   missing config. This endpoint never issues or refreshes a cookie: reading
   identity is a pure read of the existing session, not a session mutation.

   group is reported straight from the verified payload, not recomputed:
   isAuthorizedAdmin (deploy/api/_hub_session.js) is a forward hook that
   fails OPEN on a session with no email claim, which is the wrong shape for
   a read that a caller may use to decide what to render; a caller that
   wants to know if this is the admin can compare group === 'admin' itself.

   HARD WALL vs the SITE gate: only ever reads ct_session, via
   deploy/api/_hub_session.js's parseCookies/verifyHubSession, using
   CONTINUUM_HUB_SESSION_SECRET. Never reads or writes ct_site or the site
   gate's secret. No dashes anywhere. */

import { verifyHubSession, parseCookies, HUB_COOKIE_NAME } from "./_hub_session.js";

async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.status(405).json({ ok: false, error: "method not allowed" });
      return;
    }

    const secret = process.env.CONTINUUM_HUB_SESSION_SECRET;
    if (!secret) {
      res.status(503).json({ ok: false, error: "hub whoami not configured" });
      return;
    }

    const cookieHeader = req.headers && (req.headers.cookie || req.headers.Cookie);
    const cookies = parseCookies(typeof cookieHeader === "string" ? cookieHeader : "");
    const token = cookies[HUB_COOKIE_NAME];

    if (!token) {
      res.status(401).json({ ok: false });
      return;
    }

    const payload = await verifyHubSession(token, secret);
    if (!payload) {
      res.status(401).json({ ok: false });
      return;
    }

    res.status(200).json({ ok: true, email: payload.email, group: payload.group });
  } catch (e) {
    res.status(503).json({ ok: false, error: "hub whoami error" });
  }
}

export default handler;
