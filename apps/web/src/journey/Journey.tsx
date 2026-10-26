import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { LearningView } from "../connected/api.js";
import { connectedAdapter } from "./connected.js";
import { Brand, Button, DrawingBoard, Options, Orb, Panel, RiverDiagram, Speech, Steps } from "./Elements.js";
import { LessonDiagram, SpeechControls } from "./LessonBoard.js";
import { cleanReason, defaultProfile, journeySteps, readLocal, score, screens, writeLocal } from "./model.js";
import type { Adapter, AnswerRecord, Profile, SavedSession, Screen, Space, LearningAccount, LessonAction, KnowledgeResult } from "./model.js";
const isConnected = import.meta.env.VITE_CONNECTED_MODE === "true";
const nav: {
    screen: Screen;
    label: string;
    icon: string;
}[] = [{ screen: "home", label: "Home", icon: "⌂" }, { screen: "confirm", label: "Session", icon: "✧" }, { screen: "map", label: "Learning Map", icon: "◇" }, { screen: "growth", label: "Growth", icon: "◎" }, { screen: "artifacts", label: "Artifacts", icon: "▤" }, { screen: "library", label: "Library", icon: "▥" }, { screen: "agency", label: "Agency", icon: "⌘" }, { screen: "settings", label: "Settings", icon: "⚙" }];
const feelings = ["It felt good", "Middle part was confusing", "Too easy", "I need another session on this"];
export function Journey() {
    const [adapter, setAdapter] = useState<Adapter | null>(() => isConnected ? connectedAdapter() : null);
    const [screen, setScreen] = useState<Screen>("welcome");
    const [profile, setProfile] = useState<Profile>({ ...defaultProfile });
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [space, setSpace] = useState<Space | null>(null);
    const [owner, setOwner] = useState("preview");
    const [authenticated, setAuthenticated] = useState(false);
    const [authForm, setAuthForm] = useState<"login" | "register" | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [view, setView] = useState<LearningView | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [pending, setPending] = useState<{
        run: () => Promise<void>;
        label: string;
    } | null>(null);
    const [results, setResults] = useState<AnswerRecord[]>([]);
    const [history, setHistory] = useState<SavedSession[]>([]);
    const [feeling, setFeeling] = useState(feelings[0]!);
    const [nextStep, setNextStep] = useState("Short repair tomorrow");
    const [confidence, setConfidence] = useState(2);
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [horizon, setHorizon] = useState("1 year");
    const [milestone, setMilestone] = useState(0);
    const [why, setWhy] = useState(false);
    const [notes, setNotes] = useState<SavedSession | null>(null);
    const [drawing, setDrawing] = useState(false);
    const [undo, setUndo] = useState(0);
    const [clear, setClear] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [navOpen, setNavOpen] = useState(false);
    const [notice, setNotice] = useState("");
    const [saveLocal, setSaveLocal] = useState(true);
    const [accountRevision, setAccountRevision] = useState(0);
    const [query, setQuery] = useState("");
    const [knowledge, setKnowledge] = useState<KnowledgeResult | null>(null);
    const sessionId = useRef<string>(crypto.randomUUID());
    const startedAt = useRef(Date.now());
    const locked = useRef(false);
    const heading = useRef<HTMLHeadingElement>(null);
    const notesDialog = useRef<HTMLDialogElement>(null);
    const preview = !isConnected;
    const subject = preview ? "Geomorphology · River Systems" : (space?.goal || profile.goal);
    const last = history[0];
    const localKey = `astra-ui:${preview ? "preview" : `account:${owner}`}`;
    const patch = (p: Partial<Profile>) => setProfile(old => ({ ...old, ...p }));
    function go(s: Screen) { setScreen(s); setNavOpen(false); setWhy(false); setNotice(""); }
    useEffect(() => {
        if (!isConnected)
            void import("./preview.js").then(m => {
                const a = m.previewAdapter();
                setAdapter(a);
                const saved = readLocal<{
                    profile: Profile;
                    history: SavedSession[];
                } | null>("astra-ui:preview", null);
                if (saved) {
                    setProfile(saved.profile);
                    setHistory(saved.history);
                }
                // Explicit preview links make visual QA and design review repeatable.
                const requested = new URLSearchParams(location.search).get("screen");
                if (requested && screens.includes(requested as Screen)) {
                    const p = { ...defaultProfile, name: saved?.profile.name || "Arjun" };
                    setProfile(p);
                    setAuthenticated(true);
                    setSpace({ student_id: "preview", name: p.name, goal: p.goal });
                    void a.start("preview", p.minutes, crypto.randomUUID()).then(setView);
                    setScreen(requested as Screen);
                }
            });
    }, []);
    useEffect(() => { if (authenticated && saveLocal)
        writeLocal(localKey, { profile, history }); }, [profile, history, authenticated, localKey, saveLocal]);
    useEffect(() => { heading.current?.focus(); document.title = `${screen === "home" ? "Your room" : screen.charAt(0).toUpperCase() + screen.slice(1)} · Techgram`; }, [screen]);
    useEffect(() => { if (screen !== "session" || busy || view?.session?.status !== undefined && view.session.status !== "active")
        return; const timer = window.setInterval(() => setElapsed(v => v + 1), 1000); return () => clearInterval(timer); }, [screen, busy, view?.session?.status]);
    useEffect(() => { setDrawing(false); setClear(v => v + 1); }, [view?.item.id]);
    useEffect(() => { if (!notes || !notesDialog.current)
        return; const before = document.activeElement as HTMLElement | null; notesDialog.current.showModal(); return () => { notesDialog.current?.close(); before?.focus(); }; }, [notes]);
    async function perform(run: () => Promise<void>, label: string, retryable = false) {
        if (locked.current)
            return;
        locked.current = true;
        setBusy(true);
        setError("");
        if (retryable)
            setPending({ run, label });
        try {
            await run();
            setPending(null);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
        }
        finally {
            setBusy(false);
            locked.current = false;
        }
    }
    function receiveView(v: LearningView) {
        setView(v); setAccountRevision(v.revision);
        if (v.session) { setResults(v.session.answers); setElapsed(Math.floor(v.session.elapsed_sec)); sessionId.current = v.session.id; }
        startedAt.current = Date.now();
    }
    function receiveAccount(a: LearningAccount) {
        setAccountRevision(a.revision); patch(a.preferences);
        if (a.view) receiveView(a.view);
        setHistory(a.history);
    }
    async function authenticate(e: FormEvent) {
        e.preventDefault();
        if (!adapter)
            return;
        await perform(async () => {
            const auth = await adapter.authenticate(authForm === "register", profile.name, email, password);
            const key = `astra-ui:account:${email.trim().toLowerCase()}`;
            const saved = readLocal<{
                profile: Profile;
                history: SavedSession[];
            } | null>(key, null);
            const p = { ...defaultProfile, ...saved?.profile, name: auth.name };
            setOwner(email.trim().toLowerCase());
            setProfile(p);
            setHistory(saved?.history ?? []);
            setSpaces(auth.spaces);
            setPassword("");
            setAuthenticated(true);
            if (auth.spaces.length) {
                const s = auth.spaces[0]!;
                setSpace(s);
                patch({ name: s.name, goal: s.goal });
                if (adapter.current) receiveAccount(await adapter.current(s.student_id));
                go("home");
            }
            else
                go("meet");
        }, "Signing in");
    }
    function enterPreview() { setAuthenticated(true); patch({ name: profile.name || "Arjun" }); go("meet"); }
    function onboard() { if (!adapter)
        return; void perform(async () => { const s = await adapter.onboard(profile); setSpace(s); setSpaces(old => [...old, s]); if (adapter.current) receiveAccount(await adapter.current(s.student_id)); go("home"); }, "Creating your learning space"); }
    function start() {
        if (!adapter || !space)
            return;
        const command = crypto.randomUUID();
        const preferenceCommand = crypto.randomUUID();
        const revision = accountRevision;
        const run = async () => {
            if (adapter.preferences) receiveAccount(await adapter.preferences(space.student_id, revision, profile, preferenceCommand));
            const v = await adapter.start(space.student_id, profile.minutes, command);
            setResults([]); setElapsed(0); sessionId.current = crypto.randomUUID(); receiveView(v);
            setFeedbackOpen(false); go("session");
        };
        void perform(run, "Opening your lesson", true);
    }
    function answer(choice: number) {
        if (!adapter || !view || pending || feedbackOpen)
            return;
        const old = view;
        const command = crypto.randomUUID();
        const seconds = Math.max(.1, (Date.now() - startedAt.current) / 1000);
        const run = async () => { const v = await adapter.answer(old, choice, confidence, seconds, profile.minutes, command); receiveView(v); if (v.feedback && !v.session) {
            const record: AnswerRecord = { command, question: old.item.stem, selected: old.item.options[choice]!, correct: v.feedback.correct, answer: v.feedback.correct_text, explanation: v.feedback.explanation?.body || "", concept: v.feedback.concept_id, seconds, confidence };
            setResults(prev => prev.some(r => r.command === command) ? prev : [...prev, record]);
        } setFeedbackOpen(true); };
        void perform(run, "Updating your learning path", true);
    }
    function finish() {
        if (busy || pending)
            return;
        if (adapter?.action && view?.lesson && space) {
            const old = view, command = crypto.randomUUID();
            void perform(async () => {
                if (old.session?.status !== "completed") receiveView(await adapter.action!(old, "finish", Math.max(0, (Date.now() - startedAt.current) / 1000), command));
                receiveAccount(await adapter.current!(space.student_id)); go("complete");
            }, "Saving your completed session", true); return;
        }
        const entry: SavedSession = { id: sessionId.current, date: new Date().toISOString(), subject, results: [...results], feeling: "", next: "" };
        setHistory(old => [entry, ...old.filter(s => s.id !== entry.id)].slice(0, 50));
        go("complete");
    }
    function reflect(destination: Screen, intention: string) {
        if (adapter?.reflection && space) {
            const command = crypto.randomUUID(), revision = accountRevision, id = sessionId.current;
            void perform(async () => { receiveAccount(await adapter.reflection!(space.student_id, revision, id, feeling, intention, command)); go(destination); }, "Saving your reflection", true);
        } else { setHistory(old => old.map(s => s.id === sessionId.current ? { ...s, feeling, next: intention } : s)); go(destination); }
    }
    function saveDebrief() { reflect("next", ""); }
    function saveNext() { reflect("artifacts", nextStep); }
    function act(action: LessonAction) {
        if (!adapter?.action || !view?.lesson || busy || pending) return;
        const old = view, command = crypto.randomUUID();
        const seconds = action === "resume" ? 0 : Math.max(0, (Date.now() - startedAt.current) / 1000);
        void perform(async () => { receiveView(await adapter.action!(old, action, seconds, command)); setFeedbackOpen(false); }, "Updating your lesson", true);
    }
    function savePreferences() {
        if (!adapter?.preferences || !space) { setNotice("Your preferences are updated for this device."); return; }
        const command = crypto.randomUUID(), revision = accountRevision;
        void perform(async () => { receiveAccount(await adapter.preferences!(space.student_id, revision, profile, command)); setNotice("Your learning preferences are saved to your account."); }, "Saving your preferences", true);
    }
    function signout() { adapter?.signout(); setAuthenticated(false); setProfile({ ...defaultProfile }); setHistory([]); setSpace(null); setSpaces([]); setView(null); setResults([]); setPending(null); setError(""); setOwner("preview"); setAuthForm(null); go("welcome"); }
    function reloadProgress() { if (!adapter || !space)
        return; const command = crypto.randomUUID(); void perform(async () => { if (adapter.current) receiveAccount(await adapter.current(space.student_id)); else receiveView(await adapter.start(space.student_id, profile.minutes, command)); setFeedbackOpen(false); }, "Reloading latest progress", true); }
    function exportNotes(s: SavedSession) { const text = `${s.subject}\n${new Date(s.date).toLocaleDateString()}\n\n${s.results.map((r, i) => `${i + 1}. ${r.question}\nYour answer: ${r.selected}\nCorrect answer: ${r.answer}\n${r.explanation}`).join("\n\n")}\n\nReflection: ${s.feeling || "Not recorded"}\nNext step: ${s.next || "Not selected"}`; const url = URL.createObjectURL(new Blob([text], { type: "text/plain" })); const a = document.createElement("a"); a.href = url; a.download = "astra-session-notes.txt"; a.click(); URL.revokeObjectURL(url); }
    const onboarding = ["meet", "details", "questions", "summary"].includes(screen);
    const sidebar = authenticated && !onboarding && screen !== "welcome";
    const activeStep = screen === "welcome" || onboarding ? 0 : ["home", "plan", "confirm"].includes(screen) ? 2 : screen === "session" ? 3 : ["complete", "debrief"].includes(screen) ? 4 : 5;
    const scene = screen === "plan" ? "mountain" : screen === "session" || screen === "complete" ? "teaching" : ["home", "return", "map", "growth", "library", "artifacts", "agency", "settings"].includes(screen) ? "home" : "onboarding";
    const title = (text: string, eyebrow: string = "YOUR INTELLIGENT LEARNING COMPANION") => <div className="page-heading"><p className="eyebrow">{eyebrow}</p><h1 tabIndex={-1} ref={heading}>{text}</h1></div>;
    const backNext = (back: Screen, next: Screen, label = "Next") => <div className="actions"><Button secondary onClick={() => go(back)}>← Back</Button><Button onClick={() => go(next)}>{label} →</Button></div>;
    const preferences = <>{!preview && profile.goal === "UPSC Geography" && <label>Geography teaching unit<select value={profile.geographyUnit || "geomorphology"} onChange={e => patch({ geographyUnit: e.target.value as Profile["geographyUnit"] })}><option value="geomorphology">Geomorphology and rivers</option><option value="maps_motions">Maps and Earth motions</option><option value="atmosphere">Atmospheric foundations</option><option value="monsoon">Monsoon and variability</option></select><small>Unknown prerequisites are checked first. One concept cycle per session; active lessons keep their current unit.</small></label>}<label>Session length<select value={profile.minutes} onChange={e => patch({ minutes: Number(e.target.value) })}>{[10, 20, 40, 60].map(m => <option key={m} value={m}>{m} minutes</option>)}</select></label><label>Target exam date (optional)<input type="date" value={profile.examDate} onChange={e => patch({ examDate: e.target.value })}/></label>{space && <p className="fine-print">Save preferences to update your account’s exam date. An active lesson keeps its existing plan; the next lesson uses your updated deadline.</p>}</>;
    const planBlocks = view?.plan.blocks ?? [{ conceptName: preview ? "Quick recall" : "Check your starting point", minutes: 5, reason: preview ? "Check what’s sticky" : "Start a session to get an evidence-based plan.", action: "retrieval", assumption: "Initial plan" }, { conceptName: preview ? "Concept repair" : "Understand the idea", minutes: Math.max(5, profile.minutes - 15), reason: preview ? "Focus: transport → deposition" : "Your learning engine chooses the next concept.", action: "explain", assumption: "Initial plan" }, { conceptName: "Apply & test", minutes: 10, reason: "Questions and real examples", action: "apply", assumption: "Initial plan" }];
    const planCard = <Panel className="plan-card"><div className="card-header"><div><p className="eyebrow">A LITTLE PROGRESS, EVERY DAY</p><h2>Today’s plan</h2></div><span className="tag">~ {profile.minutes} min</span></div><p className="muted">{subject}</p><ol className="plan-list">{planBlocks.slice(0, 3).map((b, i) => <li key={i}><span className="number">{i + 1}</span><div><strong>{b.conceptName} <span className="muted">· {b.minutes} min</span></strong><p>{cleanReason(b.reason)}</p></div></li>)}</ol><Button onClick={() => go("confirm")}>Start session <span>→</span></Button><button className="text-button" onClick={() => setWhy(!why)}>See why this plan</button>{why && <div className="why"><p>{view ? view.decision.receipt.reason.map(cleanReason).join(" ") : "Your first session checks your starting point. Later choices can use your recorded answers."}</p><small>{preview ? "Illustrative preview plan." : "Estimates carry uncertainty; intervention effects still need learner validation."}</small></div>}</Panel>;
    let content: ReactNode;
    switch (screen) {
        case "welcome":
            content = <div className="welcome-layout"><Panel className="welcome-card"><Brand />{title(authForm ? authForm === "register" ? "Your journey starts here" : "Welcome back" : "Your intelligent\nlearning companion", "LEARN DEEPER. THINK CLEARER. BECOME YOU.")}<p className="welcome-copy">A room of your own.<br />A guide who grows with you.</p><div className="welcome-orbit"><Orb small/></div>{preview ? <><Button disabled={!adapter} onClick={enterPreview}>Explore the learning journey →</Button><p className="fine-print">Interactive preview · No account required</p></> : authForm ? <form onSubmit={authenticate}>{authForm === "register" && <label>Your name<input required maxLength={255} autoComplete="name" value={profile.name} onChange={e => patch({ name: e.target.value })}/></label>}<label>Email<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}/></label><label>Password<input type="password" required minLength={authForm === "register" ? 12 : 1} maxLength={128} autoComplete={authForm === "register" ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)}/></label><Button type="submit" disabled={busy}>{authForm === "register" ? "Create account" : "Sign in"} →</Button><button type="button" className="text-button" onClick={() => setAuthForm(authForm === "login" ? "register" : "login")}>{authForm === "login" ? "Create a new account" : "I already have an account"}</button></form> : <><Button onClick={() => setAuthForm("login")}>Sign in</Button><Button secondary onClick={() => setAuthForm("register")}>Create new account</Button></>}<p className="fine-print">Your learning. Your pace. Your space.</p></Panel><div className="welcome-scene"><span className="scene-caption">A quieter place to do extraordinary things.</span></div></div>;
            break;
        case "meet":
            content = <div className="meet-layout"><div className="character-stage"><Orb /><Speech><p>Hi there!<br />I’m Astra <span className="spark">✦</span></p><p>Your learning companion.<br />Great to meet you.</p><p>Let’s find a path that feels like yours.</p></Speech></div><Panel className="intro-card">{title("A little about you", "LET’S BEGIN")}<p>Tell me what you’re working toward. We’ll build your first learning space together.</p><ul className="checklist"><li>✓ Your goals and subjects</li><li>✓ Your current education level</li><li>✓ Your learning preferences</li><li>✓ Your time for today</li></ul><p className="muted">You can change your preferences later.</p><Button onClick={() => go("details")}>Let’s get to know you →</Button></Panel></div>;
            break;
        case "details":
            content = <div className="form-layout"><div className="character-stage"><Orb /><Speech>Your goal is the destination.<br />We’ll find the next small step.</Speech></div><Panel className="form-card"><Steps step={2}/>{title("Let’s get to know you better", "YOUR JOURNEY, YOUR WAY")}<p className="muted">This helps create a learning space for you.</p><form onSubmit={e => { e.preventDefault(); go("questions"); }}><label>What should I call you?<input required maxLength={255} value={profile.name} onChange={e => patch({ name: e.target.value })} autoComplete="given-name" placeholder="Your name"/></label><label>What’s your main goal?<select value={profile.goal} onChange={e => patch({ goal: e.target.value })}><option>UPSC Geography</option><option>UPSC Polity</option></select></label><label>Current education level?<select value={profile.level} onChange={e => patch({ level: e.target.value })}>{["School", "Graduation", "Postgraduation", "Working professional"].map(v => <option key={v}>{v}</option>)}</select></label><fieldset><legend>Which subjects interest you most?</legend><div className="chips">{["Polity", "Geography", "History", "Economy", "Science & Tech", "Others"].map(v => <button type="button" aria-pressed={profile.subjects.includes(v)} className={profile.subjects.includes(v) ? "selected" : ""} key={v} onClick={() => patch({ subjects: profile.subjects.includes(v) ? profile.subjects.filter(s => s !== v) : [...profile.subjects, v] })}>{v}</button>)}</div></fieldset>{preferences}<div className="actions"><Button secondary onClick={() => go("meet")}>← Back</Button><Button type="submit">Next →</Button></div></form></Panel></div>;
            break;
        case "questions":
            content = <div className="form-layout"><div className="character-stage"><Orb /><Speech>No perfect answers.<br />Just what feels right for you.</Speech></div><Panel className="form-card"><Steps step={3}/>{title("A few personal questions", "A PATH THAT FITS YOU")}<fieldset><legend>When something gets difficult, which sounds more like you?</legend><Options values={["Give me another explanation", "Let me try it myself", "Show me an example", "Help me understand why it matters first"]} value={profile.style} onChange={v => patch({ style: v })}/></fieldset><fieldset><legend>How’s your energy usually while studying?</legend><div className="chips">{["Low", "Okay", "High"].map((v, i) => <button key={v} aria-pressed={profile.energy === v} className={profile.energy === v ? "selected" : ""} onClick={() => patch({ energy: v })}>{["☾", "◉", "✦"][i]} {v}</button>)}</div></fieldset><fieldset><legend>Preferred language?</legend><div className="chips">{["English", "Hinglish"].map(v => <button key={v} aria-pressed={profile.language === v} className={profile.language === v ? "selected" : ""} onClick={() => patch({ language: v })}>{v}</button>)}</div></fieldset><p className="fine-print">Saved as your preferences. Lessons currently use English.</p>{backNext("details", "summary")}</Panel></div>;
            break;
        case "summary":
            content = <div className="form-layout"><div className="character-stage"><Orb /><Speech>Okay… I think I understand<br />the shape of this.</Speech></div><Panel className="form-card"><Steps step={4}/>{title("Here’s what I’ve understood", "MEET YOUR LEARNING PROFILE")}<dl className="profile-summary">{[["Name", profile.name], ["Goal", profile.goal], ["Current level", profile.level], ["Subjects", profile.subjects.join(", ") || "Not selected"], ["Study time", `${profile.minutes} minutes today`], ["Learning preference", profile.style], ["Preferred language", profile.language]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><h3>How does that sound?</h3><div className="actions"><Button secondary onClick={() => go("details")}>Change something</Button><Button disabled={busy} onClick={onboard}>Looks good! →</Button></div></Panel></div>;
            break;
        case "home":
        case "return":
            content = <div className="home-layout"><div className="home-welcome">{title(`${screen === "return" ? "Welcome back" : "Good evening"}, ${profile.name || "learner"}. ✦`, "YOUR ROOM · YOUR RHYTHM")}<p className="lead">{screen === "return" ? "A little clearer. A little further. Let’s keep going." : "A small step today can open a bigger world tomorrow."}</p><div className="home-character"><Orb /><Speech>{last?.results.length ? <><p>You recorded {last.results.length} answers in your last session.</p><p>We can use that evidence to choose your next activity.</p></> : <><p>I’m here when you’re ready.</p><p>Let’s start with what you know, and build from there.</p></>}</Speech></div></div><div className="home-cards">{spaces.length > 1 && <label>Learning space<select value={space?.student_id} onChange={e => { const s = spaces.find(s => s.student_id === e.target.value)!; setSpace(s); patch({ name: s.name, goal: s.goal }); setView(null); setResults([]); setHistory([]); setAccountRevision(0); if (adapter?.current) void perform(async () => receiveAccount(await adapter.current!(s.student_id)), "Loading your learning space"); }}>{spaces.map(s => <option key={s.student_id} value={s.student_id}>{s.name} · {s.goal}</option>)}</select></label>}{planCard}{screen === "return" && <Panel className="return-card"><p className="eyebrow">YOUR NEXT CHAPTER</p><h3>{last?.next || "Choose your next step"}</h3><p className="muted">{last?.next ? "Your chosen intention, saved with your session." : "Your next lesson begins when you’re ready."}</p><div className="return-links"><button onClick={() => go("confirm")}><span>◉</span><div><strong>Next session</strong><small>Begin when you’re ready</small></div><span>→</span></button><button onClick={() => { setHorizon("Next 7 days"); setMilestone(1); go("plan"); }}><span>◇</span><div><strong>Next 7 days</strong><small>Explore your roadmap</small></div><span>→</span></button><button onClick={() => go("plan")}><span>⚑</span><div><strong>Your journey</strong><small>{profile.goal}</small></div><span>→</span></button></div></Panel>}</div></div>;
            break;
        case "plan":
            content = <div className="journey-map-layout"><div>{title("Here’s the bigger picture", "YOUR LEARNING JOURNEY")}<Speech>This is your starting map.<br />Your next step can change as we learn more.</Speech><Orb small/><Panel className="milestone-detail"><p className="eyebrow">{preview ? "ILLUSTRATIVE ROADMAP" : "YOUR GOAL"}</p><h2>{["Build foundations", "Connect the ideas", "Apply & practise", "Your destination"][milestone]}</h2><p>{["Understand the building blocks. Start with your current activity.", "Explore how concepts relate to one another.", "Use retrieval and examples to test your understanding.", profile.goal][milestone]}</p><p className="fine-print">{preview ? "A visual preview; milestones are not earned progress." : "Future stages are an outline, not a prediction of mastery or exam success."}</p><Button onClick={() => go("confirm")}>Start today’s step →</Button></Panel></div><div className="mountain-path"><svg viewBox="0 0 600 650" aria-hidden="true"><path d="M150 590C140 500 390 505 310 370S190 240 410 145 420 75 470 35" fill="none" stroke="#69d9ff" strokeWidth="5" strokeDasharray="7 10"/></svg>{[0, 1, 2, 3].map((v) => <button key={v} style={{ left: ["25%", "52%", "69%", "79%"][v], top: ["86%", "55%", "26%", "8%"][v] }} className={`path-point ${milestone === v ? "active" : ""}`} onClick={() => setMilestone(v)} aria-label={`Explore ${["foundations", "connections", "practice", "destination"][v]}`}><span>{v === 3 ? "⚑" : v + 1}</span><strong>{["You are here", "Connect ideas", "Apply & practise", profile.goal][v]}</strong></button>)}<div className="horizon chips" aria-label="Roadmap time horizon">{["Today", "Next 7 days", "Next 3 months", "1 year"].map(v => <button aria-pressed={horizon === v} className={horizon === v ? "selected" : ""} key={v} onClick={() => { setHorizon(v); setMilestone(["Today", "Next 7 days", "Next 3 months", "1 year"].indexOf(v)); }}>{v}</button>)}</div></div></div>;
            break;
        case "confirm":
            content = <div className="form-layout"><div className="character-stage"><Orb /><Speech>So… are you ready<br />to start from today?</Speech></div><Panel className="form-card">{title("One good session", "YOUR NEXT SMALL STEP")}<p className="muted">{subject}</p>{preferences}<Options values={["Let’s do it!", "Make it lighter", "Make it a bit harder"]} value={profile.minutes <= 20 ? "Make it lighter" : profile.minutes >= 60 ? "Make it a bit harder" : "Let’s do it!"} onChange={v => patch({ minutes: v === "Make it lighter" ? 20 : v === "Make it a bit harder" ? 60 : 40 })}/><p className="fine-print">These choices change session length. Question difficulty is chosen by the learning engine. An unfinished connected session resumes with its original duration.</p><div className="ready-note">✦ Your teacher is ready.<br /><span>I’ll be right here when you’re done.</span></div><Button disabled={busy || !!pending || !space} onClick={start}>Start {profile.minutes}-min session →</Button><button className="text-button" onClick={() => go("plan")}>I want to tweak the plan</button></Panel></div>;
            break;
        case "session":
            content = <div className="session-layout"><header className="session-header"><div><span className="live-dot"/> Session · {subject}</div><div className="timer" aria-label="Elapsed session time">{Math.floor(elapsed / 60).toString().padStart(2, "0")}:{(elapsed % 60).toString().padStart(2, "0")} / {view?.session?.minutes ?? profile.minutes}:00</div><button className="end-button" disabled={busy || !!pending} onClick={finish}>End session</button></header>
            <div className="teaching-stage"><div className="mentor"><img loading="lazy" src="/art/mentor.webp" alt="Your illustrated teacher gesturing toward the lesson board" width="1000" height="864"/><div className="mentor-caption"><span className="live-dot"/> Your learning guide</div></div>
            <Panel className="lesson-board"><p className="eyebrow">{feedbackOpen ? "LET’S MAKE THE IDEA CLEAR" : view?.lesson?.move.replaceAll("_", " ") || "THINK IT THROUGH"}</p><h1 ref={heading} tabIndex={-1}>{preview ? "The River System" : view?.lesson?.title || view?.concepts.find(c => c.id === view.item.concept_id)?.name || subject}</h1>
            {preview && <RiverDiagram/>}
            {view?.lesson && <><p className="lesson-objective">{view.lesson.objective}</p><p className="fine-print">Segment {Math.min(view.lesson.completed_segments + 1, view.lesson.total_segments)} of {view.lesson.total_segments} · Your progress is saved to your account.</p>{view.continuity && <p className="fine-print">{view.continuity}</p>}</>}
            {feedbackOpen ? <div className="feedback" role="status"><span className={`feedback-badge ${view?.feedback?.correct ? "correct" : ""}`}>{view?.feedback?.correct ? "✓ That’s right" : "Let’s revisit this"}</span><h2>{results.at(-1)?.question}</h2><p>Correct answer: <strong>{view?.feedback?.correct_text}</strong></p><p>{view?.feedback?.explanation?.body || "Your answer has been recorded."}</p>{view?.feedback?.assisted && <p className="fine-print">Assisted practice · This answer does not count as independent mastery evidence.</p>}{view?.feedback?.explanation && <small className="muted">Source: {view.feedback.explanation.source}</small>}<Button onClick={() => { setFeedbackOpen(false); startedAt.current = Date.now(); }}>Continue →</Button></div>
            : view?.session?.status === "paused" ? <div className="lesson-copy"><h2>Your lesson is paused.</h2><p>The same activity will be here when you return.</p><Button disabled={busy || !!pending} onClick={() => act("resume")}>Resume lesson →</Button></div>
            : view?.session?.status === "completed" ? <div className="lesson-copy"><h2>One step further.</h2><p>Your answers and notes are saved. Take a moment to reflect.</p><Button disabled={busy || !!pending} onClick={finish}>See session summary →</Button></div>
            : view && (!view.lesson || view.lesson.input === "item_response") ? <><p className="eyebrow">{view.item.purpose === "transfer" ? "INDEPENDENT TRANSFER" : view.item.purpose === "check" ? "INDEPENDENT CHECK" : view.item.purpose === "practice" ? "SUPPORTED PRACTICE" : view.item.purpose === "diagnostic" ? "STARTING-POINT DIAGNOSTIC" : "YOUR QUESTION"}</p><h2 className="question-stem">{view.item.stem}</h2>{view.lesson?.support && <aside className="lesson-support" role="status"><h3>A little support</h3><p>{view.lesson.support.body}</p><small>Source: {view.lesson.support.source}</small><p className="fine-print">This attempt will be recorded as assisted practice.</p></aside>}<div className="answer-grid">{view.item.options.map((v, i) => <button className="option" disabled={busy || !!pending || drawing} key={`${view.item.id}:${i}`} onClick={() => answer(i)}><span className="option-key">{String.fromCharCode(65 + i)}</span>{v}</button>)}</div><label className="confidence">How sure do you feel?<select value={confidence} onChange={e => setConfidence(Number(e.target.value))}><option value={1}>Unsure</option><option value={2}>Somewhat sure</option><option value={3}>Very sure</option></select></label>{view.lesson && <div className="lesson-actions"><Button secondary disabled={busy || !!pending || !view.lesson.hints_allowed || !view.lesson.hint_available} onClick={() => act("hint")}>Give me a hint</Button><Button secondary disabled={busy || !!pending || !view.lesson.hints_allowed || !view.lesson.example_available} onClick={() => act("example")}>Show an example</Button>{!view.lesson.hints_allowed && <small>Answer this independent check first. Support follows when needed.</small>}</div>}</>
            : view?.lesson ? <div className="lesson-copy"><p>{view.lesson.body}</p><LessonDiagram lesson={view.lesson}/>{view.lesson.reference && <details className="lesson-reference"><summary>Explore the Geography reference</summary><h3>{view.lesson.reference.title}</h3><p>{view.lesson.reference.body}</p><small>{view.lesson.reference.source}</small><small>{view.lesson.reference.review}</small><p className="fine-print">Additional reference reading; this does not update your learning evidence.</p></details>}{view.lesson.source.startsWith("https://") ? <a target="_blank" rel="noreferrer" href={view.lesson.source}>Source reference ↗</a> : <small>Source: {view.lesson.source}</small>}<small className="fine-print">{view.lesson.review}</small>{view.lesson.communication.humor && <p className="lesson-aside">{view.lesson.board.kind === "river-process" ? "A river’s delivery service sometimes leaves the parcel behind. That is our deposition clue." : (profile.goal === "UPSC Polity" ? "One idea at a time. The Constitution can wait while we untangle this one." : "One idea at a time. The whole planet can wait while we untangle this bit.")}</p>}<Button disabled={busy || !!pending} onClick={() => act("continue")}>{view.lesson.input === "confidence_report" ? "Continue to summary →" : "I’m ready, continue →"}</Button></div>
            : <p>No lesson is open. <button className="text-button" onClick={() => go("confirm")}>Start a session</button></p>}
            <SpeechControls paused={busy || !!pending || view?.session?.status === "paused"} text={feedbackOpen ? view?.feedback?.explanation?.body || "" : view?.lesson?.input === "item_response" || !view?.lesson ? view?.item.stem || "" : view.lesson.body}/>
            <DrawingBoard enabled={drawing} undo={undo} clear={clear}/>{drawing && <p className="drawing-hint">Drawing mode · Turn off Pen to answer</p>}</Panel><div className="board-tools"><button aria-pressed={drawing} className={drawing ? "selected" : ""} onClick={() => setDrawing(!drawing)}>✎<span>Pen</span></button><button onClick={() => setUndo(v => v + 1)}>↶<span>Undo</span></button><button onClick={() => setClear(v => v + 1)}>⌫<span>Clear</span></button></div></div>
            <footer className="session-controls"><button aria-label={view?.session?.status === "paused" ? "Resume lesson" : "Pause lesson"} disabled={!view?.lesson || busy || !!pending || view.session?.status === "completed"} onClick={() => act(view?.session?.status === "paused" ? "resume" : "pause")}>Ⅱ<span>{view?.session?.status === "paused" ? "Resume lesson" : "Pause lesson"}</span></button><button onClick={() => setNotice("Use the board to answer. Source-linked lesson search is available in your Library; free conversation is not configured.")}>▤<span>Answer on board</span></button><button className="mic" disabled aria-label="Speech recognition is not configured">♩</button><button onClick={() => setWhy(!why)}>ⓘ<span>Show why</span></button><button onClick={() => go("map")}>◇<span>Learning map</span></button></footer>{why && <Panel className="session-why"><h3>Why this activity?</h3><p>{view?.decision.receipt.reason.map(cleanReason).join(" ")}</p><p className="muted">{view?.plan.personalisationApplied.join(" ")}</p></Panel>}</div>;
            break;
        case "complete":
            content = <div className="wrap-layout"><img className="wrap-mentor" loading="lazy" src="/art/mentor-complete.webp" alt="Your teacher smiling at the end of the session" width="1000" height="864"/><Panel className="wrap-card">{title("We’re done for today.", "ONE STEP FURTHER")}<p className="lead">You showed up, {profile.name}. That matters.</p><p>{results.length ? `You answered ${results.length} ${results.length === 1 ? "question" : "questions"} and got ${results.filter(r => r.correct).length} correct. Let’s take a moment to reflect.` : "You explored the learning space. There are no recorded answers in this session yet."}</p><div className="session-stats"><div><strong>{results.length}</strong><span>Answers recorded</span></div><div><strong>{score(results) === null ? "—" : `${score(results)}%`}</strong><span>Session accuracy</span></div></div><p className="fine-print">Session accuracy describes these answers; it does not prove retention.</p><Button onClick={() => go("debrief")}>See what you achieved →</Button></Panel></div>;
            break;
        case "debrief":
            content = <div className="debrief-layout"><div className="debrief-choice"><Orb small mood="attentive"/><Speech>Hey! I’m back. <span className="spark">✦</span><br />How did that feel?</Speech><Options values={feelings} value={feeling} onChange={setFeeling}/></div><Panel className="observations">{title("Here’s what we observed", "A MOMENT TO REFLECT")}<ul className="checklist"><li>✓ Answers recorded: {results.length}</li><li>✓ Session accuracy: {score(results) === null ? "Not available" : `${score(results)}%`}</li><li>✓ Your reported confidence: {results.length ? `${Math.round(100 * results.filter(r => r.confidence === 3).length / results.length)}% of answers marked very sure` : "Not recorded"}</li><li>✓ Concepts explored: {[...new Set(results.map(r => r.concept))].join(", ") || "None yet"}</li></ul><p className="muted">Your reflection is saved with this session. Connected notes can be reopened on another device.</p><Button onClick={saveDebrief}>Choose what comes next →</Button></Panel></div>;
            break;
        case "next":
            content = <div className="form-layout"><div className="character-stage"><Orb /><Speech>Keep the momentum,<br />at your own pace.</Speech></div><Panel className="form-card">{title("Your next step. Your choice.", "KEEP GROWING")}<p>I have two options for you:</p><Options values={["Short repair tomorrow", "Move forward"]} value={nextStep} onChange={setNextStep}/><p className="muted">{nextStep === "Short repair tomorrow" ? "Revisit the ideas that felt uncertain, then try a fresh question." : "Continue exploring and return to these concepts later."}</p><p className="fine-print">Your intention is saved with this session. It does not schedule a reminder or override the learning planner.</p><Button onClick={saveNext}>Sounds good →</Button><button className="text-button" onClick={() => go("debrief")}>I want to change my reflection</button></Panel></div>;
            break;
        case "artifacts":
        case "library":
            content = <div className="collection-layout">{title(screen === "library" ? "Your library" : "Your learning, collected", screen === "library" ? "MAKE KNOWLEDGE YOUR OWN" : "YOUR ARTIFACTS ARE READY")}<p className="lead">Your questions, explanations and reflections, ready to revisit.</p>{screen === "library" && <Panel className="knowledge-search"><h2>Explore your lesson sources</h2><form onSubmit={e => { e.preventDefault(); if (adapter?.search && space) void perform(async () => setKnowledge(await adapter.search!(space.student_id, query)), "Finding lesson sources"); }}><label>Your topic or question<input value={query} onChange={e => setQuery(e.target.value)} minLength={3} maxLength={300} placeholder="Try sediment or constitutional rights"/></label><Button type="submit" disabled={busy || !adapter?.search || query.trim().length < 3}>Find lesson sources</Button></form>{!adapter?.search && <p className="fine-print">Source retrieval is available in connected mode.</p>}{knowledge && <><p className="fine-print">{knowledge.scope}</p>{knowledge.results.length ? knowledge.results.map(r => <article className="knowledge-card" key={r.id}><h3>{r.title || r.concept_id.replaceAll("_", " ")}</h3><p>{r.body}</p>{r.source.startsWith("https://") ? <a href={r.source} target="_blank" rel="noreferrer">Source reference ↗</a> : <small>{r.source}</small>}<small>{r.review}</small>{r.assessment_ready === false && <p className="fine-print">{r.unit_id ? "An authored unit is available; subject review remains pending." : "Reference reading · This topic may not yet have an assessed lesson."}</p>}{r.unit_id && <Button secondary onClick={() => { patch({ geographyUnit: r.unit_id }); go("confirm"); }}>Choose for next session →</Button>}</article>) : <p>No matching lesson found. Try a more specific concept; this seed library has limited coverage.</p>}</>}</Panel>}<div className="artifact-grid">{history.length ? history.map(s => <Panel key={s.id} className="artifact-card"><div className="paper-icon">▤</div><div><p className="eyebrow">SESSION NOTES · {new Date(s.date).toLocaleDateString()}</p><h2>{s.subject}</h2><p className="muted">{s.results.length} answers · {s.feeling || "Reflection not recorded"}</p><button className="text-button" onClick={() => setNotes(s)}>View notes ↗</button><button className="text-button" onClick={() => exportNotes(s)}>Download .txt ↓</button></div></Panel>) : <Panel className="empty"><h2>Your first page is waiting.</h2><p>Finish a session to collect its questions and explanations here.</p><Button onClick={() => go("confirm")}>Start a session →</Button></Panel>}</div><p className="fine-print">Connected notes are saved to your account. Preview notes stay in this browser. Downloads help you keep a copy.</p><Button onClick={() => go("return")}>Back to your room →</Button></div>;
            break;
        case "map":
            content = <div className="collection-layout">{title("Every idea has a place", "YOUR LEARNING MAP")}<p className="lead">See what you’ve explored, and where there’s more to discover.</p><div className="concept-grid">{view ? view.concepts.map(c => <Panel key={c.id} className="concept-card"><span className="concept-symbol">◇</span><h2>{c.name}</h2><p>{c.grey ? "Not enough evidence yet" : `${Math.round(c.mean * 100)}% estimate`}</p><div className="evidence-track"><span style={{ width: c.grey ? "0%" : `${c.mean * 100}%` }}/></div><p className="fine-print">{c.grey ? "Begin with a question to build evidence." : `Uncertainty range: ${Math.round(c.lo * 100)}–${Math.round(c.hi * 100)}% · evidence weight ${c.nEff.toFixed(1)}`}</p></Panel>) : <Panel className="empty"><h2>Let’s discover your starting point.</h2><p>Open a session to load your current learning evidence.</p><Button onClick={() => go("confirm")}>Start a session →</Button></Panel>}</div><div className="actions"><Button secondary onClick={() => go("plan")}>See the bigger picture</Button><Button onClick={() => go(view ? "session" : "confirm")}>{view ? "Return to lesson" : "Start learning"} →</Button></div>{preview && <p className="fine-print">Preview estimates illustrate the interface; they are not validated learner measurements.</p>}</div>;
            break;
        case "growth":
            content = <div className="collection-layout">{title("Small steps. Visible growth.", "YOUR LEARNING RHYTHM")}<p className="lead">A record of your effort, with room for uncertainty.</p><div className="growth-stats"><Panel><strong>{history.length}</strong><p>Sessions completed here</p></Panel><Panel><strong>{history.reduce((n, s) => n + s.results.length, 0)}</strong><p>Answers recorded here</p></Panel><Panel><strong>{new Set(history.map(s => s.date.slice(0, 10))).size}</strong><p>Days you showed up</p></Panel></div><Panel className="growth-chart"><h2>Your recent sessions</h2>{history.some(s => s.results.length) ? <div className="bars">{history.slice(0, 10).reverse().map(s => <div className="bar-column" key={s.id}><span>{score(s.results) === null ? "—" : `${score(s.results)}%`}</span><div style={{ height: score(s.results) === null ? 4 : Math.max(4, score(s.results)! * 1.6) }}/><small>{new Date(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small></div>)}</div> : <p className="muted">Complete a session with recorded answers to see your session accuracy here.</p>}<p className="fine-print">Accuracy across different questions is not a comparable mastery score. Delayed retention has not been measured here.</p></Panel></div>;
            break;
        case "agency":
            content = <div className="collection-layout">{title("You’re in the driver’s seat", "YOUR LEARNING AGENCY")}<p className="lead">Understand a recommendation. Choose your pace. Change your mind.</p><div className="agency-grid"><Panel><h2>Why this recommendation?</h2><p>{view?.decision.receipt.reason.map(cleanReason).join(" ") || "Your first activity checks what you know. Start a session to see its recommendation."}</p><p className="muted">{view?.plan.personalisationApplied.join(" ")}</p><p className="fine-print">{preview ? "Illustrative preview reasoning." : "The engine uses recorded answers. Its estimates and intervention effects carry uncertainty."}</p></Panel><Panel><h2>Your pace, today</h2>{preferences}<Button onClick={() => go("confirm")}>Review your session →</Button></Panel></div></div>;
            break;
        case "settings":
            content = <div className="collection-layout">{title("Make this space yours", "YOUR SETTINGS")}<div className="agency-grid"><Panel><h2>Your profile</h2><label>Display name<input value={profile.name} maxLength={255} onChange={e => patch({ name: e.target.value })}/></label><label>Language preference<select value={profile.language} onChange={e => patch({ language: e.target.value })}><option>English</option><option>Hinglish</option></select></label>{preferences}<p className="fine-print">Connected preferences are saved to your account. Lessons currently use English; language preference does not translate them.</p><label className="checkbox"><input type="checkbox" checked={!!profile.humor} onChange={e => patch({ humor: e.target.checked })}/> Occasional light humor</label><Button disabled={busy || !!pending} onClick={savePreferences}>Save preferences</Button></Panel><Panel><h2>Your data & account</h2><p>Learning evidence in connected mode belongs to your authenticated account. Connected session notes and reflections are stored with your account; preview notes are local.</p><label className="checkbox"><input type="checkbox" checked={saveLocal} onChange={e => { setSaveLocal(e.target.checked); if (!e.target.checked)
                localStorage.removeItem(localKey); }}/> Keep a local display cache</label><Button secondary onClick={() => { if (window.confirm("Delete this browser’s saved session notes and preferences? Server learning evidence is retained.")) {
                localStorage.removeItem(localKey);
                setSaveLocal(false);
                if (preview) setHistory([]);
                setNotice("Local cache cleared. Connected account notes are retained.");
            } }}>Clear local notes</Button><Button secondary onClick={signout}>{preview ? "Leave preview" : "Sign out"}</Button></Panel></div></div>;
            break;
        default: content = null;
    }
    return <div className={`astra-app scene-${scene} page-${screen}`}>
    <picture className="scene-background" aria-hidden="true"><source media="(max-width: 700px)" srcSet={`/art/${scene}-mobile.webp`}/><img src={`/art/${scene}.webp`} width="1672" height="941" alt="" loading={screen === "welcome" ? "eager" : "lazy"}/></picture><div className="scene-shade"/>
    {preview && <div className="preview-banner"><span>✦ Interactive preview</span><span>Illustrative River Systems journey · saved locally</span></div>}
    {sidebar && <><button className="mobile-menu" aria-expanded={navOpen} aria-controls="main-navigation" onClick={() => setNavOpen(!navOpen)}>☰ <span>Techgram</span></button><aside id="main-navigation" className={`sidebar ${navOpen ? "open" : ""}`}><Brand /><nav aria-label="Main navigation">{nav.map(n => <button key={n.screen} aria-label={n.label} aria-current={screen === n.screen ? "page" : undefined} className={screen === n.screen ? "active" : ""} disabled={busy || !!pending} onClick={() => go(n.screen)}><span>{n.icon}</span>{n.label}</button>)}</nav><div className="sidebar-footer"><span className="avatar">{profile.name.slice(0, 1).toUpperCase() || "A"}</span><div><strong>{profile.name}</strong><small>{space?.goal || profile.goal}</small></div><button aria-label={preview ? "Leave preview" : "Sign out"} onClick={signout} disabled={busy}>↪</button></div></aside></>}
    <main className={sidebar ? "main with-sidebar" : "main"} aria-busy={busy}>{content}</main>
    {(error || pending && !busy) && <div className="error-toast" role="alert"><p>{error || "The last request needs to be resolved before continuing."}</p>{pending && !busy && <><Button onClick={() => void perform(pending.run, pending.label, true)}>Retry safely</Button>{space && <Button secondary onClick={reloadProgress}>Reload latest progress</Button>}</>}</div>}
    {notice && <div className="notice-toast" role="status">{notice}<button aria-label="Dismiss message" onClick={() => setNotice("")}>×</button></div>}
    <footer className="journey-footer" aria-label="Your learning journey">{journeySteps.map((s, i) => <span key={s} className={i === activeStep ? "active" : ""}><b>{i + 1}</b>{s}{i < 5 && <i>⟶</i>}</span>)}<strong>A continuous, intelligent learning journey</strong></footer>
    {busy && <div className="processing" role="status" aria-live="polite"><Panel><img src="/art/brain.webp" width="240" height="240" alt=""/><p className="eyebrow">A MOMENT OF THOUGHT</p><h2>{pending?.label || "Getting things ready"}…</h2><p>Waiting for {preview ? "the preview activity" : "your learning service"} to finish.</p></Panel></div>}
    {notes && <div className="modal-backdrop" onClick={() => setNotes(null)}><dialog ref={notesDialog} onCancel={() => setNotes(null)} className="notes-dialog glass" aria-labelledby="notes-title" onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === "Escape")
        setNotes(null); }}><button className="modal-close" autoFocus onClick={() => setNotes(null)} aria-label="Close notes">×</button><p className="eyebrow">YOUR SESSION NOTES</p><h2 id="notes-title">{notes.subject}</h2><p className="muted">{new Date(notes.date).toLocaleString()}</p>{notes.results.length ? notes.results.map((r, i) => <article className="note-question" key={r.command}><h3>{i + 1}. {r.question}</h3><p>Your answer: {r.selected} {r.correct ? "✓" : ""}</p><p>Correct answer: {r.answer}</p><p>{r.explanation}</p></article>) : <p>No answers were recorded in this session.</p>}<p>Reflection: {notes.feeling || "Not recorded"}</p><p>Next step: {notes.next || "Not selected"}</p><Button onClick={() => exportNotes(notes)}>Download notes ↓</Button></dialog></div>}
  </div>;
}
