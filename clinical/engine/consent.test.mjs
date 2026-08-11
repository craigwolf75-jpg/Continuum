/* Continuum Prompt 43 consent and revocation suite (Section 6, criteria 6, 7). Proves
   consent B gates only the employer view and the worker plan, never the board submission
   or the Pink Copy, and that revocation withdraws the employer view within 60 seconds
   with a notice that never implies a recall is possible. No dashes anywhere. */

import { performance } from "node:perf_hooks";
import {
  employerViewAllowed, workerPlanAllowed, boardSubmissionAllowed, pinkCopyAllowed,
  revokeConsentB, revocationNotice, withinRevocationSla, REVOCATION_SLA_SECONDS,
} from "./consent.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const granted = { granted: true };
const declined = { granted: false };
const revoked = { granted: true, revoked_at: "2026-08-10T00:00:00Z" };

// -- consent B gates the employer view and the worker plan ----------------------------
ok("an active consent B allows the employer view and the worker plan", employerViewAllowed(granted) === true && workerPlanAllowed(granted) === true);
ok("a declined consent B allows neither the employer view nor the worker plan", employerViewAllowed(declined) === false && workerPlanAllowed(declined) === false);
ok("a revoked consent B allows no employer view", employerViewAllowed(revoked) === false);
ok("absent consent B allows no employer view (Section 5)", employerViewAllowed(null) === false && employerViewAllowed(undefined) === false);

// -- criterion 7: consent never gates the board submission or the Pink Copy ------------
ok("criterion 7: the board submission is allowed even when consent B is declined", boardSubmissionAllowed() === true);
ok("criterion 7: the Pink Copy is available even when consent B is declined", pinkCopyAllowed() === true);
ok("the board submission does not depend on the consent argument at all (statutory duty)", boardSubmissionAllowed(declined) === true && boardSubmissionAllowed(revoked) === true);

// -- revocation withdraws the employer view and stamps withdrawn_at --------------------
const published = { id: "prs-1", employer_id: "e1", access: "active" };
const rev = revokeConsentB(published, "2026-08-10T12:00:00Z");
ok("revocation stamps withdrawn_at and marks the view withdrawn", rev.employer_view.withdrawn_at === "2026-08-10T12:00:00Z" && rev.employer_view.access === "withdrawn" && rev.employer_view_allowed === false);
ok("revocation leaves the board submission and the Pink Copy unaffected", rev.board_submission_unaffected === true && rev.pink_copy_unaffected === true);
ok("revocation does not mutate the original published set", published.access === "active" && published.withdrawn_at === undefined);

// -- the notice never implies a recall is possible ------------------------------------
ok("the revocation notice states what was disclosed cannot be recalled", revocationNotice().includes("cannot be recalled"));
ok("the notice does not imply a recall is possible", !/can be recalled|will be recalled|recall the information|undo the disclosure/i.test(revocationNotice()));

// -- criterion 6: the SLA is 60 seconds, and a real revoke call is far inside it -------
ok("the revocation SLA is 60 seconds", REVOCATION_SLA_SECONDS === 60);
ok("a revocation 59 seconds after the request is within the SLA", withinRevocationSla(1000, 1000 + 59000) === true);
ok("a revocation 61 seconds after the request breaches the SLA", withinRevocationSla(1000, 1000 + 61000) === false);
ok("criterion 6: an actual revoke call completes well within 60 seconds (timed)", (() => {
  const start = performance.now();
  revokeConsentB(published, "2026-08-10T12:00:00Z");
  const elapsedMs = performance.now() - start;
  return elapsedMs / 1000 <= REVOCATION_SLA_SECONDS && withinRevocationSla(0, elapsedMs);
})());

console.log("\nconsent suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
