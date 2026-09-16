/* Prompt 49 canonical Identifier value object.

   Namespaces belong to Prompt 48. This module does not create a parallel
   namespace table. When no namespace is supplied, validation returns
   unvalidatable. The PHN checksum is the Prompt 37/40 implementation in
   clinical/engine/phn.mjs. No second algorithm is written here.
   No em dashes or en dashes. */

import { phnGate } from "../phn.mjs";
import { namedError, isBlank, norm } from "./util.mjs";

export const VERIFICATION_STATES = Object.freeze([
  "unverified",
  "asserted",
  "verified",
  "disputed",
]);

export const IDENTIFIER_STATUSES = Object.freeze(["active", "retired", "frozen"]);

export function createIdentifier(input) {
  const r = input || {};
  if (r.scope !== "internal" && r.scope !== "external") {
    throw namedError("IDENTIFIER-SCOPE", "Identifier scope must be internal or external.");
  }
  if (r.scope === "internal" && r.vendor_value) {
    throw namedError("IDENTIFIER-INTERNAL-VENDOR", "An internal identifier carries a Continuum identifier and nothing else.");
  }
  return Object.freeze({
    type: "Identifier",
    scope: r.scope,
    namespace_key: r.namespace_key || null,
    issuing_authority: r.issuing_authority || null,
    jurisdiction_code: r.jurisdiction_code || null,
    identifier_type: r.identifier_type || null,
    value: r.value,
    valid_from: r.valid_from || null,
    valid_to: r.valid_to || null,
    verification_state: r.verification_state || "unverified",
    is_globally_unique: r.is_globally_unique === true,
    is_reassignable: r.is_reassignable === true,
    status: r.status || "active",
    source_provenance: r.source_provenance || null,
  });
}

export function createExternalIdentifier(input) {
  const r = input || {};
  return Object.freeze({
    type: "ExternalIdentifier",
    maps_onto: "mpi.external_identity",
    connection_id: r.connection_id || null,
    identifier_type: r.identifier_type || null,
    value: r.value,
    source_provenance: r.source_provenance || null,
  });
}

// Format and checksum rules come from namespace data, not code.
// A namespace with no rule returns unvalidatable, not valid.
export function validateIdentifier(namespaceKey, value, atDate, store) {
  const namespaces = (store && store.identifierNamespaces) || [];
  const ns = namespaces.find((n) => n.namespace_key === namespaceKey);
  if (!ns) return "unvalidatable";
  if (isBlank(ns.format_pattern) && isBlank(ns.checksum_rule)) return "unvalidatable";
  const v = norm(value);
  if (ns.format_pattern) {
    let re;
    try { re = new RegExp(ns.format_pattern); }
    catch (e) { return "unvalidatable"; }
    if (!re.test(v)) return "invalid";
  }
  if (ns.checksum_rule === "phn_prompt37") {
    const fails = phnGate(v, ns.phn_profile || store && store.phnProfile || {});
    if (fails.length) return "invalid";
  } else if (ns.checksum_rule && store && store.checksumRegistry && store.checksumRegistry[ns.checksum_rule]) {
    const impl = store.checksumRegistry[ns.checksum_rule];
    if (!impl(v, atDate)) return "invalid";
  } else if (ns.checksum_rule) {
    return "unvalidatable";
  }
  return "valid";
}

export function identifierForResolution(identifier, validation) {
  if (validation !== "valid") {
    return { ...identifier, verification_state: "disputed", contributes_to_deterministic: false };
  }
  if (!(identifier.is_globally_unique === true && identifier.is_reassignable === false)) {
    return { ...identifier, contributes_to_deterministic: false };
  }
  return { ...identifier, contributes_to_deterministic: true };
}
