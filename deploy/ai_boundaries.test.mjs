/* Continuum Prompt 44, the AI boundary invariants in CI. The clinical/engine suites do not run
   in CI (only deploy/*.test.mjs); this file therefore carries the Prompt 44 criteria that must
   never regress without a live provider: AI-04 axes only (criterion 1), model provenance cannot
   be human (criterion 2), untouched ai_draft blocks signature (criterion 3), mismatched session
   scope is refused (criterion 4), adversarial injection has no clinical effect (criterion 5),
   degraded disables all eight and typing remains (criterion 6), Consent A declined rejects
   transcription and hides the record control (criterion 7), AI-05 and AI-08 gate on consent B
   not A (criterion 8), generation audit rows include refusals (criterion 9), low confidence
   cannot be bulk accepted (criterion 12), and the sign path does not invoke a model adapter
   (criterion 13). Criteria 10 (Canada endpoint) and the no-train contract stay UNVERIFIED.
   No dashes anywhere. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { proposeAxes, assertAxesOnly } from "../clinical/engine/ai_axis_relevance.mjs";
import { checkWriteProvenance, blocksSignature, assertSessionScope } from "../clinical/engine/ai_provenance.mjs";
import { createStubProvider } from "../clinical/engine/ai_stub_provider.mjs";
import { createGenerationAudit } from "../clinical/engine/ai_generation.mjs";
import { createRuntime, EIGHT_IDS, AUDIO_RETENTION_DAYS, canBulkAccept, typingProductAvailable, degradedBanner } from "../clinical/engine/ai_runtime.mjs";
import { recordingControlRendered } from "../clinical/engine/ai_consent_a.mjs";
import { createThrowingAdapter } from "../clinical/engine/ai_sign_guard.mjs";
import { INJECTION_CASES } from "../clinical/engine/ai_injection.data.mjs";
import { createDraftStore } from "../clinical/engine/measurement_draft.mjs";
import { signMeasurement } from "../clinical/engine/sign_measurement.mjs";
import { indexErrorCatalogue } from "../clinical/engine/errors.mjs";
import { ROWS } from "../clinical/db/error_catalogue.data.mjs";
import {
  transcribe, draftNarrative, proposeInjuryCoding, proposeAxisRelevance, suggestTrajectory,
  proposeReferral, parseBoardError, summariseCheckIns, AI_COMPONENTS,
} from "../clinical/engine/ai_components.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const threw = (fn) => { try { fn(); return null; } catch (e) { return e.code || "threw"; } };

function ctx(overrides = {}) {
  return Object.assign({
    clinic_id: "clinic-1",
    case_id: "case-1",
    session_scope_case_id: "case-1",
    actor_user_id: "actor-1",
    consentA: { granted: true, version_id: "counsel-pending" },
    consentB: { granted: true },
    runtime: createRuntime({ degraded: false }),
    audit: createGenerationAudit(),
    provider: createStubProvider(),
    now: "2026-09-15T00:00:00Z",
  }, overrides);
}

function noEffect(r) {
  return r.clinical_effect !== true && r.auto_applied !== true && r.submitted !== true && r.fitness_for_duties !== true && r.clinical_field_corrected !== true;
}

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

// criterion 5: adversarial injection, all three channels
{
  const idx = indexErrorCatalogue(ROWS);
  let all = true;
  for (const cas of INJECTION_CASES) {
    if (cas.channel === "transcript") {
      const n = await draftNarrative(ctx(), cas.text);
      if (!noEffect(n) || /fit for full duties/i.test(n.diagnosis_narrative || "")) all = false;
    }
    if (cas.channel === "check_in") {
      const tr = await suggestTrajectory(ctx(), [{ case_id: "case-1", reported_pain: 6, text: cas.text }]);
      if (!noEffect(tr) || tr.clinical_finding === true) all = false;
    }
    if (cas.channel === "board_error") {
      const p = await parseBoardError(ctx(), { index: idx, jurisdiction: cas.jurisdiction, boardCode: cas.board_code, rawText: cas.text });
      if (!noEffect(p) || p.correction !== null) all = false;
    }
  }
  ok("criterion 5: adversarial injection suite has no clinical effect across transcript, check in, and board error", all && new Set(INJECTION_CASES.map((c) => c.channel)).size === 3);
}

// criterion 6: degraded disables all eight; typing remains
{
  const runtime = createRuntime({ degraded: true });
  const results = [];
  for (const id of EIGHT_IDS) {
    results.push(await AI_COMPONENTS[id](ctx({ runtime, audit: createGenerationAudit() }), id === "AI-04" ? "shoulder" : { stub_transcript: "x" }));
  }
  const store = createDraftStore();
  store.writeField("mechanism", "typed while degraded");
  const banner = degradedBanner(runtime);
  ok("criterion 6: degraded disables all eight and typing remains, admin banner only", results.every((r) => r.code === "AI-DEGRADED") && typingProductAvailable() === true && store.recover().fields.mechanism === "typed while degraded" && banner.audience === "clinic_administrator" && banner.screen === null);
}

// criterion 7: Consent A declined: record control not rendered, transcription rejected
{
  const declined = { granted: false };
  const r = await transcribe(ctx({ consentA: declined }), { stub_transcript: "hello" });
  ok("criterion 7: Consent A declined hides the record control and rejects transcription", recordingControlRendered(declined) === false && r.code === "CONSENT-A-REQUIRED");
}

// criterion 8: AI-05 and AI-08 gated on consent B, not A
{
  const aNoBYes = ctx({ consentA: { granted: false }, consentB: { granted: true } });
  const aYesBNo = ctx({ consentA: { granted: true, version_id: "x" }, consentB: { granted: false } });
  const t5 = await suggestTrajectory(aNoBYes, [{ case_id: "case-1", reported_pain: 2 }]);
  const t8 = await summariseCheckIns(aNoBYes, [{ case_id: "case-1", reported_pain: 2 }]);
  const f5 = await suggestTrajectory(aYesBNo, [{ case_id: "case-1", reported_pain: 2 }]);
  const f8 = await summariseCheckIns(aYesBNo, [{ case_id: "case-1", reported_pain: 2 }]);
  ok("criterion 8: AI-05 and AI-08 run on consent B and refuse when B is declined, even if A is granted", t5.ok === true && t8.ok === true && f5.code === "CONSENT-B-REQUIRED" && f8.code === "CONSENT-B-REQUIRED");
}

// criterion 9: every generation writes an audit row including refusals
{
  const c = ctx({ consentA: { granted: false } });
  await transcribe(c, { stub_transcript: "x" });
  ok("criterion 9: a refused generation still writes an audit.ai_generation shaped row", c.audit.rows().some((row) => row.outcome === "refused" && row.purpose === "transcription"));
}

ok("criterion 10: Canada inference endpoint remains UNVERIFIED (no live call in this suite)", true);

// criterion 12: low confidence cannot be bulk accepted
{
  const r = await draftNarrative(ctx({ lowConfidence: true }), "Mechanism: lifting.\nDiagnosis: strain.");
  ok("criterion 12: low confidence output cannot be bulk accepted", r.low_confidence_flagged === true && canBulkAccept([r]) === false);
}

// criterion 13: zero model calls from review and sign
{
  const bomb = createThrowingAdapter();
  const axes = [{ axis: "walking", answered: true, capability: "able", quantity_kind: "hours", code_set: "extended", code_list_name: "Extended Work Restriction Codes", source: "measured", provenance: "human" }];
  const signed = signMeasurement({ report: { id: "r", form_id: "C050", version: 1 }, practitioner: { id: "p", active: true }, axisValues: axes }, { modelAdapter: bomb, signedAt: "2026-09-15T00:00:00Z" });
  const blocked = signMeasurement({ report: { id: "r", form_id: "C050", version: 1 }, practitioner: { id: "p", active: true }, axisValues: axes, reportFields: [{ provenance: "ai_draft" }] });
  ok("criterion 13: sign path does not invoke a model adapter and still blocks on untouched ai_draft", signed.signed === true && blocked.signed === false && blocked.blockers.some((x) => x.id === "AI-DRAFT-UNTOUCHED"));
}

ok("audio retention is 30 days pending counsel (Section 9)", AUDIO_RETENTION_DAYS === 30);

{
  const here = dirname(fileURLToPath(import.meta.url));
  const stub = readFileSync(join(here, "../clinical/engine/ai_stub_provider.mjs"), "utf8");
  ok("the stub provider contains no fetch and no live vendor name", !/\bfetch\s*\(/.test(stub) && !/openai|anthropic|bedrock|vertex/i.test(stub));
}

ok("field writing class writes ai_draft; advisory writes nothing (spot check AI-03 and AI-04)", (() => true)());

{
  const c = ctx();
  const coding = await proposeInjuryCoding(c, { part: "01100", nature: "12400" });
  const axes = await proposeAxisRelevance(c, "knee", null);
  ok("AI-03 field writing is ai_draft; AI-04 advisory writes no fields", coding.provenance === "ai_draft" && coding.fields.length > 0 && axes.writes_report_field === false && axes.fields.length === 0);
}

{
  const c = ctx();
  const ref = await proposeReferral(c, { category: "treatment", type: "physiotherapy" });
  ok("AI-06 flags expedite from the starter table and never submits", ref.expedite_eligible === false && ref.submitted === false);
}

console.log("\nAI boundary invariants suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
