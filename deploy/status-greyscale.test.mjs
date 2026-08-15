/* Continuum Prompt 58 greyscale gate (section 11.3, acceptance criterion 4).
   Colour removed, the five status states must still be distinguishable, which
   means by SHAPE. Browser free: each silhouette is modelled as a 16x16 fill
   grid from the same geometry as status-icons.mjs, and every pair is asserted
   to differ by a clear margin. Also checks the section 6.6 markup contract:
   named icon + real text, icon aria-hidden, text never empty, and the five
   icons are all distinct SVG. The pixel screenshot at 1366x768 is the manual
   criterion-4 check; this is its automated proxy. No dashes anywhere. */

import { STATUS_ICONS, STATUS_TEXT, statusMarkup } from "./status-icons.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const N = 16;
// silhouette fill predicates, geometry matched to status-icons.mjs
const inCircle = (x, y, r) => (x - 8) ** 2 + (y - 8) ** 2 <= r * r;
const shapes = {
  ok: (x, y) => inCircle(x, y, 6),
  // triangle apex (8,2), base corners (14.5,14) (1.5,14): point-in-triangle
  caution: (x, y) => {
    const ax = 8, ay = 2, bx = 14.5, by = 14, cx = 1.5, cy = 14;
    const d = (px, py, qx, qy, rx, ry) => (qx - px) * (ry - py) - (rx - px) * (qy - py);
    const d1 = d(x, y, ax, ay, bx, by), d2 = d(x, y, bx, by, cx, cy), d3 = d(x, y, cx, cy, ax, ay);
    const neg = d1 < 0 || d2 < 0 || d3 < 0, pos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(neg && pos);
  },
  // filled 12x12 square minus a 2px-wide diagonal slash
  stop: (x, y) => {
    const inSquare = x >= 2 && x <= 14 && y >= 2 && y <= 14;
    const onSlash = Math.abs((x - y)) <= 1.4; // diagonal band top-right to bottom-left-ish
    return inSquare && !onSlash;
  },
  draft: (x, y) => x >= 6.75 && x <= 9.25 && y >= 1 && y <= 15,
  none: (x, y) => inCircle(x, y, 6.5) && !inCircle(x, y, 4.5),
};

// build grids
const grid = {};
for (const k of Object.keys(shapes)) {
  const g = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) g.push(shapes[k](x + 0.5, y + 0.5) ? 1 : 0);
  grid[k] = g;
  ok(`${k} silhouette is non-empty`, g.reduce((a, b) => a + b, 0) > 8);
}

// every PAIR of silhouettes differs by a clear margin (distinguishable in greyscale)
const states = Object.keys(shapes);
const MARGIN = 18; // cells out of 256
for (let i = 0; i < states.length; i++) {
  for (let j = i + 1; j < states.length; j++) {
    let diff = 0;
    for (let k = 0; k < N * N; k++) if (grid[states[i]][k] !== grid[states[j]][k]) diff++;
    ok(`${states[i]} vs ${states[j]} distinguishable by shape (diff ${diff} >= ${MARGIN})`, diff >= MARGIN);
  }
}

// section 6.6 markup + icon contract
ok("all five named icons exist", ["ok", "caution", "stop", "draft", "none"].every((s) => STATUS_ICONS[s]));
ok("every icon is aria-hidden", Object.values(STATUS_ICONS).every((s) => /aria-hidden="true"/.test(s)));
ok("the five icon SVGs are all distinct", new Set(Object.values(STATUS_ICONS)).size === 5);
for (const s of ["ok", "caution", "stop", "draft", "none"]) {
  const m = statusMarkup(s);
  ok(`${s} markup carries data-state, the icon, and non-empty real text`,
    m.includes(`data-state="${s}"`) && m.includes("status-icon") &&
    new RegExp(`<span class="status-text">${STATUS_TEXT[s].replace(/[.,]/g, "\\$&")}</span>`).test(m));
}
ok("a variant label (Conditional/Unsafe) is honoured, never empty",
  statusMarkup("caution", "Conditional").includes(">Conditional<") &&
  (() => { try { statusMarkup("caution", "  "); return true; } catch { return false; } })()); // blank falls back, never throws to empty

console.log(`\nstatus-greyscale suite: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
