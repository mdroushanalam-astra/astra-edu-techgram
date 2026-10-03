/**
 * UNIVERSAL PRIMITIVES [Phase 0, corrected master roadmap §6.1].
 * The typed vocabulary of the cognitive layer. These are PRIMITIVES — not the
 * cognitive model. Every primitive carries provenance; observed claims require
 * a basis (the same no-upgrade law as cog()). Primitives are the words the
 * ownership map and the ExperiencePlan are written in.
 */

export interface Provenance {
  basis: string;
  source: string;
  timestamp: number;
  modelVersion?: string;
}

export interface CogObservation {
  id: string;
  what: string;
  channel: "answer" | "confidence" | "response-time" | "hint-use" | "behavior" | "self-report" | "system";
  at: number;
  provenance: Provenance;
}

export interface Evidence {
  id: string;
  about: string;
  /** positive weight supports, negative undermines */
  weight: number;
  provenance: Provenance;
}

export interface Belief {
  id: string;
  about: string;
  value: number;
  uncertainty: number;
  status: "observed" | "inferred" | "hypothesis";
  provenance: Provenance;
}

export interface Hypothesis {
  id: string;
  statement: string;
  status: "candidate" | "testing" | "supported" | "rejected";
  confidence: number;
  provenance: Provenance;
}

export interface Goal {
  id: string;
  statement: string;
  subgoals: string[];
  constraints: string[];
  horizon: string;
  provenance: Provenance;
}

export interface Value {
  id: string;
  name: string;
  weight: number;
  provenance: Provenance;
}

export interface Constraint {
  id: string;
  kind: "time" | "energy" | "content" | "policy" | "safety";
  description: string;
  limit?: string;
  provenance: Provenance;
}

export interface Action {
  id: string;
  kind: string;
  target: string;
  params: Record<string, unknown>;
  provenance: Provenance;
}

export interface Outcome {
  id: string;
  forAction: string;
  value: number;
  at: number;
  provenance: Provenance;
}

export interface Decision {
  id: string;
  chosen: string;
  alternatives: string[];
  rationale: string;
  predictionRef?: string;
  provenance: Provenance;
}

export interface StateTransition {
  id: string;
  from: string;
  to: string;
  via: string;
  at: number;
  provenance: Provenance;
}

export class PrimitiveError extends Error {}

/** Observed primitives demand a basis — the no-upgrade law at the primitive layer. */
export function requireBasis(what: string, p: Provenance): void {
  if (!p.basis || !p.basis.trim()) throw new PrimitiveError(`${what}: observed claims require a basis`);
}
