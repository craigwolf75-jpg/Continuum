/* Continuum Prompt 58 structural a11y gate (section 11 gates 2,4,6,7 + print).
   These are the token-level contracts that must hold regardless of any rendered
   page, verified over continuum_tokens.css in node:
     gate 2  focus ring at normal specificity, 2px + 2px offset, never :where()
     gate 4  target floors (24px, 44px on any-pointer:coarse + worker), with the
             inline-block fix and the any-pointer (not pointer) query
     gate 6  reduced motion zeroes the --motion-* tokens AND resets transitions
     gate 7  draft label is real DOM text (a styled element, never ::before)
     print   every semantic token reset in @media print (criterion 19)
   The RENDERED gates (axe scan, reflow@320, zoom@200, aria-live, sparkline alt)
   need a headless-browser workflow and are tracked separately. No dashes. */

import { readFileSync } from "node:fs";
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// strip /* */ comments: we assert on RULES, not on the prose that explains them
const css = readFileSync(new URL("./continuum_tokens.css", import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, " ");
const block = (re) => (css.match(re) || [""])[0];

// ---- gate 2: focus ring ----------------------------------------------------
ok("focus ring is 2px solid var(--focus-ring)", /outline:\s*2px solid var\(--focus-ring\)/.test(css));
ok("focus ring has a 2px offset", /outline-offset:\s*2px/.test(css));
ok("focus ring is authored at normal specificity, never inside :where()", !css.includes(":where("));
ok("focus applies to :focus-visible", /:focus-visible/.test(css));

// ---- gate 4: target floors -------------------------------------------------
ok("interactive floor uses --target-min", /min-height:\s*var\(--target-min\)/.test(css) && /min-width:\s*var\(--target-min\)/.test(css));
ok("anchors/roles are inline-block so the floor applies to non-replaced inline", /display:\s*inline-block/.test(css));
ok("SC 2.5.8 inline exception exists (.inline-target)", /\.inline-target\s*\{/.test(css));
ok("touch floor keyed on any-pointer (not the primary-only pointer)", /@media \(any-pointer:\s*coarse\)/.test(css));
ok("does NOT gate on (pointer: coarse) alone (the tablet-with-keyboard trap)", !/@media \(pointer:\s*coarse\)/.test(css));
ok("touch + worker surfaces use --target-touch (44px)", /var\(--target-touch\)/.test(css) && /\[data-surface="worker"\]/.test(css));

// ---- gate 6: reduced motion ------------------------------------------------
const rm = block(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\n\}/);
const rmFull = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
ok("reduced-motion block exists", /@media \(prefers-reduced-motion: reduce\)/.test(css));
ok("reduced-motion zeroes every --motion-* token", ["fast", "fade", "move", "expand"].every((m) => new RegExp(`--motion-${m}:\\s*0ms`).test(rmFull)));
ok("reduced-motion also resets transitions/animations", /transition-duration:\s*0\.01ms\s*!important/.test(rmFull) && /animation-duration:\s*0\.01ms\s*!important/.test(rmFull));

// ---- gate 7: draft treatment is REAL DOM TEXT ------------------------------
ok("draft wrapper renders a 4px left border in --state-draft", /\.field\[data-provenance="ai_draft"\][\s\S]*?border-left:\s*4px solid var\(--state-draft\)/.test(css));
ok("draft wrapper renders the tint background", /\.field\[data-provenance="ai_draft"\][\s\S]*?background:\s*var\(--state-draft-bg\)/.test(css));
ok("draft label is a styled block element (real DOM text)", /\.provenance-label\s*\{[\s\S]*?display:\s*block/.test(css) || /provenance-label\s*\{[\s\S]*?display:\s*block/.test(css));
ok("draft label uses --state-draft-text", /\.provenance-label[\s\S]*?color:\s*var\(--state-draft-text\)/.test(css));
ok("REGULATORY: the draft label is NEVER a ::before / generated content", !/provenance[^{]*::before/.test(css) && !/content\s*:/.test(css));

// ---- print: full token reset (criterion 19) --------------------------------
const printBlock = css.slice(css.indexOf("@media print"), css.indexOf("@media print") + 1600);
ok("print block resets both :root and the dark theme", /:root,\s*\n?\s*\[data-theme="dark"\]/.test(printBlock));
for (const t of ["--text-primary", "--text-secondary", "--text-tertiary", "--state-caution", "--state-draft", "--focus-ring", "--bg-page", "--border-control"]) {
  ok(`print resets ${t}`, new RegExp(`${t}:\\s*#`).test(printBlock));
}
ok("print forces color-scheme light", /@media print[\s\S]*?color-scheme:\s*light/.test(css));

console.log(`\na11y-tokens suite: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
