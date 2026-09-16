/* Prompt 50 Section 11.3. JSON logs with a field allow-list. Unknown fields
   are dropped. No em dashes or en dashes anywhere. */

export const LOG_ALLOW_LIST = Object.freeze([
  "correlation_id",
  "organisation_id",
  "location_id",
  "environment",
  "severity",
  "event",
  "action",
  "outcome",
  "error_class",
  "permission",
  "route",
  "status",
  "statement_name",
  "msg",
]);

const CLINICAL_FIELD = /^(phn|pain|diagnosis|medication|narrative|finding|measured_|body_part|injury_type|full_name|date_of_birth|email|phone)$/i;

export function filterLogFields(input) {
  const src = input && typeof input === "object" ? input : {};
  const out = {};
  for (const key of LOG_ALLOW_LIST) {
    if (src[key] !== undefined) out[key] = src[key];
  }
  return out;
}

export function assertNoClinicalLogField(input) {
  const src = input && typeof input === "object" ? input : {};
  for (const key of Object.keys(src)) {
    if (CLINICAL_FIELD.test(key)) {
      const e = new Error("logging refused a clinical or person field");
      e.code = "LOG-PHI-REFUSED";
      e.field = key;
      throw e;
    }
  }
  return true;
}

export function writeLog(input, sink) {
  assertNoClinicalLogField(input);
  const line = filterLogFields(input);
  if (!line.correlation_id || !line.environment || !line.severity) {
    const e = new Error("every log line needs correlation_id, environment and severity");
    e.code = "LOG-REQUIRED-FIELDS";
    throw e;
  }
  const payload = JSON.stringify(line);
  if (typeof sink === "function") sink(payload);
  return line;
}
