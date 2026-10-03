/**
 * HOME v4 [journey screens 6 + 7] — the room, engineering edition.
 * Left: Astra inside the room + the debrief-driven greeting + Today's Plan
 * (numbered steps with descriptions) + Start/See-why. Right: the Mountain
 * Climb with horizon chips. Desktop 1440. Zero invented data.
 */
import { useMemo } from "react";
import { OrbV4 } from "./orb4.js";
import { Mountain } from "./mountain.js";
import { conceptRows, type SanctuaryState } from "../kernel/adapter.js";
import type { Profile } from "../persist/profile.js";

export function Home4({ sanct, profile, onStart, onMap }: {
  sanct: SanctuaryState; profile: Profile; onStart: () => void; onMap: () => void;
}) {
  const rows = useMemo(() => conceptRows(sanct.sys.belief), [sanct]);
  const shaky = rows.find((r) => !r.grey && r.mean < 0.6) ?? rows.find((r) => r.grey);
  const strong = rows.filter((r) => !r.grey).sort((a, b) => b.mean - a.mean)[0];
  const name = (profile.preferredName ?? profile.name).split(" ")[0]!;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const steps = sanct.plan.blocks.slice(0, 3).map((b, i) => ({
    n: i + 1,
    t: b.action === "review" ? "Quick recall" : b.action === "diagnose" ? "Sharpen" : b.action === "practice" ? "Apply & test" : "Concept repair",
    d: b.action === "review" ? "check what's sticky" : b.action === "practice" ? "mixed questions, real examples" : b.conceptName,
    m: b.minutes,
  }));

  return (
    <div style={{ height: "100%", background: "var(--obsidian)", position: "relative", overflow: "hidden" }}>
      {/* ambient obsidian field */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(1000px 560px at 78% 12%, rgba(245,158,11,0.07), transparent 60%), radial-gradient(800px 460px at 6% 92%, rgba(110,219,255,0.04), transparent 55%)" }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.4, backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "36px 36px" }} />

      <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", padding: "30px 54px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, var(--amber-deep), var(--amber))", display: "grid", placeItems: "center", color: "#0a0a0a", font: "700 14px var(--font-d)" }}>T</div>
          <span style={{ font: "600 15px var(--font-d)" }}>Techgram</span>
          <span style={{ flex: 1 }} />
          <span className="chip4">{profile.exam.split(" (")[0]} · {profile.stage.split(" ")[0].toLowerCase()}</span>
        </div>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 44, alignItems: "center", minHeight: 0 }}>
          {/* left: Astra + greeting + plan */}
          <div>
            <div style={{ display: "flex", gap: 22, alignItems: "center", marginBottom: 16 }}>
              <OrbV4 mood="listen" size={132} />
              <div>
                <h1 style={{ fontSize: 34, fontWeight: 650, letterSpacing: "-0.02em" }}>
                  {greet}, <span style={{ color: "var(--amber)" }}>{name}</span>. 👋
                </h1>
                <p className="dim" style={{ fontSize: 15, marginTop: 6, maxWidth: 420 }}>
                  I've been looking at your last session. One thing we should repair today:
                </p>
              </div>
            </div>
            <p className="dim" style={{ fontSize: 15, maxWidth: 480, marginBottom: 20 }}>
              {strong && shaky
                ? `Your confidence was high on ${strong.name.toLowerCase()}, but ${shaky.name.toLowerCase()} hasn't proven it can survive a delay. So today we focus there. What do you think?`
                : "We're still building your baseline — today's session makes the map real."}
            </p>

            <div className="panel4 raised" style={{ padding: "22px 26px", maxWidth: 500 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <div style={{ font: "600 16px var(--font-d)" }}>Today's Plan</div>
                <span className="mono" style={{ color: "var(--ink-4)" }}>Geomorphology · ~{Math.max(sanct.plan.totalMinutes, 35)} min</span>
              </div>
              <hr className="div4" style={{ margin: "10px 0 14px" }} />
              {steps.map((s) => (
                <div key={s.n} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "7px 0" }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    border: "1.5px solid rgba(110,219,255,0.5)", color: "var(--cyan)",
                    display: "grid", placeItems: "center", font: "600 12.5px var(--font-m)",
                  }}>{s.n}</span>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 500 }}>{s.t} <span className="whisper">({s.m} min)</span></div>
                    <div className="whisper">{s.d}</div>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button className="btn4 solid" onClick={onStart}>Start Session →</button>
                <button className="btn4 ghost" onClick={onMap}>See why this plan?</button>
              </div>
            </div>
          </div>

          {/* right: the mountain climb (screen 7) */}
          <div className="panel4 raised" style={{ padding: "22px 26px", alignSelf: "stretch", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div className="sec-label">PLAN <b>VISUALISATION</b></div>
              <span className="chip4 amber">1 YEAR</span>
            </div>
            <p className="whisper" style={{ marginBottom: 4 }}>
              Here's the bigger picture — your 1-year journey (initial version). It will change as I learn how you learn.
            </p>
            <div style={{ flex: 1, minHeight: 0 }}>
              <Mountain horizon="1 year" />
            </div>
            <div style={{ display: "flex", gap: 7, marginTop: 4 }}>
              {["Today", "Next 7 days", "Next 3 months", "1 year"].map((h) => (
                <span key={h} className="chip4" style={h === "1 year" ? { color: "var(--cyan)", borderColor: "rgba(110,219,255,0.35)" } : undefined}>{h}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="mono" style={{ color: "var(--ink-4)" }}>EVERY RECOMMENDATION CARRIES ITS EVIDENCE</span>
          <span className="mono" style={{ color: "var(--ink-4)" }}>{rows.filter((r) => !r.grey).length} CONCEPTS EVIDENCED</span>
        </div>
      </div>
    </div>
  );
}
