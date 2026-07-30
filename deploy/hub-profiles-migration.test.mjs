/* Continuum Hub profiles migration suite. node deploy/hub-profiles-migration.test.mjs
   Statically proves the migration SQL text: table shape, RLS enabled, no
   anon/authenticated grants, no seeded credential or identity row, and the
   hard wall (never references access_codes/access_log). Cannot prove the
   migration actually applies without a live database; that is a CRED item
   (Task 10). No dashes anywhere. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(dir, "..", "supabase", "migrations", "20260730120000_hub_profiles.sql"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

ok("creates hub_profiles", /create table if not exists public\.hub_profiles/.test(sql));
ok("id references auth.users", /id uuid primary key references auth\.users \(id\)/.test(sql));
ok("email is unique and not null", /email text not null unique/.test(sql));
ok("status defaults to pending with a check constraint", /status text not null default 'pending' check \(status in \('pending', 'approved', 'rejected'\)\)/.test(sql));
ok("access_group is constrained to group1, group2, admin", /access_group text check \(access_group in \('group1', 'group2', 'admin'\)\)/.test(sql));
ok("role_label column present", /role_label text/.test(sql));
ok("approved_at and approved_by columns present", /approved_at timestamptz/.test(sql) && /approved_by text/.test(sql));
ok("RLS is enabled", /alter table public\.hub_profiles enable row level security/.test(sql));
ok("no anon policy is created", !/to anon/i.test(sql));
ok("no authenticated policy is created", !/to authenticated/i.test(sql));
ok("no create policy statement at all", !/create policy/i.test(sql));
ok("no seeded row is inserted", !/insert into public\.hub_profiles/i.test(sql));
ok("never references access_codes (hard wall vs the SITE gate)", !/access_codes/i.test(sql));
ok("never references access_log (hard wall vs the SITE gate)", !/access_log/i.test(sql));
ok("wrapped in a transaction", /^begin;/m.test(sql) && /^commit;$/m.test(sql));
ok("migration is dash clean", !/[–—]/.test(sql));

console.log("\nhub-profiles-migration suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
