/* Continuum Prompt 42: the HL7 document envelope. A faithful XML parser and canonical
   serialiser for the board's ZRPT_P03 documents, so a full generated file can be
   compared structurally against the board's own 5.xx samples (parse, regenerate,
   compare, the samples' own method).

   The board document is a fixed envelope around one or more report bodies:
     ZRPT_P03
       FHS (file header)
       ZRPT_P03.LST.6 -> ZRPT_P03.GRP.4
         BHS (batch header)
         ZRPT_P03.LST.5 -> ZRPT_P03.GRP.3 -> ZRPT_P03.GRP.2 (one per report)
           MSH, EVN, PID, ACC, and the practitioner and observation body
         BTS (batch trailer)
       FTS (file trailer)

   This module does not synthesise the envelope from scratch (that boilerplate is fixed
   and carries no clinical data); it proves the generator can REPRODUCE any board file
   exactly, and that the OBX observation layer built in hl7gen.mjs sits correctly inside
   the full document. The value bearing work (which practitioner element lands in which
   OBX or segment field) is the wire map and the OBX generator, already built and tested.

   Pure functions, no dependency. No dashes anywhere. */

// Canonicalise raw XML for structural comparison: drop the XML declaration and comments,
// drop ignorable whitespace between tags, and normalise empty elements to a single self
// closing form. Text content and entities are left intact.
export function canonicalizeXml(s) {
  return String(s === null || s === undefined ? "" : s)
    .replace(/<\?xml[\s\S]*?\?>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/<([A-Za-z0-9_.:]+)\s*\/>/g, "<$1/>")
    .replace(/<([A-Za-z0-9_.:]+)><\/\1>/g, "<$1/>")
    .trim();
}

// Parse XML into a light node tree. Element nodes are { tag, attrs, children }; text
// nodes are { text }. Ignorable whitespace between tags is dropped. Attributes are kept
// verbatim (a single leading space) so the root's namespaces re serialise exactly.
export function parseXml(str) {
  const s = String(str === null || str === undefined ? "" : str)
    .replace(/<\?xml[\s\S]*?\?>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  const re = /<\/([A-Za-z0-9_.:]+)\s*>|<([A-Za-z0-9_.:]+)((?:\s[^>]*?)?)(\/?)>|([^<]+)/g;
  const root = { tag: "#doc", attrs: "", children: [] };
  const stack = [root];
  let m;
  while ((m = re.exec(s))) {
    if (m[1] !== undefined) {
      if (stack.length > 1) stack.pop();
    } else if (m[2] !== undefined) {
      const raw = (m[3] || "").trim();
      const node = { tag: m[2], attrs: raw ? " " + raw : "", children: [] };
      stack[stack.length - 1].children.push(node);
      if (m[4] !== "/") stack.push(node);
    } else if (m[5] !== undefined && m[5].trim() !== "") {
      stack[stack.length - 1].children.push({ text: m[5] });
    }
  }
  return root.children[0];
}

// Serialise a node tree back to canonical XML (matches canonicalizeXml output).
export function serialize(node) {
  if (!node) return "";
  if (node.text !== undefined) return node.text;
  const inner = (node.children || []).map(serialize).join("");
  if (!node.children || node.children.length === 0) return "<" + node.tag + node.attrs + "/>";
  return "<" + node.tag + node.attrs + ">" + inner + "</" + node.tag + ">";
}

// Round trip: parse then serialise should equal the canonical form of the input.
export function roundTrips(xml) {
  return serialize(parseXml(xml)) === canonicalizeXml(xml);
}

// Walk the tree returning every element node whose tag matches (depth first, in order).
export function findAll(node, tag, out = []) {
  if (!node || node.text !== undefined) return out;
  if (node.tag === tag) out.push(node);
  for (const c of node.children || []) findAll(c, tag, out);
  return out;
}

// Ordered leaf values of a document: [{ path, value }] for every element that has a
// single text child. path is the slash joined tag chain. Used to inspect the data
// content and to prove a value change flows to exactly one slot.
export function extractLeaves(node, prefix = "", out = []) {
  if (!node || node.text !== undefined) return out;
  const path = prefix ? prefix + "/" + node.tag : node.tag;
  const kids = node.children || [];
  const onlyText = kids.length === 1 && kids[0].text !== undefined;
  if (onlyText) out.push({ path, value: kids[0].text });
  else for (const c of kids) extractLeaves(c, path, out);
  return out;
}

// Count the OBX observations in a parsed document (each OBX carries its CE.1 identifier).
export function documentObxIdentifiers(tree) {
  return findAll(tree, "OBX").map((obx) => {
    const ce = findAll(obx, "CE.1")[0];
    return ce && ce.children[0] ? ce.children[0].text : "";
  });
}
