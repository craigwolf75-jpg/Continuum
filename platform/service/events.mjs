/* Prompt 50 Section 8. Emit inside the same unit of work. Outbox after
   commit. Draft types have no external subscriber. No em dashes. */

import { randomUUID } from "node:crypto";
import { namedError } from "./errors.mjs";

export const EVENT_CLASSES = Object.freeze(["domain", "integration", "notification"]);

export function assertSchemaAdditive(existingFields, nextFields) {
  const have = new Set(existingFields || []);
  for (const f of have) {
    if (!(nextFields || []).includes(f)) {
      throw namedError("EVENT-SCHEMA-FIELD-REMOVED", "Event fields may be added. They may not be removed or renamed.");
    }
  }
  return true;
}

export function emit(input, store) {
  const src = input || {};
  if (!store || typeof store !== "object") throw namedError("EVENT-STORE-MISSING", "An event store is required.");
  if (store.rolled_back) throw namedError("EVENT-TX-ROLLED-BACK", "The change was not saved, so the event was not saved.");
  if (!EVENT_CLASSES.includes(src.event_class)) {
    throw namedError("EVENT-CLASS-UNKNOWN", "That event class is not recognised.");
  }
  store.events = store.events || [];
  store.outbox = store.outbox || [];
  const same = store.events.filter((e) => e.aggregate_type === src.aggregate_type && e.aggregate_id === src.aggregate_id);
  const sequence = same.length + 1;
  if (same.some((e) => e.sequence_in_aggregate === sequence)) {
    throw namedError("EVENT-SEQUENCE-DUP", "Two events for the same record cannot share a sequence.");
  }
  const row = {
    id: src.id || randomUUID(),
    event_class: src.event_class,
    event_type: src.event_type,
    schema_version: src.schema_version || 1,
    aggregate_type: src.aggregate_type,
    aggregate_id: src.aggregate_id,
    sequence_in_aggregate: sequence,
    correlation_id: src.correlation_id,
    payload: src.payload || {},
    organisation_id: src.organisation_id,
  };
  store.events.push(row);
  const isDraft = String(src.event_type || "").endsWith(".drafted");
  if (src.event_class !== "domain" && !isDraft) {
    const subs = (store.subscriptions || []).filter((s) =>
      s.is_entitled && s.event_class === src.event_class && (s.event_type === src.event_type || s.event_type === "*")
    );
    for (const s of subs) {
      store.outbox.push({ event_id: row.id, destination: s.destination, status: "pending" });
    }
  }
  return row;
}

export function outboxPendingAtCommit(store) {
  return (store.outbox || []).every((o) => o.status === "pending" || o.status === "dispatched" || o.status === "failed");
}
