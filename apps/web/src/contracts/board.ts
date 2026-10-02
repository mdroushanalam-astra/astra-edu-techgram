/**
 * SPRINT 0 — BLACKBOARD DSL [ADR-032, ChatGPT refinement adopted]
 * The board is a first-class rendering surface and a cognitive instrument,
 * not a decorative canvas. THE KERNEL CHOOSES WHAT IS DRAWN (every element
 * carries a kernel ref); the renderer decides HOW it appears (draw-on,
 * highlight, reveal). Primitives are the board's vocabulary.
 */

export type BoardElement =
  | { kind: "concept"; id: string; ref: { kind: "concept"; id: string }; label: string }
  | { kind: "arrow"; id: string; from: string; to: string; label?: string }
  | { kind: "graph"; id: string; ref: { kind: "receipt" | "band" | "memory"; id: string }; series: "monte_carlo" | "mastery_band" | "forgetting_curve" | "custom" }
  | { kind: "timeline"; id: string; ref?: { kind: string; id: string }; marks: { at: string; label: string }[] }
  | { kind: "equation"; id: string; ref: { kind: "atom"; id: string }; latex: string }
  | { kind: "table"; id: string; ref?: { kind: string; id: string }; head: string[]; rows: string[][] }
  | { kind: "comparison"; id: string; ref: { kind: "atom" | "concept"; id: string }; left: string; right: string } // CONTRAST move
  | { kind: "causal_chain"; id: string; ref: { kind: "concept"; id: string }; nodes: string[]; /** Misconception-tagged links render as vulnerable gaps. */ weakLinks?: { index: number; ref: { kind: "band" | "atom"; id: string } }[] }
  | { kind: "diagram"; id: string; ref: { kind: "atom"; id: string }; shape: string }
  | { kind: "annotation"; id: string; ref: { kind: "event" | "band"; id: string }; text: string }  // student's own ink = endowment
  | { kind: "highlight"; id: string; target: string }
  | { kind: "question_marker"; id: string; ref: { kind: "receipt"; id: string }; label: string };

/** Draw style — the renderer's, not the kernel's. Kernel chose the WHAT. */
export type BoardAnimation = "draw_on" | "highlight" | "reveal_missing_link" | "resolve" | "fade";
