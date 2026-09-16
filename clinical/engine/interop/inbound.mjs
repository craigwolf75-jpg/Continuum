/* Prompt 49 inbound pipeline.

   Adapter -> envelope (idempotency) -> stages 1-11 -> resolveIdentity ->
   domain validation -> business services only. Envelope-asserted tenant
   is ignored in favour of the authenticated connection. A message applies
   fully or not at all.
   No em dashes or en dashes. */

import { digestOf, idempotencyKey } from "./stages.mjs";
import { runNormalisation } from "./engine.mjs";
import { createReferenceAdapter } from "./reference_adapter.mjs";
import { namedError } from "./util.mjs";

export function authenticatedConnection(context) {
  const ctx = context || {};
  if (!ctx.connection_id || !ctx.organisation_id) {
    throw namedError("CONNECTION-UNAUTHENTICATED", "The inbound path requires an authenticated connection. The envelope tenant is not authentication.");
  }
  return {
    connection_id: ctx.connection_id,
    organisation_id: ctx.organisation_id,
    location_id: ctx.location_id || null,
  };
}

export function buildEnvelope(raw, meta, connection) {
  const digest = digestOf(raw);
  const key = idempotencyKey(connection.connection_id, meta.external_message_id || "", digest);
  return {
    id: meta.id || ("env-" + key.slice(0, 12)),
    organisation_id: connection.organisation_id,
    location_id: connection.location_id,
    connection_id: connection.connection_id,
    source_system: meta.source_system || "synthetic",
    external_org_ref: meta.external_org_ref || null,
    external_message_id: meta.external_message_id || null,
    idempotency_key: key,
    correlation_id: meta.correlation_id,
    trace_id: meta.trace_id || null,
    event_type: meta.event_type || "interop.inbound",
    schema_version: meta.schema_version || "ref-1",
    payload_version: meta.payload_version || null,
    canonical_version: meta.canonical_version || "1.0.0",
    adapter_name: meta.adapter_name || "reference",
    adapter_version: meta.adapter_version || "1.0.0",
    content_type: meta.content_type || "application/json",
    content_length: Buffer.byteLength(typeof raw === "string" ? raw : JSON.stringify(raw)),
    payload_digest: digest,
    raw_payload_ref: meta.raw_payload_ref || ("raw://" + digest),
    received_at: meta.received_at || new Date().toISOString(),
    processing_status: "received",
    outcome: null,
    asserted_organisation_id: meta.organisation_id || null,
  };
}

export function recordEnvelope(envelope, store, metrics) {
  const rows = (store && store.inbound) || [];
  const sameKey = rows.find((row) =>
    row.connection_id === envelope.connection_id && row.idempotency_key === envelope.idempotency_key);
  if (sameKey) {
    if (metrics) metrics.increment("inbound_replay_total", { connection: envelope.connection_id });
    return { kind: "replay", existing: sameKey };
  }
  if (envelope.external_message_id) {
    const sameExternal = rows.find((row) =>
      row.connection_id === envelope.connection_id && row.external_message_id === envelope.external_message_id);
    if (sameExternal && sameExternal.payload_digest !== envelope.payload_digest) {
      if (metrics) metrics.increment("inbound_conflict_total", { connection: envelope.connection_id });
      return { kind: "conflict", existing: sameExternal, envelope };
    }
  }
  if (store) {
    store.inbound = store.inbound || [];
    store.inbound.push(envelope);
  }
  return { kind: "accepted", row: envelope };
}

export function runInbound(raw, meta, context, store, metrics, adapter) {
  const connection = authenticatedConnection(context);
  if (meta && meta.organisation_id && meta.organisation_id !== connection.organisation_id) {
    return {
      outcome: "rejected_invalid_source",
      errors: [{
        code: "ENVELOPE-TENANT-IGNORED",
        stage: "PAYLOAD_VALIDATION",
        field_path: "organisation_id",
        message: "The envelope tenant differs from the authenticated connection and was rejected.",
        retained_source_value: String(meta.organisation_id),
      }],
      wrote: false,
    };
  }
  const ad = adapter || createReferenceAdapter();
  const envelope = buildEnvelope(raw, { ...meta, correlation_id: (meta && meta.correlation_id) || (store && store.correlation_id) }, connection);
  let parsed;
  try {
    parsed = ad.parseInbound(raw);
  } catch (e) {
    envelope.processing_status = "completed";
    envelope.outcome = "rejected_invalid_source";
    if (store) {
      store.inbound = store.inbound || [];
      if (!store.inbound.find((row) => row.id === envelope.id)) store.inbound.push(envelope);
    }
    return {
      outcome: "rejected_invalid_source",
      errors: [{
        code: "REJECTED_INVALID_SOURCE",
        stage: "PAYLOAD_VALIDATION",
        field_path: "payload",
        message: "The payload is not well formed. Nothing was written.",
        retained_source_value: typeof raw === "string" ? raw.slice(0, 80) : "",
      }],
      wrote: false,
      envelope,
    };
  }
  const gate = recordEnvelope(envelope, store, metrics);
  if (gate.kind === "replay") {
    return { outcome: gate.existing.outcome, replayed: true, wrote: false, envelope: gate.existing };
  }
  if (gate.kind === "conflict") {
    return { outcome: "conflict", conflict: true, wrote: false, envelope };
  }

  const beforeCounts = snapshotCounts(store);
  let txOpen = true;
  const result = runNormalisation({
    raw,
    intermediate: parsed.intermediate,
    envelope,
    connection_id: connection.connection_id,
    connection_organisation_id: connection.organisation_id,
    schema_version: envelope.schema_version,
    content_type: envelope.content_type,
    declared_content_type: envelope.content_type,
    required_fields: meta && meta.required_fields,
    require_case: meta && meta.require_case,
    require_consent: meta && meta.require_consent,
    signed_row: meta && meta.signed_row,
    incoming_contradicts_signed: meta && meta.incoming_contradicts_signed,
    conflict_field: meta && meta.conflict_field,
    incoming_value: meta && meta.incoming_value,
    force_ceiling: meta && meta.force_ceiling,
    max_bytes: meta && meta.max_bytes,
    correlation_id: envelope.correlation_id,
    now: store && store.now,
    at: store && store.now,
  }, store, metrics, ad);
  txOpen = false;

  const writesDomain = result.outcome === "normalised" || result.outcome === "normalised_with_warnings";
  if (!writesDomain) {
    restoreCounts(store, beforeCounts);
    if (result.outcome === "requires_manual_reconciliation" && store) {
      store.reconciliation = store.reconciliation || [];
      store.reconciliation.push({ inbound_id: envelope.id, reason: result.identity && result.identity.reason || result.outcome, status: "open" });
    }
  } else if (store) {
    store.domainWrites = store.domainWrites || [];
    store.domainWrites.push({ envelope_id: envelope.id, type: result.canonical_object && result.canonical_object.type });
  }

  envelope.processing_status = "completed";
  envelope.outcome = result.outcome;
  if (store) {
    store.results = store.results || [];
    store.results.push({ inbound_id: envelope.id, outcome: result.outcome, warnings: result.warnings, errors: result.errors });
  }

  return {
    ...result,
    wrote: writesDomain,
    envelope,
    transaction_held: txOpen,
  };
}

export function runInboundConcurrent(raw, meta, context, store, metrics, adapter) {
  const connection = authenticatedConnection(context);
  const envelope = buildEnvelope(raw, meta, connection);
  store.lock = store.lock || Object.create(null);
  const lockKey = connection.connection_id + ":" + envelope.idempotency_key;
  if (store.lock[lockKey]) {
    return runInbound(raw, meta, context, store, metrics, adapter);
  }
  store.lock[lockKey] = true;
  try {
    return runInbound(raw, meta, context, store, metrics, adapter);
  } finally {
    store.lock[lockKey] = false;
  }
}

function snapshotCounts(store) {
  return {
    domain: ((store && store.domainWrites) || []).length,
    inbound: ((store && store.inbound) || []).length,
  };
}

function restoreCounts(store, snap) {
  if (!store) return;
  if (store.domainWrites) store.domainWrites = store.domainWrites.slice(0, snap.domain);
}
