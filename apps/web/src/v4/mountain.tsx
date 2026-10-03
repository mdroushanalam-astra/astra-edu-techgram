/**
 * THE MOUNTAIN CLIMB [journey screen 7] — the three-horizons law as a climb.
 * A glowing trail up an obsidian mountain: You-are-here → Year 1 → Year 2 →
 * Year 3 → the summit flag. Honest: "initial version — it will change as I
 * learn how you learn." Horizon chips switch the view.
 * ART-SWAP: mountain backdrop replaceable with generated art.
 */

export function Mountain({ horizon = "1 year" }: { horizon?: string }) {
  const nodes = [
    { y: 470, label: "You are here", sub: "Building foundations", now: true },
    { y: 360, label: "Year 1", sub: "Concepts + PYQs" },
    { y: 250, label: "Year 2", sub: "Full syllabus + Answer writing" },
    { y: 150, label: "Year 3", sub: "Advanced practice" },
    { y: 62, label: "UPSC", sub: "the summit", summit: true },
  ];
  return (
    <div style={{ position: "relative", width: "100%", height: 560 }}>
      <style>{`
        @keyframes trailpulse { 0%,100% { opacity: 0.65; } 50% { opacity: 1; } }
        @keyframes nodepulse { 0%,100% { box-shadow: 0 0 10px rgba(245,158,11,0.3); } 50% { box-shadow: 0 0 22px rgba(245,158,11,0.6); } }
      `}</style>
      <svg viewBox="0 0 400 560" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id="mgrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#0b0f16" />
            <stop offset="100%" stopColor="#1a1408" />
          </linearGradient>
          <filter id="mglow"><feGaussianBlur stdDeviation="2.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {/* the obsidian mountain silhouette */}
        <path d="M40 540 L200 70 L360 540 Z" fill="url(#mgrad)" stroke="rgba(255,255,255,0.07)" />
        {/* ridgeline detail */}
        <path d="M200 70 L160 170 L185 240 L150 330 L180 420 L140 540" fill="none" stroke="rgba(255,255,255,0.05)" />
        {/* the glowing trail */}
        <path
          d="M200 470 C 240 430, 160 400, 205 360 C 250 320, 165 295, 210 250 C 255 205, 175 190, 208 150 C 230 122, 215 95, 200 62"
          fill="none" stroke="#f59e0b" strokeWidth="2.4" strokeLinecap="round"
          filter="url(#mglow)" style={{ animation: "trailpulse 2.6s ease-in-out infinite" }}
        />
        {/* summit flag */}
        <g filter="url(#mglow)">
          <line x1="200" y1="62" x2="200" y2="34" stroke="#ffb45c" strokeWidth="2.4" />
          <path d="M200 34 L232 44 L200 54 Z" fill="#ffb45c" />
          <text x="246" y="46" fill="#ffb45c" fontSize="15" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="600">UPSC</text>
        </g>
      </svg>
      {nodes.map((n, i) => {
        const x = 200 + (i === 0 ? 6 : i === 1 ? 5 : i === 2 ? 10 : i === 3 ? 8 : 0);
        return (
          <div key={i} style={{
            position: "absolute", left: `${n.now ? 50 : 52}%`, top: n.y, transform: "translate(-50%, -50%)",
            textAlign: "left", padding: "8px 14px", borderRadius: 9,
            background: n.now ? "rgba(245,158,11,0.10)" : "rgba(255,255,255,0.035)",
            border: n.now ? "1.5px solid rgba(255,180,92,0.6)" : "1px solid rgba(255,255,255,0.12)",
            boxShadow: n.now ? "0 0 24px rgba(245,158,11,0.25)" : "none",
            animation: n.now ? "nodepulse 2.6s ease-in-out infinite" : undefined,
          }}>
            <div style={{ font: "600 13.5px var(--font-d)", color: n.now ? "var(--amber)" : n.summit ? "var(--amber)" : "var(--ink)" }}>{n.label}</div>
            <div className="whisper" style={{ fontSize: 11.5 }}>{n.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
