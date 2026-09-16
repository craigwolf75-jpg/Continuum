/* Prompt 50 /health/dependencies. Authenticated. Identifiers and status
   only. No personal information. No em dashes or en dashes. */

export default function handler(req, res) {
  const expected = process.env.PLATFORM_DEPENDENCY_TOKEN || "";
  const got = (req.headers && (req.headers.authorization || req.headers.Authorization)) || "";
  if (!expected || got !== "Bearer " + expected) {
    res.statusCode = 401;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: false, reason: "authentication_required" }));
    return;
  }
  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({
    ok: true,
    database: { status: "UNKNOWN", latency_ms: "UNKNOWN" },
    secrets: { status: process.env.PLATFORM_SECRETS_RESOLVED === "true" ? "resolved" : "UNKNOWN" },
    config: { status: process.env.PLATFORM_CONFIG_LOADED === "true" ? "loaded" : "UNKNOWN" },
  }));
}
