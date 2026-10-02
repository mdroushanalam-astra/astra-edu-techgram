/**
 * S1 — STUDENT ARTIFACT [ADR-027/028].
 * Remembers STUDENT-PRODUCED cognition (notes, answers, explanations),
 * not just system history. Powers the THEN/NOW conceptual-change moment
 * ("your model wasn't stupid — it became more complete") and the reasoning
 * lineage (claim → reason → confidence → correction → later reasoning).
 */

import type { BeliefModel, BeliefState } from "./belief.js";
import { reportConcept } from "./belief.js";

export type ArtifactType = "note" | "answer" | "explanation" | "diagram" | "question";

export interface StudentArtifact {
  id: string;
  type: ArtifactType;
  content: string;
  conceptIds: string[];
  day: number;
  provenance: string;
  /** Optional structured claims the student made — powers reasoning lineage. */
  claims?: { claim: string; confidence?: number }[];
}

/** Earliest artifact for a concept (the THEN in THEN/NOW). */
export function earliestArtifactFor(artifacts: StudentArtifact[], conceptId: string): StudentArtifact | undefined {
  return artifacts
    .filter((a) => a.conceptIds.includes(conceptId))
    .sort((a, b) => a.day - b.day)[0];
}

/**
 * THEN/NOW: the student's earliest recorded thinking on a concept next to
 * the current belief. The output is template-ready and evidence-backed.
 */
export function artifactThenNow(
  model: BeliefModel,
  st: BeliefState,
  artifacts: StudentArtifact[],
  conceptId: string,
): { then: { content: string; day: number } | null; now: { mean: number; lo: number; hi: number } ; daysBetween: number | null } | null {
  const a = earliestArtifactFor(artifacts, conceptId);
  if (!a) return null;
  const r = reportConcept(model, st, conceptId);
  return {
    then: { content: a.content, day: a.day },
    now: { mean: r.mean, lo: r.lo, hi: r.hi },
    daysBetween: r.lastObservedDay >= 0 ? r.lastObservedDay - a.day : null,
  };
}

/**
 * Teach-it-back evaluation — deterministic heuristic v0, honestly labelled:
 * term coverage against the concept's key terms + length sanity. This is a
 * SENSOR, not a grade; confidence is capped upstream.
 */
export function evaluateTeachBack(
  explanation: string,
  keyTerms: string[],
  opts: { minWords?: number } = {},
): { termCoverage: number; missingTerms: string[]; lengthOk: boolean; verdict: string } {
  const text = explanation.toLowerCase();
  const hit = keyTerms.filter((t) => text.includes(t.toLowerCase()));
  const missing = keyTerms.filter((t) => !text.toLowerCase().includes(t.toLowerCase()));
  const coverage = keyTerms.length ? hit.length / keyTerms.length : 0;
  const words = explanation.trim().split(/\s+/).length;
  const lengthOk = words >= (opts.minWords ?? 15);
  const verdict = coverage >= 0.75 && lengthOk
    ? "strong explanation — the distinction is yours now"
    : coverage >= 0.4
      ? `close — one distinction is missing: ${missing.slice(0, 2).join(", ")}`
      : "the core got lost — let's rebuild it with the worked example";
  return { termCoverage: coverage, missingTerms: missing, lengthOk, verdict };
}
