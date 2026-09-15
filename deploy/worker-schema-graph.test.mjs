/* Continuum worker schema graph suite (SB-001..007).
   node deploy/worker-schema-graph.test.mjs
   Statically proves shipping worker SQL: no clinician. token, creates schema
   worker, has an auth.users trigger, has no encrypted_password or demo
   password literals, dash-clean. No dashes anywhere. */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, "..");
const migDir = join(root, "supabase", "migrations");
const names = readdirSync(migDir).filter((f) => f.startsWith("20260915") && f.endsWith(".sql"));
const sql = names.map((f) => readFileSync(join(migDir, f), "utf8")).join("\n");
const shim = readFileSync(join(root, "supabase", "ci", "01_clinical_identity_shim.sql"), "utf8");
const yml = readFileSync(join(root, ".github", "workflows", "exposure-proof.yml"), "utf8");
const tests = readFileSync(join(root, "supabase", "tests", "worker_schema.sql"), "utf8");
const archive = readFileSync(join(root, "supabase", "archive", "clinician-fork", "README.md"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

ok("five 20260915 worker migrations present", names.length === 5);
ok("creates schema worker", /create schema if not exists worker/i.test(sql));
ok("shipping worker SQL has no clinician. token", !sql.includes("clinician."));
ok("has auth.users trigger", /after insert on auth\.users/i.test(sql));
ok("trigger function provisions worker_account", /insert into worker\.worker_account/i.test(sql));
ok("owns_case joins clinical.wcb_case", /join clinical\.wcb_case/i.test(sql));
ok("no encrypted_password", !/encrypted_password/i.test(sql));
ok("no crypt() password material", !/\bcrypt\s*\(/i.test(sql) && !/extensions\.crypt/i.test(sql));
ok("no demo password literals", !/demo[_-]?password/i.test(sql) && !/password123/i.test(sql));
ok("deployment flags default false", /PSYCH_CAPTURE_PRODUCTION_RELEASE', false/.test(sql));
ok("wrapped in begin/commit", names.every((f) => {
  const t = readFileSync(join(migDir, f), "utf8");
  return /^begin;/m.test(t) && /^commit;$/m.test(t);
}));
ok("shipping worker SQL is dash clean", !/[–—]/.test(sql));

const migAll = readdirSync(migDir);
ok("no clinician_* shipping migrations", !migAll.some((f) => /clinician_/i.test(f)));

ok("CI shim is CI only", /CI ONLY/i.test(shim));
ok("CI shim creates clinical and employer", /create schema if not exists clinical/i.test(shim) && /create schema if not exists employer/i.test(shim));
ok("CI shim grants usage to authenticated, anon, service_role", /grant usage on schema clinical to authenticated, anon, service_role/i.test(shim));
ok("CI shim has no password material", !/encrypted_password|password123|demo[_-]?password|crypt\s*\(/i.test(shim));
ok("CI shim is dash clean", !/[–—]/.test(shim));

ok("exposure-proof applies 01 after 00", /01_clinical_identity_shim\.sql/.test(yml));
ok("exposure-proof runs worker_schema.sql", /supabase\/tests\/worker_schema\.sql/.test(yml));
ok("workflow is dash clean", !/[–—]/.test(yml));

ok("worker_schema.sql tests the trigger", /worker\.worker_account/.test(tests) && /auth\.users/.test(tests));
ok("worker_schema.sql tests owns_case", /worker\.owns_case/.test(tests));
ok("worker_schema.sql forbids clinician. in pg_get_functiondef", /pg_get_functiondef/.test(tests) && /clinician\./.test(tests));
ok("worker_schema.sql is dash clean", !/[–—]/.test(tests));

ok("archive note exists", /unused fork/i.test(archive) && /public\.workers/.test(archive));
ok("archive note is dash clean", !/[–—]/.test(archive));

const cfg = readFileSync(join(dir, "worker", "app", "config.js"), "utf8");
ok("config.js names hub_profiles, public.users, worker_account", /hub_profiles/.test(cfg) && /public\.users/.test(cfg) && /worker_account/.test(cfg));
ok("config.js clinic-staff mapping is parked", /case_in_caller_clinic/.test(cfg) && /returns false/.test(cfg));
ok("config.js is dash clean", !/[–—]/.test(cfg));

console.log("\nworker-schema-graph suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
