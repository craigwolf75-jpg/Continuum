/* Continuum hub role select (Prompt 33). React plus Framer Motion. Built to a
   self-contained IIFE (deploy/hub/roles.js) that the static hub mounts for the
   #roles view. Design tokens and the entrance timeline follow the prompt, which
   is the source of truth. Routing is unchanged: each card is a link to the same
   portal it always opened. No em-dashes anywhere. */
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { animate, useReducedMotion } from "framer-motion";

const T = {
  pageBg: "#0E1A2F", cardFill: "#182642", borderRest: "#26375C", gold: "#E8A33D",
  titleRest: "#DFE7F4", body: "#8FA3C2", logoBadge: "#22314F"
};

// Order per the prompt: Worker, HSE, Employer, Nexus Health, WCB, Platform Admin.
// Copy is unchanged from the current hub. Nav targets are unchanged.
const CARDS = [
  { title: "Worker", roleKey: "worker", nav: "/worker-dashboard.html", desc: "Your space for recovery. Do a quick check-in, see your duties for today, and follow your plan. Open it to start." },
  { title: "HSE", roleKey: "hse", nav: "/hse-portal.html", desc: "Light duties workspace. Assign tasks within restrictions. Recovery scores visible." },
  { title: "Employer", roleKey: "employer", nav: "/employer-dashboard.html", desc: "Employer dashboard. Functional status only, never medical detail." },
  { title: "Nexus Health", roleKey: "nexus", nav: "/clinical-dashboard.html", desc: "Clinical control center. Full detail, clearance, escalation." },
  { title: "WCB", roleKey: "wcb", nav: "/wcb-portal.html", desc: "Compensation board portal. Read only claims and milestone notifications." },
  { title: "Platform Admin", roleKey: "admin", nav: "/admin-portal.html", desc: "Continuum internal. Tenants, users, access grants, and billing." }
];

// Grid geometry for the swirl. The final settle is a transform of 0 back to the
// laid-out slot, so exact row height only shapes the orbit, never the resting spot.
const W = 340, GAP = 24, ROWSTEP = 172, R = 400, DEG = Math.PI / 180;
function slot(i) { const col = i % 2, row = Math.floor(i / 2); return { x: (col - 0.5) * (W + GAP), y: (row - 1) * ROWSTEP }; }

// Swirl (0 to 1.1s, 300 degrees, ending at thetaEnd minus 40) then tuck (1.1 to
// 1.35s, the last 40 degrees while the radius closes onto the hover point H).
// Returns transform-offset keyframes relative to the settled slot.
function intro(i) {
  const P = slot(i), H = { x: P.x, y: P.y - 140 };
  const thetaEnd = Math.atan2(H.y, H.x), magH = Math.hypot(H.x, H.y);
  const samples = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.35];
  const times = [], xs = [], ys = [], op = [], sc = [], ro = [];
  for (const t of samples) {
    let ang, rad;
    if (t <= 1.1) { const p = t / 1.1; ang = thetaEnd - 340 * DEG + p * 300 * DEG; rad = R; }
    else { const p = (t - 1.1) / 0.25; ang = thetaEnd - 40 * DEG + p * 40 * DEG; rad = R + p * (magH - R); }
    times.push(+(t / 1.35).toFixed(4));
    xs.push(+(rad * Math.cos(ang) - P.x).toFixed(2));
    ys.push(+(rad * Math.sin(ang) - P.y).toFixed(2));
    op.push(+Math.min(1, t / 0.35).toFixed(3));
    sc.push(+(0.85 + Math.min(1, t / 1.1) * 0.15).toFixed(3));
    ro.push(+(-14 + Math.min(1, t / 1.35) * 14).toFixed(2));
  }
  return { times, xs, ys, op, sc, ro };
}

function styleTag() {
  if (document.getElementById("cr-style")) return;
  const s = document.createElement("style"); s.id = "cr-style";
  s.textContent =
    ".cr-root{min-height:100vh;background:" + T.pageBg + ";display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 0;font-family:'Instrument Sans',system-ui,sans-serif}" +
    ".cr-brand{display:flex;align-items:center;gap:12px;margin-bottom:28px}" +
    ".cr-badge{width:44px;height:44px;border-radius:10px;background:" + T.logoBadge + ";color:" + T.gold + ";display:flex;align-items:center;justify-content:center;font-weight:700;font-size:22px}" +
    ".cr-wordmark{font-weight:700;font-size:34px;color:" + T.titleRest + "}" +
    ".cr-grid{display:grid;grid-template-columns:repeat(2,340px);grid-auto-rows:1fr;gap:24px;justify-content:center}" +
    ".cr-card{background:" + T.cardFill + ";border:1.5px solid " + T.borderRest + ";border-radius:10px;padding:24px;display:block;text-decoration:none;transition:border-color 180ms ease}" +
    ".cr-card:focus-visible{outline:2px solid " + T.gold + ";outline-offset:3px}" +
    ".cr-title{font-weight:600;font-size:20px;line-height:1.3;margin-bottom:6px;transition:color 180ms ease}" +
    ".cr-desc{font-weight:400;font-size:14px;line-height:22px;color:" + T.body + "}" +
    ".cr-foot{margin-top:26px;font-size:15px;color:" + T.body + ";text-align:center}" +
    ".cr-foot a{color:" + T.gold + ";text-decoration:none}" +
    "@media (max-width:1023px){.cr-grid{grid-template-columns:1fr;width:100%;padding:0 16px}}";
  document.head.appendChild(s);
}

function Card({ card, index, current, refFn }) {
  const [hover, setHover] = useState(false), [focus, setFocus] = useState(false), [press, setPress] = useState(false);
  const active = hover || focus || press || current;
  return (
    <a
      ref={refFn}
      href={card.nav}
      aria-label={card.title}
      className="cr-card"
      style={{ opacity: 0, borderColor: active ? T.gold : T.borderRest, willChange: "transform, opacity" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      onClick={() => { try { sessionStorage.setItem("continuum_hub_current_role", card.roleKey); } catch (e) {} }}
    >
      <div className="cr-title" style={{ color: active ? T.gold : T.titleRest }}>{card.title}</div>
      <div className="cr-desc">{card.desc}</div>
    </a>
  );
}

function RolesView() {
  const reduced = useReducedMotion();
  const cardRefs = useRef([]);
  const logoRef = useRef(null);
  const footRef = useRef(null);
  const [current, setCurrent] = useState(null);

  useLayoutEffect(() => {
    styleTag();
    try { setCurrent(sessionStorage.getItem("continuum_hub_current_role")); } catch (e) {}
  }, []);

  useEffect(() => {
    // Play the entrance on every mount. Gary wants the motion every time the hub
    // loads, so there is no session-once gate: each time the roles view mounts
    // (fresh load, re-sign-in, or return to the hub) the swirl runs again.
    if (reduced) {
      // Reduced motion: short fade and 12px rise, 60ms stagger, 0.6s total. No swirl.
      if (logoRef.current) animate(logoRef.current, { opacity: [0, 1] }, { duration: 0.4, ease: "easeOut" });
      cardRefs.current.forEach((n, i) => { if (!n) return; n.style.pointerEvents = "auto"; animate(n, { opacity: [0, 1], y: [12, 0] }, { duration: 0.6, delay: i * 0.06, ease: "easeOut" }); });
      if (footRef.current) animate(footRef.current, { opacity: [0, 1] }, { duration: 0.6, delay: 0.3 });
      return;
    }

    // Full entrance, 2.8s. Logo leads, cards swirl in and drop, footer trails.
    if (logoRef.current) animate(logoRef.current, { opacity: [0, 1], y: [-16, 0] }, { duration: 0.45, ease: "easeOut" });
    if (footRef.current) animate(footRef.current, { opacity: [0, 0, 1] }, { duration: 2.5, times: [0, 0.84, 1], ease: "easeOut" });
    cardRefs.current.forEach((n, i) => {
      if (!n) return;
      n.style.pointerEvents = "none";
      const k = intro(i);
      animate(n, { x: k.xs, y: k.ys, opacity: k.op, scale: k.sc, rotate: k.ro }, { duration: 1.35, times: k.times, ease: "easeInOut" })
        .then(() => new Promise(r => setTimeout(r, i * 70)))
        .then(() => animate(n, { y: 0 }, { type: "spring", bounce: 0.35, duration: 0.5 }))
        .then(() => { if (n) n.style.pointerEvents = "auto"; })
        .catch(() => {});
    });
  }, [reduced]);

  return (
    <div className="cr-root">
      <div className="cr-brand" ref={logoRef} style={{ opacity: 0 }}>
        <div className="cr-badge">C</div>
        <div className="cr-wordmark">Continuum</div>
      </div>
      <div className="cr-grid">
        {CARDS.map((card, i) => (
          <Card key={card.roleKey} card={card} index={i} current={current === card.roleKey} refFn={el => { cardRefs.current[i] = el; }} />
        ))}
      </div>
      <div className="cr-foot" ref={footRef} style={{ opacity: 0 }}>
        Looking for the worker app? <a href="/app">Open the worker app</a>.
      </div>
    </div>
  );
}

export function mount(el) {
  if (!el) return;
  // Replay-safe: unmount any prior root on this node before mounting again, so
  // returning to the hub re-runs the entrance cleanly without a duplicate root.
  if (el.__crRoot) { try { el.__crRoot.unmount(); } catch (e) {} }
  const root = createRoot(el);
  el.__crRoot = root;
  root.render(<RolesView />);
}
