/* Continuum Prompt 40 increment 3: P3 submission and orchestration suite.
   node clinical/engine/p3.test.mjs
   Proves the submission level primitives (occurrence, contract/role/form,
   ancestry, attachments, drafts, stale carried) and the runSubmission
   orchestrator: a clean form passes, and a form with errors across every check
   category reports ALL of them, never stopping at the first (criterion 12).
   No dashes anywhere. */

import {
  checkOccurrence, checkContractRoleForm, checkParentAncestor,
  checkAttachments, checkNoDrafts, checkNoStaleCarried, runSubmission
} from "./p3.mjs";
import { valX01, valX04 } from "./validation.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// -- occurrence (check 4) --
ok("occurrence: below min is rejected", checkOccurrence("Injury table", [], 1, 5).length === 1);
ok("occurrence: above max is rejected", checkOccurrence("Invoice lines", new Array(26).fill({}), 1, 25).length === 1);
ok("occurrence: within bounds is accepted", checkOccurrence("Invoice lines", [{}, {}], 1, 25).length === 0);

// -- contract/role/form (check 7) --
const triples = new Set(["000053|PT|C050S"]);
ok("CRF: a permitted triple is accepted", checkContractRoleForm("000053", "PT", "C050S", triples).length === 0);
ok("CRF: an unpermitted triple is rejected, never defaults", checkContractRoleForm("999", "PT", "C050S", triples).length === 1);

// -- ancestry (check 8) --
ok("ancestor: a permitted parent is accepted", checkParentAncestor("C050E", ["C050E", "C050S"]).length === 0);
ok("ancestor: an unpermitted parent is rejected", checkParentAncestor("C999", ["C050E"]).length === 1);
ok("ancestor: no parent (not a follow up) is accepted", checkParentAncestor("", ["C050E"]).length === 0);

// -- attachments (check 9) --
const attRule = { allowedTypes: new Set(["pdf", "jpg"]), maxBytes: 1048576 };
ok("attachments: a permitted type under the cap is accepted", checkAttachments([{ type: "pdf", bytes: 500 }], attRule).length === 0);
ok("attachments: a forbidden type is rejected", checkAttachments([{ type: "exe", bytes: 500 }], attRule).length === 1);
ok("attachments: over the size cap is rejected", checkAttachments([{ type: "pdf", bytes: 2000000 }], attRule).length === 1);
ok("attachments: permitNone with an attachment is rejected (C569/C570)", checkAttachments([{ type: "pdf", bytes: 1 }], { permitNone: true }).length === 1);
ok("attachments: permitNone with none is accepted", checkAttachments([], { permitNone: true }).length === 0);

// -- drafts (check 10) and stale carried (check 11) --
ok("drafts: an untouched draft field is rejected", checkNoDrafts([{ name: "Note", draft: true }, { name: "OK", draft: false }]).length === 1);
ok("drafts: no drafts is accepted", checkNoDrafts([{ name: "OK", draft: false }]).length === 0);
ok("stale: an unconfirmed carried forward value is rejected", checkNoStaleCarried([{ name: "Old dx", carriedForward: true, confirmed: false }]).length === 1);
ok("stale: a confirmed carried forward value is accepted", checkNoStaleCarried([{ name: "Old dx", carriedForward: true, confirmed: true }]).length === 0);

// -- runSubmission: a clean form passes --
const cleanForm = {
  id: "C050S",
  elements: [
    { id: "phn", name: "Alberta PHN", type: "string", required: true },
    { id: "fees", name: "Fees", type: "numeric", bounds: { gt: 0, lte: 9999.99 } },
    { id: "pob", name: "Part of body", type: "code", codeListName: "POB" }
  ],
  datasets: [{ id: "inj", name: "Injury table", rows: [{ part: "Hand" }], minOccurs: 1, maxOccurs: 5 }],
  attachmentRule: { permitNone: true },
  allowedAncestors: ["C050E"]
};
const board = { codeSets: { POB: new Set(["01100"]) }, permittedTriples: new Set(["000053|PT|C050S"]) };
const cleanPayload = {
  values: { phn: "123456789", fees: "100", pob: "01100" },
  meta: { contract: "000053", role: "PT", form: "C050S", parentForm: "", attachments: [], draftFields: [], carriedForwardFields: [] }
};
const cleanRes = runSubmission({ form: cleanForm, payload: cleanPayload, board, crossFieldChecks: [() => valX01(false, "123456789")] });
ok("runSubmission: a clean form is ok with zero failures", cleanRes.ok === true && cleanRes.failures.length === 0);
ok("runSubmission: reports 11 evaluated checks", cleanRes.evaluated.length === 11);
ok("runSubmission: reports check 12 XSD as deferred, not silently skipped", cleanRes.deferred.length === 1 && cleanRes.deferred[0].includes("xsd"));

// -- runSubmission: errors across every category are ALL collected (criterion 12) --
const badForm = {
  id: "C050S",
  elements: [
    { id: "phn", name: "Alberta PHN", type: "string", required: true },       // "" -> P1-REQUIRED
    { id: "fees", name: "Fees", type: "numeric", bounds: { gt: 0, lte: 9999.99 } }, // "0" -> P1-RANGE
    { id: "pob", name: "Part of body", type: "code", codeListName: "POB" }     // "99999" -> P1-CODELIST
  ],
  datasets: [{ id: "inj", name: "Injury table", rows: [], minOccurs: 1, maxOccurs: 5 }], // -> P3-OCCURS
  attachmentRule: { permitNone: true },                                        // one attached -> P3-ATTACH
  allowedAncestors: ["C050E"]                                                  // parent C999 -> P3-ANCESTOR
};
const badPayload = {
  values: { phn: "", fees: "0", pob: "99999" },
  meta: {
    contract: "999", role: "PT", form: "C050S",                               // -> P3-CRF
    parentForm: "C999",
    attachments: [{ type: "pdf", bytes: 10 }],
    draftFields: [{ name: "Note", draft: true }],                             // -> P3-DRAFT
    carriedForwardFields: [{ name: "Old dx", carriedForward: true, confirmed: false }] // -> P3-STALE
  }
};
const dup = [{ part: "Hand", side: "left", nature: "Sprain" }, { part: "Hand", side: "left", nature: "Sprain" }];
const badRes = runSubmission({ form: badForm, payload: badPayload, board, crossFieldChecks: [() => valX04(dup)] }); // -> VAL-X04
const ids = new Set(badRes.failures.map((f) => f.id));
ok("runSubmission: a broken form is not ok", badRes.ok === false);
ok("runSubmission: collects all ten distinct failures, never stops at the first", badRes.failures.length === 10);
ok("runSubmission: covers P1 required, range, codelist", ids.has("P1-REQUIRED") && ids.has("P1-RANGE") && ids.has("P1-CODELIST"));
ok("runSubmission: covers the cross field VAL-X04", ids.has("VAL-X04"));
ok("runSubmission: covers occurrence, crf, ancestor, attach, draft, stale", ["P3-OCCURS", "P3-CRF", "P3-ANCESTOR", "P3-ATTACH", "P3-DRAFT", "P3-STALE"].every((i) => ids.has(i)));
ok("runSubmission: every failure names its element", badRes.failures.every((f) => typeof f.element === "string" && f.element.length > 0));

console.log("\np3 suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
