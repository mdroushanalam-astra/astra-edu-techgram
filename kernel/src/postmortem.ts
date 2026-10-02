/**
 * B11 — MOCK POST-MORTEM + ATTEMPT-POLICY COACH.
 * The most immediately useful, most data-light feature in the plan: pure
 * deterministic arithmetic on ONE mock's responses. [v2x §13]
 *
 * Every wrong/unattempted question is classified (or honestly shown as
 * UNCLASSIFIED when the belief is too thin to say), marks lost are
 * decomposed by cause, and the attempt-policy coach computes what the
 * student's OWN break-even would have earned.
 */

import type { BeliefModel, BeliefState } from "./belief.js";
import { expertDifficultyToLogit, type ExamSpec } from "./content.js";

export type MockErrorClass =
  | "knowledge_gap"
  | "trap"
  | "careless"
  | "time_pressure"
  | "bad_guess"
  | "over_skip"
  | "correct"
  | "unclassified";

export interface MockQuestion {
  itemId: string;
  conceptId: string;
  attempted: boolean;
  chosenOption?: number;
  correct?: boolean;
  /** Seconds spent (undefined → careless/time classes fall back). */
  timeSec?: number;
  /** Self-reported confidence before the answer: 1 guess / 2 think / 3 sure. */
  confidence?: 1 | 2 | 3;
  /** 0-based position in the paper (for the time-pressure class). */
  position: number;
}

export interface ClassifiedQuestion {
  itemId: string;
  conceptId: string;
  pBefore: number;
  cls: MockErrorClass;
  /** Marks impact under the exam's marking scheme (negative = lost). */
  marksImpact: number;
  reason: string;
}

export interface PostMortem {
  perQuestion: ClassifiedQuestion[];
  byClass: Record<MockErrorClass, { count: number; marksLost: number }>;
  totalMarksLost: number;
  attemptPolicy: {
    breakEven: number;
    /** Mapping the student's confidence labels to their real hit-rate. */
    confidenceCalibration: Record<1 | 2 | 3, { attempted: number; accuracy: number }>;
    badGuesses: number;
    overSkips: number;
    /** Expected marks if the student had followed their own break-even policy. */
    expectedMarksIfFollowed: number;
    actualMarks: number;
    lines: string[];
  };
}

/** Predicted P(correct) before the mock, from the belief + the item. */
function pBefore(model: BeliefModel, st: BeliefState, q: MockQuestion): number {
  const ci = model.index.get(q.conceptId);
  if (ci === undefined) return model.content.exam.guessFloor;
  const item = model.content.itemById.get(q.itemId);
  const b = item ? expertDifficultyToLogit(item.difficulty) : model.conceptB[ci];
  const g = model.content.exam.guessFloor;
  return g + (1 - g) / (1 + Math.exp(-model.params.discrimination * (st.mu[ci] - b)));
}

export function analyseMock(
  model: BeliefModel,
  st: BeliefState,
  questions: MockQuestion[],
): PostMortem {
  const exam: ExamSpec = model.content.exam;
  const pStar = exam.attemptBreakEven;
  const perQuestion: ClassifiedQuestion[] = [];
  const byClass: Record<MockErrorClass, { count: number; marksLost: number }> = {
    knowledge_gap: { count: 0, marksLost: 0 },
    trap: { count: 0, marksLost: 0 },
    careless: { count: 0, marksLost: 0 },
    time_pressure: { count: 0, marksLost: 0 },
    bad_guess: { count: 0, marksLost: 0 },
    over_skip: { count: 0, marksLost: 0 },
    correct: { count: 0, marksLost: 0 },
    unclassified: { count: 0, marksLost: 0 },
  };

  // Confidence → real accuracy calibration (the coach uses the student's own data).
  const confStats: Record<1 | 2 | 3, { attempted: number; correct: number }> = {
    1: { attempted: 0, correct: 0 },
    2: { attempted: 0, correct: 0 },
    3: { attempted: 0, correct: 0 },
  };

  let actualMarks = 0;
  let expectedIfFollowed = 0;

  questions.forEach((q) => {
    const p = pBefore(model, st, q);
    const marksIfAttemptedCorrect = exam.marksEach;
    let cls: MockErrorClass = "unclassified";
    let marksImpact = 0;
    let reason = "";

    if (q.attempted && q.correct) {
      cls = "correct";
      marksImpact = exam.marksEach;
      reason = `correct (predicted ${(p * 100).toFixed(0)}%)`;
      actualMarks += exam.marksEach;
      expectedIfFollowed += attemptEV(p, exam);
      if (q.confidence) {
        confStats[q.confidence].attempted += 1;
        confStats[q.confidence].correct += 1;
      }
    } else if (q.attempted) {
      actualMarks -= exam.marksEach * exam.negativeFraction;
      expectedIfFollowed += attemptEV(p, exam);
      if (q.confidence) {
        confStats[q.confidence].attempted += 1;
      }
      const rapid = q.timeSec !== undefined && q.timeSec < 0.5 * (model.content.itemById.get(q.itemId)?.expectedTimeSec ?? 45);
      const taggedTrap = q.chosenOption !== undefined &&
        Object.keys(model.content.itemById.get(q.itemId)?.distractorTags ?? {}).includes(String(q.chosenOption));
      // Priority order = most actionable signal first. A self-declared guess is
      // DIRECT evidence from the student — it outranks the belief-side inference.
      if (q.confidence === 1 && p < pStar) {
        cls = "bad_guess";
        marksImpact = -exam.marksEach * exam.negativeFraction;
        reason = `self-declared guess below your break-even (${pStar.toFixed(2)})`;
      } else if (p < 0.4 && !rapid) {
        cls = "knowledge_gap";
        marksImpact = -exam.marksEach * exam.negativeFraction - exam.marksEach; // lost the marking AND the opportunity
        reason = `belief said ${(p * 100).toFixed(0)}% — the knowledge was not there`;
      } else if (p >= 0.6 && taggedTrap && (q.confidence ?? 2) >= 2) {
        cls = "trap";
        marksImpact = -exam.marksEach * exam.negativeFraction - exam.marksEach;
        reason = `you knew this (${(p * 100).toFixed(0)}%) and walked into the tagged trap`;
      } else if (p >= 0.6 && rapid) {
        cls = "careless";
        marksImpact = -exam.marksEach * exam.negativeFraction - exam.marksEach;
        reason = `answered in half the expected time on a question you know`;
      } else if (q.position / Math.max(1, questions.length - 1) >= 0.85 && p >= 0.5) {
        cls = "time_pressure";
        marksImpact = -exam.marksEach * exam.negativeFraction - exam.marksEach;
        reason = `last stretch of the paper on a question within reach`;
      } else {
        cls = "unclassified";
        marksImpact = -exam.marksEach * exam.negativeFraction;
        reason = `pattern does not match a class strongly enough to label — shown as unclassified`;
      }
    } else {
      // Unattempted.
      expectedIfFollowed += attemptEV(p, exam);
      if (p >= pStar) {
        cls = "over_skip";
        marksImpact = -(attemptEV(p, exam)); // expected value surrendered
        reason = `left on the table: predicted ${(p * 100).toFixed(0)}% ≥ break-even ${(pStar * 100).toFixed(0)}%`;
      } else {
        cls = "unclassified";
        marksImpact = 0;
        reason = `correctly skipped (predicted ${(p * 100).toFixed(0)}% < break-even) — skipping is a skill`;
      }
    }

    byClass[cls].count += 1;
    byClass[cls].marksLost += marksImpact < 0 ? marksImpact : 0;
    perQuestion.push({ itemId: q.itemId, conceptId: q.conceptId, pBefore: p, cls, marksImpact, reason });
  });

  const badGuesses = byClass.bad_guess.count;
  const overSkips = byClass.over_skip.count;
  const lines: string[] = [];
  const totalMarksLost = Object.entries(byClass)
    .filter(([cls]) => cls !== "correct")
    .reduce((a, [, v]) => a + v.marksLost, 0);

  lines.push(
    `Marks lost ≈ ${Math.abs(totalMarksLost).toFixed(1)}: knowledge gaps ${byClass.knowledge_gap.count}, traps ${byClass.trap.count}, careless ${byClass.careless.count}, time pressure ${byClass.time_pressure.count}, bad guesses ${byClass.bad_guess.count}, over-skips ${byClass.over_skip.count}, unclassified ${byClass.unclassified.count}.`,
  );
  lines.push(
    `Following your own break-even (p ≥ ${(pStar * 100).toFixed(0)}%) on this paper: ≈ ${expectedIfFollowed.toFixed(1)} marks vs your actual ${actualMarks.toFixed(1)} (Δ ${(expectedIfFollowed - actualMarks >= 0 ? "+" : "")}${(expectedIfFollowed - actualMarks).toFixed(1)}).`,
  );
  const cal = confidenceCalibrationLines(confStats);
  if (cal) lines.push(cal);

  return {
    perQuestion,
    byClass,
    totalMarksLost,
    attemptPolicy: {
      breakEven: pStar,
      confidenceCalibration: {
        1: { attempted: confStats[1].attempted, accuracy: confStats[1].attempted ? confStats[1].correct / confStats[1].attempted : 0 },
        2: { attempted: confStats[2].attempted, accuracy: confStats[2].attempted ? confStats[2].correct / confStats[2].attempted : 0 },
        3: { attempted: confStats[3].attempted, accuracy: confStats[3].attempted ? confStats[3].correct / confStats[3].attempted : 0 },
      },
      badGuesses,
      overSkips,
      expectedMarksIfFollowed: expectedIfFollowed,
      actualMarks,
      lines,
    },
  };
}

function attemptEV(p: number, exam: ExamSpec): number {
  return exam.marksEach * p - exam.marksEach * exam.negativeFraction * (1 - p);
}

function confidenceCalibrationLines(
  s: Record<1 | 2 | 3, { attempted: number; correct: number }>,
): string | null {
  const parts: string[] = [];
  for (const k of [1, 2, 3] as const) {
    if (s[k].attempted >= 3) {
      parts.push(`"${k === 1 ? "guess" : k === 2 ? "think" : "sure"}" → ${(s[k].correct / s[k].attempted * 100).toFixed(0)}% hit-rate (n=${s[k].attempted})`);
    }
  }
  return parts.length > 0 ? `Your own confidence map: ${parts.join("; ")}.` : null;
}
