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
const gateTests = readFileSync(join(root, "supabase", "tests", "worker_provision_gate.sql"), "utf8");
const archive = readFileSync(join(root, "supabase", "archive", "clinician-fork", "README.md"), "utf8");
const gateMigName = "20260915150000_worker_provision_invite_gate.sql";
const grantMigName = "20260915151000_worker_provision_grant_authenticated.sql";
const gateMig = readFileSync(join(migDir, gateMigName), "utf8");
const grantMig = readFileSync(join(migDir, grantMigName), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

ok("seven 20260915 worker migrations present", names.length === 7);
ok("invite-gate migration is present", names.includes(gateMigName));
ok("authenticated-grant migration is present", names.includes(grantMigName));
ok("grant migration comes after gate migration", grantMigName > gateMigName);
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
ok("exposure-proof runs worker_provision_gate.sql", /supabase\/tests\/worker_provision_gate\.sql/.test(yml));
ok("workflow is dash clean", !/[–—]/.test(yml));

ok("worker_schema.sql tests the trigger", /worker\.worker_account/.test(tests) && /auth\.users/.test(tests));
ok("worker_schema.sql tests owns_case", /worker\.owns_case/.test(tests));
ok("worker_schema.sql forbids clinician. in pg_get_functiondef", /pg_get_functiondef/.test(tests) && /clinician\./.test(tests));
ok("worker_schema.sql is dash clean", !/[–—]/.test(tests));

ok("gate migration records provision_worker revoke from public, anon, authenticated",
  /revoke execute on function worker\.provision_worker\(uuid, text\)\s+from public, anon, authenticated;/i.test(gateMig));
ok("gate migration creates worker.case_invite", /create table if not exists worker\.case_invite/i.test(gateMig));
ok("gate migration refuses uninvited case bind", /not invited to this case/.test(gateMig));
ok("gate migration invite check precedes case lookup",
  gateMig.indexOf("not invited to this case") < gateMig.indexOf("case not found"));
ok("gate migration does not grant execute on provision_worker",
  !/grant execute on function worker\.provision_worker/i.test(gateMig));
ok("gate migration is dash clean", !/[–—]/.test(gateMig));

ok("grant migration grants execute on provision_worker to authenticated",
  /grant execute on function worker\.provision_worker\(uuid, text\)\s+to authenticated;/i.test(grantMig));
ok("grant migration does not grant execute to anon or public",
  !/grant execute on function worker\.provision_worker\([^)]*\)\s+to [^;]*\banon\b/i.test(grantMig)
  && !/grant execute on function worker\.provision_worker\([^)]*\)\s+to [^;]*\bpublic\b/i.test(grantMig));
ok("grant migration does not grant execute to service_role",
  !/grant execute on function worker\.provision_worker\([^)]*\)\s+to [^;]*\bservice_role\b/i.test(grantMig));
ok("grant migration records live GRANT Hermes already applied",
  /records the live GRANT Hermes already applied/i.test(grantMig));
ok("grant migration is dash clean", !/[–—]/.test(grantMig));

ok("worker_provision_gate.sql denies anon execute", /set role anon/.test(gateTests) && /insufficient_privilege/.test(gateTests));
ok("worker_provision_gate.sql requires authenticated execute",
  /authenticated missing execute on provision_worker/.test(gateTests));
ok("worker_provision_gate.sql requires postgres execute",
  /owner postgres missing execute on provision_worker/.test(gateTests));
ok("worker_provision_gate.sql requires postgres owner",
  /provision_worker owner is not postgres/.test(gateTests));
ok("worker_provision_gate.sql denies uninvited bind",
  /uninvited caller bound an arbitrary case/.test(gateTests)
  && /not invited to this case/.test(gateTests));
ok("worker_provision_gate.sql proves invited bind", /invited bind did not set clinical_worker_id/.test(gateTests));
ok("worker_provision_gate.sql is dash clean", !/[–—]/.test(gateTests));

ok("archive note exists", /unused fork/i.test(archive) && /public\.workers/.test(archive));
ok("archive note is dash clean", !/[–—]/.test(archive));

const cfg = readFileSync(join(dir, "worker", "app", "config.js"), "utf8");
ok("config.js names hub_profiles, public.users, worker_account", /hub_profiles/.test(cfg) && /public\.users/.test(cfg) && /worker_account/.test(cfg));
ok("config.js clinic-staff mapping is parked", /case_in_caller_clinic/.test(cfg) && /returns false/.test(cfg));
ok("config.js is dash clean", !/[–—]/.test(cfg));

console.log("\nworker-schema-graph suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
