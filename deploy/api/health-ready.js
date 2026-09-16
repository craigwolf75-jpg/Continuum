/* Prompt 50 /health/ready. Fails when migrations are not current.
   Does not restart the process. No em dashes or en dashes. */

export default function handler(req, res) {
  const current = process.env.PLATFORM_MIGRATIONS_CURRENT === "true"
    || process.env.PLATFORM_MIGRATIONS_HEAD === "0019";
  const secrets = process.env.PLATFORM_SECRETS_RESOLVED === "true";
  const configLoaded = process.env.PLATFORM_CONFIG_LOADED === "true";
  const db = process.env.PLATFORM_DATABASE_REACHABLE === "true";
  const body = !current
    ? { ready: false, reason: "migrations_not_current", restart: false }
    : (!db || !secrets || !configLoaded)
      ? { ready: false, reason: "dependency_not_ready", restart: false }
      : { ready: true, restart: false };
  res.statusCode = body.ready ? 200 : 503;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}
