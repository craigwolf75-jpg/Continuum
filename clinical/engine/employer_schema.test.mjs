/* Continuum Prompt 43 employer wall suite (criteria 1 and 2). Runs the build failing
   schema test against the real 015 employer migration: no banned or raw measurement
   column may appear in the employer schema, and a published payload may carry no raw
   measurement. No dashes anywhere. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  employerColumnNames, bannedColumnsInSchema, rawMeasurementInPayload, employerCopyLint,
  BANNED_TERMS, RAW_MEASUREMENT_TERMS,
} from "./employer_schema.mjs";

const MIGRATION = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "db", "015_migration_employer_view.sql"), "utf8");

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// -- the columns are parsed from the real migration -----------------------------------
const cols = employerColumnNames(MIGRATION);
ok("the employer schema columns are parsed", cols.includes("case_ref") && cols.includes("verdict") && cols.includes("worker_display_name"));
ok("the parse excludes constraint and index lines", !cols.includes("check") && !cols.includes("references") && !cols.includes("create"));

// -- criterion 1: the real employer schema has NO banned column -----------------------
ok("criterion 1: the shipped employer migration carries no banned column", bannedColumnsInSchema(MIGRATION).length === 0);

// -- criterion 1: a banned column would fail the build --------------------------------
ok("a diagnosis column fails the schema test", bannedColumnsInSchema("create table employer.x (\n  id uuid,\n  diagnosis_code varchar(10)\n);").some((b) => b.banned_term === "diagnosis"));
ok("a pain score column fails", bannedColumnsInSchema("create table employer.x (\n  worker_pain_score int\n);").some((b) => b.banned_term === "pain"));
ok("a raw measurement column fails", bannedColumnsInSchema("create table employer.x (\n  measured_weight_kg numeric\n);").some((b) => b.banned_term === "measured_weight_kg"));
ok("a banned column in a NON employer schema is ignored (scope is the employer schema)", bannedColumnsInSchema("create table clinical.functional_axis_value (\n  measured_weight_kg numeric\n);").length === 0);

// -- criterion 2: a published payload carries no raw measurement -----------------------
const cleanPayload = {
  worker_display_name: "W. Pham", job_title: "Machine Operator", work_status: "fit_with_restrictions",
  measurement_version: 3, hours_per_day: 6,
  duties: [{ duty_name: "Gatehouse monitoring", verdict: "safe" }, { duty_name: "Overhead crane", verdict: "excluded", excluded_because: "requires above shoulder reaching" }],
};
ok("criterion 2: a clean employer payload has no raw measurement", rawMeasurementInPayload(cleanPayload).length === 0);
ok("criterion 2: a payload with measured_weight_kg is caught structurally", rawMeasurementInPayload({ ...cleanPayload, axis: { measured_weight_kg: 8 } }).some((h) => h.banned_term === "measured_weight_kg"));
ok("a nested diagnosis key is caught anywhere in the payload", rawMeasurementInPayload({ a: { b: [{ diagnosis: "x" }] } }).some((h) => h.banned_term === "diagnosis"));

// -- the employer copy lint (0A.2) ----------------------------------------------------
ok("employer copy naming a diagnosis or medication is flagged", employerCopyLint("no lifting due to medication side effects and diagnosis").length === 2);
ok("functional employer copy is clean", employerCopyLint("Safe now: gatehouse and camera monitoring. Not suitable: overhead crane.").length === 0);
ok("the banned vocabulary is the eight Section 0A.2 terms", BANNED_TERMS.length === 8 && BANNED_TERMS.includes("narrative"));
ok("the raw measurement terms include the Prompt 39 columns", RAW_MEASUREMENT_TERMS.includes("measured_weight_kg") && RAW_MEASUREMENT_TERMS.includes("measured_hours"));

console.log("\nemployer wall suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
