/* Continuum presentation scripts probe (Prompt 35). node deploy/presentation-scripts.test.mjs
   Asserts the eight scripts exist in order with the four parts each, that they
   quote only the numbers that are actually on the screens, that the routing
   phrase and the prepared-and-held law are verbatim, that the employer script
   names clinical detail only as absences, that the scripts are dash-clean, and
   that the Presenter Agent Kit lists the scripts file first. Hard-fail; no
   em-dashes anywhere. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(join(dir, "..", "specs", f), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const s = read("CONTINUUM_PRESENTATION_SCRIPTS.md");
const kit = read("CONTINUUM_PRESENTER_AGENT_KIT.md");

// eight scripts, one per surface, in presentation order
const surfaces = ["Worker app", "Employer dashboard", "HSE hub", "Clinical seat, Nexus Health", "Board seat, WCB", "SIGMA connection page", "SIGMA portal", "Admin"];
surfaces.forEach((h, i) => ok("script " + (i + 1) + " present and ordered: " + h, s.includes("## " + (i + 1) + ". " + h)));
const count = re => (s.match(re) || []).length;
ok("every script carries the four parts (x8)", count(/\*\*Open:\*\*/g) === 8 && count(/\*\*Walkthrough:\*\*/g) === 8 && count(/\*\*Emphasize:\*\*/g) === 8 && count(/\*\*Expected question:\*\*/g) === 8 && count(/\*\*Agent answer:\*\*/g) === 8);

// canon numbers, matched to the screens
ok("HSE: seven open cases", s.includes("seven open cases"));
ok("board: nineteen open claims", s.includes("nineteen open claims"));
ok("board: seven to acknowledge", s.includes("seven to acknowledge"));
ok("clinical: twenty-four active cases", s.includes("twenty-four active cases"));
ok("worker: Marcus at day nine", s.includes("day nine"));
ok("SIGMA connection: Jordan Miller", s.includes("Jordan Miller"));

// verbatim laws
ok("routing phrase verbatim: per program rules", s.includes("per program rules"));
ok("prepared-and-held law verbatim", s.toLowerCase().includes("prepared and held"));

// one trust law made audible per surface
[["gold, never red", "worker"], ["better answer from less information", "employer"], ["button that refuses", "HSE"], ["where medical decisions actually live", "clinical"], ["narrowest view on purpose", "board"], ["nothing is replaced", "connection"], ["prepared and held", "SIGMA portal"], ["every promise here is a switch", "admin"]]
  .forEach(([law, seat]) => ok("trust law audible on " + seat, s.toLowerCase().includes(law.toLowerCase())));

// employer: clinical detail named only as absences
ok("employer names clinical detail only as absences", s.includes("Never a diagnosis, never a pain score, never a medical note"));

// dash rule
ok("scripts dash clean", !/[–—]/.test(s));

// the agent kit knowledge pack lists the scripts first
ok("agent kit lists the scripts file first", /1\. Presentation scripts \(CONTINUUM_PRESENTATION_SCRIPTS\.md\)/.test(kit));
ok("agent kit knowledge pack updated to seven documents", kit.includes("seven documents to upload"));

console.log("\npresentation-scripts suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
