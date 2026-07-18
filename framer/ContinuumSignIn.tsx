import { addPropertyControls, ControlType } from "framer"
import { motion, AnimatePresence } from "framer-motion"
import { useRef, useState, type CSSProperties } from "react"

// Continuum Sign-In connector (Prompt 12b). Single-file Framer code component.
// A DEMO sign-in: no message is sent, no account exists, no credential is
// collected or transmitted. The phone number lives only in component state and
// is never stored or posted. Real OTP auth is the mainline's job (Prompt 07.2).
// Imports limited to react, framer, framer-motion. No em-dashes or en-dashes.

interface Props {
    headline: string
    workerUrl: string
    buttonLabel: string
    hubUrl: string
    demoCode: string
    accent: string
    background: string
    cardFrame: boolean
    newTab: boolean
    style?: CSSProperties
}

const INK = "#E9EEF6"
const MUTED = "#9AA9BF"
const PANEL = "#16243B"
const PANEL2 = "#1C2C47"
const LINE = "#27395A"
const HEAD = '"Space Grotesk", system-ui, sans-serif'
const BODY = 'Inter, system-ui, sans-serif'
const SPRING = { type: "spring", stiffness: 480, damping: 30 } as const
const FONT_CSS =
    "@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');"

function formatPhone(d: string): string {
    const p = d.slice(0, 10)
    if (p.length === 0) return ""
    if (p.length <= 3) return "(" + p
    if (p.length <= 6) return "(" + p.slice(0, 3) + ") " + p.slice(3)
    return "(" + p.slice(0, 3) + ") " + p.slice(3, 6) + "-" + p.slice(6)
}

/**
 * Continuum Sign In
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 560
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ContinuumSignIn(props: Props) {
    const {
        headline = "Sign in to your recovery",
        workerUrl = "",
        buttonLabel = "Open your worker app",
        hubUrl = "",
        demoCode = "",
        accent = "#C8972F",
        background = "#0E1B2C",
        cardFrame = true,
        newTab = true,
    } = props

    const [step, setStep] = useState<"phone" | "code" | "done">("phone")
    const [digits, setDigits] = useState("")
    const [code, setCode] = useState<string[]>(["", "", "", "", "", ""])
    const [shaking, setShaking] = useState(false)
    const boxes = useRef<(HTMLInputElement | null)[]>([])
    const target = newTab ? "_blank" : "_self"

    function reset() {
        setStep("phone")
        setDigits("")
        setCode(["", "", "", "", "", ""])
        setShaking(false)
    }

    function focusBox(i: number) {
        const el = boxes.current[i]
        if (el) el.focus()
    }

    function checkFull(next: string[]) {
        if (next.some((c) => c === "")) return
        const entered = next.join("")
        const required = demoCode.trim()
        if (required.length > 0 && entered !== required) {
            setShaking(true)
            if (typeof window !== "undefined") window.setTimeout(() => setShaking(false), 450)
            setCode(["", "", "", "", "", ""])
            focusBox(0)
            return
        }
        setStep("done")
    }

    function onBoxChange(i: number, raw: string) {
        const only = raw.replace(/\D/g, "")
        if (only.length > 1) {
            // paste or one-time-code autofill: distribute from the first box
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

    const inner = (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: background,
                color: INK,
                fontFamily: BODY,
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Orbs accent={accent} />
            <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: 28 }}>
                <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 17, marginBottom: 4 }}>
                    Contin<span style={{ color: accent }}>uum</span>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                    {step === "phone" && (
                        <motion.div key="phone" initial={{ opacity: 0, x: 26 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -26 }} transition={{ type: "spring", stiffness: 320, damping: 32 }}>
                            <h1 style={{ fontFamily: HEAD, fontSize: 24, fontWeight: 700, margin: "6px 0 6px" }}>{headline}</h1>
                            <p style={{ color: MUTED, fontSize: 13.5, marginBottom: 16 }}>Enter your mobile number to get a one time code.</p>
                            <input
                                type="tel"
                                autoComplete="tel"
                                inputMode="numeric"
                                placeholder="(555) 555 5555"
                                value={formatPhone(digits)}
                                onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                style={inputStyle}
                            />
                            <motion.button
                                whileHover={{ scale: digits.length === 10 ? 1.02 : 1 }}
                                whileTap={{ scale: digits.length === 10 ? 0.97 : 1 }}
                                disabled={digits.length < 10}
                                onClick={() => setStep("code")}
                                style={{ ...btnStyle(accent), opacity: digits.length < 10 ? 0.4 : 1, cursor: digits.length < 10 ? "not-allowed" : "pointer", marginTop: 14 }}
                            >
                                Send me a code
                            </motion.button>
                            <p style={{ color: MUTED, fontSize: 11.5, marginTop: 14 }}>This is a demo. No message is sent and no account is created. Your number stays on this screen.</p>
                        </motion.div>
                    )}

                    {step === "code" && (
                        <motion.div key="code" initial={{ opacity: 0, x: 26 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -26 }} transition={{ type: "spring", stiffness: 320, damping: 32 }}>
                            <h1 style={{ fontFamily: HEAD, fontSize: 24, fontWeight: 700, margin: "6px 0 6px" }}>Enter your code</h1>
                            <p style={{ color: MUTED, fontSize: 13.5, marginBottom: 16 }}>We sent a 6 digit code to {formatPhone(digits)}.</p>
                            <motion.div animate={shaking ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }} transition={{ duration: 0.45 }} style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
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
                                        style={{
                                            width: 46,
                                            height: 56,
                                            textAlign: "center",
                                            fontFamily: HEAD,
                                            fontSize: 22,
                                            fontWeight: 700,
                                            background: PANEL2,
                                            border: "1px solid " + LINE,
                                            borderRadius: 12,
                                            outline: "none",
                                        }}
                                    />
                                ))}
                            </motion.div>
                            <button onClick={() => setStep("phone")} style={{ ...ghostStyle, marginTop: 16 }}>Use a different number</button>
                            <p style={{ color: MUTED, fontSize: 11.5, marginTop: 12 }}>Demo only. No real code is checked unless the site owner set one.</p>
                        </motion.div>
                    )}

                    {step === "done" && (
                        <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center" }}>
                            <div style={{ position: "relative", width: 72, height: 72, margin: "0 auto 12px" }}>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={SPRING}
                                    style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(200,151,47,0.12)", border: "2px solid " + accent, display: "flex", alignItems: "center", justifyContent: "center" }}
                                >
                                    <svg width={34} height={34} viewBox="0 0 34 34">
                                        <motion.path d="M8 17 L15 24 L26 10" fill="none" stroke={accent} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.1 }} />
                                    </svg>
                                </motion.div>
                                <Burst accent={accent} />
                            </div>
                            <h1 style={{ fontFamily: HEAD, fontSize: 22, fontWeight: 700, margin: "4px 0 6px" }}>You are in</h1>
                            <p style={{ color: MUTED, fontSize: 13.5, marginBottom: 18 }}>Open the worker app to see your recovery.</p>
                            <motion.a
                                href={workerUrl || "#"}
                                target={target}
                                rel="noopener noreferrer"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1, boxShadow: ["0 0 0 rgba(200,151,47,0.0)", "0 0 22px rgba(200,151,47,0.5)", "0 0 0 rgba(200,151,47,0.0)"] }}
                                transition={{ scale: SPRING, opacity: { duration: 0.3 }, boxShadow: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } }}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                style={{ ...btnStyle(accent), display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                            >
                                {buttonLabel}
                            </motion.a>
                            {hubUrl.trim().length > 0 && (
                                <a href={hubUrl} target={target} rel="noopener noreferrer" style={{ display: "block", marginTop: 14, color: MUTED, fontSize: 13, textDecoration: "none" }}>
                                    Employer or clinic? Open the hub
                                </a>
                            )}
                            <button onClick={reset} style={{ ...ghostStyle, marginTop: 14 }}>Start over</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )

    return (
        <div style={{ position: "relative", width: 400, height: 560, ...props.style, overflow: "hidden", background: background, fontFamily: BODY }}>
            <style>{FONT_CSS}</style>
            {cardFrame ? (
                <div style={{ position: "relative", width: "100%", height: "100%", padding: 12, boxSizing: "border-box" }}>
                    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 24, border: "1px solid " + LINE, overflow: "hidden", boxShadow: "0 30px 70px rgba(0,0,0,0.5)" }}>{inner}</div>
                </div>
            ) : (
                inner
            )}
        </div>
    )
}

const inputStyle: CSSProperties = {
    width: "100%",
    minHeight: 48,
    background: PANEL2,
    border: "1px solid " + LINE,
    borderRadius: 12,
    color: INK,
    fontFamily: BODY,
    fontSize: 17,
    padding: "0 14px",
    outline: "none",
    boxSizing: "border-box",
}
function btnStyle(accent: string): CSSProperties {
    return { width: "100%", minHeight: 48, border: "none", borderRadius: 12, background: accent, color: "#14100a", fontFamily: HEAD, fontWeight: 600, fontSize: 15, cursor: "pointer" }
}
const ghostStyle: CSSProperties = {
    width: "100%",
    minHeight: 48,
    border: "1px solid " + LINE,
    borderRadius: 12,
    background: "transparent",
    color: INK,
    fontFamily: BODY,
    fontSize: 14,
    cursor: "pointer",
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
            <motion.div style={orb(accent, -50, 40, 240)} animate={{ x: [0, 40, -10, 0], y: [0, 30, -20, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
            <motion.div style={orb("#2E5A8C", 200, 340, 220)} animate={{ x: [0, -30, 20, 0], y: [0, -25, 15, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} />
        </div>
    )
}

function Burst({ accent }: { accent: string }) {
    const parts = Array.from({ length: 12 }, (_, i) => i)
    return (
        <div style={{ position: "absolute", left: "50%", top: "50%", pointerEvents: "none" }}>
            {parts.map((i) => {
                const a = (i / parts.length) * Math.PI * 2
                return (
                    <motion.div
                        key={i}
                        initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                        animate={{ x: Math.cos(a) * 56, y: Math.sin(a) * 56, opacity: 0, scale: 0.3 }}
                        transition={{ duration: 0.85, ease: "easeOut", delay: 0.1 }}
                        style={{ position: "absolute", width: 7, height: 7, marginLeft: -3.5, marginTop: -3.5, borderRadius: "50%", background: accent }}
                    />
                )
            })}
        </div>
    )
}

addPropertyControls(ContinuumSignIn, {
    headline: { type: ControlType.String, title: "Headline", defaultValue: "Sign in to your recovery" },
    workerUrl: { type: ControlType.Link, title: "Worker app URL" },
    buttonLabel: { type: ControlType.String, title: "Button label", defaultValue: "Open your worker app" },
    hubUrl: { type: ControlType.Link, title: "Hub URL" },
    demoCode: { type: ControlType.String, title: "Demo code", defaultValue: "", placeholder: "blank accepts any code" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#C8972F" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#0E1B2C" },
    cardFrame: { type: ControlType.Boolean, title: "Card frame", defaultValue: true },
    newTab: { type: ControlType.Boolean, title: "Open in new tab", defaultValue: true },
})
