/* Prompt 49 outbound pipeline.

   Domain event -> canonical from domain (never from a vendor shape) ->
   field manifest -> adapter build -> outbound_message by digest.
   Delivery belongs to the gateway and is out of scope.
   No em dashes or en dashes. */

import { namedError } from "./util.mjs";
import { applyOutboundGuards } from "./adapter.mjs";
import { digestOf } from "./stages.mjs";
import { emitUnansweredAxes, renderUnanswered } from "./functional.mjs";
import { evaluateConsent } from "./consent_port.mjs";
import { createReferenceAdapter } from "./reference_adapter.mjs";

export function buildCanonicalFromDomain(domain, source) {
  if (source === "vendor") {
    throw namedError("OUTBOUND-FROM-VENDOR", "An outbound payload must be built from a canonical object, never from a vendor shape.");
  }
  if (source === "domain_direct") {
    throw namedError("OUTBOUND-FROM-DOMAIN", "No outbound payload is constructed from a domain object directly.");
  }
  return domain;
}

export function runOutbound(canonical, context, store, metrics, adapter) {
  const ctx = context || {};
  const ad = adapter || createReferenceAdapter();

  if (ctx.consent_required) {
    const state = evaluateConsent({
      subject_person_id: ctx.subject_person_id,
      purpose: ctx.consent_purpose || "integration_outbound",
      recipient: ctx.consent_recipient,
      at: ctx.at || new Date().toISOString(),
    }, store);
    if (state !== "granted") {
      if (metrics) metrics.increment("outbound_blocked_total", { reason: "consent" });
      throw namedError("OUTBOUND-CONSENT", "Consent evaluated at emit time is " + state + ".");
    }
  }

  const withAxes = canonical && canonical.functional
    ? { ...canonical, axes: emitUnansweredAxes(canonical.functional.axes || [], metrics), authorship_provenance: canonical.authorship_provenance }
    : { ...canonical, axes: emitUnansweredAxes((canonical && canonical.axes) || [], metrics) };

  const guarded = applyOutboundGuards(withAxes, ad, ctx, metrics);
  const digest = digestOf(guarded.payload);
  const record = {
    organisation_id: ctx.organisation_id,
    connection_id: ctx.connection_id,
    destination_system: ctx.destination_system || "synthetic",
    source_event_id: ctx.source_event_id,
    canonical_version: ctx.canonical_version || "1.0.0",
    adapter_name: ad.descriptor().name,
    adapter_version: ad.descriptor().version,
    mapping_version: ctx.mapping_version || "1",
    field_manifest_ref: ctx.field_manifest_ref || "reference/1.0.0",
    lawful_basis_type: ctx.lawful_basis_type,
    lawful_basis_ref: ctx.lawful_basis_ref,
    payload_digest: digest,
    correlation_id: ctx.correlation_id,
    built_at: new Date().toISOString(),
  };
  if (store) {
    store.outbound = store.outbound || [];
    store.outbound.push(record);
  }
  return { payload: guarded.payload, record, unanswered: (withAxes.axes || []).filter((a) => a.answered === false).map((a) => renderUnanswered("outbound", a)) };
}

export function scanOutboundBuiltFromDomain(sourceText) {
  const text = String(sourceText || "");
  const hits = [];
  if (text.includes("buildOutbound(domainRow)") || text.includes("adapter.buildOutbound(domain")) hits.push("domain_direct");
  return { ok: hits.length === 0, hits };
}
