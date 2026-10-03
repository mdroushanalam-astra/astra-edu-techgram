/**
 * ONBOARDING [ADR-033] — Layer A (explicit details, 3 short steps — no hell)
 * + Layer B (3 behavioural calibration questions → preference HYPOTHESES).
 * Never diagnosis. Everything feeds the GoalSpec / PreferenceState later.
 */
import { useState } from "react";
import { Orb } from "./orb.js";
import { saveProfile, type Profile } from "../persist/profile.js";

const CALIB_Q1 = {
  q: "When something gets difficult, which sounds more like you?",
  opts: ["Give me another explanation", "Let me try it myself", "Show me an example", "Tell me why it matters first"],
};
const CALIB_Q2 = {
  q: "And the session that sounds best, honestly:",
  opts: ["Challenge me", "Explain slowly", "Let me explore", "Surprise me"],
};

export function Onboarding({ onDone }: { onDone: (p: Profile) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [exam, setExam] = useState("UPSC CSE");
  const [dailyMin, setDailyMin] = useState(240);
  const [stage, setStage] = useState("Full-time aspirant");
  const [journey, setJourney] = useState("");
  const [c1, setC1] = useState<string | null>(null);
  const [c2, setC2] = useState<string | null>(null);

  const canNext = step === 0 ? name.trim().length > 1 : step === 1 ? dailyMin > 0 : c1 !== null && c2 !== null;

  return (
    <div style={{ height: "100vh", display: "grid", placeItems: "center", position: "relative", zIndex: 2 }}>
      <div className="panel rise" style={{ padding: "36px 44px", width: "min(560px, 92vw)" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 22 }}>
          <Orb mood="listen" size={74} />
          <div>
            <div style={{ font: "600 17px var(--font-display)" }}>
              {step < 3 ? "Before we begin — a few honest questions." : "Two last things. Behaviour, not labels."}
            </div>
            <div className="whisper">your answers stay on this device — nothing is sent anywhere.</div>
          </div>
        </div>

        {step === 0 && (
          <div>
            <div className="dim" style={{ marginBottom: 12 }}>First — your name, and the goal we're working toward:</div>
            <input className="inp" placeholder="your name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <div className="dim" style={{ margin: "16px 0 8px" }}>Target</div>
            <div className="tabs">{["UPSC CSE", "Class 8", "Other exam"].map((x) => <button key={x} className={exam === x ? "on" : ""} onClick={() => setExam(x)}>{x}</button>)}</div>
          </div>
        )}
        {step === 1 && (
          <div>
            <div className="dim" style={{ marginBottom: 12 }}>How much time can you honestly give per day? (astra plans around the truth, not the dream)</div>
            <div className="tabs">{ [["1 h", 60], ["2 h", 120], ["4 h", 240], ["6 h", 360]].map(([l, m]) => (
              <button key={l as string} className={dailyMin === m ? "on" : ""} onClick={() => setDailyMin(m as number)}>{l}</button>
            )) }</div>
            <div className="dim" style={{ margin: "16px 0 8px" }}>And where you are right now:</div>
            <div className="tabs">{["Working professional", "Full-time aspirant", "Student"].map((x) => <button key={x} className={stage === x ? "on" : ""} onClick={() => setStage(x)}>{x}</button>)}</div>
          </div>
        )}
        {step === 2 && (
          <div>
            <div className="dim" style={{ marginBottom: 12 }}>{CALIB_Q1.q}</div>
            <div className="tabs" style={{ flexDirection: "column", alignItems: "stretch" }}>
              {CALIB_Q1.opts.map((o) => <button key={o} className={c1 === o ? "on" : ""} onClick={() => setC1(o)} style={{ textAlign: "left", borderRadius: 11 }}>{o}</button>)}
            </div>
            <div className="dim" style={{ margin: "18px 0 8px" }}>{CALIB_Q2.q}</div>
            <div className="tabs">{CALIB_Q2.opts.map((o) => <button key={o} className={c2 === o ? "on" : ""} onClick={() => setC2(o)}>{o}</button>)}</div>
            <div className="whisper" style={{ marginTop: 10 }}>these aren't labels — they're first guesses astra holds lightly. reality will correct her.</div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          <button className="btn ghost" style={{ visibility: step > 0 ? "visible" : "hidden" }} onClick={() => setStep(step - 1)}>← back</button>
          <button
            className="btn cta" disabled={!canNext}
            onClick={() => {
              if (step < 2) { setStep(step + 1); return; }
              saveProfile({ name: name.trim(), exam, dailyMin, stage, journey, calib: { difficulty: c1 ?? undefined, sessionKind: c2 ?? undefined }, metAstra: false, createdAt: Date.now() });
              onDone({ name: name.trim(), exam, dailyMin, stage, journey, calib: { difficulty: c1 ?? undefined, sessionKind: c2 ?? undefined }, metAstra: false, createdAt: Date.now() });
            }}
          >{step === 2 ? "Go meet Astra →" : "Continue →"}</button>
        </div>
      </div>
    </div>
  );
}
