/* Prompt 50 Section 5.5. Reconstruct a signed artifact by stored versions,
   not by timestamp arithmetic against mutable tables. No em dashes. */

import { createHash } from "node:crypto";
import { namedError } from "./errors.mjs";

export function signArtifact(input) {
  const src = input || {};
  if (!src.content) throw namedError("RECONSTRUCT-CONTENT-MISSING", "A signed artifact needs its rendered content.");
  const versions = {
    form_definition_version: src.form_definition_version,
    code_list_version: src.code_list_version,
    fee_schedule_version: src.fee_schedule_version,
    jurisdiction_ruleset_version: src.jurisdiction_ruleset_version,
  };
  for (const [k, v] of Object.entries(versions)) {
    if (!v) throw namedError("RECONSTRUCT-VERSION-MISSING", "Signing needs " + k + ".");
  }
  const digest = createHash("sha256").update(String(src.content), "utf8").digest("hex");
  return {
    artifact: String(src.content),
    digest,
    versions,
    signed_at: src.signed_at || "set",
  };
}

export function reconstruct(signed, currentVersions) {
  if (!signed || !signed.artifact || !signed.digest) {
    throw namedError("RECONSTRUCT-SIGNED-MISSING", "Reconstruction needs the stored signed artifact.");
  }
  const again = createHash("sha256").update(String(signed.artifact), "utf8").digest("hex");
  if (again !== signed.digest) {
    throw namedError("RECONSTRUCT-DIGEST-MISMATCH", "The stored artifact does not match its digest.");
  }
  return {
    artifact: signed.artifact,
    digest: again,
    used_versions: signed.versions,
    ignored_current_versions: currentVersions || null,
    byte_identical: true,
  };
}
