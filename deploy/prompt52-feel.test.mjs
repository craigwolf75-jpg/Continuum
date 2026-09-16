/* Prompt 52 feel honesty gate. Checks Prompt 52 docs and catalogue shape.
   This is not a second banned-string linter. The string linter remains
   deploy/banned-strings.test.mjs. No em dashes or en dashes anywhere. */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, dirname, join } from "node:path";
import {
  STRINGS,
  PROTECTED_IDS,
  getString,
  getEntry,
  listByScreen,
  listBySurface,
  boardMarkerAttribute,
} from "./strings/catalogue.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const throws = (fn, code) => { try { fn(); return false; } catch (e) { return !code || e.code === code; } };

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const docs52 = join(root, "docs/prompts/52");
const cataloguePath = join(here, "strings/catalogue.mjs");
const linterPath = join(here, "banned-strings.test.mjs");
const feelPath = join(here, "prompt52-feel.test.mjs");

function walk(dir, pred) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, pred));
    else if (!pred || pred(p)) out.push(p);
  }
  return out;
}

function read(p) {
  return readFileSync(p, "utf8");
}

const SKIP_FEEL_MARKERS = new Set(["SECTION_1.md", "STOPS.md", "ACCEPTANCE.md", "PRIORITY.md"]);
const FORBIDDEN = ["collapses 66 fields", "straight to signature", "Two fields touched"];
const DASH_RE = /[\u2013\u2014]/;
const MARKER_RE = /\[SPEC\]|\[NEW\]|\[CHANGE\]/;
const OVERRIDE_RE = /overrid|correcting|extending/i;
const NEW_SCREEN_RE = /SCR-(COORD|OWNER)-/;

const section1Path = join(docs52, "SECTION_1.md");
const stopsPath = join(docs52, "STOPS.md");
const voicePath = join(docs52, "VOICE.md");

ok("docs/prompts/52/SECTION_1.md exists", existsSync(section1Path));
const section1 = existsSync(section1Path) ? read(section1Path) : "";
ok("SECTION_1 contains UNVERIFIED", section1.includes("UNVERIFIED"));
ok("SECTION_1 contains Check 8", section1.includes("Check 8"));

ok("docs/prompts/52/STOPS.md exists", existsSync(stopsPath));
const stops = existsSync(stopsPath) ? read(stopsPath) : "";
ok("STOPS mentions authentication unverified", /authentication/i.test(stops) && /unverified/i.test(stops));
ok("STOPS mentions coordinator dashboard has no screen ID", /coordinator(?: daily)? dashboard has no screen ID/i.test(stops));

ok("docs/prompts/52/VOICE.md exists", existsSync(voicePath));
if (!existsSync(voicePath)) {
  ok("VOICE.md not yet (Calliope)", false);
}

const mdFiles = walk(docs52, (p) => p.endsWith(".md"));
for (const p of mdFiles) {
  const name = basename(p);
  const text = read(p);
  if (SKIP_FEEL_MARKERS.has(name)) continue;
  ok(name + " describes screen feel and carries [SPEC] or [NEW] or [CHANGE]", MARKER_RE.test(text));
  if (/\[CHANGE\]/.test(text)) {
    ok(name + " [CHANGE] names an override", OVERRIDE_RE.test(text));
  }
}

const optionalFeel = ["FRICTION.md", "PRIORITY.md"];
for (const name of optionalFeel) {
  const p = join(docs52, name);
  if (!existsSync(p)) continue;
  const text = read(p);
  if (name === "PRIORITY.md") {
    ok("PRIORITY.md exists and does not invent a coordinator screen id", !NEW_SCREEN_RE.test(text));
    continue;
  }
  ok(name + " exists and carries authorship markers", MARKER_RE.test(text));
}

const dashTargets = [
  ...mdFiles,
  cataloguePath,
  linterPath,
  feelPath,
];
let dashHit = "";
for (const p of dashTargets) {
  if (!existsSync(p)) continue;
  if (DASH_RE.test(read(p))) {
    dashHit = p;
    break;
  }
}
ok("no U+2013 or U+2014 in Prompt 52 docs, catalogue, or these two tests", dashHit === "");

ok("getString throws on unknown id", throws(() => getString("no.such.string.id"), "STRING-UNKNOWN"));
ok(
  "getString returns Consent A exactly",
  getString("consent.say_no") === "You can say no. Your care will be exactly the same either way."
);
ok(
  "getString returns Consent B exactly",
  getString("consent.employer_never_shown") === "Your employer would NEVER be shown: your diagnosis, your symptoms, your medications, or anything the doctor found on examination."
);
ok(
  "getString returns employer wall exactly",
  getString("employer.privacy_wall") === "Continuum shows you what work is safe. It does not tell you the worker's diagnosis, symptoms, medications or examination findings, and never will."
);
ok(
  "getString returns PHN plain terms exactly",
  getString("rejection.phn_inconsistency") === "In plain terms: the PHN box is filled in but the form says the worker has no PHN. One of the two has to change."
);
ok(
  "getString returns clinical judgement exactly",
  getString("measurement.clinical_judgement") === "This is recorded as your clinical judgement."
);
ok("PROTECTED_IDS has five ids", PROTECTED_IDS.length === 5);
ok("getEntry returns the Consent A entry", getEntry("consent.say_no") && getEntry("consent.say_no").protected === true);
ok("getEntry is undefined for an unknown id", getEntry("no.such.string.id") === undefined);
ok("listBySurface(worker) is non-empty", listBySurface("worker").length > 0);
ok("listByScreen(none) includes the coordinator empty example", listByScreen("none").some((e) => e.id === "coordinator.empty_rejections"));
ok("boardMarkerAttribute returns data-board", boardMarkerAttribute() === "data-board");
ok("STRINGS is frozen", Object.isFrozen(STRINGS));
ok("catalogue has no invented coordinator or owner screen id", STRINGS.every((e) => !NEW_SCREEN_RE.test(e.screen)));

const catalogueSrc = read(cataloguePath);
let forbiddenDoc = "";
for (const phrase of FORBIDDEN) {
  if (catalogueSrc.includes(phrase) || STRINGS.some((e) => e.text.includes(phrase))) {
    forbiddenDoc = "catalogue:" + phrase;
    break;
  }
}
for (const p of mdFiles) {
  if (forbiddenDoc) break;
  const text = read(p);
  for (const phrase of FORBIDDEN) {
    let idx = 0;
    while ((idx = text.indexOf(phrase, idx)) !== -1) {
      const ctx = text.slice(Math.max(0, idx - 120), idx + phrase.length + 120);
      if (!/refut|errata|fix those|wireframe 5\.8|journey 6\.3/i.test(ctx)) {
        forbiddenDoc = basename(p) + ":" + phrase;
        break;
      }
      idx += phrase.length;
    }
    if (forbiddenDoc) break;
  }
}
ok("forbidden follow-up phrases are absent as product claims", forbiddenDoc === "");

let assignedNewId = "";
for (const p of mdFiles) {
  const text = read(p);
  if (NEW_SCREEN_RE.test(text)) {
    assignedNewId = basename(p);
    break;
  }
}
ok("no Prompt 52 file assigns SCR-COORD or SCR-OWNER as a screen id", assignedNewId === "");

const htmlUnder52 = walk(docs52, (p) => p.endsWith(".html"));
ok("docs/prompts/52 does not add product html pages", htmlUnder52.length === 0);

const stringTree = readdirSync(join(here, "strings"));
ok(
  "deploy/strings holds only the catalogue module tree",
  stringTree.every((name) => name.endsWith(".mjs")) && stringTree.includes("catalogue.mjs")
);

const productHtml = readdirSync(here).filter((f) => f.endsWith(".html"));
let inventedHtml = "";
for (const f of productHtml) {
  const html = read(join(here, f));
  if (/Prompt 52/.test(html) && /SCR-/.test(html.slice(0, 800))) {
    inventedHtml = f;
    break;
  }
}
ok("prompt 52 files did not add a new deploy html product page", inventedHtml === "");

console.log(`\nprompt52 feel suite: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
