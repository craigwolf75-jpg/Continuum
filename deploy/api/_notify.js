/* Continuum Hub signup notification. Best effort email to the admin inbox
   (SIGNUP_NOTIFY_TO, normally info@continuumrtw.com) whenever a new hub
   account is created, so a human knows to approve it in /admin-hub-users.

   Server side only: RESEND_API_KEY is never exposed to the browser. Sent
   through Resend's transactional API (a single fetch), matching the zero SDK,
   plain fetch() pattern the rest of deploy/api uses.

   GATED BEHIND ENV: if RESEND_API_KEY or SIGNUP_NOTIFY_TO is unset this is a
   silent no op and makes NO network call, so shipping it changes nothing in
   production until the Resend key and the info@ inbox are wired at launch.

   BEST EFFORT: never throws and never blocks signup. A missing config, a non
   2xx Resend status, or a network error all surface as a typed
   { sent: false, reason } result the caller is free to ignore. The signup
   still succeeds regardless. No dashes anywhere. */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

// Default sender. Resend's shared onboarding domain works before the
// continuumrtw.com domain is verified; override with SIGNUP_NOTIFY_FROM once a
// verified sender exists.
const DEFAULT_FROM = "Continuum Hub <onboarding@resend.dev>";

// Pure: builds the Resend email payload for a new signup. No I/O.
function buildSignupNotification(email, to, from) {
  const safeEmail = typeof email === "string" ? email : "";
  return {
    from: from || DEFAULT_FROM,
    to: [to],
    subject: "New Continuum hub signup awaiting approval",
    text:
      "A new account was created at the Continuum Hub and is awaiting approval.\n\n" +
      "Email: " + safeEmail + "\n\n" +
      "Approve or reject it here: https://continuumrtw.com/admin-hub-users\n"
  };
}

// Pure: reads the notification config from an env object. configured is true
// only when BOTH a Resend key and a recipient are present.
function readNotifyConfig(env) {
  const e = env && typeof env === "object" ? env : {};
  const apiKey = typeof e.RESEND_API_KEY === "string" ? e.RESEND_API_KEY : "";
  const to = typeof e.SIGNUP_NOTIFY_TO === "string" ? e.SIGNUP_NOTIFY_TO : "";
  const from = (typeof e.SIGNUP_NOTIFY_FROM === "string" && e.SIGNUP_NOTIFY_FROM) || DEFAULT_FROM;
  return { configured: Boolean(apiKey && to), apiKey, to, from };
}

// Best effort: sends the signup notification via Resend. Never throws.
// Returns { sent: boolean, reason?: string }. env defaults to process.env.
async function sendSignupNotification(email, env) {
  try {
    const source = env || (typeof process !== "undefined" && process.env ? process.env : {});
    const cfg = readNotifyConfig(source);
    if (!cfg.configured) return { sent: false, reason: "not configured" };

    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + cfg.apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildSignupNotification(email, cfg.to, cfg.from))
    });

    if (res.status >= 200 && res.status < 300) return { sent: true };
    return { sent: false, reason: "send failed with status " + res.status };
  } catch (e) {
    return { sent: false, reason: "error" };
  }
}

// Pure: builds the Resend payload for a marketing access request (Prompt 62).
function buildLeadNotification(email, source, to, from) {
  const safeEmail = typeof email === "string" ? email : "";
  const safeSource = typeof source === "string" ? source : "";
  return {
    from: from || DEFAULT_FROM,
    to: [to],
    subject: "New Continuum access request",
    text:
      "Someone requested access from the Continuum site.\n\n" +
      "Email: " + safeEmail + "\n" +
      "From page: " + safeSource + "\n"
  };
}

// Best effort: forwards a captured lead via Resend. Never throws. Same gate as
// the signup notification: a no op unless RESEND_API_KEY and SIGNUP_NOTIFY_TO
// are both set, so storage is never blocked on the forwarding config.
async function sendLeadNotification(email, source, env) {
  try {
    const src = env || (typeof process !== "undefined" && process.env ? process.env : {});
    const cfg = readNotifyConfig(src);
    if (!cfg.configured) return { sent: false, reason: "not configured" };
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: "Bearer " + cfg.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(buildLeadNotification(email, source, cfg.to, cfg.from))
    });
    if (res.status >= 200 && res.status < 300) return { sent: true };
    return { sent: false, reason: "send failed with status " + res.status };
  } catch (e) {
    return { sent: false, reason: "error" };
  }
}

// Pure: builds the Resend payload for an access invite sent to the admin inbox
// when the admin provisions a user. Carries the temporary credentials so the
// team can relay access to the new user. No I/O.
function buildAccessInvite(user, tempPassword, to, from) {
  const u = user && typeof user === "object" ? user : {};
  const name = typeof u.full_name === "string" ? u.full_name : "";
  const email = typeof u.email === "string" ? u.email : "";
  const role = typeof u.role === "string" ? u.role : "";
  const pw = typeof tempPassword === "string" ? tempPassword : "";
  return {
    from: from || DEFAULT_FROM,
    to: [to],
    subject: "New Continuum user provisioned: access invite",
    text:
      "A user was provisioned in the Continuum admin and a login was created.\n\n" +
      "Name: " + name + "\n" +
      "Email: " + email + "\n" +
      "Role: " + role + "\n" +
      (pw ? "Temporary password: " + pw + "\n\n" : "\n") +
      "Relay these credentials to the user. They sign in at https://continuumrtw.com/hub\n" +
      "The password should be rotated after first use.\n"
  };
}

// Best effort: emails the access invite to the admin inbox (SIGNUP_NOTIFY_TO,
// normally info@continuumrtw.com). Same env gate as the other notifiers: a no
// op unless RESEND_API_KEY and SIGNUP_NOTIFY_TO are set, so provisioning is
// never blocked on the mail config. Never throws.
async function sendAccessInvite(user, tempPassword, env) {
  try {
    const src = env || (typeof process !== "undefined" && process.env ? process.env : {});
    const cfg = readNotifyConfig(src);
    if (!cfg.configured) return { sent: false, reason: "not configured" };
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: "Bearer " + cfg.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(buildAccessInvite(user, tempPassword, cfg.to, cfg.from))
    });
    if (res.status >= 200 && res.status < 300) return { sent: true };
    return { sent: false, reason: "send failed with status " + res.status };
  } catch (e) {
    return { sent: false, reason: "error" };
  }
}

export { buildSignupNotification, readNotifyConfig, sendSignupNotification, DEFAULT_FROM, buildLeadNotification, sendLeadNotification, buildAccessInvite, sendAccessInvite };
