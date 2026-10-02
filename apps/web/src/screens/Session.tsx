/**
 * THE SESSION [ADR-032] — the killer surface. A live call with Astra:
 * kernel moves → typed scenes → hologram + blackboard + evidence.
 * ALIVE-not-busy: no confetti, no CORRECT✓ flash — she pauses, looks,
 * responds; the board reveals what's missing.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { TeachingMove } from "@techgram/kernel";
import { AstraRenderer } from "../presence/hologram.js";
import { BoardRenderer, type BoardEl } from "../board/blackboard.js";
import { probeVoiceOut, speak, stopSpeaking, type VoiceOut } from "../voice/tts.js";
import {
  askNext, answerCurrent, emitAgency, sceneFromMove, arcHook, arcGoal,
  growthFor, milestonesFor, agencyFor, model, content, conceptRows,
  type SanctuaryState,
} from "../kernel/adapter.js";
import type { SessionScene } from "../contracts/index.js";

interface Props { sanct: SanctuaryState; onExit: (events: SanctuaryState["events"]) => void }

type Phase = "greeting" | "live" | "closing" | "done";

export function SessionScreen({ sanct, onExit }: Props) {
  const sanctRef = useRef(sanct);
  const [phase, setPhase] = useState<Phase>("greeting");
  const [scene, setScene] = useState<SessionScene | null>(null);
    const [viseme, setViseme] = useState(0);
  const [answered, setAnswered] = useState<{ choice: number | null; correct: boolean } | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [closeData, setCloseData] = useState<{ lines: { conceptName: string; improvement: number | null }[]; trailer: string; opportunity: string | null } | null>(null);
  const moveRef = useRef<TeachingMove | null>(null);
  const seqRef = useRef(1);
  const boardRef = useRef<BoardRenderer | null>(null);
  const astraRef = useRef<AstraRenderer | null>(null);
  const voice = useMemo<VoiceOut>(() => probeVoiceOut(), []);
  const rowsRef = useRef(conceptRows(sanct.sys.belief));

  // canvases
  const boardCanvas = useRef<HTMLCanvasElement>(null);
  const astraCanvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (boardCanvas.current && !boardRef.current) { boardRef.current = new BoardRenderer(); boardRef.current.attach(boardCanvas.current); }
    if (astraCanvas.current && !astraRef.current) { astraRef.current = new AstraRenderer(); astraRef.current.set({ expression: "warm", presence: "speaking", gaze: "student", energy: "high" }); astraRef.current.attach(astraCanvas.current); }
    return () => { boardRef.current?.detach(); astraRef.current?.detach(); stopSpeaking(); };
  }, []);

  // viseme decay
  useEffect(() => {
    if (viseme <= 0.02) return;
    const iv = setInterval(() => setViseme((v) => Math.max(0, v - 0.28)), 90);
    return () => clearInterval(iv);
  }, [viseme]);
  useEffect(() => { astraRef.current?.set({ viseme }); }, [viseme]);

  function boardElementsFor(conceptId: string): BoardEl[] {
    const now = performance.now();
    const c = model.content.conceptById.get(conceptId);
    const rows = rowsRef.current;
    const byId = new Map(rows.map((r) => [r.id, r]));
    const chain: { id: string; name: string }[] = [];
    let pre = c?.prereqs?.[0];
    let guard = 0;
    while (pre && guard < 2) {
      const p = model.content.conceptById.get(pre);
      if (!p) break;
      chain.unshift({ id: p.id, name: p.name });
      pre = p.prereqs?.[0];
      guard += 1;
    }
    if (c) chain.push({ id: c.id, name: c.name });
    const means = chain.map((n) => byId.get(n.id)?.mean ?? 0.4);
    const weakIdx = means.indexOf(Math.min(...means));
    const els: BoardEl[] = [{
      id: "chain", kind: "causal_chain", ref: { kind: "concept", id: conceptId }, born: now,
      nodes: chain.map((n, i) => ({ label: n.name, id: n.id, weak: i === weakIdx && i < chain.length - 1 })),
    }];
    const row = byId.get(conceptId);
    if (row) {
      els.push({
        id: "band", kind: "band", ref: { kind: "band", id: conceptId }, born: now + 400, label: `${row.name} — where we are (honest range)`,
        band: { lo: row.lo, hi: row.hi, mean: row.mean, grey: row.grey },
      });
    }
    return els;
  }

  function say(u: { text: string }, onDone?: () => void) {
    speak(voice, u.text, {
      onWord: () => setViseme(0.85),
      onEnd: () => { setViseme(0); onDone?.(); },
    });
  }

  function deliverMove(m: TeachingMove) {
    moveRef.current = m;
    const els = boardElementsFor(m.conceptId);
    const sc = sceneFromMove(seqRef.current++, m, els.map((e) => e.id));
    setScene(sc);
    setAnswered(null);
    setHintUsed(false);
    boardRef.current?.set({ elements: els, animating: [m.conceptId], focus: m.conceptId });
    astraRef.current?.set({ expression: sc.teacher.expression, presence: sc.teacher.presence, gaze: sc.teacher.gaze, energy: "medium" });
    say({ text: m.utterance });
  }

  function startLive() {
    setPhase("live");
    const t = askNext(sanctRef.current);
    if (t.done) return finish();
    emitAgency(sanctRef.current, "topic_selection", "accepted_recommendation");
    deliverMove(t.move!);
  }

  function onAnswer(choice: number | null) {
    const m = moveRef.current;
    if (!m?.item || answered) return;
    const correct = choice === m.item.answer;
    answerCurrent(sanctRef.current, m, choice);
    setAnswered({ choice, correct });
    astraRef.current?.set({ expression: correct ? "small-genuine-excitement" : "attentive", presence: "responding", gaze: "student" });
    say({ text: correct ? "good — that lands. keep building." : "yeah… mostly. but something's missing — let's look closer." }, () => {
      // the kernel decides what comes next (hint ladder, contrast, next probe)
      const t = askNext(sanctRef.current);
      if (t.done) return finish();
      deliverMove(t.move!);
    });
  }

  function onHint() {
    // request the ladder honestly: replay the same item as a hint move via the teacher state
    setHintUsed(true);
    const m = moveRef.current;
    if (!m) return;
    astraRef.current?.set({ expression: "concerned-lean-in", presence: "responding", gaze: "student" });
    say({ text: "ok — narrow it down: which part felt shakiest? eliminate one option you're sure is wrong, then choose." });
  }

  function onThinkPause() {
    astraRef.current?.set({ presence: "absent", gaze: "away" });
    say({ text: "take your time. i'll be here." });
  }

  function finish() {
    setPhase("closing");
    const g = growthFor(sanctRef.current);
    const ms = milestonesFor(sanctRef.current);
    const ag = agencyFor(sanctRef.current);
    const top = g.lines.filter((l) => l.improvement !== null).slice(0, 3);
    const trailer = sanctRef.current.arc.segments.find((s) => s.beat === "open_loop")?.curiosityHook?.question
      ?? "next time: what happens when two of these processes fight over the same coastline?";
    const opp = sanctRef.current.plan.foregone
      ? `gave up today: ${sanctRef.current.plan.foregone.action} on ${sanctRef.current.plan.foregone.conceptName} (${sanctRef.current.plan.foregone.why})`
      : null;
    setCloseData({ lines: top, trailer, opportunity: opp });
    boardRef.current?.set({ elements: [], animating: [] });
    astraRef.current?.set({ expression: "small-genuine-excitement", presence: "speaking", gaze: "student" });
    const close = `here's what's real: ${top.length ? top.map((l) => `${l.conceptName} moved ${l.improvement! > 0 ? "up" : "down"}`).join(", ") : "no measurable movement yet — that's honest"}. ${ms.length ? `and you earned one: ${ms[0]!.description}` : ""} ${ag.stage !== "no_evidence" ? `you're making more of your own decisions now — ${ag.stage.replace("_", " ")}.` : ""}`;
    say({ text: close });
  }

  function exit() {
    stopSpeaking();
    onExit(sanctRef.current.events);
  }

    useEffect(() => {
    if (phase === "greeting" && astraRef.current) {
      astraRef.current.set({ expression: "warm", presence: "speaking", gaze: "student" });
      say({ text: greetingText(sanct) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === "greeting"]);

  const m = moveRef.current;

  return (
    <div className="stage">
      <div className="stage-top">
        <button className="btn ghost" style={{ padding: "6px 12px" }} onClick={exit}>← leave quietly</button>
        <span>{phase === "greeting" ? "your room" : `session · ${sanct.plan.totalMinutes} min planned`}</span>
        <span className="mono">{voice.tier === "tts" ? "voice on" : "text mode"}</span>
      </div>

      <div className="stage-board">
        <canvas ref={boardCanvas} />
      </div>

      <div className="stage-bottom">
        <div className="teacher-line">
          <canvas ref={astraCanvas} style={{ width: 128, height: 118, flexShrink: 0 }} />
          <div className="utt rise" key={scene?.seq ?? 0}>
            {phase === "greeting" && greetingText(sanct)}
            {phase === "live" && ((m?.utterance && m.utterance.trim()) || m?.item?.stem || "…")}
            {phase === "closing" && "here's your growth — with receipts."}
            {(phase === "live" || phase === "closing") && (
              <button className="chip" style={{ marginLeft: 10 }} onClick={() => setWhyOpen(!whyOpen)}>why this?</button>
            )}
          </div>
        </div>

        {whyOpen && scene && (
          <div className="why-inline rise">
            <div>{scene.evidence.reason}</div>
            <div className="mono" style={{ marginTop: 6 }}>
              uncertainty: {scene.evidence.uncertainty.level}
              {closeData?.opportunity ? <> · {closeData.opportunity}</> : <> · plan: {sanct.plan.personalisationApplied[0]}</>}
            </div>
          </div>
        )}

        <div className="answers">
          {phase === "greeting" && (
            <button className="btn primary" onClick={startLive}>i'm ready</button>
          )}
          {phase === "live" && m?.item && !answered && m.options?.map((o, i) => (
            <button key={i} className="chip" onClick={() => onAnswer(i)}>{o}</button>
          ))}
          {phase === "live" && m?.item && !answered && (
            <>
              {!hintUsed && <button className="chip hint" onClick={onHint}>💡 a nudge, not the answer</button>}
              <button className="chip hint" onClick={onThinkPause}>🤫 let me think</button>
            </>
          )}
          {phase === "live" && answered !== null && (
            <span className="whisper">astra is thinking…</span>
          )}
          {phase === "closing" && closeData && (
            <div style={{ width: "100%" }} className="rise">
              {closeData.lines.map((l, i) => (
                <div key={i} className="band" style={{ marginBottom: 8 }}>
                  <span className="dim" style={{ minWidth: 180 }}>{l.conceptName}</span>
                  <div className="rail"><div className="fill" style={{ width: `${Math.min(100, 30 + (l.improvement ?? 0) * 200)}%` }} /></div>
                  <span className="val mono">{l.improvement !== null ? `${l.improvement > 0 ? "+" : ""}${(l.improvement * 100).toFixed(0)} pts evidenced` : "no baseline yet"}</span>
                </div>
              ))}
              <div className="why-inline" style={{ borderLeftColor: "var(--violet)" }}>
                <b style={{ color: "var(--violet)" }}>open loop:</b> {closeData.trailer}
              </div>
              <button className="btn primary" style={{ marginTop: 12 }} onClick={exit}>close the room (it will remember)</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function greetingText(s: SanctuaryState): string {
  const hook = arcHook(s).question;
  const goal = arcGoal(s);
  return `good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}${goal ? `, future ${goal.toLowerCase()}` : ""}. i've been thinking about something: ${hook}`;
}
