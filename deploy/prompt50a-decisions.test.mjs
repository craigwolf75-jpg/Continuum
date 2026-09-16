/* Prompt 50a Decision 2 obligation 2. File text scans only. No live SQL
   apply. Confirms the mpi.person allow-list stays one entry, hub and
   platform stay physically excluded (no cross-boundary REFERENCES, no
   shared grants with the platform app role), and 50a docs exist without
   em or en dashes. No em dashes or en dashes anywhere. */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { listAllowListEntries } from "../platform/service/architecture.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

function stripLineComments(sql) {
  return String(sql || "").replace(/--.*$/gm, "");
}

function sqlFiles(dir, pred) {
  return readdirSync(dir).filter(pred).map((f) => join(dir, f));
}

const allowText = readFileSync(join(root, "platform/db/tenant_exception_allowlist.txt"), "utf8");
const allow = listAllowListEntries(allowText);
ok("allow-list has exactly one non-comment entry", allow.length === 1);
ok("allow-list entry starts with mpi.person", allow.length === 1 && allow[0].startsWith("mpi.person"));

const hubRef = /\breferences\s+(tenancy|clinical|employer|audit|consent|events|config)\./i;
let hubFk = false;
for (const f of sqlFiles(join(root, "supabase/migrations"), (n) => n.endsWith(".sql"))) {
  const sql = stripLineComments(readFileSync(f, "utf8"));
  if (hubRef.test(sql)) {
    hubFk = true;
    console.error("  hub FK hit: " + f);
  }
}
ok("no supabase/migrations REFERENCES into platform schemas", !hubFk);

const platRef = /\breferences\s+(public|worker)\./i;
const grantRoles = /\b(app_clinical|app_employer|app_release|app_readonly|migrator)\b/i;
const grantOnHub = /\bon\s+(all\s+(tables|functions|sequences)\s+in\s+schema\s+|table\s+|schema\s+|function\s+|sequence\s+)?(public|worker)(\.|\b)/i;
let platFk = false;
let platGrant = false;
for (const f of sqlFiles(join(root, "platform/db"), (n) => /^0\d+_.*\.sql$/.test(n))) {
  const sql = stripLineComments(readFileSync(f, "utf8"));
  if (platRef.test(sql)) {
    platFk = true;
    console.error("  platform FK hit: " + f);
  }
  for (const stmt of sql.split(";")) {
    if (!/\bgrant\b/i.test(stmt)) continue;
    if (grantOnHub.test(stmt) && grantRoles.test(stmt)) {
      platGrant = true;
      console.error("  platform grant hit: " + f);
    }
  }
}
ok("no platform/db/0*.sql REFERENCES public. or worker.", !platFk);
ok("no platform app-role GRANT on public. or worker.", !platGrant);

const docsDir = join(root, "docs/prompts/50a");
const requiredDocs = ["DECISIONS.md", "GUARDRAILS.md", "NON_PLATFORM_INVENTORY.md"];
let docsOk = true;
let dashHit = false;
for (const name of requiredDocs) {
  let text = "";
  try {
    text = readFileSync(join(docsDir, name), "utf8");
  } catch {
    docsOk = false;
    console.error("  missing 50a doc: " + name);
    continue;
  }
  if (!text.trim()) docsOk = false;
  if (/[\u2013\u2014]/.test(text)) {
    dashHit = true;
    console.error("  dash in 50a doc: " + name);
  }
}
ok("50a decision docs exist", docsOk);
ok("50a docs contain no U+2013 or U+2014", !dashHit);

const decisions = readFileSync(join(docsDir, "DECISIONS.md"), "utf8");
ok("DECISIONS.md has Proceed against Supabase as-is", decisions.includes("Proceed against Supabase as-is"));
ok("DECISIONS.md has The mpi.person allow-list stays at exactly one entry",
  decisions.includes("The mpi.person allow-list stays at exactly one entry"));

const inventory = readFileSync(join(docsDir, "NON_PLATFORM_INVENTORY.md"), "utf8");
for (const name of [
  "public.tenants",
  "public.workers",
  "public.access_codes",
  "public.framer_demo_state",
  "worker.worker_account",
]) {
  ok("inventory lists " + name, inventory.includes(name));
}

console.log("\nprompt 50a decisions suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
