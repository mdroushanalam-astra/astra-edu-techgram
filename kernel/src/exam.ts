/**
 * B4 — Exam Model: Monte-Carlo of exam day.
 * Simulates the paper under the current belief (propagated to exam day by
 * forgetting) including negative marking and the student's attempt policy.
 * Output is a SCENARIO with its own uncertainty — never a bare prediction.
 */

import { cholesky, sampleMVN, sigmoid, type Rng } from "./linalg.js";
import { expertDifficultyToLogit, type Content } from "./content.js";
import { stabilityOf, type MemoryCell, type MemoryParams } from "./memory.js";
import type { BeliefModel, BeliefState } from "./belief.js";

export interface ExamScenario {
  mean: number;
  p10: number;
  p50: number;
  p90: number;
  /** P(score ≥ cutoff) — a scenario probability with wide intervals early. */
  pClear: number;
  /** Mean marks contributed per topic (for contribution breakdown). */
  byTopic: Record<string, number>;
  draws: number;
}

export interface SimulateOptions {
  draws?: number;
  /** Days remaining until the exam (forgetting applies). */
  daysToExam: number;
  /** Plan-adjusted stability overrides: conceptIdx → assumed S after plan. */
  stabilityOverride?: Map<number, number>;
  /** Plan-adjusted logit shifts (learning gains): conceptIdx → Δ. */
  muShift?: Map<number, number>;
}

export function simulateExam(
  model: BeliefModel,
  st: BeliefState,
  memory: Map<number, MemoryCell>,
  rng: Rng,
  opts: SimulateOptions,
): ExamScenario {
  const N = model.N;
  const exam = model.content.exam;
  const draws = opts.draws ?? 2000;
  const infl = model.params.varianceInflation;

  // Blueprint: categorical draw table over concepts by weight.
  const weights: number[] = [];
  let wSum = 0;
  for (let i = 0; i < N; i++) {
    const w = model.content.conceptWeight.get(model.byIdx[i]!) ?? 0;
    weights.push(w);
    wSum += w;
  }

  // Cholesky of inflated posterior for θ sampling.
  const Sinf = new Float64Array(N * N);
  for (let k = 0; k < Sinf.length; k++) Sinf[k] = st.S[k] * infl * infl;
  for (let i = 0; i < N; i++) Sinf[i * N + i] += 1e-6;
  const L = cholesky(Sinf, N);

  // Per-concept stability to exam day (after optional plan override).
  const S = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const over = opts.stabilityOverride?.get(i);
    if (over !== undefined) {
      S[i] = over;
      continue;
    }
    const type = model.content.conceptById.get(model.byIdx[i]!)!.type;
    S[i] = stabilityOf(memory.get(i), type, model.memoryParams);
  }
  const shift = opts.muShift ?? new Map();

  const scores: number[] = [];
  let clearCount = 0;
  const mu = new Float64Array(N);
  const theta = new Float64Array(N);

  for (let d = 0; d < draws; d++) {
    // θ draw
    for (let i = 0; i < N; i++) mu[i] = st.mu[i] + (shift.get(i) ?? 0);
    sampleMVN(mu, L, N, rng, theta);
    // decay to exam day
    for (let i = 0; i < N; i++) {
      const dd = Math.exp(-Math.max(0, opts.daysToExam) / Math.max(S[i], 0.5));
      theta[i] = model.mu0[i] + dd * (theta[i] - model.mu0[i]);
    }
    const cutoff = rng.normal(exam.cutoff.mean, exam.cutoff.sd);
    let marks = 0;
    for (let q = 0; q < exam.questions; q++) {
      // sample concept by blueprint weight
      let r = rng.next() * wSum;
      let ci = 0;
      for (; ci < N - 1; ci++) {
        r -= weights[ci];
        if (r <= 0) break;
      }
      const bTrue = model.conceptB[ci] + rng.normal(0, 0.8);
      const p =
        exam.guessFloor +
        (1 - exam.guessFloor) * sigmoid(model.params.discrimination * (theta[ci] - bTrue));
      // student's self-assessed confidence (calibration param) → attempt policy
      const conf = Math.min(0.99, Math.max(0.01, p + rng.normal(0, 0.12)));
      if (conf >= exam.attemptBreakEven) {
        if (rng.next() < p) marks += exam.marksEach;
        else marks -= exam.marksEach * exam.negativeFraction;
      }
    }
    scores.push(marks);
    if (marks >= cutoff) clearCount++;
  }
  scores.sort((x, y) => x - y);
  const q = (p: number) => scores[Math.min(scores.length - 1, Math.max(0, Math.floor(p * scores.length)))];

  // Topic contributions: analytic (expected marks per topic) — cheaper and stable.
  const byTopic: Record<string, number> = {};
  const topicCount = model.content.topics.length;
  for (let t = 0; t < topicCount; t++) {
    const tid = model.content.topics[t].id;
    byTopic[tid] = 0;
  }
  for (let i = 0; i < N; i++) {
    const w = model.content.conceptWeight.get(model.byIdx[i]!) ?? 0;
    if (w === 0) continue;
    const b = model.conceptB[i];
    const th = st.mu[i] + (shift.get(i) ?? 0);
    const dd = Math.exp(-Math.max(0, opts.daysToExam) / Math.max(S[i], 0.5));
    const thExam = model.mu0[i] + dd * (th - model.mu0[i]);
    const p = exam.guessFloor + (1 - exam.guessFloor) * sigmoid(model.params.discrimination * (thExam - b));
    const t = model.topicIndexOf[i];
    if (t >= 0) byTopic[model.content.topics[t].id] += w * exam.marksEach * p;
  }

  return {
    mean: scores.reduce((a, b) => a + b, 0) / scores.length,
    p10: q(0.1),
    p50: q(0.5),
    p90: q(0.9),
    pClear: clearCount / draws,
    byTopic,
    draws,
  };
}

/** Convenience: expected PYQ weight table from content (no belief). */
export function totalExamMarks(content: Content): number {
  return content.exam.questions * content.exam.marksEach;
}

/** Expert difficulty → logit re-export for callers outside kernel internals. */
export { expertDifficultyToLogit };
