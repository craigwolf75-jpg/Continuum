/* Continuum Prompt 44, the provenance and session isolation guards (the service layer mirror
   of the migration 017 constraints). These are pure functions the write layer calls; the
   database enforces the same rules independently, so a bug here cannot breach them and a bug
   in the service cannot breach the database (defense in depth, Sections 3 and 4).

   The position they carry (Section 3): there is NO code path by which a model response becomes
   provenance human. A write request that carries provenance human from the model service is
   rejected. system is permitted only on a non clinical field. The signature gate blocks on any
   untouched ai_draft field. No dashes anywhere. */

export const PROVENANCE_VALUES = Object.freeze(["human", "ai_draft", "ai_draft_edited", "carried_forward", "system"]);
const norm = (v) => String(v === null || v === undefined ? "" : v).trim();

// The provenance values a request from the MODEL SERVICE may carry. It may never claim human
// (that is a practitioner's attestation, Section 3) and it may never claim carried_forward
// (that is the prior report, not the model). A model writes ai_draft; a human editing a draft
// makes it ai_draft_edited through the human path, not the model path.
const MODEL_ALLOWED = new Set(["ai_draft"]);

// The write layer guard. Returns { ok } or { ok:false, status, code, message }. Status 422 is
// the rejection the write API returns (acceptance criterion 2). Rules:
//   - a model service request claiming provenance human is rejected 422 (the core rule);
//   - a model service request claiming anything other than ai_draft is rejected 422;
//   - provenance system is permitted only on a non clinical field (Section 3);
//   - an unknown provenance value is rejected.
export function checkWriteProvenance(request) {
  const r = request || {};
  const provenance = norm(r.provenance);
  const source = norm(r.source);            // 'model_service' | 'human' | 'system'
  const isClinical = r.is_clinical !== false; // default clinical unless explicitly false

  if (!PROVENANCE_VALUES.includes(provenance)) {
    return { ok: false, status: 422, code: "PROVENANCE-UNKNOWN", message: "Unknown provenance value: " + JSON.stringify(provenance) };
  }
  if (source === "model_service") {
    if (provenance === "human") {
      return { ok: false, status: 422, code: "PROVENANCE-MODEL-CLAIMS-HUMAN", message: "A model response can never be written with provenance human. There is no code path by which a model authored value becomes a practitioner attestation (Section 3)." };
    }
    if (!MODEL_ALLOWED.has(provenance)) {
      return { ok: false, status: 422, code: "PROVENANCE-MODEL-NOT-ALLOWED", message: "The model service may only write provenance ai_draft, not " + JSON.stringify(provenance) + "." };
    }
  }
  if (provenance === "system" && isClinical) {
    return { ok: false, status: 422, code: "PROVENANCE-SYSTEM-ON-CLINICAL", message: "Provenance system is permitted only on a non clinical field (Section 3)." };
  }
  return { ok: true, status: 200 };
}

// Throwing form for a write path that prefers to raise. Throws a 422 tagged error, else returns
// the request unchanged.
export function assertWriteProvenance(request) {
  const c = checkWriteProvenance(request);
  if (!c.ok) { const e = new Error(c.message); e.status = c.status; e.code = c.code; throw e; }
  return request;
}

// The signature gate (Section 3, acceptance criterion 3): a report with any untouched ai_draft
// field cannot be signed. In the database this is one partial index lookup; here it is the pure
// predicate over the field rows. ai_draft_edited (a human touched it) does not block; only an
// untouched ai_draft does.
export function untouchedAiDraftFields(reportFields) {
  return (reportFields || []).filter((f) => norm(f.provenance) === "ai_draft");
}
export function blocksSignature(reportFields) {
  return untouchedAiDraftFields(reportFields).length > 0;
}

// Session isolation (Section 4, acceptance criterion 4): a generation whose session scope is
// not the case it belongs to must not be written. The database CHECK enforces this; this guard
// is the same rule at the service layer, so a component that cannot supply the correct scope
// throws rather than running.
export function assertSessionScope(generation) {
  const g = generation || {};
  if (norm(g.session_scope_case_id) === "" || norm(g.case_id) === "") {
    const e = new Error("A generation must carry both case_id and session_scope_case_id; a component that cannot supply the scope does not run (Section 4).");
    e.code = "AI-SESSION-SCOPE-MISSING"; throw e;
  }
  if (norm(g.session_scope_case_id) !== norm(g.case_id)) {
    const e = new Error("Session isolation breach: session_scope_case_id " + JSON.stringify(norm(g.session_scope_case_id)) + " is not case_id " + JSON.stringify(norm(g.case_id)) + ". Refusing (Section 4).");
    e.code = "AI-SESSION-ISOLATION"; throw e;
  }
  return true;
}
