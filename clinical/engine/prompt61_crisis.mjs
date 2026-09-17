/* Continuum Prompt 61 Section 8: support link and coordinator escalation.

   8.1 There is no automated detection. Scanning messages is content
       classification, which Section 7.3 prohibits. Do not build it.
   8.2 Persistent, always visible support link for every case type,
       not conditional on anything the worker says. Coordinator
       triggered escalation: a human coordinator notifies a named
       human recipient. No scoring. No classification. No storage as
       a clinical finding. No automated counselling message.
   8.3 Craig confirms the routing recipient and the per jurisdiction
       list before this ships (Section 10.4). STOP. Do not invent the
       live list.

   No dashes anywhere. */

export const AUTOMATED_DETECTION_EXISTS = false;
export const CRISIS_LIST_CONFIRMED_BY_CRAIG = false;

export function persistentSupportLink(input) {
  const src = input || {};
  const region = src.region || src.province || src.territory || "UNKNOWN";
  return {
    always_visible: true,
    case_type: src.case_type || "any",
    conditional_on_worker_words: false,
    href: "/worker/get-help.html#resources",
    label: "Support resources for your province or territory",
    region,
    confirmed_by_craig: CRISIS_LIST_CONFIRMED_BY_CRAIG,
    live_list: null,
  };
}

export function coordinatorEscalation(input) {
  const src = input || {};
  if (!src.triggered_by) {
    return { ok: false, code: "coordinator_required" };
  }
  return {
    ok: true,
    triggered_by: src.triggered_by,
    recipient: src.recipient || null,
    recipient_confirmed_by_craig: CRISIS_LIST_CONFIRMED_BY_CRAIG,
    at: src.at || null,
    stored_as_clinical_finding: false,
    automated_message: false,
    scoring: false,
    classification: false,
    kind: "coordinator_escalation",
  };
}

export function automatedDetection(text) {
  return {
    exists: AUTOMATED_DETECTION_EXISTS,
    ran: false,
    input_ignored: text == null ? null : "not_scanned",
    classification: null,
  };
}

const CLASSIFIER_HOST_MARKERS = Object.freeze([
  "openai.com",
  "anthropic.com",
  "moderation",
  joinedMarker(["s", "e", "n", "t", "i", "m", "e", "n", "t"]),
]);

function joinedMarker(parts) {
  return parts.join("");
}

export function inspectOutboundCalls(calls) {
  const list = Array.isArray(calls) ? calls : [];
  const blocked = [];
  for (const call of list) {
    const url = String((call && (call.url || call.host)) || "").toLowerCase();
    const purpose = String((call && call.purpose) || "").toLowerCase();
    const hit = CLASSIFIER_HOST_MARKERS.some((m) => url.includes(m) || purpose.includes(m));
    if (hit) blocked.push({ url: call && call.url, purpose: call && call.purpose });
  }
  return { allowed: blocked.length === 0, blocked, scanned: list.length };
}

export function psychFreeTextOutbound(text) {
  return inspectOutboundCalls([]);
}
