/* Continuum Prompt 43: the Pink Copy (Section 3). The board mandated worker copy of the
   physician's report, reproduced from the board's own rendering in 9 - Sample Worker
   Copy.pdf: a header (date of injury, date of examination, claim number), then Worker,
   Practitioner, Employer, Accident, Injury and Return to Work blocks, then the three
   column table headed Able / Unable / Limited (approx.), then the estimated date to
   perform pre accident work.

   This is the OTHER artifact, not the employer view. It legitimately carries the per axis
   restriction values with hours and weight bands, the worker's home address and phone,
   hospitalisation status and the practitioner's billing number: it is the worker's own
   copy, which the worker chooses to hand to the employer. Continuum never sends it to an
   employer (Section 3, Section 7); the lawful channel is the worker handing it over.

   The Limited column shows the DERIVED band (Prompt 39), which is why the board heads it
   "approx.": a measured value is rounded down to a band. Pure functions. No dashes. */

// The board's own axis labels, transcribed from the sample worker copy.
const PINK_LABEL = {
  walking: "Walking", bending: "Bending", sitting: "Sitting", twisting: "Twisting",
  standing: "Standing", driving: "Driving", overhead_reaching: "Overhead reaching",
  kneeling_squatting: "Kneeling/squatting", climbing: "Climbing", pushing_pulling: "Pushing/pulling",
  lifting_general: "Lifting", lifting_floor_to_waist: "Lifting - Floor to waist",
  lifting_waist_to_shoulder: "Lifting - Waist to shoulder", lifting_above_shoulder: "Lifting - Above shoulder",
  reaching_above_right_shoulder: "Reaching - Above right shoulder", reaching_below_right_shoulder: "Reaching - Below right shoulder",
  reaching_above_left_shoulder: "Reaching - Above left shoulder", reaching_below_left_shoulder: "Reaching - Below left shoulder",
  grasping_left: "Grasping - Left", grasping_right: "Grasping - Right",
};
const pinkLabel = (axis) => PINK_LABEL[axis] || String(axis || "").replace(/_/g, " ");

// The board weight bands as the worker copy renders them (kg and lb), the derived band
// from Prompt 39. HEAVY is the open top band, shown as over 20 kg.
export const BAND_DISPLAY = {
  LIMITED: "5 kg / 11 lb", LIGHT: "10 kg / 22 lb", MEDIUM: "20 kg / 44 lb", HEAVY: ">20 kg / 44 lb",
};

export const TABLE_HEADERS = ["Able", "Unable", "Limited (approx.)"];

// The parenthetical the Limited column appends: hours, or the weight band, or the
// grasping modifiers, exactly as the sample renders them.
function limitedSuffix(a) {
  if (a.quantity_kind === "hours" && a.hours !== null && a.hours !== undefined) return " (" + a.hours + " hrs)";
  if (a.quantity_kind === "weight" && a.band && BAND_DISPLAY[a.band]) return " (" + BAND_DISPLAY[a.band] + ")";
  if (Array.isArray(a.modifiers) && a.modifiers.length) return " (" + a.modifiers.join(", ") + ")";
  return "";
}

// Build the three column Able / Unable / Limited table. Each axis lands in exactly one
// column by its capability; a Limited axis carries its band or hours.
export function pinkCopyTable(axes) {
  const able = [], unable = [], limited = [];
  for (const a of axes || []) {
    const label = pinkLabel(a.axis);
    if (a.capability === "able") able.push(label);
    else if (a.capability === "unable") unable.push(label);
    else if (a.capability === "limited" || a.capability === "limited_to") limited.push(label + limitedSuffix(a));
  }
  return { headers: TABLE_HEADERS, able, unable, limited };
}

// The Pink Copy is generated on report completion, before invoicing is complete (Section
// 3, criterion 5). Invoicing status is irrelevant to whether it can be produced.
export function canGeneratePinkCopy(report) {
  return Boolean(report && report.completed === true);
}

// Continuum never sends the Pink Copy to an employer (Section 3, Section 7). The only
// channels are print and a secure link the worker controls.
export const DELIVERY_CHANNELS = ["print", "worker-controlled-link"];
export function employerDeliveryAllowed() { return false; }

// Build the full Pink Copy structure from a completed report. Produces the board's block
// layout; rendering to PDF or HTML is a separate concern. Returns null when the report is
// not yet complete.
export function pinkCopy(report) {
  if (!canGeneratePinkCopy(report)) return null;
  const r = report;
  return {
    title: "PHYSICIAN'S REPORT WORKER COPY",
    header: { date_of_injury: r.date_of_injury, date_of_examination: r.date_of_examination, claim_number: r.claim_number },
    worker: { name: r.worker_name, date_of_birth: r.worker_date_of_birth, address: r.worker_address, phone: r.worker_phone },
    practitioner: { billing_and_name: r.billing_and_name, clinic: r.clinic, clinic_phone: r.clinic_phone },
    employer: { name_and_location: r.employer_name_and_location, phone: r.employer_phone },
    accident: { job_title: r.job_title, date_of_injury: r.date_of_injury, kind: r.injury_kind },
    injury: { injuries: r.injuries },
    return_to_work: { time_missed: r.time_missed, work_status: r.work_status, hospitalized: r.hospitalized, modified_note: r.modified_note },
    table: pinkCopyTable(r.axes),
    estimated_pre_accident_date: r.estimated_pre_accident_date,
    delivery_channels: DELIVERY_CHANNELS,
  };
}
