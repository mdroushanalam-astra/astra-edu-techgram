/**
 * A4 — ENGAGEMENT EXPERIMENT FRAMEWORK [ADR-025].
 *
 * "What makes students return" becomes a measured answer, not a guess:
 * every retention mechanism runs as an experiment with deterministic
 * assignment, logged propensity, and a measured outcome (next-day return).
 *
 * THE ETHICS WALL [ADR-023]: only mechanisms from the curated respectful
 * registry may be assigned. The registry is code-review-gated; anything
 * outside it (urgency, guilt, variable-reward extraction, emotional
 * targeting) is structurally unassignable.
 */

import { makeRng } from "./linalg.js";

/** Curated respectful engagement mechanisms — additions require an ADR. */
export const ENGAGEMENT_MECHANISM_REGISTRY = {
  nudge_timing_window: "nudge sent in the student's measured start window vs fixed morning",
  session_length_default: "measured optimal session length vs 40-min default",
  plan_size_style: "plan framed as minutes-to-goal vs topic-list",
  welcome_back_tone: "neutral vs warm welcome-back template after a gap",
} as const;

export type EngagementMechanismId = keyof typeof ENGAGEMENT_MECHANISM_REGISTRY;

export interface EngagementExperimentDef {
  id: string;
  mechanism: EngagementMechanismId;
  variants: [string, string]; // A/B for v0
  salt: string;
}

export interface Assignment {
  experimentId: string;
  variant: "A" | "B";
  /** Probability the assignment procedure gave this variant (1/2 uniform). Logged. */
  propensity: number;
}

/**
 * Deterministic assignment from (studentId, experiment). Same student, same
 * experiment → same variant, forever. Uniform propensity is logged so
 * off-policy evaluation stays possible.
 */
export function assign(studentId: string, def: EngagementExperimentDef): Assignment {
  let h = 0x811c9dc5;
  const key = `${def.salt}:${def.id}:${studentId}`;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const variant = (h >>> 0) % 2 === 0 ? "A" : "B";
  return { experimentId: def.id, variant, propensity: 0.5 };
}

export interface ExperimentOutcomeRecord {
  experimentId: string;
  variant: "A" | "B";
  studentId: string;
  /** Measured outcome: did the student return the next day? */
  returnedNextDay: boolean;
}

export interface ExperimentResult {
  experimentId: string;
  byVariant: { variant: "A" | "B"; n: number; returnRate: number }[];
  /** Posterior-style note — never a causal claim until randomisation is verified. */
  note: string;
}

/**
 * Pool outcomes per variant. Honest smallness: with no minimum-n guard we
 * report rates and say they are underpowered — never "winner" claims.
 */
export function evaluateExperiment(records: ExperimentOutcomeRecord[]): ExperimentResult {
  const byVariant: ExperimentResult["byVariant"] = [];
  for (const v of ["A", "B"] as const) {
    const rs = records.filter((r) => r.variant === v);
    byVariant.push({
      variant: v,
      n: rs.length,
      returnRate: rs.length ? rs.filter((r) => r.returnedNextDay).length / rs.length : 0,
    });
  }
  const powered = byVariant.every((v) => v.n >= 30);
  return {
    experimentId: records[0]?.experimentId ?? "none",
    byVariant,
    note: powered
      ? "n ≥ 30 per variant — compare rates with intervals before acting"
      : "underpowered — treat as directional signal only; no winner claims",
  };
}

/** Deterministic per-student experiment set for the pilot (one per mechanism). */
export function pilotExperimentSuite(studentId: string): Assignment[] {
  const defs: EngagementExperimentDef[] = [
    { id: "nudge_timing_v1", mechanism: "nudge_timing_window", variants: ["A_measured_window", "B_fixed_morning"], salt: "techgram-pilot-1" },
    { id: "session_len_v1", mechanism: "session_length_default", variants: ["A_measured", "B_40min"], salt: "techgram-pilot-2" },
  ];
  const rng = makeRng(0); // placeholder to keep import tree honest; assignment is hash-based
  void rng;
  return defs.map((d) => assign(studentId, d));
}
