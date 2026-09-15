/* Continuum Prompt 44, review and sign must not call a model (Section 7, acceptance
   criterion 13). Generating on that screen would mean the thing being signed changed
   while being reviewed. The regulatory gate must be inert.

   signMeasurement and signReport never invoke a provider. If a caller passes a
   modelAdapter, it is ignored. Tests pass a throwing adapter to prove it is not
   called. No dashes anywhere. */

export function ignoreModelAdapter(adapter) {
  void adapter;
  return null;
}

export function assertZeroModelCalls(provider, beforeCount) {
  const n = provider && typeof provider.callCount === "number" ? provider.callCount : 0;
  const before = beforeCount == null ? 0 : beforeCount;
  if (n !== before) {
    const e = new Error("Zero model calls may originate from the review and sign screen (Prompt 44 Section 7). Adapter callCount moved from " + before + " to " + n + ".");
    e.code = "AI-MODEL-ON-REVIEW-SIGN";
    throw e;
  }
  return true;
}

export function createThrowingAdapter() {
  return {
    kind: "stub",
    network: false,
    trainsOnContent: false,
    invoke() {
      const e = new Error("Zero model calls may originate from the review and sign screen (Prompt 44 Section 7).");
      e.code = "AI-MODEL-ON-REVIEW-SIGN";
      throw e;
    },
    get callCount() { return 0; },
  };
}
