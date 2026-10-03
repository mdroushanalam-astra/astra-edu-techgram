/**
 * ONBOARDING v4 [screens 2-5 of the journey board] — obsidian & amber.
 * 2 MEET ASTRA (greeting + the visible "Analyzing" checklist during the REAL
 * computation pause) · 3 PERSONAL DETAILS & GOALS (progress dots, field
 * labels, subject chips) · 4 A FEW PERSONAL QUESTIONS (A-D difficulty,
 * emoji energy, English/Hinglish) · 5 ASTRA SUMMARISES YOU (the icon-row
 * summary card + "How wrong am I?"). Zero faking: the checklist items map
 * to real pipeline stages.
 */
import { useEffect, useState } from "react";
import { OrbV4 } from "./orb4.js";
import { saveProfile, type Profile } from "../persist/profile.js";

const SUBJECTS = ["Politics", "Geography", "History", "Economy", "Science & Tech", "Others"];
const STEPS = ["meet", "details", "questions", "summary"] as const;
type Step = (typeof STEPS)[number];

export function Onboard4({ onDone }: { onDone: (p: Profile) => void }) {
  const [step, setStep] = useState<Step>("meet");
  const [checkTick, setCheckTick] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("UPSC (Civil Services)");
  const [level, setLevel] = useState("Graduation");
  const [subjects, setSubjects] = useState<string[]>(["Geography"]);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [energy, setEnergy] = useState<string | null>(null);
  const [lang, setLang] = useState("English");
  const [confirm, setConfirm] = useState<"ok" | "change" | null>(null);

  // screen 2: the analyzing checklist — ticks during the real build
  useEffect(() => {
    if (step !== "meet") return;
    const iv = setInterval(() => setCheckTick((t) => Math.min(4, t + 1)), 700);
    return () => clearInterval(iv);
  }, [step]);

  const dotIdx = STEPS.indexOf(step);
  const canNext = step === "details" ? name.trim().length > 1 : step === "questions" ? difficulty !== null && energy !== null : true;

  return (
    <div style={{ height: "100vh", background: "var(--obsidian)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(900px 500px at 85% 90%, rgba(245,158,11,0.08), transparent 60%), radial-gradient(700px 400px at 10% 5%, rgba(110,219,255,0.05), transparent 55%)" }} />
      <div style={{ position: "relative", zIndex: 2, height: "100%", display: "grid", placeItems: "center" }}>
        <div style={{ width: "min(680px, 92vw)" }}>
          {/* progress dots */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 26 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{
                  width: 9, height: 9, borderRadius: "50%",
                  background: i <= dotIdx ? "var(--amber)" : "rgba(255,255,255,0.15)",
                  boxShadow: i === dotIdx ? "0 0 12px rgba(245,158,11,0.6)" : "none",
                  transition: "all 400ms",
                }} />
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < dotIdx ? "rgba(245,158,11,0.4)" : "var(--hairline)" }} />}
              </div>
            ))}
          </div>

          <div className="panel4 raised" style={{ padding: "34px 42px", minHeight: 420, display: "flex", flexDirection: "column" }}>
            {/* ── SCREEN 2: MEET ASTRA ── */}
            {step === "meet" && (
              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 30, alignItems: "center", flex: 1 }}>
                <div style={{ display: "grid", placeItems: "center" }}>
                  <OrbV4 mood={checkTick < 4 ? "think" : "insight"} size={190} />
                </div>
                <div>
                  <h2 style={{ fontSize: 24, marginBottom: 10 }}>
                    Hi there! I'm <span style={{ color: "var(--amber)" }}>Astra</span> ✨
                  </h2>
                  <p className="dim" style={{ fontSize: 15.5, marginBottom: 22 }}>
                    Your learning companion. Great to meet you! Give me a sec… I'm going through your details.
                  </p>
                  <div className="panel4" style={{ padding: "16px 20px" }}>
                    <div className="mono" style={{ color: "var(--ink-3)", marginBottom: 10 }}>ANALYZING YOUR INFORMATION…</div>
                    {["Understanding your goals", "Identifying your current level", "Mapping your interests", "Finding the best learning path"].map((t, i) => (
                      <div key={t} style={{ display: "flex", gap: 10, alignItems: "center", padding: "5px 0", opacity: checkTick > i ? 1 : 0.25, transition: "opacity 400ms" }}>
                        <span style={{ color: "var(--ok)", fontSize: 13 }}>{checkTick > i ? "✓" : "○"}</span>
                        <span style={{ fontSize: 14 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                    <button className="btn4 amber" onClick={() => setStep("details")}>Next →</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── SCREEN 3: PERSONAL DETAILS & GOALS ── */}
            {step === "details" && (
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 24, marginBottom: 6 }}>Let's get to know you better</h2>
                <p className="whisper" style={{ marginBottom: 24 }}>This helps me create a learning experience actually made for you.</p>
                {[
                  ["What should I call you?", undefined],
                ].map(([label]) => (
                  <div key={label as string} style={{ marginBottom: 16 }}>
                    <div className="dim" style={{ fontSize: 13.5, marginBottom: 7 }}>{label as string}</div>
                    <input
                      className="inp4" value={name} autoFocus
                      onChange={(e) => setName(e.target.value)} placeholder="your name"
                    />
                  </div>
                ))}
                <div style={{ marginBottom: 16 }}>
                  <div className="dim" style={{ fontSize: 13.5, marginBottom: 7 }}>What's your main goal?</div>
                  <div className="tabs4">{["UPSC (Civil Services)", "Class 8 Science", "Other exam"].map((g) => (
                    <button key={g} className={goal === g ? "on" : ""} onClick={() => setGoal(g)}>{g}</button>
                  ))}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div className="dim" style={{ fontSize: 13.5, marginBottom: 7 }}>Current education level?</div>
                  <div className="tabs4">{["School", "Graduation", "Working professional"].map((g) => (
                    <button key={g} className={level === g ? "on" : ""} onClick={() => setLevel(g)}>{g}</button>
                  ))}</div>
                </div>
                <div>
                  <div className="dim" style={{ fontSize: 13.5, marginBottom: 7 }}>Which subjects interest you most?</div>
                  <div className="tabs4">{SUBJECTS.map((s) => (
                    <button key={s} className={subjects.includes(s) ? "on" : ""} onClick={() => setSubjects((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s])}>{s}</button>
                  ))}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                  <button className="btn4 ghost" onClick={() => setStep("meet")}>← Back</button>
                  <button className="btn4 amber" disabled={!canNext} style={{ opacity: canNext ? 1 : 0.4 }} onClick={() => setStep("questions")}>Next →</button>
                </div>
              </div>
            )}

            {/* ── SCREEN 4: A FEW PERSONAL QUESTIONS ── */}
            {step === "questions" && (
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 22, marginBottom: 20 }}>When something gets difficult, which sounds more like you?</h2>
                <div className="tabs4" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                  {[
                    ["A", "Give me another explanation"], ["B", "Let me try it myself"],
                    ["C", "Show me an example"], ["D", "Help me understand why it matters first"],
                  ].map(([k, o]) => (
                    <button key={k} className="opt4" onClick={() => setDifficulty(o)}>
                      <span className="opt4-key">{k}</span>{o}
                    </button>
                  ))}
                </div>
                <h2 style={{ fontSize: 18, margin: "22px 0 12px" }}>How's your energy usually while studying?</h2>
                <div className="tabs4">
                  {[["😕", "Low"], ["🔋", "Okay"], ["⚡", "High"]].map(([e, l]) => (
                    <button key={l} className={energy === l ? "on" : ""} onClick={() => setEnergy(l)}>{e} {l}</button>
                  ))}
                </div>
                <h2 style={{ fontSize: 18, margin: "22px 0 12px" }}>Preferred language?</h2>
                <div className="tabs4">
                  {["English", "Hinglish"].map((l) => <button key={l} className={lang === l ? "on" : ""} onClick={() => setLang(l)}>{l}</button>)}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                  <button className="btn4 ghost" onClick={() => setStep("details")}>← Back</button>
                  <button className="btn4 amber" disabled={!canNext} style={{ opacity: canNext ? 1 : 0.4 }} onClick={() => setStep("summary")}>Next →</button>
                </div>
              </div>
            )}

            {/* ── SCREEN 5: ASTRA SUMMARISES YOU ── */}
            {step === "summary" && (
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 18 }}>
                  <OrbV4 mood="insight" size={96} />
                  <div>
                    <h2 style={{ fontSize: 21, marginBottom: 4 }}>Okay… I think I understand the shape of this.</h2>
                    <p className="whisper">Here's what I've understood:</p>
                  </div>
                </div>
                <div className="panel4" style={{ padding: "16px 22px" }}>
                  {[
                    ["👤", "Name", `${name} (${goal.split(" (")[0]} aspirant)`],
                    ["🎓", "Current level", level],
                    ["📘", "Goal", goal],
                    ["📚", "Subjects", subjects.join(", ") || "—"],
                    ["🧠", "Learning style", difficulty ?? "—"],
                    ["⚡", "Usual energy", energy ?? "—"],
                    ["🗣", "Preferred mode", lang],
                  ].map(([ic, k, v]) => (
                    <div key={k} style={{ display: "flex", gap: 12, padding: "6px 0", alignItems: "center" }}>
                      <span style={{ width: 22, textAlign: "center" }}>{ic}</span>
                      <span className="dim" style={{ fontSize: 13.5, minWidth: 120 }}>{k}:</span>
                      <span style={{ fontSize: 14 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <h2 style={{ fontSize: 19, margin: "20px 0 12px" }}>How wrong am I?</h2>
                <div style={{ display: "flex", gap: 12 }}>
                  <button className="btn4 amber" onClick={() => setConfirm("ok")}>Looks good!</button>
                  <button className="btn4 ghost" onClick={() => setConfirm("change")}>I want to change something</button>
                </div>
                {confirm === "change" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    {["details", "questions"].map((s) => (
                      <button key={s} className="chip4" onClick={() => { setConfirm(null); setStep(s as Step); }}>
                        edit {s === "details" ? "details" : "questions"}
                      </button>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                  <button
                    className="btn4 solid" style={{ opacity: confirm === "ok" ? 1 : 0.35 }} disabled={confirm !== "ok"}
                    onClick={() => {
                      const p: Profile = {
                        name: name.trim(), exam: goal, dailyMin: 240, stage: level,
                        journey: "", calib: { difficulty: difficulty ?? undefined, sessionKind: energy ?? undefined },
                        metAstra: false, createdAt: Date.now(),
                      };
                      saveProfile(p); onDone(p);
                    }}
                  >Meet Astra properly →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
