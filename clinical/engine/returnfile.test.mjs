/* Continuum Prompt 42 return file suite. Proves the board return file is parsed into
   rejection rows (nothing swallowed: a line with no code is kept unparsed), that a code
   the catalogue trusts resolves to its element, and that an unmapped code surfaces the
   board's raw text to a human and creates a catalogue growth record (Section 4.3,
   criterion 9), never guessed and never auto mapped. No dashes anywhere. */

import { indexErrorCatalogue } from "./errors.mjs";
import { ROWS as CATALOGUE_ROWS } from "../db/error_catalogue.data.mjs";
import {
  parseReturnLine, parseReturnFile, matchDescriptionToElements, catalogueGrowthRecord,
  reconcileReturnFile, buildSubmissionResult,
} from "./returnfile.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const DOC_LINE = "1\t121023: Worker Personal Health Number must be BLANK since Worker Personal Health Number Indicator is No";
const ELEMENTS = ["Alberta Personal Health Number", "Worker Personal Health Number", "Claim Number", "Date of Injury"];

// -- parsing --------------------------------------------------------------------------
ok("the documented line parses into seq, code and description", (() => {
  const p = parseReturnLine(DOC_LINE);
  return p.seq === "1" && p.code === "121023" && p.description.startsWith("Worker Personal Health Number must be BLANK");
})());
ok("a code in its own field parses (variant without a colon)", (() => {
  const p = parseReturnLine("121023\tWorker PHN must be blank");
  return p.code === "121023" && p.description === "Worker PHN must be blank";
})());
ok("a line with no code yields a null code", parseReturnLine("Batch Control ID\tC050E Sample").code === null);

const file = [
  "Batch Control ID: C050E Sample",
  DOC_LINE,
  "2\t100044: Date of Injury is required",
  "",
].join("\n");
const parsed = parseReturnFile(file);
ok("the file parses two rejections and keeps the header as unparsed (nothing swallowed)", parsed.rejections.length === 2 && parsed.unparsed.length === 1);
ok("the unparsed header is preserved verbatim", parsed.unparsed[0].includes("Batch Control ID"));

// -- description to element matching --------------------------------------------------
ok("the description matches the Worker PHN element at full confidence", (() => {
  const m = matchDescriptionToElements(parseReturnLine(DOC_LINE).description, ELEMENTS);
  return m.element === "Worker Personal Health Number" && m.confidence === 1;
})());
ok("Alberta PHN scores below Worker PHN (the word Alberta is absent)", (() => {
  const m = matchDescriptionToElements("Worker Personal Health Number must be BLANK", ELEMENTS);
  return m.element === "Worker Personal Health Number";
})());
ok("an unrelated description matches nothing", matchDescriptionToElements("some unrelated board note", ELEMENTS).confidence === 0);

// -- catalogue growth record (a proposal, never a guess) ------------------------------
ok("a strong match proposes an element for a human to confirm", (() => {
  const g = catalogueGrowthRecord("AB", parseReturnLine(DOC_LINE), ELEMENTS);
  return g.proposed_element === "Worker Personal Health Number" && g.match_confidence >= 0.8 && g.status === "pending-human-confirmation";
})());
ok("a weak match proposes NO element (never guessed)", (() => {
  const g = catalogueGrowthRecord("AB", parseReturnLine("9\t999999: some unrelated board note"), ELEMENTS);
  return g.proposed_element === null && g.board_code === "999999";
})());
ok("the growth record always carries the board raw text", catalogueGrowthRecord("AB", parseReturnLine(DOC_LINE), ELEMENTS).raw_text.includes("121023"));

// -- reconcile against an EMPTY catalogue: everything unmapped, growth created (crit 9) --
const empty = indexErrorCatalogue([]);
const rEmpty = reconcileReturnFile(parsed, empty, { jurisdiction: "AB", elementNames: ELEMENTS });
ok("criterion 9: against an empty catalogue every rejection is unmapped and surfaced to a human", rEmpty.results.every((r) => r.status === "unmapped" && r.surfaceToHuman === true));
ok("criterion 9: a catalogue growth record is created for each unmapped code", rEmpty.catalogueGrowth.length === 2);
ok("the unmapped count and unparsed lines are carried through", rEmpty.unmappedCount === 2 && rEmpty.unparsed.length === 1);

// -- reconcile against a catalogue that trusts a code: it resolves to its element -------
const trusted = indexErrorCatalogue([{ jurisdiction_code: "AB", board_code: "121023", element_name: "Alberta Personal Health Number", confidence: 0.95 }]);
const rTrusted = reconcileReturnFile(parsed, trusted, { jurisdiction: "AB", elementNames: ELEMENTS });
ok("a trusted code resolves to its element, the other stays unmapped", (() => {
  const mapped = rTrusted.results.find((r) => r.code === "121023");
  const other = rTrusted.results.find((r) => r.code === "100044");
  return mapped.status === "mapped" && mapped.element === "Alberta Personal Health Number" && other.status === "unmapped";
})());
ok("a trusted mapping creates no growth record for that code", !rTrusted.catalogueGrowth.some((g) => g.board_code === "121023"));

// -- below the floor is treated as unmapped -------------------------------------------
const lowConf = indexErrorCatalogue([{ jurisdiction_code: "AB", board_code: "121023", element_name: "Alberta Personal Health Number", confidence: 0.5 }]);
ok("a catalogue entry below the 0.80 floor is unmapped and surfaced", reconcileReturnFile(parsed, lowConf, { jurisdiction: "AB", elementNames: ELEMENTS }).results.find((r) => r.code === "121023").status === "unmapped");

// -- the submission result ------------------------------------------------------------
ok("the submission result is rejected and requires human review when a code is unmapped", (() => {
  const s = buildSubmissionResult("sub-1", 1, rEmpty);
  return s.status === "rejected" && s.rejection_count === 2 && s.unmapped_count === 2 && s.human_review_required === true;
})());
ok("an empty reconciliation yields an accepted submission", (() => {
  const s = buildSubmissionResult("sub-2", 1, reconcileReturnFile({ rejections: [], unparsed: [] }, empty, {}));
  return s.status === "accepted" && s.human_review_required === false;
})());

// -- the real seeded catalogue contains the one package code --------------------------
ok("the real error catalogue data carries the board code 121023", CATALOGUE_ROWS.some((r) => String(r.board_code) === "121023"));

console.log("\nreturn file suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
