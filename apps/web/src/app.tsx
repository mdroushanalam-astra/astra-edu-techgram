/**
 * THE SHELL v2 — "The Warm Room" [founder boards, ADR-032 pivot].
 * Sidebar nav + the six+ destinations, exactly per the vision boards.
 */
import { useEffect, useState } from "react";
import { newSanctuary, type SanctuaryState } from "./kernel/adapter.js";
import type { StudentEvent } from "@techgram/kernel";
import { loadEvents, saveEvents } from "./persist/idb.js";
import { HomeV2, SessionV2, MapV2, GrowthV2, ArtifactsV2, AgencyV2, SettingsV2 } from "./v2/screens.js";

type Surface = "home" | "session" | "map" | "growth" | "artifacts" | "library" | "agency" | "settings";

const NAV: { id: Surface; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" },
  { id: "session", label: "Session", icon: "M4 5h16v11H4zM8 20h8M12 16v4" },
  { id: "map", label: "Learning Map", icon: "M12 3v4M5 8l3 3M19 8l-3 3M12 7a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9zM8 21h8" },
  { id: "growth", label: "Growth", icon: "M4 19V9m5 10V5m5 14v-7m5 7V8" },
  { id: "artifacts", label: "Artifacts", icon: "M6 3h12v18H6zM9 7h6M9 11h6M9 15h4" },
  { id: "library", label: "Library", icon: "M5 4h6v16H5zM13 4h6v16h-6zM11 4v16" },
  { id: "agency", label: "Agency", icon: "M12 3l2.2 5.2L20 10l-5.8 1.8L12 17l-2.2-5.2L4 10l5.8-1.8zM19 16l1 2.4L22.4 19 20 20l-1 2.4L18 20l-2.4-1 2.4-1.6z" },
  { id: "settings", label: "Settings", icon: "M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2L10 21h4l.6-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" },
];

export function App() {
  const [surface, setSurface] = useState<Surface>("home");
  const [sanct, setSanct] = useState<SanctuaryState | null>(null);

  useEffect(() => {
    loadEvents<StudentEvent>().then((events) => setSanct(newSanctuary(events)));
  }, []);

  if (!sanct) {
    return (
      <div style={{ height: "100%", display: "grid", placeItems: "center" }}>
        <div style={{ width: 54, height: 54, borderRadius: "50%", border: "1.5px solid var(--cyan)", boxShadow: "var(--glow-cyan)", animation: "breathe 2s ease-in-out infinite" }} />
      </div>
    );
  }

  function persist(events: StudentEvent[]) {
    if (events.length) saveEvents(events).then(() => setSanct(newSanctuary(events)));
    else setSanct(newSanctuary(events));
    setSurface("home");
  }

  return (
    <div className="shell">
      <div className="sidebar">
        <div className="logo">
          <span className="mark">T</span>
          <span className="name">Techgram</span>
        </div>
        <div className="side-nav">
          {NAV.map((n) => (
            <button key={n.id} className={surface === n.id ? "on" : ""} onClick={() => setSurface(n.id)} style={n.id === "library" ? { opacity: 0.45 } : undefined}>
              <svg viewBox="0 0 24 24"><path d={n.icon} /></svg>
              {n.label}
            </button>
          ))}
        </div>
        <div className="profile">
          <span className="avatar">A</span>
          <div className="who"><b>Arjun</b><span>UPSC</span></div>
        </div>
      </div>
      <div className="stage">
        {surface === "home" && <HomeV2 sanct={sanct} onStart={() => setSurface("session")} />}
        {surface === "session" && <SessionV2 sanct={sanct} onEnd={() => persist(sanct.events)} />}
        {surface === "map" && <MapV2 sanct={sanct} />}
        {surface === "growth" && <GrowthV2 sanct={sanct} />}
        {surface === "artifacts" && <ArtifactsV2 sanct={sanct} />}
        {surface === "library" && (
          <div className="screen-pad" style={{ height: "100vh", display: "grid", placeItems: "center" }}>
            <div className="panel" style={{ padding: "34px 44px", textAlign: "center" }}>
              <div className="panel-title">Library</div>
              <p className="dim">your verified concept library opens with the content sprint — it's the founder's hours, not code.</p>
            </div>
          </div>
        )}
        {surface === "agency" && <AgencyV2 sanct={sanct} />}
        {surface === "settings" && <SettingsV2 />}
      </div>
    </div>
  );
}
