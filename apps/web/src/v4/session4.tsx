/**
 * SESSION v4 [the 15-component board] — obsidian base + neon panel coding.
 * 1 sidebar · 2 context bar · 3 live status + waveform · 4 circular timer ·
 * 5 quick actions · 6 end-with-confirmation · 7 teacher placeholder (3D slot) ·
 * 8 BLANK interactive blackboard (teacher + student draw) · 9 why-this ·
 * 10 concept understanding · 11 session state/plan · 12 live evidence strip ·
 * 13 student avatar · 14 input controls · 15 teacher status.
 * The kernel decides everything; this screen expresses it.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { TeachingMove, StudentEvent, BeliefState } from "@techgram/kernel";
import { reportConcept } from "@techgram/kernel";
import { OrbV4 } from "./orb4.js";
import { askNext, answerCurrent, emitAgency, model, conceptRows, type SanctuaryState } from "../kernel/adapter.js";
import { probeVoiceOut, speak, stopSpeaking, type VoiceOut } from "../voice/tts.js";
import { ThinkingBrain } from "../art/Board.js";

interface Props { sanct: SanctuaryState; onEnd: (events: StudentEvent[]) => void; profileName: string }

type StepState = "done" | "now" | "next";
const THINK = ["Analyzing your answer…", "Updating belief state…", "Checking misconceptions…", "Selecting next question…", "Preparing explanation…"];

export function SessionV4({ sanct, onEnd, profileName }: Props) {
  const sanctRef = useRef(sanct);
  const moveRef = useRef<TeachingMove | null>(null);
  const [phase, setPhase] = useState<"live" | "thinking" | "closing">("live");
  const [thinkStep, setThinkStep] = useState(0);
  const [bubble, setBubble] = useState("Let's figure this out together.");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [secs, setSecs] = useState(40 * 60);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [listening, setListening] = useState(false);
  const [boardMode, setBoardMode] = useState("pen");
  const voice = useMemo<VoiceOut>(() => probeVoiceOut(), []);
  const rows = useMemo(() => conceptRows(sanctRef.current.sys.belief), []);
  const bandBefore = useRef<number | null>(null) as React.MutableRefObject<number | null>;
  

  // ── board: blank interactive canvas (student + teacher draw) ──
  const boardRef = useRef<HTMLCanvasElement>(null) as React.MutableRefObject<HTMLCanvasElement | null>;
  const drawing = useRef(false);
  const strokes = useRef<{ x: number; y: number }[][]>([]) as React.MutableRefObject<{ x: number; y: number }[][]>;
  function drawAll() {
    const cv = boardRef.current; if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "#bfe8ff"; ctx.lineWidth = 2.2; ctx.lineCap = "round";
    ctx.shadowColor = "rgba(110,219,255,0.5)"; ctx.shadowBlur = 6;
    for (const st of strokes.current) {
      ctx.beginPath();
      st.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    }
  }
  function boardPos(e: React.PointerEvent) {
    const cv = boardRef.current!;
    const r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function down(e: React.PointerEvent) {
    if (boardMode !== "pen" && boardMode !== "erase") return;
    drawing.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    strokes.current.push(boardMode === "erase" ? [] : [boardPos(e)]);
    drawAll();
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const p = boardPos(e);
    const cur = strokes.current[strokes.current.length - 1]!;
    if (boardMode === "erase") {
      // erase: drop strokes near the point
      strokes.current = strokes.current.filter((st) => !st.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 26));
    } else cur.push(p);
    drawAll();
  }
  function up() { drawing.current = false; }

  // ── the kernel loop ──
  function deliver(m: TeachingMove) {
    moveRef.current = m;
    setBubble(m.utterance && m.utterance.trim() ? m.utterance : m.item?.stem ?? "…");
    if (m.item) {
      const ci = model.index.get(m.conceptId);
      if (ci !== undefined) bandBefore.current = reportConcept(model, sanctRef.current.sys.belief, m.conceptId).mean;
      emitAgency(sanctRef.current, "retrieval_selection", "accepted_recommendation");
    }
    speak(voice, m.utterance || m.item?.stem || "", {});
  }

  function next() {
    const t = askNext(sanctRef.current);
    if (t.done) { setPhase("closing"); return; }
    deliver(t.move!);
  }
  useEffect(() => { next(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  function onAnswer(choice: number | null) {
    const m = moveRef.current;
    if (!m?.item) return;
    setPhase("thinking"); setThinkStep(0); setEvidence([]);
    setThinkTick();
    const ev: string[] = [];
    const before = bandBefore.current;
    answerCurrent(sanctRef.current, m, choice, 2);
    THINK.forEach((_, i) => timers.current.push(window.setTimeout(() => setThinkStep(i + 1), 520 * (i + 1))));
    timers.current.push(window.setTimeout(() => {
      const after = reportConcept(model, sanctRef.current.sys.belief, m.conceptId).mean;
      if (before !== null) ev.push(`Confidence updated ${before.toFixed(2)} → ${after.toFixed(2)}`);
      const correct = choice === m.item!.answer;
      ev.push(correct ? "Response consistent with belief — no misconception signalled" : `Misconception candidate: ${m.conceptId.replace(/_/g, " ")} stage`);
      const cell = sanctRef.current.sys.memory.get(model.index.get(m.conceptId)!);
      if (cell) ev.push(`Memory check scheduled in ${Math.max(1, Math.round(cell.S ?? 3))} days`);
      setEvidence(ev);
      setPhase("live");
      setBubble(correct ? "Good — that lands. Watch the board." : "Interesting. This is exactly the link we keep losing.");
      timers.current.push(window.setTimeout(next, 1600));
    }, 520 * THINK.length + 700));
  }
  const timers = useRef<number[]>([]) as React.MutableRefObject<number[]>;
  function setThinkTick() { /* ticks driven in onAnswer */ }
  useEffect(() => () => { timers.current.forEach((t) => clearTimeout(t)); stopSpeaking(); }, []);

  // timer + circular progress
  useEffect(() => {
    const iv = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(iv);
  }, []);
  const total = 40 * 60;
  const frac = secs / total;
  const low = secs < 5 * 60;
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const R = 16, CIRC = 2 * Math.PI * R;

  const m = moveRef.current;
  const segStates: { t: string; s: StepState; m: string }[] = [
    { t: "Retrieval Practice", s: phase === "live" && (m?.move === "RETRIEVAL_PROMPT") ? "now" : "done", m: "5 min" },
    { t: "Concept Repair", s: phase === "live" && ["EXPLAIN", "WORKED_EXAMPLE", "CONTRAST", "DIAGNOSTIC_PROBE", "MEMORY_OPEN", "HINT_L1", "HINT_L2", "HINT_L3"].includes(m?.move ?? "") ? "now" : "next", m: "18 min" },
    { t: "Guided Application", s: "next", m: "10 min" },
    { t: "Independent Recall", s: "next", m: "7 min" },
  ];
  void segStates;

  return (
    <div style={{ height: "100vh", display: "flex", background: "var(--obsidian)", overflow: "hidden" }}>
      {/* 1. NAVIGATION SIDEBAR — always visible */}
      <div className="sidebar" style={{ width: 190, zIndex: 30 }}>
        <div className="logo"><div className="mark" style={{ background: "linear-gradient(135deg, var(--amber-deep), var(--amber))", color: "#0a0a0a", fontWeight: 700 }}>T</div><span className="name">Techgram</span></div>
        <div className="side-nav">
          {[["Home", "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"], ["Session", "M4 5h16v11H4zM8 20h8M12 16v4"], ["Learning Map", "M12 3v4M5 8l3 3M19 8l-3 3M12 7a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9zM8 21h4"], ["Growth", "M4 19V9m5 10V5m5 14v-7m5 7V8"], ["Artifacts", "M6 3h12v18H6zM9 7h6M9 11h6M9 15h4"], ["Library", "M5 4h6v16H5zM13 4h6v16h-6zM11 4v16"], ["Agency", "M12 3l2.2 5.2L20 10l-5.8 1.8L12 17l-2.2-5.2L4 10l5.8-1.8z"], ["Settings", "M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"]].map(([l, d], i) => (
            <button key={l} className={i === 1 ? "on" : ""}><svg viewBox="0 0 24 24"><path d={d} /></svg>{l}</button>
          ))}
        </div>
        <div className="profile"><span className="avatar">{profileName[0]}</span><div className="who"><b>{profileName}</b><span>UPSC</span></div></div>
      </div>

      {/* main column */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* 2. CONTEXT BAR + 3. LIVE STATUS + 4. TIMER + 5/6. ACTIONS */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: "1px solid var(--hairline)" }}>
          <button className="btn4 ghost" style={{ padding: "5px 11px" }} onClick={() => setConfirmEnd(true)}>←</button>
          <span style={{ fontSize: 14 }}>Session · <b>Geomorphology · River Systems</b></span>
          <span className="chip4">Class 8 · Geography</span>
          <span style={{ flex: 1 }} />
          <span className="wave">{[0, 1, 2, 3, 4, 5, 6].map((i) => <i key={i} style={{ animationDelay: `${i * 0.11}s`, background: listening ? "var(--amber)" : "var(--cyan)" }} />)}</span>
          <span className="chip4 live">● Live with Techgram</span>
          {/* 4: circular timer */}
          <div style={{ position: "relative", width: 40, height: 40 }}>
            <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="20" cy="20" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              <circle cx="20" cy="20" r={R} fill="none" stroke={low ? "var(--danger, #ef4444)" : "var(--amber)"} strokeWidth="3" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - frac)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />
            </svg>
            <span className="mono" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 8.5, color: low ? "#ef4444" : "var(--ink-2)" }}>{mm}:{ss}</span>
          </div>
          <span className="mono" style={{ color: low ? "#ef4444" : "var(--ink-3)" }}>{mm}:{ss} / 40:00</span>
          {/* 5. quick actions */}
          {["⤢", "◱", "▦"].map((q, i) => <button key={i} className="btn4 ghost" style={{ padding: "5px 10px" }}>{q}</button>)}
          {/* 6. end session */}
          <button className="btn4" style={{ color: "#ffb4b4", borderColor: "rgba(239,68,68,0.45)" }} onClick={() => setConfirmEnd(true)}>End Session</button>
        </div>

        {/* main split */}
        <div style={{ flex: 1, minWidth: 0, display: "flex" }}>
          {/* 7. TEACHER PLACEHOLDER + speech */}
          <div style={{ width: 280, flexShrink: 0, padding: "20px 10px 10px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{
              flex: 1, minHeight: 200, borderRadius: 14, border: "1px dashed rgba(110,219,255,0.35)",
              background: "radial-gradient(circle at 50% 40%, rgba(110,219,255,0.06), transparent 70%)",
              display: "grid", placeItems: "center", position: "relative",
            }}>
              <OrbV4 mood={listening ? "listen" : phase === "thinking" ? "think" : "ready"} size={150} />
              <span className="mono" style={{ position: "absolute", bottom: 10, color: "var(--ink-4)", fontSize: 9.5 }}>3D TEACHER — SLOT RESERVED</span>
            </div>
            <div className="bubble" style={{ fontSize: 13.5 }}>{bubble}</div>
            {/* 15. teacher status */}
            <div className="panel4" style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <span className="wave">{[0, 1, 2, 3].map((i) => <i key={i} style={{ animationDelay: `${i * 0.13}s` }} />)}</span>
              <span className="mono" style={{ fontSize: 9.5, color: listening ? "var(--amber)" : "var(--cyan)" }}>{listening ? "LISTENING TO YOU" : phase === "thinking" ? "THINKING" : "EXPLAINING"}</span>
            </div>
          </div>

          {/* 8. THE BLANK INTERACTIVE BLACKBOARD + tools */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", padding: "16px 14px 0 6px", gap: 8 }}>
            <div className="board-frame" style={{ flex: 1, minHeight: 0, display: "flex" }}>
              <canvas
                ref={(cv) => { boardRef.current = cv; if (cv) requestAnimationFrame(drawAll); }}
                style={{ flex: 1, cursor: boardMode === "pen" ? "crosshair" : "default", touchAction: "none" }}
                onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
              />
              <div className="tools" style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {[["✎", "pen"], ["Select", "select"], ["◑", "shapes"], ["T", "text"], ["🖼", "image"], ["↺", "undo"], ["✕", "erase"]].map(([t, k]) => (
                  <button key={k} className={boardMode === k ? "on" : ""} onClick={() => {
                    if (k === "undo") { strokes.current.pop(); drawAll(); return; }
                    if (k === "erase") { setBoardMode(boardMode === "erase" ? "pen" : "erase"); return; }
                    setBoardMode(k);
                  }}>{t}</button>
                ))}
                <button onClick={() => { strokes.current = []; drawAll(); }}>Clear</button>
              </div>
            </div>
          </div>

          {/* right rail: 9 why · 10 understanding · 11 session state */}
          <div style={{ width: 300, flexShrink: 0, borderLeft: "1px solid var(--hairline)", padding: "16px 14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
            {/* 9 */}
            <div className="panel4" style={{ padding: "14px 16px", borderColor: "rgba(110,219,255,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <b style={{ fontSize: 14 }}>Why this question?</b>
                <span className="chip4" style={{ fontSize: 9, padding: "3px 8px" }}>Show full reasoning</span>
              </div>
              <div className="whisper" style={{ fontSize: 12.5, marginBottom: 8 }}>Based on real kernel reasoning: your belief state, the question's information value, and what it would change.</div>
              {m?.why && <div className="why-inline" style={{ fontSize: 12.5 }}>{m.why.slice(0, 110)}{m.why.length > 110 ? "…" : ""}</div>}
            </div>
            {/* 10 */}
            <div className="panel4" style={{ padding: "14px 16px", borderColor: "rgba(245,158,11,0.3)" }}>
              <b style={{ fontSize: 14 }}>What I currently understand</b>
              <div style={{ marginTop: 8 }}>
                {rows.slice(0, 4).map((r) => {
                  const st = r.grey ? { c: "var(--amber)", t: "Uncertain" } : r.mean >= 0.65 ? { c: "var(--ok)", t: "Strong" } : { c: "var(--cyan)", t: "Developing" };
                  return (
                    <div key={r.id} className="u-row" style={{ padding: "5px 0" }}>
                      <span style={{ fontSize: 13, flex: 1 }}>{r.name}</span>
                      <span className="u-pill" style={{ width: 70 }}><i style={{ width: `${r.mean * 100}%`, background: st.c }} /></span>
                      <span className="u-tag" style={{ color: st.c, fontSize: 11, minWidth: 74, textAlign: "right" }}>{st.t}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* 11 */}
            <div className="panel4" style={{ padding: "14px 16px", borderColor: "rgba(74,222,128,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <b style={{ fontSize: 14 }}>Session state</b>
                <span className="mono" style={{ color: "var(--ink-4)", fontSize: 10 }}>◷ 3/4</span>
              </div>
              {segStates.map((sg, i) => (
                <div key={sg.t} style={{
                  display: "flex", gap: 10, alignItems: "center", padding: "8px 10px", marginBottom: 6, borderRadius: 9,
                  border: sg.s === "now" ? "1px solid rgba(110,219,255,0.4)" : "1px solid var(--hairline)",
                  background: sg.s === "now" ? "rgba(110,219,255,0.06)" : "transparent",
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 11, flexShrink: 0,
                    border: `1.5px solid ${sg.s === "done" ? "var(--ok)" : sg.s === "now" ? "var(--cyan)" : "var(--hairline-2)"}`,
                    color: sg.s === "done" ? "var(--ok)" : sg.s === "now" ? "var(--cyan)" : "var(--ink-4)",
                  }}>{sg.s === "done" ? "✓" : i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5 }}>{sg.t}</div>
                    <div className="whisper" style={{ fontSize: 11 }}>{sg.s === "now" ? "In progress" : sg.s === "done" ? "Completed" : "Upcoming"} · {sg.m}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 12. LIVE EVIDENCE STRIP */}
        <div style={{ padding: "8px 18px", borderTop: "1px solid var(--hairline)", display: "flex", alignItems: "center", gap: 10, overflowX: "auto" }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)", flexShrink: 0 }}>LIVE EVIDENCE</span>
          {evidence.length === 0 && <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>from your answer…</span>}
          {evidence.map((e, i) => (
            <span key={i} className="chip4" style={{ fontSize: 9.5, flexShrink: 0, color: "var(--cyan)", borderColor: "rgba(110,219,255,0.3)" }}>{e}</span>
          ))}
          <button className="chip4" style={{ fontSize: 9.5, marginLeft: "auto", flexShrink: 0, color: "var(--amber)", borderColor: "rgba(255,180,92,0.35)" }}>Show why →</button>
        </div>

        {/* 13/14. STUDENT AVATAR + INPUT CONTROLS */}
        <div style={{ padding: "10px 18px 14px", borderTop: "1px solid var(--hairline)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, var(--amber-deep), var(--cta-a, #8b5cf6))", display: "grid", placeItems: "center", color: "#0a0a0a", fontWeight: 700, fontSize: 15, opacity: listening ? 1 : 0.75 }}>{profileName[0]}</div>
          {listening && <span className="wave">{[0, 1, 2, 3, 4].map((i) => <i key={i} style={{ animationDelay: `${i * 0.1}s` }} />)}</span>}
          <div style={{ flex: 1, display: "flex", justifyContent: "space-around", alignItems: "center" }}>
            <button className="mic-ctl"><svg viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3" /></svg>Mute</button>
            <button className="mic-ctl"><svg viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3" /></svg>Turn Off</button>
            <div style={{ textAlign: "center" }}>
              <button className="mic-btn" onMouseDown={() => setListening(true)} onMouseUp={() => setListening(false)} onTouchStart={() => setListening(true)} onTouchEnd={() => setListening(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
              </button>
              <div className="whisper" style={{ marginTop: 5, fontSize: 11 }}>Hold to speak</div>
            </div>
            <button className="mic-ctl" onClick={() => setBubble("Type it — I'll take it either way.")}><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="3" /><path d="M8 10h8M8 14h5" /></svg>Type instead</button>
            <button className="mic-ctl" onClick={() => setBubble("Good — uncertainty is evidence too. Eliminate one wrong option first.")}><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.8 2.1c-.8.6-1.3 1-1.3 2.1M12 16.8v.1" /></svg>I'm not sure</button>
            <button className="mic-ctl" onClick={() => setBubble("Good doubt — it goes to your notebook, and we answer from verified material only.")}><svg viewBox="0 0 24 24"><path d="M4 6h16v10H9l-5 4z" /></svg>Ask doubt</button>
          </div>
        </div>
      </div>

      {/* thinking overlay */}
      {phase === "thinking" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(4,6,10,0.8)", display: "grid", placeItems: "center", backdropFilter: "blur(5px)" }}>
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

      {/* 6. end-session confirmation */}
      {confirmEnd && (
        <div style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(4,6,10,0.82)", display: "grid", placeItems: "center", backdropFilter: "blur(5px)" }}>
          <div className="panel4 raised" style={{ padding: "30px 40px", maxWidth: 460 }}>
            <div className="sec-label" style={{ marginBottom: 10 }}>END <b>SESSION?</b></div>
            <p className="dim" style={{ fontSize: 14.5, marginBottom: 16 }}>Your progress is saved the moment you leave — Astra will meet you at the room with your summary.</p>
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
