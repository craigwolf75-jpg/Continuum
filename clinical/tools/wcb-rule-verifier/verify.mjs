/* Continuum Prompt 40 increment 2 verification pass: assert transcribed rules
   against the board's own 5.xx sample XML. This is the definition of done for
   the rule transcription (engine spec Section 4.1, acceptance criteria 9, 11,
   15). It reads a sample HL7 v2.3.1 XML and reports the facts a rule must
   satisfy: the PHN inversion (CX.5 vs CX.1), and the OBX observation set with
   values (so capability emission, present vs absent, and Basic vs Extended
   code strings can be checked). Read only, no database. No dashes anywhere.

   Usage: node verify.mjs <sample.xml> [--obx <substring>] */

import { readFileSync } from "node:fs";

const path = process.argv[2];
if (!path) { console.error("usage: node verify.mjs <sample.xml> [--obx <substring>]"); process.exit(2); }
const filter = process.argv.includes("--obx") ? process.argv[process.argv.indexOf("--obx") + 1] : null;
const xml = readFileSync(path, "utf8");

// PHN facts. CX.1 is the Worker 36 value; CX.5 is "patient does NOT have an
// Worker 36" (Y or N). The board rejects a populated PHN when CX.5 = Y.
function tag(name) {
  // returns the inner text of the first <name>...</name> or "" for a self closing <name/>
  const self = new RegExp("<" + name + "\\s*/>", "i");
  if (self.test(xml)) return "";
  const m = xml.match(new RegExp("<" + name + "\\s*>([\\s\\S]*?)</" + name + ">", "i"));
  return m ? m[1].trim() : null;
}
const cx1 = tag("CX.1");
const cx5 = tag("CX.5");

// OBX observations: pull each <OBX>...</OBX>, its OBX.3/CE.1 identifier, and the
// OBX.5 value (empty, a raw value, or a nested CE.1 code).
function extractObx() {
  const out = [];
  const re = /<OBX>([\s\S]*?)<\/OBX>/g;
  let m;
  while ((m = re.exec(xml))) {
    const block = m[1];
    const idM = block.match(/<OBX\.3>[\s\S]*?<CE\.1>([\s\S]*?)<\/CE\.1>[\s\S]*?<\/OBX\.3>/i);
    const id = idM ? idM[1].trim() : "(no id)";
    let value = "";
    const v5self = /<OBX\.5\s*\/>/i.test(block);
    if (!v5self) {
      const nested = block.match(/<OBX\.5\.LST>[\s\S]*?<CE\.1>([\s\S]*?)<\/CE\.1>/i);
      const raw = block.match(/<OBX\.5>([\s\S]*?)<\/OBX\.5>/i);
      if (nested) value = nested[1].trim();
      else if (raw) value = raw[1].replace(/<[^>]+>/g, "").trim();
    }
    out.push({ id, value });
  }
  return out;
}
const obx = extractObx();

console.log("== verification: " + path.split(/[\\/]/).pop() + " ==");
console.log("");
console.log("[PHN] CX.1 (Worker 36 value) = " + JSON.stringify(cx1) +
            " ; CX.5 (does NOT have PHN? Y/N) = " + JSON.stringify(cx5));
if (cx5 === "Y") {
  const ok = cx1 === "" || cx1 === null;
  console.log("[PHN] criterion 15: no PHN indicated (CX.5=Y) AND PHN blank = " + ok + (ok ? "  VERIFIED" : "  FAIL"));
} else if (cx5 === "N") {
  const ok = typeof cx1 === "string" && cx1 !== "";
  console.log("[PHN] criterion 15: has PHN (CX.5=N) AND PHN present = " + ok + (ok ? "  VERIFIED" : "  FAIL"));
} else {
  console.log("[PHN] CX.5 not Y or N in this sample; PHN scenario not asserted here.");
}

console.log("");
console.log("[OBX] total observations: " + obx.length);
const shown = filter ? obx.filter((o) => o.id.toUpperCase().includes(filter.toUpperCase())) : obx;
console.log("[OBX] " + (filter ? "matching '" + filter + "'" : "all") + ": " + shown.length);
for (const o of shown) console.log("   " + o.id + "  =  " + JSON.stringify(o.value));
