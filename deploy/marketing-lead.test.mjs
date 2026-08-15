/* Continuum Prompt 62: unit tests for the marketing-lead endpoint's pure parts.
   The route's I/O (Supabase insert, Resend forward) is not exercised here; only
   the deterministic guards are: email shape validation and the cross-site guard.
   No network. No dashes anywhere. Run by node; the suites workflow globs it. */

import { isEmail, isCrossSiteRequest } from "./api/marketing-lead.js";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// ---- isEmail ---------------------------------------------------------------
ok("accepts a plain address", isEmail("person@example.com"));
ok("accepts a subdomain address", isEmail("a.b@mail.example.co"));
ok("rejects empty", !isEmail(""));
ok("rejects missing @", !isEmail("person.example.com"));
ok("rejects missing domain dot", !isEmail("person@example"));
ok("rejects spaces", !isEmail("per son@example.com"));
ok("rejects a non-string", !isEmail(null));
ok("rejects a non-string number", !isEmail(12345));
ok("rejects an over-long address", !isEmail("a".repeat(250) + "@example.com"));

// ---- isCrossSiteRequest ----------------------------------------------------
ok("same-origin post is allowed (sec-fetch-site same-origin)",
  !isCrossSiteRequest({ headers: { "sec-fetch-site": "same-origin" } }));
ok("cross-site fetch header is blocked",
  isCrossSiteRequest({ headers: { "sec-fetch-site": "cross-site" } }));
ok("matching origin/host is allowed",
  !isCrossSiteRequest({ headers: { origin: "https://continuumrtw.com", host: "continuumrtw.com" } }));
ok("mismatched origin/host is blocked",
  isCrossSiteRequest({ headers: { origin: "https://evil.example", host: "continuumrtw.com" } }));
ok("a malformed origin is blocked (fails closed on parse)",
  isCrossSiteRequest({ headers: { origin: "not a url", host: "continuumrtw.com" } }));
ok("no headers at all is allowed (nothing proves cross-site)",
  !isCrossSiteRequest({}));

console.log(`\nmarketing-lead suite: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
