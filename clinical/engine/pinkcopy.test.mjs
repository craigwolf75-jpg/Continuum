/* Continuum Prompt 43 Pink Copy suite (Section 3, criteria 3, 5). Reproduces the board's
   sample worker copy table structure, proves the Pink Copy is generated on completion
   before invoicing, and that Continuum never has an employer delivery channel. No dashes. */

import {
  pinkCopyTable, pinkCopy, canGeneratePinkCopy, employerDeliveryAllowed,
  DELIVERY_CHANNELS, TABLE_HEADERS, BAND_DISPLAY,
} from "./pinkcopy.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// The axis set from 9 - Sample Worker Copy.pdf, transcribed.
const SAMPLE_AXES = [
  { axis: "walking", capability: "able" }, { axis: "bending", capability: "able" },
  { axis: "sitting", capability: "able" }, { axis: "twisting", capability: "able" },
  { axis: "overhead_reaching", capability: "able" },
  { axis: "kneeling_squatting", capability: "unable" }, { axis: "climbing", capability: "unable" },
  { axis: "lifting_floor_to_waist", capability: "unable" }, { axis: "lifting_waist_to_shoulder", capability: "unable" },
  { axis: "reaching_above_right_shoulder", capability: "unable" },
  { axis: "standing", capability: "limited", quantity_kind: "hours", hours: 4 },
  { axis: "lifting_general", capability: "limited", quantity_kind: "weight", band: "HEAVY" },
  { axis: "driving", capability: "limited", quantity_kind: "hours", hours: 7 },
  { axis: "grasping_left", capability: "limited", modifiers: ["Prolonged", "Repetitive"] },
  { axis: "lifting_above_shoulder", capability: "limited", quantity_kind: "weight", band: "HEAVY" },
];

const table = pinkCopyTable(SAMPLE_AXES);

// -- the three column headers exactly as the board renders them -----------------------
ok("the headers are Able, Unable and Limited (approx.)", JSON.stringify(table.headers) === JSON.stringify(["Able", "Unable", "Limited (approx.)"]) && TABLE_HEADERS.length === 3);

// -- the Able column matches the sample -----------------------------------------------
ok("the Able column matches the sample worker copy", JSON.stringify(table.able) === JSON.stringify(["Walking", "Bending", "Sitting", "Twisting", "Overhead reaching"]));

// -- the Unable column matches the sample, with the board's own labels -----------------
ok("the Unable column matches the sample", JSON.stringify(table.unable) === JSON.stringify(["Kneeling/squatting", "Climbing", "Lifting - Floor to waist", "Lifting - Waist to shoulder", "Reaching - Above right shoulder"]));

// -- the Limited column carries hours, the derived band, and the grasping modifiers ----
ok("Limited shows hours axes as (N hrs)", table.limited.includes("Standing (4 hrs)") && table.limited.includes("Driving (7 hrs)"));
ok("Limited shows the derived weight band", table.limited.includes("Lifting (>20 kg / 44 lb)") && table.limited.includes("Lifting - Above shoulder (>20 kg / 44 lb)"));
ok("Limited shows the grasping modifiers", table.limited.includes("Grasping - Left (Prolonged, Repetitive)"));
ok("the derived band display covers all four bands", Object.keys(BAND_DISPLAY).length === 4 && BAND_DISPLAY.LIMITED === "5 kg / 11 lb");

// -- every axis lands in exactly one column -------------------------------------------
ok("every axis appears in exactly one column", table.able.length + table.unable.length + table.limited.length === SAMPLE_AXES.length);

// -- criterion 5: generated on completion, before invoicing ---------------------------
ok("criterion 5: a completed report generates a Pink Copy even before invoicing", canGeneratePinkCopy({ completed: true, invoiced: false }) === true);
ok("an incomplete report does not generate a Pink Copy", canGeneratePinkCopy({ completed: false }) === false);

// -- Continuum never sends the Pink Copy to an employer (Section 3, Section 7) ---------
ok("employer delivery is never allowed", employerDeliveryAllowed() === false);
ok("the only delivery channels are print and a worker controlled link", JSON.stringify(DELIVERY_CHANNELS) === JSON.stringify(["print", "worker-controlled-link"]));

// -- the full Pink Copy structure -----------------------------------------------------
const report = {
  completed: true, invoiced: false,
  date_of_injury: "1900-01-01", date_of_examination: "1900-01-01", claim_number: "7001234",
  worker_name: "PHAM, William", worker_date_of_birth: "1900-01-01", worker_address: "57483 45A Ave NW Edmonton AB T6M 0G8", worker_phone: "1-780-555-1067",
  billing_and_name: "A2145 - MCNAMARA, Howard", clinic: "Family Health Worker 44", clinic_phone: "1-780-555-1000 ext 1067",
  employer_name_and_location: "ABC Corp, Ft. McMurray AB", employer_phone: "1-780-555-1111 ext 1080",
  job_title: "Machine Operator", injury_kind: "Progressive Injury", injuries: "Left Ankle, Right Arm",
  time_missed: "Yes", work_status: "Hospitalized", hospitalized: true, modified_note: "Modified duties, up to 6 hours per day",
  axes: SAMPLE_AXES, estimated_pre_accident_date: "1900-05-20",
};
const pc = pinkCopy(report);
ok("the Pink Copy carries the worker home address, phone and date of birth (it is the worker's copy)", pc.worker.address.includes("Edmonton") && pc.worker.phone.includes("780") && pc.worker.date_of_birth === "1900-01-01");
ok("the Pink Copy carries the practitioner billing number and hospitalisation status", pc.practitioner.billing_and_name.includes("A2145") && pc.return_to_work.hospitalized === true);
ok("the Pink Copy header carries the claim number and both dates", pc.header.claim_number === "7001234" && pc.header.date_of_injury === "1900-01-01" && pc.header.date_of_examination === "1900-01-01");
ok("the Pink Copy carries the estimated pre accident date", pc.estimated_pre_accident_date === "1900-05-20");
ok("an incomplete report yields no Pink Copy", pinkCopy({ completed: false }) === null);
// criterion 3: the Pink Copy is independent of the employer profile (it is the worker's).
ok("criterion 3: the Pink Copy generates with no employer information at all", pinkCopy({ ...report, employer_name_and_location: null, employer_phone: null }) !== null);

console.log("\npink copy suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
