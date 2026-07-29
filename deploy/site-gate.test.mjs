/* Continuum Prompt 40 site gate suite: Layer 0 holding page. node deploy/site-gate.test.mjs
   Asserts the raw text of deploy/gate/holding.html: locked/hero copy present, both CTAs
   present, footer contacts present, OG/Twitter preview tags present, and the gated
   vocabulary + stat tokens + em/en dashes are absent. No em-dashes anywhere. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(join(dir, f), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const holding = read("gate/holding.html");

// -- required content --
ok("locked line present verbatim", holding.includes("THE NEW STANDARD FOR WORKPLACE INJURY MANAGEMENT"));
ok("hero line present verbatim", holding.includes("Where care ends, Continuum begins."));
ok("Request access CTA present", holding.includes("Request access"));
ok("Book a demo CTA present", holding.includes("Book a demo"));
ok("contact email present", holding.includes("craig@continuumrtw.com"));
ok("privacy link present", /href="\/privacy"/.test(holding));
ok("terms link present", /href="\/terms"/.test(holding));

// -- link preview / unfurl tags --
ok("og:title present", /property="og:title"/.test(holding));
ok("og:image present", /property="og:image"/.test(holding));
ok("twitter:card present", /name="twitter:card"/.test(holding));

// -- not indexable-blocked (holding page must stay indexable) --
ok("no noindex directive on the holding page", !/noindex/i.test(holding));

// -- gated vocabulary must never leak onto Layer 0 --
const banned = ["slider", "duty-matching", "check-in cadence", "roadmap", "pricing"];
for (const term of banned) {
  ok("does not leak: " + term, !new RegExp(term, "i").test(holding));
}
ok("no bare stat token 63", !/\b63\b/.test(holding));
ok("no bare stat token 2,091", !holding.includes("2,091"));
ok("no bare stat token 2091", !/\b2091\b/.test(holding));

// -- dash rule --
ok("holding page dash clean", !/[–—]/.test(holding));

console.log("\nsite-gate suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
