/* Continuum Prompt 40: namespaced code suite (Prompt 39A Section 2.6, acceptance
   criterion 14). Proves that the token LIMITED, which exists in both the Basic
   Work Restriction Codes and the Weight Category Codes sheets, cannot cross
   namespaces: a weight LIMITED cannot be assigned to a capability element and a
   restriction LIMITED cannot be assigned to a weight element, and the guard
   checks the namespace tag rather than the string. No dashes anywhere. */

import {
  NS, makeCode, isRestrictionCode, isWeightCode,
  assignCapabilityCode, assignWeightCode, codeToken
} from "./codes.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const restrictionLimited = makeCode(NS.BASIC, "LIMITED").value;
const weightLimited = makeCode(NS.WEIGHT, "LIMITED").value;

// -- construction and membership --
ok("makeCode builds a Basic LIMITED", restrictionLimited && restrictionLimited.ns === NS.BASIC && restrictionLimited.code === "LIMITED");
ok("makeCode builds a Weight LIMITED", weightLimited && weightLimited.ns === NS.WEIGHT && weightLimited.code === "LIMITED");
ok("makeCode rejects a non member (LIMITEDTO is not Basic)", makeCode(NS.BASIC, "LIMITEDTO").value === null);
ok("makeCode Extended accepts LIMITEDTO", makeCode(NS.EXTENDED, "LIMITEDTO").value.code === "LIMITEDTO");
ok("makeCode rejects an unknown namespace without an injected set", makeCode("Nonsense Codes", "X").value === null);
ok("makeCode accepts an injected member set for any sheet", makeCode("Fit For Work Codes", "FIT", new Set(["FIT", "UNFIT"])).value.code === "FIT");

// -- the two are the SAME string but DIFFERENT types --
ok("both are the string LIMITED", restrictionLimited.code === weightLimited.code && restrictionLimited.code === "LIMITED");
ok("restriction LIMITED is a restriction code", isRestrictionCode(restrictionLimited) === true);
ok("restriction LIMITED is NOT a weight code", isWeightCode(restrictionLimited) === false);
ok("weight LIMITED is a weight code", isWeightCode(weightLimited) === true);
ok("weight LIMITED is NOT a restriction code", isRestrictionCode(weightLimited) === false);

// -- criterion 14: no cross namespace assignment --
ok("a weight LIMITED cannot be assigned to a capability element", assignCapabilityCode("Bending", weightLimited).length === 1);
ok("a restriction LIMITED CAN be assigned to a capability element", assignCapabilityCode("Bending", restrictionLimited).length === 0);
ok("a restriction LIMITED cannot be assigned to a weight element", assignWeightCode("Lifting max of", restrictionLimited).length === 1);
ok("a weight LIMITED CAN be assigned to a weight element", assignWeightCode("Lifting max of", weightLimited).length === 0);
ok("an Extended LIMITEDTO can be assigned to a capability element", assignCapabilityCode("Sitting", makeCode(NS.EXTENDED, "LIMITEDTO").value).length === 0);
ok("HEAVY can be assigned to a weight element", assignWeightCode("Lifting max of", makeCode(NS.WEIGHT, "HEAVY").value).length === 0);

// -- the guard is by TYPE, not by string: a bare string is rejected everywhere --
ok("a bare 'LIMITED' string is not a restriction code", isRestrictionCode("LIMITED") === false);
ok("a bare 'LIMITED' string is not a weight code", isWeightCode("LIMITED") === false);
ok("a bare string cannot be assigned to a capability element", assignCapabilityCode("Bending", "LIMITED").length === 1);
ok("a bare string cannot be assigned to a weight element", assignWeightCode("Lifting max of", "LIMITED").length === 1);
ok("an unbranded look alike object is rejected", isRestrictionCode({ ns: NS.BASIC, code: "LIMITED" }) === false);

// -- codeToken unwraps only branded values --
ok("codeToken returns the token for a branded code", codeToken(restrictionLimited) === "LIMITED");
ok("codeToken returns null for a bare string", codeToken("LIMITED") === null);

console.log("\ncodes suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
