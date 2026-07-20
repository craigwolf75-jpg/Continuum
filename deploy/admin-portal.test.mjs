/* Prompt 23 admin portal suite. node deploy/admin-portal.test.mjs */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "admin-portal.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// cases-by-tenant bars navigate to Tenants
ok("tenant bars open Tenants", html.includes("onclick=\"go(\\'tenants\\')\""));
// users-by-role bars open Users with the role filter
ok("role bars set roleFilter and open Users", html.includes("S.roleFilter=\\'"+"'+r+'"+"\\';S.section=\\'users\\';save()"));
ok("Users view filters by roleFilter", /if\(S\.roleFilter\)list=list\.filter\(function\(u\)\{return u\.role===S\.roleFilter/.test(html));
ok("role filter chips present", html.includes("S.roleFilter=\\'"+"'+r+'"+"\\';save()"));
ok("bars marked clickable", (html.match(/class="brow" style="cursor:pointer"/g) || []).length >= 2);

// regression + audit
ok("per-tenant aggregate computed from seed", /realT\(\)\.map\(function\(t\)\{var p=Math\.round\(t\.active\/activeCases\(\)/.test(html));
ok("dash audit clean", !/[–—]/.test(html));

console.log("\nadmin-portal suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
