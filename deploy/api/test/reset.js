/* Continuum production testability guard (SB-005). Vercel function at
   /api/test/reset. Fail closed unless VERCEL_ENV is preview or development.
   Production and unset return 404 JSON. Never touches a database. Do not add
   /api/test/* to middleware ALWAYS_PUBLIC. No em dashes or en dashes. */

function isNonProd(env) {
  var v = env && env.VERCEL_ENV;
  return v === "preview" || v === "development";
}

function handler(req, res) {
  try {
    res.setHeader("content-type", "application/json");
    res.setHeader("cache-control", "no-store");
  } catch (e) {}
  if (!isNonProd(process.env)) {
    return res.status(404).json({ error: "not found" });
  }
  return res.status(404).json({ error: "not found", reset: false });
}

export { isNonProd, handler };
export default handler;
