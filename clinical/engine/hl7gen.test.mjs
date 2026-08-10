/* Continuum Prompt 42 HL7 generation suite. Proves the OBX layer against the board's
   own sample data: the exact fragment format (anchored to a real board fragment), the
   round trip (parse, regenerate, compare, criterion 5), the base versus conditional
   observation rule (Section 2.2, criterion 4), the C569 and C570 no attachment rule
   (Section 2.3), and the signature hash integrity gate (Section 2.1, 6, 7). Loads the
   wire map and the sample OBX skeletons generated from the real accreditation files.
   No dashes anywhere. */

import { WIRE_MAP } from "../db/hl7_wire_map.data.mjs";
import { SAMPLE_OBX } from "../db/hl7_samples.data.mjs";
import {
  serializeObx, serializeObxSection, extractObx, resolveObservations,
  canonicalizeXml, attachmentContainerAllowed, snapshotHash, assertHashMatch, xmlEscape,
} from "./hl7gen.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const ids = (arr) => arr.map((o) => o.identifier);
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// -- the exact board OBX fragment, anchored to the real 5.02 C050E JOBTITLE block ------
const BOARD_JOBTITLE = `<OBX>
					<OBX.1 />
					<OBX.2 />
					<OBX.3>
						<CE.1>JOBTITLE</CE.1>
					</OBX.3>
					<OBX.4 />
					<OBX.5.LST>
						<OBX.5>Contractor</OBX.5>
					</OBX.5.LST>
					<OBX.11 />
				</OBX>`;
ok("serializeObx reproduces the real board OBX fragment exactly (canonical)", canonicalizeXml(BOARD_JOBTITLE) === serializeObx("JOBTITLE", "Contractor"));
ok("an empty observation emits <OBX.5/> (present and empty)", serializeObx("FILEATTACHMENTNAME1", "") === "<OBX><OBX.1/><OBX.2/><OBX.3><CE.1>FILEATTACHMENTNAME1</CE.1></OBX.3><OBX.4/><OBX.5.LST><OBX.5/></OBX.5.LST><OBX.11/></OBX>");
ok("a populated observation emits its value", serializeObx("EMPNAME", "Company A").includes("<OBX.5>Company A</OBX.5>"));

// -- round trip every form's sample OBX (criterion 5; criteria 2 and 3 for C050E) ------
for (const [form, { max, min }] of Object.entries(SAMPLE_OBX)) {
  ok(form + " Max sample OBX round trips (serialize then parse equals the original)", eq(extractObx(serializeObxSection(max)), max));
  if (min) ok(form + " Min sample OBX round trips", eq(extractObx(serializeObxSection(min)), min));
}
ok("criterion 2: the C050E Max OBX section has 98 observations and round trips", SAMPLE_OBX.C050E.max.length === 98 && eq(extractObx(serializeObxSection(SAMPLE_OBX.C050E.max)), SAMPLE_OBX.C050E.max));
ok("criterion 3: the C050E Min OBX section has 98 observations and round trips", SAMPLE_OBX.C050E.min.length === 98);

// -- criterion 4: conditionally available observations are absent when unmet -----------
const S = SAMPLE_OBX.C050S;
const maxIds = ids(S.max), minIds = ids(S.min), condIds = S.conditional;
const valuesMax = Object.fromEntries(S.max.map((o) => [o.identifier, o.value]));
ok("C050S has 12 conditional observations (Max minus Min)", condIds.length === 12 && S.max.length === 157 && S.min.length === 145);
ok("with conditions unmet, the conditional observations are ABSENT, yielding the base (Min) skeleton", eq(ids(resolveObservations(maxIds, condIds, valuesMax, { includeConditional: false })), minIds));
ok("with conditions met, the full (Max) skeleton is produced", eq(ids(resolveObservations(maxIds, condIds, valuesMax, { includeConditional: true })), maxIds));
ok("a conditional identifier is genuinely dropped, not present and empty, when unmet", (() => {
  const out = resolveObservations(maxIds, condIds, valuesMax, { includeConditional: false });
  return !out.some((o) => condIds.includes(o.identifier));
})());
ok("a base observation with no value is present and empty, never dropped", (() => {
  const base = minIds[0];
  const out = resolveObservations(maxIds, condIds, {}, { includeConditional: false });
  const row = out.find((o) => o.identifier === base);
  return row && row.value === "";
})());
ok("a per identifier condition predicate is honoured", (() => {
  const met = new Set([condIds[0]]);
  const out = resolveObservations(maxIds, condIds, valuesMax, { conditionMet: (id) => met.has(id) });
  return out.some((o) => o.identifier === condIds[0]) && !out.some((o) => o.identifier === condIds[1]);
})());

// -- C569 and C570 accept no attachments (Section 2.3, 7) ------------------------------
ok("C569 and C570 forbid an attachment container", !attachmentContainerAllowed("C569") && !attachmentContainerAllowed("C570"));
ok("the injury forms allow attachments", attachmentContainerAllowed("C050E") && attachmentContainerAllowed("C151"));

// -- the signature hash integrity gate (Section 2.1, 6, 7; criterion 7) ----------------
const payload = serializeObxSection(SAMPLE_OBX.C569.max);
const signed = snapshotHash(payload);
ok("the same payload hashes to the same value", snapshotHash(payload) === signed);
ok("whitespace differences do not change the canonical hash", snapshotHash("  " + payload + "\n") === signed);
ok("a matching upload passes the integrity gate", assertHashMatch(payload, signed) === true);
ok("a mutated payload HALTS with HL7-HASH-MISMATCH, it never retries", (() => {
  const mutated = payload.replace("<OBX.5>Jim Smith</OBX.5>", "<OBX.5>Jane Doe</OBX.5>");
  if (mutated === payload) return false; // the mutation must actually change the payload
  try { assertHashMatch(mutated, signed); return false; }
  catch (e) { return e.code === "HL7-HASH-MISMATCH"; }
})());

// -- xml escaping for generation from plain data --------------------------------------
ok("xmlEscape escapes the markup characters", xmlEscape('a & b < c > d') === "a &amp; b &lt; c &gt; d");

// -- the wire map loaded the HL7 placement Prompt 40 did not (the reconciliation) ------
ok("the wire map has rows for all eight forms", new Set(WIRE_MAP.map((w) => w.form_id)).size === 8);
ok("every OBX segment row carries an OBX.3 identifier", WIRE_MAP.filter((w) => w.segment === "OBX").every((w) => w.obx_identifier));
ok("Job title on C050E maps to the JOBTITLE OBX identifier", WIRE_MAP.some((w) => w.form_id === "C050E" && w.obx_identifier === "JOBTITLE"));
ok("Form ID on C050E maps to the EVN segment, not an OBX", (() => {
  const r = WIRE_MAP.find((w) => w.form_id === "C050E" && /^form id$/i.test(w.element_name));
  return r && r.segment === "EVN" && !r.obx_identifier;
})());

console.log("\nhl7 generation suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
