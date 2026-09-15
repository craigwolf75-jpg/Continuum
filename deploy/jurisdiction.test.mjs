/* Continuum Prompt 45: CI facing provincial rules proof.

   CI runs only deploy/*.test.mjs. This suite imports the clinical engine and
   the deploy admin board projection so a resolver or board-label drift fails
   the build. No dashes anywhere. */

import { createProvincialStore, allJurisdictions } from "../clinical/db/provincial_rules.data.mjs";
import {
  resolveJurisdiction, resolveFee, resolveDeadline, assertClinicAccess, activateJurisdiction,
} from "../clinical/engine/jurisdiction.mjs";
import { renderForm, validateForm, generateDocument } from "../clinical/engine/formpack.mjs";
import { JURISDICTION_BOARD_ROWS, boardNameForCode } from "./api/jurisdiction-boards.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const throws = (fn, code) => { try { fn(); return false; } catch (e) { return !code || e.code === code; } };

const store = createProvincialStore();

ok("deploy board rows match the provincial rules codes and names", (() => {
  const src = allJurisdictions();
  if (src.length !== JURISDICTION_BOARD_ROWS.length) return false;
  return src.every((j) => {
    const row = JURISDICTION_BOARD_ROWS.find((r) => r.code === j.code);
    return row && row.board_name === j.board_name && row.active === j.active;
  });
})());
ok("admin board lookup uses data, UNKNOWN when missing", boardNameForCode("AB") === "WCB Alberta" && boardNameForCode("nope") === "UNKNOWN");
ok("a resolver without jurisdiction fails", throws(() => resolveJurisdiction({ id: "c" }, store), "JURISDICTION-MISSING"));
ok("an inactive clinic is blocked", throws(() => assertClinicAccess({ id: "z", jurisdiction_code: "ZZ" }, store), "INACTIVE-JURISDICTION"));
ok("a fee with no effective row fails", throws(() => resolveFee("AB", "C050E", "GP", "same_day", "2010-01-01", store), "FEE-MISSING"));
ok("same day cutoff comes from the deadline table", resolveDeadline("AB", "same_day_cutoff", "2026-07-31T16:30:00", store).time === "10:00");

activateJurisdiction("ZZ", store);
const good = { 1: "TEST01", 2: "N", 3: "SW0001", 4: "OPEN", 5: "ok", 6: "SYN001" };
ok("ZZ renders from data", renderForm("ZZ", "TEST01", store).form_name === "Synthetic First Report");
ok("ZZ validates from data", validateForm("ZZ", "TEST01", good, store).ok === true);
ok("ZZ generates a document from data", generateDocument("ZZ", "TEST01", good, store).includes("Synthetic"));

console.log("\ndeploy jurisdiction suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
