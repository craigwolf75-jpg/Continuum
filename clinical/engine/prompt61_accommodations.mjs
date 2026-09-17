/* Continuum Prompt 61 Section 2.4 only: C1447 accommodations vocabulary.

   Prompt 60 already built Sections 2.1 to 2.3. This file does not rebuild
   the thirteen factor list. It stores the coordinator vocabulary the
   C1447 form uses: workplace level and task level. Not a customer-facing
   board alignment claim. Section 10.3 stays with Craig.

   SYNTH only. No dashes (em or en) anywhere. */

export const C1447_WORKPLACE_ACCOMMODATIONS = Object.freeze([
  "environment",
  "location",
  "colleagues",
  "populations",
  "other",
]);

export const C1447_TASK_ACCOMMODATIONS = Object.freeze([
  "caseload_reduction",
  "extra_time_to_complete_tasks",
  "written_instructions",
  "regular_rest_breaks",
  "use_of_external_aids",
]);

export function recordAccommodation(level, kind, note) {
  const workplace = C1447_WORKPLACE_ACCOMMODATIONS.includes(kind);
  const task = C1447_TASK_ACCOMMODATIONS.includes(kind);
  if (level === "workplace" && !workplace) {
    return { ok: false, reason: "unknown_workplace_accommodation" };
  }
  if (level === "task" && !task) {
    return { ok: false, reason: "unknown_task_accommodation" };
  }
  if (level !== "workplace" && level !== "task") {
    return { ok: false, reason: "unknown_accommodation_level" };
  }
  return {
    ok: true,
    level,
    kind,
    note: note != null && String(note).trim() !== "" ? String(note) : null,
    board_alignment_claimed: false,
  };
}
