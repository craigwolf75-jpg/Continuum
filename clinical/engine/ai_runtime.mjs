/* Continuum Prompt 44 Section 6 and Section 7: degraded mode, timeouts, audio retention,
   the typing based product, low confidence bulk accept, and the bans that have no
   configuration switch (auto apply, training, a confidence threshold that enables auto
   apply, a model proposing a capability or a quantity).

   The degraded flag disables all eight components at once. A model failure never blocks a
   visit: typing remains available. The degraded banner goes to the clinic administrator;
   a practitioner is never notified mid encounter (Prompt 41 would own that screen; this
   engine does not render one). Audio retention is 30 days pending counsel; this file does
   not pick another figure (Section 9). No dashes anywhere. */

export const EIGHT_IDS = Object.freeze(["AI-01", "AI-02", "AI-03", "AI-04", "AI-05", "AI-06", "AI-07", "AI-08"]);

export const DRAFTING_TIMEOUT_MS = 15000;
export const TRANSCRIPTION_TIMEOUT_MS = 60000;
export const AUDIO_RETENTION_DAYS = 30;

export const FIELD_WRITING = Object.freeze(["AI-01", "AI-02", "AI-03", "AI-06"]);
export const ADVISORY = Object.freeze(["AI-04", "AI-05", "AI-07", "AI-08"]);

export const COMPONENT_SPEC = Object.freeze({
  "AI-01": Object.freeze({ id: "AI-01", class: "field_writing", consent: "A", purpose: "transcription", timeout_ms: TRANSCRIPTION_TIMEOUT_MS, writes_report_field: true, uses_model: true }),
  "AI-02": Object.freeze({ id: "AI-02", class: "field_writing", consent: "A", purpose: "narrative_draft", timeout_ms: DRAFTING_TIMEOUT_MS, writes_report_field: true, uses_model: true }),
  "AI-03": Object.freeze({ id: "AI-03", class: "field_writing", consent: "A", purpose: "injury_coding", timeout_ms: DRAFTING_TIMEOUT_MS, writes_report_field: true, uses_model: true }),
  "AI-04": Object.freeze({ id: "AI-04", class: "advisory", consent: "none", purpose: "axis_relevance", timeout_ms: 0, writes_report_field: false, uses_model: false }),
  "AI-05": Object.freeze({ id: "AI-05", class: "advisory", consent: "B", purpose: "trajectory", timeout_ms: DRAFTING_TIMEOUT_MS, writes_report_field: false, uses_model: true }),
  "AI-06": Object.freeze({ id: "AI-06", class: "field_writing", consent: "A", purpose: "referral_proposal", timeout_ms: DRAFTING_TIMEOUT_MS, writes_report_field: true, uses_model: true }),
  "AI-07": Object.freeze({ id: "AI-07", class: "advisory", consent: "none", purpose: "board_error_parse", timeout_ms: DRAFTING_TIMEOUT_MS, writes_report_field: false, uses_model: true }),
  "AI-08": Object.freeze({ id: "AI-08", class: "advisory", consent: "B", purpose: "check_in_summary", timeout_ms: DRAFTING_TIMEOUT_MS, writes_report_field: false, uses_model: true }),
});

const CAPABILITY_WORDS = new Set(["able", "unable", "limited", "limited_to", "restricted_from"]);

export function createRuntime(seed = {}) {
  return {
    degraded: seed.degraded === true,
    degraded_at: seed.degraded_at || null,
    degraded_reason: seed.degraded_reason || null,
  };
}

export function isDegraded(runtime) {
  return Boolean(runtime && runtime.degraded === true);
}

export function setDegraded(runtime, degraded, at, reason) {
  return {
    degraded: degraded === true,
    degraded_at: degraded ? (at || null) : null,
    degraded_reason: degraded ? (reason || null) : null,
  };
}

// All eight, including the AI-04 table lookup, go dark together.
export function componentEnabled(runtime, id) {
  if (isDegraded(runtime)) return false;
  return Boolean(COMPONENT_SPEC[id]);
}

export function typingProductAvailable() { return true; }

// The banner is for the clinic administrator. A practitioner is never the audience
// mid encounter.
export function degradedBanner(runtime) {
  if (!isDegraded(runtime)) return null;
  return {
    audience: "clinic_administrator",
    practitioner_mid_encounter: false,
    screen: null,
    message: "Inference components are degraded. Typing remains available. Do not notify a practitioner mid encounter.",
  };
}

export function notifyDegraded(audience) {
  if (audience === "practitioner" || audience === "mid_encounter") {
    const e = new Error("Never notify a practitioner mid encounter about model degradation. The banner goes to the clinic administrator (Prompt 44 Section 6).");
    e.code = "AI-DEGRADED-PRACTITIONER-NOTIFY";
    throw e;
  }
  return { notified: audience === "clinic_administrator" };
}

export function daysBetween(fromIso, toIso) {
  const a = Date.parse(fromIso);
  const b = Date.parse(toIso);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return (b - a) / 86400000;
}

export function audioPastRetention(recordedAt, nowIso) {
  const d = daysBetween(recordedAt, nowIso);
  if (d === null) return false;
  return d > AUDIO_RETENTION_DAYS;
}

export function audioRetentionDays() { return AUDIO_RETENTION_DAYS; }

// There is no confidence at which a system authored clinical value becomes a
// practitioner's attestation (Section 7). Auto apply is structurally false.
export function autoApplyEnabled() { return false; }
export function autoApplyEnabledForConfidence(_confidence) { return false; }
export function trainingEnabled() { return false; }

export function applyProposal() {
  const e = new Error("Auto applying any proposal is prohibited (Prompt 44 Section 7, criterion 3). The software supports a decision; it does not make one.");
  e.code = "AI-AUTO-APPLY-FORBIDDEN";
  throw e;
}

export function isLowConfidence(generation) {
  return Boolean(generation && (generation.low_confidence_flagged === true || (generation.confidence != null && Number(generation.confidence) < 0.5)));
}

// Low confidence output cannot be bulk accepted (Section 6, acceptance criterion 12).
// The whole batch is refused if any item is flagged. Individual human review remains
// possible; bulk accept is the thing that is forbidden.
export function canBulkAccept(items) {
  const list = items || [];
  if (list.length === 0) return false;
  return list.every((g) => !isLowConfidence(g));
}

export function bulkAccept(items) {
  if (!canBulkAccept(items)) {
    const e = new Error("Low confidence output cannot be bulk accepted (Prompt 44 Section 6).");
    e.code = "AI-LOW-CONFIDENCE-BULK";
    throw e;
  }
  return { accepted: false, reason: "bulk accept still requires a human touch per item; this gate only proves low confidence cannot pass" };
}

export function isValueShapedToken(token) {
  const t = String(token == null ? "" : token).trim().toLowerCase();
  if (t === "") return false;
  if (CAPABILITY_WORDS.has(t)) return true;
  if (/\d/.test(t) && /\b(kg|kilograms?|hrs?|hours?|lb|lbs)\b/.test(t)) return true;
  return false;
}

export function assertNoCapabilityOrQuantity(payload, origin) {
  const p = payload || {};
  if (p.capability != null || p.quantity != null || p.capability_value != null || p.quantity_value != null) {
    const e = new Error("A model may never propose a capability value or a quantity (Prompt 44 Section 0A.2, Section 7). Origin: " + (origin || "unknown") + ".");
    e.code = "AI-CAPABILITY-OR-QUANTITY";
    throw e;
  }
  return true;
}

export const BANNED_MODEL_FIELDS = Object.freeze([
  "opioid_flags",
  "narcotics_or_opioids_prescribed",
  "prior_conditions",
  "aware_of_prior_conditions",
  "date_of_examination",
]);

export function assertNotBannedField(elementKey) {
  const k = String(elementKey == null ? "" : elementKey).trim().toLowerCase();
  if (BANNED_MODEL_FIELDS.includes(k)) {
    const e = new Error("A model may not answer " + k + " (Prompt 44 Section 7).");
    e.code = "AI-BANNED-FIELD";
    throw e;
  }
  return true;
}
