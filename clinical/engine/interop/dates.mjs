/* Prompt 49 date and time normalisation.

   Storage is timestamptz. Never assume UTC unless the source guarantees it.
   A missing offset is unresolved: retain the source string, warn, leave
   the canonical value null. Do not assume the clinic timezone.
   A date-only value stays a date. Half-open intervals everywhere.
   No em dashes or en dashes. */

import { norm, isBlank } from "./util.mjs";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const WITH_OFFSET = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/i;

export function normaliseTemporal(sourceText, options) {
  const opts = options || {};
  const raw = sourceText === null || sourceText === undefined ? "" : String(sourceText);
  const text = norm(raw);
  if (isBlank(text)) {
    return {
      canonical: null,
      kind: "absent",
      source_timestamp_text: raw,
      source_timezone: null,
      warning: null,
    };
  }
  if (DATE_ONLY.test(text)) {
    return {
      canonical: text,
      kind: "date",
      source_timestamp_text: text,
      source_timezone: null,
      warning: null,
    };
  }
  if (WITH_OFFSET.test(text) || (opts.sourceGuaranteesUtc === true && /\dT\d/.test(text))) {
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) {
      return {
        canonical: null,
        kind: "unresolved",
        source_timestamp_text: text,
        source_timezone: null,
        warning: {
          code: "DATE-UNPARSEABLE",
          message: "The timestamp could not be parsed. The source text was retained.",
          retained_source_value: text,
        },
      };
    }
    const future = isFutureBeyondTolerance(parsed, opts.now, opts.futureToleranceMs);
    return {
      canonical: parsed.toISOString(),
      kind: "timestamptz",
      source_timestamp_text: text,
      source_timezone: offsetOf(text),
      warning: future ? {
        code: "DATE-FUTURE",
        message: "The clinical timestamp is beyond the configured future tolerance.",
        retained_source_value: text,
      } : null,
    };
  }
  return {
    canonical: null,
    kind: "unresolved",
    source_timestamp_text: text,
    source_timezone: null,
    warning: {
      code: "DATE-OFFSET-ABSENT",
      message: "The timestamp has no offset and the source does not guarantee one. The value is unresolved. UTC and clinic local were not assumed.",
      retained_source_value: text,
    },
  };
}

export function clinicLocalTime(instantIso, timezone) {
  if (!timezone) return { ok: false, reason: "TIMEZONE-MISSING" };
  return { ok: true, timezone, instant: instantIso };
}

export function halfOpenContains(start, end, at) {
  if (!start) return false;
  if (at < start) return false;
  if (end && at >= end) return false;
  return true;
}

function offsetOf(text) {
  if (/Z$/i.test(text)) return "Z";
  const m = text.match(/([+-]\d{2}:?\d{2})$/);
  return m ? m[1] : null;
}

function isFutureBeyondTolerance(parsed, now, toleranceMs) {
  const n = now ? new Date(now) : new Date();
  const tol = toleranceMs === undefined ? 24 * 60 * 60 * 1000 : Number(toleranceMs);
  return parsed.getTime() - n.getTime() > tol;
}
