/* Prompt 49 interop helpers. Named failures and small parsers.
   No em dashes or en dashes. The Prompt 41 identifier is not reused. */

export function namedError(code, message, extra) {
  const e = new Error(message);
  e.code = code;
  if (extra && typeof extra === "object") Object.assign(e, extra);
  return e;
}

export function norm(v) {
  return String(v === null || v === undefined ? "" : v).trim();
}

export function isBlank(v) {
  return norm(v) === "";
}

export function nowFrom(store, at) {
  if (at) return new Date(at);
  if (store && store.now) return new Date(store.now);
  return new Date();
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
