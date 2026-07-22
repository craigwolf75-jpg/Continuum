/* Prompt 34a suite for sigma-portal.html.
 * No dependencies. Run: node deploy/sigma-portal.test.mjs
 * Asserts the six sections, the honesty laws, the name flip with persistence,
 * and isolation from every other storage key. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, "sigma-portal.html"), "utf8");
const low = html.toLowerCase();
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) pass++; else { fail++; console.error("  FAIL: " + name); } }
function count(re) { return (html.match(re) || []).length; }

/* 1. Six sections, boot state */
ok("six sidebar sections", /var NAV=\[([^;]*)\];/.test(html) && (html.match(/var NAV=\[([^;]*)\];/)[1].match(/\["/g).length) === 6);
ok("boot section is overview", html.includes('section:"overview"'));
ok("overview section", html.includes("function renderOverview"));
ok("case exchange section", html.includes("function renderExchange"));
ok("field mapping section", html.includes("function renderMapping"));
ok("sync history section", html.includes("function renderSync"));
ok("permissions section", html.includes("function renderPermissions"));
ok("settings section", html.includes("function renderSettings"));

/* 2. Honesty laws load-bearing */
ok("proposed workflow label", html.includes("Proposed workflow") || html.includes("Workflow proposed"));
ok("method to be confirmed", html.includes("Method to be confirmed"));
ok("live connection not yet established", html.includes("Live connection not yet established"));
ok("four possible methods", /var METHODS=\[([^\]]*)\]/.test(html) && (html.match(/var METHODS=\[([^\]]*)\]/)[1].match(/"/g).length / 2) === 4);
ok("prepared and held banner", html.includes("Prepared and held") && html.includes("a person authorizes the send"));
ok("integration errors honest empty state", html.includes("No exchange attempted") && html.includes("built and ready"));
ok("empty and broken must not look the same", html.includes("must never look the same"));

/* 3. Field mapping both directions, reusable */
ok("field mapping is reusable component", html.includes("function fieldMapping"));
ok("ten inbound fields", /var INBOUND=\[([^\]]*)\]/.test(html) && (html.match(/var INBOUND=\[([^\]]*)\]/)[1].match(/"/g).length / 2) === 10);
ok("eleven return fields", /var RETURNF=\[([^\]]*)\]/.test(html) && (html.match(/var RETURNF=\[([^\]]*)\]/)[1].match(/"/g).length / 2) === 11);

/* 4. Privacy wall, down to journal entries */
ok("privacy: travels through the exchange", html.includes("Travels through the exchange"));
ok("privacy: never enters the exchange", html.includes("Never enters the exchange"));
ok("privacy protects recovery journal entries", html.includes("Personal recovery journal entries"));

/* 5. Name flip: default SIGMA-RH (D13), dynamic, both options, persisted */
ok("default is SIGMA-RH (D13)", html.includes('sys:"SIGMA-RH"'));
ok("name is dynamic via sys()", html.includes("function sys(){return S.sys;}"));
ok("brand line uses the dynamic name", html.includes('brandsys").textContent=sys()'));
ok("sections render the dynamic name", html.includes('"The connection between "+sys()') && html.includes('esc(sys())'));
ok("settings offers both spellings", html.includes(">SIGMA-RH</button>") && html.includes(">SIGMA-HR</button>"));
ok("SIGMA-HR confined to the settings toggle (not hardcoded in content)", count(/SIGMA-HR/g) <= 5 && html.indexOf("SIGMA-HR") > html.indexOf("function renderSettings"));
ok("flip persists via save()", html.includes("function setSys(name){S.sys=name;save();}"));

/* 6. Isolation: own key, none of the seven other keys */
ok("own storage key", html.includes("continuum_sigma_portal_v1"));
ok("no store key", !html.includes("continuum_demo_state_v2"));
ok("no bridge key", !html.includes("continuum_worker_bridge_v1"));
ok("no board key", !html.includes("continuum_board_portal_v1"));
ok("no admin key", !html.includes("continuum_admin_v1"));
ok("no clinical key", !html.includes("continuum_clinical_v1"));
ok("no employer key", !html.includes("continuum_employer_v1"));
ok("no hse key", !html.includes("continuum_hse_portal_v1"));
ok("no worker dash key", !html.includes("continuum_worker_dash_v1"));

/* 7. Dash audit */
ok("dash audit clean (no em/en dash)", !/[–—]/.test(html));

console.log("\nsigma-portal suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
