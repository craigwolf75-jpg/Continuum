/* Continuum Prompt 44, AI-04 axis relevance suite. Proves AI-04 proposes axis names only and
   structurally cannot return a value (acceptance criterion 1), that an unmapped region opens
   all axes (Section 2.1), that a mapped region narrows to a validated subset, and that AI-04
   writes nothing to a report field. No dashes anywhere. */

import { FUNCTIONAL_AXES } from "./ai_axis_relevance.data.mjs";
import { proposeAxes, assertAxesOnly, writesReportField } from "./ai_axis_relevance.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const threw = (fn) => { try { fn(); return null; } catch (e) { return e.code || "threw"; } };
const AXIS_SET = new Set(FUNCTIONAL_AXES);

// -- criterion 1: the return type can carry ONLY axis names -------------------
ok("assertAxesOnly accepts a list of known axes", (() => { try { assertAxesOnly(["walking", "sitting"]); return true; } catch { return false; } })());
ok("assertAxesOnly rejects a capability word (a value)", threw(() => assertAxesOnly(["walking", "limited"])) === "AI04-VALUE-LEAK");
ok("assertAxesOnly rejects a quantity (a number)", threw(() => assertAxesOnly(["8"])) === "AI04-VALUE-LEAK");
ok("assertAxesOnly rejects a unit (kg / hrs)", threw(() => assertAxesOnly(["5 kg"])) === "AI04-VALUE-LEAK" && threw(() => assertAxesOnly(["4 hrs"])) === "AI04-VALUE-LEAK");
ok("assertAxesOnly rejects an unknown axis name", threw(() => assertAxesOnly(["fly"])) === "AI04-VALUE-LEAK");
ok("assertAxesOnly rejects a non array", threw(() => assertAxesOnly("walking")) === "AI04-NOT-AN-ARRAY");

// -- an unmapped region opens ALL axes (safe, never a guess) -----------------
{
  const r = proposeAxes("eyebrow", "laceration");
  ok("an unmapped part opens all axes", r.opened_all === true && r.matched === false && r.axes.length === FUNCTIONAL_AXES.length);
  ok("the all axes result is exactly the vocabulary", r.axes.every((a) => AXIS_SET.has(a)) && new Set(r.axes).size === FUNCTIONAL_AXES.length);
}

// -- a mapped region narrows to a validated subset ---------------------------
{
  const r = proposeAxes("Shoulder", null);
  ok("a mapped part narrows and is flagged matched, not opened_all", r.matched === true && r.opened_all === false && r.axes.length > 0 && r.axes.length < FUNCTIONAL_AXES.length);
  ok("a mapped subset contains only known axes and includes overhead reaching", r.axes.every((a) => AXIS_SET.has(a)) && r.axes.includes("overhead_reaching"));
  ok("matching is case insensitive", proposeAxes("SHOULDER", null).axes.length === r.axes.length);
}

// -- every proposeAxes result passes the axes only guarantee -----------------
{
  const cases = [["shoulder", null], ["low back", "strain"], ["hand", null], ["knee", null], ["unmapped", "x"]];
  ok("every proposeAxes result carries only axis names (no value ever leaks)", cases.every(([p, n]) => {
    const r = proposeAxes(p, n);
    try { assertAxesOnly(r.axes); return true; } catch { return false; }
  }));
  ok("no proposeAxes result carries a capability or a number", cases.every(([p, n]) => proposeAxes(p, n).axes.every((a) => !/able|unable|limited|\d/.test(a))));
}

// -- reasoning and the advisory contract -------------------------------------
ok("proposeAxes explains itself (reasoning present)", typeof proposeAxes("shoulder", null).reasoning === "string" && proposeAxes("shoulder", null).reasoning.length > 0);
ok("the starter map is flagged not clinically signed off", proposeAxes("shoulder", null).clinically_signed_off === false);
ok("AI-04 writes nothing to a report field (advisory, Section 2.2)", writesReportField() === false);

console.log("\nAI-04 axis relevance suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
