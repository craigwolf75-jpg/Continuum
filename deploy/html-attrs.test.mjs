/* Continuum Prompt 58 (governing surface-standard number) / Prompt 54 and
   Prompt 51 Design System lineage. html attribute contract (Check 8).
   Product shells that already link continuum-vars.css or continuum_tokens.css
   must set data-theme, data-density, and data-surface on <html>.
   Light is the live default: data-theme is light, never dark.
   Compact and dark stay tokens only; this suite does not require a control.
   book.html is data-surface="hub" (request-access, hub-adjacent).
   No dashes. Run by node; suites.yml globs it. */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const here = dirname(fileURLToPath(import.meta.url));

// Existing product shells that already link the token files. Marketing,
// legal, 404, and demo/index.html are out of scope (they do not link them).
// worker/index.html is a redirect and does not link the token files.
const SHELLS = [
  { file: "worker-dashboard.html", surface: "worker", keepLightClass: true },
  { file: "worker-embed.html", surface: "worker", keepLightClass: false },
  { file: "worker/get-help.html", surface: "worker", keepLightClass: false },
  { file: "worker/first-run.html", surface: "worker", keepLightClass: false },
  { file: "worker/privacy.html", surface: "worker", keepLightClass: false },
  { file: "worker/progress.html", surface: "worker", keepLightClass: false },
  { file: "worker/signup.html", surface: "worker", keepLightClass: false },
  { file: "worker/clinician-handoff.html", surface: "worker", keepLightClass: false },
  { file: "worker/check-in.html", surface: "worker", keepLightClass: false },
  { file: "worker/login.html", surface: "worker", keepLightClass: false },
  { file: "worker/employer-view.html", surface: "worker", keepLightClass: false },
  { file: "worker/companion-settings.html", surface: "worker", keepLightClass: false },
  { file: "worker/support-offer.html", surface: "worker", keepLightClass: false },
  { file: "worker/today.html", surface: "worker", keepLightClass: false },
  { file: "worker/movement-check.html", surface: "worker", keepLightClass: false },
  { file: "clinical-dashboard.html", surface: "clinical", keepLightClass: true },
  { file: "measurement.html", surface: "clinical", keepLightClass: false },
  { file: "followup.html", surface: "clinical", keepLightClass: false },
  { file: "employer-dashboard.html", surface: "employer", keepLightClass: false },
  { file: "hub/index.html", surface: "hub", keepLightClass: false },
  { file: "admin-portal.html", surface: "hub", keepLightClass: true },
  { file: "admin-hub-users.html", surface: "hub", keepLightClass: false },
  { file: "admin-site-codes.html", surface: "hub", keepLightClass: false },
  { file: "book.html", surface: "hub", keepLightClass: false },
  { file: "hse-portal.html", surface: "portal", keepLightClass: true },
  { file: "wcb-portal.html", surface: "portal", keepLightClass: true },
  { file: "sigma-portal.html", surface: "portal", keepLightClass: true },
  { file: "sigma-panel.html", surface: "portal", keepLightClass: true },
  { file: "sigma-crtw-connection.html", surface: "portal", keepLightClass: false },
  { file: "app/index.html", surface: "demo", keepLightClass: false },
  { file: "screens/index.html", surface: "demo", keepLightClass: false },
  { file: "gate/holding.html", surface: "holding", keepLightClass: false },
];

function htmlTag(src) {
  const m = src.match(/<html\b[^>]*>/i);
  return m ? m[0] : "";
}
function attr(tag, name) {
  const m = tag.match(new RegExp("\\b" + name + "\\s*=\\s*\"([^\"]*)\"", "i"));
  return m ? m[1] : null;
}

for (const s of SHELLS) {
  const src = readFileSync(join(here, s.file), "utf8");
  const tag = htmlTag(src);
  ok(`${s.file} has an <html> tag`, Boolean(tag));
  const theme = attr(tag, "data-theme");
  const density = attr(tag, "data-density");
  const surface = attr(tag, "data-surface");
  ok(`${s.file} sets data-theme on <html>`, theme !== null);
  ok(`${s.file} sets data-density on <html>`, density !== null);
  ok(`${s.file} sets data-surface on <html>`, surface !== null);
  ok(`${s.file} data-theme is light (never dark as a default)`, theme === "light");
  ok(`${s.file} data-density is comfortable`, density === "comfortable");
  ok(`${s.file} data-surface is ${s.surface}`, surface === s.surface);
  if (s.keepLightClass) {
    ok(`${s.file} keeps class="light" on <html>`, /\bclass="[^"]*\blight\b[^"]*"/.test(tag));
  }
}

ok("no listed shell defaults data-theme to dark",
  SHELLS.every((s) => attr(htmlTag(readFileSync(join(here, s.file), "utf8")), "data-theme") !== "dark"));

console.log(`\nhtml-attrs suite: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
