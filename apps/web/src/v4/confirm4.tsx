/**
 * CONFIRM & START [journey screen 8] — the last door before the teacher.
 * Full option rows (including "another request" = the agency door), the
 * teacher-ready note, the big Start CTA.
 */
import { OrbV4 } from "./orb4.js";
import type { Profile } from "../persist/profile.js";

export function Confirm4({ profile, onStart, onBack }: {
  profile: Profile; onStart: (choice: string) => void; onBack: () => void;
}) {
  const rows = [
    { k: "✓", t: "Let's do it!", primary: true },
    { k: "⇄", t: "I want to tweak the plan" },
    { k: "▲", t: "Make it a bit harder" },
    { k: "▼", t: "Make it lighter" },
    { k: "⚠", t: "I have another request" },
  ];
  return (
    <div style={{ height: "100vh", background: "var(--obsidian)", position: "relative", display: "grid", placeItems: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(800px 480px at 50% 100%, rgba(245,158,11,0.08), transparent 60%)" }} />
      <div style={{ position: "relative", zIndex: 2, width: "min(560px, 92vw)", textAlign: "center" }}>
        <div style={{ display: "grid", placeItems: "center", marginBottom: 14 }}>
          <OrbV4 mood="ready" size={150} />
        </div>
        <h2 style={{ fontSize: 25, marginBottom: 22 }}>So… are you ready to start from today?</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
          {rows.map((r) => (
            <button key={r.t} className="opt4" style={r.primary ? { borderColor: "rgba(110,219,255,0.45)", color: "var(--cyan)" } : undefined}
              onClick={() => onStart(r.t)}>
              <span className="opt4-key">{r.k}</span>{r.t}
            </button>
          ))}
        </div>
        <div className="panel4" style={{ padding: "13px 18px", marginBottom: 18, textAlign: "left" }}>
          <span className="dim" style={{ fontSize: 14 }}>🔔 Your teacher is ready now. I'll be right here when you're done. ✨</span>
        </div>
        <button className="btn4 solid" style={{ width: "100%", padding: "16px" }} onClick={() => onStart("Let's do it!")}>
          Start 40-Min Session →
        </button>
        <button className="btn4 ghost" style={{ marginTop: 12 }} onClick={onBack}>← back to the room</button>
      </div>
    </div>
  );
}
