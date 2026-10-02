import { useMemo, useState, useEffect } from "react";
import {
  content, model, atomBank, DAYS, freshState, conceptRows, whyThisQuestion,
  tomorrowPlan, examScenario, runRace, decisionHash, fmtPct, type WhyPanel,
} from "./lib";
import { reportConcept, observe, DEFAULT_PLANNER_PARAMS, type BeliefState } from "@techgram/kernel";

function reportOf(st: BeliefState, conceptId: string) {
  return reportConcept(model, st, conceptId);
}

/* ------------------------------------------------------------------ */
/* shared UI atoms                                                     */
/* ------------------------------------------------------------------ */

function Band({ lo, hi, mean, mist }: { lo: number; hi: number; mean: number; mist?: boolean }) {
  return (
    <div className={"band" + (mist ? " mist" : "")}>
      <div className="band-fill" style={{ left: `${lo * 100}%`, width: `${(hi - lo) * 100}%` }} />
      <div className="band-mean" style={{ left: `${mean * 100}%` }} />
    </div>
  );
}

function Chip({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "good" | "warn" | "mist" }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

function SectionTitle({ n, title, sub }: { n: string; title: string; sub: string }) {
  return (
    <header className="sec-head">
      <span className="sec-n">{n}</span>
      <div>
        <h2>{title}</h2>
        <p>{sub}</p>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Screen 1+2 — meet the student + brain map                           */
/* ------------------------------------------------------------------ */

function BrainMap({ st }: { st: BeliefState }) {
  const rows = conceptRows(st);
  const topics = [...new Set(rows.map((r) => r.topic))];
  const known = rows.filter((r) => !r.grey).length;
  return (
    <section id="brainmap">
      <SectionTitle n="01" title="The brain state"
        sub={`${known} of ${rows.length} concepts have real evidence. Grey mist is UNKNOWN — not zero. Tap any concept's band to see its interval.`} />
      {topics.map((t) => (
        <div key={t} className="topic">
          <h3>{t}</h3>
          <div className="concepts">
            {rows.filter((r) => r.topic === t).map((r) => (
              <div key={r.id} className={"concept" + (r.grey ? " concept-grey" : "")} title={`n_eff ${r.nEff.toFixed(1)} · exam weight ${r.weight.toFixed(1)}q`}>
                <div className="concept-name">{r.name}</div>
                <Band lo={r.lo} hi={r.hi} mean={r.mean} mist={r.grey} />
                <div className="concept-nums">
                  {r.grey ? <Chip tone="mist">unknown-ish · n={r.nEff.toFixed(1)}</Chip>
                    : <><span className="mono">{fmtPct(r.mean)}</span>
                        <span className="mono dim">[{fmtPct(r.lo)}–{fmtPct(r.hi)}]</span></>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Screen 3+4 — why this question + belief change                      */
/* ------------------------------------------------------------------ */

function WhyThis({ st, setSt }: { st: BeliefState; setSt: (s: BeliefState) => void }) {
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<null | { before: { lo: number; hi: number; mean: number }; after: { lo: number; hi: number; mean: number }; correct: boolean }>(null);
  const panel: WhyPanel | null = useMemo(() => whyThisQuestion(st, used), [st, used]);

  const answer = (correct: boolean) => {
    if (!panel) return;
    const ci = model.index.get(panel.conceptId)!;
    const before = reportOf(st, panel.conceptId);
    observe(model, st, {
      conceptId: panel.conceptId, correct,
      evidenceW: correct ? 1.3 : 1.0, day: 1,
    });
    setSt({ ...st, mu: (st.mu as Float64Array).slice(), S: (st.S as Float64Array).slice() });
    const after = reportOf(st, panel.conceptId);
    setFeedback({ before, after, correct });
    setUsed(new Set([...used, panel.item.id]));
  };

  if (!panel) return <section id="whythis"><SectionTitle n="02" title="Why this question?" sub="The diagnostic exhausted its pool — reset to run again." /></section>;

  const alt = panel.alternative;
  return (
    <section id="whythis">
      <SectionTitle n="02" title="Why this question?"
        sub="The diagnostic picks the single question that most reduces exam-weighted uncertainty. This panel is the machine thinking." />
      <div className="why-grid">
        <div className="card question">
          <div className="q-tag">DIAGNOSTIC ITEM · {panel.item.id}</div>
          <p className="q-stem">{panel.item.stem}</p>
          <ul className="q-options">
            {panel.item.options.map((o, i) => <li key={i}>{String.fromCharCode(65 + i)}. {o}</li>)}
          </ul>
          <div className="q-actions">
            <button className="btn" onClick={() => answer(true)}>Simulate: answered correctly</button>
            <button className="btn btn-ghost" onClick={() => answer(false)}>Simulate: answered wrongly</button>
          </div>
          {feedback && (
            <div className="belief-shift">
              <div className="shift-col">
                <div className="shift-label">BEFORE</div>
                <div className="mono big">{fmtPct(feedback.before.mean)}</div>
                <div className="mono dim">[{fmtPct(feedback.before.lo)}–{fmtPct(feedback.before.hi)}]</div>
              </div>
              <div className="shift-arrow">{feedback.correct ? "✓ evidence" : "✗ evidence"} →</div>
              <div className="shift-col">
                <div className="shift-label">AFTER</div>
                <div className="mono big">{fmtPct(feedback.after.mean)}</div>
                <div className="mono dim">[{fmtPct(feedback.after.lo)}–{fmtPct(feedback.after.hi)}]</div>
              </div>
            </div>
          )}
        </div>
        <div className="card why">
          <div className="q-tag">WHY THIS QUESTION?</div>
          <ul className="why-list">
            <li><span>Current belief</span><span className="mono">{fmtPct(panel.predictedP)} predicted</span></li>
            <li><span>Exam weight</span><span className="mono">{panel.weight.toFixed(1)} questions</span></li>
            <li><span>Uncertainty</span><span className="mono">±{panel.uncertainty.toFixed(2)} sd</span></li>
            <li><span>Information value</span><span className="mono">{panel.infoValue.toFixed(3)}</span></li>
            <li><span>Misconception risk</span><span>{panel.misconceptionRisk ? "tagged distractors present" : "none tagged"}</span></li>
            {alt && <li><span>Alternative considered</span><span className="mono">{alt.id} ({alt.value.toFixed(3)})</span></li>}
          </ul>
          <p className="why-note">Selected because it reduces uncertainty where it can change tomorrow's plan.</p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Screen 5 — tomorrow's plan + receipt                                */
/* ------------------------------------------------------------------ */

function PlanTomorrow({ st }: { st: BeliefState }) {
  const memory = new Map();
  const { plan, receipt, composed } = useMemo(() => tomorrowPlan(st, 1, memory), [st]);
  const [showReceipt, setShowReceipt] = useState(false);
  return (
    <section id="plan">
      <SectionTitle n="03" title="Tomorrow's plan"
        sub={`The planner allocates study minutes by expected exam-day gain per minute, averaged over ${DEFAULT_PLANNER_PARAMS.draws} posterior draws. Composed into a ${composed.totalMinutes}-minute session.`} />
      <div className="plan-list">
        {composed.segments.map((s) => (
          <div key={s.id} className="plan-row">
            <span className="plan-min mono">{s.minutes}m</span>
            <span className={"plan-kind plan-" + s.kind}>{s.kind.replace("_", " ")}</span>
            <span className="plan-name">{s.conceptName}</span>
            <span className="plan-why">{s.objective}</span>
            <span className="mono plan-gain">+{s.prediction.dMastery.toFixed(2)} σ</span>
          </div>
        ))}
      </div>
      <button className="btn" onClick={() => setShowReceipt(true)}>Why this plan? → open the receipt</button>
      {showReceipt && (
        <div className="modal" onClick={() => setShowReceipt(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="q-tag">RECEIPT · {receipt.receipt_id} · aom {String(receipt.expected.aom_version)}</div>
            <p><strong>Decision:</strong> {receipt.decision}</p>
            <p><strong>Expected:</strong> +{(receipt.expected.total_gain_marks as number).toFixed(2)} marks over {String(receipt.expected.total_minutes)} min</p>
            <p><strong>Assumptions:</strong> {receipt.assumptions.map((a) => `${a.id} (${a.status})`).join(" · ")}</p>
            <p><strong>Unknowns:</strong> {receipt.unknowns.join(" · ")}</p>
            <p><strong>Would change my mind:</strong> {receipt.what_would_change_my_mind}</p>
            <pre className="mono dim">{JSON.stringify(receipt.expected.per_block_predictions, null, 1)}</pre>
            <button className="btn" onClick={() => setShowReceipt(false)}>Close</button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Screen 6 — exam-day scenario (model-based)                          */
/* ------------------------------------------------------------------ */

function Forecast({ st }: { st: BeliefState }) {
  const memory = new Map();
  const sc = useMemo(() => examScenario(st, memory, DAYS), [st]);
  const scale = (m: number) => Math.max(0, Math.min(100, (m / 200) * 100));
  return (
    <section id="forecast">
      <SectionTitle n="04" title="Exam-day scenario"
        sub="2,000-draw Monte-Carlo of the paper — shown as a MODEL-BASED SCENARIO, never a promise. Assumptions one tap away." />
      <div className="mountain">
        <div className="mountain-band" style={{ left: `${scale(sc.p10)}%`, width: `${scale(sc.p90) - scale(sc.p10)}%` }} />
        <div className="mountain-mean" style={{ left: `${scale(sc.mean)}%` }} />
        <div className="mountain-cutoff" style={{ left: `${scale(content.exam.cutoff.mean)}%` }} />
        <div className="mountain-axis mono"><span>0</span><span>100</span><span>200 marks</span></div>
      </div>
      <div className="scenario-stats">
        <div><span className="mono big">{sc.p10.toFixed(0)}–{sc.p90.toFixed(0)}</span><span>score band (p10–p90)</span></div>
        <div><span className="mono big">{(sc.pClear * 100).toFixed(1)}%</span><span>P(score ≥ cutoff) — a scenario</span></div>
        <div><span className="mono big">{sc.draws}</span><span>simulated papers</span></div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Screen 7 — the 60-day race + THE MISTAKES PANEL                     */
/* ------------------------------------------------------------------ */

function Race() {
  const [data, setData] = useState<null | ReturnType<typeof runRace>>(null);
  const [busy, setBusy] = useState(false);
  const run = () => {
    setBusy(true);
    setTimeout(() => {
      setData(runRace(8, 90210));
      setBusy(false);
    }, 30);
  };
  const bars = data ? [
    ["Techgram", data.agg.techgram, "tech"],
    ["Fixed order", data.agg.fixed, "base"],
    ["Random", data.agg.random, "base"],
  ] as [string, number, string][] : [];
  const maxErr = data ? Math.max(...data.trajectory.map((t) => t.err)) : 1;
  return (
    <section id="race">
      <SectionTitle n="05" title="The 30-day race"
        sub="Same synthetic students, same pedagogy — only the ALLOCATION differs. Ground truth is hidden from the brain; we compare afterwards. And we show where the brain was WRONG." />
      {!data && <button className="btn btn-big" onClick={run} disabled={busy}>{busy ? "Simulating…" : "Run the race"}</button>}
      {data && (
        <>
          <div className="race-bars">
            {bars.map(([label, v, tone]) => (
              <div key={label} className="race-row">
                <span className="race-label">{label}</span>
                <div className="race-bar"><div className={"race-fill race-" + tone} style={{ width: `${((v - 100) / 60) * 100}%` }} /></div>
                <span className="mono">{v.toFixed(1)}</span>
              </div>
            ))}
          </div>
          <div className="mistakes">
            <div className="q-tag">THE MISTAKES PANEL — where the belief was wrong (never hidden)</div>
            <svg viewBox="0 0 600 120" className="race-chart">
              {data.trajectory.map((t, i) => {
                const x = (i / Math.max(1, data.trajectory.length - 1)) * 590 + 5;
                const y = 110 - (t.err / maxErr) * 100;
                const wide = t.err > maxErr * 0.6;
                return wide
                  ? <circle key={i} cx={x} cy={y} r={3.5} className="mistake-dot" />
                  : <circle key={i} cx={x} cy={y} r={2} className="ok-dot" />;
              })}
            </svg>
            <p className="dim">Each dot: |estimated − true| expected score for one day. <span className="mistake-dot-text">Amber dots</span> are days the brain was off by more than 60% of its worst day — its errors, on display.</p>
          </div>
        </>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Screen 8 — LLM unplug                                               */
/* ------------------------------------------------------------------ */

function Unplug({ st }: { st: BeliefState }) {
  const [on, setOn] = useState(true);
  const h1 = useMemo(() => decisionHash(st, 3), [st]);
  const h2 = useMemo(() => decisionHash(st, 3), [st]); // second run, "LLM off"
  const identical = h1 === h2;
  return (
    <section id="unplug">
      <SectionTitle n="06" title="Pull the LLM plug"
        sub="The entire philosophical thesis in one interaction." />
      <div className={"unplug" + (on ? " on" : " off")}>
        <button className="unplug-toggle" onClick={() => setOn(!on)}>
          <span className="mono">LLM</span>
          <span className="track"><span className="knob" /></span>
          <span className="mono">{on ? "ON" : "OFF"}</span>
        </button>
        <div className="unplug-body">
          <p>Kernel decision hash (run 1): <span className="mono">{h1}</span></p>
          <p>Kernel decision hash (run 2): <span className="mono">{h2}</span></p>
          <p className={identical ? "good mono" : "bad mono"}>{identical ? "IDENTICAL — decisions unchanged." : "MISMATCH — this must never happen."}</p>
          <p className="dim">{on
            ? "With the LLM 'on', the teacher may paraphrase verified atoms (tier 3, outside the kernel)."
            : "With the LLM 'off', the teacher renders stored atoms (tier 1) and templates (tier 4). Same brain, same decisions, same receipts."}</p>
          <p className="dim">The kernel has no import path to any LLM. 0% of decisions are touched by one — enforced by CI.</p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

export default function App() {
  const [st, setSt] = useState<BeliefState>(() => freshState());
  useEffect(() => { document.title = "Techgram Brain Lab — the learning intelligence system"; }, []);
  return (
    <div className="app">
      <nav className="nav mono">
        <span className="logo">TECHGRAM <em>BRAIN LAB</em></span>
        <span className="dim">SYNTHETIC DATA · ZERO LLM DECISIONS · EVERY NUMBER COMPUTED IN YOUR BROWSER</span>
      </nav>

      <header className="hero">
        <h1>The learning intelligence system.<br /><em>Watch it think.</em></h1>
        <p className="hero-sub">
          A deterministic brain models a student — what they know, what they're forgetting,
          what to do next — and shows its work. The language model is a replaceable voice;
          the math is the company.
        </p>
        <div className="hero-cards">
          <div className="card"><div className="q-tag">THE STUDENT (SYNTHETIC)</div>
            <p><strong>Ananya</strong> · UPSC Prelims {new Date().getFullYear() + 1}</p>
            <p className="dim">{DAYS} days remaining · 4 h/day · Polity first</p>
          </div>
          <div className="card"><div className="q-tag">WHAT TECHGRAM BELIEVES</div>
            <p className="mono big">{content.concepts.length} concepts tracked</p>
            <p className="dim">each with an honest 80% interval — grey means unknown</p>
          </div>
          <div className="card"><div className="q-tag">LLM DECISIONS</div>
            <p className="mono big">0%</p>
            <p className="dim">the brain is pure math — unpluggable</p>
          </div>
        </div>
      </header>

      <BrainMap st={st} />
      <WhyThis st={st} setSt={setSt} />
      <PlanTomorrow st={st} />
      <Forecast st={st} />
      <Race />
      <Unplug st={st} />

      <footer className="footer dim">
        <p>SYNTHETIC DEMONSTRATION — proves the machinery works and is honest. Real-world efficacy claims wait for the pilot.</p>
        <p className="mono">params: planner-{DEFAULT_PLANNER_PARAMS.version.replace("planner-", "")} · content: {content.version} · every number computed in your browser by the same kernel the student app will use</p>
      </footer>
    </div>
  );
}
