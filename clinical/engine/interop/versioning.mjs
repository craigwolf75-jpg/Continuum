/* Prompt 49 canonical versioning.

   Two major versions run concurrently with a translation function.
   Additive changes are minor. A field may never be removed, renamed, or
   have its meaning changed within a major version. A vendor concept with
   no canonical home lives in extension_payload until three independent
   vendors need it.
   No em dashes or en dashes. */

import { namedError } from "./util.mjs";
import { CANONICAL_VERSION } from "./types.mjs";

export const VERSIONS = Object.freeze({
  "1.0.0": { status: "current", major: 1 },
  "2.0.0": { status: "supported", major: 2 },
});

const V1_FIELDS = Object.freeze([
  "type",
  "canonical_version",
  "maps_onto",
  "id",
  "axes",
  "status",
  "authorship_provenance",
  "source_provenance",
]);

export function currentVersion() {
  return CANONICAL_VERSION;
}

export function translate(object, fromVersion, toVersion) {
  if (!VERSIONS[fromVersion] || !VERSIONS[toVersion]) {
    throw namedError("VERSION-UNKNOWN", "Canonical version is not registered.");
  }
  if (fromVersion === toVersion) return object;
  const copy = { ...(object || {}) };
  if (fromVersion === "1.0.0" && toVersion === "2.0.0") {
    if (copy.case_reference !== undefined) {
      copy.occupational_injury_case_id = copy.case_reference;
    }
    copy.canonical_version = "2.0.0";
    return copy;
  }
  if (fromVersion === "2.0.0" && toVersion === "1.0.0") {
    if (copy.occupational_injury_case_id !== undefined) {
      copy.case_reference = copy.occupational_injury_case_id;
      delete copy.occupational_injury_case_id;
    }
    copy.canonical_version = "1.0.0";
    return copy;
  }
  throw namedError("VERSION-NO-TRANSLATION", "No translation function for those versions.");
}

export function assertMajorFieldStable(fromFields, toFields, fromVersion, toVersion) {
  const fromMajor = String(fromVersion || "").split(".")[0];
  const toMajor = String(toVersion || "").split(".")[0];
  if (fromMajor !== toMajor) return { ok: true };
  const removed = fromFields.filter((f) => !toFields.includes(f));
  const renamed = removed;
  if (removed.length) {
    return { ok: false, code: "VERSION-FIELD-REMOVED", removed };
  }
  return { ok: true, renamed };
}

export function threeVendorRule(candidateField, vendorVotes) {
  const votes = vendorVotes || [];
  if (votes.length < 3) {
    return { canonical: false, home: "extension_payload", reason: "A field earns canonical status only when three independent vendors need it." };
  }
  return { canonical: true, field: candidateField };
}

export function deprecationCi(versionRow, today) {
  const row = versionRow || {};
  if (!row.retire_after && !row.deprecated_on) return { warn: false, fail: false };
  const now = today ? new Date(today) : new Date();
  if (row.retire_after && now >= new Date(row.retire_after)) return { warn: false, fail: true };
  if (row.deprecated_on) {
    const retire = row.retire_after ? new Date(row.retire_after) : null;
    const warnFrom = retire ? new Date(retire.getTime() - 90 * 24 * 60 * 60 * 1000) : null;
    if (warnFrom && now >= warnFrom && (!retire || now < retire)) return { warn: true, fail: false };
  }
  return { warn: false, fail: false };
}

export { V1_FIELDS };
