/**
 * THE ROOM — warm night study (SVG art layer, swappable with generated art).
 * Cozy lamp-lit room: city window, shelf, plant, desk, cat.
 * Asset slots are marked ART-SWAP: replace <svg> content with generated PNG.
 */

export function Room({ variant = "home" }: { variant?: "home" | "session" }) {
  return (
    <div className="room" aria-hidden>
      <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffb36b" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ff9d45" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="winNight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c2440" />
            <stop offset="100%" stopColor="#0e1226" />
          </linearGradient>
          <linearGradient id="deskWood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a3220" />
            <stop offset="100%" stopColor="#2a1c12" />
          </linearGradient>
        </defs>

        {/* night city window */}
        <g opacity="0.9">
          <rect x="880" y="60" width="260" height="330" rx="10" fill="url(#winNight)" stroke="#3a2c1e" strokeWidth="6" />
          <line x1="1010" y1="60" x2="1010" y2="390" stroke="#3a2c1e" strokeWidth="5" />
          <line x1="880" y1="225" x2="1140" y2="225" stroke="#3a2c1e" strokeWidth="5" />
          {[
            [905, 300, 3], [940, 320, 2.4], [965, 285, 2], [1030, 310, 2.6], [1065, 290, 2], [1095, 330, 2.4],
            [920, 120, 2], [955, 100, 2.6], [1040, 130, 2], [1085, 105, 2.6], [1110, 150, 2],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={i % 3 === 0 ? "#ffb36b" : "#4dd8ff"} opacity="0.75" />
          ))}
          <circle cx="1060" cy="95" r="26" fill="#e8ecf6" opacity="0.9" />
          <circle cx="1050" cy="88" r="24" fill="url(#winNight)" opacity="0.85" />
        </g>

        {/* shelf with books */}
        <g>
          <rect x="60" y="120" width="240" height="10" rx="3" fill="#3a2c1e" />
          {[
            ["#8b5cf6", 14], ["#4dd8ff", 10], ["#f5a623", 16], ["#e8ecf6", 9], ["#ef6b6b", 13], ["#4ade80", 11],
          ].map(([c, w], i) => (
            <rect key={i} x={78 + i * 26} y={120 - (34 + (i % 3) * 7)} width={w as number} height={34 + (i % 3) * 7} rx="2" fill={c as string} opacity="0.8" />
          ))}
          <rect x="60" y="230" width="240" height="10" rx="3" fill="#3a2c1e" />
          {[
            ["#4dd8ff", 12], ["#f5a623", 15], ["#8b5cf6", 10], ["#e8ecf6", 14],
          ].map(([c, w], i) => (
            <rect key={i} x={90 + i * 34} y={230 - (30 + (i % 2) * 8)} width={w as number} height={30 + (i % 2) * 8} rx="2" fill={c as string} opacity="0.75" />
          ))}
        </g>

        {/* floor lamp */}
        <g className="lamp-glow">
          <circle cx="180" cy="330" r="150" fill="url(#lampGlow)" />
          <rect x="168" y="270" width="24" height="18" rx="8" fill="#ffb36b" />
          <rect x="176" y="288" width="8" height="150" fill="#3a2c1e" />
          <ellipse cx="180" cy="270" rx="34" ry="16" fill="#2a1c12" stroke="#4a3220" strokeWidth="3" />
        </g>

        {/* plant */}
        <g opacity="0.9">
          {[[-18, -60, -40], [0, -78, 0], [18, -58, 40], [-8, -50, -20], [10, -52, 22]].map(([dx, dy, rot], i) => (
            <path key={i} d={`M 320 730 q ${dx * 0.4} ${dy} ${dx} ${dy}`} transform={`rotate(${rot} 320 730)`} stroke="#2f5d3a" strokeWidth="7" fill="none" strokeLinecap="round" />
          ))}
          <path d="M300 730 q-10 -70 20 -95 M320 730 q4 -80 -6 -100 M340 730 q16 -60 -4 -92" stroke="#3d7a4c" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M292 730 h56 l-8 52 h-40 z" fill="#8b4a2f" />
        </g>

        {/* desk */}
        {variant === "home" && (
          <g>
            <rect x="240" y="700" width="720" height="18" rx="6" fill="url(#deskWood)" />
            <rect x="260" y="718" width="20" height="82" fill="#241812" />
            <rect x="920" y="718" width="20" height="82" fill="#241812" />
            {/* book stack on desk */}
            <rect x="700" y="678" width="90" height="10" rx="3" fill="#8b5cf6" opacity="0.85" />
            <rect x="708" y="668" width="74" height="10" rx="3" fill="#4dd8ff" opacity="0.7" />
            <rect x="716" y="658" width="58" height="10" rx="3" fill="#f5a623" opacity="0.75" />
            {/* the cat */}
            <g transform="translate(560 668)">
              <ellipse cx="0" cy="18" rx="44" ry="18" fill="#1c1420" />
              <circle cx="34" cy="2" r="15" fill="#1c1420" />
              <path d="M26 -8 l5 -10 6 9 M40 -9 l6 -9 4 11" fill="#1c1420" stroke="#1c1420" />
              <path d="M-40 14 q-22 -6 -18 -26" stroke="#1c1420" strokeWidth="9" fill="none" strokeLinecap="round" />
              <circle cx="39" cy="0" r="1.6" fill="#ffb36b" />
            </g>
            {/* mug */}
            <rect x="840" y="676" width="24" height="24" rx="5" fill="#4dd8ff" opacity="0.35" />
          </g>
        )}
      </svg>
    </div>
  );
}
