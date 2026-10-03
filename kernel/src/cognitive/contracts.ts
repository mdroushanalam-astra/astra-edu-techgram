/**
 * THE COGNITIVE CORE — universal contracts [ADR-034, Tier A].
 *
 * NOT a new brain. The frozen kernel keeps every decision. This module is the
 * UNIVERSAL VOCABULARY + the assembly views that let the existing organs
 * (belief, memory, AOM, CAT, planner, behaviour, teacher) present themselves
 * as a general cognitive system — so a second domain pack can arrive without
 * rearchitecting.
 *
 * LAWS:
 *  - Contracts only. No new decision logic lives here.
 *  - Every cognitive object carries provenance (kind + basis + confidence).
 *  - observed fact ≠ inference ≠ hypothesis — the type system enforces it.
 *  - Reflection produces HYPOTHESES, never truths.
 *  - Assembly is pure: workspace/self-model are VIEWS over kernel state,
 *    rebuilt per decision moment, never stored as truth.
 */

/* ── the universal object model ─────────────────────────────────────────── */

export type CogKind =
  | "goal" | "belief" | "evidence" | "prediction" | "action" | "outcome"
  | "memory" | "hypothesis" | "constraint" | "preference" | "risk"
  | "question" | "explanation" | "reflection" | "observation";

/** Epistemic status — the type system's no-upgrade law. */
export type EpistemicStatus = "observed" | "inferred" | "hypothesis";

export interface CogObject<K extends CogKind = CogKind> {
  kind: K;
  id: string;
  /** observed = direct evidence; inferred = derived; hypothesis = guess awaiting test. */
  status: EpistemicStatus;
  basis: string;
  confidence: number;
  /** Domain that produced it ("education", "career", …). */
  domain: string;
  createdAt: number;
  payload: Record<string, unknown>;
}

export const cog = <K extends CogKind>(
  kind: K, id: string, status: EpistemicStatus, basis: string,
  confidence: number, domain: string, payload: Record<string, unknown> = {},
): CogObject<K> => {
  if (confidence < 0 || confidence > 1) throw new Error(`cognitive object ${id}: confidence out of range`);
  if (status === "observed" && !basis) throw new Error(`cognitive object ${id}: observed claims require a basis`);
  return { kind, id, status, basis, confidence, domain, createdAt: Date.now(), payload };
};

/* ── the cognitive workspace: what matters RIGHT NOW ─────────────────────── */

export interface CognitiveWorkspace {
  builtAt: number;
  goal: { id: string; statement: string; horizon: string } | null;
  /** The concepts/entities in focus this moment. */
  focus: { id: string; name: string; mean: number; grey: boolean }[];
  /** Grey concepts = known unknowns (the honest list). */
  uncertainties: { id: string; name: string; nEff: number }[];
  /** Active hypotheses awaiting evidence (misconception candidates, preference guesses). */
  hypotheses: { id: string; statement: string; confidence: number }[];
  /** Candidate actions the planner is weighing. */
  candidateActions: { id: string; action: string; target: string; gainPerMinute: number }[];
  /** The chosen plan, as assembled. */
  plan: { blocks: { action: string; concept: string; minutes: number; why: string }[]; foregone: string | null };
  /** What the workspace explicitly does NOT contain (humility as data). */
  notContained: string[];
}

/* ── prediction: the universal record ───────────────────────────────────── */

export type PredictionTarget =
  | "state" | "event" | "action-outcome" | "interaction"
  | "memory" | "risk" | "plan" | "relationship";

export interface PredictionRecord {
  id: string;
  target: PredictionTarget;
  prediction: string;
  /** Point estimate or distribution summary — always with uncertainty. */
  value: number;
  uncertainty: number;
  horizon: string;
  basis: string;
  modelVersion: string;
  /** Filled when reality arrives. */
  outcome?: number;
  predictionError?: number;
  calibratedAt?: number;
}

/** Close the loop: an observed outcome calibrates its prediction. */
export function calibrate(p: PredictionRecord, outcome: number): PredictionRecord {
  return { ...p, outcome, predictionError: outcome - p.value, calibratedAt: Date.now() };
}

/* ── causal edges: why, not just what ────────────────────────────────────── */

export interface CausalEdge {
  cause: string;
  effect: string;
  /** increases | decreases | conditional */
  relation: "increases" | "decreases" | "conditional";
  condition?: string;
  evidence: string;
  confidence: number;
}

export function counterfactual(edges: CausalEdge[], cause: string, removed: boolean): string {
  const relevant = edges.filter((e) => e.cause === cause);
  if (!relevant.length) return `no causal model for "${cause}" — say so honestly`;
  return relevant.map((e) =>
    `${removed ? "without" : "with"} ${cause}: ${e.effect} would be ${e.relation}${e.condition ? ` (when ${e.condition})` : ""} — evidence: ${e.evidence}`,
  ).join("; ");
}

/* ── the self-model: machine humility as state ──────────────────────────── */

export interface SelfModel {
  knows: string[];
  knownUnknowns: string[];
  recentPredictionErrors: { id: string; target: PredictionTarget; error: number }[];
  /** Where the system is systematically wrong (persistent signed bias). */
  systematicBiases: { area: string; bias: number; n: number }[];
  modelLimitations: string[];
  /** Which organs the system can currently speak for, with evidence counts. */
  reliableFor: { organ: string; evidenceCount: number }[];
}

/* ── explanation strategies (the engine's vocabulary) ───────────────────── */

export type ExplanationStrategy =
  | "direct" | "analogy" | "example" | "counterexample" | "visual"
  | "story" | "proof" | "derivation" | "simulation" | "comparison" | "socratic";

export interface ExplanationPlan {
  strategy: ExplanationStrategy;
  reason: string;
  priorFailures: number;
}

/* ── domain adapter boundary: education is pack #1 ──────────────────────── */

export interface DomainAdapter {
  domain: string;
  /** The pack translates universal objects into domain action. */
  planFrom(goal: CogObject<"goal">, workspace: CognitiveWorkspace): { action: string; why: string };
}
