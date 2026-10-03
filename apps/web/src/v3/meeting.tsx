/**
 * THE MEETING [ADR-033] — the founder's onboarding conversation.
 * Greet → REAL pause (GoalSpec + plan computed during it) → read-back →
 * "How wrong am I?" → horizons → the board draws the journey + writes the
 * plan → overrides → "Ready to start from today?" → the handoff.
 * Every line carries a VoiceIntent; the orb's colour is her state.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Orb, type OrbMood } from "./orb.js";
import { Room } from "../art/Room.js";
import { probeVoiceOut, speak, stopSpeaking } from "../voice/tts.js";
import { newSanctuary, conceptRows, content, type SanctuaryState } from "../kernel/adapter.js";
import { markMetAstra, type Profile } from "../persist/profile.js";

interface Line { text: string; mood: OrbMood; pace?: "slow" | "normal" | "quick"; pauseAfterMs?: number }

type Phase = "greet" | "read" | "reflect" | "horizons" | "board" | "overrides" | "ready" | "handoff" | "done";

export function Meeting({ profile, sanct, onStart, onCorrected }: {
  profile: Profile; sanct: SanctuaryState; onStart: () => void; onCorrected: (prefName?: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("greet");
  const [lineIdx, setLineIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [boardLines, setBoardLines] = useState<string[]>([]);
  const [mood, setMood] = useState<OrbMood>("listen");
  const [voice] = useState(() => probeVoiceOut());
  const timer = useRef<number | null>(null);
  const prefName = profile.preferredName ?? profile.name;
  const callName = prefName.split(" ")[0]!;
  const rows = useMemo(() => conceptRows(sanct.sys.belief), [sanct]);

  const returning = profile.metAstra;

  const script: Line[] = useMemo(() => {
    if (returning) return [
      { text: `Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${callName}. I've been looking at where you left things.`, mood: "listen", pauseAfterMs: 400 },
      { text: "Here's today — I've kept it honest.", mood: "ready", pauseAfterMs: 200 },
    ];
    return [
      { text: `Hey ${callName}. Nice to meet you — give me a second. I want to actually look at what you told me.`, mood: "listen", pauseAfterMs: 300 },
      { text: "Okay… I think I understand the shape of this.", mood: "insight", pace: "slow", pauseAfterMs: 500 },
      { text: `So — you're ${profile.name}, aiming at ${profile.exam}, around ${Math.round(profile.dailyMin / 60)} hours a day, ${profile.stage.toLowerCase()}. How wrong am I?`, mood: "insight", pauseAfterMs: 300 },
    ];
  }, [returning, callName, profile]);

  // the REAL pause: during "read" we actually build the model + plan (sanct already holds them)
  useEffect(() => {
    if (phase !== "greet" && phase !== "read") return;
    const line = script[lineIdx];
    if (!line) {
      setPhase(returning ? "board" : "reflect");
      return;
    }
    setMood(line.mood);
    setTyped("");
    speak(voice, line.text, {
      onWord: (i) => setTyped(line.text.split(/\s+/).slice(0, i).join(" ")),
      onEnd: () => {
        setTyped(line.text);
        const wait = (line.pauseAfterMs ?? 250) + (line.pace === "slow" ? 500 : 0);
        timer.current = window.setTimeout(() => {
          if (phase === "greet") { setPhase("read"); setMood("think"); }
          else { setLineIdx((i) => i + 1); }
        }, phase === "greet" ? 300 : wait);
      },
    });
    return () => { if (timer.current) clearTimeout(timer.current); stopSpeaking(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, lineIdx]);

  // entering reflect → after "how wrong am I", move to horizons on chip choice
  function onHowWrong(almost: boolean) {
    const ack = almost
      ? { text: "Good — then we start from truth, not hope.", mood: "insight" as OrbMood, pauseAfterMs: 300 }
      : { text: "Even better. Tell me by changing it anytime — you can change anything here.", mood: "listen" as OrbMood, pauseAfterMs: 300 };
    setPhase("horizons");
    setMood(ack.mood);
    setTyped("");
    speak(voice, ack.text, { onWord: (i) => setTyped(ack.text.split(/\s+/).slice(0, i).join(" ")), onEnd: () => { setTyped(ack.text); setTimeout(() => setPhase("board"), 500); } });
  }

  // horizons → write the board
  useEffect(() => {
    if (phase !== "board") return;
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
    const iv = setInterval(() => {
      i += 1;
      setBoardLines(lines.slice(0, i));
      if (i >= lines.length) { clearInterval(iv); setPhase("overrides"); setMood("listen"); }
    }, 260);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // handoff
  useEffect(() => {
    if (phase !== "handoff") return;
    setMood("ready");
    const t = "I've scheduled your class — your teacher is ready. I'll be right here when you're done. Best of luck.";
    setTyped("");
    speak(voice, t, { onWord: (i) => setTyped(t.split(/\s+/).slice(0, i).join(" ")), onEnd: () => { setTyped(t); setMood("fade"); markMetAstra(prefName); onCorrected(prefName); } });
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const overrideChips = ["Looks good", "Make it harder", "Make it lighter", "I want something else"];

  return (
    <div style={{ height: "100vh", position: "relative", display: "flex", flexDirection: "column" }}>
      <Room variant="home" />
      <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", minHeight: 0 }}>
        {/* left: orb + conversation strip */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "4vh 3vw", gap: 10 }}>
          <Orb mood={mood} size={200} />
          <div className="bubble rise" key={typed.slice(0, 12)} style={{ maxWidth: 430, marginTop: 14, minHeight: 76 }}>
            {typed || "…"}{typed && <span className="caret" />}
          </div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 6 }}>
            {phase === "reflect" && (
              <>
                <button className="chip" onClick={() => onHowWrong(true)}>Almost right</button>
                <button className="chip" onClick={() => onHowWrong(false)}>Change a few things</button>
              </>
            )}
            {phase === "overrides" && overrideChips.map((c) => (
              <button key={c} className="chip" onClick={() => { setMood(c === "Looks good" ? "celebrate" : "listen"); setPhase("ready"); }}>{c}</button>
            ))}
            {phase === "ready" && (
              <>
                <button className="chip" style={{ color: "var(--cyan)", borderColor: "var(--panel-line-hi)" }} onClick={() => setPhase("handoff")}>I'm ready — start from today</button>
                <button className="chip hint" onClick={() => { setTyped("Take your time. The room isn't going anywhere."); setMood("silent"); }}>Not yet</button>
              </>
            )}
            {phase === "handoff" && (
              <button className="btn cta rise" onClick={onStart}>Start the session →</button>
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
