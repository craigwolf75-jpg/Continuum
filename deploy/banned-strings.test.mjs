/* Continuum Prompt 58 banned-string linter (sections 0.2 + 11.10, acceptance
   criterion 16). Extends the Prompt 41 section 0.3 regulatory list to tone.
   Scans the visible copy of the product surfaces (not the marketing landing,
   not the legal pages) plus the copy-bearing attributes, for:
     - REGULATORY (SaMD): the section 0.3 list. HARD FAIL. False positives are
       near zero; these must never appear in a label, tooltip, empty state or
       error.
     - TONE: the section 0.2 list, emoji, and exclamation marks in product copy.
       REPORTED for the section 11.7 human copy review, not auto-fixed here,
       because a linter catches literals not voice and live copy is a content
       decision.
   Board-sourced strings are exempt when the element carries data-board (the
   marker section 0.2 requires; build it if absent).
   No network. No dashes anywhere. Run by node; the suites workflow globs it. */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const here = dirname(fileURLToPath(import.meta.url));

// Product surfaces. NOT index.html (marketing register), NOT privacy/terms
// (legal text), NOT 404. Everything else a role actually operates in.
const EXCLUDE = new Set(["index.html", "privacy.html", "terms.html", "404.html"]);
const files = readdirSync(here).filter((f) => f.endsWith(".html") && !EXCLUDE.has(f));

// ---- the two lists ---------------------------------------------------------
const REGULATORY = [
  "predicted", "suggested diagnosis", "recommended restriction",
  "smart", "automatic assessment", "ai decided",
];
const TONE = [
  "oops", "whoops", "great job", "nice work", "awesome", "you're all set",
  "hang tight", "just a sec", "i've saved", "let me check",
];

// Extract visible text: drop <script> and <style> blocks, then strip tags, and
// separately pull copy-bearing attribute values (placeholder/title/alt/aria-label).
function visibleCopy(html) {
  const noCode = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const attrs = [];
  for (const m of noCode.matchAll(/\b(?:placeholder|title|alt|aria-label)\s*=\s*"([^"]*)"/gi)) attrs.push(m[1]);
  // board-marked elements are exempt: blank out any element carrying data-board
  const noBoard = noCode.replace(/<[^>]*\bdata-board\b[^>]*>[\s\S]*?<\/[a-zA-Z0-9]+>/g, " ");
  const text = noBoard.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ");
  return { text: text.toLowerCase(), attrs: attrs.join(" \n ").toLowerCase(), raw: noBoard };
}

// Unambiguous pictographic emoji only. Arrows and dingbats (U+2190-27BF) are
// common UI glyphs, not emoji, and are deliberately not flagged here.
const emojiRe = /[\u{1F300}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{2764}\u{2B50}\u{2705}\u{274C}]/u;
// exclamation in visible text, not "!important" / "!=" (those live in code we stripped)
function exclamationHits(text) {
  return (text.match(/\S*!(?!important)/g) || []).filter((s) => !/^[!=<>]+$/.test(s));
}

const reg = [], tone = [], emoji = [], excl = [];
for (const f of files) {
  const html = readFileSync(join(here, f), "utf8");
  const { text, attrs } = visibleCopy(html);
  const hay = text + " \n " + attrs;
  for (const w of REGULATORY) if (hay.includes(w)) reg.push(`${f}: "${w}"`);
  for (const w of TONE) if (hay.includes(w)) tone.push(`${f}: "${w}"`);
  if (emojiRe.test(readFileSync(join(here, f), "utf8"))) emoji.push(f);
  const ex = exclamationHits(text);
  if (ex.length) excl.push(`${f}: ${ex.length} (${ex.slice(0, 3).join(", ")})`);
}

console.log(`scanned ${files.length} product surfaces`);
console.log(`REGULATORY hits: ${reg.length}`, reg.slice(0, 20));
console.log(`TONE hits: ${tone.length}`, tone.slice(0, 20));
console.log(`EMOJI files: ${emoji.length}`, emoji.slice(0, 20));
console.log(`EXCLAMATION files: ${excl.length}`, excl.slice(0, 20));

// HARD GATE: the SaMD regulatory list must be zero. These are false-positive
// safe and are the criterion 16 core.
ok("zero regulatory banned strings on product surfaces", reg.length === 0);

// self-test: the linter can actually catch a banned literal (prove the gate works)
{
  const probe = visibleCopy('<p>the smart automatic assessment predicted this</p>');
  const caught = REGULATORY.filter((w) => probe.text.includes(w));
  ok("linter catches a planted regulatory string (gate is live)", caught.length >= 3);
  const exempt = visibleCopy('<p data-board="C050E">Diagnosis: predicted onset!</p>');
  ok("board-marked copy is exempt (data-board blanks it)", !exempt.text.includes("predicted"));
}

console.log(`\nbanned-string suite: ${pass} passed, ${fail} failed`);
console.log("(TONE/EMOJI/EXCLAMATION are reported for the section 11.7 human copy review, not build-failing yet)");
process.exit(fail ? 1 : 0);
