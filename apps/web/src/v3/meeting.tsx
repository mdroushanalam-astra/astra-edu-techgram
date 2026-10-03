/**
 * THE MEETING v2 [ADR-033 S2] — VoiceIntent prosody, first-class interruption,
 * interaction-density control (no praise spam; silence is a legitimate state).
 * Greet → REAL pause → read-back → "How wrong am I?" → horizons → the board
 * writes → overrides (orb pulse only — she doesn't narrate every click) →
 * ready → handoff. The student can interrupt her at ANY moment.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Orb, type OrbMood } from "./orb.js";
import { Room } from "../art/Room.js";
import { probeVoiceOut, stopSpeaking, type VoiceOut } from "../voice/tts.js";
import { speakIntent, type VoiceIntent } from "./voiceIntent.js";
import { newSanctuary, conceptRows, type SanctuaryState } from "../kernel/adapter.js";
import { markMetAstra, type Profile } from "../persist/profile.js";

interface Line { text: string; mood: OrbMood; pace?: "slow" | "normal" | "quick"; energy?: "quiet" | "warm" | "focused" | "excited"; pauseAfterMs?: number }

type Phase = "greet" | "read" | "reflect" | "horizons" | "board" | "overrides" | "ready" | "handoff";
type Mode = "flow" | "interrupted";

export function Meeting({ profile, sanct, onStart, onCorrected }: {
  profile: Profile; sanct: SanctuaryState; onStart: () => void; onCorrected: (prefName?: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("greet");
  const [mode, setMode] = useState<Mode>("flow");
  const [lineIdx, setLineIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [boardLines, setBoardLines] = useState<string[]>([]);
  const [mood, setMood] = useState<OrbMood>("listen");
  const [voice] = useState(() => probeVoiceOut());
  const cancelRef = useRef<(() => void) | null>(null);
  const timers = useRef<number[]>([]);
  const prefName = profile.preferredName ?? profile.name;
  const callName = prefName.split(" ")[0]!;
  const rows = useMemo(() => conceptRows(sanct.sys.belief), [sanct]);
  const returning = profile.metAstra;

  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const clearAll = () => { timers.current.forEach((t) => clearTimeout(t)); timers.current = []; cancelRef.current?.(); };

  const script: Line[] = useMemo(() => {
    if (returning) return [
      { text: `Good ${new Date().getHours() < 12 ? "morning" : "evening"}, ${callName}. I've been looking at where you left things.`, mood: "listen", energy: "warm", pauseAfterMs: 400 },
      { text: "Here's today — I've kept it honest.", mood: "ready", energy: "focused", pauseAfterMs: 200 },
    ];
    return [
      { text: `Hey ${callName}. Nice to meet you — give me a second. I want to actually look at what you told me.`, mood: "listen", energy: "warm", pauseAfterMs: 300 },
      { text: "Okay… I think I understand the shape of this.", mood: "insight", pace: "slow", energy: "quiet", pauseAfterMs: 500 },
      { text: `So — you're ${profile.name}, aiming at ${profile.exam}, around ${Math.round(profile.dailyMin / 60)} hours a day, ${profile.stage.toLowerCase()}. How wrong am I?`, mood: "insight", emphasis: ["How wrong am I"], pauseAfterMs: 300 },
    ];
  }, [returning, callName, profile]);

  function say(line: Line, onDone?: () => void) {
    clearAll();
    setMood(line.mood);
    setTyped("");
    const intent: VoiceIntent = {
      text: line.text, pace: line.pace, energy: line.energy,
      pauseAfterMs: line.pauseAfterMs, interruptible: true,
    };
    cancelRef.current = speakIntent(voice, intent, {
      onWord: (n) => setTyped(line.text.split(/\s+/).slice(0, n).join(" ")),
      onEnd: () => { setTyped(line.text); onDone?.(); },
    });
  }

  // greet/read flow
  useEffect(() => {
    if (mode !== "flow" || (phase !== "greet" && phase !== "read")) return;
    const line = script[lineIdx];
    if (!line) { setPhase(returning ? "board" : "reflect"); return; }
    say(line, () => {
      if (phase === "greet") {
        later(() => { setPhase("read"); setMood("think"); }, 300);
      } else {
        later(() => setLineIdx((i) => i + 1), line.pauseAfterMs ?? 250);
      }
    });
    return clearAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, lineIdx, mode]);

  // horizons acknowledgment → board writes
  function onHowWrong(almost: boolean) {
    setPhase("horizons");
    const ack: Line = almost
      ? { text: "Good — then we start from truth, not hope.", mood: "insight", energy: "warm", pace: "slow", pauseAfterMs: 400 }
      : { text: "Even better. You can change anything here — the plan follows you, not the other way.", mood: "listen", energy: "warm", pauseAfterMs: 400 };
    say(ack, () => later(() => setPhase("board"), 400));
  }

  useEffect(() => {
    if (phase !== "board" || mode !== "flow") return;
    const top = sanct.plan.blocks.slice(0, 3);
    const lines = [
      `JOURNEY ─ ${profile.exam}`,
      `  ├─ NOW      today's plan is precise (${sanct.plan.totalMinutes} min)`,
      `  ├─ NEAR     next two weeks: provisional — reviews already scheduled by your memory`,
      `  └─ JOURNEY  capability toward ${profile.exam} — it changes as I learn how you learn`,
      ``,
      `TODAY ─ ${rows[0]?.name ?? "your first concept"}`,
      ...top.map((b, i) => `  ${i + 1}. ${b.action === "review" ? "Quick recall" : b.action === "diagnose" ? "Sharpen" : b.action === "practice" ? "Apply & test" : "Concept repair"} — ${b.conceptName} (${b.minutes} min)`),
      ``,
      `provisional ≠ vague: it means I update when reality disagrees.`,
    ];
    let i = 0;
    setBoardLines([]);
    const iv = window.setInterval(() => {
      i += 1;
      setBoardLines(lines.slice(0, i));
      if (i >= lines.length) { clearInterval(iv); setPhase("overrides"); setMood("listen"); }
    }, 240);
    timers.current.push(iv);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode]);

  // handoff
  useEffect(() => {
    if (phase !== "handoff" || mode !== "flow") return;
    setMood("ready");
    say(
      { text: "I've scheduled your class — your teacher is ready. I'll be right here when you're done. Best of luck.", mood: "ready", energy: "warm", pace: "slow", pauseAfterMs: 300 },
      () => { setMood("fade"); markMetAstra(prefName); onCorrected(prefName); },
    );
    return clearAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode]);

  // ── INTERRUPTION: she stops mid-sentence, instantly ──
  function interrupt() {
    clearAll();
    setMode("interrupted");
    setMood("listen");
    setTyped("Yep — stop me there. Which part?");
  }
  function resume(after: "again" | "why" | "disagree") {
    setMode("flow");
    if (after === "again") {
      if (phase === "greet" || phase === "read") { setLineIdx(0); setPhase("greet"); }
      else if (phase === "reflect") { setLineIdx(script.length - 1); setPhase("read"); }
      else if (phase === "handoff") setPhase("handoff");
      else setPhase("board"); // board re-writes
      return;
    }
    if (after === "why") {
      const r = sanct.plan.blocks[0]?.reason ?? "Your evidence said this was the highest-value next step.";
      say({ text: `Because of what the brain saw: ${r.length > 120 ? r.slice(0, 120) + "…" : r}`, mood: "think", energy: "focused", pace: "slow", pauseAfterMs: 300 },
        () => { setMode("flow"); setPhase(phase === "reflect" ? "reflect" : "board"); });
      return;
    }
    // disagree → agency contract
    say({ text: "Good. Disagreement is data. Change anything — the plan follows you.", mood: "listen", energy: "warm", pauseAfterMs: 300 },
      () => { setMode("flow"); setPhase("overrides"); });
  }

  const speaking = ["greet", "read", "reflect", "handoff"].includes(phase) && mode === "flow";

  return (
    <div style={{ height: "100vh", position: "relative", display: "flex", flexDirection: "column" }}>
      <Room variant="home" />
      <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", minHeight: 0 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "4vh 3vw", gap: 10 }}>
          <Orb mood={mood} size={200} />
          <div className="bubble rise" key={typed.slice(0, 12)} style={{ maxWidth: 440, marginTop: 14, minHeight: 76 }}>
            {typed || "…"}{typed && mode === "flow" && <span className="caret" />}
          </div>

          {/* density control: chips only at decision moments — clicks elsewhere get orb pulses, not lines */}
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 6 }}>
            {mode === "interrupted" ? (
              <>
                <button className="chip" onClick={() => resume("again")}>Start that again</button>
                <button className="chip" onClick={() => resume("why")}>Why this plan?</button>
                <button className="chip" onClick={() => resume("disagree")}>I disagree</button>
              </>
            ) : (
              <>
                {phase === "reflect" && (
                  <>
                    <button className="chip" onClick={() => onHowWrong(true)}>Almost right</button>
                    <button className="chip" onClick={() => onHowWrong(false)}>Change a few things</button>
                  </>
                )}
                {phase === "overrides" && ["Looks good", "Make it harder", "Make it lighter", "I want something else"].map((c) => (
                  <button key={c} className="chip" onClick={() => { setMood(c === "Looks good" ? "celebrate" : "listen"); setPhase("ready"); }}>{c}</button>
                ))}
                {phase === "ready" && (
                  <>
                    <button className="chip" style={{ color: "var(--cyan)", borderColor: "var(--panel-line-hi)" }} onClick={() => setPhase("handoff")}>I'm ready — start from today</button>
                    <button className="chip hint" onClick={() => { setMood("silent"); setTyped("Take your time. The room isn't going anywhere."); }}>Not yet</button>
                  </>
                )}
                {phase === "handoff" && <button className="btn cta rise" onClick={onStart}>Start the session →</button>}
              </>
            )}
            {speaking && (
              <button className="chip hint" onClick={interrupt}>✋ wait — I don't get this</button>
            )}
          </div>
          <div className="whisper" style={{ marginTop: 8, fontStyle: "italic" }}>
            {phase === "read" ? "astra is actually reading your details and building your first plan right now…" : "\u00A0"}
          </div>
        </div>

        {/* right: the living board */}
        <div style={{ width: "44%", padding: "4vh 26px 4vh 0", display: "flex", flexDirection: "column" }}>
          <div className="board-frame" style={{ flex: 1, padding: "26px 30px", overflowY: "auto" }}>
            <div style={{ font: "italic 600 22px var(--font-display)", color: "var(--chalk)", borderBottom: "1px solid rgba(216,242,255,0.25)", paddingBottom: 8, marginBottom: 14 }}>
              {returning ? "WHERE WE ARE" : "YOUR JOURNEY"}
            </div>
            {boardLines.length === 0 && <div className="whisper" style={{ color: "var(--chalk-dim)" }}>astra will write here as she thinks…</div>}
            {boardLines.map((l, i) => (
              <div key={i} className="rise chalk-line" style={{
                color: l.startsWith("JOURNEY") || l.startsWith("TODAY") ? "var(--warm)" : l.includes("provisional") ? "var(--chalk-dim)" : "var(--chalk)",
                fontWeight: l.startsWith("JOURNEY") || l.startsWith("TODAY") ? 600 : 400,
                fontSize: l.startsWith("  ") ? 14 : 16,
                marginBottom: 6, whiteSpace: "pre-wrap",
              }}>{l}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
