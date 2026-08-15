/* Continuum Prompt 58 status icon contract (section 6.6). The five states each
   render shape + text + colour; the shape is one of these named silhouettes,
   drawn at 16px, distinguishable with saturation removed. The icon is always
   aria-hidden; the text is always present and never visually hidden. Fill and
   stroke use currentColor so the component sets --state-* / --state-*-text.
   No network. No dashes anywhere. */

// viewBox 0 0 16 16. Silhouettes chosen to be distinct in greyscale:
//   ok      filled circle
//   caution filled equilateral triangle, point up
//   stop    filled square with a diagonal slash cut through it
//   draft   solid vertical bar, full height
//   none    hollow circle, 2px stroke
export const STATUS_ICONS = {
  ok: '<svg class="status-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="currentColor"/></svg>',
  caution: '<svg class="status-icon" viewBox="0 0 16 16" aria-hidden="true"><polygon points="8,2 14.5,14 1.5,14" fill="currentColor"/></svg>',
  stop: '<svg class="status-icon" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M2 2h12v12H2Zm10.5 1.2L3.2 12.5l1.3 1.3 9.3-9.3z"/></svg>',
  draft: '<svg class="status-icon" viewBox="0 0 16 16" aria-hidden="true"><rect x="6.75" y="1" width="2.5" height="14" fill="currentColor"/></svg>',
  none: '<svg class="status-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
};

// Canonical text per state (section 6.6). Duty/countdown variants share the icon.
export const STATUS_TEXT = {
  ok: "Safe",
  caution: "At risk",
  stop: "Will miss",
  draft: "Draft, not yet reviewed",
  none: "Not assessed",
};

// The section 6.6 markup contract. The icon is aria-hidden; the text is a real,
// visible element, never sr-only. text overrides the canonical word where a
// surface uses a variant (Conditional, Unsafe) but is never empty.
export function statusMarkup(state, text) {
  const icon = STATUS_ICONS[state];
  const label = (text && String(text).trim()) || STATUS_TEXT[state];
  if (!icon || !label) throw new Error("unknown status state or empty label: " + state);
  return `<span class="status" data-state="${state}">${icon}<span class="status-text">${label}</span></span>`;
}
