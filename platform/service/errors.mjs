/* Prompt 50 service errors. Clinic-facing text states what happened and
   what to do. Codes stay on the error object for tests and logs, never in
   the clinic message. No em dashes or en dashes anywhere. */

export function namedError(code, message, extra) {
  const e = new Error(message);
  e.code = code;
  if (extra && typeof extra === "object") Object.assign(e, extra);
  return e;
}

export function toClinicMessage(err) {
  const happened = err && err.message ? String(err.message) : "The action could not be completed.";
  return happened + " Try again, or ask your clinic administrator for help.";
}

export function publicErrorBody(err) {
  return { message: toClinicMessage(err) };
}
