/* Continuum Prompt 44, the in-process FAKE inference adapter. There is no verified Canadian
   endpoint and no no-train contract in this repository (Section 1 stop conditions 1 and 2,
   Section 9 open item 1). Live model calls are therefore STOPPED. This adapter is the only
   provider the eight components may use until those two facts are verified with evidence.

   It never opens a network socket, never reads an API key, never prints a secret, and never
   trains on submitted content. A caller that tries to inject a live or networked provider is
   refused by assertProviderAllowed. No dashes anywhere. */

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();

export const STUB_MODEL = "continuum-stub";
export const STUB_MODEL_VERSION = "prompt44-in-process";

// Live inference is unverified. The engine will not call anything that claims a network or
// a non stub kind. This is the Section 1 stop, encoded so a later wiring mistake cannot
// silently start sending health information.
export function assertProviderAllowed(provider) {
  if (!provider || provider.kind !== "stub" || provider.network === true) {
    const e = new Error("Live inference is STOPPED until the physical Canada path and a contractual term forbidding training on submitted content are verified (Prompt 44 Section 1). Do not invent a provider.");
    e.code = "AI-PROVIDER-UNVERIFIED";
    throw e;
  }
  if (typeof provider.invoke !== "function") {
    const e = new Error("The stub provider must expose invoke.");
    e.code = "AI-PROVIDER-UNVERIFIED";
    throw e;
  }
  return true;
}

function stubOutput(req) {
  const purpose = norm(req && req.purpose);
  const input = (req && req.input) || {};
  if (req && req.simulateUnsupported) {
    return { text: "", empty: true, confidence: 1 };
  }
  if (purpose === "transcription") {
    return { text: String(input.stub_transcript || input.transcript_text || ""), empty: false, confidence: Number(input.confidence ?? 0.9) };
  }
  if (purpose === "narrative_draft") {
    return { text: String(input.transcript || ""), empty: false, confidence: Number(input.confidence ?? 0.9) };
  }
  if (purpose === "injury_coding") {
    return { text: String(input.transcript || ""), empty: false, confidence: Number(input.confidence ?? 0.9) };
  }
  if (purpose === "trajectory") {
    return { text: "worker_report", empty: false, confidence: Number(input.confidence ?? 0.9) };
  }
  if (purpose === "referral_proposal") {
    return { text: String(input.transcript || ""), empty: false, confidence: Number(input.confidence ?? 0.9) };
  }
  if (purpose === "board_error_parse") {
    return { text: String(input.rawText || ""), empty: false, confidence: Number(input.confidence ?? 0.9) };
  }
  if (purpose === "check_in_summary") {
    return { text: "this_case_only", empty: false, confidence: Number(input.confidence ?? 0.9) };
  }
  return { text: "", empty: true, confidence: 1 };
}

// Construct an in-process stub. callCount is the inspection point for the review and sign
// zero model calls criterion. invocations never include credentials or raw secrets.
export function createStubProvider() {
  let calls = 0;
  const invocations = [];
  return {
    kind: "stub",
    network: false,
    trainsOnContent: false,
    model: STUB_MODEL,
    model_version: STUB_MODEL_VERSION,
    invoke(req) {
      calls += 1;
      invocations.push({ purpose: norm(req && req.purpose), at: calls });
      if (req && req.simulateFailure) {
        const e = new Error("stub provider failed");
        e.code = "AI-PROVIDER-FAILED";
        throw e;
      }
      if (req && req.simulateTimeout) {
        const e = new Error("stub provider timeout");
        e.code = "AI-PROVIDER-TIMEOUT";
        throw e;
      }
      const out = stubOutput(req);
      if (req && req.lowConfidence) out.confidence = 0.2;
      return out;
    },
    get callCount() { return calls; },
    get invocations() { return invocations.slice(); },
  };
}

export function createDefaultStubProvider() {
  return createStubProvider();
}
