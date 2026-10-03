/**
 * SESSION v3 [ADR-033 S3] — the Warm Room session with colour-as-state.
 * The classroom ambient light follows the teacher's state (never "emotion"):
 *   orientation = warm amber · exploration = violet-cyan · reasoning = deep teal ·
 *   retrieval = visual quiet · correction = restrained coral · eureka = gold bloom.
 * The REAL kernel loop drives it: move → answer → thinking overlay → belief
 * update → adaptive next move. The teacher expresses; the brain decides.
 */
import { useEffect, useRef, useState } from "react";
import type { TeachingMove } from "@techgram/kernel";
import { Room } from "../art/Room.js";
import { Mentor, type MentorMood } from "../art/Mentor.js";
import { RiverBoard } from "../art/Board.js";
import { WhyThisPanel, UnderstandingPanel } from "../v2/screens.js";
import { askNext, answerCurrent, emitAgency, conceptRows, model, type SanctuaryState } from "../kernel/adapter.js";
import type { StudentEvent } from "@techgram/kernel";

export type RoomMood = "orientation" | "exploration" | "reasoning" | "retrieval" | "correction" | "eureka" | "mastery";

const MOVE_MOOD: Record<string, RoomMood> = {
  MEMORY_OPEN: "orientation", DIAGNOSTIC_PROBE: "orientation",
  EXPLAIN: "exploration", WORKED_EXAMPLE: "exploration", FADE_EXAMPLE: "exploration",
  CONTRAST: "reasoning", SELF_EXPLAIN_PROMPT: "reasoning",
  RETRIEVAL_PROMPT: "retrieval", TRANSFER_ITEM: "retrieval",
  HINT_L1: "correction", HINT_L2: "correction", HINT_L3: "correction",
  ENCOURAGE_REFRAME: "eureka", SUMMARISE_CLOSE: "mastery",
  CALIBRATION_PROMPT: "retrieval",
};

const MOOD_COPY: Record<RoomMood, string> = {
  orientation: "settling in", exploration: "exploring", reasoning: "thinking hard",
  retrieval: "your turn — quiet room", correction: "interesting — this is the link we keep losing",
  eureka: "oh.", mastery: "that's real progress, with evidence",
};

interface Props { sanct: SanctuaryState; onEnd: (events: StudentEvent[]) => void }

export function SessionV3({ sanct, onEnd }: Props) {
  const sanctRef = useRef(sanct);
  const moveRef = useRef<TeachingMove | null>(null);
  const [phase, setPhase] = useState<"live" | "thinking" | "closing">("live");
  const [thinkStep, setThinkStep] = useState(0);
  const [bubble, setBubble] = useState("…");
  const [mood, setMood] = useState<RoomMood>("orientation");
  const [mentorMood, setMentorMood] = useState<MentorMood>("speak");
  const [answered, setAnswered] = useState<number | null>(null);
  const [secs, setSecs] = useState(40 * 60);
  const seqRef = useRef(1);
  const THINK = ["Analyzing your answer…", "Updating belief state…", "Checking misconceptions…", "Selecting next question…", "Preparing explanation…"];

  useEffect(() => {
    const iv = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(iv);
  }, []);

  function deliver(m: TeachingMove) {
    moveRef.current = m;
    setAnswered(null);
    setBubble(m.utterance && m.utterance.trim() ? m.utterance : m.item?.stem ?? "…");
    const next = MOVE_MOOD[m.move] ?? "exploration";
    setMood(next);
    setMentorMood(next === "correction" ? "think" : next === "eureka" ? "happy" : next === "retrieval" ? "listen" : "speak");
    if (m.item) emitAgency(sanctRef.current, "retrieval_selection", "accepted_recommendation");
  }

  function next() {
    const t = askNext(sanctRef.current);
    if (t.done) { setPhase("closing"); setMood("mastery"); setMentorMood("happy"); setBubble("We're done for today. Look at what moved — I'll show you at home. Meet you next session."); return; }
    deliver(t.move!);
  }

  useEffect(() => { next(); /* first move */ 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onAnswer(choice: number) {
    const m = moveRef.current;
    if (!m?.item || answered !== null) return;
    setAnswered(choice);
    answerCurrent(sanctRef.current, m, choice, 2);
    // the thinking overlay — REAL kernel work happens beneath it (applyEvent already ran)
    setPhase("thinking"); setThinkStep(0);
    setMood("reasoning"); setMentorMood("think");
    THINK.forEach((_, i) => setTimeout(() => setThinkStep(i + 1), 520 * (i + 1)));
    setTimeout(() => {
      const wasCorrect = choice === m.item!.answer;
      setPhase("live");
      setMood(wasCorrect ? "eureka" : "correction");
      setMentorMood(wasCorrect ? "happy" : "think");
      setBubble(wasCorrect
        ? (sanctRef.current.teacher.correctStreak >= 2 ? "Whoa — that was yours. No hint. Keep building." : "Good — that lands. Keep building.")
        : "Interesting. This is exactly the link we keep losing — watch the board.");
      setTimeout(next, 2100);
    }, 520 * THINK.length + 800);
  }

  const m = moveRef.current;
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <div className="sess-stage-v3" data-mood={mood} style={{ height: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      <Room variant="session" />
      <div className="sess-top" style={{ position: "relative", zIndex: 3 }}>
        <button className="btn ghost" style={{ padding: "6px 12px" }} onClick={() => onEnd(sanctRef.current.events)}>←</button>
        <span style={{ fontSize: 14 }}>Session · <b>Geomorphology · River Systems</b></span>
        <span className="wave">{[0, 1, 2, 3, 4, 5, 6].map((i) => <i key={i} style={{ animationDelay: `${i * 0.12}s` }} />)}</span>
        <span className="pill live">● Live with Techgram</span>
        <span style={{ flex: 1 }} />
        <span className="mono whisper">{MOOD_COPY[mood]}</span>
        <span className="mono">⏱ {mm}:{ss} / 40:00</span>
        <button className="pill danger" onClick={() => onEnd(sanctRef.current.events)}>End Session</button>
      </div>

      <div className="sess-main" style={{ position: "relative", zIndex: 2 }}>
        <div className="sess-left">
          <div className="mentor-scene" style={{ display: "flex", alignItems: "flex-end", gap: 18, padding: "8px 26px 0" }}>
            <Mentor mood={mentorMood} size={220} />
            <div style={{ flex: 1, paddingBottom: 16 }}>
              <div className="bubble rise" key={bubble}>{bubble}</div>
              <div className="whisper" style={{ marginTop: 6 }}>{m?.why ? `why: ${m.why.slice(0, 90)}${m.why.length > 90 ? "…" : ""}` : "\u00A0"}</div>
            </div>
          </div>

          <div className="board-wrap">
            <div className="board-frame"><RiverBoard highlight={m?.conceptId === "g_transport" ? "transport" : m?.move.startsWith("HINT") ? "erosion" : "weathering"} /></div>
            <div className="tools">{["✎", "⬚", "◑", "T", "🖼", "↺"].map((t, i) => <button key={i} className={i === 0 ? "on" : ""}>{t}</button>)}</div>
          </div>

          <div className="answers" style={{ padding: "10px 26px 4px" }}>
            {m?.item && answered === null && m.options?.map((o, i) => (
              <button key={i} className="chip" onClick={() => onAnswer(i)}>{o}</button>
            ))}
            {answered !== null && <span className="whisper">astra is thinking…</span>}
            {phase === "closing" && <button className="btn cta" onClick={() => onEnd(sanctRef.current.events)}>Return to Astra →</button>}
          </div>

          <div className="mic-bar">
            <button className="mic-ctl"><svg viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3" /></svg>Mute</button>
            <button className="mic-ctl"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9 12h6" /></svg>Turn Off</button>
            <div style={{ textAlign: "center" }}>
              <button className="mic-btn" onClick={() => { setBubble("Take your time… type it instead. I'm right here."); setMentorMood("listen"); }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
              </button>
              <div className="whisper" style={{ marginTop: 6 }}>Hold to speak</div>
            </div>
            <button className="mic-ctl" onClick={() => setBubble("Type it instead — I'm listening either way.")}><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="3" /><path d="M8 10h8M8 14h5" /></svg>Type instead</button>
            <button className="mic-ctl" onClick={() => setBubble("Being unsure is information too — eliminate one option you know is wrong.")}><svg viewBox="0 0 24 24"><path d="M9 9a3 3 0 1 1 4.6 2.5c-1 .7-1.6 1.2-1.6 2.5M12 17.5v.1" /><circle cx="12" cy="12" r="9" /></svg>I'm not sure</button>
            <button className="mic-ctl hot" onClick={() => { const t = askNext(sanctRef.current); if (!t.done) deliver(t.move!); }}><svg viewBox="0 0 24 24"><path d="M12 3l2.2 5.2L20 10l-5.8 1.8L12 17l-2.2-5.2L4 10l5.8-1.8z" /></svg>Show Why</button>
          </div>
        </div>

        <div className="sess-right">
          <WhyThisPanel kernelReason={m?.why} />
          <UnderstandingPanel rows={conceptRows(sanct.sys.belief)} />
        </div>
      </div>

      {phase === "thinking" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(8,6,14,0.72)", display: "grid", placeItems: "center", backdropFilter: "blur(4px)" }}>
          <div className="panel think-panel rise" style={{ display: "flex", gap: 30, alignItems: "center", padding: "30px 40px" }}>
            <div className="brain-glow" style={{ width: 120, height: 120, borderRadius: "50%", border: "1.5px solid var(--cyan)", boxShadow: "var(--glow-cyan), inset 0 0 30px rgba(77,216,255,0.25)", display: "grid", placeItems: "center", color: "var(--cyan)", font: "600 13px var(--font-mono)" }}>BRAIN</div>
            <div>
              <div className="panel-title" style={{ fontSize: 17, marginBottom: 8 }}>Thinking…</div>
              {THINK.map((s, i) => (
                <div key={s} className={`think-row ${thinkStep > i ? "done" : ""}`}><span className="tick">✓</span>{s}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

