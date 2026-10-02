/**
 * ASTRA — the holographic companion [ADR-032].
 * A procedurally-drawn 2.5D being: layered parallax canvas, glow core,
 * scanlines, particle drift. She never invents emotion — every parameter
 * comes from the SessionScene (kernel truth). Personality = reflection.
 *
 * Design notes:
 *  - head-and-shoulders bust (video-call framing), teal-cyan glass body,
 *    one warm amber rim-light (the friend), violet only in curiosity states
 *  - life: breathing sine, randomized blinks, micro head-drift, gaze target
 *  - visemes: closed / small-o / wide / open — driven by TTS word boundaries
 *  - reduced motion: particles + drift disabled
 */

export interface AstraParams {
  expression: "neutral" | "attentive" | "thoughtful" | "warm" | "small-genuine-excitement" | "concerned-lean-in" | "playful" | "calm";
  presence: string;
  gaze: "student" | "board" | "away";
  /** 0..1 mouth openness from word-boundary events. */
  viseme: number;
  energy: "low" | "medium" | "high";
  reducedMotion: boolean;
}

interface FaceState {
  browRaise: number; browAngle: number; eyeOpen: number;
  mouthSmile: number; lean: number; tilt: number; glow: number;
}

const EXPR: Record<AstraParams["expression"], FaceState> = {
  neutral:                  { browRaise: 0,    browAngle: 0,    eyeOpen: 1,    mouthSmile: 0.15, lean: 0,   tilt: 0,     glow: 0.75 },
  attentive:                { browRaise: 0.5,  browAngle: -0.1, eyeOpen: 1.15, mouthSmile: 0.05, lean: 0.4, tilt: 0.03,  glow: 0.9 },
  thoughtful:               { browRaise: -0.2, browAngle: 0.15, eyeOpen: 0.8,  mouthSmile: 0.1,  lean: 0,   tilt: -0.05, glow: 0.7 },
  warm:                     { browRaise: 0.3,  browAngle: -0.05,eyeOpen: 0.9,  mouthSmile: 0.7,  lean: 0.2, tilt: 0.02,  glow: 1 },
  "small-genuine-excitement":{ browRaise: 0.7, browAngle: -0.2, eyeOpen: 1.2,  mouthSmile: 0.9,  lean: -0.2,tilt: 0,     glow: 1 },
  "concerned-lean-in":      { browRaise: 0.6,  browAngle: 0.25, eyeOpen: 1.05, mouthSmile: -0.1, lean: 0.9, tilt: 0.08,  glow: 0.85 },
  playful:                  { browRaise: 0.4,  browAngle: -0.3, eyeOpen: 0.95, mouthSmile: 0.5,  lean: 0,   tilt: -0.08, glow: 0.95 },
  calm:                     { browRaise: -0.3, browAngle: 0,    eyeOpen: 0.7,  mouthSmile: 0.25, lean: -0.3,tilt: 0,     glow: 0.6 },
};

export class AstraRenderer {
  private ctx: CanvasRenderingContext2D | null = null;
  private params: AstraParams = { expression: "neutral", presence: "idle", gaze: "student", viseme: 0, energy: "medium", reducedMotion: false };
  private blinkUntil = 0;
  private nextBlink = 0;
  private raf = 0;
  private particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];
  private t0 = performance.now();

  attach(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d");
    this.loop = this.loop.bind(this);
    const step = (t: number) => { this.loop(t); this.raf = requestAnimationFrame(step); };
    this.raf = requestAnimationFrame(step);
  }
  detach() { cancelAnimationFrame(this.raf); }
  set(p: Partial<AstraParams>) { this.params = { ...this.params, ...p }; }

  private loop(t: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const canvas = ctx.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const time = (t - this.t0) / 1000;
    const p = this.params;
    const f = EXPR[p.expression] ?? EXPR.neutral!;
    const amp = p.energy === "low" ? 0.5 : p.energy === "high" ? 1.35 : 1;

    // blink scheduler
    if (t > this.nextBlink) { this.blinkUntil = t + 130; this.nextBlink = t + 2600 + Math.random() * 3200; }
    const blinking = t < this.blinkUntil;

    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H * 0.56;
    const breath = p.reducedMotion ? 0 : Math.sin(time * 0.9) * 2.2 * amp;
    const drift = p.reducedMotion ? { x: 0, y: 0 } : { x: Math.sin(time * 0.31) * 3 * amp, y: Math.cos(time * 0.23) * 2 * amp };
    const leanX = f.lean * 14;
    const tilt = f.tilt;

    // ---- layer 1: aura (deep back) ----
    const auraR = Math.min(W, H) * 0.42;
    const aura = ctx.createRadialGradient(cx + drift.x, cy + drift.y, auraR * 0.1, cx, cy, auraR);
    aura.addColorStop(0, `rgba(79,216,200,${0.10 * f.glow})`);
    aura.addColorStop(0.6, `rgba(79,216,200,${0.035 * f.glow})`);
    aura.addColorStop(1, "rgba(79,216,200,0)");
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, W, H);

    // ---- layer 2: particles (mid) ----
    if (!p.reducedMotion) {
      while (this.particles.length < 26) {
        this.particles.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.15, vy: -0.08 - Math.random() * 0.18, r: 0.8 + Math.random() * 1.6, a: 0.05 + Math.random() * 0.16 });
      }
      ctx.save();
      for (const pt of this.particles) {
        pt.x += pt.vx; pt.y += pt.vy;
        if (pt.y < -6) { pt.y = H + 6; pt.x = Math.random() * W; }
        ctx.fillStyle = `rgba(157,123,255,${pt.a})`;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // ---- layer 3: the being ----
    ctx.save();
    ctx.translate(cx + drift.x + leanX, cy + drift.y + breath);
    ctx.rotate(tilt);
    ctx.globalCompositeOperation = "lighter";
    const S = Math.min(W, H) / 340; // scale unit

    // shoulders / torso — translucent glass
    const torsoGrad = ctx.createLinearGradient(0, 40 * S, 0, 170 * S);
    torsoGrad.addColorStop(0, `rgba(79,216,200,${0.30 * f.glow})`);
    torsoGrad.addColorStop(1, `rgba(79,216,200,${0.05 * f.glow})`);
    ctx.fillStyle = torsoGrad;
    ctx.strokeStyle = `rgba(79,216,200,${0.55 * f.glow})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-96 * S, 165 * S);
    ctx.bezierCurveTo(-92 * S, 96 * S, -52 * S, 62 * S, 0, 60 * S);
    ctx.bezierCurveTo(52 * S, 62 * S, 92 * S, 96 * S, 96 * S, 165 * S);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // collar light
    ctx.strokeStyle = `rgba(245,176,74,${0.5 * f.glow})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-34 * S, 78 * S);
    ctx.quadraticCurveTo(0, 96 * S, 34 * S, 78 * S);
    ctx.stroke();

    // neck
    ctx.strokeStyle = `rgba(79,216,200,${0.4 * f.glow})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-13 * S, 66 * S); ctx.lineTo(-13 * S, 34 * S);
    ctx.moveTo(13 * S, 66 * S); ctx.lineTo(13 * S, 34 * S);
    ctx.stroke();

    // head — an elongated glass oval
    const headGrad = ctx.createRadialGradient(-18 * S, -34 * S, 6 * S, 0, 0, 78 * S);
    headGrad.addColorStop(0, `rgba(180,255,244,${0.34 * f.glow})`);
    headGrad.addColorStop(1, `rgba(79,216,200,${0.10 * f.glow})`);
    ctx.fillStyle = headGrad;
    ctx.strokeStyle = `rgba(140,240,225,${0.7 * f.glow})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, -6 * S, 52 * S, 66 * S, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // hair — three flowing glow arcs
    ctx.strokeStyle = `rgba(157,123,255,${0.55 * f.glow})`;
    ctx.lineWidth = 2.4;
    for (const [x0, c1x, c1y, ex] of [[-50, -70, -60, -20], [0, -14, -110, 30], [48, 66, -66, 18]] as const) {
      ctx.beginPath();
      ctx.moveTo(x0 * S, -52 * S);
      ctx.quadraticCurveTo(c1x * S, c1y * S, ex * S, -18 * S);
      ctx.stroke();
    }

    // face — eyes, brows, mouth (no nose: clean, uncanny-free)
    const gazeX = p.gaze === "board" ? 5 : p.gaze === "away" ? -6 : 0;
    const gazeY = p.gaze === "board" ? 3 : 0;
    const eyeY = -14 * S;
    const eyeDX = 20 * S;
    const open = blinking ? 0.06 : f.eyeOpen;
    for (const side of [-1, 1]) {
      const ex = side * eyeDX + gazeX * S * 0.6;
      // sclera glow
      ctx.fillStyle = `rgba(200,250,242,${0.85 * f.glow})`;
      ctx.beginPath();
      ctx.ellipse(ex, eyeY + gazeY * S, 9.5 * S, 5.2 * S * open, 0, 0, Math.PI * 2);
      ctx.fill();
      // pupil
      ctx.fillStyle = "rgba(8,20,38,0.9)";
      ctx.beginPath();
      ctx.ellipse(ex + gazeX * S * 0.5, eyeY + gazeY * S, 2.6 * S, 3.1 * S * Math.max(open, 0.12), 0, 0, Math.PI * 2);
      ctx.fill();
      // brow
      const bx = ex, by = eyeY - 13 * S - f.browRaise * 6 * S;
      ctx.strokeStyle = `rgba(157,123,255,${0.8 * f.glow})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(bx - 9 * S, by + f.browAngle * 8 * S * side);
      ctx.quadraticCurveTo(bx, by - 3 * S, bx + 9 * S, by - f.browAngle * 8 * S * side);
      ctx.stroke();
    }

    // mouth — viseme shapes
    const my = 16 * S;
    const open_ = Math.max(p.viseme, 0);
    const smile = f.mouthSmile;
    ctx.strokeStyle = `rgba(245,176,74,${0.85 * f.glow})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    if (open_ > 0.14) {
      const w = (5 + open_ * 6) * S, h = (2 + open_ * 9) * S;
      ctx.ellipse(gazeX * S * 0.4, my, w, h, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,176,74,${0.16 * f.glow})`;
      ctx.fill();
    } else {
      ctx.moveTo(-12 * S, my - smile * 2.5 * S);
      ctx.quadraticCurveTo(0, my + smile * 5 * S, 12 * S, my - smile * 2.5 * S);
    }
    ctx.stroke();

    // warm rim-light (the friend is on your side)
    ctx.strokeStyle = `rgba(245,176,74,${0.28 * f.glow})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -6 * S, 52 * S, 66 * S, 0, -Math.PI * 0.62, -Math.PI * 0.1);
    ctx.stroke();

    ctx.restore();

    // ---- layer 4: scanlines + vignette (hologram truth) ----
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = "#9dd8ff";
    for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
    ctx.restore();
    const vig = ctx.createRadialGradient(cx, H * 0.5, Math.min(W, H) * 0.3, cx, H * 0.5, Math.max(W, H) * 0.75);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(4,8,18,0.55)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // presence decay — "the system must be able to shut up"
    if (p.presence === "absent") {
      ctx.fillStyle = "rgba(11,16,32,0.82)";
      ctx.fillRect(0, 0, W, H);
    }
  }
}
