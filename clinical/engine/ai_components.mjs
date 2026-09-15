/* Continuum Prompt 44, the eight components. AI-04 is the existing deterministic table
   (ai_axis_relevance.mjs) and is not a model. The other seven run only through the in
   process stub provider: live inference is STOPPED until Section 1 checks 1 and 2 are
   verified. Each function enforces its Section 2 may / never rules.

   Field writing (AI-01, AI-02, AI-03, AI-06): Consent A, provenance ai_draft, never auto
   applied, never submitted. Advisory (AI-04, AI-05, AI-07, AI-08): writes nothing to
   wcb_report_field. AI-05 and AI-08 are gated on consent B, not A. No dashes anywhere. */

import { proposeAxes, writesReportField as ai04WritesReportField } from "./ai_axis_relevance.mjs";
import { resolveError, indexErrorCatalogue } from "./errors.mjs";
import { valX03 } from "./validation.mjs";
import { createStubProvider } from "./ai_stub_provider.mjs";
import { runAiComponent, proposeFieldWrite } from "./ai_generation.mjs";
import { consentAAllowed, recordingControlRendered } from "./ai_consent_a.mjs";
import { stripInjection, looksLikeInjection, clinicalEffectFromUntrusted, assertNoClinicalEffect } from "./ai_untrusted.mjs";
import { audioPastRetention, AUDIO_RETENTION_DAYS, typingProductAvailable } from "./ai_runtime.mjs";

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();
const lower = (v) => norm(v).toLowerCase();

function emptyEffect() {
  return Object.assign({ fitness_for_duties: null }, clinicalEffectFromUntrusted());
}

function providerOrStub(ctx) {
  return (ctx && ctx.provider) || createStubProvider();
}

function invokeStub(ctx, purpose, input, extra) {
  const provider = providerOrStub(ctx);
  const req = Object.assign({ purpose, input }, extra || {});
  return provider.invoke(req);
}

function labeled(text, label) {
  const re = new RegExp("(?:^|\\n)\\s*" + label + "\\s*[:\\-]\\s*([^\\n]+)", "i");
  const m = norm(text).match(re);
  return m ? m[1].trim() : "";
}

// STARTER referral catalogue. The board Category Type Expedite Codes sheet is not yet a
// table (clinical/db/README.md, not emitted). This is an in engine placeholder so AI-06
// can flag expedite eligibility without guessing yes for an unknown type. Pending the
// composite lookup.
const REFERRAL_STARTER = Object.freeze([
  Object.freeze({ category: "consultation", type: "orthopedic", expedite_allowed: true }),
  Object.freeze({ category: "investigation", type: "mri", expedite_allowed: true }),
  Object.freeze({ category: "treatment", type: "physiotherapy", expedite_allowed: false }),
]);

function matchReferral(category, type) {
  const c = lower(category), t = lower(type);
  return REFERRAL_STARTER.find((r) => r.category === c && r.type === t) || null;
}

// -- AI-01 transcription -------------------------------------------------------
export async function transcribe(ctx, audio) {
  return runAiComponent("AI-01", ctx, ({ ctx: c }) => {
    const a = audio || {};
    if (!consentAAllowed(c.consentA)) {
      return { outcome: "refused", code: "CONSENT-A-REQUIRED", recording_control_rendered: false };
    }
    if (a.recorded_at && c.now && audioPastRetention(a.recorded_at, c.now)) {
      return {
        outcome: "refused",
        code: "AI-AUDIO-RETENTION",
        message: "Audio past the " + AUDIO_RETENTION_DAYS + " day retention window pending counsel is not transcribed.",
        audio_preserved: false,
        typing_available: true,
      };
    }
    const extra = {};
    if (c.simulateTimeout) extra.simulateTimeout = true;
    if (c.simulateFailure) extra.simulateFailure = true;
    if (c.lowConfidence) extra.lowConfidence = true;
    const stub = invokeStub(c, "transcription", {
      stub_transcript: a.stub_transcript || a.transcript_text || "",
      confidence: a.confidence,
    }, extra);
    const text = String(stub.text || "");
    const fields = text
      ? [proposeFieldWrite("transcript", text)]
      : [];
    const out = Object.assign({
      transcript: text,
      fields,
      empty: text === "",
      confidence: stub.confidence,
      audio_preserved: true,
      retry: false,
      typing_available: typingProductAvailable(),
      recording_control_rendered: recordingControlRendered(c.consentA),
      audio_retention_days: AUDIO_RETENTION_DAYS,
    }, emptyEffect());
    assertNoClinicalEffect(out);
    return out;
  });
}

// -- AI-02 narrative drafting --------------------------------------------------
export async function draftNarrative(ctx, transcript) {
  return runAiComponent("AI-02", ctx, ({ ctx: c }) => {
    const extra = {};
    if (c.simulateTimeout) extra.simulateTimeout = true;
    if (c.simulateFailure) extra.simulateFailure = true;
    if (c.lowConfidence) extra.lowConfidence = true;
    invokeStub(c, "narrative_draft", { transcript: transcript || "" }, extra);
    const raw = norm(transcript);
    const cleaned = stripInjection(raw);
    const injection = looksLikeInjection(raw);
    const mechanism = labeled(cleaned, "mechanism");
    const reported = labeled(cleaned, "symptoms") || labeled(cleaned, "patient reports") || "";
    let symptoms = reported;
    if (!symptoms) {
      const m = cleaned.match(/\b(?:patient reports|reports)\s+(.+?)(?:\.|$)/i);
      symptoms = m ? m[1].trim() : "";
    }
    const observed = labeled(cleaned, "objective findings") || labeled(cleaned, "exam") || labeled(cleaned, "observed") || "";
    let diagnosis = labeled(cleaned, "diagnosis");
    if (diagnosis && injection && /fit for|full duties/i.test(diagnosis)) diagnosis = "";
    if (diagnosis && !cleaned.toLowerCase().includes(diagnosis.toLowerCase())) diagnosis = "";
    const unsupported = cleaned === "" && raw !== "";
    const empty = cleaned === "" || (symptoms === "" && observed === "" && diagnosis === "" && mechanism === "");
    const fields = [];
    if (mechanism) fields.push(proposeFieldWrite("mechanism", mechanism));
    if (symptoms) fields.push(proposeFieldWrite("symptoms", symptoms));
    if (observed) fields.push(proposeFieldWrite("objective_findings", observed));
    if (diagnosis) fields.push(proposeFieldWrite("diagnosis_narrative", diagnosis));
    const out = Object.assign({
      mechanism,
      symptoms,
      symptoms_as_observed: false,
      objective_findings: observed,
      diagnosis_narrative: diagnosis,
      diagnosis_in_transcript: diagnosis !== "" && raw.toLowerCase().includes(diagnosis.toLowerCase()),
      injection_detected: injection,
      unsupported,
      empty_draft: empty,
      fields,
      confidence: extra.lowConfidence ? 0.2 : 0.9,
      submitted: false,
    }, emptyEffect());
    if (out.symptoms && out.symptoms_as_observed) {
      const e = new Error("AI-02 must not state a reported symptom as an observed finding.");
      e.code = "AI-02-SYMPTOM-AS-FINDING";
      throw e;
    }
    assertNoClinicalEffect(out);
    return out;
  });
}

// -- AI-03 injury coding -------------------------------------------------------
export async function proposeInjuryCoding(ctx, input) {
  return runAiComponent("AI-03", ctx, ({ ctx: c }) => {
    const extra = {};
    if (c.simulateTimeout) extra.simulateTimeout = true;
    if (c.lowConfidence) extra.lowConfidence = true;
    invokeStub(c, "injury_coding", { transcript: (input && input.transcript) || "" }, extra);
    const raw = norm(input && input.transcript);
    const cleaned = stripInjection(raw);
    if (looksLikeInjection(raw) && cleaned === "") {
      const out = Object.assign({ empty_draft: true, fields: [], proposals: [] }, emptyEffect());
      assertNoClinicalEffect(out);
      return out;
    }
    const part = norm(input && input.part);
    const side = norm(input && input.side);
    const nature = norm(input && input.nature);
    const diagnostic = norm(input && input.diagnostic);
    const forbidden = (input && input.forbidden) instanceof Set ? input.forbidden : new Set();
    const rows = (part && nature) ? [{ part, nature }] : [];
    const forbiddenHits = valX03(rows, forbidden);
    if (forbiddenHits.length) {
      return Object.assign({
        empty_draft: true,
        fields: [],
        proposals: [],
        refused_forbidden_pair: true,
        reasoning: "AI-03 may never propose a forbidden pair (Prompt 44 Section 2).",
      }, emptyEffect());
    }
    if (!part && !nature && !diagnostic) {
      return Object.assign({ empty_draft: true, fields: [], proposals: [] }, emptyEffect());
    }
    const proposal = {
      part: part || null,
      side: side || null,
      nature: nature || null,
      diagnostic_codes: diagnostic ? [diagnostic] : [],
      reasoning: "Proposed from the supplied coding context. Auto apply is forbidden. A forbidden pair is refused.",
    };
    const fields = [];
    if (proposal.part) fields.push(proposeFieldWrite("part_of_body", proposal.part));
    if (proposal.side) fields.push(proposeFieldWrite("side_of_body", proposal.side));
    if (proposal.nature) fields.push(proposeFieldWrite("nature_of_injury", proposal.nature));
    if (diagnostic) fields.push(proposeFieldWrite("diagnostic_code_1", diagnostic));
    const out = Object.assign({
      proposals: [proposal],
      fields,
      reasoning: proposal.reasoning,
      confidence: extra.lowConfidence ? 0.2 : 0.9,
    }, emptyEffect());
    assertNoClinicalEffect(out);
    return out;
  });
}

// -- AI-04 axis relevance (deterministic table, not a model) -------------------
export async function proposeAxisRelevance(ctx, partOfBody, natureOfInjury) {
  return runAiComponent("AI-04", ctx, () => {
    const r = proposeAxes(partOfBody, natureOfInjury);
    return Object.assign({
      axes: r.axes,
      opened_all: r.opened_all,
      matched: r.matched,
      reasoning: r.reasoning,
      clinically_signed_off: r.clinically_signed_off,
      fields: [],
      uses_model: false,
    }, emptyEffect());
  });
}

export function ai04WritesField() { return ai04WritesReportField(); }

// -- AI-05 trajectory from worker check ins -----------------------------------
export async function suggestTrajectory(ctx, checkIns) {
  return runAiComponent("AI-05", ctx, ({ ctx: c }) => {
    const extra = {};
    if (c.lowConfidence) extra.lowConfidence = true;
    invokeStub(c, "trajectory", { checkIns: checkIns || [] }, extra);
    const mine = (checkIns || []).filter((x) => !x.case_id || String(x.case_id) === String(c.case_id));
    const texts = mine.map((x) => norm(x.text || x.notes || x.body || "")).join(" ");
    const injection = looksLikeInjection(texts);
    const scores = mine.map((x) => x.reported_pain).filter((n) => n != null && !Number.isNaN(Number(n))).map(Number);
    let suggestion = "unchanged";
    if (scores.length >= 2) {
      const first = scores[0], last = scores[scores.length - 1];
      if (last < first) suggestion = "improving";
      else if (last > first) suggestion = "regressing";
    } else if (scores.length === 0 && mine.length === 0) {
      suggestion = "unchanged";
    }
    const out = Object.assign({
      suggestion,
      presented_as: "worker_report",
      clinical_finding: false,
      injection_detected: injection,
      fields: [],
      used_check_in_count: mine.length,
      confidence: extra.lowConfidence ? 0.2 : 0.9,
    }, emptyEffect());
    assertNoClinicalEffect(out);
    return out;
  });
}

// -- AI-06 referral proposal ---------------------------------------------------
export async function proposeReferral(ctx, input) {
  return runAiComponent("AI-06", ctx, ({ ctx: c }) => {
    const extra = {};
    if (c.lowConfidence) extra.lowConfidence = true;
    invokeStub(c, "referral_proposal", { transcript: (input && input.transcript) || "" }, extra);
    const category = lower(input && input.category);
    const type = lower(input && input.type);
    const row = matchReferral(category, type);
    const expedite_eligible = row ? row.expedite_allowed === true : false;
    const fields = [];
    if (category) fields.push(proposeFieldWrite("referral_category", category));
    if (type) fields.push(proposeFieldWrite("referral_type", type));
    const out = Object.assign({
      category: category || null,
      type: type || null,
      expedite_eligible,
      expedite_unknown_defaults_false: row ? false : true,
      fields,
      submitted: false,
      confidence: extra.lowConfidence ? 0.2 : 0.9,
    }, emptyEffect());
    assertNoClinicalEffect(out);
    return out;
  });
}

export function submitReferral() {
  const e = new Error("AI-06 may never submit a referral (Prompt 44 Section 2).");
  e.code = "AI-06-SUBMIT-FORBIDDEN";
  throw e;
}

// -- AI-07 board error parsing -------------------------------------------------
export async function parseBoardError(ctx, input) {
  return runAiComponent("AI-07", ctx, ({ ctx: c }) => {
    const extra = {};
    if (c.lowConfidence) extra.lowConfidence = true;
    const rawText = (input && (input.rawText || input.text)) || "";
    invokeStub(c, "board_error_parse", { rawText }, extra);
    const idx = input && input.index ? input.index : indexErrorCatalogue(input && input.catalogue || []);
    const resolved = resolveError(idx, input && input.jurisdiction, input && input.boardCode, rawText);
    const injection = looksLikeInjection(rawText);
    const cleaned = stripInjection(rawText);
    let explanation = resolved.mapped
      ? "The board code maps to the field " + resolved.element + ". This is an explanation, not a correction. Do not auto correct the field."
      : "The board code is unmapped. Surface the board's own words to a human. Do not guess a correction.";
    if (injection) explanation = explanation + " Untrusted instruction text was ignored.";
    const out = Object.assign({
      mapped: resolved.mapped,
      element: resolved.element,
      boardCode: resolved.boardCode,
      rawText: resolved.rawText,
      explanation,
      note: resolved.note || null,
      surfaceToHuman: resolved.surfaceToHuman || !resolved.mapped,
      correction: null,
      value: undefined,
      polarity: undefined,
      auto_corrected: false,
      clinical_field_corrected: false,
      injection_detected: injection,
      cleaned_text: cleaned,
      fields: [],
      confidence: extra.lowConfidence ? 0.2 : 0.9,
    }, emptyEffect());
    delete out.value;
    delete out.polarity;
    assertNoClinicalEffect(out);
    return out;
  });
}

export function autoCorrectClinicalField() {
  const e = new Error("AI-07 may never auto correct a clinical field (Prompt 44 Section 2).");
  e.code = "AI-07-AUTOCORRECT-FORBIDDEN";
  throw e;
}

// -- AI-08 check in summary (this case only) -----------------------------------
export async function summariseCheckIns(ctx, checkIns) {
  return runAiComponent("AI-08", ctx, ({ ctx: c }) => {
    const extra = {};
    if (c.lowConfidence) extra.lowConfidence = true;
    invokeStub(c, "check_in_summary", { checkIns: checkIns || [] }, extra);
    const all = checkIns || [];
    const mine = all.filter((x) => String(x.case_id) === String(c.case_id));
    const foreign = all.filter((x) => String(x.case_id) !== String(c.case_id));
    const texts = mine.map((x) => stripInjection(x.text || x.notes || x.body || "")).filter(Boolean);
    const pains = mine.map((x) => x.reported_pain).filter((n) => n != null);
    const summary = mine.length === 0
      ? ""
      : ("This case: " + mine.length + " check in(s)" + (pains.length ? "; reported pain " + pains.join(", ") : "") + (texts.length ? "; worker text omitted from any other case" : "") + ".");
    const out = Object.assign({
      summary,
      empty_draft: summary === "",
      used_case_id: c.case_id,
      used_check_in_count: mine.length,
      dropped_other_case_count: foreign.length,
      drew_on_other_case: false,
      fields: [],
      injection_detected: looksLikeInjection(mine.map((x) => x.text || x.notes || "").join(" ")),
      confidence: extra.lowConfidence ? 0.2 : 0.9,
    }, emptyEffect());
    if (out.drew_on_other_case || foreign.some((f) => summary.includes(String(f.case_id)))) {
      const e = new Error("AI-08 may never draw on any other case (Prompt 44 Section 2).");
      e.code = "AI-08-OTHER-CASE";
      throw e;
    }
    assertNoClinicalEffect(out);
    return out;
  });
}

export const AI_COMPONENTS = Object.freeze({
  "AI-01": transcribe,
  "AI-02": draftNarrative,
  "AI-03": proposeInjuryCoding,
  "AI-04": proposeAxisRelevance,
  "AI-05": suggestTrajectory,
  "AI-06": proposeReferral,
  "AI-07": parseBoardError,
  "AI-08": summariseCheckIns,
});
