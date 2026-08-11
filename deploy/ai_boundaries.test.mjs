/* Continuum Prompt 44, the AI boundary invariants in CI. The clinical/engine suites do not run
   in CI (only deploy/*.test.mjs); this runs the four boundary invariants that must never
   regress: AI-04 returns axis names only and cannot carry a value (criterion 1), a model
   response can never be written provenance human (criterion 2), an untouched ai_draft blocks
   signature (criterion 3), and a generation whose scope is not its case is refused (criterion
   4). No inference provider is involved. No dashes anywhere. */

import { proposeAxes, assertAxesOnly } from "../clinical/engine/ai_axis_relevance.mjs";
import { checkWriteProvenance, blocksSignature, assertSessionScope } from "../clinical/engine/ai_provenance.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const threw = (fn) => { try { fn(); return null; } catch (e) { return e.code || "threw"; } };

// criterion 1: axis names only, cannot carry a value
{
  const mapped = proposeAxes("shoulder", null), unmapped = proposeAxes("nowhere", "x");
  ok("criterion 1: AI-04 returns axis names only and an unmapped region opens all axes", (() => {
    try { assertAxesOnly(mapped.axes); assertAxesOnly(unmapped.axes); } catch { return false; }
    return unmapped.opened_all === true && mapped.axes.every((a) => !/able|unable|limited|\d|kg|hrs/.test(a));
  })());
  ok("criterion 1: a value can never be returned as an axis", threw(() => assertAxesOnly(["overhead_reaching", "5 kg"])) === "AI04-VALUE-LEAK");
}

// criterion 2: a model response can never be provenance human
ok("criterion 2: the model service claiming provenance human is rejected 422", (() => { const r = checkWriteProvenance({ source: "model_service", provenance: "human", is_clinical: true }); return r.ok === false && r.status === 422; })());

// criterion 3: an untouched ai_draft blocks signature
ok("criterion 3: one untouched ai_draft field blocks signature", blocksSignature([{ provenance: "human" }, { provenance: "ai_draft" }]) === true && blocksSignature([{ provenance: "human" }]) === false);

// criterion 4: a generation whose scope is not its case is refused
ok("criterion 4: a mismatched session scope is refused", threw(() => assertSessionScope({ case_id: "a", session_scope_case_id: "b" })) === "AI-SESSION-ISOLATION");

console.log("\nAI boundary invariants suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
