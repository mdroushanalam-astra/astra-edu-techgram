/**
 * THE SHELL [ADR-032] — six destinations, one room. The kernel state lives
 * here; screens receive it; the session consumes and returns events.
 */
import { useEffect, useState } from "react";
import { newSanctuary, type SanctuaryState } from "./kernel/adapter.js";
import type { StudentEvent } from "@techgram/kernel";
import { loadEvents, saveEvents } from "./persist/idb.js";
import { HomeScreen } from "./screens/Home.js";
import { SessionScreen } from "./screens/Session.js";
import { BrainMapScreen } from "./screens/BrainMap.js";
import { GrowthScreen } from "./screens/Growth.js";
import { NotebookScreen } from "./screens/Notebook.js";
import { SettingsScreen } from "./screens/Settings.js";

type Surface = "home" | "session" | "brain_map" | "growth" | "notebook" | "settings";

const ICONS: Record<Surface, string> = {
  home: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z",
  session: "M4 5h16v11H4zM8 20h8M12 16v4",
  brain_map: "M12 3a7 7 0 0 1 7 7c0 2.5-1.5 4-3 5v3h-8v-3c-1.5-1-3-2.5-3-5a7 7 0 0 1 7-7zM10 21h4",
  growth: "M4 19V9m5 10V5m5 14v-7m5 7V8",
  notebook: "M6 3h12v18H6zM9 7h6M9 11h6M9 15h4",
  settings: "M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2L10 21h4l.6-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z",
};

export function App() {
  const [surface, setSurface] = useState<Surface>("home");
  const [sanct, setSanct] = useState<SanctuaryState | null>(null);
  const [loading, setLoading] = useState(true);

  // the room remembers: rebuild state from the local event log
  useEffect(() => {
    loadEvents<StudentEvent>().then((events) => {
      setSanct(newSanctuary(events));
      setLoading(false);
    });
  }, []);

  function persist(events: StudentEvent[]) {
    if (events.length) saveEvents(events).then(() => setSanct(newSanctuary(events)));
    else setSanct(newSanctuary(events));
    setSurface("home");
  }

  if (loading || !sanct) {
    return (
      <div style={{ height: "100%", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 54, height: 54, margin: "0 auto 16px", borderRadius: "50%", border: "1.5px solid var(--cool)", boxShadow: "var(--glow-cool)", animation: "breathe 2.4s ease-in-out infinite" }} />
          <span className="whisper">opening your room…</span>
        </div>
      </div>
    );
  }

  if (surface === "session") {
    return <SessionScreen sanct={sanct} onExit={persist} />;
  }

  return (
    <>
      {surface === "home" && <HomeScreen sanct={sanct} onStart={() => setSurface("session")} onGo={(s) => setSurface(s as Surface)} />}
      {surface === "brain_map" && <BrainMapScreen sanct={sanct} />}
      {surface === "growth" && <GrowthScreen sanct={sanct} />}
      {surface === "notebook" && (
        <NotebookScreen
          sanct={sanct}
          onAsk={(q) => {
            const ev: StudentEvent = {
              event_id: `web_q_${sanct.events.length + 1}`, student_id: "student", day: sanct.day,
              type: "curiosity_captured", payload: { question: q, concept_ids: [], source: "student" },
              source: "web", schema_version: 1, idempotency_key: `web_q_${Date.now()}`,
            };
            persist([...sanct.events, ev]);
          }}
        />
      )}
      {surface === "settings" && <SettingsScreen onWipe={() => { setSanct(newSanctuary([])); setSurface("home"); }} />}

      <nav className="nav">
        {(["home", "session", "brain_map", "growth", "notebook", "settings"] as Surface[]).map((s) => (
          <button key={s} className={surface === s ? "on" : ""} onClick={() => setSurface(s)}>
            <svg viewBox="0 0 24 24"><path d={ICONS[s]} /></svg>
            {s === "brain_map" ? "map" : s === "session" ? "session" : s}
          </button>
        ))}
      </nav>
    </>
  );
}
