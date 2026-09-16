/* Prompt 50 Section 4.4. Credentials come from the environment only.
   Missing secrets fail closed. Values are never returned to logs.
   No em dashes or en dashes anywhere. */

import { namedError } from "./errors.mjs";

export function readSecret(name, env) {
  const key = String(name || "").trim();
  if (!key) throw namedError("SECRET-NAME-MISSING", "A secret name is required.");
  const src = env || process.env;
  const value = src[key];
  if (value === undefined || value === null || String(value) === "") {
    throw namedError("SECRET-MISSING", "A required secret is not configured. Ask operations to set it.");
  }
  return String(value);
}

export function secretResolved(name, env) {
  try {
    readSecret(name, env);
    return true;
  } catch (e) {
    if (e && e.code === "SECRET-MISSING") return false;
    throw e;
  }
}

export function redactedName(name) {
  return String(name || "");
}
