/* Continuum Prompt 42: the ZRPT_P03 batch envelope (the increment hl7gen.mjs staged as
   next). hl7gen delivers the element to OBX layer; this wraps one or more reports' OBX
   sections in the full board document: the file header (FHS), the batch (BHS, the reports,
   BTS) and the file trailer (FTS), with the LST and GRP nesting the board's structural
   schema requires.

   The board wire format, verified against the 5.xx samples (census confirmed):

     ZRPT_P03
       FHS                          file header
       ZRPT_P03.LST.6
         ZRPT_P03.GRP.4             one batch
           BHS                      batch header
           ZRPT_P03.LST.5
             ZRPT_P03.GRP.3   x N   ONE PER REPORT (the repeating unit)
               ZRPT_P03.GRP.2         MSH, EVN, PID, ... , ZRPT_P03.LST.2 (the OBX section)
           BTS                      batch trailer; BTS.1 = report count (001, 008, ...)
       FTS                          file trailer; FTS.1 = report count

   Like hl7gen anchored the OBX fragment to a real board fragment, this anchors the envelope
   to a real conforming sample: a template document is split into head, per report units and
   tail, a report's OBX section (and its control id) are substituted into a unit, and N units
   are assembled with the trailer counts set to N. The output is a board conforming document
   because its skeleton IS a board conforming document, proven by round tripping the samples
   and by validating the assembled output against the structural schema (the deploy suite).

   Pure string functions, no schema dependency of their own (validation stays injected on the
   deploy side, where xmllint-wasm lives). No dashes anywhere. */

export const REPORT_UNIT_OPEN = "<ZRPT_P03.GRP.3>";
export const REPORT_UNIT_CLOSE = "</ZRPT_P03.GRP.3>";
const OBX_SECTION_OPEN = "<ZRPT_P03.LST.2>";
const OBX_SECTION_CLOSE = "</ZRPT_P03.LST.2>";

const s = (v) => String(v === null || v === undefined ? "" : v);

// The board's trailer count format: a zero padded three digit count (001, 008, ...).
export function pad3(n) {
  const v = Math.max(0, Math.trunc(Number(n) || 0));
  return String(v).padStart(3, "0");
}

// Split a batch document into its head (everything up to the first report unit), body (the
// report units and any separators between them) and tail (the batch and file trailers). head
// + body + tail is exactly the input, so slicing is lossless.
export function splitBatch(xml) {
  const x = s(xml);
  const first = x.indexOf(REPORT_UNIT_OPEN);
  const lastClose = x.lastIndexOf(REPORT_UNIT_CLOSE);
  if (first === -1 || lastClose === -1) return { head: x, body: "", tail: "", units: [] };
  const bodyEnd = lastClose + REPORT_UNIT_CLOSE.length;
  return {
    head: x.slice(0, first),
    body: x.slice(first, bodyEnd),
    tail: x.slice(bodyEnd),
    units: extractReportUnits(x),
  };
}

// Every report unit (ZRPT_P03.GRP.3 ... /ZRPT_P03.GRP.3), in document order.
export function extractReportUnits(xml) {
  const re = /<ZRPT_P03\.GRP\.3>[\s\S]*?<\/ZRPT_P03\.GRP\.3>/g;
  return s(xml).match(re) || [];
}

// The number of reports in a batch document.
export function reportCount(xml) {
  return extractReportUnits(xml).length;
}

// Read the trailer counts (BTS.1 and FTS.1) as written in the document, for verifying a
// batch's trailers agree with its report count.
export function trailerCounts(xml) {
  const x = s(xml);
  const bts = x.match(/<BTS\.1>([\s\S]*?)<\/BTS\.1>/);
  const fts = x.match(/<FTS\.1>([\s\S]*?)<\/FTS\.1>/);
  return { bts1: bts ? bts[1].trim() : null, fts1: fts ? fts[1].trim() : null };
}

// Set both trailer counts (BTS.1 and FTS.1) to a report count, zero padded. A batch whose
// trailers disagree with its report count is malformed; the assembler always calls this so
// the counts can never drift from the units.
export function setBatchCounts(xml, n) {
  return s(xml)
    .replace(/<BTS\.1>[\s\S]*?<\/BTS\.1>/, "<BTS.1>" + pad3(n) + "</BTS.1>")
    .replace(/<FTS\.1>[\s\S]*?<\/FTS\.1>/, "<FTS.1>" + pad3(n) + "</FTS.1>");
}

// The OBX section (the inner of the report unit's ZRPT_P03.LST.2), or "" when absent.
export function getObxSection(unitXml) {
  const x = s(unitXml);
  const a = x.indexOf(OBX_SECTION_OPEN);
  if (a === -1) return "";
  const b = x.indexOf(OBX_SECTION_CLOSE, a);
  if (b === -1) return "";
  return x.slice(a + OBX_SECTION_OPEN.length, b);
}

// Replace a report unit's OBX section (the inner of ZRPT_P03.LST.2) with a freshly generated
// one (hl7gen serializeObxSection output). The envelope around it is untouched, so the unit
// stays structurally valid. This is the seam that carries a signed report's own OBX layer
// into the board envelope.
export function replaceObxSection(unitXml, obxSectionInner) {
  const x = s(unitXml);
  const a = x.indexOf(OBX_SECTION_OPEN);
  if (a === -1) return x;
  const b = x.indexOf(OBX_SECTION_CLOSE, a);
  if (b === -1) return x;
  return x.slice(0, a + OBX_SECTION_OPEN.length) + s(obxSectionInner) + x.slice(b);
}

// Set a report unit's message control id (MSH.10) so assembled reports are distinct (the
// board's own multiple reports sample gives each unit a distinct MSH.10).
export function setControlId(unitXml, controlId) {
  return s(unitXml).replace(/<MSH\.10>[\s\S]*?<\/MSH\.10>/, "<MSH.10>" + s(controlId) + "</MSH.10>");
}

// Assemble a batch from a template document and a list of report units. The template supplies
// the head (FHS, BHS, the LST and GRP opening) and the tail (BTS, the closing, FTS); the
// units replace the template's own units; the trailer counts are set to the unit count. With
// no units this throws, because an empty batch has nothing to submit and must not be sent.
export function assembleFromTemplate(templateXml, units, opts = {}) {
  const list = (units || []).map(s).filter(Boolean);
  if (!list.length) {
    const e = new Error("Refusing to assemble an empty batch: no report units.");
    e.code = "EMPTY-BATCH";
    throw e;
  }
  const parts = splitBatch(templateXml);
  const sep = opts.separator !== undefined ? opts.separator : interUnitSeparator(parts.body);
  const body = list.join(sep);
  const tail = setBatchCounts(parts.tail, list.length);
  return parts.head + body + tail;
}

// The whitespace a template uses between report units (so a reassembled multi report batch
// keeps the template's formatting). Empty when the template has a single unit.
export function interUnitSeparator(body) {
  const m = s(body).match(/<\/ZRPT_P03\.GRP\.3>([\s\S]*?)<ZRPT_P03\.GRP\.3>/);
  return m ? m[1] : "";
}

// Build one report unit from a template unit: swap in the report's OBX section and set its
// control id. Everything else (the demographic envelope) comes from the template until the
// per report field mapping (PID, PV1, FT1 from worker and case data) is wired, which is the
// next increment and needs the live schema.
export function buildReportUnit(templateUnit, report) {
  let unit = s(templateUnit);
  if (report && report.obxSection !== undefined && report.obxSection !== null) unit = replaceObxSection(unit, report.obxSection);
  if (report && report.controlId !== undefined && report.controlId !== null) unit = setControlId(unit, report.controlId);
  return unit;
}
