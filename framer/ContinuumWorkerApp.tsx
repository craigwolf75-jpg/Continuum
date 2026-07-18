import { addPropertyControls, ControlType } from "framer"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useRef, useState, type CSSProperties } from "react"

// Continuum Worker App, a self-contained Framer code component. Presentational
// only: no backend, no storage, no network SDKs. Production auth, RLS, and data
// live in the mainline (Prompt 07); this demo shares its copy, mechanics, and
// thresholds so it never lies about the product. No em-dashes or en-dashes.

interface Props {
    workerName: string
    bodyPart: string
    startDay: number
    prognosisDays: number
    accent: string
    background: string
    phoneFrame: boolean
    startAtConsent: boolean
    autoplay: boolean
    style?: CSSProperties
}

const INK = "#E9EEF6"
const MUTED = "#9AA9BF"
const PANEL = "#16243B"
const PANEL2 = "#1C2C47"
const LINE = "#27395A"
const GOOD = "#6FBF8F"
const HEAD = '"Space Grotesk", system-ui, sans-serif'
const BODY = 'Inter, system-ui, sans-serif'
const SPRING = { type: "spring", stiffness: 480, damping: 30 } as const
const FONT_CSS =
    "@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');"

// pain heats from the accent toward a warm red-gold as the score climbs
function painColor(v: number, accent: string): string {
    const hex = accent.replace("#", "")
    const a = [
        parseInt(hex.slice(0, 2) || "C8", 16),
        parseInt(hex.slice(2, 4) || "97", 16),
        parseInt(hex.slice(4, 6) || "2F", 16),
    ]
    const b = [0xe0, 0x55, 0x2f]
    const t = Math.min(1, Math.max(0, v / 10))
    const m = a.map((x, i) => Math.round(x + (b[i] - x) * t))
    return "rgb(" + m[0] + "," + m[1] + "," + m[2] + ")"
}

/**
 * Continuum Worker App
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 820
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ContinuumWorkerApp(props: Props) {
    const {
        workerName = "Marcus",
        bodyPart = "Right shoulder",
        startDay = 9,
        prognosisDays = 21,
        accent = "#C8972F",
        background = "#0E1B2C",
        phoneFrame = true,
        startAtConsent = false,
        autoplay = false,
    } = props

    const firstName = (workerName || "there").split(" ")[0]

    const [consented, setConsented] = useState(!startAtConsent)
    const [tab, setTab] = useState<"today" | "trend" | "duties">("today")
    const [day, setDay] = useState(startDay)
    const [pain, setPain] = useState(3)
    const [mobility, setMobility] = useState(6)
    const [done, setDone] = useState(false)
    const [saved, setSaved] = useState(false)
    const [burst, setBurst] = useState(false)
    const [escalated, setEscalated] = useState(false)
    const [checkins, setCheckins] = useState<
        { day: number; pain: number; mobility: number }[]
    >([
        { day: startDay - 4, pain: 7, mobility: 3 },
        { day: startDay - 3, pain: 6, mobility: 4 },
        { day: startDay - 2, pain: 6, mobility: 5 },
        { day: startDay - 1, pain: 5, mobility: 5 },
        { day: startDay, pain: 4, mobility: 6 },
    ])
    const [duties, setDuties] = useState([
        { id: "d1", task: "Ground-level material staging", done: true },
        { id: "d2", task: "Tool crib inventory and tagging", done: false },
        { id: "d3", task: "Toolbox talk delivery", done: false },
    ])

    // reset when the author changes the starting props on the canvas
    useEffect(() => {
        setConsented(!startAtConsent)
        setDay(startDay)
        setDone(false)
        setEscalated(false)
    }, [startAtConsent, startDay])

    // one timeout registry, cleared on unmount (SSR safe, no timers at module load)
    const timers = useRef<number[]>([])
    function later(fn: () => void, ms: number) {
        if (typeof window === "undefined") return
        const id = window.setTimeout(fn, ms)
        timers.current.push(id)
    }
    useEffect(() => {
        return () => {
            timers.current.forEach((id) => clearTimeout(id))
            timers.current = []
        }
    }, [])

    function submit() {
        if (done) return
        const p = pain
        const m = mobility
        setSaved(true)
        setBurst(true)
        setCheckins((cs) => [...cs, { day, pain: p, mobility: m }].slice(-16))
        later(() => {
            setSaved(false)
            setBurst(false)
            setDone(true)
            if (p >= 8) setEscalated(true)
        }, 1050)
    }
    function nextDay() {
        setDay((d) => d + 1)
        setDone(false)
        setEscalated(false)
        setPain(3)
        setMobility(6)
    }
    function completeFirstDuty() {
        setDuties((ds) => {
            const i = ds.findIndex((d) => !d.done)
            if (i < 0) return ds
            const copy = ds.slice()
            copy[i] = { ...copy[i], done: true }
            return copy
        })
    }

    // autoplay: a scripted, self-cleaning loop for hero sections
    const api = useRef({ setPain, setMobility, submit, setTab, completeFirstDuty, nextDay, setConsented })
    api.current = { setPain, setMobility, submit, setTab, completeFirstDuty, nextDay, setConsented }
    useEffect(() => {
        if (!autoplay || typeof window === "undefined") return
        let cancelled = false
        const local: number[] = []
        const wait = (ms: number) =>
            new Promise<void>((res) => {
                const id = window.setTimeout(res, ms)
                local.push(id)
            })
        ;(async () => {
            while (!cancelled) {
                const a = api.current
                a.setConsented(true)
                a.setTab("today")
                a.setPain(5)
                a.setMobility(7)
                await wait(1000)
                if (cancelled) break
                a.submit()
                await wait(1700)
                if (cancelled) break
                a.setTab("trend")
                await wait(1600)
                if (cancelled) break
                a.setTab("duties")
                await wait(700)
                a.completeFirstDuty()
                await wait(1500)
                if (cancelled) break
                a.setTab("today")
                await wait(900)
                a.nextDay()
                await wait(1100)
                if (cancelled) break
                a.setPain(9)
                a.setMobility(4)
                await wait(900)
                if (cancelled) break
                a.submit()
                await wait(2400)
                if (cancelled) break
                a.setTab("today")
                a.nextDay()
                await wait(1300)
            }
        })()
        return () => {
            cancelled = true
            local.forEach((id) => clearTimeout(id))
        }
    }, [autoplay])

    const ringProgress = Math.min(1, day / Math.max(1, prognosisDays))
    const dutiesDone = duties.filter((d) => d.done).length

    const content = (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                background: background,
                color: INK,
                fontFamily: BODY,
            }}
        >
            <Orbs accent={accent} />
            <AnimatePresence mode="wait">
                {!consented ? (
                    <Consent
                        key="consent"
                        accent={accent}
                        onAgree={() => setConsented(true)}
                    />
                ) : (
                    <motion.div
                        key="app"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            position: "relative",
                            zIndex: 1,
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            minHeight: 0,
                        }}
                    >
                        <div style={{ padding: "20px 20px 8px" }}>
                            <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 17 }}>
                                Contin<span style={{ color: accent }}>uum</span>
                            </div>
                            <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 24, marginTop: 6 }}>
                                Hi {firstName}
                            </div>
                        </div>

                        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={tab}
                                    initial={{ opacity: 0, x: 24 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -24 }}
                                    transition={{ type: "spring", stiffness: 320, damping: 32 }}
                                    style={{ position: "absolute", inset: 0, padding: "6px 20px 20px", overflowY: "auto" }}
                                >
                                    {tab === "today" && (
                                        <Today
                                            accent={accent}
                                            bodyPart={bodyPart}
                                            day={day}
                                            prognosis={prognosisDays}
                                            ringProgress={ringProgress}
                                            pain={pain}
                                            mobility={mobility}
                                            setPain={setPain}
                                            setMobility={setMobility}
                                            done={done}
                                            saved={saved}
                                            burst={burst}
                                            escalated={escalated}
                                            onSubmit={submit}
                                            onNextDay={nextDay}
                                        />
                                    )}
                                    {tab === "trend" && (
                                        <Trend accent={accent} checkins={checkins} />
                                    )}
                                    {tab === "duties" && (
                                        <Duties
                                            accent={accent}
                                            duties={duties}
                                            done={dutiesDone}
                                            onComplete={completeFirstDuty}
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <TabBar tab={tab} setTab={setTab} accent={accent} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )

    return (
        <div
            style={{
                position: "relative",
                width: 400,
                height: 820,
                ...props.style,
                overflow: "hidden",
                background: background,
                fontFamily: BODY,
            }}
        >
            <style>{FONT_CSS}</style>
            {phoneFrame ? (
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        padding: 12,
                        boxSizing: "border-box",
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            borderRadius: 40,
                            border: "2px solid " + LINE,
                            overflow: "hidden",
                            boxShadow: "0 30px 70px rgba(0,0,0,0.55)",
                        }}
                    >
                        {content}
                    </div>
                </div>
            ) : (
                content
            )}
        </div>
    )
}

// ---------- ambient background ----------
function Orbs({ accent }: { accent: string }) {
    const orb = (c: string, x: number, y: number, s: number, d: number): CSSProperties => ({
        position: "absolute",
        left: x,
        top: y,
        width: s,
        height: s,
        borderRadius: "50%",
        background: "radial-gradient(circle at 30% 30%, " + c + ", transparent 70%)",
        filter: "blur(18px)",
        opacity: 0.5,
        pointerEvents: "none",
    })
    return (
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
            <motion.div
                style={orb(accent, -40, 60, 260, 0)}
                animate={{ x: [0, 40, -10, 0], y: [0, 30, -20, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                style={orb("#2E5A8C", 180, 520, 240, 1)}
                animate={{ x: [0, -30, 20, 0], y: [0, -25, 15, 0] }}
                transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            />
        </div>
    )
}

// ---------- consent ----------
function Consent({ accent, onAgree }: { accent: string; onAgree: () => void }) {
    const lines = [
        "Your employer sees what you can do at work. Never your pain scores or notes.",
        "Your clinician sees everything, so they can help you recover.",
        "WCB receives the required paperwork at three points in your claim.",
        "Continuum manages this for you. It is not your medical record.",
    ]
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "relative", zIndex: 1, flex: 1, padding: 24, display: "flex", flexDirection: "column", justifyContent: "center" }}
        >
            <div style={{ color: accent, fontFamily: HEAD, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Before we start
            </div>
            <div style={{ fontFamily: HEAD, fontSize: 26, fontWeight: 700, margin: "8px 0 18px" }}>
                Your privacy, in plain words
            </div>
            {lines.map((l, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.16, ...SPRING }}
                    style={{ padding: "10px 0", borderBottom: "1px solid " + LINE, fontSize: 15 }}
                >
                    {l}
                </motion.div>
            ))}
            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onAgree}
                style={{
                    marginTop: 22,
                    minHeight: 48,
                    border: "none",
                    borderRadius: 12,
                    background: accent,
                    color: "#14100a",
                    fontFamily: HEAD,
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: "pointer",
                }}
            >
                I agree, let us go
            </motion.button>
        </motion.div>
    )
}

// ---------- today ----------
function Today(props: {
    accent: string
    bodyPart: string
    day: number
    prognosis: number
    ringProgress: number
    pain: number
    mobility: number
    setPain: (v: number) => void
    setMobility: (v: number) => void
    done: boolean
    saved: boolean
    burst: boolean
    escalated: boolean
    onSubmit: () => void
    onNextDay: () => void
}) {
    const { accent, bodyPart, day, prognosis, ringProgress, pain, mobility, setPain, setMobility, done, saved, burst, escalated, onSubmit, onNextDay } = props
    return (
        <div>
            <AnimatePresence>
                {escalated && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: "hidden", marginBottom: 12 }}
                    >
                        <motion.div
                            animate={{ boxShadow: ["0 0 0 rgba(200,151,47,0.0)", "0 0 22px rgba(200,151,47,0.45)", "0 0 0 rgba(200,151,47,0.0)"] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                            style={{ border: "1px solid " + accent, borderRadius: 14, padding: "12px 14px", background: "rgba(200,151,47,0.08)" }}
                        >
                            <div style={{ color: accent, fontFamily: HEAD, fontWeight: 600, fontSize: 14 }}>
                                Your care team is taking a closer look
                            </div>
                            <div style={{ color: MUTED, fontSize: 12.5, marginTop: 4 }}>
                                Your recent check-ins asked for attention. Your clinician has been told. Keep checking in as normal.
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ background: PANEL, border: "1px solid " + LINE, borderRadius: 18, padding: 18, marginBottom: 14 }}>
                <div style={{ color: accent, fontFamily: HEAD, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Your recovery
                </div>
                <div style={{ fontFamily: HEAD, fontSize: 18, fontWeight: 700, margin: "4px 0 12px" }}>
                    {bodyPart} injury
                </div>
                <Ring progress={ringProgress} day={day} prognosis={prognosis} accent={accent} />
            </div>

            {done ? (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ background: PANEL, border: "1px solid " + LINE, borderRadius: 18, padding: 18 }}
                >
                    <div style={{ fontFamily: HEAD, fontWeight: 600 }}>Check-in saved</div>
                    <div style={{ color: MUTED, fontSize: 12.5, marginTop: 4 }}>
                        Nice work. Move time forward to check in again.
                    </div>
                    <button
                        onClick={onNextDay}
                        style={{ marginTop: 12, minHeight: 44, width: "100%", border: "1px solid " + LINE, borderRadius: 12, background: "transparent", color: INK, cursor: "pointer", fontFamily: BODY }}
                    >
                        Next day
                    </button>
                </motion.div>
            ) : (
                <div style={{ background: PANEL, border: "1px solid " + LINE, borderRadius: 18, padding: 18 }}>
                    <div style={{ color: accent, fontFamily: HEAD, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                        Check-in
                    </div>
                    <Slider label="How is your pain?" value={pain} onChange={setPain} accent={accent} fill={painColor(pain, accent)} />
                    <Slider label="How is your movement?" value={mobility} onChange={setMobility} accent={accent} fill={accent} />
                    <div style={{ position: "relative", marginTop: 8 }}>
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={onSubmit}
                            animate={{ background: saved ? GOOD : accent }}
                            style={{ position: "relative", width: "100%", minHeight: 48, border: "none", borderRadius: 12, color: "#14100a", fontFamily: HEAD, fontWeight: 600, fontSize: 15, cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                            <AnimatePresence mode="wait">
                                {saved ? (
                                    <motion.svg key="ok" width={26} height={26} viewBox="0 0 26 26" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={SPRING}>
                                        <motion.path d="M6 13 L11 18 L20 7" fill="none" stroke="#14100a" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35 }} />
                                    </motion.svg>
                                ) : (
                                    <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        Save check-in
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                        {burst && <Burst accent={accent} />}
                    </div>
                    <div style={{ color: MUTED, fontSize: 11.5, marginTop: 8 }}>
                        Only your clinician sees your scores and notes.
                    </div>
                </div>
            )}
        </div>
    )
}

function Ring({ progress, day, prognosis, accent }: { progress: number; day: number; prognosis: number; accent: string }) {
    const R = 50
    const C = 2 * Math.PI * R
    return (
        <div style={{ position: "relative", width: 132, height: 132, margin: "0 auto" }}>
            <svg width={132} height={132} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={66} cy={66} r={R} stroke={LINE} strokeWidth={10} fill="none" />
                <motion.circle
                    cx={66}
                    cy={66}
                    r={R}
                    stroke={accent}
                    strokeWidth={10}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    initial={{ strokeDashoffset: C }}
                    animate={{ strokeDashoffset: C * (1 - progress) }}
                    transition={{ type: "spring", stiffness: 60, damping: 18 }}
                />
            </svg>
            <motion.div
                key={day}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={SPRING}
                style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
            >
                <div style={{ fontFamily: HEAD, fontSize: 26, fontWeight: 700 }}>Day {day}</div>
                <div style={{ color: MUTED, fontSize: 12 }}>of {prognosis}</div>
            </motion.div>
        </div>
    )
}

function Slider({ label, value, onChange, accent, fill }: { label: string; value: number; onChange: (v: number) => void; accent: string; fill: string }) {
    const trackRef = useRef<HTMLDivElement>(null)
    const [drag, setDrag] = useState(false)
    const pct = (value / 10) * 100
    function fromX(clientX: number) {
        const el = trackRef.current
        if (!el) return value
        const r = el.getBoundingClientRect()
        const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
        onChange(Math.round(p * 10))
    }
    return (
        <div style={{ margin: "14px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                <span>{label}</span>
                <motion.span key={value} initial={{ scale: 0.6, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} transition={SPRING} style={{ fontFamily: HEAD, fontSize: 18, color: accent }}>
                    {value}
                </motion.span>
            </div>
            <div
                ref={trackRef}
                onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId)
                    setDrag(true)
                    fromX(e.clientX)
                }}
                onPointerMove={(e) => {
                    if (drag) fromX(e.clientX)
                }}
                onPointerUp={() => setDrag(false)}
                style={{ position: "relative", height: 44, display: "flex", alignItems: "center", cursor: "pointer", touchAction: "none" }}
            >
                <div style={{ position: "absolute", left: 0, right: 0, height: 12, borderRadius: 8, background: PANEL2 }} />
                <motion.div animate={{ width: pct + "%" }} transition={SPRING} style={{ position: "absolute", left: 0, height: 12, borderRadius: 8, background: fill }} />
                <motion.div
                    animate={{ left: pct + "%" }}
                    transition={SPRING}
                    style={{ position: "absolute", top: "50%", width: 26, height: 26, marginTop: -13, marginLeft: -13, borderRadius: "50%", background: accent, boxShadow: "0 0 16px " + accent }}
                />
            </div>
        </div>
    )
}

function Burst({ accent }: { accent: string }) {
    const parts = Array.from({ length: 10 }, (_, i) => i)
    return (
        <div style={{ position: "absolute", left: "50%", top: "50%", pointerEvents: "none" }}>
            {parts.map((i) => {
                const a = (i / parts.length) * Math.PI * 2
                return (
                    <motion.div
                        key={i}
                        initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                        animate={{ x: Math.cos(a) * 64, y: Math.sin(a) * 64, opacity: 0, scale: 0.3 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ position: "absolute", width: 8, height: 8, marginLeft: -4, marginTop: -4, borderRadius: "50%", background: accent }}
                    />
                )
            })}
        </div>
    )
}

// ---------- trend ----------
function Trend({ accent, checkins }: { accent: string; checkins: { day: number; pain: number; mobility: number }[] }) {
    const w = 320
    const h = 120
    const n = Math.max(1, checkins.length - 1)
    const step = w / n
    const y = (v: number) => h - (v / 10) * h
    const path = (key: "pain" | "mobility") =>
        checkins.map((p, i) => (i ? "L" : "M") + (i * step).toFixed(1) + " " + y(p[key]).toFixed(1)).join(" ")
    return (
        <div style={{ background: PANEL, border: "1px solid " + LINE, borderRadius: 18, padding: 18 }}>
            <div style={{ color: accent, fontFamily: HEAD, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Your trend
            </div>
            <div style={{ fontFamily: HEAD, fontWeight: 600, margin: "4px 0 12px" }}>
                Pain and movement over time
            </div>
            <svg width="100%" viewBox={"0 0 " + w + " " + h} preserveAspectRatio="none" style={{ height: 120 }}>
                <motion.path d={path("mobility")} fill="none" stroke={MUTED} strokeWidth={2.5} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: "easeInOut" }} />
                <motion.path d={path("pain")} fill="none" stroke={accent} strokeWidth={3} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: "easeInOut", delay: 0.15 }} />
            </svg>
            <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: MUTED }}>
                <span><span style={{ color: accent }}>Pain</span> gold</span>
                <span><span style={{ color: INK }}>Movement</span> light</span>
            </div>
        </div>
    )
}

// ---------- duties ----------
function Duties({ accent, duties, done, onComplete }: { accent: string; duties: { id: string; task: string; done: boolean }[]; done: number; onComplete: () => void }) {
    const pct = duties.length ? (done / duties.length) * 100 : 0
    return (
        <div>
            <div style={{ background: PANEL, border: "1px solid " + LINE, borderRadius: 16, padding: 16, marginBottom: 12 }}>
                <div style={{ color: accent, fontFamily: HEAD, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Your limit
                </div>
                <div style={{ marginTop: 4 }}>No lifting above shoulder height</div>
            </div>
            <div style={{ height: 8, borderRadius: 6, background: PANEL2, overflow: "hidden", marginBottom: 12 }}>
                <motion.div animate={{ width: pct + "%" }} transition={SPRING} style={{ height: "100%", background: accent }} />
            </div>
            {duties.map((d) => (
                <motion.div key={d.id} layout style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: PANEL, border: "1px solid " + LINE, borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
                    <motion.span animate={{ opacity: d.done ? 0.5 : 1 }} style={{ textDecoration: d.done ? "line-through" : "none" }}>
                        {d.task}
                    </motion.span>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => !d.done && onComplete()}
                        style={{ minHeight: 44, minWidth: 64, border: "1px solid " + LINE, borderRadius: 10, background: d.done ? "transparent" : accent, color: d.done ? MUTED : "#14100a", fontWeight: 600, cursor: "pointer", fontFamily: BODY }}
                    >
                        {d.done ? "Done" : "Mark"}
                    </motion.button>
                </motion.div>
            ))}
        </div>
    )
}

// ---------- tab bar ----------
function TabBar({ tab, setTab, accent }: { tab: string; setTab: (t: "today" | "trend" | "duties") => void; accent: string }) {
    const tabs: { id: "today" | "trend" | "duties"; label: string }[] = [
        { id: "today", label: "Today" },
        { id: "trend", label: "Trend" },
        { id: "duties", label: "Duties" },
    ]
    return (
        <div style={{ position: "relative", zIndex: 1, display: "flex", borderTop: "1px solid " + LINE, background: PANEL2 }}>
            {tabs.map((t) => (
                <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    style={{ position: "relative", flex: 1, minHeight: 52, border: "none", background: "transparent", color: tab === t.id ? accent : MUTED, fontFamily: HEAD, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                    {t.label}
                    {tab === t.id && (
                        <motion.div layoutId="inkbar" style={{ position: "absolute", top: 0, left: 16, right: 16, height: 2, borderRadius: 2, background: accent }} />
                    )}
                </button>
            ))}
        </div>
    )
}

addPropertyControls(ContinuumWorkerApp, {
    workerName: { type: ControlType.String, title: "Worker name", defaultValue: "Marcus" },
    bodyPart: { type: ControlType.String, title: "Body part", defaultValue: "Right shoulder" },
    startDay: { type: ControlType.Number, title: "Start day", defaultValue: 9, min: 1, max: 60, step: 1, displayStepper: true },
    prognosisDays: { type: ControlType.Number, title: "Prognosis days", defaultValue: 21, min: 1, max: 90, step: 1, displayStepper: true },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#C8972F" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#0E1B2C" },
    phoneFrame: { type: ControlType.Boolean, title: "Phone frame", defaultValue: true },
    startAtConsent: { type: ControlType.Boolean, title: "Start at consent", defaultValue: false },
    autoplay: { type: ControlType.Boolean, title: "Autoplay demo", defaultValue: false },
})
