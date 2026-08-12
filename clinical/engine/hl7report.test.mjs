/* Continuum Prompt 42: the per report field population suite. Proves the field mappers land a
   worker, case and practitioner in the right board subfields of a real template unit, that
   dates are board formatted, that the PHN polarity is correct, that a name splits when
   structured parts are absent, that setting one segment does not bleed into another (the CX.1
   and XPN.1 leaves repeat across segments), and that empty values write present and empty
   fields. Structural conformance of the populated output is proven in the deploy suite. No
   dashes anywhere. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { extractReportUnits } from "./hl7envelope.mjs";
import {
  hl7Date, hl7DateTime, splitName, phnFields, setLeaf,
  populatePID, populateCase, populatePRD, populateMessage, populateFT1, populateReportUnit,
} from "./hl7report.mjs";

const SAMPLES = join(dirname(fileURLToPath(import.meta.url)), "..", "db", "samples");
const templateUnit = extractReportUnits(readFileSync(join(SAMPLES, "5.02 - C050E - Max Fields without Attachments.xml"), "utf8"))[0];

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const val = (xml, container, leaf) => {
  const a = xml.indexOf("<" + container + ">"); const b = xml.indexOf("</" + container + ">", a);
  const region = xml.slice(a, b);
  const m = region.match(new RegExp("<" + leaf.replace(/\./g, "\\.") + ">([\\s\\S]*?)</" + leaf.replace(/\./g, "\\.") + ">"));
  return m ? m[1] : null;
};

// -- formatters --------------------------------------------------------------
ok("hl7Date strips an ISO date to eight digits", hl7Date("1975-01-01") === "19750101" && hl7Date("20140101") === "20140101" && hl7Date("") === "");
ok("hl7DateTime keeps twelve digits", hl7DateTime("2026-08-11T09:00") === "202608110900" && hl7DateTime("201401011000") === "201401011000");

// -- name split --------------------------------------------------------------
ok("splitName handles Last, First", (() => { const n = splitName("Smith, John D"); return n.family === "Smith" && n.given === "John" && n.middle === "D"; })());
ok("splitName handles First Last", (() => { const n = splitName("John Smith"); return n.family === "Smith" && n.given === "John"; })());

// -- PHN polarity ------------------------------------------------------------
ok("phnFields: a present PHN gives indicator N and the value", (() => { const p = phnFields("123456789"); return p.indicator === "N" && p.value === "123456789"; })());
ok("phnFields: an absent PHN gives indicator Y and a blank", (() => { const p = phnFields(""); return p.indicator === "Y" && p.value === ""; })());

// -- setLeaf scoping ---------------------------------------------------------
{
  const u = setLeaf(setLeaf(templateUnit, "PID.2", "CX.1", "1111111"), "PID.3", "CX.1", "222222222");
  ok("setLeaf sets CX.1 within PID.2 and PID.3 independently (no bleed)", val(u, "PID.2", "CX.1") === "1111111" && val(u, "PID.3", "CX.1") === "222222222");
}

// -- PID population ----------------------------------------------------------
{
  const worker = { name: "Doe, Jane M", date_of_birth: "1980-06-15", sex: "F", phn: "123456789", street: "1 Main St", city: "Calgary", province: "AB", postal: "T2T2T2", phone_area: "403", phone_number: "5551234" };
  const u = populatePID(templateUnit, worker, { claim_number: "1234567" });
  ok("PID family and given land in PID.5", val(u, "PID.5", "XPN.1") === "Doe" && val(u, "PID.5", "XPN.2") === "Jane" && val(u, "PID.5", "XPN.3") === "M");
  ok("PID date of birth is board formatted", val(u, "PID", "PID.7") === "19800615");
  ok("PID sex lands", val(u, "PID", "PID.8") === "F");
  ok("PID PHN lands in PID.3/CX.1 with indicator N in CX.5", val(u, "PID.3", "CX.1") === "123456789" && val(u, "PID.3", "CX.5") === "N");
  ok("PID claim reference lands in PID.2/CX.1", val(u, "PID.2", "CX.1") === "1234567");
  ok("PID address lands in PID.11", val(u, "PID.11", "XAD.1") === "1 Main St" && val(u, "PID.11", "XAD.3") === "Calgary" && val(u, "PID.11", "XAD.5") === "T2T2T2");
  ok("PID phone lands in PID.13", val(u, "PID.13", "XTN.6") === "403" && val(u, "PID.13", "XTN.7") === "5551234");
}

// -- an absent PHN writes indicator Y and a blank CX.1 -----------------------
{
  const u = populatePID(templateUnit, { name: "No Phn", phn: "" }, {});
  ok("an absent PHN writes indicator Y and leaves CX.1 present and empty", val(u, "PID.3", "CX.5") === "Y" && /<PID\.3>[\s\S]*?<CX\.1\s*\/>/.test(u));
}

// -- case, practitioner, message ---------------------------------------------
{
  const u = populateCase(templateUnit, { date_of_injury: "2026-01-02", claim_number: "12345678" });
  ok("case injury date lands in ACC.1 and claim number in PV1.19", val(u, "ACC", "ACC.1") === "20260102" && val(u, "PV1.19", "CX.1") === "12345678");
}
{
  const u = populatePRD(templateUnit, { name: "Black, Allen", role_code: "GP" });
  ok("practitioner role lands in PRD.1 and name in PRD.2", val(u, "PRD.1", "CE_TAB_0131.1") === "GP" && val(u, "PRD.2", "XPN.1") === "Black" && val(u, "PRD.2", "XPN.2") === "Allen");
}
{
  const u = populateMessage(templateUnit, { datetime: "2026-08-11T09:00", controlId: "REP-xyz", formId: "C050E", injuryDate: "2026-01-02" });
  ok("message fills MSH.7, MSH.10, EVN.2, EVN.4, EVN.6", val(u, "MSH", "MSH.7") === "202608110900" && val(u, "MSH", "MSH.10") === "REP-xyz" && val(u, "EVN", "EVN.2") === "202608110900" && val(u, "EVN", "EVN.4") === "C050E" && val(u, "EVN", "EVN.6") === "20260102");
}

// -- FT1 financial fields ----------------------------------------------------
{
  const u = populateFT1(templateUnit, { transactionId: "TXN-0001", transactionDate: "2026-01-02", quantity: "1", feeCode: "000042", facilityType: "H", procedureCode: "03.02A" });
  ok("FT1 transaction id and date land (FT1.3, FT1.4)", /<FT1\.3>TXN-0001<\/FT1\.3>/.test(u) && /<FT1\.4>20260102<\/FT1\.4>/.test(u));
  ok("FT1 fee code lands in FT1.14/CE.1 and procedure in FT1.25/CE.1", val(u, "FT1.14", "CE.1") === "000042" && val(u, "FT1.25", "CE.1") === "03.02A");
  ok("FT1 facility type lands in FT1.16/HD.2", val(u, "FT1.16", "HD.2") === "H");
  ok("FT1 population does not touch the FT1.19 clinical coding (no diagnosis invented)", !val(u, "FT1.14", "CE.1").includes("DIAG") && (u.match(/<FT1\.19>/g) || []).length === (templateUnit.match(/<FT1\.19>/g) || []).length);
}

// -- populateReportUnit end to end -------------------------------------------
{
  const u = populateReportUnit(templateUnit, {
    worker: { family: "Roe", given: "Sam", date_of_birth: "1990-03-03", phn: "987654321" },
    case: { claim_number: "7654321", date_of_injury: "2026-02-02" },
    practitioner: { name: "Green, Pat", role_code: "OIS" },
    message: { datetime: "2026-08-11T10:00", controlId: "REP-1", formId: "C050E", injuryDate: "2026-02-02" },
    financial: { transactionDate: "2026-01-05", feeCode: "000099", facilityType: "H" },
  });
  ok("populateReportUnit fills patient, case, practitioner, message and financial together", val(u, "PID.5", "XPN.1") === "Roe" && val(u, "PV1.19", "CX.1") === "7654321" && val(u, "PRD.1", "CE_TAB_0131.1") === "OIS" && val(u, "MSH", "MSH.10") === "REP-1" && val(u, "FT1.14", "CE.1") === "000099");
  ok("populateReportUnit does not disturb the OBX section", (u.match(/<ZRPT_P03\.LST\.2>/g) || []).length === 1 && /<OBX>/.test(u));
}

console.log("\nhl7 per report field population suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
