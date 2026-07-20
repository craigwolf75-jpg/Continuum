/* Prompt 23 board portal suite. node deploy/wcb-portal.test.mjs */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "wcb-portal.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// sortable claims table
ok("sortClaims present", /function sortClaims\(k\)\{/.test(html));
ok("sortClaims flips direction on repeat key", /if\(S\.csort\.key===k\)S\.csort\.dir\*=-1;else S\.csort=\{key:k,dir:1\}/.test(html));
ok("table sorts the list before rendering rows", /if\(cs\.key\)\{sorted\.sort\(function\(a,b\)/.test(html));
ok("worker/status/phase headers clickable", html.includes("sortClaims(\\'worker\\')") && html.includes("sortClaims(\\'status\\')") && html.includes("sortClaims(\\'phase\\')"));
ok("direction indicators", html.includes("cs.dir>0?' &#9650;':' &#9660;'"));

// clickable status bars route to filtered claims
ok("status bar opens filtered claims", html.includes("S.section=\\'claims\\';save()"));
ok("claims view filters by S.filter", /if\(S\.filter&&c\.status!==S\.filter\)return false/.test(html));
ok("filter chip renders per-status counts", html.includes("ST[k][0]+' ('+c[k]"));

// regression + audit
ok("csort seeded in fresh state", /csort:\{key:null,dir:1\}/.test(html));
ok("dash audit clean", !/[–—]/.test(html));

console.log("\nwcb-portal suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
