/* Continuum Prompt 51 Design System --draft-700 reservation gate
   (acceptance criterion 5). --draft-700 is a regulatory control. It appears
   as a palette definition and as --state-draft in the token files, and it
   is consumed only by the draft field treatment and the draft status icon.
   This suite does not require the treatment to be mounted on a product page.
   Fail if a product HTML or JS surface uses --draft-700 as a raw colour
   outside those intended homes. No dashes. Run by node; suites.yml globs it. */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const here = dirname(fileURLToPath(import.meta.url));

const tokens = readFileSync(join(here, "continuum_tokens.css"), "utf8");
const vars = readFileSync(join(here, "continuum-vars.css"), "utf8");

ok("continuum_tokens.css defines the --draft-700 palette token",
  /--draft-700:\s*#[0-9A-Fa-f]{6}/.test(tokens));
ok("continuum-vars.css defines the --draft-700 palette token",
  /--draft-700:\s*#[0-9A-Fa-f]{6}/.test(vars));
ok("continuum_tokens.css aliases --state-draft from --draft-700",
  /--state-draft:\s*var\(--draft-700\)/.test(tokens));
ok("continuum-vars.css aliases --state-draft from --draft-700",
  /--state-draft:\s*var\(--draft-700\)/.test(vars));

ok("draft field treatment uses --state-draft (not a raw hex)",
  /\.field\[data-provenance="ai_draft"\][\s\S]*?border-left:\s*4px solid var\(--state-draft\)/.test(tokens));
ok("draft field treatment uses the draft tint",
  /\.field\[data-provenance="ai_draft"\][\s\S]*?background:\s*var\(--state-draft-bg\)/.test(tokens));
ok("draft status icon fill uses --state-draft",
  /\.status\[data-state="draft"\]\s+\.status-icon\s*\{\s*fill:\s*var\(--state-draft\)/.test(tokens));

const icons = readFileSync(join(here, "status-icons.mjs"), "utf8");
ok("status icon contract includes a draft silhouette",
  /draft:\s*'<svg/.test(icons) || /draft:\s*"<svg/.test(icons));

const ALLOW_FILES = new Set([
  "continuum_tokens.css",
  "continuum-vars.css",
]);

function walk(dir, prefix) {
  const out = [];
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    if (f.isDirectory()) {
      if (f.name === "node_modules" || f.name === "legacy") continue;
      out.push(...walk(join(dir, f.name), prefix + f.name + "/"));
    } else if (/\.(html|js)$/.test(f.name) && !f.name.endsWith(".test.mjs")) {
      out.push(prefix + f.name);
    }
  }
  return out;
}

const offenders = [];
for (const rel of walk(here, "")) {
  if (ALLOW_FILES.has(rel)) continue;
  const src = readFileSync(join(here, rel), "utf8");
  if (/--draft-700/.test(src)) offenders.push(rel);
}

ok("no product HTML/JS surface uses --draft-700 as a raw colour", offenders.length === 0);
if (offenders.length) offenders.forEach((o) => console.error("  " + o));

console.log(`\ndraft-700-reservation suite: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
