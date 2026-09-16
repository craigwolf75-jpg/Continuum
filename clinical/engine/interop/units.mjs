/* Prompt 49 unit normalisation.

   Canonical units: kilograms, hours, metres. source_value and source_unit
   are retained on every converted value. An inexact conversion leaves the
   canonical value null, retains the source, and warns. Do not round.
   An unrecognised unit rejects the field. Never assume a default unit.
   Unit conversion never applies to a band.
   No em dashes or en dashes. */

const EXACT = {
  kg: { to: "kg", factor: 1 },
  kilogram: { to: "kg", factor: 1 },
  kilograms: { to: "kg", factor: 1 },
  g: { to: "kg", factor: 0.001 },
  gram: { to: "kg", factor: 0.001 },
  grams: { to: "kg", factor: 0.001 },
  h: { to: "h", factor: 1 },
  hr: { to: "h", factor: 1 },
  hour: { to: "h", factor: 1 },
  hours: { to: "h", factor: 1 },
  min: { to: "h", factor: 1 / 60 },
  minute: { to: "h", factor: 1 / 60 },
  minutes: { to: "h", factor: 1 / 60 },
  m: { to: "m", factor: 1 },
  metre: { to: "m", factor: 1 },
  metres: { to: "m", factor: 1 },
  meter: { to: "m", factor: 1 },
  meters: { to: "m", factor: 1 },
  cm: { to: "m", factor: 0.01 },
};

const INEXACT = new Set(["lb", "lbs", "pound", "pounds", "oz", "stone", "st"]);
const BAND_TOKENS = new Set(["limited", "light", "medium", "heavy", "25lb", "25 lb", "25 pound"]);

export function normaliseUnit(sourceValue, sourceUnit) {
  const unit = String(sourceUnit || "").trim().toLowerCase();
  const raw = sourceValue;
  if (sourceValue === null || sourceValue === undefined || sourceValue === "") {
    return { canonical: null, canonical_unit: null, source_value: raw, source_unit: sourceUnit, warning: null, rejected: false };
  }
  if (BAND_TOKENS.has(unit) || BAND_TOKENS.has(String(sourceValue).trim().toLowerCase())) {
    return {
      canonical: null,
      canonical_unit: null,
      source_value: raw,
      source_unit: sourceUnit,
      warning: {
        code: "UNIT-BAND-NOT-QUANTITY",
        message: "A band is not a quantity. Unit conversion was not applied.",
        retained_source_value: String(raw),
      },
      rejected: false,
      is_band: true,
    };
  }
  if (INEXACT.has(unit)) {
    return {
      canonical: null,
      canonical_unit: null,
      source_value: raw,
      source_unit: sourceUnit,
      warning: {
        code: "UNIT-INEXACT",
        message: "The conversion is inexact. The canonical value was left null and the source was retained. The value was not rounded.",
        retained_source_value: String(raw),
      },
      rejected: false,
    };
  }
  const rule = EXACT[unit];
  if (!rule) {
    return {
      canonical: null,
      canonical_unit: null,
      source_value: raw,
      source_unit: sourceUnit,
      warning: {
        code: "UNIT-UNRECOGNISED",
        message: "The unit is unrecognised. No default unit was assumed. The field is rejected.",
        retained_source_value: String(raw),
      },
      rejected: true,
    };
  }
  const n = Number(sourceValue);
  if (Number.isNaN(n)) {
    return {
      canonical: null,
      canonical_unit: null,
      source_value: raw,
      source_unit: sourceUnit,
      warning: {
        code: "UNIT-UNPARSEABLE",
        message: "The quantity could not be parsed. The source was retained.",
        retained_source_value: String(raw),
      },
      rejected: false,
    };
  }
  return {
    canonical: n * rule.factor,
    canonical_unit: rule.to,
    source_value: raw,
    source_unit: sourceUnit,
    warning: null,
    rejected: false,
  };
}

export function isLegacy25PoundLabel(sourceValue, sourceUnit) {
  const blob = (String(sourceValue || "") + " " + String(sourceUnit || "")).toLowerCase();
  return /\b25\s*(lb|lbs|pound|pounds)\b/.test(blob);
}
