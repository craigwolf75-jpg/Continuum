/* Continuum Hub index page suite. node deploy/hub-index.test.mjs
   Statically proves the rewritten sign in page: the one time code copy is
   gone, email and password fields exist for both sign in and sign up, the
   awaiting approval state exists, Presenter Controls are gone, the three
   hub auth endpoints are called, whoami gates #roles and the admin card,
   and the page stays dash clean. No dashes anywhere. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const hub = readFileSync(join(dir, "hub", "index.html"), "utf8");

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

ok("one time code copy is gone", !/One time code/i.test(hub));
ok("sign in has an email field", /id="loginEmail"/.test(hub) && /type="email"/.test(hub));
ok("sign in has a password field", /id="loginPassword"/.test(hub) && /type="password"/.test(hub));
ok("sign up has an email field", /id="signupEmail"/.test(hub));
ok("sign up has a password field", /id="signupPassword"/.test(hub));
ok("a create account link is present", /Create an account/.test(hub));
ok("an awaiting approval state is present", /Awaiting approval/.test(hub) && /awaiting approval/i.test(hub));
ok("Presenter Controls are gone", !/Presenter controls/i.test(hub) && !/presenter\(\)/.test(hub));
ok("calls the sign up endpoint", hub.includes("/api/hub-signup"));
ok("calls the sign in endpoint", hub.includes("/api/hub-signin"));
ok("calls the whoami endpoint", hub.includes("/api/hub-whoami"));
ok("roles view is gated on an authenticated session", /if\(!session\.authenticated\)/.test(hub));
ok("the admin card mount option is wired", /mount\(host,\s*\{\s*isAdmin:\s*session\.isAdmin\s*\}\)/.test(hub));
ok("dashboard copy line is unchanged", hub.includes("Dashboard access for HSE, employer, Clinical Partner, and WCB."));
ok("worker app link is unchanged", /href="\/app"/.test(hub));
ok("page stays dash clean", !/[–—]/.test(hub));

console.log("\nhub-index suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
