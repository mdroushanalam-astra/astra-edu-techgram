/**
 * THE RETURN [ADR-033 S4] — Astra comes back after the session.
 * Debrief = perception (her chip questions) × performance (kernel evidence) ×
 * prediction error — then TWO next-step options with her recommendation and
 * the override, the Library moment, and the horizons refresh.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Orb, type OrbMood } from "./orb.js";
import { Room } from "../art/Room.js";
import { probeVoiceOut } from "../voice/tts.js";
import { speakIntent } from "./voiceIntent.js";
import { applyEvent, type StudentEvent } from "@techgram/kernel";
import { conceptRows, model, type SanctuaryState } from "../kernel/adapter.js";
import type { Profile } from "../persist/profile.js";

type Phase = "back" | "debrief" | "feel" | "options" | "library" | "done";

export function Return({ profile, sanct, onDone }: {
  profile: Profile; sanct: SanctuaryState; onDone: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("back");
  const [typed, setTyped] = useState("");
  const [mood, setMood] = useState<OrbMood>("insight");
  const [voice] = useState(() => probeVoiceOut());
  const [energy, setEnergy] = useState<string | null>(null);
  const [bandwidth, setBandwidth] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const callName = (profile.preferredName ?? profile.name).split(" ")[0]!;

  const stats = useMemo(() => {
    const answers = sanct.events.filter((e) => e.type === "item_response");
    const correct = answers.filter((e) => e.payload.correct === true).length;
    const rows = conceptRows(sanct.sys.belief);
    const evidenced = rows.filter((r) => !r.grey);
    const top = evidenced.sort((a, b) => b.mean - a.mean)[0];
    const shaky = evidenced.sort((a, b) => a.mean - b.mean)[1] ?? evidenced[1];
    return {
      n: answers.length,
      acc: answers.length ? Math.round((correct / answers.length) * 100) : null,
      top: top?.name ?? "your first concept",
      shaky: shaky?.name ?? "the next link",
    };
  }, [sanct]);

  function say(text: string, mood: OrbMood, pauseAfterMs: number, onDone?: () => void) {
    setMood(mood); setTyped("");
    const c = speakIntent(voice, { text, energy: "warm", pace: "slow", pauseAfterMs }, {
      onWord: (n) => setTyped(text.split(/\s+/).slice(0, n).join(" ")),
      onEnd: () => { setTyped(text); onDone?.(); },
    });
    timers.current.push(c as unknown as number);
  }

  useEffect(() => {
    if (phase !== "back") return;
    say(`Hey. I'm back, ${callName}.`, "insight", 400, () => setPhase("debrief"));
    return () => { timers.current.forEach((t) => { if (typeof t === "function") (t as () => void)(); }); };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== "debrief") return;
    const line = stats.acc !== null
      ? `That matches what I saw — ${stats.n} answers, ${stats.acc}% landed. ${stats.top} looks strong; ${stats.shaky} is where my uncertainty is highest.`
      : "We built your baseline today — that's the honest first step. Nothing to celebrate yet, nothing to worry about.";
    say(line, "think", 400, () => setPhase("feel"));
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function emitSelfReport(kind: "energy" | "focus", value: number) {
    const ev: StudentEvent = {
      event_id: `web_sr_${Date.now()}_${kind}`, student_id: "student", day: sanct.day,
      type: "self_report", payload: kind === "energy" ? { energy: value } : { focus: value },
      source: "web", schema_version: 1, idempotency_key: `web_sr_${Date.now()}_${kind}`,
    };
    sanct.events.push(ev);
    sanct.sys = applyEvent(model, sanct.sys, ev);
  }

  const chipsFor = (opts: string[], picked: (s: string) => void) => (
    <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 8 }}>
      {opts.map((o) => <button key={o} className="chip" onClick={() => picked(o)}>{o}</button>)}
    </div>
  );

  return (
    <div style={{ height: "100vh", position: "relative", display: "flex", flexDirection: "column" }}>
      <Room variant="home" />
      <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", minHeight: 0 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "4vh 3vw", gap: 10 }}>
          <Orb mood={mood} size={190} />
          <div className="bubble rise" key={typed.slice(0, 10)} style={{ maxWidth: 460, marginTop: 12, minHeight: 72 }}>
            {typed || "…"}{typed && phase !== "done" && <span className="caret" />}
          </div>

          {phase === "feel" && energy === null && chipsFor(["Low", "Okay", "High"], (s) => {
            setEnergy(s); emitSelfReport("energy", s === "Low" ? 1 : s === "Okay" ? 2 : 3);
            say("Got it. And how much mental bandwidth do you have right now?", "listen", 200);
          })}
          {phase === "feel" && energy !== null && bandwidth === null && chipsFor(["Light", "Normal", "Deep"], (s) => {
            setBandwidth(s); emitSelfReport("focus", s === "Light" ? 1 : s === "Normal" ? 2 : 3);
            setPhase("options");
          })}
          {phase === "options" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 460 }}>
              <div className="panel" style={{ padding: "13px 17px", borderColor: "var(--panel-line-hi)" }}>
                <b style={{ color: "var(--cyan)" }}>A — short repair tomorrow, 20 min.</b> <span className="dim">Close {stats.shaky} while it's fresh.</span>
                <div className="whisper">my recommendation</div>
              </div>
              <div className="panel" style={{ padding: "13px 17px" }}>
                <b>B — move forward</b> <span className="dim">— revisit {stats.shaky} in 3 days, spaced.</span>
              </div>
              <div className="whisper">I'd choose A — your delayed-retrieval uncertainty is still high. But you can override me.</div>
              <div style={{ display: "flex", gap: 9 }}>
                <button className="chip" style={{ color: "var(--cyan)", borderColor: "var(--panel-line-hi)" }} onClick={() => setPhase("library")}>Take A</button>
                <button className="chip" onClick={() => setPhase("library")}>Actually, B</button>
                <button className="chip hint" onClick={() => { setMood("listen"); }}>I want something else</button>
              </div>
            </div>
          )}
          {phase === "library" && (
            <button className="btn cta rise" style={{ alignSelf: "flex-start" }} onClick={() => { setPhase("done"); onDone(); }}>Back to my room →</button>
          )}
        </div>

        <div style={{ width: "44%", padding: "4vh 26px 4vh 0", display: "flex", flexDirection: "column" }}>
          <div className="board-frame" style={{ flex: 1, padding: "26px 30px" }}>
            <div style={{ font: "italic 600 22px var(--font-display)", color: "var(--chalk)", borderBottom: "1px solid rgba(216,242,255,0.25)", paddingBottom: 8, marginBottom: 14 }}>
              {phase === "library" ? "LIBRARY" : "AFTER TODAY"}
            </div>
            {phase !== "library" ? (
              <div className="chalk-line" style={{ color: "var(--chalk)", fontSize: 15, lineHeight: 2 }}>
                <div>✓ {stats.top} — strong, with evidence</div>
                <div style={{ color: "var(--chalk-dim)" }}>◈ {stats.shaky} — uncertain, we're on it</div>
                <div style={{ color: "var(--warm)" }}>✎ your session notes → the Library, cleaned up</div>
                <div style={{ color: "var(--chalk-dim)", fontSize: 13 }}>tomorrow's plan updates the moment you leave this room</div>
              </div>
            ) : (
              <div className="chalk-line" style={{ color: "var(--chalk)", fontSize: 15, lineHeight: 2 }}>
                <div>✓ River systems — your explanation</div>
                <div>✓ The question you asked</div>
                <div>✓ Misconception we repaired</div>
                <div style={{ color: "var(--chalk-dim)" }}>your learning history — only yours, on your device</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 14, right: 22, zIndex: 3 }}>
        <span className="whisper" style={{ fontStyle: "italic" }}>
          {phase === "library" ? "“your notes are in the Library — I cleaned them up for you.”" : "\u00A0"}
        </span>
      </div>
    </div>
  );
}
