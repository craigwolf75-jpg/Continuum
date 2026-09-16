/* Prompt 47 Part 5: physician lifecycle, credential and contract parts only.

   INVITED -> REGISTERED -> CREDENTIALED -> ACTIVE, then SUSPENDED / INACTIVE /
   DEACTIVATED (never deleted). College expiry BLOCKS signature (not warn).
   Credential status is checked at signature time, not cached at login.
   Contract and role are validated against clinical.wcb_contract_role in the
   membership engine. Billing number belongs to the person. Skill code is
   optional. NP is blocked pending a board answer. Preferences, phrase
   libraries, templates, shortcuts, and performance screens are deferred.
   Phase 1 college check is format plus expiry. No register lookup.
   No em dashes or en dashes anywhere. */

import { namedError, requireStore, nowFrom } from "./clinic_ops_util.mjs";
import { validateContractRole } from "./membership.mjs";

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();

export const LIFECYCLE = Object.freeze({
  INVITED: "invited",
  REGISTERED: "registered",
  CREDENTIALED: "credentialed",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  INACTIVE: "inactive",
  DEACTIVATED: "deactivated",
});

const FORWARD = Object.freeze({
  invited: ["registered"],
  registered: ["credentialed"],
  credentialed: ["active"],
  active: ["suspended", "inactive", "deactivated"],
  suspended: ["active", "inactive", "deactivated"],
  inactive: ["active", "deactivated"],
  deactivated: [],
});

export const CREDENTIAL_KINDS = Object.freeze([
  "college_registration",
  "board_billing",
  "liability",
  "signature_enrolment",
]);

export function transitionLifecycle(from, to) {
  const a = norm(from);
  const b = norm(to);
  const allowed = FORWARD[a];
  if (!allowed) throw namedError("LIFECYCLE-UNKNOWN", "Unknown lifecycle status " + from + ".");
  if (!allowed.includes(b)) {
    throw namedError("LIFECYCLE-ILLEGAL", "Cannot transition from " + a + " to " + b + ".");
  }
  return { from: a, to: b };
}

export function assertNeverDelete(practitioner, store) {
  requireStore(store, "LIFECYCLE-STORE-MISSING", "A lifecycle store is required.");
  const signed = (store.signedReports || (store.cache && store.cache.signedReports) || [])
    .filter((r) => r.practitioner_id === practitioner.id || r.practitioner_id === practitioner);
  if (signed.length) {
    throw namedError("LIFECYCLE-NO-DELETE", "A practitioner who has signed reports is never deleted.");
  }
  throw namedError("LIFECYCLE-NO-DELETE", "Practitioners are deactivated, never deleted.");
}

export function collegeFormatOk(value) {
  const v = norm(value);
  if (!v) return false;
  return /^[A-Za-z0-9][A-Za-z0-9.\-]{2,31}$/.test(v);
}

export function credentialCheckAtSignature(input, store, at) {
  requireStore(store, "LIFECYCLE-STORE-MISSING", "A lifecycle store is required.");
  const src = input || {};
  const when = nowFrom(store, at);
  const credentials = src.credentials || store.credentials || (store.cache && store.cache.credentials) || [];
  const practitionerId = src.practitioner_id;
  const mine = credentials.filter((c) => !practitionerId || c.practitioner_id === practitionerId);

  const college = mine.find((c) => c.kind === "college_registration") || src.college;
  if (!college) {
    return { ok: false, blocked: true, reason: "college-missing", message: "College registration is required at signature time." };
  }
  const collegeNumber = college.format_value || college.value_ref;
  if (!collegeFormatOk(collegeNumber)) {
    return { ok: false, blocked: true, reason: "college-format", message: "College registration failed the Phase 1 format check." };
  }
  if (college.expires_on && new Date(college.expires_on) <= when) {
    return { ok: false, blocked: true, reason: "college-expired", message: "College expiry BLOCKS signature." };
  }
  if (college.status && college.status !== "active") {
    return { ok: false, blocked: true, reason: "college-inactive", message: "College credential status at signature time BLOCKS." };
  }

  if (src.contract_identifier || src.practitioner_role) {
    try {
      validateContractRole(src.contract_identifier, src.practitioner_role, store);
    } catch (e) {
      return { ok: false, blocked: true, reason: e.code || "contract-role", message: e.message };
    }
  }

  if (src.verify_board && src.board_key_name) {
    const env = store.env || {};
    const present = Boolean(env[src.board_key_name]);
    if (!present) {
      return { ok: false, blocked: true, reason: "board-credential-missing", message: "Board credential key is unset in the environment at call time." };
    }
  }

  return { ok: true, blocked: false, checked_at: when.toISOString(), cached_at_login: false };
}

export function verifyBoardKeyName(keyName, env) {
  const name = norm(keyName);
  if (!name) throw namedError("BOARD-KEY-MISSING", "Board credentials store a secret-store key name, never a password.");
  if (/password|secret|passwd/i.test(name) && !/^MYWCB_|^BOARD_|^WCB_/i.test(name)) {
    throw namedError("BOARD-KEY-INVALID", "value_ref must be an environment key name, never a secret value.");
  }
  const store = env || {};
  return { ok: Boolean(store[name]), key_name: name, secret: undefined };
}
