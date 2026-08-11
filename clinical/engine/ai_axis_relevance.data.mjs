/* Continuum Prompt 44, AI-04 axis relevance data. AI-04 is DELIBERATELY NOT A MODEL (Section
   2.1): it maps a part of body and nature of injury to the set of functional axes to OPEN, as
   a deterministic, explainable, testable table. It proposes WHICH axes to open, never a
   capability value or a quantity (Section 0A.2, Section 7).

   FUNCTIONAL_AXES is the full functional axis vocabulary (the board's per axis restriction
   set, transcribed from the worker copy labels). An unmapped body region opens ALL of them,
   which is safe and slow, never a guess (Section 2.1). This vocabulary must stay aligned with
   the axis map configuration the measurement model resolves per form (measurement.mjs
   resolveAxes); it is the union of what any form can open.

   AXIS_RELEVANCE is a STARTER map. The clinical mapping of part and nature to the relevant
   axis subset is a clinical deliverable and must be signed off by Hannah / clinical before it
   narrows anything in production (the same discipline as the occupational dataset waiting on
   Craig). Until then the map holds only a few uncontroversial mechanical entries, and every
   unmapped case opens all axes. Nothing here narrows a real case without sign off.

   The keys use the board code list values for part of body and nature of injury (seeded in
   migration 002). The values below are illustrative placeholders pending the real code list
   values and the clinical mapping; they are matched case insensitively and any miss falls
   through to all axes. No dashes anywhere. */

// The full functional axis vocabulary (20 axes, the board worker copy labels).
export const FUNCTIONAL_AXES = Object.freeze([
  "walking", "bending", "sitting", "twisting", "standing", "driving",
  "overhead_reaching", "kneeling_squatting", "climbing", "pushing_pulling",
  "lifting_general", "lifting_floor_to_waist", "lifting_waist_to_shoulder", "lifting_above_shoulder",
  "reaching_above_right_shoulder", "reaching_below_right_shoulder",
  "reaching_above_left_shoulder", "reaching_below_left_shoulder",
  "grasping_left", "grasping_right",
]);

// STARTER map, pending clinical sign off. Each rule: a part of body, an optional nature of
// injury (null matches any nature for that part), and the axes to open. Kept intentionally
// small and uncontroversial; the full clinical map is a signed off deliverable. A rule NEVER
// carries a capability or a quantity, only axis names (enforced at load and at call).
export const AXIS_RELEVANCE = Object.freeze([
  {
    part_of_body: "shoulder",
    nature_of_injury: null,
    axes: ["overhead_reaching", "lifting_above_shoulder", "lifting_waist_to_shoulder",
      "reaching_above_right_shoulder", "reaching_above_left_shoulder",
      "reaching_below_right_shoulder", "reaching_below_left_shoulder", "pushing_pulling"],
  },
  {
    part_of_body: "low back",
    nature_of_injury: null,
    axes: ["bending", "twisting", "lifting_floor_to_waist", "lifting_general",
      "sitting", "standing", "walking", "pushing_pulling"],
  },
  {
    part_of_body: "hand",
    nature_of_injury: null,
    axes: ["grasping_left", "grasping_right"],
  },
  {
    part_of_body: "knee",
    nature_of_injury: null,
    axes: ["kneeling_squatting", "climbing", "walking", "standing", "driving"],
  },
]);

// Provenance of this table for the reasoning trail: it is a signed off clinical config, not a
// model, and it is a STARTER pending the full clinical mapping.
export const AXIS_RELEVANCE_STATUS = Object.freeze({
  source: "deterministic-config-table",
  clinically_signed_off: false,
  note: "Starter map. Unmapped part or nature opens all axes. Full clinical mapping pending Hannah / clinical sign off.",
});
