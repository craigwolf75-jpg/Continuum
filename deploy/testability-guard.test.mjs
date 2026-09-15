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

function allowlistQuotedStrings(src, constName) {
  const marker = "const " + constName;
  const idx = src.indexOf(marker);
  if (idx < 0) return [];
  const slice = src.slice(idx);
  const end = slice.indexOf(";");
  const block = end < 0 ? slice : slice.slice(0, end);
  return [...block.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
}

const exactAllow = allowlistQuotedStrings(mw, "ALWAYS_PUBLIC_EXACT");
const boundedAllow = allowlistQuotedStrings(mw, "ALWAYS_PUBLIC_BOUNDED_PREFIX");
const rawAllow = allowlistQuotedStrings(mw, "ALWAYS_PUBLIC_RAW_PREFIX");
const allAllow = exactAllow.concat(boundedAllow, rawAllow);
ok("ALWAYS_PUBLIC_EXACT parsed", exactAllow.length > 0);
ok("ALWAYS_PUBLIC_BOUNDED_PREFIX parsed", boundedAllow.length > 0);
ok("ALWAYS_PUBLIC_RAW_PREFIX parsed", rawAllow.length > 0);
ok("/api/test is absent from ALWAYS_PUBLIC_EXACT", !exactAllow.some((p) => p === "/api/test" || p.startsWith("/api/test")));
ok("/api/test is absent from ALWAYS_PUBLIC_BOUNDED_PREFIX", !boundedAllow.some((p) => p === "/api/test" || p.startsWith("/api/test")));
ok("/api/test is absent from ALWAYS_PUBLIC_RAW_PREFIX", !rawAllow.some((p) => p === "/api/test" || p.startsWith("/api/test")));
ok("/api/test is absent from all ALWAYS_PUBLIC lists", !allAllow.some((p) => p === "/api/test" || p.startsWith("/api/test")));

ok("/api/test/reset without cookie on default is not_found", decideSiteAccess("/api/test/reset", false, undefined) === "not_found");
ok("/api/test/reset without cookie on default is never allow", decideSiteAccess("/api/test/reset", false, undefined) !== "allow");
ok("/api/test/reset with cookie on default is not_found", decideSiteAccess("/api/test/reset", true, undefined) === "not_found");
ok("/api/test/other without cookie on default is not_found", decideSiteAccess("/api/test/other", false, undefined) === "not_found");
ok("/api/test/other with cookie on default is not_found", decideSiteAccess("/api/test/other", true, undefined) === "not_found");
ok("/api/test/reset without cookie on production is not_found", decideSiteAccess("/api/test/reset", false, undefined, "production") === "not_found");
ok("/api/test/reset with cookie on production is not_found", decideSiteAccess("/api/test/reset", true, undefined, "production") === "not_found");
ok("/api/test/other without cookie on production is not_found", decideSiteAccess("/api/test/other", false, undefined, "production") === "not_found");
ok("/api/test/other with cookie on production is not_found", decideSiteAccess("/api/test/other", true, undefined, "production") === "not_found");
ok("production /api/test/reset without cookie is never allow", decideSiteAccess("/api/test/reset", false, undefined, "production") !== "allow");

const mwFn = mw.slice(mw.indexOf("async function middleware"));
const firstDecide = mwFn.indexOf("decideSiteAccess(url.pathname");
const parseIdx = mwFn.indexOf("parseCookies");
const verifyIdx = mwFn.indexOf("verifySession");
const catchIdx = mwFn.lastIndexOf("catch");
const catchBody = catchIdx >= 0 ? mwFn.slice(catchIdx) : "";
ok("middleware function present", mwFn.indexOf("async function middleware") === 0);
ok("middleware decides not_found before parseCookies", firstDecide !== -1 && parseIdx !== -1 && firstDecide < parseIdx);
ok("middleware decides not_found before verifySession", firstDecide !== -1 && verifyIdx !== -1 && firstDecide < verifyIdx);
ok("middleware maps not_found to JSON 404", /status:\s*404/.test(mw) && mw.includes('"not found"'));
ok("catch 404s /api/test before holding rewrite", catchBody.includes("not_found") && catchBody.indexOf("not_found") < catchBody.indexOf("rewriteToHolding"));

console.log("\ntestability-guard suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
