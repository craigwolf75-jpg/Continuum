/* Continuum Prompt 44 schema proofs that do not need a live database. Reads 017 and 020
   and asserts session isolation CHECK, provenance enum, the recording consent columns
   (flag and version, no copy), the degraded singleton, and audio retention locked at 30
   days. Live APPLY is a human gate; this file never connects to Supabase. No dashes. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { AUDIO_RETENTION_DAYS } from "./ai_runtime.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "db");
const m016 = readFileSync(join(root, "016_migration_physician_foundation.sql"), "utf8");
const m017 = readFileSync(join(root, "017_migration_ai_provenance_and_isolation.sql"), "utf8");
const m020 = readFileSync(join(root, "020_migration_ai_components_boundaries.sql"), "utf8");
const m011 = readFileSync(join(root, "011_migration_functional_measurement_model.sql"), "utf8");

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

ok("016 creates append only audit.event", /create table if not exists audit\.event/.test(m016) && /audit\.event is append only/.test(m016));
ok("011 creates append only band_derivation_audit", /create table if not exists clinical\.band_derivation_audit/.test(m011));
ok("017 creates clinical.provenance enum including ai_draft", /create type clinical\.provenance as enum \('human','ai_draft','ai_draft_edited','carried_forward','system'\)/.test(m017));
ok("017 creates wcb_report_field with provenance", /create table if not exists clinical\.wcb_report_field/.test(m017) && /provenance clinical\.provenance/.test(m017));
ok("017 partial index for untouched ai_draft", /ix_field_untouched_draft/.test(m017) && /where provenance = 'ai_draft'/.test(m017));
ok("017 audit.ai_generation has session_isolation CHECK", /constraint session_isolation check \(session_scope_case_id = case_id\)/.test(m017));
ok("017 ai_generation is append only (revoke update delete plus trigger)", /revoke update, delete on audit\.ai_generation/.test(m017) && /trg_ai_generation_block/.test(m017));
ok("020 does not rewrite 016 or 017", !/create type clinical\.provenance/.test(m020) && !/create table if not exists clinical\.consent \(/.test(m020) && !/create table if not exists audit\.ai_generation/.test(m020));
ok("020 adds recording consent flag and version, not copy", /consent_recording_granted/.test(m020) && /consent_recording_version/.test(m020) && !/consent_recording_copy/.test(m020) && !/I agree/.test(m020));
ok("020 creates the degraded singleton", /create table if not exists clinical\.ai_runtime/.test(m020) && /degraded boolean not null default false/.test(m020));
ok("020 locks audio retention at 30 days pending counsel", /retention_days integer not null default 30 check \(retention_days = 30\)/.test(m020) && /pending_counsel boolean not null default true/.test(m020));
ok("engine constant matches the 020 lock", AUDIO_RETENTION_DAYS === 30);
ok("016 Prompt 43 consent A (clinical and board) remains distinct", /consent_a_granted boolean not null default false/.test(m016));

console.log("\nPrompt 44 schema proof suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
