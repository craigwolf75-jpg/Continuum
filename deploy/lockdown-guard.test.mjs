/* Continuum Phase A lockdown guard (Task 12). node deploy/lockdown-guard.test.mjs
   Walks the SERVED bundle under deploy/ (every .html and .js file, excluding
   *.test.mjs and any node_modules) and asserts the compliance scrub holds
   across the whole surface, case-insensitively, so a rename or a new file
   cannot silently reintroduce retired vocabulary. Assertions hard-fail: any
   FAIL sets a non-zero exit. No em-dashes anywhere. */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// ---- walk the served bundle: .html and .js under deploy/, excluding
//      *.test.mjs and node_modules anywhere in the tree ----
function walk(base) {
  const out = [];
  (function rec(cur) {
    for (const entry of readdirSync(cur, { withFileTypes: true })) {
      if (entry.name === "node_modules") continue;
      const full = join(cur, entry.name);
      if (entry.isDirectory()) { rec(full); continue; }
      if (entry.name.endsWith(".test.mjs")) continue;
      if (entry.name.endsWith(".html") || entry.name.endsWith(".js")) out.push(full);
    }
  })(base);
  return out;
}

const files = walk(dir);
ok("bundle walk found served files", files.length > 0);

const rel = f => relative(dir, f).split(sep).join("/");

// ---- global scrub: none of these anywhere in the served bundle, case-insensitive ----
const GLOBAL_PATTERNS = [
  ["nexus", /nexus/i],
  ["worley", /worley/i],
  ["nx- prefix", /\bnx-/i],
  ["predict", /\bpredict/i],
];

for (const f of files) {
  const text = readFileSync(f, "utf8");
  const path = rel(f);
  for (const [label, re] of GLOBAL_PATTERNS) {
    ok(path + ": no " + label, !re.test(text));
  }
}

// ---- care/decision + demo surface set: stricter clinical-vocabulary scrub ----
const SURFACE_NAMES = [
  "clinical-dashboard.html",
  "hse-portal.html",
  "employer-dashboard.html",
  "wcb-portal.html",
  "worker-dashboard.html",
  "worker-embed.html",
  "continuum_workflow_app.html",
  "app/index.html",
  "garda-demo.html",
  "screens/index.html",
  "screens/legacy/demo.html",
];

const SURFACE_PATTERNS = [
  ["clearance", /clearance/i],
  ["readiness", /\breadiness\b/i],
  ["regression detected", /regression detected/i],
  ["vs prognosis", /vs prognosis/i],
  ["intelligence layer", /intelligence layer/i],
  ["authoriz*", /authoriz/i],
];

for (const name of SURFACE_NAMES) {
  const full = join(dir, name);
  const text = readFileSync(full, "utf8");
  for (const [label, re] of SURFACE_PATTERNS) {
    ok(name + ": no " + label, !re.test(text));
  }
}

// ---- clinical-dashboard: the physician escalation sentence must appear on
//      both escalation cards ----
const clinicalText = readFileSync(join(dir, "clinical-dashboard.html"), "utf8");
const PHYSICIAN_SENTENCE = "The treating physician makes every medical and return-to-work decision.";
const physicianCount = clinicalText.split(PHYSICIAN_SENTENCE).length - 1;
ok("clinical-dashboard: physician sentence appears at least twice", physicianCount >= 2);

// ---- hub surfaces: no nexus, checked explicitly per the spec (also covered
//      by the global scrub above, kept separate for a named assertion) ----
const hubIndex = readFileSync(join(dir, "hub", "index.html"), "utf8");
const hubRoles = readFileSync(join(dir, "hub", "roles.js"), "utf8");
ok("hub/index.html: no nexus", !/nexus/i.test(hubIndex));
ok("hub/roles.js: no nexus", !/nexus/i.test(hubRoles));

// Mount Olympus / Zeus / Olympus / roster names are INTENTIONALLY RETAINED in
// the admin-only admin-portal.html per the 2026-07-29 requirement change, and
// are deliberately NOT asserted absent by this guard or any pattern above.

console.log("\nlockdown-guard suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
