/* Continuum Prompt 40 site access suite. node deploy/site-access.test.mjs
   Not one of the two suites explicitly named in the Prompt 40 spec; added
   because rateDecision (deploy/api/site-access.js) is explicitly built as a
   pure, unit testable function and the brief calls for thoroughly unit
   testing all pure logic. Proves the 10 attempts per hour, then 1 hour
   lockout rule in isolation.
   PENDING CREDS: this proves rateDecision only. Importing this module is
   side effect free (no network call happens at import time), but the
   Supabase backed counter read, the validate_and_log_access RPC call, and
   the handler's request/response cycle end to end all remain untested
   pending live CONTINUUM_SUPABASE_URL / CONTINUUM_SUPABASE_SERVICE_KEY /
   CONTINUUM_SITE_SESSION_SECRET values and a deployed database.
   No dashes anywhere. */
import { rateDecision, MAX_ATTEMPTS, WINDOW_SECONDS } from "./api/site-access.js";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const now = 1_800_000_000;

// -- under the cap, no stored lockout: not blocked --
ok("zero attempts is not blocked", rateDecision(0, null, now).blocked === false);
ok("a few attempts under the cap is not blocked", rateDecision(3, null, now).blocked === false);
ok("one under the cap is not blocked", rateDecision(MAX_ATTEMPTS - 1, null, now).blocked === false);
ok("not blocked reports zero retryAfter", rateDecision(0, null, now).retryAfter === 0);

// -- crossing the cap blocks, even with no explicit lockedUntil stored yet --
ok("exactly at the cap is blocked", rateDecision(MAX_ATTEMPTS, null, now).blocked === true);
ok("over the cap is blocked", rateDecision(MAX_ATTEMPTS + 5, null, now).blocked === true);
ok(
  "crossing the cap without a stored lockout blocks for the full window",
  rateDecision(MAX_ATTEMPTS, null, now).retryAfter === WINDOW_SECONDS
);

// -- an active stored lockout blocks regardless of the rolling count --
const locked = rateDecision(2, now + 1200, now);
ok("an active lockout blocks even with a low attempt count", locked.blocked === true);
ok("an active lockout reports the exact remaining seconds", locked.retryAfter === 1200);

// -- a lockout timestamp already in the past does not block on its own --
const expiredLock = rateDecision(0, now - 10, now);
ok("an expired lockout with a low count does not block", expiredLock.blocked === false);
const expiredLockButStillOverCap = rateDecision(MAX_ATTEMPTS, now - 10, now);
ok("an expired lockout still blocks if the rolling count is still over the cap", expiredLockButStillOverCap.blocked === true);

// -- a lockout exactly at "now" does not count as still active --
ok("a lockout equal to now is treated as expired", rateDecision(0, now, now).blocked === false);

console.log("\nsite-access suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
