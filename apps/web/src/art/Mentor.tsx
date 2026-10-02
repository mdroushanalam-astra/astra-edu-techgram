/**
 * THE MENTOR — stylized human companion (SVG art, swappable).
 * Warm-lit young mentor: curly hair, hoodie with glowing emblem, gentle smile.
 * mood: idle | speak | think | happy | listen  (drives subtle transforms only —
 * the art itself is static SVG; animation comes from CSS on the wrapper).
 * ART-SWAP: replace inner <svg> with a generated illustration (transparent PNG)
 * of the same crop; the wrapper animation keeps working.
 */

export type MentorMood = "idle" | "speak" | "think" | "happy" | "listen";

export function Mentor({ mood = "idle", size = 300 }: { mood?: MentorMood; size?: number }) {
  const anim =
    mood === "speak" ? "mentor-speak" : mood === "think" ? "mentor-think" : mood === "happy" ? "mentor-happy" : mood === "listen" ? "mentor-listen" : "mentor-idle";
  return (
    <div className={`mentor-wrap ${anim}`} style={{ width: size, height: size * 1.12 }}>
      <style>{`
        .mentor-wrap { position: relative; }
        .mentor-wrap svg { width: 100%; height: 100%; }
        @keyframes mspeak { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
        @keyframes mthink { 0%,100% { transform: rotate(0deg) } 50% { transform: rotate(-2.2deg) translateY(-2px) } }
        @keyframes mhappy { 0%,100% { transform: scale(1) } 50% { transform: scale(1.02) translateY(-3px) } }
        @keyframes mlisten { 0%,100% { transform: rotate(0) } 50% { transform: rotate(1.6deg) } }
        @keyframes midle { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-2px) } }
        .mentor-speak { animation: mspeak 2.6s ease-in-out infinite; }
        .mentor-think { animation: mthink 3.4s ease-in-out infinite; transform-origin: 50% 90%; }
        .mentor-happy { animation: mhappy 2s ease-in-out infinite; }
        .mentor-listen { animation: mlisten 3s ease-in-out infinite; transform-origin: 50% 90%; }
        .mentor-idle { animation: midle 4.4s ease-in-out infinite; }
      `}</style>
      <svg viewBox="0 0 300 336">
        <defs>
          <linearGradient id="hoodie" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2b2f45" />
            <stop offset="100%" stopColor="#171a2c" />
          </linearGradient>
          <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e8b58c" />
            <stop offset="100%" stopColor="#c98d63" />
          </linearGradient>
          <radialGradient id="faceLight" cx="38%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ffd9ae" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#ffb36b" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#4dd8ff" stopOpacity="0.10" />
          </radialGradient>
          <linearGradient id="hairG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2c2030" />
            <stop offset="100%" stopColor="#15101c" />
          </linearGradient>
        </defs>

        {/* soft back glow */}
        <ellipse cx="150" cy="150" rx="140" ry="150" fill="#4dd8ff" opacity="0.05" />
        <ellipse cx="120" cy="120" rx="110" ry="120" fill="#ff9d45" opacity="0.06" />

        {/* shoulders / hoodie */}
        <path d="M45 336 C50 250 95 220 150 220 C205 220 250 250 255 336 Z" fill="url(#hoodie)" />
        <path d="M45 336 C50 250 95 220 150 220 C205 220 250 250 255 336" fill="none" stroke="#4dd8ff" strokeOpacity="0.25" strokeWidth="2" />
        {/* hood behind neck */}
        <path d="M100 232 C105 200 195 200 200 232 C185 246 115 246 100 232 Z" fill="#10121f" />
        {/* glowing emblem */}
        <g filter="drop-shadow(0 0 8px rgba(77,216,255,0.9))">
          <path d="M150 268 L166 296 L134 296 Z" fill="none" stroke="#4dd8ff" strokeWidth="2.5" strokeLinejoin="round" />
        </g>
        {/* drawstrings */}
        <path d="M132 240 q-4 22 -2 34 M168 240 q4 22 2 34" stroke="#0e1019" strokeWidth="3.4" fill="none" strokeLinecap="round" />

        {/* neck */}
        <rect x="132" y="196" width="36" height="34" rx="14" fill="#b57a52" />

        {/* head */}
        <ellipse cx="150" cy="140" rx="58" ry="66" fill="url(#skin)" />
        <ellipse cx="150" cy="140" rx="58" ry="66" fill="url(#faceLight)" />

        {/* ears */}
        <ellipse cx="92" cy="146" rx="9" ry="13" fill="#c98d63" />
        <ellipse cx="208" cy="146" rx="9" ry="13" fill="#c98d63" />

        {/* curly hair — layered blob arcs */}
        <g fill="url(#hairG)">
          <path d="M88 128 C82 74 122 48 150 48 C182 48 220 76 212 130 C214 108 198 84 150 84 C106 84 88 106 88 128 Z" />
          <circle cx="104" cy="86" r="20" />
          <circle cx="130" cy="66" r="22" />
          <circle cx="162" cy="60" r="23" />
          <circle cx="192" cy="76" r="20" />
          <circle cx="206" cy="102" r="16" />
          <circle cx="94" cy="108" r="15" />
          <circle cx="150" cy="46" r="20" />
        </g>
        {/* hair highlight (lamp side) */}
        <path d="M118 62 C134 50 158 48 176 56" stroke="#ffb36b" strokeOpacity="0.5" strokeWidth="4" fill="none" strokeLinecap="round" />

        {/* brows */}
        <path d="M116 122 q14 -8 28 -2" stroke="#241a28" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M158 120 q14 -6 28 2" stroke="#241a28" strokeWidth="5" fill="none" strokeLinecap="round" />

        {/* eyes — warm, alive */}
        <g>
          <ellipse cx="130" cy="140" rx="10" ry="7.5" fill="#fff" opacity="0.95" />
          <ellipse cx="172" cy="140" rx="10" ry="7.5" fill="#fff" opacity="0.95" />
          <circle cx="131" cy="141" r="4.6" fill="#2c1a10" />
          <circle cx="171" cy="141" r="4.6" fill="#2c1a10" />
          <circle cx="129.4" cy="139.4" r="1.4" fill="#fff" />
          <circle cx="169.4" cy="139.4" r="1.4" fill="#fff" />
        </g>

        {/* nose + smile */}
        <path d="M150 148 q-3 10 2 14" stroke="#a96b44" strokeWidth="3" fill="none" strokeLinecap="round" />
        {mood === "happy" ? (
          <path d="M132 172 q18 16 38 0 q-18 8 -38 0 Z" fill="#7c3f2a" />
        ) : (
          <path d="M134 172 q16 10 32 0" stroke="#7c3f2a" strokeWidth="4" fill="none" strokeLinecap="round" />
        )}
        {/* blush warm */}
        <ellipse cx="116" cy="162" rx="10" ry="5" fill="#ff9d45" opacity="0.18" />
        <ellipse cx="186" cy="162" rx="10" ry="5" fill="#ff9d45" opacity="0.18" />

        {/* hand gesturing (speak/think) */}
        {(mood === "speak" || mood === "think") && (
          <g transform={mood === "think" ? "translate(196 250) rotate(-24)" : "translate(200 244) rotate(-10)"} opacity="0.98">
            <rect x="-14" y="-10" width="34" height="20" rx="10" fill="url(#skin)" transform="rotate(-30)" />
          </g>
        )}
      </svg>
    </div>
  );
}
