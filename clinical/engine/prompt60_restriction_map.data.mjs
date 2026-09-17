/* Continuum Prompt 60 Section 4.3: explicit restriction-to-demand mapping.

   CONFIGURATION, not comparison rules hardcoded inside matchDuty. Each
   restriction code declares which demand factors it tests and the comparison
   rule tokens the match engine interprets.

   graduated_hours and scheduled_rest_breaks do not exclude duties. They
   constrain the assignment (Section 5). A code with no mapping entry is a
   loud fail to the coordinator.

   Factor ids are C1447 numbers. Existing environment fields referenced:
   clinical.functional_environment.noise and .lighting. glare and scents are
   not first-class columns (do not invent them). Vibration lives on
   functional_grasping, not this map.

   No dashes (em or en) anywhere. */

export const PROMPT60_RESTRICTION_MAP = Object.freeze({
  no_lone_work: {
    duty_exclude: true,
    assignment_only: false,
    tests: [
      { kind: "factor_intensity", factor_id: 6, exclude_when: ["moderate", "high"] },
      { kind: "unaccompanied_posting", exclude_when: true },
    ],
  },
  no_safety_critical_decision_making: {
    duty_exclude: true,
    assignment_only: false,
    tests: [
      { kind: "factor_intensity", factor_id: 5, exclude_when: ["high"] },
      { kind: "position_classification", exclude_when: ["safety_sensitive", "decision_critical"] },
    ],
  },
  single_task_only_no_concurrent_demand: {
    duty_exclude: true,
    assignment_only: false,
    tests: [
      { kind: "factor_intensity", factor_id: 3, exclude_when: ["moderate", "high"] },
    ],
  },
  max_continuous_vigilance_minutes: {
    duty_exclude: true,
    assignment_only: false,
    tests: [
      { kind: "recorded_minutes", attribute: "continuous_vigilance_minutes", also_factors: [2, 4] },
    ],
  },
  max_continuous_screen_minutes: {
    duty_exclude: true,
    assignment_only: false,
    tests: [
      { kind: "recorded_minutes", attribute: "screen_minutes" },
    ],
  },
  low_noise_environment_required: {
    duty_exclude: true,
    assignment_only: false,
    tests: [
      { kind: "environment_field", field: "noise", also_factor_id: 9 },
    ],
  },
  reduced_light_or_glare_required: {
    duty_exclude: true,
    assignment_only: false,
    tests: [
      { kind: "environment_field", field: "lighting", unrecorded_companion: "glare", also_factor_id: 9 },
    ],
  },
  no_night_or_rotating_shift: {
    duty_exclude: false,
    assignment_only: true,
    tests: [
      { kind: "assignment_shift", exclude_when: ["night", "rotating"] },
    ],
  },
  supervised_or_partnered_only: {
    duty_exclude: true,
    assignment_only: false,
    tests: [
      { kind: "unaccompanied_posting", exclude_when: true },
      { kind: "factor_intensity", factor_id: 6, exclude_when: [] },
    ],
  },
  no_driving_as_duty: {
    duty_exclude: true,
    assignment_only: false,
    tests: [
      { kind: "task_descriptor", descriptor: "driving" },
    ],
  },
  no_powered_mobile_equipment: {
    duty_exclude: true,
    assignment_only: false,
    tests: [
      { kind: "task_descriptor", descriptor: "equipment_operation" },
    ],
  },
  no_work_at_heights: {
    duty_exclude: true,
    assignment_only: false,
    tests: [
      { kind: "task_descriptor", descriptor: "heights" },
    ],
  },
  no_work_near_moving_equipment: {
    duty_exclude: true,
    assignment_only: false,
    tests: [
      { kind: "task_descriptor", descriptor: "near_moving_equipment" },
    ],
  },
  graduated_hours: {
    duty_exclude: false,
    assignment_only: true,
    tests: [],
  },
  scheduled_rest_breaks: {
    duty_exclude: false,
    assignment_only: true,
    tests: [],
  },
});

export function mappingFor(code) {
  if (!Object.prototype.hasOwnProperty.call(PROMPT60_RESTRICTION_MAP, code)) return null;
  return PROMPT60_RESTRICTION_MAP[code];
}
