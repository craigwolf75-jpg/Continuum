/* Continuum Prompt 40 site hygiene suite. node deploy/site-hygiene.test.mjs
   Proves the search-engine hygiene half of the site gate (robots.txt,
   sitemap.xml, and per-page noindex) independently of decideSiteAccess
   (deploy/site-middleware.test.mjs proves that half). While the gate is on,
   the only pages that should ever be crawlable are the holding page,
   /privacy, and /terms; every gated page must carry a noindex meta and the
   holding page must not. No dashes anywhere. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(dir, f), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// -- sitemap.xml: exactly the 3 public locs, nothing gated --
const sitemap = read("sitemap.xml");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
ok("sitemap has exactly 3 <loc> entries", locs.length === 3);
ok("sitemap contains the root", locs.includes("https://continuumrtw.com/"));
ok("sitemap contains /privacy", locs.includes("https://continuumrtw.com/privacy"));
ok("sitemap contains /terms", locs.includes("https://continuumrtw.com/terms"));
ok(
  "sitemap has no gated path (hub, admin, app, workflow)",
  !locs.some((u) => /\/(hub|admin|app|workflow)/i.test(u))
);

// -- robots.txt: deny by default, allow only the public surfaces, sitemap ref --
const robots = read("robots.txt");
ok("robots.txt disallows /", /^Disallow:\s*\/\s*$/m.test(robots));
ok("robots.txt allows /privacy", /^Allow:\s*\/privacy\s*$/m.test(robots));
ok("robots.txt allows /terms", /^Allow:\s*\/terms\s*$/m.test(robots));
ok("robots.txt allows /privacy.html", /^Allow:\s*\/privacy\.html\s*$/m.test(robots));
ok("robots.txt allows /terms.html", /^Allow:\s*\/terms\.html\s*$/m.test(robots));
ok("robots.txt references the sitemap", robots.includes("Sitemap: https://continuumrtw.com/sitemap.xml"));

// -- noindex: every gated page carries it, the holding page never does --
const gatedSample = read("admin-portal.html");
ok('admin-portal.html carries content="noindex"', /content=["']noindex/i.test(gatedSample));

const holding = read("gate/holding.html");
ok("holding.html does NOT carry a robots noindex meta", !/name=["']robots["']/i.test(holding));

// -- noindex: full sweep of every gated .html file this prompt covers --
const gatedFiles = [
  "404.html",
  "admin-portal.html",
  "clinical-dashboard.html",
  "employer-dashboard.html",
  "hse-portal.html",
  "wcb-portal.html",
  "sigma-portal.html",
  "sigma-panel.html",
  "sigma-crtw-connection.html",
  "worker-dashboard.html",
  "worker-embed.html",
  "continuum_workflow_app.html",
  "garda-demo.html",
  "hub/index.html",
  "app/index.html",
  "screens/index.html",
  "screens/legacy/demo.html",
  "demo/index.html",
  "privacy.html",
  "terms.html"
];
// Prompt 67: index.html is now the PUBLIC landing page and must be indexable,
// so it is deliberately not in the noindex sweep above.
for (const f of gatedFiles) {
  ok(f + ' carries content="noindex"', /content=["'][^"']*noindex/i.test(read(f)));
}

console.log("\nsite-hygiene suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
