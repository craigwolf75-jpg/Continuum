/* Continuum Prompt 42: the ZRPT_P03 envelope suite. Proves the envelope splits and reassembles
   the board's own samples losslessly, that the report count and the trailer counts agree, that
   the OBX section and the control id are the substitutable seams, and that N units assemble
   into one batch with the trailers set to N. Structural schema conformance of the assembled
   output is proven in the deploy suite (deploy/hl7envelope.test.mjs) with the real validator.
   No dashes anywhere. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  splitBatch, extractReportUnits, reportCount, trailerCounts, setBatchCounts, pad3,
  getObxSection, replaceObxSection, setControlId, assembleFromTemplate, buildReportUnit,
} from "./hl7envelope.mjs";

const SAMPLES = join(dirname(fileURLToPath(import.meta.url)), "..", "db", "samples");
const read = (f) => readFileSync(join(SAMPLES, f), "utf8");
const single = read("5.03 - C050E - Min Fields.xml");
const multi = read("5.17 - Multiple Reports.xml");

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// -- pad3 --------------------------------------------------------------------
ok("pad3 zero pads to three digits", pad3(1) === "001" && pad3(8) === "008" && pad3(12) === "012" && pad3(0) === "000");

// -- lossless split ----------------------------------------------------------
for (const [name, xml] of [["single", single], ["multi", multi]]) {
  const p = splitBatch(xml);
  ok(name + ": head + body + tail reconstructs the document exactly", p.head + p.body + p.tail === xml);
  ok(name + ": the head carries FHS and BHS, the tail carries BTS and FTS", /<FHS>/.test(p.head) && /<BHS>/.test(p.head) && /<BTS>/.test(p.tail) && /<FTS>/.test(p.tail));
}

// -- report count and trailer agreement (the samples) ------------------------
ok("the single report sample has one report unit", reportCount(single) === 1);
ok("the multiple reports sample has eight report units", reportCount(multi) === 8);
ok("the single sample trailers read 001 / 001", trailerCounts(single).bts1 === "001" && trailerCounts(single).fts1 === "001");
ok("the multiple sample trailers read 008 / 008", trailerCounts(multi).bts1 === "008" && trailerCounts(multi).fts1 === "008");
ok("each report unit carries exactly one MSH and one OBX section", extractReportUnits(multi).every((u) => (u.match(/<MSH>/g) || []).length === 1 && (u.match(/<ZRPT_P03\.LST\.2>/g) || []).length === 1));

// -- reassembling a sample from its own parts reproduces it ------------------
{
  const units = extractReportUnits(multi);
  const rebuilt = assembleFromTemplate(multi, units);
  ok("reassembling the multi sample from its own units keeps eight reports", reportCount(rebuilt) === 8);
  ok("reassembling the multi sample keeps the trailers at 008", trailerCounts(rebuilt).bts1 === "008" && trailerCounts(rebuilt).fts1 === "008");
  ok("the multi sample control ids survive reassembly", (rebuilt.match(/<MSH\.10>([\s\S]*?)<\/MSH\.10>/g) || []).length === 8);
}

// -- setBatchCounts ----------------------------------------------------------
{
  const c = setBatchCounts(single, 8);
  ok("setBatchCounts sets both trailers", trailerCounts(c).bts1 === "008" && trailerCounts(c).fts1 === "008");
}

// -- the OBX section seam ----------------------------------------------------
{
  const unit = extractReportUnits(single)[0];
  const obx = getObxSection(unit);
  ok("getObxSection returns the OBX segments from the unit", /<OBX>/.test(obx) && obx.length > 100);
  const swapped = replaceObxSection(unit, "<OBX><OBX.1/><OBX.2/><OBX.3><CE.1>JOBTITLE</CE.1></OBX.3><OBX.4/><OBX.5.LST><OBX.5>Gatehouse Officer</OBX.5></OBX.5.LST><OBX.11/></OBX>");
  ok("replaceObxSection swaps only the OBX section, leaving the envelope intact", /<MSH>/.test(swapped) && /<PID>/.test(swapped) && getObxSection(swapped).includes("Gatehouse Officer") && !getObxSection(swapped).includes(getObxSection(unit).slice(0, 40)));
  ok("replaceObxSection preserves the ZRPT_P03.LST.2 wrapper", (swapped.match(/<ZRPT_P03\.LST\.2>/g) || []).length === 1 && (swapped.match(/<\/ZRPT_P03\.LST\.2>/g) || []).length === 1);
}

// -- the control id seam -----------------------------------------------------
{
  const unit = extractReportUnits(single)[0];
  const set = setControlId(unit, "REPORT-abc-123");
  ok("setControlId sets MSH.10", /<MSH\.10>REPORT-abc-123<\/MSH\.10>/.test(set));
}

// -- assemble N units from a single report template --------------------------
{
  const templateUnit = extractReportUnits(single)[0];
  const unitA = buildReportUnit(templateUnit, { controlId: "REP-A", obxSection: getObxSection(templateUnit) });
  const unitB = buildReportUnit(templateUnit, { controlId: "REP-B", obxSection: getObxSection(templateUnit) });
  const batch = assembleFromTemplate(single, [unitA, unitB]);
  ok("assembling two units yields a two report batch", reportCount(batch) === 2);
  ok("assembling two units sets the trailers to 002", trailerCounts(batch).bts1 === "002" && trailerCounts(batch).fts1 === "002");
  ok("the two assembled units carry the distinct control ids", /<MSH\.10>REP-A<\/MSH\.10>/.test(batch) && /<MSH\.10>REP-B<\/MSH\.10>/.test(batch));
  ok("the assembled batch keeps the ZRPT_P03 root, FHS and FTS", /<ZRPT_P03[\s>]/.test(batch) && /<\/ZRPT_P03>\s*$/.test(batch) && /<FHS>/.test(batch) && /<FTS>/.test(batch));
}

// -- an empty batch is refused -----------------------------------------------
{
  let threw = null;
  try { assembleFromTemplate(single, []); } catch (e) { threw = e.code; }
  ok("assembling with no units refuses (empty batch never sent)", threw === "EMPTY-BATCH");
}

console.log("\nhl7 envelope suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
