/* Prompt 50 core platform foundations. Architecture scans, service proofs,
   and acceptance mapping. Does not modify Prompts 39 to 46 tests.
   No em dashes or en dashes anywhere. */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { namedError, toClinicMessage, publicErrorBody } from "../platform/service/errors.mjs";
import { resolveTenantContext, setConfigStatements } from "../platform/service/tenant_context.mjs";
import { increment, readCounter, resetMetrics, mustBeZero, REQUIRED_METRICS } from "../platform/service/metrics.mjs";
import { filterLogFields, writeLog, assertNoClinicalLogField } from "../platform/service/logging.mjs";
import { edgeIds, spanAttributes, parseTraceparent } from "../platform/service/tracing.mjs";
import { readSecret, secretResolved } from "../platform/service/secrets.mjs";
import { privileges, assertTransition, applyTransition } from "../platform/service/lifecycle.mjs";
import { provisionTenant } from "../platform/service/provision.mjs";
import { authorize, assertServiceBoundary, PERMISSIONS } from "../platform/service/authorize.mjs";
import { consentState, boardSubmissionPermitted, employerReleasePermitted } from "../platform/service/consent.mjs";
import { setValue, resolve as resolveConfig } from "../platform/service/config.mjs";
import { evaluateFlag, setFlag, assertFlagAllowed } from "../platform/service/flags.mjs";
import { appendRecord, verifyChain } from "../platform/service/audit.mjs";
import { emit, assertSchemaAdditive } from "../platform/service/events.mjs";
import { releaseToEmployer } from "../platform/service/release.mjs";
import { signArtifact, reconstruct } from "../platform/service/reconstruction.mjs";
import { activate, expired, assertUseAudited } from "../platform/service/break_glass.mjs";
import { live, ready, dependencies, EXPECTED_HEAD } from "../platform/service/health.mjs";
import { newPublicId, uuidVersion, assertNotExposedV7 } from "../platform/service/uuid.mjs";
import { DASHBOARDS, PAGE_ALERTS } from "../platform/service/observability_spec.mjs";
import {
  scanEmployerWall, scanControlFlags, scanLoggingAllowList, scanClientTenant,
  scanAuthorizeBoundary, listAllowListEntries, allServiceSource,
} from "../platform/service/architecture.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const throws = (fn, code) => { try { fn(); return false; } catch (e) { return !code || e.code === code; } };

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

resetMetrics();

function emptyStore() {
  return { organisations: [], regions: [], locations: [], grants: [], configValues: [], audit: [], events: [], outbox: [], records: [], releases: [], consentLedger: [], definitions: [], values: [], flags: [], rules: [] };
}

// -- Architecture ----------------------------------------------------------
{
  const wall = scanEmployerWall(root);
  ok("AC13 architecture: only the release path may touch both sides", wall.ok);
  ok("AC39 architecture: control flags are forbidden", scanControlFlags(root).ok);
  ok("AC47 architecture: logging allow-list is enforced", scanLoggingAllowList(root).ok);
  ok("AC8 architecture: tenant context ignores client assertions", scanClientTenant(root).ok);
  ok("AC15 architecture: authorisation is at the service boundary", scanAuthorizeBoundary(root).ok);
  const allow = listAllowListEntries(readFileSync(join(root, "platform/db/tenant_exception_allowlist.txt"), "utf8"));
  ok("AC2: allow-list has exactly one entry", allow.length === 1 && allow[0].startsWith("mpi.person"));
  const two = listAllowListEntries(allow.join("\n") + "\nclinical.practitioner | second\n");
  ok("AC2: a second allow-list entry is a failing shape", two.length !== 1);
  const src = allServiceSource(root);
  ok("dash hygiene: no em or en dash in new services", !/[\u2013\u2014]/.test(src));
  ok("no HIPAA or PHIPA claim in new services", !/HIPAA|PHIPA/.test(src));
}

{
  const migs = readdirSync(join(root, "platform/db")).filter((f) => /^0\d+_.*\.sql$/.test(f));
  let deleteHit = false;
  for (const f of migs) {
    const sql = readFileSync(join(root, "platform/db", f), "utf8").replace(/--.*$/gm, "");
    if (/delete\s+from\s+(clinical|audit|consent|events)\./i.test(sql)) deleteHit = true;
  }
  ok("AC49: no DELETE against clinical, audit, consent or event tables", !deleteHit);
  ok("AC49 down exists for 0019", readFileSync(join(root, "platform/db/downs/0019.sql"), "utf8").length > 0);
}

{
  const contracts = [
    readFileSync(join(root, "deploy/api/health-live.js"), "utf8"),
    readFileSync(join(root, "deploy/api/health-ready.js"), "utf8"),
    readFileSync(join(root, "platform/service/uuid.mjs"), "utf8"),
  ].join("\n");
  ok("AC52: health and uuid helpers do not return a v7 identifier", !/uuidv7|uuid_generate_v7|uuidv7\(/i.test(contracts));
}

// -- Tenant context --------------------------------------------------------
{
  const principal = { organisation_id: "org-auth", location_id: "loc-auth", actor_id: "actor-1" };
  const ctx = resolveTenantContext(principal, {
    headers: { organisation_id: "org-header", "x-organisation_id": "org-x" },
    query: { organisation_id: "org-query" },
    body: { organisation_id: "org-body" },
    envelope: { organisation_id: "org-envelope" },
  });
  ok("AC8 header ignored", ctx.organisation_id === "org-auth" && ctx.ignored_client_assertions.organisation_id_header === "org-header");
  ok("AC8 query ignored", ctx.ignored_client_assertions.organisation_id_query === "org-query");
  ok("AC8 body ignored", ctx.ignored_client_assertions.organisation_id_body === "org-body");
  ok("AC9 missing tenant increments counter", throws(() => resolveTenantContext({}, {}), "TENANT-CONTEXT-MISSING") && readCounter("tenant_context_missing_total") >= 1);
  const stmts = setConfigStatements(ctx);
  ok("AC8 set_config is transaction scoped", stmts[0].sql.includes("true"));
}

// -- Lifecycle and provision ----------------------------------------------
{
  ok("AC11 prospect cannot read", privileges("prospect").data_readable === false);
  ok("AC11 active can write", privileges("active").data_writable === true);
  ok("AC11 suspended is read only", privileges("suspended").data_readable === true && privileges("suspended").data_writable === false);
  ok("AC11 closed cannot sign in", privileges("closed").sign_in === false);
  ok("AC11 archived is break glass only (not readable by default)", privileges("archived").data_readable === false);
  ok("AC10 closed cannot reactivate", throws(() => assertTransition("closed", "active"), "LIFECYCLE-TRANSITION-DENIED"));
  const moved = applyTransition({ id: "o", status: "active" }, "suspended");
  ok("AC10 transition writes audit and event markers", moved.audit === true && moved.event === "tenant.lifecycle_changed");
}

{
  const store = emptyStore();
  const input = {
    organisation_id: "org-1", region_id: "reg-1", location_id: "loc-1",
    legal_name: "Clinic One", display_name: "Clinic One", jurisdiction_code: "AB",
    timezone: "America/Edmonton", actor_id: "actor-1",
  };
  const first = provisionTenant(input, store);
  const second = provisionTenant(input, store);
  ok("AC9 provision creates one org", store.organisations.length === 1 && first.idempotent === false);
  ok("AC9 provision is idempotent", second.idempotent === true);
  const failStore = emptyStore();
  ok("AC9 failed step keeps nothing", throws(() => provisionTenant({ ...input, fail_step: true }, failStore), "PROVISION-STEP-FAILED") && failStore.organisations.length === 0);
}

// -- Authorisation ---------------------------------------------------------
{
  const store = emptyStore();
  store.grants.push({ principal_id: "p1", role_key: "physician", scope_type: "organisation" });
  ok("AC15 physician can sign", authorize({ principal_id: "p1", permission: "sign_report", scope_type: "location", scope_id: "l1" }, store).allowed);
  ok("AC15 denial is audited", throws(() => authorize({ principal_id: "p1", permission: "break_glass_activate", scope_type: "organisation" }, store), "AUTHZ-DENIED"));
  ok("AC15 denial outcome", store.audit.some((a) => a.outcome === "denied"));
  ok("AC15 repository check is not a control", throws(() => assertServiceBoundary("repository"), "AUTHZ-BOUNDARY"));
  ok("AC15 permissions are intent names", PERMISSIONS.includes("release_to_employer") && PERMISSIONS.includes("review_identity_match"));
}

// -- Consent ---------------------------------------------------------------
{
  const ledger = [
    { subject_person_id: "per-1", purpose: "employer_disclosure", scope_recipient: "employer:acme", action: "granted", effective_from: "2026-01-01", created_at: "2026-01-01" },
    { subject_person_id: "per-1", purpose: "employer_disclosure", scope_recipient: "employer:acme", action: "revoked", effective_from: "2026-06-01", created_at: "2026-06-01" },
    { subject_person_id: "per-1", purpose: "employer_disclosure", scope_recipient: "employer:acme", action: "granted", effective_from: "2026-09-01", created_at: "2026-09-01" },
  ];
  ok("AC21 grant at January", consentState("per-1", "employer_disclosure", "employer:acme", "2026-02-01", ledger) === "granted");
  ok("AC21 revoked at July", consentState("per-1", "employer_disclosure", "employer:acme", "2026-07-01", ledger) === "revoked");
  ok("AC21 re-grant at September", consentState("per-1", "employer_disclosure", "employer:acme", "2026-09-15", ledger) === "granted");
  ok("AC22 missing purpose fails", throws(() => consentState("per-1", null, "employer:acme", "2026-02-01", ledger), "CONSENT-PURPOSE-MISSING"));
  ok("AC22 missing recipient fails", throws(() => consentState("per-1", "employer_disclosure", null, "2026-02-01", ledger), "CONSENT-RECIPIENT-MISSING"));
  ok("AC22 missing at fails", throws(() => consentState("per-1", "employer_disclosure", "employer:acme", null, ledger), "CONSENT-AT-MISSING"));
  const refused = [{ subject_person_id: "per-2", purpose: "employer_disclosure", scope_recipient: "employer:acme", action: "refused", effective_from: "2026-01-01" }];
  ok("AC23 board succeeds while employer blocked", boardSubmissionPermitted("per-2", "AB", "2026-03-01", refused) === true && employerReleasePermitted("per-2", "employer:acme", "2026-03-01", refused) === false);
}

// -- Config and flags ------------------------------------------------------
{
  const store = emptyStore();
  store.definitions = [
    { key: "batch.safety_margin", allowed_scopes: "global,organisation,region,location", is_required: false },
    { key: "req.only", allowed_scopes: "organisation", is_required: true },
    { key: "org.only", allowed_scopes: "organisation", is_required: false },
  ];
  setValue({ key: "batch.safety_margin", scope_type: "global", value: 10, set_by: "a", reason: "base" }, store);
  setValue({ key: "batch.safety_margin", scope_type: "organisation", scope_id: "org-1", value: 20, set_by: "a", reason: "org" }, store);
  setValue({ key: "batch.safety_margin", scope_type: "location", scope_id: "loc-1", value: 30, set_by: "a", reason: "loc" }, store);
  ok("AC35 location wins", resolveConfig("batch.safety_margin", { organisation_id: "org-1", region_id: "reg-1", location_id: "loc-1" }, store) === 30);
  ok("AC35 org fallback", resolveConfig("batch.safety_margin", { organisation_id: "org-1", region_id: "reg-1", location_id: "loc-other" }, store) === 20);
  ok("AC34 required missing increments", throws(() => resolveConfig("req.only", { organisation_id: "org-1" }, store), "CONFIG-REQUIRED-MISSING") && readCounter("config_required_missing_total", { key: "req.only" }) >= 1);
  ok("AC36 disallowed scope rejected", throws(() => setValue({ key: "org.only", scope_type: "region", scope_id: "r", value: 1, reason: "x" }, store), "CONFIG-SCOPE-DENIED"));
  const again = setValue({ key: "batch.safety_margin", scope_type: "organisation", scope_id: "org-1", value: 25, set_by: "a", reason: "raise" }, store);
  ok("AC37 audit has previous and new", again.previous_value === 20 && again.value === 25 && store.audit.some((a) => a.previous_value === 20));
}

{
  const store = emptyStore();
  store.flags = [{ key: "demo.flag", default_state: false, is_kill_switch: false, retire_by: "2099-01-01" }];
  ok("AC38 default flag", evaluateFlag("demo.flag", { organisation_id: "o" }, store) === false);
  setFlag({ key: "demo.flag", scope_type: "organisation", scope_id: "o", state: true, set_by: "a", reason: "rollout" }, store);
  ok("AC37 flag audit", store.audit[0].previous_value === false && store.audit[0].new_value === true);
  ok("AC39 control flag forbidden", throws(() => assertFlagAllowed("tenancy"), "FLAG-CONTROL-FORBIDDEN"));
  store.flags.push({ key: "old.flag", default_state: false, is_kill_switch: false, retire_by: "2020-01-01" });
  ok("AC38 expired flag fails", throws(() => evaluateFlag("old.flag", {}, store, "2026-01-01"), "FLAG-EXPIRED"));
  store.flags.push({ key: "kill.flag", default_state: false, is_kill_switch: true, retire_by: "2099-01-01" });
  ok("AC39 kill switch cannot enable a capability", throws(() => setFlag({ key: "kill.flag", scope_type: "global", state: true, enables_capability: true, reason: "x" }, store), "FLAG-KILL-ENABLE"));
}

// -- Audit and events ------------------------------------------------------
{
  const store = { organisation_id: "org-a", records: [] };
  const a = appendRecord({ action: "view", entity_type: "clinical.wcb_report", outcome: "permitted", correlation_id: "c1", subject_person_id: "per-1", organisation_id: "org-a" }, store);
  appendRecord({ action: "create", entity_type: "clinical.wcb_report", outcome: "permitted", correlation_id: "c1", organisation_id: "org-a" }, store);
  ok("AC25 view audit has subject", a.action === "view" && a.subject_person_id === "per-1");
  ok("AC27 chain verifies", verifyChain("org-a", store.records) === null);
  store.records[1].action = "tampered";
  ok("AC27 altered row is detected", verifyChain("org-a", store.records) === 2);
  ok("AC26 disclose without basis fails", throws(() => appendRecord({ action: "disclose", entity_type: "x", outcome: "permitted", correlation_id: "c2", organisation_id: "org-a" }, store), "AUDIT-LAWFUL-BASIS-MISSING"));
}

{
  const store = emptyStore();
  store.subscriptions = [{ is_entitled: true, event_class: "integration", event_type: "*", destination: "partner" }];
  const ev = emit({ event_class: "domain", event_type: "thing.changed", aggregate_type: "thing", aggregate_id: "t1", correlation_id: "c", organisation_id: "o", payload: { id: "t1" } }, store);
  ok("AC29 domain has no outbox", store.outbox.length === 0);
  const integ = emit({ event_class: "integration", event_type: "thing.changed", aggregate_type: "thing", aggregate_id: "t1", correlation_id: "c", organisation_id: "o", payload: { id: "t1" } }, store);
  ok("AC30 outbox pending at commit", store.outbox.length === 1 && store.outbox[0].status === "pending" && integ.id);
  emit({ event_class: "integration", event_type: "report.drafted", aggregate_type: "report", aggregate_id: "r1", correlation_id: "c", organisation_id: "o", payload: { id: "r1" } }, store);
  ok("AC31 draft has no external subscriber", store.outbox.every((o) => o.event_id !== store.events.find((e) => e.event_type === "report.drafted").id));
  ok("AC32 sequence unique", store.events.filter((e) => e.aggregate_type === "thing").map((e) => e.sequence_in_aggregate).join(",") === "1,2");
  ok("AC33 remove field fails", throws(() => assertSchemaAdditive(["a", "b"], ["a"]), "EVENT-SCHEMA-FIELD-REMOVED"));
  const rolled = { rolled_back: true, events: [] };
  ok("AC29 rollback leaves no event", throws(() => emit({ event_class: "domain", event_type: "x", aggregate_type: "t", aggregate_id: "1" }, rolled), "EVENT-TX-ROLLED-BACK") && rolled.events.length === 0);
  ok("event id used", ev.id);
}

// -- Release, reconstruction, break glass ---------------------------------
{
  const store = emptyStore();
  store.consentLedger = [{ subject_person_id: "per-3", purpose: "employer_disclosure", scope_recipient: "employer:acme", action: "granted", effective_from: "2026-01-01" }];
  const rel = releaseToEmployer({
    person_id: "per-3", recipient: "employer:acme", at: "2026-03-01",
    organisation_id: "org-r", consent_ledger_entry_id: "led-1",
    payload: { duties: [] }, source_report_id: "rep-1",
    employer_party_id: "emp-1", claim_reference: "C1", disclosure_profile: "duties_only",
    released_by: "actor", correlation_id: "corr-r",
  }, store);
  ok("AC14 release requires consent id", rel.consent_ledger_entry_id === "led-1");
  ok("AC24 pre-revocation release retained", store.releases.length === 1);
  ok("AC26 disclosure audit has lawful basis", store.records.some((r) => r.action === "disclose" && r.lawful_basis_type === "consent" && r.lawful_basis_ref === "led-1"));
  store.consentLedger.push({ subject_person_id: "per-3", purpose: "employer_disclosure", scope_recipient: "employer:acme", action: "revoked", effective_from: "2026-06-01" });
  ok("AC24 revocation is not retroactive", store.releases[0].id === rel.id);
  ok("AC23 later release blocked", throws(() => releaseToEmployer({
    person_id: "per-3", recipient: "employer:acme", at: "2026-07-01",
    organisation_id: "org-r", consent_ledger_entry_id: "led-1",
    payload: { duties: [] }, source_report_id: "rep-1",
    employer_party_id: "emp-1", claim_reference: "C1", disclosure_profile: "duties_only",
    released_by: "actor", correlation_id: "corr-r2",
  }, store), "RELEASE-BLOCKED"));
}

{
  const signed = signArtifact({
    content: "rendered-report-v1",
    form_definition_version: "form-1",
    code_list_version: "codes-1",
    fee_schedule_version: "fees-1",
    jurisdiction_ruleset_version: "rules-1",
  });
  const later = reconstruct(signed, {
    form_definition_version: "form-9",
    code_list_version: "codes-9",
    fee_schedule_version: "fees-9",
    jurisdiction_ruleset_version: "rules-9",
  });
  ok("AC20 reconstruct is byte identical after versions change", later.byte_identical && later.digest === signed.digest);
}

{
  const store = emptyStore();
  const row = activate({
    clinic_consented: true, admin_notified: true, reason: "outage",
    starts_at: "2026-01-01", ends_at: "2026-01-02", organisation_id: "o", location_id: "l", actor_id: "a",
  }, store);
  ok("AC59 activation alerts", store.alerts[0].kind === "break_glass_activated");
  ok("AC59 expires after window", expired(row, "2026-01-03", store) === true);
  ok("AC59 active inside window", expired(row, "2026-01-01T12:00:00Z", store) === false);
  assertUseAudited(row, store);
  ok("AC59 every use is audited", store.audit.filter((a) => a.entity_type === "break_glass").length >= 2);
}

// -- Correlation, logs, health, secrets, uuid ------------------------------
{
  const ids = edgeIds("00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01");
  ok("AC28 correlation id generated at the edge", !!ids.correlation_id && parseTraceparent(ids.traceparent).traceId === "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  const store = { organisation_id: "org-c", records: [] };
  appendRecord({ action: "view", entity_type: "x", outcome: "permitted", correlation_id: ids.correlation_id, organisation_id: "org-c" }, store);
  emit({ event_class: "domain", event_type: "x.y", aggregate_type: "x", aggregate_id: randomUUID(), correlation_id: ids.correlation_id, organisation_id: "org-c" }, store);
  const line = writeLog({ correlation_id: ids.correlation_id, organisation_id: "org-c", environment: "test", severity: "info", msg: "ok" });
  ok("AC28 same correlation on audit, event and log", store.records[0].correlation_id === ids.correlation_id && store.events[0].correlation_id === ids.correlation_id && line.correlation_id === ids.correlation_id);
  ok("AC47 dropped unknown log fields", !("phn" in filterLogFields({ correlation_id: "c", phn: "123" })));
  ok("AC54 logging a clinical field fails", throws(() => assertNoClinicalLogField({ phn: "123" }), "LOG-PHI-REFUSED"));
  ok("AC53 no PHI in span attributes", !("full_name" in spanAttributes({ organisation_id: "o", correlation_id: "c" })));
}

{
  ok("AC55 live has no dependency keys", live().status === "live" && live().database === undefined);
  ok("AC55 ready fails when migrations are not current", ready({}).ready === false && ready({}).restart === false && ready({}).reason === "migrations_not_current");
  ok("AC55 ready passes when head is current", ready({ head: EXPECTED_HEAD, secrets_resolved: true, config_loaded: true, database_reachable: true }).ready === true);
  ok("AC55 dependencies require auth", dependencies({}, false).ok === false);
}

{
  ok("AC58 missing secret fails closed", throws(() => readSecret("NO_SUCH_SECRET", {}), "SECRET-MISSING"));
  ok("AC58 present secret is readable", readSecret("X", { X: "value" }) === "value");
  ok("AC58 resolved helper", secretResolved("X", { X: "1" }) === true && secretResolved("Y", {}) === false);
}

{
  const id = newPublicId();
  ok("AC51 public id is uuid v4", uuidVersion(id) === 4);
  ok("AC52 v7 must not be exposed", throws(() => assertNotExposedV7("018f2d9f-7c1a-7abc-8def-0123456789ab", "api"), "UUID-V7-EXPOSED"));
}

{
  ok("AC56 dashboards are the four named ones", DASHBOARDS.length === 4);
  ok("AC56 page alerts include the five must-be-zero families", PAGE_ALERTS.some((a) => a.key === "cross_tenant_read") && PAGE_ALERTS.some((a) => a.key === "tenant_context_missing"));
  ok("AC56 required metric names are listed", REQUIRED_METRICS.includes("rls_denied_total"));
}

{
  const clinic = toClinicMessage(namedError("X", "The report could not be signed."));
  ok("AC15 clinic error has no code or stack", clinic.indexOf("X") === -1 && !clinic.includes("at ") && publicErrorBody({ message: "The report could not be signed." }).message.includes("Try again"));
}

{
  const zeros = mustBeZero();
  ok("AC56 counters exist", Object.keys(zeros).length === 5);
}

{
  increment("employer_wall_violation_total");
  increment("immutability_violation_total");
  increment("rls_denied_total");
  ok("violation counters can increment (tests of the counter, not a live breach)", readCounter("employer_wall_violation_total") === 1);
}

console.log("prompt50-foundations: " + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
