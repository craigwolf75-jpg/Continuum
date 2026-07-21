/* Continuum demo operational status endpoint (Mission S12a). Vercel serverless
   function at /api/status. This surface returns OPERATIONAL TELEMETRY ONLY: no
   case content, no worker facts, no clinical fields, ever, matching the Olympus
   telemetry law. Three-layer resilience on the data path: a live value, then a
   last-known fallback, then a safe default, so the endpoint never throws to the
   caller. UNKNOWN is never rendered as 0: a missing value returns the string
   UNKNOWN, not a numeric zero that would read as real data. No em-dashes. */

var SURFACES = ["hub", "worker", "employer", "hse", "clinical", "wcb", "admin"];

// Read a value through the three layers. A count that cannot be established
// returns "UNKNOWN", never 0.
function resolveRegion() {
  try {
    var live = process.env.VERCEL_REGION;        // live layer
    if (live) return live;
    var lastKnown = process.env.CONTINUUM_REGION; // last-known layer
    if (lastKnown) return lastKnown;
    return "UNKNOWN";                             // safe default (never 0)
  } catch (e) {
    return "UNKNOWN";
  }
}

module.exports = function handler(req, res) {
  var body;
  try {
    var count = SURFACES.length > 0 ? SURFACES.length : "UNKNOWN";
    body = {
      ok: true,
      region: resolveRegion(),
      surfaces: SURFACES,
      surfaceCount: count,
      generatedAt: new Date().toISOString(),
      telemetry: "operational only; no case content, no worker facts"
    };
  } catch (e) {
    // safe default layer: never 500 to the caller
    body = { ok: false, region: "UNKNOWN", surfaces: [], surfaceCount: "UNKNOWN", telemetry: "operational only" };
  }
  try {
    res.setHeader("content-type", "application/json");
    res.setHeader("cache-control", "no-store");
  } catch (e) {}
  return res.status(200).json(body);
};

module.exports.SURFACES = SURFACES;
module.exports.resolveRegion = resolveRegion;
