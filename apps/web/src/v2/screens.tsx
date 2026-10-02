/**
 * V2 SCREENS — "The Warm Room" per the founder's vision boards.
 * Visuals-first build: exact layout/colour/animation replication.
 * Kernel data flows where it exists (plan, understanding bars, why-reasons,
 * growth, agency, curiosity); art layers are ART-SWAP ready.
 */
import { useEffect, useMemo, useState } from "react";
import { Room } from "../art/Room.js";
import { Mentor, type MentorMood } from "../art/Mentor.js";
import { ThinkingBrain, RiverBoard } from "../art/Board.js";
import { conceptRows, growthFor, agencyFor, content, type SanctuaryState } from "../kernel/adapter.js";
import type { ConceptRow } from "../kernel/adapter.js";

/* ---------------- shared bits ---------------- */

export function UnderstandingPanel({ rows }: { rows: ConceptRow[] }) {
  const state = (r: ConceptRow): { c: string; t: string; w: number } =>
    r.grey ? { c: "var(--u-uncertain)", t: "Uncertain", w: 0.4 }
    : r.mean >= 0.65 ? { c: "var(--u-strong)", t: "Strong", w: r.mean }
    : r.mean >= 0.5 ? { c: "var(--u-developing)", t: "Developing", w: r.mean }
    : { c: "var(--u-weak)", t: "Needs work", w: Math.max(0.12, r.mean) };
  const pick = rows.slice(0, 4);
  return (
    <div className="panel" style={{ padding: "18px 20px" }}>
      <div className="panel-title">My current understanding of you</div>
      {pick.length === 0 && <div className="whisper">not enough evidence yet — the first sessions build this.</div>}
      {pick.map((r) => {
        const s = state(r);
        return (
          <div className="u-row" key={r.id}>
            <span className="name">{r.name}</span>
            <span className="u-pill"><i style={{ width: `${s.w * 100}%`, background: s.c }} /></span>
            <span className="u-tag" style={{ color: s.c }}>{s.t}</span>
          </div>
        );
      })}
    </div>
  );
}

const WHY_REASONS = [
  { c: "var(--cyan)", i: "◉", t: "Your confidence was high (0.82)", s: "but recent retrievals suggest uncertainty" },
  { c: "var(--u-strong)", i: "✦", t: "This question separates “know” vs “temporal recall”", s: "high information value" },
  { c: "var(--u-uncertain)", i: "◎", t: "Targets a known misconception", s: "transport stage often missed" },
  { c: "var(--u-developing)", i: "◈", t: "Helps improve long-term retention", s: "spaced practice window" },
];

export function WhyThisPanel({ kernelReason }: { kernelReason?: string }) {
  return (
    <div className="panel" style={{ padding: "18px 20px", marginBottom: 16 }}>
      <div className="panel-title">Why this question?</div>
      <div className="whisper" style={{ marginBottom: 6 }}>Here's my reasoning:</div>
      {kernelReason && (
        <div className="why-row"><span className="dot" style={{ borderColor: "var(--lamp)", color: "var(--lamp)" }}>★</span>
          <div><div style={{ fontSize: 13.5 }}>{kernelReason}</div><div className="whisper">live from the kernel</div></div></div>
      )}
      {WHY_REASONS.map((r, i) => (
        <div className="why-row" key={i}>
          <span className="dot" style={{ borderColor: r.c, color: r.c }}>{r.i}</span>
          <div><div style={{ fontSize: 13.5 }}>{r.t}</div><div className="whisper">{r.s}</div></div>
        </div>
      ))}
      <button className="btn" style={{ width: "100%", marginTop: 8, color: "var(--cyan)" }}>See full brain reasoning →</button>
    </div>
  );
}

/* ---------------- HOME ---------------- */

export function HomeV2({ sanct, onStart }: { sanct: SanctuaryState; onStart: () => void }) {
  const rows = useMemo(() => conceptRows(sanct.sys.belief), [sanct]);
  const g = useMemo(() => growthFor(sanct), [sanct]);
  const steps = [
    { n: 1, t: "Quick recall", d: "check what's sticky", m: 5 },
    { n: 2, t: "Concept repair", d: sanct.plan.blocks[0]?.conceptName ?? content.concepts[0]!.name, m: 20 },
    { n: 3, t: "Apply & test", d: "mixed questions, real style", m: 15 },
  ];
  const improved = g.lines.filter((l) => (l.improvement ?? 0) > 0.02).length;
  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <Room variant="home" />
      <div style={{ position: "relative", zIndex: 2, display: "flex", height: "100%" }}>
        <div style={{ flex: 1.25, padding: "7vh 3vw 5vh", display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 640 }}>
          <div className="rise">
            <Mentor mood="happy" size={210} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 600, margin: "10px 0 12px" }}>Good evening, Arjun.</h1>
          <p className="dim" style={{ fontSize: 16, maxWidth: 460 }}>
            I've been thinking about yesterday's delta question…
          </p>
          <p className="dim" style={{ fontSize: 14.5, maxWidth: 470, marginTop: 6 }}>
            You were strong on {rows.find((r) => !r.grey)?.name.toLowerCase() ?? "erosion"}. I'm less certain about whether you can retrieve the full process tomorrow. Shall we strengthen that today?
          </p>

          <div className="panel rise" style={{ padding: "20px 24px", marginTop: 22, maxWidth: 470 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="panel-title" style={{ marginBottom: 4 }}>Today's Plan</div>
              <span className="mono whisper">{sanct.plan.totalMinutes > 0 ? `~${sanct.plan.totalMinutes} min` : "~40 min"}</span>
            </div>
            <div className="whisper" style={{ marginBottom: 12 }}>Geomorphology · River Systems</div>
            {steps.map((s) => (
              <div key={s.n} style={{ display: "flex", gap: 13, alignItems: "flex-start", padding: "7px 0" }}>
                <span style={{ width: 26, height: 26, borderRadius: "50%", border: "1.5px solid var(--panel-line-hi)", display: "grid", placeItems: "center", fontSize: 12.5, color: "var(--cyan)", flexShrink: 0 }}>{s.n}</span>
                <div><div style={{ fontSize: 14.5, fontWeight: 500 }}>{s.t} <span className="whisper" style={{ fontWeight: 400 }}>({s.m} min)</span></div>
                  <div className="whisper">{s.d}</div></div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
              <button className="btn cta" onClick={onStart}>Start Session →</button>
              <button className="btn ghost" style={{ color: "var(--ink-2)" }}>See why this?</button>
            </div>
          </div>
          <p className="whisper" style={{ marginTop: 18, fontStyle: "italic" }}>
            “Progress isn't about never forgetting, but about coming back stronger.” <span className="dim">— your learning buddy</span>
          </p>
          {improved > 0 && <div className="mono" style={{ color: "var(--u-strong)", marginTop: 6 }}>{improved} concept{improved > 1 ? "s" : ""} moved with evidence</div>}
        </div>
        <div style={{ width: 320, padding: "6vh 22px 5vh 0", display: "flex", flexDirection: "column", gap: 16, justifyContent: "center" }}>
          <UnderstandingPanel rows={rows} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- SESSION ---------------- */

const THINK_STEPS = ["Analyzing your answer…", "Updating belief state…", "Checking misconceptions…", "Selecting next question…", "Preparing explanation…"];

export function SessionV2({ sanct, onEnd }: { sanct: SanctuaryState; onEnd: () => void }) {
  const [mood, setMood] = useState<MentorMood>("speak");
  const [bubble, setBubble] = useState("Let's figure this out together. Where do you think the process is influenced by the slope change?");
  const [boardHi, setBoardHi] = useState("transport");
  const [thinking, setThinking] = useState(false);
  const [thinkStep, setThinkStep] = useState(0);
  const [secs, setSecs] = useState(40 * 60);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const rows = useMemo(() => conceptRows(sanct.sys.belief), [sanct]);

  useEffect(() => {
    const iv = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(iv);
  }, []);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  function runThinking() {
    setThinking(true); setThinkStep(0); setMood("think");
    THINK_STEPS.forEach((_, i) => setTimeout(() => setThinkStep(i + 1), 550 * (i + 1)));
    setTimeout(() => {
      setThinking(false); setMood("happy");
      setBubble("Exactly. Slope strongly influences the transport stage. Now let's see what happens when the gradient decreases…");
      setBoardHi("deposition");
    }, 550 * THINK_STEPS.length + 900);
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      <Room variant="session" />
      <div className="sess-top" style={{ position: "relative", zIndex: 3 }}>
        <button className="btn ghost" style={{ padding: "6px 12px" }} onClick={onEnd}>←</button>
        <span style={{ fontSize: 14 }}>Session · <b>Geomorphology · River Systems</b></span>
        <span className="wave">{[0, 1, 2, 3, 4, 5, 6].map((i) => <i key={i} style={{ animationDelay: `${i * 0.12}s` }} />)}</span>
        <span className="pill live">● Live with Techgram</span>
        <span style={{ flex: 1 }} />
        <span className="mono" style={{ color: "var(--ink-2)" }}>⏱ {mm}:{ss} / 40:00</span>
        <button className="pill danger" onClick={onEnd}>End Session</button>
      </div>

      <div className="sess-main" style={{ position: "relative", zIndex: 2 }}>
        <div className="sess-left">
          <div className="mentor-scene" style={{ display: "flex", alignItems: "flex-end", gap: 18, padding: "8px 26px 0" }}>
            <Mentor mood={mood} size={230} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingBottom: 18 }}>
              <div className="bubble rise" key={bubble}>{bubble}</div>
              {listening && (
                <div className="panel rise" style={{ padding: "12px 16px", maxWidth: 380 }}>
                  <span className="wave">{[0, 1, 2, 3, 4, 5].map((i) => <i key={i} style={{ animationDelay: `${i * 0.1}s` }} />)}</span>
                  <span className="whisper" style={{ marginLeft: 10 }}>Listening…</span>
                </div>
              )}
              {heard && (
                <div className="panel rise" style={{ padding: "12px 16px", maxWidth: 380 }}>
                  <div className="whisper" style={{ marginBottom: 4 }}>I heard:</div>
                  <div style={{ fontSize: 14 }}>{heard}</div>
                  <button className="btn" style={{ marginTop: 8, padding: "6px 14px", color: "var(--cyan)" }} onClick={() => { setHeard(null); setListening(false); runThinking(); }}>Send</button>
                </div>
              )}
            </div>
          </div>

          <div className="board-wrap">
            <div className="board-frame"><RiverBoard highlight={boardHi} /></div>
            <div className="tools">
              {["✎", "⬚", "◑", "T", "🖼", "↺"].map((t, i) => <button key={i} className={i === 0 ? "on" : ""}>{t}</button>)}
            </div>
          </div>

          <div className="mic-bar">
            <button className="mic-ctl"><svg viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3" /></svg>Mute</button>
            <button className="mic-ctl"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9 12h6" /></svg>Turn Off</button>
            <div style={{ textAlign: "center" }}>
              <button
                className="mic-btn"
                onMouseDown={() => { setListening(true); setMood("listen"); }}
                onMouseUp={() => { setHeard("so does increased rainfall always lead to a bigger delta?"); setMood("listen"); }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
              </button>
              <div className="whisper" style={{ marginTop: 6 }}>Hold to speak</div>
            </div>
            <button className="mic-ctl" onClick={() => { setListening(false); setHeard(null); setBubble("Take your time… type it instead. I'm listening."); }}><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="3" /><path d="M8 10h8M8 14h5" /></svg>Type instead</button>
            <button className="mic-ctl" onClick={() => setBubble("Being unsure is information too — let's sharpen it with one small question.")}><svg viewBox="0 0 24 24"><path d="M9 9a3 3 0 1 1 4.6 2.5c-1 .7-1.6 1.2-1.6 2.5M12 17.5v.1" /><circle cx="12" cy="12" r="9" /></svg>I'm not sure</button>
            <button className="mic-ctl" onClick={() => setBubble("Great doubt — that's exactly what the notebook keeps. Let's take it.")}><svg viewBox="0 0 24 24"><path d="M4 6h16v10H9l-5 4z" /></svg>Ask Doubt</button>
            <button className="mic-ctl hot" onClick={runThinking}><svg viewBox="0 0 24 24"><path d="M12 3l2.2 5.2L20 10l-5.8 1.8L12 17l-2.2-5.2L4 10l5.8-1.8z" /></svg>Show Why</button>
          </div>
        </div>

        <div className="sess-right">
          <WhyThisPanel kernelReason={sanct.plan.blocks[0]?.reason} />
          <UnderstandingPanel rows={rows} />
        </div>
      </div>

      {thinking && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(8,6,14,0.72)", display: "grid", placeItems: "center", backdropFilter: "blur(4px)" }}>
          <div className="panel think-panel rise" style={{ display: "flex", gap: 30, alignItems: "center", padding: "30px 40px" }}>
            <ThinkingBrain size={150} />
            <div>
              <div className="panel-title" style={{ fontSize: 17, marginBottom: 8 }}>Thinking…</div>
              {THINK_STEPS.map((s, i) => (
                <div key={s} className={`think-row ${thinkStep > i ? "done" : ""}`}>
                  <span className="tick">✓</span>{s}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- LEARNING MAP ---------------- */

export function MapV2({ sanct }: { sanct: SanctuaryState }) {
  const rows = useMemo(() => conceptRows(sanct.sys.belief), [sanct]);
  const st = (r: ConceptRow) => r.grey ? { c: "var(--u-uncertain)", t: "Uncertain" } : r.mean >= 0.65 ? { c: "var(--u-strong)", t: "Strong" } : r.mean >= 0.5 ? { c: "var(--u-developing)", t: "Developing" } : { c: "var(--u-weak)", t: "Needs work" };
  const nodes = rows.slice(0, 6);
  const pos = [[300, 210], [130, 120], [470, 110], [120, 320], [470, 330], [300, 60]];
  const center = nodes[0];
  return (
    <div className="screen-pad" style={{ height: "100vh" }}>
      <div className="grid-2">
        <div className="panel" style={{ padding: "20px 24px" }}>
          <div className="tabs">
            {["Geography", "History", "Polity", "Environment"].map((t, i) => <button key={t} className={i === 0 ? "on" : ""}>{t}</button>)}
          </div>
          <div className="map-stage">
            <svg className="map-edge" style={{ inset: 0 }} width="100%" height="100%">
              {nodes.slice(1).map((n, i) => {
                const [x1, y1] = pos[0]!; const [x2, y2] = pos[i + 1]!;
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(77,216,255,0.25)" strokeWidth="1.5" />;
              })}
            </svg>
            {nodes.map((n, i) => {
              const s = st(n);
              return (
                <div key={n.id} className="map-node" style={{ left: pos[i]![0], top: pos[i]![1], borderColor: s.c, boxShadow: `0 0 18px ${s.c}33`, color: i === 0 ? "var(--cyan)" : "var(--ink)" }}>
                  {n.name}<small style={{ color: s.c }}>{s.t}</small>
                </div>
              );
            })}
            {!center && <div className="whisper">the map forms as you learn — one session in, this lights up.</div>}
          </div>
          <div className="tabs" style={{ marginTop: 8 }}>
            {[["Strong", "var(--u-strong)"], ["Developing", "var(--u-developing)"], ["Uncertain", "var(--u-uncertain)"], ["Needs work", "var(--u-weak)"]].map(([t, c]) => (
              <span key={t} className="mono" style={{ color: c, border: `1px solid ${c}44`, padding: "4px 11px", borderRadius: 999 }}>{t}</span>
            ))}
          </div>
        </div>
        <UnderstandingPanel rows={rows} />
      </div>
    </div>
  );
}

/* ---------------- GROWTH ---------------- */

export function GrowthV2({ sanct }: { sanct: SanctuaryState }) {
  const rows = useMemo(() => conceptRows(sanct.sys.belief), [sanct]);
  const g = useMemo(() => growthFor(sanct), [sanct]);
  const colors = ["#4ade80", "#fbbf24", "#f87171", "#60a5fa"];
  const picked = rows.slice(0, 4);
  const W = 560, H = 260;
  const curve = (i: number) => {
    const r = picked[i];
    const end = r ? r.mean : 0.3 + i * 0.08;
    const start = Math.max(0.08, end - 0.22 - i * 0.03);
    return `M 30 ${H - 24 - start * (H - 60)} C ${W * 0.35} ${H - 24 - (start + (end - start) * 0.4) * (H - 60)}, ${W * 0.6} ${H - 24 - (start + (end - start) * 0.75) * (H - 60)}, ${W - 30} ${H - 24 - end * (H - 60)}`;
  };
  return (
    <div className="screen-pad" style={{ height: "100vh" }}>
      <div className="grid-2">
        <div className="panel" style={{ padding: "22px 26px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="panel-title">Then → Now</div>
            <span className="pill">your ability to explain has changed</span>
          </div>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="chart-frame">
            {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="30" x2={W - 30} y1={H - 24 - f * (H - 60)} y2={H - 24 - f * (H - 60)} stroke="rgba(255,255,255,0.06)" />)}
            <line x1="30" x2={W - 30} y1={H - 24} y2={H - 24} stroke="rgba(255,255,255,0.15)" />
            {picked.map((_, i) => (
              <path key={i} d={curve(i)} fill="none" stroke={colors[i]} strokeWidth="2.4" strokeLinecap="round" strokeDasharray="900" strokeDashoffset="900" style={{ animation: "drawline 1.6s ease forwards" }} />
            ))}
            <style>{"@keyframes drawline{to{stroke-dashoffset:0}}"}</style>
            {picked.map((r, i) => <circle key={i} cx={W - 30} cy={H - 24 - r.mean * (H - 60)} r="4" fill={colors[i]} />)}
          </svg>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {picked.map((r, i) => <span key={r.id} className="mono" style={{ color: colors[i] }}>● {r.name}</span>)}
          </div>
        </div>
        <div>
          <div className="panel" style={{ padding: "18px 20px", marginBottom: 16 }}>
            <div className="panel-title">Before → After</div>
            <div className="whisper" style={{ marginBottom: 8 }}>3 weeks ago</div>
            <div className="dim" style={{ fontSize: 14, marginBottom: 12 }}>◦ Could identify erosion. Often missed transport → deposition.</div>
            <div className="whisper" style={{ marginBottom: 8 }}>Now</div>
            <div style={{ fontSize: 14, color: "var(--u-strong)" }}>● Can explain the full chain with examples.</div>
            <div style={{ fontSize: 14, color: "var(--u-strong)" }}>● Correctly connects slope → transport → deposition → delta.</div>
            <button className="btn" style={{ width: "100%", marginTop: 14, color: "var(--cyan)" }}>See evidence →</button>
          </div>
          <div className="panel" style={{ padding: "18px 20px" }}>
            <div className="panel-title" style={{ fontSize: 14 }}>{g.summary}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- ARTIFACTS ---------------- */

export function ArtifactsV2({ sanct }: { sanct: SanctuaryState }) {
  const [tab, setTab] = useState("Questions");
  const qs = sanct.sys.curiosity.questions;
  const arts = tab === "Questions"
    ? (qs.length ? qs.map((q) => ({ t: q.question, d: `day ${q.day}` })) : [
        { t: "Why rainfall doesn't always mean a bigger delta", d: "example" },
        { t: "Comparison: Ganga vs Brahmaputra", d: "example" },
      ])
    : tab === "Notes"
      ? [{ t: "River systems — my explanation", d: sanct.events.length ? "yours" : "example" }]
      : tab === "Diagrams"
        ? [{ t: "The river system — my sketch of the chain", d: "example" }]
        : [{ t: "My misconceptions", d: "example" }, { t: "Confidence vs accuracy — what it taught me", d: "example" }];
  return (
    <div className="screen-pad" style={{ height: "100vh" }}>
      <div className="panel" style={{ padding: "22px 26px", maxWidth: 720 }}>
        <div className="panel-title">Artifacts — your thinking history</div>
        <div className="tabs">
          {["Notes", "Diagrams", "Questions", "Insights"].map((t) => <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>)}
        </div>
        {arts.map((a, i) => (
          <div className="art-row" key={i}>
            <div className="thumb" style={{ background: `linear-gradient(135deg, rgba(77,216,255,${0.15 + i * 0.06}), rgba(139,92,246,0.18))` }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5 }}>{a.t}</div>
              <div className="whisper">{a.d}</div>
            </div>
            <span className="whisper">⋯</span>
          </div>
        ))}
        {arts.length === 0 && <div className="whisper">nothing here yet — your questions, notes and sketches will live here.</div>}
      </div>
    </div>
  );
}

/* ---------------- AGENCY ---------------- */

export function AgencyV2({ sanct }: { sanct: SanctuaryState }) {
  const ag = useMemo(() => agencyFor(sanct), [sanct]);
  const moments = [
    { c: "var(--u-strong)", i: "✋", t: "You chose to practice retrieval instead of just reading.", d: "Today" },
    { c: "var(--cyan)", i: "✦", t: "You asked a deeper question about slope and rainfall.", d: "Today" },
    { c: "var(--u-uncertain)", i: "⚑", t: "You challenged my recommendation. And you were right — good catch!", d: "This week" },
    { c: "var(--u-developing)", i: "◎", t: "You identified your weak concept and asked for a targeted session.", d: "This week" },
  ];
  return (
    <div className="screen-pad" style={{ height: "100vh" }}>
      <div className="panel" style={{ padding: "22px 26px", maxWidth: 640 }}>
        <div className="panel-title">Agency moments — you're taking charge</div>
        <p className="dim" style={{ fontSize: 14 }}>{ag.note}</p>
        {moments.map((m, i) => (
          <div className="ag-row" key={i}>
            <span className="ic" style={{ border: `1.5px solid ${m.c}`, color: m.c }}>{m.i}</span>
            <div><div style={{ fontSize: 14.5 }}>{m.t}</div><div className="whisper">{m.d}</div></div>
          </div>
        ))}
        {ag.byDecision.map((d) => (
          <div className="ag-row" key={d.decision}>
            <span className="ic" style={{ border: "1.5px solid var(--panel-line-hi)", color: "var(--cyan)" }}>◈</span>
            <div><div style={{ fontSize: 14 }}>{d.decision.replace(/_/g, " ")}</div><div className="whisper">{d.evidence}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- SETTINGS ---------------- */

export function SettingsV2() {
  const rows = [
    { i: "◑", t: "Your preferences", s: "humour, pace, depth" },
    { i: "🎙", t: "Voice & language", s: "speech in and out" },
    { i: "⤓", t: "Offline mode", s: "content always available" },
    { i: "◐", t: "Appearance", s: "warm, calm, you" },
    { i: "🔒", t: "Privacy", s: "your data stays on your device" },
  ];
  return (
    <div className="screen-pad" style={{ height: "100vh" }}>
      <div className="panel" style={{ padding: "14px 22px", maxWidth: 560 }}>
        <div className="panel-title" style={{ padding: "10px 6px 4px" }}>Settings</div>
        {rows.map((r) => (
          <div className="set-row" key={r.t}>
            <span className="ic">{r.i}</span>
            <div><div style={{ fontSize: 14.5 }}>{r.t}</div><div className="whisper">{r.s}</div></div>
            <span className="arrow">›</span>
          </div>
        ))}
      </div>
    </div>
  );
}
