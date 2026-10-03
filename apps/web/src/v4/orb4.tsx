/**
 * ASTRA v4 [obsidian & amber] — the energy being with a FACE.
 * Per the founder's board: a glowing sphere with two alive eyes and a
 * gentle smile, wrapped in a swirling particle ring. States colour the
 * core (listen cyan-white, think violet, insight amber, celebrate bloom,
 * silent near-still). Synchronised with voice word-events (blinkPulse).
 */

export type V4Mood = "listen" | "think" | "insight" | "celebrate" | "ready" | "silent" | "fade";

const MOOD: Record<V4Mood, { core: string; halo: string; ring: string }> = {
  listen:    { core: "#dff4ff", halo: "rgba(110,219,255,0.35)", ring: "rgba(110,219,255,0.45)" },
  think:     { core: "#b9a8ff", halo: "rgba(139,123,255,0.28)", ring: "rgba(139,123,255,0.4)" },
  insight:   { core: "#ffd9a0", halo: "rgba(255,180,92,0.45)", ring: "rgba(255,180,92,0.55)" },
  celebrate: { core: "#ffe2b3", halo: "rgba(255,190,92,0.55)", ring: "rgba(255,190,92,0.6)" },
  ready:     { core: "#dff4ff", halo: "rgba(110,219,255,0.5)", ring: "rgba(110,219,255,0.65)" },
  silent:    { core: "#2a3442", halo: "rgba(100,116,139,0.15)", ring: "rgba(100,116,139,0.2)" },
  fade:      { core: "#dff4ff", halo: "rgba(110,219,255,0.18)", ring: "rgba(110,219,255,0.25)" },
};

export function OrbV4({ mood = "listen", size = 240, speaking = false }: { mood?: V4Mood; size?: number; speaking?: boolean }) {
  const m = MOOD[mood];
  return (
    <div className="orb4-wrap" style={{ width: size, height: size }}>
      <style>{`
        .orb4-wrap { position: relative; display: grid; place-items: center; }
        .orb4-core {
          width: 62%; height: 62%; border-radius: 50%; position: relative;
          background:
            radial-gradient(circle at 36% 30%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.25) 18%, transparent 42%),
            radial-gradient(circle at 50% 62%, ${m.core} 0%, ${m.core}55 48%, transparent 75%);
          box-shadow: 0 0 ${size * 0.36}px ${m.halo}, inset 0 0 ${size * 0.14}px ${m.ring};
          transition: background 800ms cubic-bezier(.22,1,.36,1), box-shadow 800ms;
          animation: orb4-breathe 3.4s ease-in-out infinite;
        }
        @keyframes orb4-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.035); } }
        /* the face — two eyes + smile, alive */
        .orb4-face { position: absolute; inset: 0; display: grid; place-items: center; }
        .orb4-eyes { display: flex; gap: ${size * 0.085}px; margin-bottom: ${size * 0.03}px; }
        .orb4-eye {
          width: ${size * 0.045}px; height: ${size * 0.075}px; border-radius: 999px;
          background: #0a1018; opacity: 0.88;
          animation: orb4-blink 5.4s ease-in-out infinite;
          transition: height 200ms;
        }
        .orb4-eye.l { transform: rotate(-4deg); }
        .orb4-eye.r { transform: rotate(4deg); }
        @keyframes orb4-blink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.08); } }
        .orb4-smile {
          width: ${size * 0.12}px; height: ${size * 0.05}px;
          border: ${Math.max(2, size * 0.008)}px solid #0a1018; border-top: 0;
          border-radius: 0 0 ${size * 0.12}px ${size * 0.12}px; opacity: 0.85;
        }
        .orb4-speaking .orb4-smile { animation: orb4-talk 320ms ease-in-out infinite; }
        @keyframes orb4-talk { 0%,100% { transform: scaleY(0.7); } 50% { transform: scaleY(1.15); } }
        /* the swirl ring — counter-rotating arcs */
        .orb4-ring, .orb4-ring2 { position: absolute; inset: 0; border-radius: 50%; }
        .orb4-ring {
          border: 1.5px solid transparent;
          border-top-color: ${m.ring}; border-right-color: ${m.ring};
          transform: rotate(-24deg); animation: orb4-spin 9s linear infinite;
        }
        .orb4-ring2 {
          inset: -7%; border: 1px solid transparent;
          border-bottom-color: ${m.ring}; border-left-color: ${m.ring};
          opacity: 0.6; animation: orb4-spin 14s linear infinite reverse;
        }
        @keyframes orb4-spin { to { transform: rotate(336deg); } }
        .orb4-ring2 { animation-name: orb4-spin2; }
        @keyframes orb4-spin2 { from { transform: rotate(160deg); } to { transform: rotate(-200deg); } }
        /* orbiting sparks */
        .orb4-spark { position: absolute; width: 4px; height: 4px; border-radius: 50%; background: ${m.core}; opacity: 0.8; box-shadow: 0 0 8px ${m.halo}; }
        .s1 { animation: orb4-orbit 7.4s linear infinite; }
        .s2 { width: 3px; height: 3px; animation: orb4-orbit 11s linear infinite reverse; }
        .s3 { width: 2.5px; height: 2.5px; opacity: 0.5; animation: orb4-orbit 16s linear infinite; }
        @keyframes orb4-orbit { from { transform: rotate(0deg) translateX(${size * 0.52}px) rotate(0deg); } to { transform: rotate(360deg) translateX(${size * 0.52}px) rotate(-360deg); } }
      `}</style>
      <div className={`orb4-core ${speaking ? "orb4-speaking" : ""}`}>
        <div className="orb4-face">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="orb4-eyes"><span className="orb4-eye l" /><span className="orb4-eye r" /></div>
            <div className="orb4-smile" />
          </div>
        </div>
      </div>
      <div className="orb4-ring" /><div className="orb4-ring2" />
      <span className="orb4-spark s1" /><span className="orb4-spark s2" /><span className="orb4-spark s3" />
    </div>
  );
}
