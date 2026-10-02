/**
 * THINKING BRAIN + RIVER BOARD — the Watch-It-Think brain and the chalk
 * river-system diagram from the founder's boards. ART-SWAP ready.
 */

export function ThinkingBrain({ size = 150 }: { size?: number }) {
  return (
    <svg className="brain-glow" width={size} height={size * 1.15} viewBox="0 0 120 138">
      <defs>
        <linearGradient id="brainG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4dd8ff" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      {/* wireframe brain hemispheres */}
      <path d="M60 12 C28 12 12 34 12 58 C12 82 26 100 44 108 L44 122 M60 12 C92 12 108 34 108 58 C108 82 94 100 76 108 L76 122"
        fill="none" stroke="url(#brainG)" strokeWidth="2" opacity="0.9" />
      {[
        "M20 44 C34 38 46 44 56 40", "M18 60 C34 56 48 62 58 56", "M22 78 C36 72 48 80 58 74",
        "M100 44 C86 38 74 44 64 40", "M102 60 C86 56 72 62 62 56", "M98 78 C84 72 72 80 62 74",
      ].map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#4dd8ff" strokeWidth="1.3" opacity="0.55" />
      ))}
      {/* synapses */}
      {[[34, 36], [52, 52], [40, 72], [70, 40], [86, 56], [72, 76], [60, 30], [60, 92]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.2" fill="#8b5cf6" opacity="0.9">
          <animate attributeName="opacity" values="0.3;1;0.3" dur={`${1.4 + (i % 4) * 0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {/* stem */}
      <path d="M52 122 L52 132 M68 122 L68 132" stroke="#4dd8ff" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

/** The chalk river-system board from the founder's vision — Weathering→Erosion→Transport→Deposition→Delta. */
export function RiverBoard(props: { highlight?: string; progress?: number }) {
  const { highlight, progress = 1 } = props;
  const chalk = "#d8f2ff";
  const yellow = "#ffd166";
  const on = (id: string) => (highlight === id ? 1 : 0.85);
  const lw = (id: string) => (highlight === id ? 3.4 : 2.2);
  return (
    <svg viewBox="0 0 900 520" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="chalkGlow"><feGaussianBlur stdDeviation="1.4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <text x="60" y="64" fill={chalk} fontSize="34" fontFamily="Sora, sans-serif" fontStyle="italic" filter="url(#chalkGlow)">The River System</text>
      <line x1="60" y1="78" x2="340" y2="78" stroke={chalk} strokeWidth="1.6" opacity="0.6" />

      {/* mountain + weathering */}
      <g opacity={on("weathering")} filter="url(#chalkGlow)">
        <path d="M90 300 L180 170 L250 260 L310 190 L380 300" fill="none" stroke={chalk} strokeWidth={lw("weathering")} strokeLinejoin="round" />
        <path d="M150 230 l20 -14 16 12 M270 226 l18 -12 14 10" stroke={chalk} strokeWidth="1.4" fill="none" />
        <text x="150" y="132" fill={chalk} fontSize="19" fontFamily="Sora">1. Weathering</text>
        <text x="150" y="152" fill={chalk} fontSize="12.5" opacity="0.75">(breaks down)</text>
      </g>

      {/* erosion arrow */}
      <g opacity={on("erosion")} filter="url(#chalkGlow)">
        <path d="M160 320 C210 360 260 366 320 352" fill="none" stroke={chalk} strokeWidth={lw("erosion")} strokeDasharray="7 6" />
        <path d="M312 344 l14 7 -12 9" fill="none" stroke={chalk} strokeWidth="2" />
        <text x="120" y="368" fill={chalk} fontSize="19" fontFamily="Sora">2. Erosion</text>
        <text x="120" y="388" fill={chalk} fontSize="12.5" opacity="0.75">(loose material)</text>
      </g>

      {/* the river to the delta */}
      <g opacity={on("transport")} filter="url(#chalkGlow)">
        <path d="M380 300 C450 320 470 350 520 356 C580 364 600 340 650 356 C700 372 720 400 780 412"
          fill="none" stroke={yellow} strokeWidth={lw("transport")} strokeLinecap="round" />
        <text x="470" y="332" fill={yellow} fontSize="19" fontFamily="Sora">3. Transport</text>
        <text x="470" y="352" fill={yellow} fontSize="12.5" opacity="0.85">(moves material)</text>
      </g>

      {/* deposition + delta fan */}
      <g opacity={on("deposition")} filter="url(#chalkGlow)">
        <path d="M760 400 C790 420 820 444 840 470 M770 416 C796 440 812 462 824 486 M748 410 C766 440 778 466 786 492"
          fill="none" stroke={chalk} strokeWidth="1.8" />
        <text x="600" y="220" fill={chalk} fontSize="19" fontFamily="Sora">4. Deposition</text>
        <text x="600" y="240" fill={chalk} fontSize="12.5" opacity="0.75">(settles down)</text>
        <path d="M600 250 q8 40 60 58" stroke={chalk} strokeWidth="1.4" fill="none" strokeDasharray="4 5" opacity="0.7" />
      </g>

      {/* Delta label — handwritten emphasis */}
      <g opacity={on("delta")} filter="url(#chalkGlow)">
        <text x="800" y="360" fill={yellow} fontSize="24" fontFamily="Sora" transform="rotate(-8 800 360)">Delta ✎</text>
        <path d="M790 428 l10 14 12 -12" fill="none" stroke={yellow} strokeWidth="2.4" />
      </g>

      {/* illustrative thumbnails (ART-SWAP: generated river/delta photos) */}
      {[[470, 420], [560, 436], [650, 420], [740, 452]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width="88" height="56" rx="8" fill="#123243" stroke="#4dd8ff" strokeOpacity="0.4" />
          <path d={`M${x + 10} ${y + 40} q22 -20 40 -6 t ${38 - 4} 2`} stroke="#4dd8ff" strokeWidth="2" fill="none" opacity="0.7" />
          <circle cx={x + 66} cy={y + 16} r="8" fill="#ffb36b" opacity="0.8" />
        </g>
      ))}

      {/* progress stroke (draw-on feel) */}
      <rect x="0" y="0" width={900 * (1 - progress)} height="520" fill="#0e2230" opacity="0.001" />
    </svg>
  );
}
