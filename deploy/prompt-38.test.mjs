/* Continuum Prompt 38 probe (Garda meeting additions list). node deploy/prompt-38.test.mjs
   Locks the sixteen additions with their priorities and lanes, the redefined
   pilot facts, the reconciliations, and the two honesty-scoped commitments, so
   the additions list cannot silently lose an item or a scope. Hard-fail; no
   em-dashes anywhere. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const s = readFileSync(join(dir, "..", "specs", "CONTINUUM_PROMPT_38.md"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// header and frame
ok("companion is Prompt 38, the Garda additions list", s.includes("# CONTINUUM PROMPT 38: The Garda Meeting Additions List"));
ok("dated July 23, 2026", s.includes("**Date:** July 23, 2026"));

// the sixteen additions, each with its priority
const ITEMS = [
  ["P38-01", "Division-aware tenant model", "Priority 1"],
  ["P38-02", "Hybrid role access", "Priority 1"],
  ["P38-03", "Objective-first check-in configuration", "Priority 1"],
  ["P38-04", "MSK eligibility scope", "Priority 1"],
  ["P38-05", "Post-Form-7 intake trigger", "Priority 1"],
  ["P38-06", "Per-worker document archive", "Priority 1"],
  ["P38-07", "Universal modified duties offer", "Priority 2"],
  ["P38-08", "Division-specific duty libraries", "Priority 2"],
  ["P38-09", "Check-in lapse nudges", "Priority 2"],
  ["P38-10", "Physician summary view", "Priority 2"],
  ["P38-11", "White-label theming", "Priority 2"],
  ["P38-12", "Alberta portal-assist ingestion", "Priority 2"],
  ["P38-13", "Nexus Health handoff seam", "Priority 3"],
  ["P38-14", "Pilot metering and live ROI view", "Priority 2"],
  ["P38-15", "Consent alignment", "Priority 1"],
  ["P38-16", "Naming, corrected and pending", "Priority 3"],
];
ITEMS.forEach(([id, title, pri]) => {
  ok(id + " present with its title", s.includes("**" + id + ". " + title + "."));
  const line = (s.match(new RegExp("\\*\\*" + id + "\\.[^\\n]*", "")) || [""])[0];
  ok(id + " carries " + pri, line.includes(pri));
});
ok("exactly sixteen numbered additions", (s.match(/\*\*P38-\d\d\. /g) || []).length === 16);

// the four Priority 1 build-queue seeds sequenced ahead of the pilot (P38-01..06 minus counsel item 15)
["P38-01", "P38-02", "P38-03", "P38-04", "P38-05", "P38-06"].forEach(id => {
  const line = (s.match(new RegExp("\\*\\*" + id + "\\.[^\\n]*", "")) || [""])[0];
  ok(id + " is a build queue item", line.includes("build queue"));
});
ok("P38-15 consent is the counsel lane", /\*\*P38-15\.[^\n]*counsel/.test(s));

// the redefined pilot, plan of record
ok("pilot is 90 day MSK-only, one Ontario division", s.includes("90 day MSK-only pilot in one Ontario division"));
ok("no pilot start date was specified", s.includes("no start date was specified in the meeting"));
ok("the July 23 start date is retired", s.includes("the July 23 date belongs to the old plan and is retired"));
ok("Quebec is out of pilot scope", s.includes("Quebec is out of pilot scope"));
ok("Continuum enters after the employer report is filed", s.includes("Continuum begins after the employer report (Form 7 or provincial equivalent) is submitted to the board"));
ok("decision runs Angelina to Andree-Anne", s.includes("Angelina presenting to Andree-Anne"));
ok("pricing is cost per event, no user cap", s.includes("cost per event") && s.includes("no user cap") && s.includes("no per user fees"));

// the two honesty-scoped commitments must stay flagged
ok("P38-08 warns against repeating the already-built duty database claim", s.includes("nobody repeats \"thousands of duties, already in the database\" to Garda"));
ok("P38-12 keeps the no-retrieval-API truth", s.includes("no Canadian board publishes a retrieval API") && s.includes("without claiming machine retrieval that does not exist"));
ok("section 4 names both room commitments needing scoping", s.includes("## 4. Room commitments needing scoping before anyone repeats them") && s.includes("P38-08") && s.includes("P38-12"));

// the wall reconciliation holds
ok("employer wall stands: pain to clinician, functional to the hybrid seat", s.includes("the employer wall stands word for word"));
ok("movement analysis is a guarded flag, off, staged", s.includes("guarded flag, off") && s.includes("built, gated, and switched on"));

// naming correction
ok("GardaWorld in documents, Garda in speech; Garta is a transcription error", s.includes("The company is GardaWorld") && s.includes("transcription error"));

// register law
ok("companion dash clean", !/[‒–—―−]/.test(s));

console.log("\nprompt-38 suite: " + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
