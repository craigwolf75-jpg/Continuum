/* Continuum live worker sign up and sign in suite.
   node deploy/worker-live-auth.test.mjs
   Proves deploy/worker/ exposes both options, WK.validateSignup / WK.signUp
   exist, and /worker is reachable without a site-gate cookie (worker pages
   still guard via Supabase session). Does not claim SITE-12j consent copy
   is unblocked. No dashes anywhere. */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { decideSiteAccess } from "./middleware.js";

const dir = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(dir, f), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

ok("worker login exists", existsSync(join(dir, "worker/login.html")));
ok("worker signup exists", existsSync(join(dir, "worker/signup.html")));

const login = read("worker/login.html");
const signup = read("worker/signup.html");
const app = read("worker/app/app.js");

ok("login offers Sign in", /<h1>Sign in<\/h1>/.test(login) && />Sign in</.test(login));
ok("login links to signup.html", /href="signup\.html"/.test(login) && /Sign up/.test(login));
ok("signup offers Sign up", /<h1>Sign up<\/h1>/.test(signup));
ok("signup Create an account control present", signup.includes("Create an account"));
ok("signup links back to login.html", /href="login\.html"/.test(signup) && /Sign in/.test(signup));
ok("signup posts through WK.signUp", /WK\.signUp\(/.test(signup));
ok("login posts through WK.signIn", /WK\.signIn\(/.test(login));
ok("app.js defines WK.validateSignup", /WK\.validateSignup\s*=\s*function/.test(app));
ok("app.js defines WK.signUp", /WK\.signUp\s*=\s*function/.test(app));
ok("app.js still defines WK.signIn", /WK\.signIn\s*=\s*function/.test(app));

const core = (app.match(/WK\.validateSignup = function \(email, password\) \{[\s\S]*?return \{ ok: true, email: e, password: p \};\n  \};/) || [])[0];
ok("validateSignup block extracted", Boolean(core));
const WK = {};
new Function("WK", core + "\n")(WK);
ok("valid signup input is ok", WK.validateSignup("a@b.com", "longenough").ok === true);
ok("missing at-sign is rejected", WK.validateSignup("nope", "longenough").ok === false);
ok("short password is rejected", WK.validateSignup("a@b.com", "short").ok === false);
ok("empty email is rejected", WK.validateSignup("", "longenough").ok === false);
ok("email is lowercased", WK.validateSignup("A@B.COM", "longenough").email === "a@b.com");

ok("/worker allows without a cookie", decideSiteAccess("/worker", false, undefined) === "allow");
ok("/worker/login.html allows without a cookie", decideSiteAccess("/worker/login.html", false, undefined) === "allow");
ok("/worker/signup.html allows without a cookie", decideSiteAccess("/worker/signup.html", false, undefined) === "allow");
ok("/worker-dashboard without a cookie still holds", decideSiteAccess("/worker-dashboard", false, undefined) === "holding");
ok("/worker-embed.html without a cookie still holds", decideSiteAccess("/worker-embed.html", false, undefined) === "holding");

ok("worker auth surfaces dash clean", ![login, signup, app].some((s) => /[–—]/.test(s)));

console.log("\nworker-live-auth suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
