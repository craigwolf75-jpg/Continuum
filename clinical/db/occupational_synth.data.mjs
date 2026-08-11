/* Continuum Prompt 43a gate 3: the SYNTHETIC occupational fixture.

   DECIDED in Prompt 43a: the canonical 45 positions, 209 modified duties and 27 demand
   factors come ONLY from the canonical document, which is pending from Craig. This file
   is NOT that document. It is a small, clearly labeled synthetic fixture that exercises
   every duty match verdict path (safe, conditional, excluded, unmapped_demand) so Prompt
   43's acceptance criteria run green without a single fake canon row existing anywhere.

   EVERY identifier is SYNTH prefixed and SYNTHETIC is true, so this dataset can never
   masquerade as canon: the publish guard in clinical/engine/occupational.mjs REFUSES to
   publish an employer view against a synthetic dataset. Proposed or synthetic data never
   becomes seeded or published without a separate sign off.

   Demand kinds: weight (kilograms the duty imposes), hours (hours the duty demands), or
   binary (the duty requires the capability or not). A demand of 0 or binary false means
   the duty rates the axis but does not stress it. No dashes anywhere. */

export const SYNTHETIC = true;
export const SOURCE = "SYNTHETIC FIXTURE, NOT the canonical occupational document (pending Craig)";

// A dozen positions across the eventual domains (security, cash, aviation, warehousing),
// each with duties whose demands are rated on the axes a supervisor cares about. Purely
// illustrative test data.
export const SYNTH_POSITIONS = [
  { position_id: "SYNTH-POS-01", title: "Gatehouse Officer", duties: [
    { duty_id: "SYNTH-DUTY-0101", duty_name: "Gatehouse monitoring", demands: [{ axis: "sitting", kind: "hours", required: 8 }, { axis: "overhead_reaching", kind: "binary", required: false }, { axis: "lifting_floor_to_waist", kind: "weight", required: 0 }] },
    { duty_id: "SYNTH-DUTY-0102", duty_name: "Camera and access control", demands: [{ axis: "sitting", kind: "hours", required: 8 }, { axis: "overhead_reaching", kind: "binary", required: false }, { axis: "lifting_floor_to_waist", kind: "weight", required: 0 }] },
    { duty_id: "SYNTH-DUTY-0103", duty_name: "Visitor log entry", demands: [{ axis: "sitting", kind: "hours", required: 4 }, { axis: "overhead_reaching", kind: "binary", required: false }, { axis: "lifting_floor_to_waist", kind: "weight", required: 0 }] },
  ] },
  { position_id: "SYNTH-POS-02", title: "Mobile Patrol", duties: [
    { duty_id: "SYNTH-DUTY-0201", duty_name: "Yard foot patrol", demands: [{ axis: "walking", kind: "hours", required: 6 }] },
    { duty_id: "SYNTH-DUTY-0202", duty_name: "Perimeter climb inspection", demands: [{ axis: "climbing", kind: "binary", required: true }, { axis: "overhead_reaching", kind: "binary", required: true }] },
  ] },
  { position_id: "SYNTH-POS-03", title: "Warehouse Handler", duties: [
    { duty_id: "SYNTH-DUTY-0301", duty_name: "Floor to waist stocking", demands: [{ axis: "lifting_floor_to_waist", kind: "weight", required: 18 }, { axis: "overhead_reaching", kind: "binary", required: false }] },
    { duty_id: "SYNTH-DUTY-0302", duty_name: "Light bin sorting", demands: [{ axis: "lifting_floor_to_waist", kind: "weight", required: 3 }, { axis: "overhead_reaching", kind: "binary", required: false }] },
    { duty_id: "SYNTH-DUTY-0303", duty_name: "Overhead shelf loading", demands: [{ axis: "lifting_above_shoulder", kind: "weight", required: 12 }, { axis: "overhead_reaching", kind: "binary", required: true }] },
  ] },
  { position_id: "SYNTH-POS-04", title: "Cash Room Clerk", duties: [
    { duty_id: "SYNTH-DUTY-0401", duty_name: "Count and reconcile", demands: [{ axis: "sitting", kind: "hours", required: 7 }, { axis: "lifting_floor_to_waist", kind: "weight", required: 0 }] },
    { duty_id: "SYNTH-DUTY-0402", duty_name: "Coin bag transfer", demands: [{ axis: "lifting_floor_to_waist", kind: "weight", required: 9 }] },
  ] },
  { position_id: "SYNTH-POS-05", title: "Aviation Screener", duties: [
    { duty_id: "SYNTH-DUTY-0501", duty_name: "Static screening station", demands: [{ axis: "standing", kind: "hours", required: 6 }, { axis: "overhead_reaching", kind: "binary", required: false }] },
    { duty_id: "SYNTH-DUTY-0502", duty_name: "Bag lift to belt", demands: [{ axis: "lifting_waist_to_shoulder", kind: "weight", required: 14 }] },
  ] },
  { position_id: "SYNTH-POS-06", title: "Reception Desk", duties: [
    { duty_id: "SYNTH-DUTY-0601", duty_name: "Front desk reception", demands: [{ axis: "sitting", kind: "hours", required: 8 }, { axis: "overhead_reaching", kind: "binary", required: false }, { axis: "lifting_floor_to_waist", kind: "weight", required: 0 }] },
  ] },
];
