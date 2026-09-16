/* Prompt 47 E1 hierarchy suite. node clinical/engine/hierarchy.test.mjs
   No em dashes or en dashes anywhere. */

import { ensureSingleSiteHierarchy, resolveLocationParents, assertE1Complete } from "./hierarchy.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const throws = (fn, code) => { try { fn(); return false; } catch (e) { return !code || e.code === code; } };

function store() {
  let n = 0;
  return { nextId: (p) => p + "-" + (++n), organisations: [], regions: [], locations: [] };
}

const s = store();
const site = ensureSingleSiteHierarchy({
  organisation_id: "org-1",
  jurisdiction_code: "AB",
  legal_name: "Synth Clinic",
  timezone: "America/Edmonton",
}, s);
ok("single site creates organisation, region, and location", site.organisation.id === "org-1" && site.region.organisation_id === "org-1" && site.location.region_id === site.region.id);
ok("assertE1Complete passes when all three levels exist", assertE1Complete("org-1", s).ok === true);

ok("missing jurisdiction fails named", throws(() => ensureSingleSiteHierarchy({ organisation_id: "org-x" }, store()), "JURISDICTION-MISSING"));
ok("missing store fails named", throws(() => assertE1Complete("org-1", null), "HIERARCHY-STORE-MISSING"));

const broken = store();
broken.organisations.push({ id: "org-2", legal_name: "No region", jurisdiction_code: "AB", status: "active" });
ok("missing region fails named", throws(() => assertE1Complete("org-2", broken), "E1-INCOMPLETE"));
broken.regions.push({ id: "reg-2", organisation_id: "org-2", name: "R", status: "active" });
ok("missing location fails named", throws(() => assertE1Complete("org-2", broken), "E1-INCOMPLETE"));

const parents = resolveLocationParents(site.location.id, s);
ok("resolveLocationParents returns org and region", parents.organisation.id === "org-1" && parents.region.id === site.region.id);
ok("unknown location fails named", throws(() => resolveLocationParents("nope", s), "LOCATION-UNKNOWN"));

console.log("\nhierarchy suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
