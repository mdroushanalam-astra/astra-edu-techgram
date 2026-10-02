/**
 * B3 — Memory Engine: FSRS-lite with priors.
 * Per concept: stability S (days), difficulty D (1..10), last review, reps, lapses.
 * Retrievability R(t) = (1 + t/(9S))^-1.
 * [SUPERSEDES] SM-2 as the runtime memory model (SM-2 stays in the Python lab
 * as a baseline comparator only).
 */

import type { ConceptType } from "./content.js";

export interface MemoryCell {
  /** Stability in days. */
  S: number;
  /** Difficulty 1 (easy) .. 10 (hard). */
  D: number;
  /** Day of last review (absolute logical day), or null if never reviewed. */
  lastReviewDay: number | null;
  reps: number;
  lapses: number;
}

export interface MemoryParams {
  /** Initial stability by concept type (days) — assumed priors. */
  initialStability: Record<ConceptType, number>;
  /** Cap on stability growth per successful review. */
  growthCap: number;
  /** Target retrievability for "due" classification. */
  dueThreshold: number;
}

export const DEFAULT_MEMORY_PARAMS: MemoryParams = {
  initialStability: { factual: 3, conceptual: 8, applied: 12 },
  growthCap: 3.0,
  dueThreshold: 0.85,
};

export function newMemoryCell(type: ConceptType, p: MemoryParams): MemoryCell {
  return { S: p.initialStability[type], D: 5, lastReviewDay: null, reps: 0, lapses: 0 };
}

/** Retrievability now given last review at day t0 with stability S. */
export function retrievability(cell: MemoryCell, nowDay: number): number {
  if (cell.lastReviewDay === null) return 0;
  const t = Math.max(0, nowDay - cell.lastReviewDay);
  return 1 / Math.pow(1 + t / (9 * cell.S), 1); // FSRS-like form
}

/** Effective stability used by the belief engine's time update. */
export function stabilityOf(cell: MemoryCell | undefined, type: ConceptType, p: MemoryParams): number {
  return cell ? cell.S : p.initialStability[type];
}

/**
 * Apply a review outcome. `correct` = recall success at the review moment.
 * Mutates the given cell (callers own copy-on-write) and returns it.
 */
export function applyReview(cell: MemoryCell, correct: boolean, nowDay: number, p: MemoryParams): MemoryCell {
  const R = retrievability(cell, nowDay);
  cell.reps += 1;
  if (correct) {
    const growth = 1.6 + 0.8 * (1 - R);
    cell.S = Math.min(cell.S * Math.min(growth, p.growthCap), 3650);
    cell.D = Math.max(1, cell.D - 0.2);
  } else {
    cell.S = Math.max(0.5, 0.4 * cell.S);
    cell.D = Math.min(10, cell.D + 0.4);
    cell.lapses += 1;
  }
  cell.lastReviewDay = nowDay;
  return cell;
}

export function isDue(cell: MemoryCell, nowDay: number, p: MemoryParams): boolean {
  if (cell.lastReviewDay === null) return false;
  return retrievability(cell, nowDay) < p.dueThreshold;
}
