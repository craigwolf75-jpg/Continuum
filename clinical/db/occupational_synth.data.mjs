/* Continuum Prompt 43a gate 3 plus Prompt 60 Section 2: the SYNTHETIC
   occupational fixture.

   DECIDED in Prompt 43a: the canonical 45 positions, 209 modified duties and 27 demand
   factors come ONLY from the canonical document, which is pending from Craig. This file
   is NOT that document. It is a small, clearly labeled synthetic fixture that exercises
   every duty match verdict path (safe, conditional, excluded, unmapped_demand) so Prompt
   43's acceptance criteria run green without a single fake canon row existing anywhere.

   Prompt 60 extends each position and duty with C1447 cognitive and psychosocial
   ratings, task descriptors, environment (noise, lighting only), screen and
   vigilance minutes, and two custom demand slots. Physical demands are unchanged.
   Intensity definitions are stored as retrieved. This file does not claim
   customer-facing board alignment. Section 8.2 stays with Craig.

   EVERY identifier is SYNTH prefixed and SYNTHETIC is true, so this dataset can never
   masquerade as canon: the publish guard in clinical/engine/occupational.mjs REFUSES to
   publish an employer view against a synthetic dataset. Proposed or synthetic data never
   becomes seeded or published without a separate sign off.

   Demand kinds: weight (kilograms the duty imposes), hours (hours the duty demands), or
   binary (the duty requires the capability or not). A demand of 0 or binary false means
   the duty rates the axis but does not stress it. No dashes anywhere. */

import {
  CUSTOM_DEMAND_SLOTS,
  cognitiveDemandSet,
  frequencyBandFromPercent,
} from "../engine/c1447_factors.mjs";

export const SYNTHETIC = true;
export const SOURCE = "SYNTHETIC FIXTURE, NOT the canonical occupational document (pending Craig)";

export const SYNTH_POSITION_COUNT = 6;
export const SYNTH_DUTY_COUNT = 13;

const RATER = { scored_by: "SYNTH-RATER-01", scored_on: "2026-09-01" };

function descriptors(partial) {
  return {
    driving: false,
    equipment_operation: false,
    tool_usage: false,
    direct_care_provision: false,
    unaccompanied_posting: false,
    heights: false,
    near_moving_equipment: false,
    ...(partial || {}),
  };
}

function customSlots(spec14, spec15) {
  return CUSTOM_DEMAND_SLOTS.map((slot, i) => {
    const spec = (i === 0 ? spec14 : spec15) || { source: "unscored" };
    const source = spec.source || "unscored";
    const frequency_percent = spec.frequency_percent != null ? spec.frequency_percent : null;
    return {
      slot: slot.slot,
      summary_extract: slot.summary_extract,
      detail_heading: slot.detail_heading,
      intensity: source === "unscored" ? null : (spec.intensity || null),
      frequency_percent,
      frequency_band: frequencyBandFromPercent(frequency_percent),
      not_daily: spec.not_daily === true,
      scored_by: spec.scored_by != null ? spec.scored_by : (source === "unscored" ? null : RATER.scored_by),
      scored_on: spec.scored_on != null ? spec.scored_on : (source === "unscored" ? null : RATER.scored_on),
      source,
    };
  });
}

function cognition(overrides, meta) {
  const base = {};
  for (let id = 1; id <= 13; id++) {
    base[id] = { intensity: "low", frequency_percent: 10, source: "tenant_authored", not_daily: false };
  }
  return cognitiveDemandSet({ ...base, ...(overrides || {}) }, meta || RATER);
}

function attach(duty, classification, extra) {
  return {
    ...duty,
    position_classification: classification,
    task_descriptors: extra.task_descriptors,
    environment: extra.environment,
    screen_minutes: extra.screen_minutes,
    continuous_vigilance_minutes: extra.continuous_vigilance_minutes,
    cognitive_demands: extra.cognitive_demands,
    custom_demand_slots: extra.custom_demand_slots,
  };
}

// A dozen positions across the eventual domains (security, cash, aviation, warehousing),
// each with duties whose demands are rated on the axes a supervisor cares about. Purely
// illustrative test data. Live count is 6 positions, 13 duties. Not 209.
export const SYNTH_POSITIONS = [
  { position_id: "SYNTH-POS-01", title: "Gatehouse Officer", position_classification: "risk_sensitive", duties: [
    attach(
      { duty_id: "SYNTH-DUTY-0101", duty_name: "Gatehouse monitoring", demands: [{ axis: "sitting", kind: "hours", required: 8 }, { axis: "overhead_reaching", kind: "binary", required: false }, { axis: "lifting_floor_to_waist", kind: "weight", required: 0 }] },
      "risk_sensitive",
      {
        task_descriptors: descriptors({}),
        environment: { noise: false, lighting: true },
        screen_minutes: 360,
        continuous_vigilance_minutes: 120,
        cognitive_demands: cognition({
          2: { intensity: "high", frequency_percent: 70, source: "tenant_authored" },
          4: { intensity: "moderate", frequency_percent: 40, source: "tenant_authored" },
          6: { intensity: "low", frequency_percent: 10, source: "tenant_authored" },
          7: { source: "unscored" },
        }),
        custom_demand_slots: customSlots(
          { intensity: "low", frequency_percent: 5, source: "tenant_authored" },
          { source: "unscored" }
        ),
      }
    ),
    attach(
      { duty_id: "SYNTH-DUTY-0102", duty_name: "Camera and access control", demands: [{ axis: "sitting", kind: "hours", required: 8 }, { axis: "overhead_reaching", kind: "binary", required: false }, { axis: "lifting_floor_to_waist", kind: "weight", required: 0 }] },
      "risk_sensitive",
      {
        task_descriptors: descriptors({}),
        environment: { noise: false, lighting: true },
        screen_minutes: 420,
        continuous_vigilance_minutes: 180,
        cognitive_demands: cognition({
          2: { intensity: "high", frequency_percent: 80, source: "tenant_authored" },
          5: { intensity: "moderate", frequency_percent: 25, source: "tenant_authored" },
        }),
        custom_demand_slots: customSlots(null, null),
      }
    ),
    attach(
      { duty_id: "SYNTH-DUTY-0103", duty_name: "Visitor log entry", demands: [{ axis: "sitting", kind: "hours", required: 4 }, { axis: "overhead_reaching", kind: "binary", required: false }, { axis: "lifting_floor_to_waist", kind: "weight", required: 0 }] },
      "risk_sensitive",
      {
        task_descriptors: descriptors({}),
        environment: { noise: false, lighting: false },
        screen_minutes: 60,
        continuous_vigilance_minutes: 30,
        cognitive_demands: cognition({
          2: { intensity: "low", frequency_percent: 5.5, source: "tenant_authored" },
          3: { intensity: "low", frequency_percent: 8, source: "tenant_authored" },
          6: { intensity: "low", frequency_percent: 5, source: "tenant_authored" },
          12: { intensity: "low", frequency_percent: 0, source: "tenant_authored" },
        }),
        custom_demand_slots: customSlots(null, null),
      }
    ),
  ] },
  { position_id: "SYNTH-POS-02", title: "Mobile Patrol", position_classification: "safety_sensitive", duties: [
    attach(
      { duty_id: "SYNTH-DUTY-0201", duty_name: "Yard foot patrol", demands: [{ axis: "walking", kind: "hours", required: 6 }] },
      "safety_sensitive",
      {
        task_descriptors: descriptors({ driving: true, unaccompanied_posting: true }),
        environment: { noise: true, lighting: null },
        screen_minutes: null,
        continuous_vigilance_minutes: 180,
        cognitive_demands: cognition({
          2: { intensity: "moderate", frequency_percent: 40, source: "tenant_authored" },
          5: { intensity: "moderate", frequency_percent: 30, source: "tenant_authored" },
          6: { intensity: "high", frequency_percent: 80, source: "tenant_authored" },
          9: { intensity: "moderate", frequency_percent: null, source: "tenant_authored" },
        }),
        custom_demand_slots: customSlots(null, null),
      }
    ),
    attach(
      { duty_id: "SYNTH-DUTY-0202", duty_name: "Perimeter climb inspection", demands: [{ axis: "climbing", kind: "binary", required: true }, { axis: "overhead_reaching", kind: "binary", required: true }] },
      "safety_sensitive",
      {
        task_descriptors: descriptors({ heights: true, unaccompanied_posting: true }),
        environment: { noise: true, lighting: null },
        screen_minutes: null,
        continuous_vigilance_minutes: 90,
        cognitive_demands: cognition({
          5: { intensity: "high", frequency_percent: 50, source: "tenant_authored" },
          6: { intensity: "high", frequency_percent: 70, source: "tenant_authored" },
        }),
        custom_demand_slots: customSlots(null, null),
      }
    ),
  ] },
  { position_id: "SYNTH-POS-03", title: "Warehouse Handler", position_classification: "safety_sensitive", duties: [
    attach(
      { duty_id: "SYNTH-DUTY-0301", duty_name: "Floor to waist stocking", demands: [{ axis: "lifting_floor_to_waist", kind: "weight", required: 18 }, { axis: "overhead_reaching", kind: "binary", required: false }] },
      "safety_sensitive",
      {
        task_descriptors: descriptors({ equipment_operation: true, tool_usage: true, near_moving_equipment: true }),
        environment: { noise: true, lighting: true },
        screen_minutes: null,
        continuous_vigilance_minutes: 40,
        cognitive_demands: cognition({
          3: { intensity: "moderate", frequency_percent: 35, source: "tenant_authored" },
          5: { intensity: "moderate", frequency_percent: 20, source: "tenant_authored" },
        }),
        custom_demand_slots: customSlots(null, null),
      }
    ),
    attach(
      { duty_id: "SYNTH-DUTY-0302", duty_name: "Light bin sorting", demands: [{ axis: "lifting_floor_to_waist", kind: "weight", required: 3 }, { axis: "overhead_reaching", kind: "binary", required: false }] },
      "safety_sensitive",
      {
        task_descriptors: descriptors({ tool_usage: true }),
        environment: { noise: false, lighting: false },
        screen_minutes: null,
        continuous_vigilance_minutes: 20,
        cognitive_demands: cognition({
          2: { intensity: "low", frequency_percent: 15, source: "tenant_authored" },
          3: { intensity: "moderate", frequency_percent: 20, source: "ai_drafted", scored_by: "SYNTH-AI-DRAFT", scored_on: "2026-09-02" },
          6: { intensity: "low", frequency_percent: 10, source: "tenant_authored" },
        }),
        custom_demand_slots: customSlots(null, { source: "unscored" }),
      }
    ),
    attach(
      { duty_id: "SYNTH-DUTY-0303", duty_name: "Overhead shelf loading", demands: [{ axis: "lifting_above_shoulder", kind: "weight", required: 12 }, { axis: "overhead_reaching", kind: "binary", required: true }] },
      "safety_sensitive",
      {
        task_descriptors: descriptors({ heights: true, near_moving_equipment: true, equipment_operation: true }),
        environment: { noise: true, lighting: true },
        screen_minutes: null,
        continuous_vigilance_minutes: 30,
        cognitive_demands: cognition({
          5: { intensity: "moderate", frequency_percent: 25, source: "tenant_authored" },
        }),
        custom_demand_slots: customSlots(null, null),
      }
    ),
  ] },
  { position_id: "SYNTH-POS-04", title: "Cash Room Clerk", position_classification: "decision_critical", duties: [
    attach(
      { duty_id: "SYNTH-DUTY-0401", duty_name: "Count and reconcile", demands: [{ axis: "sitting", kind: "hours", required: 7 }, { axis: "lifting_floor_to_waist", kind: "weight", required: 0 }] },
      "decision_critical",
      {
        task_descriptors: descriptors({}),
        environment: { noise: false, lighting: true },
        screen_minutes: 300,
        continuous_vigilance_minutes: 150,
        cognitive_demands: cognition({
          1: { intensity: "high", frequency_percent: 60, source: "tenant_authored" },
          2: { intensity: "high", frequency_percent: 70, source: "tenant_authored" },
          5: { intensity: "high", frequency_percent: 55, source: "tenant_authored" },
        }),
        custom_demand_slots: customSlots(null, null),
      }
    ),
    attach(
      { duty_id: "SYNTH-DUTY-0402", duty_name: "Coin bag transfer", demands: [{ axis: "lifting_floor_to_waist", kind: "weight", required: 9 }] },
      "decision_critical",
      {
        task_descriptors: descriptors({}),
        environment: { noise: false, lighting: false },
        screen_minutes: 0,
        continuous_vigilance_minutes: null,
        cognitive_demands: cognition({
          5: { intensity: "low", frequency_percent: 10, source: "tenant_authored" },
        }),
        custom_demand_slots: customSlots(null, null),
      }
    ),
  ] },
  { position_id: "SYNTH-POS-05", title: "Aviation Screener", position_classification: "safety_sensitive", duties: [
    attach(
      { duty_id: "SYNTH-DUTY-0501", duty_name: "Static screening station", demands: [{ axis: "standing", kind: "hours", required: 6 }, { axis: "overhead_reaching", kind: "binary", required: false }] },
      "safety_sensitive",
      {
        task_descriptors: descriptors({ equipment_operation: true, direct_care_provision: false }),
        environment: { noise: true, lighting: true },
        screen_minutes: 180,
        continuous_vigilance_minutes: 240,
        cognitive_demands: cognition({
          2: { intensity: "high", frequency_percent: 85, source: "tenant_authored" },
          4: { intensity: "high", frequency_percent: 70, source: "tenant_authored" },
          5: { intensity: "high", frequency_percent: 40, source: "tenant_authored" },
        }),
        custom_demand_slots: customSlots(null, null),
      }
    ),
    attach(
      { duty_id: "SYNTH-DUTY-0502", duty_name: "Bag lift to belt", demands: [{ axis: "lifting_waist_to_shoulder", kind: "weight", required: 14 }] },
      "safety_sensitive",
      {
        task_descriptors: descriptors({ near_moving_equipment: true, equipment_operation: true }),
        environment: { noise: true, lighting: true },
        screen_minutes: null,
        continuous_vigilance_minutes: 20,
        cognitive_demands: cognition({
          3: { intensity: "low", frequency_percent: 15, source: "tenant_authored" },
        }),
        custom_demand_slots: customSlots(null, null),
      }
    ),
  ] },
  { position_id: "SYNTH-POS-06", title: "Reception Desk", position_classification: "risk_sensitive", duties: [
    attach(
      { duty_id: "SYNTH-DUTY-0601", duty_name: "Front desk reception", demands: [{ axis: "sitting", kind: "hours", required: 8 }, { axis: "overhead_reaching", kind: "binary", required: false }, { axis: "lifting_floor_to_waist", kind: "weight", required: 0 }] },
      "risk_sensitive",
      {
        task_descriptors: descriptors({}),
        environment: { noise: false, lighting: true },
        screen_minutes: 240,
        continuous_vigilance_minutes: 60,
        cognitive_demands: cognition({
          2: { intensity: "moderate", frequency_percent: 40, source: "ai_drafted", scored_by: "SYNTH-AI-DRAFT", scored_on: "2026-09-02" },
          10: { intensity: "moderate", frequency_percent: 50, source: "tenant_authored" },
          13: { intensity: "moderate", frequency_percent: 60, source: "tenant_authored" },
        }),
        custom_demand_slots: customSlots(null, null),
      }
    ),
  ] },
];

export function allSynthDuties() {
  return SYNTH_POSITIONS.flatMap((p) => p.duties);
}
