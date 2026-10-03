/**
 * ASTRA — the coordinator orb [ADR-033].
 * A layered 3D ball whose colour IS her interaction state:
 *   listen = soft cyan pulse · think = dim violet orbit ·
 *   insight = amber expansion · celebrate = warm bloom ·
 *   teach/ready = bright teal · silent = nearly still.
 * Never an emotion lookup — a state light. Particle orbit + inner glow.
 */

export type OrbMood = "listen" | "think" | "insight" | "celebrate" | "ready" | "silent" | "fade";

const MOOD: Record<OrbMood, { core: string; glow: string; ring: string; anim: string; label: string }> = {
  listen:    { core: "#4dd8ff", glow: "rgba(77,216,255,0.35)", ring: "rgba(77,216,255,0.5)",  anim: "orb-listen 2.6s ease-in-out infinite", label: "listening" },
  think:     { core: "#8b7bff", glow: "rgba(139,123,255,0.22)", ring: "rgba(139,123,255,0.35)", anim: "orb-think 4.2s ease-in-out infinite", label: "thinking" },
  insight:   { core: "#f5a623", glow: "rgba(245,166,35,0.4)",  ring: "rgba(245,166,35,0.55)",  anim: "orb-insight 1.9s ease-in-out infinite", label: "insight" },
  celebrate: { core: "#ffbe5c", glow: "rgba(255,190,92,0.5)",  ring: "rgba(255,190,92,0.6)",   anim: "orb-insight 1.2s ease-in-out infinite", label: "delighted" },
  ready:     { core: "#4dd8ff", glow: "rgba(77,216,255,0.5)",  ring: "rgba(77,216,255,0.7)",   anim: "orb-think 3s ease-in-out infinite", label: "ready" },
  silent:    { core: "#39506b", glow: "rgba(57,80,107,0.18)",  ring: "rgba(57,80,107,0.25)",   anim: "none", label: "giving you space" },
  fade:      { core: "#4dd8ff", glow: "rgba(77,216,255,0.2)",  ring: "rgba(77,216,255,0.3)",   anim: "orb-think 5s ease-in-out infinite", label: "stepping back" },
};

export function Orb({ mood = "listen", size = 190 }: { mood?: OrbMood; size?: number }) {
  const m = MOOD[mood];
  return (
    <div className="orb-wrap" style={{ width: size, height: size }} title={m.label}>
      <style>{`
        .orb-wrap { position: relative; display: grid; place-items: center; }
        .orb {
          width: 68%; height: 68%; border-radius: 50%; position: relative;
          background:
            radial-gradient(circle at 34% 28%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.12) 22%, transparent 40%),
            radial-gradient(circle at 50% 60%, ${m.core} 0%, ${m.core}44 55%, transparent 78%);
          box-shadow: 0 0 ${size * 0.34}px ${m.glow}, inset 0 0 ${size * 0.16}px ${m.ring};
          animation: ${m.anim};
          transition: background 700ms cubic-bezier(.22,1,.36,1), box-shadow 700ms;
        }
        .orb::after {
          content: ""; position: absolute; inset: -7%; border-radius: 50%;
          border: 1.5px solid ${m.ring}; opacity: 0.7;
        }
        @keyframes orb-listen { 0%,100% { transform: scale(1); } 50% { transform: scale(1.045); } }
        @keyframes orb-think { 0%,100% { transform: scale(0.97) translateY(2px); opacity: 0.85; } 50% { transform: scale(1.01) translateY(-2px); opacity: 1; } }
        @keyframes orb-insight { 0%,100% { transform: scale(1); box-shadow: 0 0 26px ${m.glow}; } 50% { transform: scale(1.08); box-shadow: 0 0 54px ${m.glow}; } }
        .orb-dot { position: absolute; border-radius: 50%; background: ${m.core}; opacity: 0.7; }
        .d1 { width: 6px; height: 6px; animation: orbit1 5.2s linear infinite; }
        .d2 { width: 4px; height: 4px; animation: orbit2 7.1s linear infinite; }
        .d3 { width: 3px; height: 3px; animation: orbit1 9s linear infinite reverse; }
        @keyframes orbit1 { from { transform: rotate(0deg) translateX(${size * 0.46}px) rotate(0deg); } to { transform: rotate(360deg) translateX(${size * 0.46}px) rotate(-360deg); } }
        @keyframes orbit2 { from { transform: rotate(120deg) translateX(${size * 0.4}px) rotate(-120deg); } to { transform: rotate(480deg) translateX(${size * 0.4}px) rotate(-480deg); } }
      `}</style>
      <div className="orb" />
      <span className="orb-dot d1" /><span className="orb-dot d2" /><span className="orb-dot d3" />
    </div>
  );
}
