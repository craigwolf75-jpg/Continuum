import { addPropertyControls, ControlType } from "framer"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useRef, useState, type CSSProperties } from "react"

// Continuum Worker App v4 (Prompt 12e). Self-contained Framer code component
// with an optional live data mode. Product-true behavior: twice-daily AM and
// PM check-ins, an optional note on every check-in, the full three-rule
// escalation engine (identical thresholds to the Prompt 08 app), duty feedback
// chips, and a More tab privacy center with consent revocation and reset. Live
// mode connects EXCLUSIVELY to a synthetic demo service (framer-demo); it never
// breaks when the service is down, it silently falls back to internal state.
// No storage, no SDKs; fetch is a browser global behind typeof window guards.
// Imports limited to react, framer, framer-motion. No em-dashes or en-dashes.

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
    dataSource: "demo" | "live"
    serviceUrl: string
    demoToken: string
    pollSeconds: number
    signInGate: boolean
    demoCode: string
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

// Red-flag note keywords. Identical set to the Prompt 08 app and mainline spec.
const KEYWORDS = ["numb", "tingling", "sharp", "worse at night", "cannot sleep"]

type Checkin = { day: number; period: "am" | "pm"; pain: number; mobility: number; note: string }

// The full three-rule escalation engine, evaluated on the check-in history.
// Rule 1: pain 8 or higher for three consecutive check-ins.
// Rule 2: mobility daily average declining across two or more days.
// Rule 3: a red-flag keyword in the latest note.
function evaluateEscalation(cs: Checkin[]): boolean {
    if (cs.length === 0) return false
    const last3 = cs.slice(-3)
    if (last3.length === 3 && last3.every((x) => x.pain >= 8)) return true
    const byDay: Record<number, number[]> = {}
    cs.forEach((x) => {
        ;(byDay[x.day] = byDay[x.day] || []).push(x.mobility)
    })
    const days = Object.keys(byDay)
        .map(Number)
        .sort((a, b) => a - b)
        .slice(-3)
    if (days.length === 3) {
        const avg = (d: number) => byDay[d].reduce((a, b) => a + b, 0) / byDay[d].length
        if (avg(days[0]) > avg(days[1]) && avg(days[1]) > avg(days[2])) return true
    }
    const lastNote = (cs[cs.length - 1].note || "").toLowerCase()
    if (KEYWORDS.some((k) => lastNote.includes(k))) return true
    return false
}

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

function formatPhone(d: string): string {
    const p = d.slice(0, 10)
    if (p.length === 0) return ""
    if (p.length <= 3) return "(" + p
    if (p.length <= 6) return "(" + p.slice(0, 3) + ") " + p.slice(3)
    return "(" + p.slice(0, 3) + ") " + p.slice(3, 6) + "-" + p.slice(6)
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
        dataSource = "demo",
        serviceUrl = "",
        demoToken = "",
        pollSeconds = 12,
        signInGate = true,
        demoCode = "",
    } = props

    const live = dataSource === "live" && serviceUrl.trim().length > 0

    const [consented, setConsented] = useState(!startAtConsent)
    const [signedIn, setSignedIn] = useState(false)
    const [tab, setTab] = useState<"today" | "trend" | "duties" | "more">("today")
    const [day, setDay] = useState(startDay)
    const [pain, setPain] = useState(3)
    const [mobility, setMobility] = useState(6)
    const [note, setNote] = useState("")
    const [amDone, setAmDone] = useState(false)
    const [pmDone, setPmDone] = useState(false)
    const [justSaved, setJustSaved] = useState(false)
    const [saved, setSaved] = useState(false)
    const [burst, setBurst] = useState(false)
    const [escalated, setEscalated] = useState(false)
    const [liveName, setLiveName] = useState<string | null>(null)
    const [liveBody, setLiveBody] = useState<string | null>(null)
    const [linkState, setLinkState] = useState<"linking" | "live" | "demo">("demo")
    const [checkins, setCheckins] = useState<Checkin[]>([
        { day: startDay - 4, period: "pm", pain: 7, mobility: 3, note: "" },
        { day: startDay - 3, period: "pm", pain: 6, mobility: 4, note: "" },
        { day: startDay - 2, period: "pm", pain: 6, mobility: 5, note: "" },
        { day: startDay - 1, period: "pm", pain: 5, mobility: 5, note: "" },
        { day: startDay, period: "am", pain: 4, mobility: 6, note: "" },
    ])
    const [duties, setDuties] = useState<{ id: string; task: string; done: boolean; feedback: string | null }[]>([
        { id: "d1", task: "Ground-level material staging", done: true, feedback: null },
        { id: "d2", task: "Tool crib inventory and tagging", done: false, feedback: null },
        { id: "d3", task: "Toolbox talk delivery", done: false, feedback: null },
    ])

    useEffect(() => {
        setConsented(!startAtConsent)
        setDay(startDay)
        setAmDone(false)
        setPmDone(false)
        setJustSaved(false)
        setEscalated(false)
    }, [startAtConsent, startDay])

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

    // ---- live data mode ----
    function endpoint(path: string): string {
        return serviceUrl.replace(/\/+$/, "") + path
    }
    function headers(): Record<string, string> {
        const h: Record<string, string> = { "Content-Type": "application/json" }
        if (demoToken) h["Authorization"] = "Bearer " + demoToken
        return h
    }
    // optimistic, fire and forget; a failure only drops the chip to fallback
    function post(path: string, body: Record<string, unknown>) {
        if (!live || typeof window === "undefined") return
        try {
            fetch(endpoint(path), { method: "POST", headers: headers(), body: JSON.stringify(body) }).catch(() =>
                setLinkState("demo")
            )
        } catch {
            setLinkState("demo")
        }
    }
    function applyState(s: any) {
        if (!s || typeof s !== "object") return
        if (typeof s.workerName === "string") setLiveName(s.workerName)
        if (typeof s.bodyPart === "string") setLiveBody(s.bodyPart)
        if (typeof s.day === "number") setDay(s.day)
        // checkedInToday maps to the AM window; forward-compatible AM and PM
        // fields are honored if the service ever sends them.
        if (typeof s.checkedInToday === "boolean") setAmDone(s.checkedInToday)
        if (typeof s.checkedInAM === "boolean") setAmDone(s.checkedInAM)
        if (typeof s.checkedInPM === "boolean") setPmDone(s.checkedInPM)
        if (typeof s.escalated === "boolean") setEscalated(s.escalated)
        if (Array.isArray(s.trend)) {
            const d = typeof s.day === "number" ? s.day : startDay
            setCheckins(
                s.trend.map((t: any, i: number) => ({
                    day: typeof t.day === "number" ? t.day : d - (s.trend.length - 1 - i),
                    period: t.period === "am" || t.period === "pm" ? t.period : "pm",
                    pain: Number(t.pain) || 0,
                    mobility: Number(t.mob) || 0,
                    note: typeof t.note === "string" ? t.note : "",
                }))
            )
        }
        if (Array.isArray(s.duties)) {
            setDuties(
                s.duties.map((x: any) => ({
                    id: String(x.id),
                    task: String(x.t ?? ""),
                    done: !!x.done,
                    feedback: typeof x.feedback === "string" ? x.feedback : null,
                }))
            )
        }
    }
    useEffect(() => {
        if (!live || typeof window === "undefined") {
            setLinkState("demo")
            return
        }
        let cancelled = false
        const ctrl = new AbortController()
        setLinkState("linking")
        async function pull() {
            try {
                const r = await fetch(endpoint("/state"), { headers: headers(), signal: ctrl.signal })
                if (!r.ok) throw new Error("bad")
                const s = await r.json()
                if (cancelled) return
                applyState(s)
                setLinkState("live")
            } catch {
                if (!cancelled) setLinkState("demo")
            }
        }
        pull()
        const secs = Math.min(60, Math.max(5, pollSeconds || 12))
        const iv = window.setInterval(pull, secs * 1000)
        return () => {
            cancelled = true
            ctrl.abort()
            window.clearInterval(iv)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [live, serviceUrl, demoToken, pollSeconds])

    const period: "am" | "pm" | null = !amDone ? "am" : !pmDone ? "pm" : null

    function submit() {
        if (!period) return
        const p = pain
        const m = mobility
        const n = note
        const entry: Checkin = { day, period, pain: p, mobility: m, note: n }
        const nextC = [...checkins, entry].slice(-16)
        setSaved(true)
        setBurst(true)
        setCheckins(nextC)
        later(() => {
            setSaved(false)
            setBurst(false)
            if (period === "am") setAmDone(true)
            else setPmDone(true)
            setJustSaved(true)
            setNote("")
            setPain(3)
            setMobility(6)
            if (evaluateEscalation(nextC)) setEscalated(true)
        }, 1050)
        post("/checkins", { pain: p, mob: m, note: n, period })
    }
    function revealPM() {
        setJustSaved(false)
    }
    function nextDay() {
        setDay((d) => d + 1)
        setAmDone(false)
        setPmDone(false)
        setJustSaved(false)
        setEscalated(false)
        setPain(3)
        setMobility(6)
        setNote("")
        post("/advance-day", {})
    }
    function completeDuty(id: string) {
        setDuties((ds) => ds.map((d) => (d.id === id ? { ...d, done: true } : d)))
        const numeric = Number(id)
        post("/duties/toggle", { id: Number.isNaN(numeric) ? id : numeric, done: true })
    }
    function setDutyFeedback(id: string, value: string) {
        setDuties((ds) => ds.map((d) => (d.id === id ? { ...d, feedback: value } : d)))
        const numeric = Number(id)
        post("/duties/feedback", { id: Number.isNaN(numeric) ? id : numeric, feedback: value })
    }
    function completeFirstDuty() {
        const first = duties.find((d) => !d.done)
        if (first) completeDuty(first.id)
    }
    function feedbackFirst(value: string) {
        const first = duties.find((d) => d.done && !d.feedback)
        if (first) setDutyFeedback(first.id, value)
    }
    function revoke() {
        setConsented(false)
        post("/consent", { granted: false })
    }
    function resetDemo() {
        setDay(startDay)
        setAmDone(false)
        setPmDone(false)
        setJustSaved(false)
        setEscalated(false)
        setPain(3)
        setMobility(6)
        setNote("")
        setTab("today")
        setCheckins([
            { day: startDay - 4, period: "pm", pain: 7, mobility: 3, note: "" },
            { day: startDay - 3, period: "pm", pain: 6, mobility: 4, note: "" },
            { day: startDay - 2, period: "pm", pain: 6, mobility: 5, note: "" },
            { day: startDay - 1, period: "pm", pain: 5, mobility: 5, note: "" },
            { day: startDay, period: "am", pain: 4, mobility: 6, note: "" },
        ])
        setDuties([
            { id: "d1", task: "Ground-level material staging", done: true, feedback: null },
            { id: "d2", task: "Tool crib inventory and tagging", done: false, feedback: null },
            { id: "d3", task: "Toolbox talk delivery", done: false, feedback: null },
        ])
    }

    const api = useRef({
        setPain,
        setMobility,
        setNote,
        submit,
        revealPM,
        setTab,
        completeFirstDuty,
        feedbackFirst,
        nextDay,
        setConsented,
        setSignedIn,
    })
    api.current = {
        setPain,
        setMobility,
        setNote,
        submit,
        revealPM,
        setTab,
        completeFirstDuty,
        feedbackFirst,
        nextDay,
        setConsented,
        setSignedIn,
    }
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
                a.setSignedIn(true)
                a.setConsented(true)
                a.setTab("today")
                a.setPain(5)
                a.setMobility(7)
                await wait(1000)
                if (cancelled) break
                a.submit()
                await wait(1700)
                if (cancelled) break
                a.revealPM()
                a.setPain(6)
                a.setMobility(6)
                a.setNote("felt sharp when reaching overhead")
                await wait(1100)
                if (cancelled) break
                a.submit()
                await wait(2200)
                if (cancelled) break
                a.setTab("trend")
                await wait(1500)
                if (cancelled) break
                a.setTab("duties")
                await wait(700)
                a.completeFirstDuty()
                await wait(900)
                a.feedbackFirst("Manageable")
                await wait(1400)
                if (cancelled) break
                a.setTab("more")
                await wait(1500)
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

    const firstName = (liveName || workerName || "there").split(" ")[0]
    const shownBody = liveBody || bodyPart
    const periodsCredit = (amDone ? 0.5 : 0) + (pmDone ? 0.5 : 0)
    const ringProgress = Math.min(1, (day - 1 + periodsCredit) / Math.max(1, prognosisDays))
    const statusChip = !amDone ? "AM check-in due" : !pmDone ? "PM check-in due" : "Checked in"

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
                {signInGate && !signedIn && !autoplay ? (
                    <SignIn key="signin" accent={accent} demoCode={demoCode} onDone={() => setSignedIn(true)} />
                ) : !consented ? (
                    <Consent key="consent" accent={accent} onAgree={() => setConsented(true)} />
                ) : (
                    <motion.div
                        key="app"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
                    >
                        <div style={{ padding: "20px 20px 8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 17 }}>
                                    Contin<span style={{ color: accent }}>uum</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <StatusChip label={statusChip} done={statusChip === "Checked in"} accent={accent} />
                                    {dataSource === "live" && <LinkChip state={linkState} accent={accent} />}
                                </div>
                            </div>
                            <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 24, marginTop: 6 }}>Hi {firstName}</div>
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
                                            bodyPart={shownBody}
                                            day={day}
                                            prognosis={prognosisDays}
                                            ringProgress={ringProgress}
                                            period={period}
                                            amDone={amDone}
                                            pmDone={pmDone}
                                            justSaved={justSaved}
                                            pain={pain}
                                            mobility={mobility}
                                            note={note}
                                            setPain={setPain}
                                            setMobility={setMobility}
                                            setNote={setNote}
                                            saved={saved}
                                            burst={burst}
                                            escalated={escalated}
                                            onSubmit={submit}
                                            onRevealPM={revealPM}
                                            onNextDay={nextDay}
                                        />
                                    )}
                                    {tab === "trend" && <Trend accent={accent} checkins={checkins} />}
                                    {tab === "duties" && (
                                        <Duties
                                            accent={accent}
                                            duties={duties}
                                            done={duties.filter((d) => d.done).length}
                                            onComplete={completeDuty}
                                            onFeedback={setDutyFeedback}
                                        />
                                    )}
                                    {tab === "more" && <More accent={accent} onRevoke={revoke} onReset={resetDemo} />}
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
                <div style={{ position: "relative", width: "100%", height: "100%", padding: 12, boxSizing: "border-box" }}>
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

function StatusChip({ label, done, accent }: { label: string; done: boolean; accent: string }) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontFamily: HEAD,
                fontWeight: 600,
                color: done ? accent : MUTED,
                border: "1px solid " + (done ? accent : LINE),
                borderRadius: 999,
                padding: "3px 9px",
            }}
        >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: done ? accent : MUTED }} />
            {label}
        </span>
    )
}

function LinkChip({ state, accent }: { state: "linking" | "live" | "demo"; accent: string }) {
    if (state === "linking") return <span style={{ fontSize: 11, color: MUTED }}>Linking</span>
    if (state === "live")
        return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: accent }}>
                <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: 7, height: 7, borderRadius: "50%", background: accent }}
                />
                Live
            </span>
        )
    return <span style={{ fontSize: 11, color: MUTED }}>Link unavailable</span>
}

function Orbs({ accent }: { accent: string }) {
    const orb = (c: string, x: number, y: number, s: number): CSSProperties => ({
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
                style={orb(accent, -40, 60, 260)}
                animate={{ x: [0, 40, -10, 0], y: [0, 30, -20, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                style={orb("#2E5A8C", 180, 520, 240)}
                animate={{ x: [0, -30, 20, 0], y: [0, -25, 15, 0] }}
                transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            />
        </div>
    )
}

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
            <div style={{ fontFamily: HEAD, fontSize: 26, fontWeight: 700, margin: "8px 0 18px" }}>Your privacy, in plain words</div>
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

const gInput: CSSProperties = { width: "100%", minHeight: 48, background: PANEL2, border: "1px solid " + LINE, borderRadius: 12, color: INK, fontFamily: BODY, fontSize: 17, padding: "0 14px", outline: "none", boxSizing: "border-box" }
const gBox: CSSProperties = { width: 44, height: 54, textAlign: "center", fontFamily: HEAD, fontSize: 22, fontWeight: 700, background: PANEL2, border: "1px solid " + LINE, borderRadius: 12, outline: "none" }
const gGhost: CSSProperties = { width: "100%", minHeight: 48, border: "1px solid " + LINE, borderRadius: 12, background: "transparent", color: INK, fontFamily: BODY, fontSize: 14, cursor: "pointer" }
function gBtn(accent: string): CSSProperties {
    return { width: "100%", minHeight: 48, border: "none", borderRadius: 12, background: accent, color: "#14100a", fontFamily: HEAD, fontWeight: 600, fontSize: 15 }
}

function Rule({ ok, label, accent }: { ok: boolean; label: string; accent: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: ok ? accent : MUTED, margin: "6px 0" }}>
            <motion.span
                animate={{ background: ok ? accent : "transparent", borderColor: ok ? accent : LINE }}
                style={{ width: 14, height: 14, borderRadius: "50%", border: "1px solid " + LINE, flex: "none" }}
            />
            {label}
        </div>
    )
}

function SignIn({ accent, demoCode, onDone }: { accent: string; demoCode: string; onDone: () => void }) {
    const [gstep, setGstep] = useState<"phone" | "code" | "password">("phone")
    const [digits, setDigits] = useState("")
    const [code, setCode] = useState<string[]>(["", "", "", "", "", ""])
    const [shaking, setShaking] = useState(false)
    const [pw, setPw] = useState("")
    const [burst, setBurst] = useState(false)
    const boxes = useRef<(HTMLInputElement | null)[]>([])

    function focusBox(i: number) {
        const el = boxes.current[i]
        if (el) el.focus()
    }
    function checkFull(next: string[]) {
        if (next.some((c) => c === "")) return
        const entered = next.join("")
        const req = demoCode.trim()
        if (req.length > 0 && entered !== req) {
            setShaking(true)
            if (typeof window !== "undefined") window.setTimeout(() => setShaking(false), 450)
            setCode(["", "", "", "", "", ""])
            focusBox(0)
            return
        }
        setGstep("password")
    }
    function onBoxChange(i: number, raw: string) {
        const only = raw.replace(/\D/g, "")
        if (only.length > 1) {
            const next = ["", "", "", "", "", ""]
            for (let j = 0; j < 6; j++) next[j] = only[j] ?? ""
            setCode(next)
            focusBox(Math.min(5, only.length - 1))
            checkFull(next)
            return
        }
        const next = code.slice()
        next[i] = only
        setCode(next)
        if (only && i < 5) focusBox(i + 1)
        checkFull(next)
    }
    function onBoxKey(i: number, key: string) {
        if (key === "Backspace" && code[i] === "" && i > 0) focusBox(i - 1)
    }

    const rLen = pw.length === 6
    const rCons = /[bcdfghjklmnpqrstvwxyz]/i.test(pw)
    const rSpec = /[^a-zA-Z0-9]/.test(pw)
    const allPass = rLen && rCons && rSpec
    function finish() {
        if (!allPass) return
        setBurst(true)
        if (typeof window !== "undefined") window.setTimeout(onDone, 850)
    }

    return (
        <motion.div
            key="signin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "relative", zIndex: 1, flex: 1, padding: 24, display: "flex", flexDirection: "column", justifyContent: "center" }}
        >
            <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
                Contin<span style={{ color: accent }}>uum</span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
                {gstep === "phone" && (
                    <motion.div key="p" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ type: "spring", stiffness: 320, damping: 32 }}>
                        <h1 style={{ fontFamily: HEAD, fontSize: 24, fontWeight: 700, margin: "6px 0" }}>Sign in to your recovery</h1>
                        <p style={{ color: MUTED, fontSize: 13.5, marginBottom: 14 }}>Enter your mobile number to get a code.</p>
                        <input
                            type="tel"
                            autoComplete="tel"
                            inputMode="numeric"
                            placeholder="(555) 555 5555"
                            value={formatPhone(digits)}
                            onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            style={gInput}
                        />
                        <button
                            disabled={digits.length < 10}
                            onClick={() => setGstep("code")}
                            style={{ ...gBtn(accent), opacity: digits.length < 10 ? 0.4 : 1, cursor: digits.length < 10 ? "not-allowed" : "pointer", marginTop: 14 }}
                        >
                            Text me a code
                        </button>
                        <p style={{ color: MUTED, fontSize: 11.5, marginTop: 14 }}>Demo sign-in. Nothing is sent or stored. Your number stays on this screen.</p>
                    </motion.div>
                )}
                {gstep === "code" && (
                    <motion.div key="c" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ type: "spring", stiffness: 320, damping: 32 }}>
                        <h1 style={{ fontFamily: HEAD, fontSize: 24, fontWeight: 700, margin: "6px 0" }}>Enter your code</h1>
                        <p style={{ color: MUTED, fontSize: 13.5, marginBottom: 14 }}>We sent a 6 digit code to {formatPhone(digits)}.</p>
                        <motion.div animate={shaking ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }} transition={{ duration: 0.45 }} style={{ display: "flex", gap: 7, justifyContent: "space-between" }}>
                            {code.map((c, i) => (
                                <motion.input
                                    key={i}
                                    ref={(el) => {
                                        boxes.current[i] = el
                                    }}
                                    value={c}
                                    onChange={(e) => onBoxChange(i, e.target.value)}
                                    onKeyDown={(e) => onBoxKey(i, e.key)}
                                    inputMode="numeric"
                                    maxLength={i === 0 ? 6 : 1}
                                    autoComplete={i === 0 ? "one-time-code" : "off"}
                                    animate={{ borderColor: c ? accent : LINE, color: c ? accent : INK, scale: c ? 1.04 : 1 }}
                                    transition={SPRING}
                                    style={gBox}
                                />
                            ))}
                        </motion.div>
                        <button onClick={() => setGstep("phone")} style={{ ...gGhost, marginTop: 14 }}>Use a different number</button>
                    </motion.div>
                )}
                {gstep === "password" && (
                    <motion.div key="w" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ type: "spring", stiffness: 320, damping: 32 }}>
                        <h1 style={{ fontFamily: HEAD, fontSize: 22, fontWeight: 700, margin: "6px 0" }}>Create your 6 character password</h1>
                        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="6 characters" style={gInput} />
                        <div style={{ margin: "12px 0 4px" }}>
                            <Rule ok={rLen} label="Exactly 6 characters" accent={accent} />
                            <Rule ok={rCons} label="At least one consonant" accent={accent} />
                            <Rule ok={rSpec} label="At least one special character" accent={accent} />
                        </div>
                        <div style={{ position: "relative" }}>
                            <button disabled={!allPass} onClick={finish} style={{ ...gBtn(accent), opacity: allPass ? 1 : 0.4, cursor: allPass ? "pointer" : "not-allowed", marginTop: 8 }}>Enter the app</button>
                            {burst && <Burst accent={accent} />}
                        </div>
                        <p style={{ color: MUTED, fontSize: 11.5, marginTop: 12 }}>Demo only. This password is never stored or sent.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

function Today(props: {
    accent: string
    bodyPart: string
    day: number
    prognosis: number
    ringProgress: number
    period: "am" | "pm" | null
    amDone: boolean
    pmDone: boolean
    justSaved: boolean
    pain: number
    mobility: number
    note: string
    setPain: (v: number) => void
    setMobility: (v: number) => void
    setNote: (v: string) => void
    saved: boolean
    burst: boolean
    escalated: boolean
    onSubmit: () => void
    onRevealPM: () => void
    onNextDay: () => void
}) {
    const {
        accent,
        bodyPart,
        day,
        prognosis,
        ringProgress,
        period,
        amDone,
        pmDone,
        justSaved,
        pain,
        mobility,
        note,
        setPain,
        setMobility,
        setNote,
        saved,
        burst,
        escalated,
        onSubmit,
        onRevealPM,
        onNextDay,
    } = props
    const showForm = !justSaved && period !== null
    const bothDone = amDone && pmDone
    const periodLabel = period === "am" ? "AM check-in" : "PM check-in"
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
                            <div style={{ color: accent, fontFamily: HEAD, fontWeight: 600, fontSize: 14 }}>Your care team is taking a closer look</div>
                            <div style={{ color: MUTED, fontSize: 12.5, marginTop: 4 }}>
                                Your recent check-ins asked for attention. Your clinician has been told. Keep checking in as normal.
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ background: PANEL, border: "1px solid " + LINE, borderRadius: 18, padding: 18, marginBottom: 14 }}>
                <div style={{ color: accent, fontFamily: HEAD, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>Your recovery</div>
                <div style={{ fontFamily: HEAD, fontSize: 18, fontWeight: 700, margin: "4px 0 12px" }}>{bodyPart} injury</div>
                <Ring progress={ringProgress} day={day} prognosis={prognosis} accent={accent} amDone={amDone} pmDone={pmDone} />
            </div>

            {showForm ? (
                <div style={{ background: PANEL, border: "1px solid " + LINE, borderRadius: 18, padding: 18 }}>
                    <div style={{ color: accent, fontFamily: HEAD, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>{periodLabel}</div>
                    <Slider label="How is your pain?" value={pain} onChange={setPain} accent={accent} fill={painColor(pain, accent)} />
                    <Slider label="How is your movement?" value={mobility} onChange={setMobility} accent={accent} fill={accent} />
                    <div style={{ margin: "14px 0 4px", fontWeight: 600, fontSize: 14 }}>Anything you want your clinician to know?</div>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Optional. A word or two is plenty."
                        rows={2}
                        style={{ width: "100%", background: PANEL2, border: "1px solid " + LINE, borderRadius: 12, color: INK, fontFamily: BODY, fontSize: 14, padding: 12, outline: "none", boxSizing: "border-box", resize: "none" }}
                    />
                    <div style={{ position: "relative", marginTop: 10 }}>
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
                                        Save {periodLabel}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                        {burst && <Burst accent={accent} />}
                    </div>
                    <div style={{ color: MUTED, fontSize: 11.5, marginTop: 8 }}>Only your clinician sees your scores and notes.</div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ background: PANEL, border: "1px solid " + LINE, borderRadius: 18, padding: 18 }}
                >
                    <div style={{ fontFamily: HEAD, fontWeight: 600 }}>{bothDone ? "All checked in today" : "AM check-in saved"}</div>
                    <div style={{ color: MUTED, fontSize: 12.5, marginTop: 4 }}>
                        {bothDone ? "Nice work. Move time forward to check in again." : "Nice work. Your evening check-in opens when you are ready."}
                    </div>
                    {bothDone ? (
                        <button
                            onClick={onNextDay}
                            style={{ marginTop: 12, minHeight: 44, width: "100%", border: "1px solid " + LINE, borderRadius: 12, background: "transparent", color: INK, cursor: "pointer", fontFamily: BODY }}
                        >
                            Next day
                        </button>
                    ) : (
                        <button
                            onClick={onRevealPM}
                            style={{ marginTop: 12, minHeight: 44, width: "100%", border: "none", borderRadius: 12, background: accent, color: "#14100a", cursor: "pointer", fontFamily: HEAD, fontWeight: 600 }}
                        >
                            PM check-in
                        </button>
                    )}
                </motion.div>
            )}
        </div>
    )
}

function Ring({ progress, day, prognosis, accent, amDone, pmDone }: { progress: number; day: number; prognosis: number; accent: string; amDone: boolean; pmDone: boolean }) {
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
                key={day + "" + amDone + pmDone}
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
        if (!el) return
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

function Trend({ accent, checkins }: { accent: string; checkins: Checkin[] }) {
    const w = 320
    const h = 120
    const n = Math.max(1, checkins.length - 1)
    const step = w / n
    const y = (v: number) => h - (v / 10) * h
    const path = (key: "pain" | "mobility") =>
        checkins.map((p, i) => (i ? "L" : "M") + (i * step).toFixed(1) + " " + y(p[key]).toFixed(1)).join(" ")
    return (
        <div style={{ background: PANEL, border: "1px solid " + LINE, borderRadius: 18, padding: 18 }}>
            <div style={{ color: accent, fontFamily: HEAD, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>Your trend</div>
            <div style={{ fontFamily: HEAD, fontWeight: 600, margin: "4px 0 12px" }}>Pain and movement over time</div>
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

function Duties({ accent, duties, done, onComplete, onFeedback }: { accent: string; duties: { id: string; task: string; done: boolean; feedback: string | null }[]; done: number; onComplete: (id: string) => void; onFeedback: (id: string, v: string) => void }) {
    const pct = duties.length ? (done / duties.length) * 100 : 0
    const chips = ["Fine", "Manageable", "Too much"]
    return (
        <div>
            <div style={{ background: PANEL, border: "1px solid " + LINE, borderRadius: 16, padding: 16, marginBottom: 12 }}>
                <div style={{ color: accent, fontFamily: HEAD, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>Your limit</div>
                <div style={{ marginTop: 4 }}>No lifting above shoulder height</div>
            </div>
            <div style={{ height: 8, borderRadius: 6, background: PANEL2, overflow: "hidden", marginBottom: 12 }}>
                <motion.div animate={{ width: pct + "%" }} transition={SPRING} style={{ height: "100%", background: accent }} />
            </div>
            {duties.map((d) => (
                <motion.div key={d.id} layout style={{ background: PANEL, border: "1px solid " + LINE, borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <motion.span animate={{ opacity: d.done ? 0.6 : 1 }} style={{ textDecoration: d.done ? "line-through" : "none" }}>
                            {d.task}
                        </motion.span>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => !d.done && onComplete(d.id)}
                            style={{ minHeight: 44, minWidth: 64, border: "1px solid " + LINE, borderRadius: 10, background: d.done ? "transparent" : accent, color: d.done ? MUTED : "#14100a", fontWeight: 600, cursor: d.done ? "default" : "pointer", fontFamily: BODY }}
                        >
                            {d.done ? "Done" : "Mark"}
                        </motion.button>
                    </div>
                    {d.done && !d.feedback && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ overflow: "hidden" }}>
                            <div style={{ color: MUTED, fontSize: 12, margin: "10px 0 6px" }}>How did it feel?</div>
                            <div style={{ display: "flex", gap: 8 }}>
                                {chips.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => onFeedback(d.id, c)}
                                        style={{ flex: 1, minHeight: 40, border: "1px solid " + LINE, borderRadius: 10, background: "transparent", color: INK, fontFamily: BODY, fontSize: 13, cursor: "pointer" }}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                    {d.done && d.feedback && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: accent, fontFamily: HEAD, fontSize: 12.5, marginTop: 10 }}>
                            You said {d.feedback}
                        </motion.div>
                    )}
                </motion.div>
            ))}
        </div>
    )
}

function More({ accent, onRevoke, onReset }: { accent: string; onRevoke: () => void; onReset: () => void }) {
    return (
        <div>
            <div style={{ background: PANEL, border: "1px solid " + LINE, borderRadius: 18, padding: 18, marginBottom: 12 }}>
                <div style={{ color: accent, fontFamily: HEAD, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>Privacy center</div>
                <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 18, margin: "4px 0 8px" }}>You are in control</div>
                <div style={{ color: MUTED, fontSize: 13.5, lineHeight: 1.5 }}>
                    Continuum manages your return to work. It is not your medical record. Your employer only ever sees what you can do at work, never your pain scores or notes.
                </div>
            </div>
            <div style={{ background: PANEL, border: "1px solid " + LINE, borderRadius: 16, padding: 16, marginBottom: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Revoke consent</div>
                <div style={{ color: MUTED, fontSize: 12.5, marginBottom: 12 }}>Stop all collection now. The app returns to the consent screen and nothing new is recorded.</div>
                <button
                    onClick={onRevoke}
                    style={{ width: "100%", minHeight: 46, border: "1px solid " + accent, borderRadius: 12, background: "transparent", color: accent, fontFamily: HEAD, fontWeight: 600, cursor: "pointer" }}
                >
                    Revoke consent
                </button>
            </div>
            <div style={{ background: PANEL, border: "1px solid " + LINE, borderRadius: 16, padding: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Reset demo</div>
                <div style={{ color: MUTED, fontSize: 12.5, marginBottom: 12 }}>Return this demo to its starting point.</div>
                <button
                    onClick={onReset}
                    style={{ width: "100%", minHeight: 46, border: "1px solid " + LINE, borderRadius: 12, background: "transparent", color: INK, fontFamily: BODY, fontSize: 14, cursor: "pointer" }}
                >
                    Reset demo
                </button>
            </div>
        </div>
    )
}

function TabBar({ tab, setTab, accent }: { tab: string; setTab: (t: "today" | "trend" | "duties" | "more") => void; accent: string }) {
    const tabs: { id: "today" | "trend" | "duties" | "more"; label: string }[] = [
        { id: "today", label: "Today" },
        { id: "trend", label: "Trend" },
        { id: "duties", label: "Duties" },
        { id: "more", label: "More" },
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
    signInGate: { type: ControlType.Boolean, title: "Sign-in gate", defaultValue: true },
    demoCode: { type: ControlType.String, title: "Demo code", defaultValue: "", placeholder: "blank accepts any code" },
    dataSource: {
        type: ControlType.Enum,
        title: "Data source",
        options: ["demo", "live"],
        optionTitles: ["Demo", "Live"],
        defaultValue: "demo",
        displaySegmentedControl: true,
    },
    serviceUrl: { type: ControlType.String, title: "Service URL", defaultValue: "", placeholder: "https://...functions/v1/framer-demo", hidden: (p: Props) => p.dataSource !== "live" },
    demoToken: { type: ControlType.String, title: "Demo token", defaultValue: "", obscured: true, hidden: (p: Props) => p.dataSource !== "live" },
    pollSeconds: { type: ControlType.Number, title: "Poll seconds", defaultValue: 12, min: 5, max: 60, step: 1, hidden: (p: Props) => p.dataSource !== "live" },
})
