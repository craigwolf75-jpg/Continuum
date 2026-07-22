/* Continuum sidebar page scripts probe (Prompt 35 companion). node deploy/sidebar-scripts.test.mjs
   Asserts a script exists for every sidebar page in every portal (48 total), that
   the seven portal sections are present, that the numbers match the screens, and
   that the Presenter Agent Kit lists both scripts files. Hard-fail; no em-dashes. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(join(dir, "..", "specs", f), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const s = read("CONTINUUM_SIDEBAR_SCRIPTS.md");
const kit = read("CONTINUUM_PRESENTER_AGENT_KIT.md");

// seven portal sections
["## Worker app", "## Employer dashboard", "## HSE hub", "## Clinical seat, Nexus Health", "## Board seat, WCB", "## Admin", "## SIGMA portal (SIGMA-RH connection)"]
  .forEach(h => ok("portal section present: " + h.slice(3), s.includes(h)));

// every sidebar page has a script (48 across the seven portals)
ok("48 sidebar page scripts", (s.match(/^### /gm) || []).length === 48);
["Recovery Trend", "My Duties", "Injured Workers", "Return to Work", "Doctor Visits", "Case Notes", "Benchmarking", "Integrations", "Providers", "SIGMA exchange", "Mount Olympus", "Tenants", "Grants", "Billing", "Audit", "Case exchange", "Field mapping", "Sync history", "Permissions"]
  .forEach(p => ok("page covered: " + p, s.includes("### " + p)));

// numbers matched to the screens (case-insensitive: sentences may capitalize the word)
const sl = s.toLowerCase();
ok("HSE: seven open cases", sl.includes("seven open cases"));
ok("board: nineteen open claims", sl.includes("nineteen open claims"));
ok("board: seven to acknowledge", sl.includes("seven to acknowledge"));
ok("clinical and admin: twenty-four active cases (both)", (sl.match(/twenty-four active cases/g) || []).length >= 2);
ok("worker: day nine", sl.includes("day nine"));
ok("SIGMA: Jordan Miller is the worked example", s.includes("Jordan Miller"));
ok("SIGMA: prepared and held", s.toLowerCase().includes("prepared and held"));

// employer names clinical detail only as absences
ok("employer: no pain score, no diagnosis, no note", s.includes("No pain score, no diagnosis, no note"));
ok("employer: the work, not the medicine", s.includes("not the medicine"));

// the agent kit lists both scripts files, portal first then sidebar
ok("kit lists the portal scripts first", /1\. Presentation scripts \(CONTINUUM_PRESENTATION_SCRIPTS\.md\)/.test(kit));
ok("kit lists the sidebar scripts second", /2\. Sidebar page scripts \(CONTINUUM_SIDEBAR_SCRIPTS\.md\)/.test(kit));
ok("kit knowledge pack updated to seven documents", kit.includes("seven documents to upload"));

// dash rule
ok("sidebar scripts dash clean", !/[–—]/.test(s));

console.log("\nsidebar-scripts suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
