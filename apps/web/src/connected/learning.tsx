import { useState } from "react";
import { api, type LearningView } from "./api.js";

/** Connected mode keeps the bearer token in memory and uses server-owned evidence. */
export function ConnectedLearning() {
  const [register, setRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [students, setStudents] = useState<{ student_id: string; name: string; goal: string }[]>([]);
  const [view, setView] = useState<LearningView | null>(null);
  const [confidence, setConfidence] = useState(2);
  const [minutes, setMinutes] = useState(20);
  const [examDate, setExamDate] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [feedback, setFeedback] = useState<LearningView["feedback"]>(null);
  // Retain a failed command for safe retries after an uncertain network result.
  const [pending, setPending] = useState<{ path: string; body: unknown } | null>(null);

  async function perform(fn: () => Promise<void>) {
    setBusy(true); setError("");
    try { await fn(); } catch (err) { setError(err instanceof Error ? err.message : "Request failed"); }
    finally { setBusy(false); }
  }
  async function authenticate(event: React.FormEvent) {
    event.preventDefault();
    await perform(async () => {
      const auth = await api<{ access_token: string; full_name: string }>(register ? "/auth/register" : "/auth/login", null,
        { email, password, ...(register ? { full_name: name } : {}) });
      const contexts = await api<typeof students>("/students", auth.access_token);
      setToken(auth.access_token); setStudents(contexts); setName(auth.full_name); setPassword("");
    });
  }
  async function sendLearning(path: string, body: unknown) {
    setPending({ path, body });
    const next = await api<LearningView>(path, token, body);
    setView(next); setFeedback(next.feedback); setStartedAt(Date.now()); setPending(null);
  }
  function start(student_id: string) {
    void perform(() => sendLearning(`/learning/${student_id}/start`, { command_id: crypto.randomUUID(), minutes }));
  }
  function answer(choice: number) {
    if (!view) return;
    void perform(() => sendLearning(`/learning/${view.student_id}/answer`, {
      command_id: crypto.randomUUID(), minutes, revision: view.revision,
      item_id: view.item.id, choice, confidence,
      time_sec: Math.max(0.1, Math.min(7200, (Date.now() - startedAt) / 1000)),
    }));
  }
  const field = { padding: "12px", borderRadius: 8, border: "1px solid #46506c", background: "#111827", color: "#f8fafc", width: "100%", boxSizing: "border-box" as const };
  const button = { ...field, cursor: "pointer", marginTop: 10, background: "#253656" };
  return <main style={{ minHeight: "100vh", background: "#0b1020", color: "#edf2ff", padding: "36px 20px", fontFamily: "system-ui" }}>
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h1>Techgram</h1><p>Learn from evidence. Choose your next step with confidence.</p>
      {error && <p role="alert" style={{ color: "#fda4af" }}>{error}</p>}
      {!token ? <form onSubmit={authenticate} style={{ maxWidth: 400 }}>
        <h2>{register ? "Create your account" : "Welcome back"}</h2>
        {register && <label>Name<input style={field} value={name} required maxLength={255} onChange={e => setName(e.target.value)} autoComplete="name" /></label>}
        <label>Email<input style={field} type="email" value={email} required onChange={e => setEmail(e.target.value)} autoComplete="email" /></label>
        <label>Password<input style={field} type="password" value={password} required minLength={register ? 12 : 1} maxLength={128} onChange={e => setPassword(e.target.value)} autoComplete={register ? "new-password" : "current-password"} /></label>
        <button style={button} disabled={busy} type="submit">{busy ? "Please wait…" : register ? "Create account" : "Sign in"}</button>
        <button style={button} disabled={busy} type="button" onClick={() => setRegister(!register)}>{register ? "I already have an account" : "Create an account"}</button>
      </form> : <>
        <button style={{ ...button, width: "auto" }} disabled={busy} onClick={() => { setToken(null); setView(null); setStudents([]); setPending(null); setFeedback(null); setError(""); }}>Sign out</button>
        {!view ? <section><h2>Your learning spaces</h2>
          <label>Time available today<select style={field} value={minutes} onChange={e => setMinutes(Number(e.target.value))}>{[10,20,40,60].map(m => <option key={m} value={m}>{m} minutes</option>)}</select></label>
          <label>Target exam date (optional)<input style={field} type="date" value={examDate} onChange={e => setExamDate(e.target.value)} /></label>
          {students.map(s => <button key={s.student_id} style={button} disabled={busy} onClick={() => start(s.student_id)}>{s.name} · {s.goal}</button>)}
          <button style={button} disabled={busy} onClick={() => void perform(async () => {
            const student = await api<{ student_id: string }>("/student/onboard", token, { name, goal: "UPSC Polity", target_exam_date: examDate || null });
            setStudents(await api<typeof students>("/students", token));
            await sendLearning(`/learning/${student.student_id}/start`, { command_id: crypto.randomUUID(), minutes });
          })}>Start a UPSC Polity learning space</button>
        </section> : <section>
          <h2>Your next step</h2>
          {view.plan.blocks.slice(0, 2).map((b, i) => <p key={i}><strong>{b.conceptName}</strong> · {b.action} · {b.minutes} minutes<br />{b.reason.replace(/\(n_eff [^)]+\)/g, "").replace("Unknown-ish", "Not enough evidence yet").replace("information value", "a useful check")}</p>)}
          <details><summary>Why this activity?</summary><p>{view.decision.receipt.reason.join(" ")}</p><p>{view.plan.personalisationApplied.join(" ")}</p><p>Learning estimates are uncertain. Intervention effects currently use assumptions pending real-student validation.</p></details>
          {feedback && <div role="status"><p>{feedback.correct ? "Correct. Your learning model has been updated." : `Answer recorded. The correct answer was: ${feedback.correct_text}. We’ll use this evidence to choose your next activity.`}</p>{feedback.explanation && <p>{feedback.explanation.body}<br /><small>Source: {feedback.explanation.source}</small></p>}</div>}
          {view.teaching && <aside><h3>Let’s revisit the idea</h3><p>{view.teaching.body}</p><small>Source: {view.teaching.source}</small></aside>}
          <h3>{view.item.stem}</h3>
          <label>How confident are you?<select style={field} value={confidence} onChange={e => setConfidence(Number(e.target.value))}><option value={1}>Unsure</option><option value={2}>Somewhat sure</option><option value={3}>Very sure</option></select></label>
          {view.item.options.map((option, i) => <button style={button} key={i} disabled={busy || !!pending} onClick={() => answer(i)}>{i + 1}. {option}</button>)}
          <h2>Your learning map</h2><p>Ranges express uncertainty; unassessed concepts stay unknown.</p>
          <table style={{ width: "100%", textAlign: "left" }}><thead><tr><th>Concept</th><th>Current evidence</th></tr></thead><tbody>{view.concepts.map(c => <tr key={c.id}><td style={{ padding: "10px 0" }}>{c.name}</td><td>{c.grey ? "Not enough evidence" : `${Math.round(c.mean * 100)}% estimate (${Math.round(c.lo * 100)}–${Math.round(c.hi * 100)}%)`}</td></tr>)}</tbody></table>
        </section>}
        {pending && !busy && <button style={button} onClick={() => void perform(() => sendLearning(pending.path, pending.body))}>Retry saving your answer</button>}
        {pending && !busy && view && <button style={button} onClick={() => start(view.student_id)}>Reload latest progress</button>}
      </>}
    </div>
  </main>;
}
