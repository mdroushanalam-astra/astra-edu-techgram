/**
 * THE BLACKBOARD [ADR-032] — a cognitive instrument, not decoration.
 * Kernel chooses WHAT (every element carries a kernel ref); this renderer
 * decides HOW: draw-on strokes, reveal-missing-link, focus glow.
 * Hand-rolled canvas — no chart libraries.
 */

export interface BoardEl {
  id: string;
  kind: "concept" | "arrow" | "causal_chain" | "band" | "histogram" | "equation" | "annotation" | "highlight" | "question_marker";
  ref?: { kind: string; id: string };
  label?: string;
  /** causal chain nodes (top→bottom); weakLinks = indices with kernel refs */
  nodes?: { label: string; id?: string; weak?: boolean }[];
  /** band: [lo, hi], mean */
  band?: { lo: number; hi: number; mean: number; grey?: boolean };
  /** histogram: marks 0..1 */
  marks?: number[];
  /** text line (equation/annotation) */
  text?: string;
  born: number;   // appearance timestamp (ms) — drives draw-on
}

export interface BoardScene {
  elements: BoardEl[];
  focus?: string;        // "notice what happens here"
  animating: string[];   // ids currently animating
}

const NODE_W = 168, NODE_H = 40, GAP_Y = 26;

export class BoardRenderer {
  private ctx: CanvasRenderingContext2D | null = null;
  private scene: BoardScene = { elements: [], animating: [] };
  private raf = 0;

  attach(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d");
    const step = (t: number) => { this.render(t); this.raf = requestAnimationFrame(step); };
    this.raf = requestAnimationFrame(step);
  }
  detach() { cancelAnimationFrame(this.raf); }
  set(s: BoardScene) { this.scene = s; }

  private progress(born: number, t: number): number {
    const dt = t - born;
    if (dt <= 0) return 0;
    return Math.min(1, dt / 850);
  }

  render(t: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const canvas = ctx.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // slate
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(16,24,48,0.92)");
    g.addColorStop(1, "rgba(12,17,36,0.96)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(42,53,85,0.55)";
    ctx.strokeRect(10.5, 10.5, W - 21, H - 21);

    let y = 40;
    for (const el of this.scene.elements) {
      const pr = this.progress(el.born, t);
      if (pr <= 0) continue;
      ctx.save();
      ctx.globalAlpha = Math.min(1, pr * 1.4);
      const isFocus = this.scene.focus === el.id;
      switch (el.kind) {
        case "causal_chain": this.chain(ctx, el, W, y, pr, t, isFocus); y += (el.nodes?.length ?? 0) * (NODE_H + GAP_Y) + 26; break;
        case "band": this.band(ctx, el, W, y, pr); y += 58; break;
        case "histogram": this.histogram(ctx, el, W, y, pr); y += 130; break;
        case "equation":
        case "annotation":
        case "question_marker":
          this.text(ctx, el, W, y, isFocus); y += 44; break;
        case "concept":
        case "highlight":
        default:
          this.text(ctx, el, W, y, isFocus); y += 44; break;
      }
      ctx.restore();
    }
  }

  private chain(ctx: CanvasRenderingContext2D, el: BoardEl, W: number, y0: number, pr: number, t: number, focus: boolean) {
    const nodes = el.nodes ?? [];
    const cx = W / 2;
    nodes.forEach((n, i) => {
      const nodePr = Math.max(0, Math.min(1, pr * nodes.length - i));
      if (nodePr <= 0) return;
      const y = y0 + i * (NODE_H + GAP_Y);
      const isWeak = n.weak;
      const pulse = isWeak ? 0.5 + 0.5 * Math.sin(t / 300) : 1;
      ctx.strokeStyle = isWeak ? `rgba(157,123,255,${0.85 * pulse})` : "rgba(79,216,200,0.75)";
      ctx.fillStyle = isWeak ? `rgba(157,123,255,${0.10 + 0.08 * pulse})` : "rgba(79,216,200,0.08)";
      ctx.lineWidth = isWeak ? 2 : 1.4;
      roundRect(ctx, cx - NODE_W / 2, y, NODE_W, NODE_H, 10);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = isWeak ? "#c9b2ff" : "#d7f5ef";
      ctx.font = "500 14px Inter, system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(n.label, cx, y + NODE_H / 2, NODE_W - 14);
      if (i < nodes.length - 1) {
        // arrow with draw-on
        const ay = y + NODE_H + 4;
        const ah = GAP_Y - 8;
        const draw = Math.max(0, Math.min(1, pr * nodes.length - i - 0.5)) * 2;
        if (draw > 0) {
          ctx.strokeStyle = "rgba(139,160,210,0.8)";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(cx, ay);
          ctx.lineTo(cx, ay + ah * Math.min(1, draw));
          ctx.stroke();
          if (draw >= 1) {
            ctx.beginPath();
            ctx.moveTo(cx - 4.5, ay + ah - 5);
            ctx.lineTo(cx, ay + ah);
            ctx.lineTo(cx + 4.5, ay + ah - 5);
            ctx.stroke();
          }
        }
      }
    });
    if (focus) {
      ctx.strokeStyle = `rgba(245,176,74,${0.35 + 0.2 * Math.sin(t / 260)})`;
      ctx.lineWidth = 1.6;
      roundRect(ctx, cx - NODE_W / 2 - 7, y0 - 7, NODE_W + 14, nodes.length * (NODE_H + GAP_Y) - GAP_Y + 14, 14);
      ctx.stroke();
    }
  }

  private band(ctx: CanvasRenderingContext2D, el: BoardEl, W: number, y: number, pr: number) {
    const b = el.band!;
    const x0 = W * 0.14, x1 = W * 0.86, h = 10;
    ctx.fillStyle = "rgba(42,53,85,0.6)";
    roundRect(ctx, x0, y, x1 - x0, h, 5); ctx.fill();
    const lo = x0 + b.lo * (x1 - x0), hi = x0 + b.hi * (x1 - x0), mean = x0 + b.mean * (x1 - x0);
    if (b.grey) {
      ctx.fillStyle = "rgba(157,123,255,0.30)";
      for (let x = lo; x < Math.max(hi, lo + 4); x += 7) ctx.fillRect(x, y, 3.5, h);
    } else {
      ctx.fillStyle = "rgba(79,216,200,0.55)";
      roundRect(ctx, lo, y, Math.max(4, (hi - lo) * pr), h, 5); ctx.fill();
    }
    ctx.fillStyle = "#f5b04a";
    ctx.beginPath(); ctx.arc(lo + (mean - lo) * pr, y + h / 2, 4.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#a8b2d0";
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.textAlign = "left"; ctx.textBaseline = "bottom";
    ctx.fillText(el.label ?? "", x0, y - 7);
  }

  private histogram(ctx: CanvasRenderingContext2D, el: BoardEl, W: number, y: number, pr: number) {
    const marks = el.marks ?? [];
    if (!marks.length) return;
    const x0 = W * 0.14, x1 = W * 0.86, h = 92;
    const bins = 24, counts = new Array(bins).fill(0);
    for (const m of marks) counts[Math.min(bins - 1, Math.floor(m * bins))] = (counts[Math.min(bins - 1, Math.floor(m * bins))] ?? 0) + 1;
    const max = Math.max(...counts, 1);
    const bw = (x1 - x0) / bins;
    ctx.strokeStyle = "rgba(139,160,210,0.35)";
    ctx.beginPath(); ctx.moveTo(x0, y + h + 6); ctx.lineTo(x1, y + h + 6); ctx.stroke();
    counts.forEach((c, i) => {
      const bh = (c / max) * h * pr;
      ctx.fillStyle = `rgba(79,216,200,${0.28 + 0.4 * (c / max)})`;
      ctx.fillRect(x0 + i * bw + 1.5, y + h - bh, bw - 3, bh);
    });
    ctx.fillStyle = "#f5b04a";
    const mean = marks.reduce((a, b) => a + b, 0) / marks.length;
    ctx.fillRect(x0 + mean * (x1 - x0) - 1, y, 2, h + 6);
    ctx.fillStyle = "#6b7699";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText(el.label ?? "exam-day marks", x0, y - 7);
  }

  private text(ctx: CanvasRenderingContext2D, el: BoardEl, W: number, y: number, focus: boolean) {
    ctx.fillStyle = focus ? "#f5b04a" : el.kind === "question_marker" ? "#9d7bff" : "#d7f5ef";
    ctx.font = el.kind === "equation" ? "15px 'JetBrains Mono', monospace" : "15px Inter, system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(el.text ?? el.label ?? "", W / 2, y + 16, W * 0.86);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
