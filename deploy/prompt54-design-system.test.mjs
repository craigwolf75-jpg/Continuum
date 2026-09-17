/* Prompt 54 design-system / surface-standard honesty gate.
   File-text and token-file scans only. No live apply. No new pipeline.
   Prompt 58 is now the governing surface-standard number. Prompt 54 is
   superseded lineage (earlier review and build). The 51-design-system
   folder stays as the earlier #152/#153 landing. It is not Core Platform
   Foundations. Dark and Compact stay tokens only. No dashes.
   Run by node; suites.yml globs it. */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const DASH_RE = /[\u2013\u2014]/;

function read(p) {
  return readFileSync(p, "utf8");
}

function walk(dir, pred) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p, pred));
    else if (!pred || pred(p)) out.push(p);
  }
  return out;
}

function htmlTag(src) {
  const m = String(src || "").match(/<html\b[^>]*>/i);
  return m ? m[0] : "";
}

function attr(tag, name) {
  const m = tag.match(new RegExp("\\b" + name + "\\s*=\\s*\"([^\"]*)\"", "i"));
  return m ? m[1] : null;
}

function cssRule(src, selector) {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = src.match(new RegExp(esc + "\\s*\\{([^}]+)\\}"));
  return m ? m[1] : "";
}

const docs54 = join(root, "docs/prompts/54");
const required54 = [
  "SECTION_1.md",
  "REGISTER.md",
  "STOPS.md",
  "SECTION_16.md",
  "ACCEPTANCE.md",
];
for (const name of required54) {
  const p = join(docs54, name);
  ok("docs/prompts/54/" + name + " exists", existsSync(p));
  if (existsSync(p)) {
    const text = read(p);
    ok(name + " is non-empty", text.trim().length > 0);
    ok(name + " has no em or en dashes", !DASH_RE.test(text));
  }
}

const register = existsSync(join(docs54, "REGISTER.md")) ? read(join(docs54, "REGISTER.md")) : "";
ok("REGISTER records Craig confirmed governing version",
  /Craig confirmed/i.test(register) && /governing version/i.test(register));
ok("REGISTER records sequenced review and build",
  /sequenced for review and build/i.test(register) || /review and build/i.test(register));

const stops = existsSync(join(docs54, "STOPS.md")) ? read(join(docs54, "STOPS.md")) : "";
ok("STOPS names Product Behaviour absence", /Product Behaviour/i.test(stops) && /absent/i.test(stops));
ok("STOPS names Prompt 53 live-platform holds",
  /Prompt 53/i.test(stops)
  && /Montreal/i.test(stops)
  && /Bedrock/i.test(stops)
  && /SYNTH/i.test(stops)
  && /Section 3/i.test(stops));

const dsDir = join(root, "docs/prompts/51-design-system");
ok("docs/prompts/51-design-system folder still exists", existsSync(dsDir));
const dsFiles = ["SECTION_1.md", "STOPS.md", "SECTION_16.md", "HUMAN_COPY_REVIEW.md"];
let dsText = "";
for (const name of dsFiles) {
  const p = join(dsDir, name);
  ok("51-design-system/" + name + " exists", existsSync(p));
  if (existsSync(p)) dsText += read(p) + "\n";
}
ok("51-design-system is not Core Platform Foundations",
  /not Core Platform Foundations/i.test(dsText));
ok("51-design-system does not claim to own docs/prompts/50",
  !/owns docs\/prompts\/50\b/.test(dsText));
ok("51-design-system does not claim to own docs/prompts/50a",
  !/owns docs\/prompts\/50a\b/.test(dsText));

const tokens = read(join(here, "continuum_tokens.css"));
ok("continuum_tokens.css names Prompt 58 as the governing surface-standard number",
  /Prompt 58 is the governing surface-standard number/.test(tokens));
ok("continuum_tokens.css records Prompt 54 as superseded lineage",
  /Prompt 54 is superseded lineage/.test(tokens));
ok("continuum_tokens.css keeps Prompt 51 Design System lineage",
  /Prompt 51 Design System/.test(tokens));
ok("continuum_tokens.css keeps Prompt 58 lineage",
  /PROMPT 58/.test(tokens));
ok("continuum_tokens.css still has dark [data-theme=\"dark\"] token block",
  /\[data-theme="dark"\]\s*\{/.test(tokens));
ok("continuum_tokens.css still has compact [data-density=\"compact\"] token block",
  /\[data-density="compact"\]\s*\{/.test(tokens));

const tokensRules = tokens.replace(/\/\*[\s\S]*?\*\//g, " ");
ok("draft label CSS uses a real .provenance-label element",
  /\.provenance-label\s*\{/.test(tokensRules));
ok("draft label CSS never uses ::before",
  !/provenance[^{]*::before/.test(tokensRules) && !/::before/.test(tokensRules.match(/\.field\[data-provenance="ai_draft"\][\s\S]{0,800}/) || [""])[0]);
ok("draft label CSS never uses generated content:",
  !/content\s*:/.test(tokensRules));

const htmlFiles = walk(here, (p) => p.endsWith(".html"));
let darkDefault = 0;
let compactDefault = 0;
for (const p of htmlFiles) {
  const tag = htmlTag(read(p));
  if (!tag) continue;
  if (attr(tag, "data-theme") === "dark") {
    darkDefault++;
    console.error("  dark html default: " + relative(here, p));
  }
  if (attr(tag, "data-density") === "compact") {
    compactDefault++;
    console.error("  compact html default: " + relative(here, p));
  }
}
ok("no product html defaults data-theme to dark", darkDefault === 0);
ok("no product html defaults data-density to compact", compactDefault === 0);

const BRAND = /#1E8A6E/i;
const brandAllow = new Set([
  join(here, "continuum_tokens.css"),
  join(here, "tokens-contrast.test.mjs"),
  join(here, "prompt54-design-system.test.mjs"),
  join(here, "prompt58-design-system.test.mjs"),
]);
const brandRoots = [
  here,
  join(root, "worker-app/src"),
  join(root, "hub-roles/src"),
  join(root, "framer"),
];
const brandHits = [];
for (const start of brandRoots) {
  for (const p of walk(start, (f) => /\.(html|css|js|mjs|jsx|ts|tsx)$/.test(f))) {
    if (brandAllow.has(p)) continue;
    if (p.includes("/node_modules/")) continue;
    const text = read(p);
    if (BRAND.test(text)) brandHits.push(relative(root, p));
  }
}
ok("brand green #1E8A6E is absent from product HTML/CSS/JS working UI", brandHits.length === 0);
if (brandHits.length) brandHits.forEach((h) => console.error("  brand green hit: " + h));

const holding = read(join(here, "gate/holding.html"));
const btn = cssRule(holding, ".btn");
const reqInput = cssRule(holding, ".req-form input");
const footerA = cssRule(holding, "footer a");
const gateToggle = cssRule(holding, ".gate-toggle");
const gateInput = cssRule(holding, ".gate-form input");
const gateSubmit = cssRule(holding, ".gate-submit");
ok("holding.html .btn keeps min-height:44px", /min-height:\s*44px/.test(btn));
ok("holding.html .btn keeps min-width:44px", /min-width:\s*44px/.test(btn));
ok("holding.html .req-form input keeps min-height:44px", /min-height:\s*44px/.test(reqInput));
ok("holding.html footer a keeps min-height:44px", /min-height:\s*44px/.test(footerA));
ok("holding.html footer a keeps min-width:44px", /min-width:\s*44px/.test(footerA));
ok("holding.html .gate-toggle keeps min-height:44px", /min-height:\s*44px/.test(gateToggle));
ok("holding.html .gate-toggle keeps min-width:44px", /min-width:\s*44px/.test(gateToggle));
ok("holding.html .gate-form input keeps min-height:44px", /min-height:\s*44px/.test(gateInput));
ok("holding.html .gate-submit keeps min-height:44px", /min-height:\s*44px/.test(gateSubmit));
ok("holding.html .gate-submit keeps min-width:44px", /min-width:\s*44px/.test(gateSubmit));

const pkgDeploy = read(join(here, "package.json"));
const pkgHub = read(join(root, "hub-roles/package.json"));
const pkgWorker = read(join(root, "worker-app/package.json"));
ok("deploy/package.json still locked at @vercel/functions 3.7.6",
  pkgDeploy.includes("\"@vercel/functions\": \"3.7.6\""));
ok("hub-roles/package.json still locked at framer-motion ^11.3.0",
  pkgHub.includes("\"framer-motion\": \"^11.3.0\""));
ok("worker-app/package.json still locked at next 14.2.5",
  pkgWorker.includes("\"next\": \"14.2.5\""));
ok("this suite uses only node builtins (package.json not required to change)",
  /^import .+ from "node:/m.test(read(join(here, "prompt54-design-system.test.mjs"))));

const KNOWN_HTML = [
  "404.html",
  "admin-hub-users.html",
  "admin-portal.html",
  "admin-site-codes.html",
  "app/index.html",
  "assessment/index.html",
  "book.html",
  "clinical-dashboard.html",
  "demo/index.html",
  "employer-dashboard.html",
  "followup.html",
  "gate/holding.html",
  "hse-portal.html",
  "hub/index.html",
  "index.html",
  "measurement.html",
  "privacy.html",
  "screens/index.html",
  "sigma-crtw-connection.html",
  "sigma-panel.html",
  "sigma-portal.html",
  "terms.html",
  "wcb-portal.html",
  "worker-dashboard.html",
  "worker-embed.html",
  "worker/check-in.html",
  "worker/clinician-handoff.html",
  "worker/companion-settings.html",
  "worker/employer-view.html",
  "worker/first-run.html",
  "worker/get-help.html",
  "worker/index.html",
  "worker/login.html",
  "worker/movement-check.html",
  "worker/privacy.html",
  "worker/psych-day.html", // Prompt 61 psych pathway retained-day surface
  "worker/progress.html",
  "worker/signup.html",
  "worker/support-offer.html",
  "worker/today.html",
];
const htmlRel = htmlFiles.map((p) => relative(here, p)).sort();
const extraHtml = htmlRel.filter((p) => !KNOWN_HTML.includes(p));
const missingHtml = KNOWN_HTML.filter((p) => !htmlRel.includes(p));
ok("no new product screen file was added", extraHtml.length === 0);
if (extraHtml.length) extraHtml.forEach((h) => console.error("  extra html: " + h));
ok("known product html set is still present (not deleted to fake a pass)", missingHtml.length === 0);
if (missingHtml.length) missingHtml.forEach((h) => console.error("  missing html: " + h));

const self = read(join(here, "prompt54-design-system.test.mjs"));
ok("this suite has no em or en dashes", !DASH_RE.test(self));

console.log(`\nprompt54-design-system suite: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
