/* Continuum Prompt 43 consent and revocation suite (Section 6, criteria 6, 7). Proves
   consent B gates only the employer view and the worker plan, never the board submission
   or the Pink Copy, and that revocation withdraws the employer view within 60 seconds
   with a notice that never implies a recall is possible. No dashes anywhere. */

import { performance } from "node:perf_hooks";
import {
  employerViewAllowed, employerPublishAllowed, employerPublishDeniedReason,
  workerPlanAllowed, boardSubmissionAllowed, pinkCopyAllowed,
  revokeConsentB, revocationNotice, withinRevocationSla, REVOCATION_SLA_SECONDS,
} from "./consent.mjs";
import { CONSENT_PROFILES, DISCLOSURE_PROFILES, SYNTHETIC_JURISDICTION } from "../db/provincial_rules.data.mjs";

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

// -- ARGUS-PRIV-010: disclosure channel is part of the employer publish gate ----------
const albertaDisclosure = DISCLOSURE_PROFILES.alberta_pink_copy;
const zzDisclosure = DISCLOSURE_PROFILES.synthetic_open;
const throwsCode = (fn, code) => { try { fn(); return false; } catch (e) { return e.code === code; } };

ok("ARGUS-PRIV-010 (a): channel none blocks publish even when consent B is granted", employerPublishAllowed(granted, zzDisclosure) === false);
ok("ARGUS-PRIV-010 (a): channel none denied reason is employer-channel-blocked", employerPublishDeniedReason(granted, zzDisclosure) === "employer-channel-blocked");
ok("ARGUS-PRIV-010 (a): channel blocked also refuses with consent B granted", employerPublishAllowed(granted, DISCLOSURE_PROFILES.unspecified) === false);
ok("ARGUS-PRIV-010 (b): Alberta worker_handoff allows publish when consent B is granted", employerPublishAllowed(granted, albertaDisclosure) === true);
ok("ARGUS-PRIV-010 (b): Alberta still requires consent B when declined", employerPublishAllowed(declined, albertaDisclosure) === false);
ok("ARGUS-PRIV-010 (b): Alberta still requires consent B when revoked", employerPublishAllowed(revoked, albertaDisclosure) === false);
ok("ARGUS-PRIV-010 (b): Alberta still requires consent B when absent", employerPublishAllowed(null, albertaDisclosure) === false);
ok("ARGUS-PRIV-010 (b): Alberta denied reason stays consent-b-required", employerPublishDeniedReason(declined, albertaDisclosure) === "consent-b-required");
ok("ARGUS-PRIV-010 (c): synthetic_test and synthetic_open both refuse employer publish", CONSENT_PROFILES.synthetic_test.employer_disclosure === "none" && zzDisclosure.employer_channel === "none");
ok("ARGUS-PRIV-010 (c): ZZ still points at the synthetic pair", SYNTHETIC_JURISDICTION.consent_profile === "synthetic_test" && SYNTHETIC_JURISDICTION.employer_disclosure_profile === "synthetic_open");
ok("a missing disclosure profile fails named, never defaults to Alberta", throwsCode(() => employerPublishAllowed(granted), "DISCLOSURE-PROFILE-MISSING"));
ok("an empty disclosure profile fails named", throwsCode(() => employerPublishAllowed(granted, {}), "DISCLOSURE-PROFILE-MISSING"));
ok("an unknown employer_channel fails named", throwsCode(() => employerPublishAllowed(granted, { employer_channel: "mystery" }), "DISCLOSURE-PROFILE-UNKNOWN"));

// -- criterion 7: consent never gates the board submission or the Pink Copy ------------
const statutory = CONSENT_PROFILES.alberta_statutory_report;
ok("criterion 7: the board submission is allowed even when consent B is declined (statutory profile)", boardSubmissionAllowed(declined, statutory) === true);
ok("criterion 7: the Pink Copy is available even when consent B is declined", pinkCopyAllowed() === true);
ok("the statutory profile does not depend on the consent argument (duty to report)", boardSubmissionAllowed(declined, statutory) === true && boardSubmissionAllowed(revoked, statutory) === true);
ok("a missing consent profile fails named, never defaults", (() => { try { boardSubmissionAllowed(declined); return false; } catch (e) { return e.code === "CONSENT-PROFILE-MISSING"; } })());
ok("a requires_consent profile blocks when consent B is declined", boardSubmissionAllowed(declined, CONSENT_PROFILES.synthetic_test) === false);
ok("a requires_consent profile allows when consent B is granted", boardSubmissionAllowed(granted, CONSENT_PROFILES.synthetic_test) === true);

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
