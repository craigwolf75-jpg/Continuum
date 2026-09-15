/* Continuum Prompt 44 Section 5: transcript text, worker check in text, and board error
   text are data, never instructions. An injection through any of the three channels must
   have no clinical effect (it cannot mark a worker fit for duties, cannot write a
   capability, cannot auto apply, cannot correct a clinical field).

   The adversarial suite (ai_injection.data.mjs plus ai_injection.test.mjs) covers all
   three channels and is part of the pipeline. No dashes anywhere. */

const norm = (v) => String(v === null || v === undefined ? "" : v);

export const CHANNELS = Object.freeze(["transcript", "check_in", "board_error"]);

// Instruction shaped spans. These are stripped before any clinical extraction so a model
// (or the stub) cannot treat them as orders.
const INJECTION_RE = /\b(ignore (your |all |previous )?instructions|disregard (your |all |previous )?(instructions|prompt)|you are now|system prompt|developer message|override (the )?(system|safety)|new (system )?instructions)\b/i;

// Fitness and capability shaped claims that untrusted text must never be able to cause.
const FITNESS_RE = /\b(fit for (full )?duties|return to (full )?(duties|work)|cleared for (full )?(dut(y|ies)|work)|no restrictions|mark (this |the )?worker (as )?fit|full duties)\b/i;
const CAPABILITY_RE = /\b(able|unable|limited_to|restricted_from|capability\s*(value|code)?\s*[:=]|quantity\s*[:=])\b/i;

export function looksLikeInjection(text) {
  return INJECTION_RE.test(norm(text));
}

export function looksLikeFitnessClaim(text) {
  return FITNESS_RE.test(norm(text));
}

export function looksLikeCapabilityClaim(text) {
  return CAPABILITY_RE.test(norm(text));
}

// Drop sentences that are instruction shaped. Remaining text is still data, including a
// quoted fitness phrase, and must not be executed.
export function stripInjection(text) {
  const raw = norm(text);
  if (raw === "") return "";
  const parts = raw.split(/(?<=[.!?])(?:\s+|\n+)/);
  return parts.filter((p) => !INJECTION_RE.test(p)).join("\n").trim();
}

// Clinical effect from untrusted input is always none. The function exists so tests can
// name the invariant: injection has no clinical effect whatsoever.
export function clinicalEffectFromUntrusted() {
  return {
    fitness_for_duties: null,
    capability: null,
    quantity: null,
    auto_applied: false,
    clinical_field_corrected: false,
    clinical_effect: false,
  };
}

export function assertNoClinicalEffect(result) {
  const r = result || {};
  const leaked =
    r.clinical_effect === true ||
    r.auto_applied === true ||
    r.fitness_for_duties === true ||
    r.fitness_for_duties === "fit" ||
    r.capability === "able" ||
    r.submitted === true ||
    r.clinical_field_corrected === true;
  if (leaked) {
    const e = new Error("Untrusted input produced a clinical effect. Injection must have no clinical effect (Prompt 44 Section 5).");
    e.code = "AI-INJECTION-CLINICAL-EFFECT";
    throw e;
  }
  return true;
}
