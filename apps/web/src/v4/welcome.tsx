/**
 * WELCOME [ADR-033 v4, screen 1 of the 15-screen journey] — the door.
 * Obsidian hero: Techgram wordmark, the tagline trio, Astra's orb as the
 * hero graphic, Sign In (returning) / Create New Account, and the privacy
 * promise as a status chip. Desktop-first, engineering-marvel composition.
 * ART-SWAP: the background gradient is a placeholder for a generated
 * obsidian hero image with amber particle light.
 */
import { OrbV4 } from "./orb4.js";

export function Welcome({ hasProfile, onEnter }: { hasProfile: boolean; onEnter: (mode: "signin" | "create") => void }) {
  return (
    <div style={{ height: "100vh", position: "relative", overflow: "hidden", background: "var(--obsidian)" }}>
      {/* ambient: obsidian field + amber horizon glow + drifting particles */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(1100px 600px at 72% 88%, rgba(245,158,11,0.10), transparent 60%), radial-gradient(900px 500px at 12% 8%, rgba(110,219,255,0.05), transparent 55%)" }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.5, backgroundImage: "radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)", backgroundSize: "34px 34px" }} />

      <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", padding: "34px 56px" }}>
        {/* wordmark row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, var(--amber-deep), var(--amber))", display: "grid", placeItems: "center", color: "#0a0a0a", font: "700 15px var(--font-d)" }}>T</div>
          <span style={{ font: "600 16px var(--font-d)" }}>Techgram</span>
          <span style={{ flex: 1 }} />
          <span className="chip4 amber live">2026.10 · On-device</span>
        </div>

        {/* hero */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.15fr 0.85fr", alignItems: "center", gap: 40 }}>
          <div>
            <div className="sec-label" style={{ marginBottom: 18 }}>TECHGRAM <b>— YOUR INTELLIGENT LEARNING COMPANION</b></div>
            <h1 style={{ fontSize: 56, lineHeight: 1.08, fontWeight: 650, letterSpacing: "-0.03em" }}>
              Learn deeper.<br />Think clearer.<br />
              <span style={{ color: "var(--amber)" }}>Become you.</span>
            </h1>
            <p className="dim" style={{ fontSize: 16.5, maxWidth: 460, marginTop: 22 }}>
              A private study room with a living intelligence — it decides what you should learn next, proves why, and remembers your whole journey. On your device. Nothing pretended.
            </p>
            <hr className="div4" style={{ margin: "28px 0", maxWidth: 420 }} />
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <button className="btn4 solid" onClick={() => onEnter(hasProfile ? "signin" : "create")}>
                {hasProfile ? "Sign In →" : "Create New Account →"}
              </button>
              {hasProfile && <button className="btn4 ghost" onClick={() => onEnter("create")}>New student</button>}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
              <span className="chip4">100% Private</span>
              <span className="chip4">On-device First</span>
              <span className="chip4">Zero LLM Decisions</span>
            </div>
          </div>

          {/* the being */}
          <div style={{ display: "grid", placeItems: "center", position: "relative" }}>
            <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.07), transparent 65%)" }} />
            <OrbV4 mood="listen" size={330} />
            <div className="mono" style={{ marginTop: 18, color: "var(--ink-4)" }}>ASTRA · YOUR GUIDE</div>
          </div>
        </div>

        {/* footer strip */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="mono" style={{ color: "var(--ink-4)" }}>A DETERMINISTIC LEARNING INTELLIGENCE — EVERY DECISION PROVEN</span>
          <span className="mono" style={{ color: "var(--ink-4)" }}>TECHGRAM © 2026</span>
        </div>
      </div>
    </div>
  );
}
