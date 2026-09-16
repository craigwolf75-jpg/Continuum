/* Prompt 50 architecture scans. Fail the build on a forbidden import, a
   client-asserted tenant, a control flag, or a clinical log field.
   No em dashes or en dashes anywhere. */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const SERVICE_DIR_FILES = [
  "errors.mjs", "tenant_context.mjs", "metrics.mjs", "logging.mjs", "tracing.mjs",
  "secrets.mjs", "lifecycle.mjs", "provision.mjs", "authorize.mjs", "consent.mjs",
  "config.mjs", "flags.mjs", "audit.mjs", "events.mjs", "release.mjs",
  "reconstruction.mjs", "break_glass.mjs", "health.mjs", "uuid.mjs",
  "observability_spec.mjs",
];

export function serviceDir(root) {
  return join(root, "platform/service");
}

export function readService(root, name) {
  return readFileSync(join(serviceDir(root), name), "utf8");
}

export function allServiceSource(root) {
  return SERVICE_DIR_FILES.map((f) => readService(root, f)).join("\n");
}

export function scanEmployerWall(root) {
  const files = readdirSync(serviceDir(root)).filter((f) => f.endsWith(".mjs"));
  const offenders = [];
  for (const f of files) {
    if (f === "release.mjs" || f === "architecture.mjs") continue;
    const src = readService(root, f);
    const clinical = /clinical\./.test(src) || /from ["'].*clinical\//.test(src);
    const employer = /employer\./.test(src) || /disclosure_release/.test(src);
    if (clinical && employer) offenders.push(f);
  }
  return { ok: offenders.length === 0, offenders };
}

export function scanControlFlags(root) {
  const src = readService(root, "flags.mjs");
  return { ok: /CONTROL_FLAG_KEYS/.test(src) && /assertFlagAllowed/.test(src) };
}

export function scanLoggingAllowList(root) {
  const src = readService(root, "logging.mjs");
  return { ok: /LOG_ALLOW_LIST/.test(src) && /assertNoClinicalLogField/.test(src) };
}

export function scanClientTenant(root) {
  const src = readService(root, "tenant_context.mjs");
  return { ok: /ignored_client_assertions/.test(src) && /principal\.organisation_id/.test(src) };
}

export function scanAuthorizeBoundary(root) {
  const src = readService(root, "authorize.mjs");
  return { ok: /assertServiceBoundary/.test(src) && /boundary: "service"/.test(src) };
}

export function listAllowListEntries(text) {
  return String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}
