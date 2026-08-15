/* Continuum Prompt 58 no-raw-hex gate (section 13 / acceptance criterion 1).
   Every colour on a product surface must be a design token, so no page carries
   a raw #RRGGBB/#RGB colour literal. Hex lives only in the token files
   (continuum_tokens.css, continuum-vars.css). Out of scope by design: the
   marketing landing (index.html), the legal pages, the 404, the demo and the
   legacy screens keep their own look. Character entities (&#8594; etc.) are
   4 to 5 digits and never match the 6/3-digit colour pattern. No dashes. */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const here = dirname(fileURLToPath(import.meta.url));

const EXCLUDE = new Set(["index.html", "privacy.html", "terms.html", "404.html"]);
const hexRe = /#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/g;

function scan(dir, prefix) {
  const out = [];
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    if (f.isDirectory()) {
      if (f.name === "node_modules" || f.name === "legacy") continue;
      out.push(...scan(join(dir, f.name), prefix + f.name + "/"));
    } else if (f.name.endsWith(".html")) {
      const rel = prefix + f.name;
      if (prefix === "" && EXCLUDE.has(f.name)) continue;      // root marketing/legal/404
      if (rel === "demo/index.html") continue;                 // demo surface, own look
      const html = readFileSync(join(dir, f.name), "utf8").replace(/https?:\/\/[^"'\s]+/g, " "); // drop URLs
      const hits = [...new Set(html.match(hexRe) || [])];
      if (hits.length) out.push(`${rel}: ${hits.slice(0, 6).join(", ")}`);
    }
  }
  return out;
}

const offenders = scan(here, "");
ok("no product surface carries a raw colour hex (all are tokens)", offenders.length === 0);
if (offenders.length) offenders.forEach((o) => console.error("  " + o));

// self-test: the pattern catches a colour hex but not a 4/5-digit entity
ok("gate catches a 6-digit colour hex", hexRe.test("#1A66BC"));
hexRe.lastIndex = 0;
ok("gate ignores a character entity like &#8594;", !("&#8594;".match(/#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/)));

console.log(`\nno-raw-hex suite: ${pass} passed, ${fail} failed, ${offenders.length} offenders`);
process.exit(fail ? 1 : 0);
