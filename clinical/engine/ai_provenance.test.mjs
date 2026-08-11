/* Continuum Prompt 44, provenance and session isolation suite. Proves a model response can
   never be written provenance human (acceptance criterion 2), that system is permitted only on
   a non clinical field (Section 3), that an untouched ai_draft field blocks signature (criterion
   3), and that a generation whose scope is not its case is refused (criterion 4). No dashes. */

import { checkWriteProvenance, assertWriteProvenance, blocksSignature, untouchedAiDraftFields, assertSessionScope } from "./ai_provenance.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const threw = (fn) => { try { fn(); return null; } catch (e) { return e.code || "threw"; } };

// -- criterion 2: a model response can never be written provenance human -----
ok("the model service claiming human is rejected 422", (() => { const r = checkWriteProvenance({ source: "model_service", provenance: "human", is_clinical: true }); return r.ok === false && r.status === 422 && r.code === "PROVENANCE-MODEL-CLAIMS-HUMAN"; })());
ok("assertWriteProvenance throws a 422 tagged error for model human", (() => { try { assertWriteProvenance({ source: "model_service", provenance: "human" }); return false; } catch (e) { return e.status === 422 && e.code === "PROVENANCE-MODEL-CLAIMS-HUMAN"; } })());
ok("the model service may write ai_draft", checkWriteProvenance({ source: "model_service", provenance: "ai_draft", is_clinical: true }).ok === true);
ok("the model service may not write carried_forward or ai_draft_edited", checkWriteProvenance({ source: "model_service", provenance: "carried_forward" }).status === 422 && checkWriteProvenance({ source: "model_service", provenance: "ai_draft_edited" }).status === 422);
ok("a human source may write human", checkWriteProvenance({ source: "human", provenance: "human", is_clinical: true }).ok === true);

// -- system provenance only on a non clinical field (Section 3) --------------
ok("system on a clinical field is rejected 422", checkWriteProvenance({ source: "system", provenance: "system", is_clinical: true }).status === 422);
ok("system on a non clinical field is allowed", checkWriteProvenance({ source: "system", provenance: "system", is_clinical: false }).ok === true);

// -- unknown provenance ------------------------------------------------------
ok("an unknown provenance value is rejected 422", checkWriteProvenance({ source: "model_service", provenance: "magic" }).status === 422);

// -- criterion 3: an untouched ai_draft field blocks signature ---------------
{
  const fields = [{ provenance: "human" }, { provenance: "ai_draft_edited" }, { provenance: "ai_draft" }, { provenance: "carried_forward" }];
  ok("one untouched ai_draft field blocks signature", blocksSignature(fields) === true && untouchedAiDraftFields(fields).length === 1);
  ok("ai_draft_edited (a human touched it) does not block", blocksSignature([{ provenance: "human" }, { provenance: "ai_draft_edited" }]) === false);
  ok("no fields does not block", blocksSignature([]) === false);
}

// -- criterion 4: a generation whose scope is not its case is refused --------
ok("a matching session scope passes", assertSessionScope({ case_id: "case-1", session_scope_case_id: "case-1" }) === true);
ok("a mismatched session scope throws (isolation breach)", threw(() => assertSessionScope({ case_id: "case-1", session_scope_case_id: "case-2" })) === "AI-SESSION-ISOLATION");
ok("a missing scope throws (a component that cannot supply the scope does not run)", threw(() => assertSessionScope({ case_id: "case-1" })) === "AI-SESSION-SCOPE-MISSING");

console.log("\nprovenance and session isolation suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
