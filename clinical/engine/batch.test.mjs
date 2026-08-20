/* Continuum Prompt 42 batch worker suite. Proves deadline aware scheduling (Section 4.1,
   criterion 6: a report signed 16:30 on a Friday before a Monday statutory holiday
   targets the same day tier batch), the business day and holiday arithmetic, and the
   batch state machine (collect signed, block on an inactive practitioner, return reports
   to signed on a validation failure, upload on pass). No dashes anywhere. */

import {
  isBusinessDay, nextBusinessDay, sameDayTierDeadline, targetBatch,
  collectSigned, blockedByInactivePractitioner, onValidationFailure, runBatch,
  DEFAULT_BATCH_SCHEDULE,
} from "./batch.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// concrete anchors: 2026-07-31 is a Friday, 2026-08-03 is a Monday (Worker 36 Heritage Day).
const FRI = "2026-07-31", MON_HOL = "2026-08-03", TUE = "2026-08-04";
const holidays = new Set([MON_HOL]);
const dow = (d) => new Date(d + "T00:00:00Z").getUTCDay();

ok("the anchor dates are the expected days of the week", dow(FRI) === 5 && dow(MON_HOL) === 1);

// -- business day and holiday arithmetic ----------------------------------------------
ok("a weekday is a business day", isBusinessDay(FRI, holidays));
ok("a Saturday is not a business day", !isBusinessDay("2026-08-01", holidays));
ok("a statutory holiday is not a business day", !isBusinessDay(MON_HOL, holidays));
ok("next business day skips the weekend and the Monday holiday to Tuesday", nextBusinessDay(FRI, holidays) === TUE);
ok("without the holiday, next business day after Friday is Monday", nextBusinessDay(FRI, new Set()) === MON_HOL);

// -- the same day tier deadline (Section 4.1) -----------------------------------------
ok("the same day tier deadline is 10:00 the next business day", (() => { const d = sameDayTierDeadline(FRI, holidays); return d.date === TUE && d.time === "10:00"; })());

// -- criterion 6: signed 16:30 Friday targets the 17:00 same day batch, not 00:05 ------
const target = targetBatch({ date: FRI, time: "16:30" }, { holidays });
ok("criterion 6: the target batch is the same day 17:00 batch", target.date === FRI && target.time === "17:00");
ok("criterion 6: it is NOT deferred to the overnight 00:05 batch", !(target.time === "00:05"));
ok("criterion 6: the chosen batch meets the same day tier", target.meetsTier === true);
ok("criterion 6: the deadline it was computed against is Tuesday 10:00", target.deadline.date === TUE && target.deadline.time === "10:00");

// -- other scheduling cases -----------------------------------------------------------
ok("a report signed 09:30 targets the 14:00 batch the same day", (() => { const t = targetBatch({ date: FRI, time: "09:30" }, { holidays }); return t.date === FRI && t.time === "14:00"; })());
ok("a report signed 23:00 targets the next day 00:05 batch", (() => { const t = targetBatch({ date: FRI, time: "23:00" }, { holidays }); return t.date === "2026-08-01" && t.time === "00:05"; })());
ok("the default schedule is the four board slots", DEFAULT_BATCH_SCHEDULE.length === 4 && DEFAULT_BATCH_SCHEDULE.includes("17:00"));

// -- the batch state machine ----------------------------------------------------------
const reports = [
  { id: "r1", status: "signed", practitioner_id: "p1" },
  { id: "r2", status: "draft", practitioner_id: "p1" },
  { id: "r3", status: "signed", practitioner_id: "p2" },
];
ok("collectSigned takes only signed reports", collectSigned(reports).map((r) => r.id).join() === "r1,r3");

const activeAll = () => true;
const inactiveP2 = (id) => id !== "p2";
ok("an inactive practitioner blocks the batch and is named", (() => {
  const b = blockedByInactivePractitioner(collectSigned(reports), inactiveP2);
  return b.blocked && b.practitioners.includes("p2") && b.reports.includes("r3") && b.message.includes("p2");
})());
ok("all active practitioners do not block", blockedByInactivePractitioner(collectSigned(reports), activeAll).blocked === false);

ok("a validation failure returns the reports to signed and notifies a named human", (() => {
  const out = onValidationFailure(collectSigned(reports), [{ id: "XSD-1" }]);
  return out.status === "failed" && out.returnedToSigned.join() === "r1,r3" && out.notify.recipient === "named-human";
})());

// runBatch: empty
ok("an empty queue yields status empty", runBatch({ reports: [{ id: "r", status: "draft" }], isPractitionerActive: activeAll }).status === "empty");

// runBatch: blocked by inactive practitioner
ok("runBatch blocks on an inactive practitioner before generating", (() => {
  let generated = false;
  const out = runBatch({ reports, isPractitionerActive: inactiveP2, generate: () => { generated = true; return "x"; }, validate: () => ({ ok: true }), upload: () => ({ ok: true }) });
  return out.status === "blocked" && generated === false;
})());

// runBatch: validation failure returns to signed and notifies
ok("runBatch returns reports to signed and notifies on a validation failure", (() => {
  let notified = null;
  const out = runBatch({ reports, isPractitionerActive: activeAll, generate: () => "<xml/>", validate: () => ({ ok: false, failures: ["XSD"] }), upload: () => ({ ok: true }), notify: (p) => { notified = p; } });
  return out.status === "failed" && out.returnedToSigned.join() === "r1,r3" && notified && notified.recipient === "named-human";
})());

// runBatch: pass then upload
ok("runBatch uploads when validation passes", (() => {
  const out = runBatch({ reports, isPractitionerActive: activeAll, generate: () => "<xml/>", validate: () => ({ ok: true }), upload: () => ({ ok: true, status: "uploaded" }) });
  return out.status === "uploaded" && out.reports.join() === "r1,r3";
})());

// runBatch: upload failure returns to signed
ok("runBatch returns reports to signed when the upload fails", (() => {
  const out = runBatch({ reports, isPractitionerActive: activeAll, generate: () => "<xml/>", validate: () => ({ ok: true }), upload: () => ({ ok: false, escalation: { notify: ["sms"] } }), notify: () => {} });
  return out.status === "upload-failed" && out.returnedToSigned.join() === "r1,r3";
})());

console.log("\nbatch suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
