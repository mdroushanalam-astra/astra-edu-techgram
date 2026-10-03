/**
 * SESSION v5.1 [the Neon Workspace, locked stage] — the founder's art is the
 * room. A fixed-aspect stage (1665:937, the art's own ratio) guarantees every
 * overlay sits EXACTLY on the painted glass panels at any window size.
 * Letterboxed in obsidian when the window ratio differs.
 * All sizes in vw-of-stage via a --u unit so nothing shrinks or drifts.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { TeachingMove, StudentEvent } from "@techgram/kernel";
import { reportConcept } from "@techgram/kernel";
import { askNext, answerCurrent, emitAgency, model, conceptRows, type SanctuaryState } from "../kernel/adapter.js";
import { probeVoiceOut, speak, stopSpeaking, type VoiceOut } from "../voice/tts.js";
import { ThinkingBrain } from "../art/Board.js";

const THINK = ["Analyzing your answer…", "Updating belief state…", "Checking misconceptions…", "Selecting next question…", "Preparing explanation…"];
const ART_W = 1665, ART_H = 937;

export function SessionV5({ sanct, onEnd, profileName }: {
  sanct: SanctuaryState; onEnd: (events: StudentEvent[]) => void; profileName: string;
}) {
  const sanctRef = useRef(sanct);
  const moveRef = useRef<TeachingMove | null>(null);
  const [phase, setPhase] = useState<"live" | "thinking">("live");
  const [thinkStep, setThinkStep] = useState(0);
  const [bubble, setBubble] = useState("Let's figure this out together. Where do you think the process is most influenced by the slope change?");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [showAllEv, setShowAllEv] = useState(false);
  const [secs, setSecs] = useState(40 * 60);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [listening, setListening] = useState(false);
  const [typedOpen, setTypedOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [boardMode, setBoardMode] = useState("pen");
  const [tState, setTState] = useState<"speaking" | "thinking" | "listening">("speaking");
  const voice = useMemo<VoiceOut>(() => probeVoiceOut(), []);
  const rows = useMemo(() => conceptRows(sanct.sys.belief), []);
  const bandBefore = useRef({ v: 0, ok: false }) as React.MutableRefObject<{ v: number; ok: boolean }>;
  const timers = useRef<number[]>([]) as React.MutableRefObject<number[]>;

  // ── blackboard canvas ──
  const boardRef = useRef<HTMLCanvasElement>(null) as React.MutableRefObject<HTMLCanvasElement | null>;
  const drawing = useRef(false) as React.MutableRefObject<boolean>;
  const strokes = useRef<{ x: number; y: number }[][]>([]) as React.MutableRefObject<{ x: number; y: number }[][]>;
  function drawAll() {
    const cv = boardRef.current; if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(191,232,255,0.92)"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.shadowColor = "rgba(110,219,255,0.5)"; ctx.shadowBlur = 5;
    for (const st of strokes.current) {
      if (st.length < 2) continue;
      ctx.beginPath();
      st.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    }
  }
  const pos = (e: React.PointerEvent) => {
    const r = boardRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e: React.PointerEvent) => {
    if (boardMode !== "pen") return;
    drawing.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    strokes.current.push([pos(e)]);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    strokes.current[strokes.current.length - 1]!.push(pos(e));
    drawAll();
  };
  const up = () => { drawing.current = false; };

  // ── the kernel loop ──
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  function deliver(m: TeachingMove) {
    moveRef.current = m;
    setBubble(m.utterance && m.utterance.trim() ? m.utterance : m.item?.stem ?? "…");
    setTState("speaking");
    if (m.item) {
      const ci = model.index.get(m.conceptId);
      if (ci !== undefined) bandBefore.current = { v: reportConcept(model, sanctRef.current.sys.belief, m.conceptId).mean, ok: true };
      emitAgency(sanctRef.current, "retrieval_selection", "accepted_recommendation");
    }
    speak(voice, m.utterance || m.item?.stem || "", { onEnd: () => setTState("listening") });
  }
  function next() {
    const t = askNext(sanctRef.current);
    if (t.done) { setTState("speaking"); setBubble("We're done for today — Astra is waiting at the room with your summary."); return; }
    deliver(t.move!);
  }
  useEffect(() => { next(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => () => { timers.current.forEach((t) => clearTimeout(t)); stopSpeaking(); }, []);

  function onAnswer(choice: number) {
    const m = moveRef.current;
    if (!m?.item) return;
    setPhase("thinking"); setThinkStep(0); setEvidence([]); setTState("thinking");
    const before = bandBefore.current;
    answerCurrent(sanctRef.current, m, choice, 2);
    THINK.forEach((_, i) => timers.current.push(window.setTimeout(() => setThinkStep(i + 1), 520 * (i + 1))));
    timers.current.push(window.setTimeout(() => {
      const after = reportConcept(model, sanctRef.current.sys.belief, m.conceptId).mean;
      const ev: string[] = [];
      if (before.ok) ev.push(`Confidence updated ${before.v.toFixed(2)} → ${after.toFixed(2)}`);
      const correct = choice === m.item!.answer;
      ev.push(correct ? "Belief updated — consistent with prediction" : `Misconception candidate: ${m.conceptId.replace(/^c_/, "").replace(/_/g, " ")} stage`);
      ev.push("Memory check scheduled in 3 days");
      setEvidence(ev);
      setPhase("live"); setTState("speaking");
      setBubble(correct ? "Good — that lands. Watch what happens on the board." : "Interesting. This is exactly the link we keep losing — look at the board.");
      timers.current.push(window.setTimeout(next, 1900));
    }, 520 * THINK.length + 700));
  }

  useEffect(() => {
    const iv = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(iv);
  }, []);
  const total = 40 * 60;
  const frac = secs / total;
  const low = secs < 5 * 60;
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const CIRC = 2 * Math.PI * 15;

  const m = moveRef.current;
  const steps = [
    { t: "Retrieval Practice", s: "done", m: "5 min" },
    { t: "Concept Repair", s: ["EXPLAIN", "WORKED_EXAMPLE", "CONTRAST", "DIAGNOSTIC_PROBE", "MEMORY_OPEN", "HINT_L1", "HINT_L2", "HINT_L3"].includes(m?.move ?? "") ? "now" : "next", m: "18 min" },
    { t: "Guided Application", s: "next", m: "10 min" },
    { t: "Independent Recall", s: "next", m: "7 min" },
  ] as { t: string; s: string; m: string }[];

  /* ZONES — percentages of the locked stage; the art's panels live exactly here */
  const Z: Record<string, React.CSSProperties> = {
    ctx:      { position: "absolute", left: "2.1%",  top: "3%",    width: "64.5%", height: "6.6%" },
    viz:      { position: "absolute", left: "68.4%", top: "3%",    width: "14.6%", height: "6.6%" },
    timer:    { position: "absolute", left: "84.2%", top: "3.2%",  width: "3.2%",  height: "6.2%" },
    timerText:{ position: "absolute", left: "83.4%", top: "10%",   width: "5%",    height: "3.5%" },
    utils:    { position: "absolute", left: "88.6%", top: "3%",    width: "7.2%",  height: "6.6%" },
    end:      { position: "absolute", left: "95.8%", top: "2.6%",  width: "3.9%",  height: "7.4%" },
    teacher:  { position: "absolute", left: "1.2%",  top: "11%",   width: "22.6%", height: "58.5%" },
    board:    { position: "absolute", left: "25.4%", top: "10.8%", width: "53%",   height: "58.6%" },
    why:      { position: "absolute", left: "79.6%", top: "11%",   width: "19.6%", height: "24.5%" },
    understand:{ position: "absolute", left: "79.6%", top: "37.5%", width: "19.6%", height: "26.5%" },
    plan:     { position: "absolute", left: "79.6%", top: "65.5%", width: "19.6%", height: "25.5%" },
    evidence: { position: "absolute", left: "2.1%",  top: "71.5%", width: "75.4%", height: "11%" },
    student:  { position: "absolute", left: "0.4%",  top: "84.5%", width: "3.4%",  height: "12.5%" },
    controls: { position: "absolute", left: "4.4%",  top: "84.5%", width: "74%",   height: "12.5%" },
    typed:    { position: "absolute", left: "26%",   top: "63%",   width: "48%",   height: "6%" },
    tstatus:  { position: "absolute", left: "84.2%", top: "86%",   width: "15%",   height: "9%" },
  };

  return (
    <div style={{ height: "100vh", background: "var(--obsidian)", display: "grid", placeItems: "center", overflow: "hidden" }}>
      {/* THE STAGE — locked to the art's aspect ratio */}
      <div className="s5stage" style={{
        position: "relative", width: "100%", height: "100%",
        maxWidth: `calc(100vh * ${ART_W / ART_H})`, maxHeight: `calc(100vw * ${ART_H / ART_W})`,
        fontSize: "calc(100vh * 0.0135)",
      }}>
        <img src="/session-bg.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} draggable={false} />

        {/* ═══ 1. TOP CONTEXT BAR ═══ */}
        <div style={{ ...Z.ctx, display: "flex", alignItems: "center", gap: "0.8vw", padding: "0 0.9vw" }}>
          <button className="zonebtn" style={{ padding: "0.35vw 0.7vw" }} onClick={() => onEnd(sanctRef.current.events)}>←</button>
          <span style={{ fontSize: "1vw", fontWeight: 600, whiteSpace: "nowrap" }}>Session · Geomorphology · River Systems</span>
          <span className="zchip" style={{ fontSize: "0.62vw" }}>Class 8 · Geography</span>
          <span className="zchip" style={{ fontSize: "0.62vw" }}>● Connection: on-device</span>
        </div>
        {/* ═══ 2. AUDIO VISUALIZER ═══ */}
        <div style={{ ...Z.viz, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.18vw", opacity: tState === "speaking" ? 1 : 0.4, transition: "opacity 500ms" }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <i key={i} className="zwave" style={{ animationDelay: `${i * 0.08}s`, background: listening ? "var(--amber)" : tState === "thinking" ? "#9d7bff" : "#4dd8ff" }} />
          ))}
        </div>
        {/* ═══ 3. SESSION TIMER ═══ */}
        <div style={{ ...Z.timer, display: "grid", placeItems: "center" }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "1" }}>
            <svg width="100%" height="100%" viewBox="0 0 44 44" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="22" cy="22" r="15" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
              <circle cx="22" cy="22" r="15" fill="none" stroke={low ? "#ef4444" : "#4dd8ff"} strokeWidth="3" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - frac)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear, stroke 400ms" }} />
            </svg>
            <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", font: "600 0.55vw var(--font-m)", color: low ? "#ef4444" : "var(--ink)" }}>{mm}</span>
          </div>
        </div>
        <div style={{ ...Z.timerText, display: "grid", placeItems: "center" }}>
          <span style={{ font: "500 0.72vw var(--font-m)", color: low ? "#ef4444" : "var(--ink-2)" }}>{mm}:{ss} / 40:00</span>
        </div>
        {/* ═══ 4. UTILITY ACTIONS ═══ */}
        <div style={{ ...Z.utils, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6vw" }}>
          {["⛶", "▦", "⚙"].map((q, i) => (
            <button key={i} className="zonebtn" style={{ padding: "0.35vw 0.55vw", fontSize: "0.85vw" }} title={["Fullscreen", "Board view", "Session settings"][i]}
              onClick={() => { if (i === 0) document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }}>{q}</button>
          ))}
        </div>
        {/* ═══ 5. END SESSION ═══ */}
        <div style={{ ...Z.end, display: "grid", placeItems: "center" }}>
          <button className="zonebtn" style={{ color: "#ff6b81", borderColor: "rgba(255,107,129,0.55)", width: "88%", height: "64%", fontSize: "0.62vw", justifyContent: "center" }} onClick={() => setConfirmEnd(true)}>End Session</button>
        </div>

        {/* ═══ 6. TEACHER AVATAR AREA ═══ */}
        <div style={{ ...Z.teacher, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "1vh", padding: "0 0.4vw 1vh" }}>
          <div className="zbubble" style={{ fontSize: "0.9vw" }}>{bubble}</div>
          <div style={{ height: "17%", borderRadius: "0.5vw", border: "1px dashed rgba(110,219,255,0.3)", display: "grid", placeItems: "center", background: "rgba(6,10,20,0.2)" }}>
            <span className="mono" style={{ fontSize: "0.52vw", color: "var(--ink-3)", textAlign: "center" }}>3D TEACHER AVATAR — SLOT RESERVED</span>
          </div>
        </div>

        {/* ═══ 7. INTERACTIVE BLACKBOARD + tools rail ═══ */}
        <div style={{ ...Z.board, display: "flex" }}>
          <canvas
            ref={(cv) => { boardRef.current = cv; if (cv) requestAnimationFrame(drawAll); }}
            style={{ flex: 1, cursor: boardMode === "pen" ? "crosshair" : "default", touchAction: "none" }}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
          />
          <div style={{ width: "6%", display: "flex", flexDirection: "column", gap: "0.4vw", padding: "0.6vw 0.3vw", borderLeft: "1px solid rgba(110,219,255,0.15)", background: "rgba(4,10,18,0.35)" }}>
            {[["✎", "pen"], ["△", "shapes"], ["T", "text"]].map(([t, k]) => (
              <button key={k} className="zonebtn" style={{ padding: "0.4vw 0", justifyContent: "center", color: boardMode === k ? "var(--cyan)" : undefined }} onClick={() => setBoardMode(k)}>{t}</button>
            ))}
            <button className="zonebtn" style={{ padding: "0.4vw 0", justifyContent: "center" }} onClick={() => { strokes.current = []; drawAll(); }}>↺</button>
          </div>
        </div>

        {/* ═══ 8. WHY THIS QUESTION ═══ */}
        <div style={{ ...Z.why, display: "flex", flexDirection: "column", gap: "0.7vh", padding: "1.2vh 0.9vw", overflow: "hidden" }}>
          <b style={{ fontSize: "0.92vw" }}>Why this question?</b>
          <div className="whisper" style={{ fontSize: "0.66vw" }}>Real kernel reasoning — updates with every question.</div>
          <div style={{ fontSize: "0.78vw", color: "var(--ink-2)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" as never }}>
            {m?.why ? m.why : "the brain is choosing the highest-information question…"}
          </div>
        </div>
        {/* ═══ 9. CURRENT UNDERSTANDING ═══ */}
        <div style={{ ...Z.understand, display: "flex", flexDirection: "column", gap: "0.6vh", padding: "1.2vh 0.9vw", overflow: "hidden" }}>
          <b style={{ fontSize: "0.92vw" }}>Current understanding</b>
          {rows.slice(0, 4).map((r) => {
            const st = r.grey ? { c: "#fbbf24", t: "Uncertain" } : r.mean >= 0.65 ? { c: "#4ade80", t: "Strong" } : { c: "#4dd8ff", t: "Developing" };
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "0.4vw" }}>
                <span style={{ fontSize: "0.74vw", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
                <span style={{ width: "24%", height: "0.45vh", borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", flexShrink: 0 }}>
                  <i style={{ display: "block", height: "100%", width: `${Math.max(10, r.mean * 100)}%`, background: st.c }} />
                </span>
                <span style={{ fontSize: "0.62vw", color: st.c, minWidth: "3.6vw", textAlign: "right" }}>{st.t}</span>
              </div>
            );
          })}
        </div>
        {/* ═══ 10. SESSION STATE / PLAN ═══ */}
        <div style={{ ...Z.plan, display: "flex", flexDirection: "column", gap: "0.38vh", padding: "1vh 0.9vw", overflow: "hidden" }}>
          <b style={{ fontSize: "0.88vw" }}>Session state</b>
          {steps.map((sg, i) => (
            <div key={sg.t} style={{ display: "flex", gap: "0.45vw", alignItems: "center", padding: "0.38vh 0.5vw", borderRadius: "0.35vw", border: sg.s === "now" ? "1px solid rgba(110,219,255,0.45)" : "1px solid rgba(255,255,255,0.08)", background: sg.s === "now" ? "rgba(110,219,255,0.07)" : "transparent" }}>
              <span style={{ width: "1.05vw", height: "1.05vw", borderRadius: "50%", display: "grid", placeItems: "center", fontSize: "0.58vw", flexShrink: 0, border: `1.5px solid ${sg.s === "done" ? "#4ade80" : sg.s === "now" ? "#4dd8ff" : "rgba(255,255,255,0.2)"}`, color: sg.s === "done" ? "#4ade80" : sg.s === "now" ? "#4dd8ff" : "var(--ink-3)" }}>{sg.s === "done" ? "✓" : i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.76vw", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sg.t}</div>
                <div className="whisper" style={{ fontSize: "0.6vw" }}>{sg.s === "now" ? "In progress" : sg.s === "done" ? "Completed" : "Upcoming"} · {sg.m}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ 11. LIVE EVIDENCE STRIP ═══ */}
        <div style={{ ...Z.evidence, display: "flex", flexDirection: "column", justifyContent: "center", gap: "0.45vh", padding: "0 1.1vw", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.55vw" }}>
            <span className="mono" style={{ fontSize: "0.55vw", color: "var(--ink-3)", flexShrink: 0 }}>LIVE EVIDENCE</span>
            {evidence.length === 0 && <span className="whisper" style={{ fontSize: "0.68vw" }}>from your answer: analyzing → belief update → misconception → memory check</span>}
            {(showAllEv ? evidence : evidence.slice(-3)).map((e, i) => (
              <span key={i} className="zchip" style={{ fontSize: "0.58vw", color: "var(--cyan)", borderColor: "rgba(110,219,255,0.35)", flexShrink: 0 }}>{e}</span>
            ))}
            {evidence.length > 3 && <button className="zchip" style={{ fontSize: "0.58vw", color: "var(--amber)", borderColor: "rgba(255,180,92,0.4)", flexShrink: 0, cursor: "pointer" }} onClick={() => setShowAllEv(!showAllEv)}>{showAllEv ? "show less" : "show more"}</button>}
          </div>
        </div>

        {/* ═══ 12. STUDENT PRESENCE ═══ */}
        <div style={{ ...Z.student, display: "grid", placeItems: "center" }}>
          <div style={{
            width: "58%", aspectRatio: "1", borderRadius: "50%",
            background: "linear-gradient(135deg, var(--amber-deep), #8b5cf6)",
            display: "grid", placeItems: "center", color: "#0a0a0a", fontWeight: 700, fontSize: "0.9vw",
            opacity: listening ? 1 : 0.6, boxShadow: listening ? "0 0 22px rgba(245,158,11,0.5)" : "none",
            transition: "all 300ms",
          }}>{profileName[0]}</div>
        </div>

        {/* ═══ 13. INPUT CONTROLS ═══ */}
        <div style={{ ...Z.controls, display: "flex", alignItems: "center", justifyContent: "space-around" }}>
          <button className="zonebtn" style={{ fontSize: "0.72vw" }}>🎙 Mute</button>
          <button className="zonebtn" style={{ fontSize: "0.72vw" }} onClick={stopSpeaking}>⏹ Turn Off</button>
          <div style={{ textAlign: "center", marginTop: "-1vw" }}>
            <button className="micbtn5" style={{ width: "3.4vw", height: "3.4vw" }} onMouseDown={() => setListening(true)} onMouseUp={() => { setListening(false); setTypedOpen(true); }} onTouchStart={() => setListening(true)} onTouchEnd={() => setListening(false)}>
              <svg width="45%" height="45%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
            </button>
            <div className="mono" style={{ fontSize: "0.55vw", color: "var(--cyan)", marginTop: "0.25vw" }}>HOLD TO SPEAK</div>
          </div>
          <button className="zonebtn" style={{ fontSize: "0.72vw" }} onClick={() => setTypedOpen(!typedOpen)}>⌨ Type instead</button>
          <button className="zonebtn" style={{ fontSize: "0.72vw" }} onClick={() => setBubble("Good — uncertainty is evidence too. Eliminate one wrong option first.")}>? I'm not sure</button>
          <button className="zonebtn" style={{ fontSize: "0.72vw" }} onClick={() => setBubble("Good doubt — parked in your notebook, answered from verified material only.")}>💬 Ask doubt</button>
        </div>
        {typedOpen && (
          <div style={{ ...Z.typed, display: "flex", gap: "0.5vw", alignItems: "center", padding: "0 0.9vw", background: "rgba(6,12,22,0.75)", borderRadius: "0.5vw", border: "1px solid rgba(110,219,255,0.3)", zIndex: 40 }}>
            <span className="whisper" style={{ fontSize: "0.68vw", flexShrink: 0 }}>I heard:</span>
            <input className="inp4" style={{ flex: 1, background: "transparent", border: "none" }} autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="type your answer…" />
            <button className="zchip" style={{ color: "var(--cyan)", borderColor: "rgba(110,219,255,0.4)", cursor: "pointer" }} onClick={() => { setTypedOpen(false); setTyped(""); setTState("thinking"); later(() => { setTState("speaking"); setBubble("Noted — let's test that on the board."); }, 1500); }}>Send</button>
          </div>
        )}

        {/* ═══ 14. TEACHER STATUS ═══ */}
        <div style={{ ...Z.tstatus, display: "flex", alignItems: "center", gap: "0.45vw", padding: "0 0.7vw" }}>
          <span className="wave">{[0, 1, 2, 3].map((i) => <i key={i} style={{ animationDelay: `${i * 0.13}s`, background: tState === "thinking" ? "#9d7bff" : tState === "listening" ? "var(--amber)" : "#4dd8ff", opacity: tState === "speaking" || tState === "listening" ? 1 : 0.35 }} />)}</span>
          <span className="mono" style={{ fontSize: "0.52vw", color: tState === "thinking" ? "#9d7bff" : tState === "listening" ? "var(--amber)" : "var(--cyan)" }}>
            {tState === "speaking" ? "TEACHER SPEAKING" : tState === "thinking" ? "TEACHER THINKING" : tState === "listening" ? "TEACHER LISTENING" : "IDLE"}
          </span>
        </div>
      </div>

      {/* thinking overlay */}
      {phase === "thinking" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(4,6,10,0.8)", display: "grid", placeItems: "center", backdropFilter: "blur(5px)" }}>
          <div className="panel4 raised" style={{ display: "flex", gap: 34, alignItems: "center", padding: "34px 44px" }}>
            <ThinkingBrain size={140} />
            <div>
              <div style={{ font: "600 18px var(--font-d)", marginBottom: 10 }}>Thinking…</div>
              {THINK.map((s, i) => (
                <div key={s} className={`think-row ${thinkStep > i ? "done" : ""}`}><span className="tick">✓</span>{s}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* end-session confirmation */}
      {confirmEnd && (
        <div style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(4,6,10,0.84)", display: "grid", placeItems: "center", backdropFilter: "blur(5px)" }}>
          <div className="panel4 raised" style={{ padding: "30px 40px", maxWidth: 470 }}>
            <div className="sec-label" style={{ marginBottom: 10 }}>END <b>SESSION?</b></div>
            <p className="dim" style={{ fontSize: 14.5, marginBottom: 16 }}>Your progress saves automatically — Astra meets you at the room with your summary and tomorrow's plan.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn4 amber" onClick={() => onEnd(sanctRef.current.events)}>End & see my summary</button>
              <button className="btn4 ghost" onClick={() => setConfirmEnd(false)}>Keep going</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
