/* Continuum Prompt 45: generic form pack path.

   Render, validate, and generate a document from jurisdiction data. Adding a
   pack (including the synthetic ZZ TEST forms) requires no application code
   change: this module never names a province or a form id. No dashes anywhere. */

import { runP1 } from "./p1.mjs";
import { findJurisdiction, namedError, resolveCodeList } from "./jurisdiction.mjs";

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();
const isBlank = (v) => v === null || v === undefined || String(v).trim() === "";

function requireJurisdiction(jurisdiction, store) {
  const code = typeof jurisdiction === "string"
    ? norm(jurisdiction).toUpperCase()
    : norm(jurisdiction && (jurisdiction.code || jurisdiction.jurisdiction_code)).toUpperCase();
  if (!code) {
    throw namedError("JURISDICTION-MISSING", "A form pack call requires an explicit jurisdiction. Never default.");
  }
  const row = findJurisdiction(store, code);
  if (!row) {
    throw namedError("JURISDICTION-UNKNOWN", "Jurisdiction " + code + " is not in the store. Never default.", { jurisdiction: code });
  }
  return row;
}

function formRow(store, code, formId) {
  const form = norm(formId);
  const row = (store.forms || []).find((f) =>
    norm(f.jurisdiction_code).toUpperCase() === code && norm(f.form_id) === form
  );
  if (!row) {
    throw namedError("FORM-MISSING", "Form " + form + " is not in the pack for " + code + ".", { jurisdiction: code, form_id: form });
  }
  return row;
}

function elementsOf(store, code, formId) {
  return (store.elements || [])
    .filter((e) => norm(e.jurisdiction_code).toUpperCase() === code && norm(e.form_id) === norm(formId))
    .slice()
    .sort((a, b) => Number(a.element_seq) - Number(b.element_seq));
}

function engineType(dataType) {
  const t = norm(dataType).toLowerCase();
  if (t === "num" || t === "integer") return "integer";
  if (t === "numeric") return "numeric";
  if (t === "date") return "date";
  if (t === "boolean") return "boolean";
  return "string";
}

export function renderForm(jurisdiction, formId, store) {
  const row = requireJurisdiction(jurisdiction, store);
  const form = formRow(store, row.code, formId);
  const elements = elementsOf(store, row.code, form.form_id).map((e) => ({
    id: e.element_seq,
    name: e.element_name,
    section: e.section_name,
    type: engineType(e.data_type),
    required: e.optionality === "always_required",
    optionality: e.optionality,
    minLength: e.length_min,
    maxLength: e.length_max,
    format: e.format,
    codeListName: e.code_list_name || null,
    codeValues: e.code_list_name ? resolveCodeList(row.code, form.form_id, e.element_name, store) : [],
    path: e.path || e.hl7_xpath || null,
  }));
  return {
    jurisdiction: row.code,
    board_name: row.board_name,
    form_id: form.form_id,
    form_name: form.form_name,
    version: form.version,
    elements,
  };
}

export function validateForm(jurisdiction, formId, values, store) {
  const model = renderForm(jurisdiction, formId, store);
  const payload = values || {};
  const failures = [];
  for (const el of model.elements) {
    const raw = Object.prototype.hasOwnProperty.call(payload, el.id)
      ? payload[el.id]
      : payload[el.name];
    const p1el = {
      name: el.name,
      type: el.codeListName ? "code" : el.type,
      required: el.required,
      minLength: el.minLength,
      maxLength: el.maxLength,
      format: el.format,
      codeListName: el.codeListName,
      codeListSet: el.codeValues.length ? new Set(el.codeValues.map((v) => v.code)) : undefined,
    };
    failures.push(...runP1(p1el, raw));
  }
  return { ok: failures.length === 0, failures, form_id: model.form_id, jurisdiction: model.jurisdiction };
}

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function generateDocument(jurisdiction, formId, values, store) {
  const model = renderForm(jurisdiction, formId, store);
  const check = validateForm(jurisdiction, formId, values, store);
  if (!check.ok) {
    throw namedError(
      "DOCUMENT-INVALID",
      "Cannot generate a document for " + model.form_id + ": " + check.failures.length + " validation failure(s).",
      { failures: check.failures, form_id: model.form_id, jurisdiction: model.jurisdiction }
    );
  }
  const payload = values || {};
  const fields = model.elements.map((el) => {
    const raw = Object.prototype.hasOwnProperty.call(payload, el.id)
      ? payload[el.id]
      : payload[el.name];
    const value = isBlank(raw) ? "" : String(raw);
    return "  <field seq=\"" + xmlEscape(el.id) + "\" name=\"" + xmlEscape(el.name) + "\">" + xmlEscape(value) + "</field>";
  });
  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<jurisdiction_document board=\"" + xmlEscape(model.board_name) + "\" jurisdiction=\"" + xmlEscape(model.jurisdiction) + "\" form_id=\"" + xmlEscape(model.form_id) + "\" version=\"" + xmlEscape(model.version) + "\">",
    fields.join("\n"),
    "</jurisdiction_document>",
    "",
  ].join("\n");
}

export function loadFormPack(jurisdiction, store) {
  const row = requireJurisdiction(jurisdiction, store);
  const forms = (store.forms || []).filter((f) => norm(f.jurisdiction_code).toUpperCase() === row.code);
  return {
    jurisdiction: { ...row },
    forms: forms.map((f) => renderForm(row.code, f.form_id, store)),
  };
}
