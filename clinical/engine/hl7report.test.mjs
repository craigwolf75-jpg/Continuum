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
  populatePID, populateCase, populatePRD, populateMessage, populateFT1,
  buildFt1CodingSection, assertDiagnosisSigned, populateFt1Coding, populateReportUnit,
  ft1DetailLines, populateInvoiceLines,
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
  const u = populatePID(templateUnit, { name: "Worker 83", phn: "" }, {});
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

// -- FT1.19 clinical injury coding + diagnosis -------------------------------
const coding = {
  diagnosisNarrative: "Left shoulder rotator cuff strain",
  diagnosisProvenance: "human",
  diagnosticCodes: ["840.4", "840.9"],
  injuries: [{ partOfBody: "31000", sideOfBody: "L", typeOfInjury: "07110" }, { partOfBody: "00000", sideOfBody: "", typeOfInjury: "04300" }],
};
{
  const section = buildFt1CodingSection(coding);
  const entries = section.match(/<FT1\.19>[\s\S]*?<\/FT1\.19>/g) || [];
  ok("the coding builds 1 diagnosis + 2 diag codes + 2 injury triples (9 entries)", entries.length === 1 + 2 + 6);
  ok("the diagnosis narrative lands in CE.2 of the DIAGNOSIS entry", /<FT1\.19><CE\.1\/><CE\.2>Left shoulder rotator cuff strain<\/CE\.2><CE\.3>DIAGNOSIS<\/CE\.3><\/FT1\.19>/.test(section));
  ok("diagnostic codes land as DIAGCD entries with the code in CE.1", /<CE\.1>840\.4<\/CE\.1><CE\.2\/><CE\.3>DIAGCD<\/CE\.3>/.test(section));
  ok("an injury emits POBCD then SOBCD then TOICD in order", /POBCD[\s\S]*?SOBCD[\s\S]*?TOICD/.test(section) && /<CE\.1>31000<\/CE\.1><CE\.2\/><CE\.3>POBCD<\/CE\.3>/.test(section));
  ok("an empty side of body is a self closing CE.1 on the SOBCD entry", /<FT1\.19><CE\.1\/><CE\.2\/><CE\.3>SOBCD<\/CE\.3><\/FT1\.19>/.test(section));
}

// -- the provenance guard (0A.2): an untouched ai_draft diagnosis is refused --
ok("assertDiagnosisSigned throws on an untouched ai_draft diagnosis", (() => {
  try { assertDiagnosisSigned({ diagnosisNarrative: "model guess", diagnosisProvenance: "ai_draft" }); return false; }
  catch (e) { return e.code === "AI-DIAGNOSIS-UNSIGNED"; }
})());
ok("assertDiagnosisSigned passes a human diagnosis and an ai_draft_edited one", assertDiagnosisSigned({ diagnosisNarrative: "x", diagnosisProvenance: "human" }) === true && assertDiagnosisSigned({ diagnosisNarrative: "x", diagnosisProvenance: "ai_draft_edited" }) === true);

// -- populateFt1Coding swaps the FT1.19.LST content --------------------------
{
  const u = populateFt1Coding(templateUnit, coding);
  // the primary (first) FT1.19.LST is replaced with the 9 built entries (C050E has up to 3
  // detail lines; only the first is populated, the cardinality note in hl7report).
  const firstLst = u.slice(u.indexOf("<FT1.19.LST>"), u.indexOf("</FT1.19.LST>"));
  ok("populateFt1Coding replaces the primary FT1.19.LST with the 9 built entries", firstLst.includes("Left shoulder rotator cuff strain") && (firstLst.match(/<FT1\.19>/g) || []).length === 9);
  let threw = null;
  try { populateFt1Coding(templateUnit, { diagnosisNarrative: "raw model dx", diagnosisProvenance: "ai_draft" }); } catch (e) { threw = e.code; }
  ok("populateFt1Coding refuses an untouched ai_draft diagnosis", threw === "AI-DIAGNOSIS-UNSIGNED");
}

// -- FT1 multi line invoice cardinality (trim unused + populate real lines) --
// The C050E template ships the maximum three FT1 invoice detail lines, each with placeholder
// coding; a real report carries one to three. populateInvoiceLines populates each real line and
// trims the rest (the board's own C050E min sample carries a single FT1 line, so a trimmed
// document stays board conforming: proven structurally in the deploy suite).
const fin0 = { transactionId: "TXN-A", transactionDate: "2026-01-02", quantity: "1", feeCode: "000042", facilityType: "H", procedureCode: "03.02A" };
const cod0 = { diagnosisNarrative: "Left shoulder rotator cuff strain", diagnosisProvenance: "human", diagnosticCodes: ["840.4"], injuries: [{ partOfBody: "31000", sideOfBody: "L", typeOfInjury: "07110" }] };
const fin1 = { transactionId: "TXN-B", transactionDate: "2026-01-03", quantity: "1", feeCode: "000099", facilityType: "H", procedureCode: "03.05B" };
const cod1 = { diagnosisNarrative: "Lumbar sprain", diagnosisProvenance: "human", diagnosticCodes: ["847.2"], injuries: [] };

ok("ft1DetailLines finds the three real FT1 blocks and skips the instructional comments", (() => {
  const lines = ft1DetailLines(templateUnit);
  if (lines.length !== 3) return false;
  return lines.every((l) => templateUnit.slice(l.start, l.end).startsWith("<FT1>") && templateUnit.slice(l.start, l.end).endsWith("</FT1>"));
})());

{
  const u = populateInvoiceLines(templateUnit, [{ financial: fin0, coding: cod0 }]);
  ok("one invoice line trims the template down to a single FT1 detail line", (u.match(/<FT1\.1>/g) || []).length === 1);
  const line0 = (() => { const b = ft1DetailLines(u)[0]; return u.slice(b.start, b.end); })();
  ok("the single retained line carries its financial and clinical coding", val(line0, "FT1.14", "CE.1") === "000042" && line0.includes("Left shoulder rotator cuff strain"));
  ok("trimming preserves the FT1 END OF comment and the OBX section", /FINANCIAL TRANSACTION SEGMENT; END OF/.test(u) && (u.match(/<ZRPT_P03\.LST\.2>/g) || []).length === 1 && /<OBX>/.test(u));
}

{
  const u = populateInvoiceLines(templateUnit, [{ financial: fin0, coding: cod0 }, { financial: fin1, coding: cod1 }]);
  ok("two invoice lines keep two FT1 detail lines (the third is trimmed)", (u.match(/<FT1\.1>/g) || []).length === 2);
  ok("the retained set ids are contiguous 1 then 2", (u.match(/<FT1\.1>[^<]*<\/FT1\.1>/g) || []).join(",") === "<FT1.1>1</FT1.1>,<FT1.1>2</FT1.1>");
  const blocks = ft1DetailLines(u);
  const l0 = u.slice(blocks[0].start, blocks[0].end), l1 = u.slice(blocks[1].start, blocks[1].end);
  ok("each line carries its own financial and coding (the second line is really populated, not placeholder)",
    val(l0, "FT1.14", "CE.1") === "000042" && l0.includes("Left shoulder rotator cuff strain") &&
    val(l1, "FT1.14", "CE.1") === "000099" && l1.includes("Lumbar sprain"));
}

ok("populateInvoiceLines refuses an empty list (a report carries at least one invoice detail line)", (() => {
  try { populateInvoiceLines(templateUnit, []); return false; } catch (e) { return e.code === "INVOICE-LINES-EMPTY"; }
})());
ok("populateInvoiceLines refuses more lines than the form allows (never fabricates an invoice line)", (() => {
  try { populateInvoiceLines(templateUnit, [1, 2, 3, 4].map(() => ({ financial: fin0 }))); return false; } catch (e) { return e.code === "INVOICE-LINES-EXCEED-TEMPLATE"; }
})());
ok("populateInvoiceLines provenance gates every line (an untouched ai_draft diagnosis on any line is refused)", (() => {
  try { populateInvoiceLines(templateUnit, [{ financial: fin0, coding: cod0 }, { coding: { diagnosisNarrative: "model guess", diagnosisProvenance: "ai_draft" } }]); return false; }
  catch (e) { return e.code === "AI-DIAGNOSIS-UNSIGNED"; }
})());

{
  const u = populateReportUnit(templateUnit, {
    worker: { family: "Roe", given: "Sam", phn: "987654321" },
    case: { claim_number: "7654321", date_of_injury: "2026-02-02" },
    invoiceLines: [{ financial: fin0, coding: cod0 }],
  });
  ok("populateReportUnit routes invoiceLines through the multi line populator and still fills demographics", (u.match(/<FT1\.1>/g) || []).length === 1 && val(u, "PID.5", "XPN.1") === "Roe" && val(u, "PV1.19", "CX.1") === "7654321");
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
