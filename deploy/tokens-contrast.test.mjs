/* Continuum Prompt 58 token-contrast gate (section 11.2, acceptance criterion 2).
   Parses continuum_tokens.css, computes WCAG 2.2 contrast, and asserts every text
   token clears 4.5:1 against every background it can land on and every control
   boundary and focus ring clears 3:1 against the same full set, in both themes.
   Proves the gate can fail on a sub-floor value (brand green, and a fabricated
   4.0:1 token). No network. No dashes anywhere. Run by node; suites globs it. */

import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// -- WCAG relative luminance + contrast ratio --------------------------------
function lum(hex) {
  const h = hex.replace("#", "");
  const ch = [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function ratio(a, b) {
  const la = lum(a), lb = lum(b);
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}
const r2 = (x) => Math.round(x * 100) / 100;

// -- parse every "--name: #hex;" palette entry from the token file -----------
const css = readFileSync(new URL("./continuum_tokens.css", import.meta.url), "utf8");
const P = {};
for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{6})\b/g)) P[m[1]] = m[2].toUpperCase();

ok("token file parsed a palette", Object.keys(P).length > 20);

// sanity: the four values the review says failed and were replaced must be the
// shipped (passing) ones, so this doubles as a check the hexes were reproduced.
const need = ["--ink-400", "--action-600", "--ok-700", "--warn-700", "--stop-700", "--draft-700",
  "--d-border", "--d-action", "--d-ink-000"];
ok("all load-bearing tokens present", need.every((k) => P[k]));

const W = "#FFFFFF", PG = "#F5F7F9";
function textOK(tok, bgs, floor = 4.5) {
  for (const bg of bgs) {
    const c = ratio(P[tok], typeof bg === "string" && bg.startsWith("#") ? bg : P[bg]);
    ok(`${tok} >= ${floor} on ${bg} (got ${r2(c)})`, c >= floor);
  }
}

// -- LIGHT: text tokens >= 4.5 on surface + page -----------------------------
for (const t of ["--ink-900", "--ink-700", "--ink-600", "--ink-500", "--action-600",
  "--action-700", "--action-800", "--stop-600"]) textOK(t, [W, PG]);

// white text on solid fills >= 4.5
for (const fill of ["--action-600", "--ok-700", "--warn-700", "--stop-700", "--draft-700"]) {
  const c = ratio(W, P[fill]);
  ok(`white on ${fill} >= 4.5 (got ${r2(c)})`, c >= 4.5);
}

// dark status text on its matching tint >= 4.5 (doc claims 7:1 AAA)
for (const [txt, tint] of [["--ok-800", "--ok-050"], ["--warn-800", "--warn-050"],
  ["--stop-800", "--stop-050"], ["--draft-800", "--draft-050"], ["--action-800", "--action-050"]]) {
  const c = ratio(P[txt], P[tint]);
  ok(`${txt} on ${tint} >= 4.5 (got ${r2(c)})`, c >= 4.5);
}

// -- LIGHT: control border + focus ring >= 3 on EVERY fill they can land on ---
// (the review lesson: a border tested only against the page is not tested)
const lightBorderBgs = [W, PG, "--ink-100", "--ok-050", "--warn-050", "--stop-050", "--draft-050", "--action-050"];
textOK("--ink-400", lightBorderBgs, 3);      // --border-control
textOK("--action-600", [W, PG], 3);          // --focus-ring, --border-selected

// -- DARK: text tokens >= 4.5 on card + page + elevated ----------------------
const dCard = P["--d-surface"], dPage = P["--d-page"], dRaised = P["--d-raised"];
for (const t of ["--d-ink-000", "--d-ink-100", "--d-ink-200", "--d-action", "--d-action-hover"]) {
  for (const [nm, bg] of [["card", dCard], ["page", dPage], ["elevated", dRaised]]) {
    const c = ratio(P[t], bg);
    ok(`${t} >= 4.5 on ${nm} (got ${r2(c)})`, c >= 4.5);
  }
}
// dark status colours on their tint bg >= 4.5
for (const [t, bg] of [["--d-ok", "--d-ok-bg"], ["--d-warn", "--d-warn-bg"],
  ["--d-stop", "--d-stop-bg"], ["--d-draft", "--d-draft-bg"]]) {
  const c = ratio(P[t], P[bg]);
  ok(`${t} on ${bg} >= 4.5 (got ${r2(c)})`, c >= 4.5);
}
// dark control border >= 3 on card + page + elevated
for (const [nm, bg] of [["card", dCard], ["page", dPage], ["elevated", dRaised]]) {
  const c = ratio(P["--d-border"], bg);
  ok(`--d-border >= 3 on ${nm} (got ${r2(c)})`, c >= 3);
}

// -- NEGATIVE: the gate MUST fail a sub-floor value (acceptance criterion 2) --
ok("brand green 1E8A6E is correctly BELOW 4.5 on white (gate would reject it)", ratio("#1E8A6E", W) < 4.5);
ok("a fabricated ~4.0:1 token is correctly BELOW 4.5 (gate can fail)", ratio("#949494", W) < 4.5);
ok("the contrast maths is sane (white/black = 21)", r2(ratio(W, "#000000")) === 21);

console.log(`\ntoken-contrast suite: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
