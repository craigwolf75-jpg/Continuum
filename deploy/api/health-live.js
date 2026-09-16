/* Prompt 50 /health/live. Process is running. No dependency checks.
   No em dashes or en dashes. */

export default function handler(req, res) {
  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ status: "live" }));
}
