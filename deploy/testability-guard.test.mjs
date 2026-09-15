/* Continuum testability guard (SB-005).
   node deploy/testability-guard.test.mjs
   Production env cannot reach /api/test/reset (handler returns 404).
   Unset is closed. Non-prod may return a closed stub. No database.
   /api/test/* is not on ALWAYS_PUBLIC. No dashes anywhere. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { handler, isNonProd } from "./api/test/reset.js";
import { decideSiteAccess } from "./middleware.js";

const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, "api", "test", "reset.js"), "utf8");
const mw = readFileSync(join(dir, "middleware.js"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

function mockRes() {
  const r = { _status: null, _json: null, _headers: {} };
  r.setHeader = (k, v) => { r._headers[k.toLowerCase()] = v; return r; };
  r.status = (s) => { r._status = s; return r; };
  r.json = (o) => { r._json = o; return r; };
  return r;
}

ok("preview is non-prod", isNonProd({ VERCEL_ENV: "preview" }) === true);
ok("development is non-prod", isNonProd({ VERCEL_ENV: "development" }) === true);
ok("production is closed", isNonProd({ VERCEL_ENV: "production" }) === false);
ok("unset env is closed", isNonProd({}) === false);
ok("undefined env is closed", isNonProd(undefined) === false);

const prev = process.env.VERCEL_ENV;
try {
  process.env.VERCEL_ENV = "production";
  const prod = mockRes();
  handler({ method: "POST" }, prod);
  ok("production handler returns 404", prod._status === 404);
  ok("production body is JSON not-found", prod._json && prod._json.error === "not found");

  delete process.env.VERCEL_ENV;
  const unset = mockRes();
  handler({ method: "POST" }, unset);
  ok("unset handler returns 404", unset._status === 404);

  process.env.VERCEL_ENV = "preview";
  const preview = mockRes();
  handler({ method: "POST" }, preview);
  ok("preview stub does not touch a database", preview._status === 404 && preview._json && preview._json.reset === false);

  process.env.VERCEL_ENV = "development";
  const dev = mockRes();
  handler({ method: "GET" }, dev);
  ok("development stub stays closed", dev._status === 404);
} finally {
  if (prev === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = prev;
}

ok("reset.js has no database client", !/supabase|DATABASE_URL|createClient|\bpg\b|postgres/i.test(src));
ok("reset.js is dash clean", !/[–—]/.test(src));
ok("/api/test/reset is not always public", decideSiteAccess("/api/test/reset", false, undefined) === "holding");
ok("middleware does not list /api/test", !/\/api\/test/.test(mw));

console.log("\ntestability-guard suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
