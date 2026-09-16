/* Prompt 47 Part 11: diagnostic view and break glass only.

   Diagnostic metadata and error reference codes. No clinical read. Break glass
   is time limited, clinic consented, administrator notified, and audit flagged
   as break_glass. Default: no Continuum employee clinical access. Secrets are
   never returned. No helpdesk, KB, ticketing, live chat, or status page.
   No em dashes or en dashes anywhere. */

import { namedError, requireStore, nowFrom } from "./clinic_ops_util.mjs";
import { MYWCB_CREDENTIAL_KEYS, REDACTED } from "./credential.mjs";

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();

export const DEFAULT_CONTINUUM_CLINICAL_ACCESS = false;

export const CLINICAL_STRIP_KEYS = Object.freeze([
  "diagnosis",
  "pain",
  "restriction",
  "phn",
  "measurement",
  "measurements",
  "measured_weight_kg",
  "measured_hours",
  "symptom",
  "medication",
  "prescription",
  "narrative",
  "finding",
]);

function isClinicalKey(key) {
  const k = norm(key).toLowerCase();
  return CLINICAL_STRIP_KEYS.some((term) => k === term || k.includes(term));
}

function collectSecrets(env) {
  const secrets = [];
  const src = env || {};
  for (const key of MYWCB_CREDENTIAL_KEYS) if (src[key]) secrets.push(String(src[key]));
  for (const [k, v] of Object.entries(src)) {
    if (/password|secret|passwd|token/i.test(k) && v) secrets.push(String(v));
  }
  return secrets;
}

function redactDeep(node, secrets) {
  if (node === null || node === undefined) return node;
  if (typeof node === "string") {
    let out = node;
    for (const s of secrets) if (s) out = out.split(String(s)).join(REDACTED);
    return out;
  }
  if (Array.isArray(node)) return node.map((v) => redactDeep(v, secrets));
  if (typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (isClinicalKey(k)) continue;
      if (/password|secret|passwd/i.test(k)) continue;
      out[k] = redactDeep(v, secrets);
    }
    return out;
  }
  return node;
}

export function diagnosticPayload(input, env) {
  const src = input || {};
  const secrets = collectSecrets(env || src.env || {});
  const meta = src.metadata && typeof src.metadata === "object" ? src.metadata : {};
  const cleaned = redactDeep({
    error_reference: src.error_reference || src.reference || null,
    component: src.component || null,
    status: src.status || "open",
    metadata: meta,
  }, secrets);
  if (cleaned.metadata) {
    for (const k of Object.keys(cleaned.metadata)) {
      if (isClinicalKey(k)) delete cleaned.metadata[k];
    }
  }
  const text = JSON.stringify(cleaned);
  for (const s of secrets) {
    if (s && text.includes(s)) {
      throw namedError("DIAGNOSTIC-SECRET-LEAK", "Diagnostic payload refused: a secret would have been emitted.");
    }
  }
  for (const term of CLINICAL_STRIP_KEYS) {
    if (cleaned.metadata && Object.keys(cleaned.metadata).some((k) => k.toLowerCase().includes(term))) {
      throw namedError("DIAGNOSTIC-CLINICAL-REFUSED", "Diagnostic view has no clinical read.");
    }
  }
  return cleaned;
}

export function openBreakGlass(input, store) {
  requireStore(store, "SUPPORT-STORE-MISSING", "A support store is required.");
  const src = input || {};
  if (src.clinic_consented !== true) {
    throw namedError("BREAK-GLASS-CONSENT-REQUIRED", "Break glass requires clinic consent.");
  }
  if (src.admin_notified !== true) {
    throw namedError("BREAK-GLASS-ADMIN-REQUIRED", "Break glass requires the administrator to be notified.");
  }
  if (!src.starts_at || !src.ends_at) {
    throw namedError("BREAK-GLASS-WINDOW-REQUIRED", "Break glass requires a time window (starts_at and ends_at).");
  }
  if (new Date(src.ends_at) <= new Date(src.starts_at)) {
    throw namedError("BREAK-GLASS-WINDOW-INVALID", "Break glass ends_at must be after starts_at.");
  }
  if (!norm(src.reason)) {
    throw namedError("BREAK-GLASS-REASON-REQUIRED", "Break glass requires a reason.");
  }
  const row = {
    id: src.id || (store.nextId && store.nextId("break_glass")),
    organisation_id: src.organisation_id,
    location_id: src.location_id,
    actor_id: src.actor_id,
    clinic_consented: true,
    admin_notified: true,
    reason: norm(src.reason),
    starts_at: src.starts_at,
    ends_at: src.ends_at,
    reviewed: false,
    audit_flag: "break_glass",
    continuum_clinical_access: DEFAULT_CONTINUUM_CLINICAL_ACCESS,
  };
  store.break_glass = store.break_glass || [];
  store.break_glass.push(row);
  const leaked = JSON.stringify(row);
  const secrets = collectSecrets(src.env || store.env || {});
  for (const s of secrets) {
    if (s && leaked.includes(s)) throw namedError("BREAK-GLASS-SECRET-LEAK", "Break glass output refused: a secret would have been stored.");
  }
  return row;
}

export function isBreakGlassActive(row, at, store) {
  if (!row) return false;
  if (row.clinic_consented !== true) return false;
  const when = nowFrom(store, at);
  return new Date(row.starts_at) <= when && when < new Date(row.ends_at);
}

export function defaultContinuumClinicalAccess() {
  return DEFAULT_CONTINUUM_CLINICAL_ACCESS;
}
