/* Continuum Prompt 42: per report field population. hl7envelope.mjs assembles the ZRPT_P03
   batch structure and hl7gen.mjs builds the OBX layer; this fills a report unit's identity
   and demographic segments from a worker, case, practitioner and report, so the assembled
   document carries the real report's data instead of the template's.

   The field layout is transcribed from the board's populated sample
   (5.02 C050E Max Fields), the same anchoring hl7gen and hl7envelope use:

     MSH.7   message date time            EVN.2  event date time
     MSH.10  message control id           EVN.4  form id (C050E, ...)
     PID.2/CX.1   claim reference number  EVN.6  injury date
     PID.3/CX.1   Worker 36             ACC.1  injury date
     PID.3/CX.5   no PHN indicator        PV1.19/CX.1  claim number
     PID.5   family / given / middle      PRD.1  practitioner role code
     PID.7   date of birth                PRD.2  practitioner family / given
     PID.8   sex                          PRD.5  practitioner phone
     PID.11  street / pobox / city / province / postal
     PID.13  phone area / number

   The PHN polarity (39A Section 1.4, confirmed by the sample: CX.5 "Y" with CX.1 blank): the
   no PHN indicator is "Y" when the worker has no PHN, and then the PHN is blank; it is "N"
   when a PHN is present. Presence and the inversion are validated by valX01 (validation.mjs);
   this only populates in that shape.

   The setters preserve structure and only replace VALUES, so an optional field the template
   leaves present and empty stays present and empty, and the document stays board conforming.

   SCHEMA: migration 016 stores the name, address and phone STRUCTURED (family / given /
   middle, street / po_box / city / province / postal_code, phone_area / phone_number) plus a
   sex column, exactly the board XPN, XAD and XTN components, so this module reads them straight
   into the segments and never has to split at submission time. A fallback that splits a full
   name is kept for any source that supplies only a display name.

   Pure string functions, no clock (date and time strings are injected), no schema dependency.
   No dashes anywhere. */

const s = (v) => String(v === null || v === undefined ? "" : v).trim();

export function xmlEscape(v) {
  return String(v === null || v === undefined ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Board date (YYYYMMDD) and date time (YYYYMMDDHHMM): keep the digits, take the leading 8 or
// 12. An ISO date "1975-01-01" becomes "19750101"; an already board formatted value is a no
// op. Blank stays blank. No clock: a date time value is injected by the caller.
export function hl7Date(v) {
  const d = s(v).replace(/\D/g, "");
  return d ? d.slice(0, 8) : "";
}
export function hl7DateTime(v) {
  const d = s(v).replace(/\D/g, "");
  return d ? d.slice(0, 12) : "";
}

// Split a full name into family and given when structured parts are not supplied. "Smith,
// John" gives family Smith, given John; "John Smith" gives given John, family Smith.
export function splitName(full) {
  const t = s(full);
  if (!t) return { family: "", given: "", middle: "" };
  if (t.includes(",")) {
    const [fam, rest] = t.split(",");
    const parts = s(rest).split(/\s+/).filter(Boolean);
    return { family: s(fam), given: parts[0] || "", middle: parts.slice(1).join(" ") };
  }
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { family: parts[0], given: "", middle: "" };
  return { family: parts[parts.length - 1], given: parts[0], middle: parts.slice(1, -1).join(" ") };
}

// The no PHN indicator and PHN value, in the board's polarity: a present PHN gives indicator
// "N" and the PHN; an absent PHN gives indicator "Y" and a blank PHN (39A Section 1.4).
export function phnFields(phn) {
  const v = s(phn);
  return v ? { indicator: "N", value: v } : { indicator: "Y", value: "" };
}

// Set a leaf field's value within the first occurrence of a container element, preserving the
// document elsewhere. Handles a self closing leaf (<L/> or <L />) and a filled leaf
// (<L>old</L>); an empty value writes a self closing leaf. A leaf absent from the template is
// left absent (the template owns which optional fields are present). container disambiguates
// a leaf that repeats across segments (CX.1 in PID.2 versus PID.3, XPN.1 in PID.5 versus PRD.2).
// Index of the first occurrence of tag at or after `from` that is NOT inside an XML comment.
// The board template embeds instructional comments containing literal tag text (for example a
// note that shows <FT1></FT1> to say how to repeat invoice lines); a naive indexOf would match
// that comment instead of the real segment. This skips comment embedded matches.
function tagOutsideComment(x, tag, from) {
  let i = x.indexOf(tag, from);
  while (i !== -1) {
    const lastOpen = x.lastIndexOf("<!--", i);
    const closeAfter = lastOpen === -1 ? -1 : x.indexOf("-->", lastOpen);
    if (lastOpen === -1 || closeAfter < i) return i; // not inside a comment
    i = x.indexOf(tag, i + tag.length);
  }
  return -1;
}

export function setLeaf(xml, container, leaf, value) {
  const x = s0(xml);
  const a = tagOutsideComment(x, "<" + container + ">", 0);
  if (a === -1) return x;
  const b = tagOutsideComment(x, "</" + container + ">", a);
  if (b === -1) return x;
  const region = x.slice(a, b);
  const esc = leaf.replace(/\./g, "\\.");
  const re = new RegExp("<" + esc + "\\s*/>|<" + esc + ">[\\s\\S]*?</" + esc + ">");
  if (!re.test(region)) return x; // leaf not present in the template: do not invent it
  const v = s(value);
  const repl = v === "" ? "<" + leaf + "/>" : "<" + leaf + ">" + xmlEscape(v) + "</" + leaf + ">";
  return x.slice(0, a) + region.replace(re, repl) + x.slice(b);
}
const s0 = (v) => String(v === null || v === undefined ? "" : v);

// -- segment populators ------------------------------------------------------

// Patient (worker). Accepts structured name and address; falls back to splitting worker.name.
export function populatePID(unit, worker, caseData) {
  let u = s0(unit);
  const w = worker || {};
  const c = caseData || {};
  const name = w.family || w.given || w.middle ? { family: w.family, given: w.given, middle: w.middle } : splitName(w.name);
  const phn = phnFields(w.phn);

  u = setLeaf(u, "PID.2", "CX.1", s(c.claim_reference || c.claim_number)); // claim reference (<= 7 digits)
  u = setLeaf(u, "PID.3", "CX.1", phn.value);
  u = setLeaf(u, "PID.3", "CX.5", phn.indicator);
  u = setLeaf(u, "PID.5", "XPN.1", s(name.family));
  u = setLeaf(u, "PID.5", "XPN.2", s(name.given));
  u = setLeaf(u, "PID.5", "XPN.3", s(name.middle));
  u = setLeaf(u, "PID", "PID.7", hl7Date(w.date_of_birth));
  u = setLeaf(u, "PID", "PID.8", s(w.sex)); // not a 016 column; populated only when provided
  u = setLeaf(u, "PID.11", "XAD.1", s(w.street));
  u = setLeaf(u, "PID.11", "XAD.2", s(w.pobox));
  u = setLeaf(u, "PID.11", "XAD.3", s(w.city));
  u = setLeaf(u, "PID.11", "XAD.4", s(w.province));
  u = setLeaf(u, "PID.11", "XAD.5", s(w.postal));
  u = setLeaf(u, "PID.13", "XTN.6", s(w.phone_area));
  u = setLeaf(u, "PID.13", "XTN.7", s(w.phone_number));
  return u;
}

// The injury accident date (ACC.1) and the claim number on the visit (PV1.19).
export function populateCase(unit, caseData) {
  let u = s0(unit);
  const c = caseData || {};
  u = setLeaf(u, "ACC", "ACC.1", hl7Date(c.date_of_injury));
  u = setLeaf(u, "PV1.19", "CX.1", s(c.claim_number));
  return u;
}

// The practitioner: role code and name (billing number goes in FT1, outside this demographic
// scope, so it is left to the financial mapping increment).
export function populatePRD(unit, practitioner) {
  let u = s0(unit);
  const p = practitioner || {};
  const name = p.family || p.given ? { family: p.family, given: p.given } : splitName(p.name);
  u = setLeaf(u, "PRD.1", "CE_TAB_0131.1", s(p.role_code));
  u = setLeaf(u, "PRD.2", "XPN.1", s(name.family));
  u = setLeaf(u, "PRD.2", "XPN.2", s(name.given));
  u = setLeaf(u, "PRD.5", "XTN.6", s(p.phone_area));
  u = setLeaf(u, "PRD.5", "XTN.7", s(p.phone_number));
  return u;
}

// The message envelope fields that vary per report: MSH.7 and EVN.2 date time, MSH.10 control
// id, EVN.4 form id, EVN.6 injury date. The date time is injected (no clock in the engine).
export function populateMessage(unit, message) {
  let u = s0(unit);
  const m = message || {};
  const dt = hl7DateTime(m.datetime);
  u = setLeaf(u, "MSH", "MSH.7", dt);
  if (m.controlId !== undefined && m.controlId !== null) u = setLeaf(u, "MSH", "MSH.10", s(m.controlId));
  u = setLeaf(u, "EVN", "EVN.2", dt);
  u = setLeaf(u, "EVN", "EVN.4", s(m.formId));
  u = setLeaf(u, "EVN", "EVN.6", hl7Date(m.injuryDate));
  return u;
}

// The FT1 financial transaction fields. FT1 is a mixed segment: FT1.19.LST carries the
// diagnosis narrative and the diagnostic, part of body, side of body and type of injury codes,
// and FT1.26 carries the provider skills. Those are CLINICAL values and are NOT populated here:
// the diagnosis narrative is provenance gated (a practitioner authored or ai_draft then human
// signed value, never invented by a mapper), and the injury coding is a separate clinical
// mapping increment. This populator sets only the transaction and financial fields:
//   FT1.3 transaction id, FT1.4 transaction date, FT1.10 quantity, FT1.14/CE.1 fee code,
//   FT1.16/HD.2 facility type, FT1.25/CE.1 procedure code.
// It only sets a field when the caller supplies it; the values come from the report, the clinic
// profile and the board fee schedule (seeded in 002), never invented here.
export function populateFT1(unit, financial) {
  let u = s0(unit);
  const fin = financial || {};
  if (fin.transactionId !== undefined) u = setLeaf(u, "FT1", "FT1.3", s(fin.transactionId));
  if (fin.transactionDate !== undefined) u = setLeaf(u, "FT1", "FT1.4", hl7Date(fin.transactionDate));
  if (fin.quantity !== undefined) u = setLeaf(u, "FT1", "FT1.10", s(fin.quantity));
  if (fin.feeCode !== undefined) u = setLeaf(u, "FT1.14", "CE.1", s(fin.feeCode));
  if (fin.facilityType !== undefined) u = setLeaf(u, "FT1.16", "HD.2", s(fin.facilityType));
  if (fin.procedureCode !== undefined) u = setLeaf(u, "FT1.25", "CE.1", s(fin.procedureCode));
  return u;
}

// -- FT1.19 clinical injury coding and the diagnosis (provenance gated) -------------------
// FT1.19.LST is a variable length list of coded entries, each a CE with CE.1 (code), CE.2
// (text) and CE.3 (the entry type): a DIAGNOSIS entry carrying the narrative in CE.2, DIAGCD
// entries carrying diagnostic codes in CE.1, and repeating POBCD / SOBCD / TOICD triples
// carrying the part of body, side of body and type of injury codes. This is CLINICAL data
// bound for the BOARD (the board receives the full clinical record; only the employer view is
// restricted, Prompt 43). The values come from the SIGNED report: the diagnosis and codes are
// the practitioner's attested values, the injury codes derive from the case and the board code
// lists (seeded 002) via the human confirmed AI-03 coding. NONE of it is invented here.

const CE = (tag, v) => { const t = xmlEscape(s(v)); return t === "" ? "<" + tag + "/>" : "<" + tag + ">" + t + "</" + tag + ">"; };
function ft1Entry(ce1, ce2, ce3) { return "<FT1.19>" + CE("CE.1", ce1) + CE("CE.2", ce2) + "<CE.3>" + xmlEscape(s(ce3)) + "</CE.3></FT1.19>"; }

// The core doctrine (0A.2, criterion 4): a model may never propose the ANSWER to a clinical
// question. A raw, untouched ai_draft diagnosis must never reach the board. Signed reports
// cannot carry an untouched ai_draft (blocksSignature), so this is defense in depth: refuse to
// emit a diagnosis whose provenance is an untouched ai_draft.
export function assertDiagnosisSigned(coding) {
  const c = coding || {};
  if (s(c.diagnosisNarrative) !== "" && s(c.diagnosisProvenance) === "ai_draft") {
    const e = new Error("Refusing to emit an untouched ai_draft diagnosis to the board. A model authored diagnosis must be reviewed and signed by the practitioner first (0A.2, criterion 4).");
    e.code = "AI-DIAGNOSIS-UNSIGNED"; throw e;
  }
  return true;
}

// Build the FT1.19.LST inner content from structured clinical coding: the DIAGNOSIS entry
// (narrative in CE.2), then the DIAGCD codes, then the POBCD / SOBCD / TOICD triple per injury.
// coding: { diagnosisNarrative, diagnosisProvenance, diagnosticCodes[], injuries[{partOfBody,
// sideOfBody, typeOfInjury}] }. Side of body may be empty (a part with no side).
export function buildFt1CodingSection(coding) {
  const c = coding || {};
  const parts = [ft1Entry("", c.diagnosisNarrative, "DIAGNOSIS")];
  for (const code of c.diagnosticCodes || []) parts.push(ft1Entry(code, "", "DIAGCD"));
  for (const inj of c.injuries || []) {
    parts.push(ft1Entry(inj.partOfBody, "", "POBCD"));
    parts.push(ft1Entry(inj.sideOfBody, "", "SOBCD"));
    parts.push(ft1Entry(inj.typeOfInjury, "", "TOICD"));
  }
  return parts.join("");
}

// Replace the inner content of a list element (for example FT1.19.LST), skipping comment
// embedded tags. Used to swap a rebuilt coding list into the unit.
function replaceListInner(x, listTag, innerXml) {
  const open = "<" + listTag + ">";
  const a = tagOutsideComment(x, open, 0);
  if (a === -1) return x;
  const b = tagOutsideComment(x, "</" + listTag + ">", a);
  if (b === -1) return x;
  return x.slice(0, a + open.length) + s0(innerXml) + x.slice(b);
}

// Populate the FT1.19 clinical coding on the PRIMARY (first) FT1 invoice detail line: guard the
// diagnosis provenance, build the coded list, swap it into the first FT1.19.LST.
//
// CARDINALITY: a form may carry up to N FT1 invoice detail lines (C050E allows 3) and the
// template ships the maximum, each with its own FT1.19.LST of placeholder coding. This populates
// the FIRST line only. A report with more than one real invoice line, or one that must TRIM the
// unused template lines so no phantom invoice line reaches the board, uses populateInvoiceLines
// below (one { financial, coding } per real line), which populates each line and trims the rest.
// populateFT1 (financial) is on the same first line.
export function populateFt1Coding(unit, coding) {
  assertDiagnosisSigned(coding);
  return replaceListInner(s0(unit), "FT1.19.LST", buildFt1CodingSection(coding));
}

// -- FT1 invoice detail line cardinality (trim unused + populate real lines) -------------
// The C050E template ships the MAXIMUM number of FT1 invoice detail lines the form allows
// (three), each with placeholder coding; a real report carries one to three. populateFT1 and
// populateFt1Coding above act on the FIRST FT1 line only, which left the extra template lines
// carrying placeholder coding. That is harmless while production submission is structurally
// disabled but must be resolved before any real submission (a phantom invoice line must never
// reach the board). populateInvoiceLines populates each real line from the report and trims the
// unused template lines. The board's own C050E MIN sample carries a single FT1 line, so a
// trimmed document stays board conforming (proven structurally in the deploy suite).

// Enumerate the real FT1 invoice detail line blocks: each <FT1>...</FT1> sibling that is not an
// instructional comment (the board template embeds comments containing literal <FT1></FT1> text
// to say how to repeat invoice lines; tagOutsideComment skips those). Returns [{ start, end }]
// with end exclusive (just past </FT1>).
export function ft1DetailLines(unit) {
  const x = s0(unit);
  const lines = [];
  let from = 0;
  for (;;) {
    const a = tagOutsideComment(x, "<FT1>", from);
    if (a === -1) break;
    const c = tagOutsideComment(x, "</FT1>", a);
    if (c === -1) break;
    const end = c + "</FT1>".length;
    lines.push({ start: a, end });
    from = end;
  }
  return lines;
}

// Populate the invoice detail lines of a report unit. lines: an array of { financial, coding },
// one per real invoice line, in order. Each line's financial fields go through populateFT1 and
// its clinical coding through populateFt1Coding (so every line is provenance gated, not just the
// first). Lines beyond the supplied count are trimmed; the retained lines stay in template order
// so their FT1.1 set ids remain contiguous (1..N). Refuses an empty list (a report carries at
// least one invoice detail line) and refuses more lines than the form's template allows (it never
// fabricates an invoice line the form cannot carry).
export function populateInvoiceLines(unit, lines) {
  const x = s0(unit);
  if (!Array.isArray(lines) || lines.length === 0) {
    const e = new Error("A report carries at least one invoice detail line.");
    e.code = "INVOICE-LINES-EMPTY"; throw e;
  }
  const blocks = ft1DetailLines(x);
  if (blocks.length === 0) return x; // no FT1 detail lines in this form: nothing to populate
  if (lines.length > blocks.length) {
    const e = new Error("The form allows " + blocks.length + " invoice detail line(s); refusing to fabricate " + lines.length + ".");
    e.code = "INVOICE-LINES-EXCEED-TEMPLATE"; throw e;
  }
  // Rebuild the FT1 region from the first supplied count of blocks (each populated, scoped to its
  // own block string), preserving the original inter block separators, and drop the rest. The
  // slice past the last kept block's region carries the FT1 END OF comment through unchanged.
  const regionStart = blocks[0].start;
  const regionEnd = blocks[blocks.length - 1].end;
  let region = "";
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) region += x.slice(blocks[i - 1].end, blocks[i].start); // the whitespace separator before this block
    let block = x.slice(blocks[i].start, blocks[i].end);
    const line = lines[i] || {};
    if (line.financial) block = populateFT1(block, line.financial);
    if (line.coding) block = populateFt1Coding(block, line.coding);
    region += block;
  }
  return x.slice(0, regionStart) + region + x.slice(regionEnd);
}

// Populate a whole report unit from a report's data. data: { worker, case, practitioner,
// message, financial, coding, invoiceLines }. Each segment populator is independent, so a caller
// can populate a subset. The clinical coding (data.coding) is provenance gated
// (assertDiagnosisSigned). For the invoice detail lines a caller supplies EITHER data.invoiceLines
// (the multi line form: one { financial, coding } per real line, trims the unused template lines)
// OR the single line data.financial / data.coding (populates only the first FT1 line, the legacy
// shape); invoiceLines wins when both are present.
export function populateReportUnit(unit, data = {}) {
  let u = s0(unit);
  if (data.worker || data.case) u = populatePID(u, data.worker, data.case);
  if (data.case) u = populateCase(u, data.case);
  if (data.practitioner) u = populatePRD(u, data.practitioner);
  if (data.message) u = populateMessage(u, data.message);
  if (data.invoiceLines) {
    u = populateInvoiceLines(u, data.invoiceLines);
  } else {
    if (data.financial) u = populateFT1(u, data.financial);
    if (data.coding) u = populateFt1Coding(u, data.coding);
  }
  return u;
}
