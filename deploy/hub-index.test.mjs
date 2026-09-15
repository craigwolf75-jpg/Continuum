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
ok("live companion note links to /worker", hub.includes('Live companion: <a href="/worker">open the worker companion</a> to sign in.'));
ok("pilot dashboard note links to /worker-dashboard.html", hub.includes('Pilot dashboard: <a href="/worker-dashboard.html">open the pilot worker dashboard</a> for check-in and duties.'));
ok("demo note links to /app", hub.includes('Demo: <a href="/app">open the demonstration worker app</a>. It uses a text message (SMS) code.'));
ok("/app is no longer the live worker entry", !hub.includes("Workers use the") && !hub.includes('href="/app">worker app'));
ok("worker card is the live companion", hub.includes("Your live recovery companion. Sign in with your email to open it.") && hub.includes('class="role role-worker" data-nav="/worker"'));
ok("mixed check-in duties copy is off the worker card", !hub.includes("Your space for recovery. Do a quick check-in"));
ok("page stays dash clean", !/[–—]/.test(hub));
ok("signin reads data.error so a site cookie miss is not a password failure", /function doSignin[\s\S]*?result\.data\.error/.test(hub));
ok("signup reads data.error so a site cookie miss is not a create failure", /function doSignup[\s\S]*?result\.data\.error/.test(hub));

console.log("\nhub-index suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
