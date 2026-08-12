/* Continuum Prompt 42: the OBX skeleton section suite. Proves skeletonObxSection emits the
   FULL form skeleton in order (the wcb_obx_skeleton seed, 009/010), each observation present,
   carrying its value or present and empty, never absent (the board convention). Round trips
   through extractObx. No dashes anywhere. */

import { skeletonObxSection, extractObx } from "./hl7gen.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const skeleton = ["JOBTITLE", "EMPNAME", "ACCIDENTDATE", "INJURYNATURE", "RTWDATE"];

// -- full skeleton emitted in order, values filled, rest present and empty ----
{
  const section = skeletonObxSection(skeleton, { JOBTITLE: "Gatehouse Officer", RTWDATE: "20260202" });
  const obs = extractObx(section);
  ok("every skeleton identifier is emitted, in order", obs.length === skeleton.length && obs.every((o, i) => o.identifier === skeleton[i]));
  ok("a valued identifier carries its value", obs.find((o) => o.identifier === "JOBTITLE").value === "Gatehouse Officer" && obs.find((o) => o.identifier === "RTWDATE").value === "20260202");
  ok("an unvalued identifier is present and empty (not absent, not null)", obs.find((o) => o.identifier === "EMPNAME").value === "" && obs.find((o) => o.identifier === "ACCIDENTDATE").value === "");
  ok("present and empty renders as a self closing OBX.5", /<OBX\.5\/>/.test(section));
}

// -- an empty value map yields the full skeleton, all present and empty -------
{
  const section = skeletonObxSection(skeleton, {});
  const obs = extractObx(section);
  ok("an empty value map still emits the full skeleton", obs.length === skeleton.length && obs.every((o) => o.value === ""));
}

// -- an empty skeleton yields an empty section -------------------------------
ok("an empty skeleton yields an empty section", skeletonObxSection([], { JOBTITLE: "x" }) === "");

// -- a value for an identifier not in the skeleton is ignored (skeleton drives order/set) --
{
  const section = skeletonObxSection(skeleton, { NOTINSKELETON: "leak", JOBTITLE: "Guard" });
  ok("a value outside the skeleton never appears", !section.includes("leak") && extractObx(section).length === skeleton.length);
}

console.log("\nOBX skeleton section suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
