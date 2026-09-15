/* Continuum Prompt 44, the generation runner: session isolation, consent, degraded mode,
   provenance, and the append only audit.ai_generation mirror. Every generation writes an
   audit row including outcome (success, failed, refused, timeout), except a session
   isolation breach, which the database CHECK would reject (session_scope_case_id must
   equal case_id) so the engine throws and does not insert a mismatched row.

   Field writing class always proposes provenance ai_draft and never auto applies.
   Advisory class writes nothing to wcb_report_field. No dashes anywhere. */

import { assertSessionScope } from "./ai_provenance.mjs";
import { checkWriteProvenance } from "./ai_provenance.mjs";
import { assertProviderAllowed, createStubProvider } from "./ai_stub_provider.mjs";
import { consentAAllowed } from "./ai_consent_a.mjs";
import { employerViewAllowed } from "./consent.mjs";
import {
  COMPONENT_SPEC, isDegraded, componentEnabled, autoApplyEnabled,
  assertNoCapabilityOrQuantity, assertNotBannedField,
} from "./ai_runtime.mjs";

const nn = (v) => (v && typeof v.then === "function" ? v : Promise.resolve(v));

export function createGenerationAudit() {
  const rows = [];
  return {
    append(row) {
      assertSessionScope(row);
      const saved = Object.freeze({
        clinic_id: row.clinic_id,
        case_id: row.case_id,
        report_id: row.report_id || null,
        actor_user_id: row.actor_user_id,
        purpose: row.purpose,
        model: row.model,
        model_version: row.model_version,
        confidence: row.confidence == null ? null : Number(row.confidence),
        low_confidence_flagged: row.low_confidence_flagged === true,
        session_scope_case_id: row.session_scope_case_id,
        outcome: row.outcome,
        occurred_at: row.occurred_at || null,
        component_id: row.component_id || null,
        code: row.code || null,
      });
      rows.push(saved);
      return saved;
    },
    rows() { return rows.slice(); },
  };
}

function refuse(code, message, extra) {
  return Object.assign({ ok: false, outcome: "refused", code, message, auto_applied: false, clinical_effect: false, writes_report_field: false, fields: [] }, extra || {});
}

function consentOk(spec, ctx) {
  if (spec.consent === "A") return consentAAllowed(ctx.consentA);
  if (spec.consent === "B") return employerViewAllowed(ctx.consentB);
  return true;
}

function consentCode(spec) {
  if (spec.consent === "A") return "CONSENT-A-REQUIRED";
  if (spec.consent === "B") return "CONSENT-B-REQUIRED";
  return "CONSENT-REQUIRED";
}

export function proposeFieldWrite(elementKey, value, opts = {}) {
  assertNotBannedField(elementKey);
  const request = {
    source: "model_service",
    provenance: "ai_draft",
    is_clinical: opts.is_clinical !== false,
    element_key: elementKey,
    value,
  };
  const check = checkWriteProvenance(request);
  if (!check.ok) {
    const e = new Error(check.message);
    e.status = check.status;
    e.code = check.code;
    throw e;
  }
  if (autoApplyEnabled()) applyNever();
  return {
    element_key: elementKey,
    value,
    provenance: "ai_draft",
    is_clinical: request.is_clinical,
    auto_applied: false,
    applied: false,
  };
}

function applyNever() {
  const e = new Error("unreachable auto apply");
  e.code = "AI-AUTO-APPLY-FORBIDDEN";
  throw e;
}

function auditOutcome(ctx, spec, outcome, extra) {
  const audit = ctx.audit;
  if (!audit || typeof audit.append !== "function") return null;
  const provider = ctx.provider;
  const conf = extra && extra.confidence != null ? extra.confidence : null;
  return audit.append({
    clinic_id: ctx.clinic_id || "clinic-test",
    case_id: ctx.case_id,
    report_id: ctx.report_id || null,
    actor_user_id: ctx.actor_user_id || "actor-test",
    purpose: spec.purpose,
    model: spec.uses_model ? ((provider && provider.model) || "continuum-stub") : "deterministic-table",
    model_version: spec.uses_model ? ((provider && provider.model_version) || "prompt44-in-process") : "n/a",
    confidence: conf,
    low_confidence_flagged: extra && extra.low_confidence_flagged === true,
    session_scope_case_id: ctx.session_scope_case_id,
    outcome,
    component_id: spec.id,
    code: extra && extra.code || null,
  });
}

export async function runAiComponent(id, ctx, impl) {
  const spec = COMPONENT_SPEC[id];
  if (!spec) {
    const e = new Error("Unknown AI component " + id);
    e.code = "AI-UNKNOWN-COMPONENT";
    throw e;
  }
  const c = ctx || {};
  assertSessionScope({ case_id: c.case_id, session_scope_case_id: c.session_scope_case_id });

  if (isDegraded(c.runtime) || !componentEnabled(c.runtime, id)) {
    const r = refuse("AI-DEGRADED", "The global degraded flag disables all eight components at once. Typing remains available.", {
      component_id: id,
      notify: { audience: "clinic_administrator", practitioner_mid_encounter: false, screen: null },
    });
    auditOutcome(c, spec, "refused", { code: "AI-DEGRADED" });
    return r;
  }

  if (!consentOk(spec, c)) {
    const code = consentCode(spec);
    const r = refuse(code, spec.consent === "A"
      ? "Consent A (recording and scribe) is required for this field writing component. The record control is not rendered."
      : "Consent B is required for this component because it consumes worker check in data.",
      { component_id: id, recording_control_rendered: spec.consent === "A" ? false : undefined });
    auditOutcome(c, spec, "refused", { code });
    return r;
  }

  let provider = c.provider;
  if (spec.uses_model) {
    if (!provider) provider = createStubProvider();
    try {
      assertProviderAllowed(provider);
    } catch (e) {
      const r = refuse(e.code || "AI-PROVIDER-UNVERIFIED", e.message, { component_id: id });
      auditOutcome(c, spec, "refused", { code: r.code });
      return r;
    }
  }

  try {
    const out = await nn(impl({ spec, ctx: c, provider }));
    const payload = out || {};
    assertNoCapabilityOrQuantity(payload, id);
    if (Array.isArray(payload.fields)) {
      for (const f of payload.fields) assertNotBannedField(f.element_key);
    }
    const mayWrite = spec.writes_report_field === true;
    if (!mayWrite && payload.fields && payload.fields.length) {
      const e = new Error(id + " is advisory and writes nothing to wcb_report_field (Prompt 44 Section 2.2).");
      e.code = "AI-ADVISORY-WRITE";
      throw e;
    }
    if (payload.auto_applied === true || payload.submitted === true) {
      const e = new Error(id + " auto applied or submitted a proposal. Prohibited.");
      e.code = "AI-AUTO-APPLY-FORBIDDEN";
      throw e;
    }
    const confidence = payload.confidence == null ? null : Number(payload.confidence);
    const low = payload.low_confidence_flagged === true || (confidence != null && confidence < 0.5);
    const outcome = payload.outcome || "success";
    const writes = mayWrite && outcome === "success";
    auditOutcome(c, spec, outcome, { confidence, low_confidence_flagged: low, code: payload.code || null });
    return Object.assign({
      ok: outcome === "success",
      outcome,
      component_id: id,
      class: spec.class,
      writes_report_field: writes,
      provenance: writes ? "ai_draft" : null,
      auto_applied: false,
      submitted: false,
      clinical_effect: payload.clinical_effect === true,
      confidence,
      low_confidence_flagged: low,
      fields: writes ? (payload.fields || []) : [],
    }, payload, { auto_applied: false, submitted: false, writes_report_field: writes, fields: writes ? (payload.fields || []) : [], provenance: writes ? "ai_draft" : (payload.provenance || null) });
  } catch (e) {
    const timeout = e && e.code === "AI-PROVIDER-TIMEOUT";
    const outcome = timeout ? "timeout" : "failed";
    auditOutcome(c, spec, outcome, { code: (e && e.code) || "AI-FAILED" });
    return {
      ok: false,
      outcome,
      code: (e && e.code) || "AI-FAILED",
      message: (e && e.message) || String(e),
      component_id: id,
      auto_applied: false,
      clinical_effect: false,
      writes_report_field: false,
      fields: [],
      audio_preserved: id === "AI-01",
      retry: true,
      typing_available: true,
    };
  }
}
