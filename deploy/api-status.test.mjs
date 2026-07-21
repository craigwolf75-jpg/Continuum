/* Continuum api/status suite (Mission S12a). node deploy/api-status.test.mjs
   Proves the demo edge function is operational-only, resilient, and never 0 for
   UNKNOWN. Hard-fail: any FAIL exits nonzero. No em-dashes anywhere. */
import handler from "./api/status.js";
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

function mockRes() {
  const r = { _status: null, _json: null, _headers: {} };
  r.setHeader = (k, v) => { r._headers[k.toLowerCase()] = v; return r; };
  r.status = (s) => { r._status = s; return r; };
  r.json = (o) => { r._json = o; return r; };
  return r;
}

// nominal call
const res = mockRes();
handler({ method: "GET" }, res);
ok("responds 200", res._status === 200);
ok("ok is true", res._json.ok === true);
ok("returns JSON content type", (res._headers["content-type"] || "").indexOf("application/json") >= 0);
ok("region is a string, never 0", typeof res._json.region === "string" && res._json.region !== 0);
ok("surfaceCount is never a raw 0", res._json.surfaceCount !== 0);
ok("surfaces is an array of surface names", Array.isArray(res._json.surfaces) && res._json.surfaces.indexOf("worker") >= 0);
ok("generatedAt is present", typeof res._json.generatedAt === "string" && res._json.generatedAt.length > 0);

// telemetry law: operational only, no case content or worker facts
const CASE_KEYS = ["pain", "mobility", "fatigue", "confidence", "notes", "diagnosis", "name", "worker", "injury", "restr", "consent"];
ok("payload carries no case-content or worker-fact keys", CASE_KEYS.every(k => !(k in res._json)));

// resilience: region degrades to UNKNOWN, never throws, never 0
ok("resolveRegion returns a non-empty string default", typeof handler.resolveRegion() === "string" && handler.resolveRegion().length > 0);
ok("UNKNOWN default is the string, not 0", handler.resolveRegion() !== 0);

// the endpoint never 500s: even with a res whose setHeader throws, it still returns 200 json
const brittle = mockRes();
brittle.setHeader = () => { throw new Error("header failure"); };
let threw = false, out = null;
try { handler({}, { setHeader: brittle.setHeader, status: (s) => ({ json: (o) => { out = { s, o }; return out; } }) }); } catch (e) { threw = true; }
ok("never throws to the caller even if setHeader fails", !threw && out && out.s === 200 && out.o.ok === true);

// dash rule
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "api", "status.js"), "utf8");
ok("status.js dash clean", !/[–—]/.test(src));

console.log("\napi-status suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
