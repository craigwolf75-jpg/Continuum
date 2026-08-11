/* Continuum Prompt 43a gate 3: the occupational lookup and the publish guard.

   The employer duty match runs against a job profile from the occupational database. Until
   the canonical document arrives (pending Craig), the only dataset available is the
   SYNTHETIC fixture. This module ties the duty match to a dataset and enforces the gate 3
   rule structurally: a synthetic or proposed dataset can NEVER publish an employer view
   without an explicit override, so no invented canon row ever reaches an employer.

   Pure functions. No dashes anywhere. */

import { matchDuties } from "./dutymatch.mjs";

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();

// A dataset is synthetic if it is flagged SYNTHETIC or any position identifier is SYNTH
// prefixed. The canonical dataset carries neither.
export function isSyntheticDataset(dataset) {
  if (!dataset) return false;
  if (dataset.SYNTHETIC === true) return true;
  const positions = dataset.SYNTH_POSITIONS || dataset.positions || (Array.isArray(dataset) ? dataset : []);
  return positions.some((p) => /^SYNTH-/i.test(norm(p.position_id)));
}

// The publish guard (gate 3): refuse to publish an employer view against a synthetic or
// proposed dataset unless explicitly allowed (tests only). A real publish uses the
// canonical dataset. Throws so a synthetic publish can never slip through silently.
export function assertCanonicalForPublish(dataset, opts = {}) {
  if (isSyntheticDataset(dataset) && !opts.allowSynthetic) {
    const e = new Error("Refusing to publish an employer view against a synthetic occupational dataset. The canonical document is required (Prompt 43a gate 3).");
    e.code = "SYNTHETIC-NOT-AUTHORIZED";
    throw e;
  }
  return true;
}

// Find a worker's job profile by title (case insensitive). Returns the position or null.
export function findJobProfile(positions, jobTitle) {
  const t = norm(jobTitle).toLowerCase();
  return (positions || []).find((p) => norm(p.title).toLowerCase() === t) || null;
}

// Publish the duty match for a worker against a dataset. With no profile for the worker's
// title, publish nothing and route to the coordinator (criterion 3, never guess duties).
// Otherwise run the duty match against the profile's duties. The synthetic guard runs
// before any match, so a synthetic publish is refused unless allowSynthetic is set.
export function publishDutyMatch(dataset, jobTitle, restrictionByAxis, opts = {}) {
  assertCanonicalForPublish(dataset, opts);
  const positions = dataset.SYNTH_POSITIONS || dataset.positions || (Array.isArray(dataset) ? dataset : []);
  const profile = findJobProfile(positions, jobTitle);
  if (!profile) {
    return {
      published: false, reason: "no-job-profile",
      message: "The employer has no job profile for the title " + JSON.stringify(norm(jobTitle)) + ". Nothing is published; route to the coordinator.",
      lines: [],
    };
  }
  return { ...matchDuties(profile.duties, restrictionByAxis), position_id: profile.position_id };
}
