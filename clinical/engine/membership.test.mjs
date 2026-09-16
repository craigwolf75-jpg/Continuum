/* Prompt 47 E2 membership suite. node clinical/engine/membership.test.mjs
   No em dashes or en dashes anywhere. */

import { upsertGlobalPractitioner, addMembership, validateContractRole, formsForMembership, assertLocationContext } from "./membership.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const throws = (fn, code) => { try { fn(); return false; } catch (e) { return !code || e.code === code; } };

function store() {
  let n = 0;
  return {
    nextId: (p) => p + "-" + (++n),
    practitioners: [],
    memberships: [],
    locations: [
      { id: "loc-a", organisation_id: "org-1", region_id: "reg-1", jurisdiction_code: "AB", name: "A" },
      { id: "loc-b", organisation_id: "org-1", region_id: "reg-1", jurisdiction_code: "AB", name: "B" },
    ],
    contractRoles: [
      { contract_id: "000001", practitioner_role: "GP" },
      { contract_id: "000004", practitioner_role: "OR" },
    ],
    contractRoleForms: [
      { contract_id: "000001", practitioner_role: "GP", form_id: "C050E", report_kind: "initial" },
      { contract_id: "000004", practitioner_role: "OR", form_id: "C568A", report_kind: "initial" },
    ],
  };
}

const s = store();
const first = upsertGlobalPractitioner({ billing_number: "BN-100", family_name: "Lee", given_name: "Pat", clinic_id: "legacy-clinic" }, s);
const again = upsertGlobalPractitioner({ billing_number: "BN-100", family_name: "Lee", given_name: "Pat" }, s);
ok("one billing number is one practitioner", first.created === true && again.created === false && first.practitioner.id === again.practitioner.id);

const m1 = addMembership({
  organisation_id: "org-1", location_id: "loc-a", practitioner_id: first.practitioner.id,
  contract_identifier: "000001", practitioner_role: "GP", status: "active",
}, s);
const m2 = addMembership({
  organisation_id: "org-1", location_id: "loc-b", practitioner_id: first.practitioner.id,
  contract_identifier: "000004", practitioner_role: "OR", status: "active",
}, s);
ok("one practitioner two location memberships", m1.location_id === "loc-a" && m2.location_id === "loc-b" && m1.practitioner_id === m2.practitioner_id);
ok("different contract and role per location", m1.contract_identifier === "000001" && m2.practitioner_role === "OR");
ok("duplicate membership at the same location fails", throws(() => addMembership({
  organisation_id: "org-1", location_id: "loc-a", practitioner_id: first.practitioner.id,
  contract_identifier: "000001", practitioner_role: "GP",
}, s), "MEMBERSHIP-DUPLICATE"));
ok("invalid contract and role pair blocks", throws(() => validateContractRole("000001", "OR", s), "CONTRACT-ROLE-INVALID"));
ok("NP role is blocked pending a board answer", throws(() => validateContractRole("000084", "NP", s), "ROLE-BLOCKED"));
ok("forms follow the membership pair", formsForMembership(m1, s, "initial").join() === "C050E");
ok("location without matching organisation fails named", throws(() => assertLocationContext("loc-a", "org-9", s), "LOCATION-ORG-MISMATCH"));
ok("locum dates required on a fresh store", throws(() => addMembership({
  organisation_id: "org-1", location_id: "loc-a", practitioner_id: "p-locum",
  contract_identifier: "000001", practitioner_role: "GP", status: "locum",
}, store()), "LOCUM-DATES-MISSING"));

console.log("\nmembership suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
