/* Continuum Prompt 58 (governing surface-standard number) / Prompt 54,
   Prompt 51 Design System, and Prompt 52 catalogue lineage.
   Still one linter. Prompt 58 comments remain: sections 0.2 + 11.10,
   acceptance criterion 16, plus criterion 24.
   Human copy review (Calliope): docs/prompts/51-design-system/HUMAN_COPY_REVIEW.md
   Extends the Prompt 41 section 0.3 regulatory list to tone.
   Scans the visible copy of the product surfaces (not the marketing landing,
   not the legal pages) plus the copy-bearing attributes, for:
     - REGULATORY (SaMD): the section 0.3 list. HARD FAIL. False positives are
       near zero; these must never appear in a label, tooltip, empty state or
       error.
     - TONE: the section 0.2 list, emoji, and exclamation marks in product copy.
       REPORTED for the section 11.7 human copy review, not auto-fixed here,
       because a linter catches literals not voice and live copy is a content
       decision.
     - WEEKDAY (criterion 24): Monday to Sunday and common abbreviations.
       HARD FAIL on this file walk, with the same data-board exemption.
   Prompt 52: also scans catalogue texts for REGULATORY (hard fail), TONE
   (hard fail on catalogue), first-person software voice, emoji including
   U+26A0, exclamation marks, and weekdays (hard fail unless board:true).
   Protected five must appear character for character. Board-sourced
   catalogue entries must have board:true.
   Board-sourced HTML strings are exempt when the element carries data-board
   (the marker section 0.2 requires; build it if absent).
   No network. No dashes anywhere. Run by node; the suites workflow globs it. */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  STRINGS,
  PROTECTED_IDS,
  boardMarkerAttribute,
} from "./strings/catalogue.mjs";

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
// Full names plus common abbreviations. Word-boundary match so "month" and
// "satisfaction" are not hits. Plurals (Mondays) are covered by the name.
const WEEKDAY_SRC = "monday|tuesday|wednesday|thursday|friday|saturday|sunday|mondays|tuesdays|wednesdays|thursdays|fridays|saturdays|sundays|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun";
const WEEKDAY_RE = new RegExp("\\b(" + WEEKDAY_SRC + ")\\b");
const WEEKDAY_RE_G = new RegExp("\\b(" + WEEKDAY_SRC + ")\\b", "g");

// Character-for-character lock. Duplicated here so an altered catalogue fails.
const PROTECTED_FIVE = [
  "You can say no. Your care will be exactly the same either way.",
  "Your employer would NEVER be shown: your diagnosis, your symptoms, your medications, or anything the doctor found on examination.",
  "Continuum shows you what work is safe. It does not tell you the worker's diagnosis, symptoms, medications or examination findings, and never will.",
  "In plain terms: the PHN box is filled in but the form says the worker has no PHN. One of the two has to change.",
  "This is recorded as your clinical judgement.",
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
// U+26A0 is emoji classified (Prompt 52 section 2.3) and is included.
const emojiRe = /[\u{1F300}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{2764}\u{2B50}\u{2705}\u{274C}\u{26A0}]/u;
// exclamation in visible text, not "!important" / "!=" (those live in code we stripped)
function exclamationHits(text) {
  return (text.match(/\S*!(?!important)/g) || []).filter((s) => !/^[!=<>]+$/.test(s));
}

const firstPersonI = /\bI(?:'ve|'m|'ll)?\b/i;
const softwareWe = /\bwe\b/i;

const reg = [], tone = [], emoji = [], excl = [], weekdays = [];
for (const f of files) {
  const html = readFileSync(join(here, f), "utf8");
  const { text, attrs } = visibleCopy(html);
  const hay = text + " \n " + attrs;
  for (const w of REGULATORY) if (hay.includes(w)) reg.push(`${f}: "${w}"`);
  for (const w of TONE) if (hay.includes(w)) tone.push(`${f}: "${w}"`);
  if (emojiRe.test(readFileSync(join(here, f), "utf8"))) emoji.push(f);
  const ex = exclamationHits(text);
  if (ex.length) excl.push(`${f}: ${ex.length} (${ex.slice(0, 3).join(", ")})`);
  WEEKDAY_RE_G.lastIndex = 0;
  const wd = hay.match(WEEKDAY_RE_G);
  if (wd && wd.length) weekdays.push(`${f}: ${[...new Set(wd)].join(", ")}`);
}

console.log(`scanned ${files.length} product surfaces`);
console.log(`REGULATORY hits: ${reg.length}`, reg.slice(0, 20));
console.log(`TONE hits: ${tone.length}`, tone.slice(0, 20));
console.log(`EMOJI files: ${emoji.length}`, emoji.slice(0, 20));
console.log(`EXCLAMATION files: ${excl.length}`, excl.slice(0, 20));
console.log(`WEEKDAY hits: ${weekdays.length}`, weekdays.slice(0, 20));

// HARD GATE: the SaMD regulatory list must be zero. These are false-positive
// safe and are the criterion 16 core.
ok("zero regulatory banned strings on product surfaces", reg.length === 0);

// ---- Prompt 52 catalogue scan (same linter, hard fail) --------------------
const catReg = [], catTone = [], catVoice = [], catEmoji = [], catExcl = [], catWeek = [];
for (const entry of STRINGS) {
  const hay = entry.text.toLowerCase();
  for (const w of REGULATORY) if (hay.includes(w)) catReg.push(`${entry.id}: "${w}"`);
  for (const w of TONE) if (hay.includes(w)) catTone.push(`${entry.id}: "${w}"`);
  if (firstPersonI.test(entry.text)) catVoice.push(`${entry.id}: first-person I`);
  if (softwareWe.test(entry.text) && entry.voice !== "legal" && entry.board !== true) {
    catVoice.push(`${entry.id}: software we`);
  }
  if (emojiRe.test(entry.text)) catEmoji.push(entry.id);
  const ex = exclamationHits(entry.text);
  if (ex.length) catExcl.push(`${entry.id}: ${ex.join(", ")}`);
  if (entry.board !== true) {
    WEEKDAY_RE_G.lastIndex = 0;
    const wd = hay.match(WEEKDAY_RE_G);
    if (wd && wd.length) catWeek.push(`${entry.id}: ${[...new Set(wd)].join(", ")}`);
  }
}

console.log(`catalogue entries: ${STRINGS.length}`);
console.log(`catalogue REGULATORY hits: ${catReg.length}`, catReg.slice(0, 20));
console.log(`catalogue TONE hits: ${catTone.length}`, catTone.slice(0, 20));
console.log(`catalogue first-person hits: ${catVoice.length}`, catVoice.slice(0, 20));
console.log(`catalogue EMOJI hits: ${catEmoji.length}`, catEmoji.slice(0, 20));
console.log(`catalogue EXCLAMATION hits: ${catExcl.length}`, catExcl.slice(0, 20));
console.log(`catalogue WEEKDAY hits: ${catWeek.length}`, catWeek.slice(0, 20));

ok("catalogue: zero regulatory banned strings", catReg.length === 0);
ok("catalogue: zero tone banned strings (hard fail)", catTone.length === 0);
ok("catalogue: no first-person software voice", catVoice.length === 0);
ok("catalogue: no emoji including U+26A0", catEmoji.length === 0);
ok("catalogue: no exclamation marks", catExcl.length === 0);
ok("catalogue: zero hard-coded weekdays unless board:true (criterion 24)", catWeek.length === 0);

for (const text of PROTECTED_FIVE) {
  const hit = STRINGS.find((e) => e.text === text);
  ok("protected five present character for character: " + text.slice(0, 40), Boolean(hit && hit.protected === true && hit.marker === "SPEC"));
}
ok("PROTECTED_IDS lists exactly the five protected entries", PROTECTED_IDS.length === 5);
ok(
  "every protected catalogue entry is in PROTECTED_IDS",
  STRINGS.filter((e) => e.protected).every((e) => PROTECTED_IDS.includes(e.id))
);

const boardVoiceBare = STRINGS.filter((e) => e.voice === "board" && e.board !== true);
const boardFlagBare = STRINGS.filter((e) => e.board === true && e.voice !== "board");
ok("board entries have board:true (self-check)", boardVoiceBare.length === 0 && boardFlagBare.length === 0);
ok("board marker attribute is data-board", boardMarkerAttribute() === "data-board");
ok(
  "board form band is marked board:true",
  STRINGS.some((e) => e.text === "Limited to, LIMITED (5 kg / 11 lb)" && e.board === true)
);

// self-test: the linter can actually catch a banned literal (prove the gate works)
{
  const probe = visibleCopy('<p>the smart automatic assessment predicted this</p>');
  const caught = REGULATORY.filter((w) => probe.text.includes(w));
  ok("linter catches a planted regulatory string (gate is live)", caught.length >= 3);
  const exempt = visibleCopy('<p data-board="C050E">Diagnosis: predicted onset!</p>');
  ok("board-marked copy is exempt (data-board blanks it)", !exempt.text.includes("predicted"));
  const plantedDay = visibleCopy("<p>Clinic hours Monday to Friday</p>");
  ok("linter catches a planted weekday (criterion 24 is live)", WEEKDAY_RE.test(plantedDay.text));
  const boardDay = visibleCopy('<p data-board="C050E">Monday clinic</p>');
  ok("board-marked weekday is exempt (data-board blanks it)", !WEEKDAY_RE.test(boardDay.text));
  const planted = { text: "oops predicted smart automatic assessment", voice: "software", board: false, id: "probe" };
  const plantedReg = REGULATORY.filter((w) => planted.text.includes(w));
  const plantedTone = TONE.filter((w) => planted.text.includes(w));
  ok("catalogue scanner catches a planted regulatory string", plantedReg.length >= 2);
  ok("catalogue scanner catches a planted tone string", plantedTone.length >= 1);
  const plantedCatDay = { text: "see you monday", board: false };
  WEEKDAY_RE_G.lastIndex = 0;
  ok("catalogue scanner catches a planted weekday", WEEKDAY_RE.test(plantedCatDay.text) === true);
}

ok("zero hard-coded weekdays on product surfaces (criterion 24)", weekdays.length === 0);
if (weekdays.length) weekdays.forEach((w) => console.error("  " + w));

console.log(`\nbanned-string suite: ${pass} passed, ${fail} failed`);
console.log("(HTML TONE/EMOJI/EXCLAMATION are reported for the section 11.7 human copy review, not build-failing. Catalogue tone, voice, emoji, exclamation and weekday are hard fail.)");
console.log("(Human copy review: docs/prompts/51-design-system/HUMAN_COPY_REVIEW.md)");
process.exit(fail ? 1 : 0);
