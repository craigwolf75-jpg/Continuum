/* Continuum retired-demo hygiene and links suite (ARGUS-HYG-001 / LINK-001).
   node deploy/retired-demos.test.mjs
   continuum_workflow_app and garda-demo were deleted from deploy/. This suite
   proves they stay gone, that served HTML does not link them, and that gate
   config no longer treats the workflow app as a live mechanism path.
   No dashes anywhere. */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep } from "node:path";
import { decideHubAccess } from "./middleware.js";

const dir = dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

function walkHtml(base) {
  const out = [];
  (function rec(cur) {
    for (const entry of readdirSync(cur, { withFileTypes: true })) {
      if (entry.name === "node_modules") continue;
      const full = join(cur, entry.name);
      if (entry.isDirectory()) { rec(full); continue; }
      if (entry.name.endsWith(".html")) out.push(full);
    }
  })(base);
  return out;
}

ok("ARGUS-HYG-001: continuum_workflow_app.html is absent", !existsSync(join(dir, "continuum_workflow_app.html")));
ok("ARGUS-HYG-001: garda-demo.html is absent", !existsSync(join(dir, "garda-demo.html")));

const robots = readFileSync(join(dir, "robots.txt"), "utf8");
ok("robots.txt no longer disallows /continuum_workflow_app", !robots.includes("Disallow: /continuum_workflow_app"));

const vercel = JSON.parse(readFileSync(join(dir, "vercel.json"), "utf8"));
ok("vercel.json no longer noindexes /continuum_workflow_app",
  !(vercel.headers || []).some((h) => h.source === "/continuum_workflow_app"));

const mw = readFileSync(join(dir, "middleware.js"), "utf8");
ok("middleware.js no longer lists continuum_workflow_app as a live prefix",
  !/HUB_AUTHED_PREFIXES[\s\S]*continuum_workflow_app/.test(mw) && !mw.includes('"/continuum_workflow_app"'));

ok("retired workflow app is not hub-gated as a live mechanism page",
  decideHubAccess("/continuum_workflow_app", null) === "allow");
ok("worker-embed remains hub-gated with no session",
  decideHubAccess("/worker-embed.html", null) === "blocked");

const htmlFiles = walkHtml(dir);
ok("served HTML walk found pages", htmlFiles.length > 0);
for (const full of htmlFiles) {
  const text = readFileSync(full, "utf8");
  const path = relative(dir, full).split(sep).join("/");
  ok("ARGUS-LINK-001: " + path + " does not href continuum_workflow_app",
    !/href\s*=\s*["'][^"']*continuum_workflow_app/i.test(text));
  ok("ARGUS-LINK-001: " + path + " does not href garda-demo",
    !/href\s*=\s*["'][^"']*garda-demo/i.test(text));
}

console.log("\nretired-demos suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
