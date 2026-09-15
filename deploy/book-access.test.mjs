/* Continuum /book access-request suite.
   node deploy/book-access.test.mjs
   Proves the public /book page posts to the existing /api/marketing-lead
   channel with source /book (that notifier emails SIGNUP_NOTIFY_TO, normally
   info@continuumrtw.com), that /book is site-gate public, and that the
   holding Book a demo CTA lands here. No email templates, no package.json.
   No dashes anywhere. */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { decideSiteAccess } from "./middleware.js";

const dir = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(dir, f), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

ok("book.html exists", existsSync(join(dir, "book.html")));
const book = read("book.html");
const links = read("site-links.js");
const holding = read("gate/holding.html");

ok("bookingUrl points at /book", /bookingUrl:\s*'https:\/\/continuumrtw\.com\/book'/.test(links));
ok("book page posts to /api/marketing-lead", book.includes("/api/marketing-lead"));
ok("book page sends source /book", /source:\s*"\/book"/.test(book));
ok("book page Request access control present", book.includes("Request access"));
ok("book page work email field present", /id="reqEmail"/.test(book) && /type="email"/.test(book));
ok("book page fail copy keeps the info@ mailto fallback", book.includes("email info@continuumrtw.com"));
ok("book page success copy is the holding thanks line", book.includes("Thanks. We will be in touch shortly."));
ok("book page loads design tokens, not raw hex", book.includes("/continuum_tokens.css") && !/#[0-9A-Fa-f]{3,6}\b/.test(book.replace(/https?:\/\/[^"'\s]+/g, " ")));
ok("book page does not load a locked email template", !/emails\//.test(book) && !/resend\.dev/.test(book));
ok("holding Book a demo CTA points at /book", /href="\/book"/.test(holding) && holding.includes("Book a demo"));
ok("holding no longer uses the pending booking placeholder", !holding.includes("#booking-url-pending"));

ok("/book allows without a cookie", decideSiteAccess("/book", false, undefined) === "allow");
ok("/book.html allows without a cookie", decideSiteAccess("/book.html", false, undefined) === "allow");
ok("/book with a cookie still allows", decideSiteAccess("/book", true, undefined) === "allow");

try { new Function(book.match(/<script>([\s\S]*?)<\/script>/)[1]); ok("book.html inline script parses", true); }
catch (e) { ok("book.html inline script parses [" + e.message + "]", false); }

ok("book page dash clean", !/[–—]/.test(book));
ok("site-links dash clean", !/[–—]/.test(links));

console.log("\nbook-access suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
