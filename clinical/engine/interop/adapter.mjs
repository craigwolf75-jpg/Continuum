/* Prompt 49 adapter contract.

   An adapter parses vendor bytes into an intermediate representation and
   builds a vendor payload from a canonical object. It does not import a
   domain data access layer, execute SQL, contain a business rule, derive
   a band, write authorship_provenance, resolve identity, read consent,
   log a raw payload, call another adapter, or branch on jurisdiction.
   No em dashes or en dashes. */

import { namedError } from "./util.mjs";
import { stripRawMeasurements } from "./functional.mjs";

export const ADAPTER_METHODS = Object.freeze([
  "descriptor",
  "capabilities",
  "fieldManifest",
  "authenticate",
  "parseInbound",
  "buildOutbound",
  "healthProbe",
]);

export function assertDescriptor(descriptor) {
  const d = descriptor || {};
  const missing = [];
  for (const key of ["name", "version", "vendor", "transport_pattern", "canonical_version", "schema_versions"]) {
    if (!d[key]) missing.push(key);
  }
  if (missing.length) throw namedError("ADAPTER-DESCRIPTOR", "Adapter descriptor is incomplete: " + missing.join(", "));
  return d;
}

export function stripToManifest(payload, manifest, direction) {
  const entries = (manifest || []).filter((e) => e.direction === direction || e.direction === "both");
  const allowed = new Set(entries.map((e) => e.field));
  const kept = {};
  const extension = {};
  const src = payload && typeof payload === "object" ? payload : {};
  for (const [key, value] of Object.entries(src)) {
    if (allowed.has(key)) kept[key] = value;
    else extension[key] = value;
  }
  return { kept, extension_payload: extension, stripped_count: Object.keys(extension).length };
}

export function applyOutboundGuards(canonical, adapter, context, metrics) {
  const ctx = context || {};
  if (!ctx.lawful_basis_type || !ctx.lawful_basis_ref) {
    if (metrics) metrics.increment("outbound_blocked_total", { reason: "lawful_basis" });
    throw namedError("OUTBOUND-LAWFUL-BASIS", "A crossing with no lawful_basis_type and lawful_basis_ref fails closed.");
  }
  if (ctx.signed !== true) {
    if (metrics) metrics.increment("outbound_blocked_total", { reason: "unsigned_draft" });
    throw namedError("OUTBOUND-UNSIGNED", "An unsigned draft cannot be emitted.");
  }
  if (ctx.authorship_provenance === "ai_draft") {
    if (metrics) metrics.increment("outbound_blocked_total", { reason: "ai_draft" });
    throw namedError("OUTBOUND-AI-DRAFT", "A value whose authorship_provenance is ai_draft is not deliverable.");
  }
  const stripped = stripRawMeasurements(canonical, null);
  if (JSON.stringify(canonical).includes("measured_hours") || JSON.stringify(canonical).includes("measured_weight_kg")) {
    if (metrics) metrics.increment("raw_measurement_emitted_total", {});
  }
  const built = adapter.buildOutbound(stripped);
  const manifest = adapter.fieldManifest();
  const gated = stripToManifest(built, manifest, "outbound");
  return { payload: gated.kept, extension_payload: gated.extension_payload };
}

export function scanAdapterSource(sourceText) {
  const text = String(sourceText || "");
  const findings = [];
  const forbiddenImports = [
    "clinical/engine/sign_measurement",
    "clinical/engine/measurement.mjs",
    "from \"../measurement.mjs\"",
    "supabase",
    "createClient",
  ];
  for (const frag of forbiddenImports) {
    if (text.includes(frag)) findings.push({ rule: "DOMAIN-IMPORT", fragment: frag });
  }
  if (/\b(?:exec|query|psql|SELECT |INSERT |UPDATE |DELETE )\b/.test(text)) {
    findings.push({ rule: "SQL", fragment: "sql" });
  }
  if (text.includes("deriveWeightBand") || text.includes("derive_weight_band")) {
    findings.push({ rule: "BAND-DERIVATION", fragment: "deriveWeightBand" });
  }
  if (text.includes("resolveIdentity(") || text.includes("resolve_identity")) {
    findings.push({ rule: "IDENTITY", fragment: "resolveIdentity" });
  }
  if (text.includes("consent_state") || text.includes("evaluateConsent")) {
    findings.push({ rule: "CONSENT", fragment: "consent" });
  }
  if (text.includes("jurisdiction_code ===") || text.includes("if (jurisdiction") || text.includes("switch (jurisdiction") || text.includes("resolveJurisdiction")) {
    findings.push({ rule: "JURISDICTION-BRANCH", fragment: "jurisdiction" });
  }
  if (text.includes("callAdapter") || text.includes("otherAdapter")) {
    findings.push({ rule: "ADAPTER-CALLS-ADAPTER", fragment: "adapter" });
  }
  if (text.includes("console.log") && /payload|raw|body/.test(text)) {
    findings.push({ rule: "RAW-LOG", fragment: "log" });
  }
  return { ok: findings.length === 0, findings };
}

export function assertCapabilitiesTruthful(adapter, observed) {
  const caps = adapter.capabilities();
  const o = observed || {};
  if (caps.cannot && caps.cannot.includes("fhir_import_functional_capacity") && o.importedFunctionalCapacity) {
    return { ok: false, reason: "Adapter claimed it cannot import FunctionalCapacity from FHIR but did." };
  }
  return { ok: true, capabilities: caps };
}
