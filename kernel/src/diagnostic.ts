/**
 * B5 — Adaptive Diagnostic: closed-form information-gain item selection.
 * value(i) = H_i² · q_c / (H_i² · Σ_cc + R_i),  q_c = Σ_j w_j · Σ_jc²
 * The diagnostic is an entry ticket, not a verdict — bands + sharpen actions.
 */

import { sigmoid } from "./linalg.js";
import { expectedScore, expectedScoreSd, type BeliefModel, type BeliefState } from "./belief.js";
import type { Item } from "./content.js";
import { expertDifficultyToLogit } from "./content.js";

export interface DiagnosticParams {
  maxItems: number;
  /** Stop early when the posterior sd of expected score falls below this (marks). */
  targetScoreSd: number;
  /** Keep item difficulty in this predicted-success band. */
  successBand: [number, number];
}

export const DEFAULT_DIAGNOSTIC_PARAMS: DiagnosticParams = {
  maxItems: 25,
  targetScoreSd: 4.0,
  successBand: [0.35, 0.9],
};

export interface DiagnosticChoice {
  item: Item;
  value: number; // exam-weighted information gain
  predictedP: number;
}

export class DiagnosticSession {
  used: Set<string> = new Set();
  responses: { item: Item; correct: boolean; day: number }[] = [];

  constructor(
    private model: BeliefModel,
    private params: DiagnosticParams = DEFAULT_DIAGNOSTIC_PARAMS,
  ) {}

  /**
   * Pick the next highest-information unused item under the current belief.
   * Returns null when the session should stop.
   */
  next(st: BeliefState): DiagnosticChoice | null {
    if (this.responses.length >= this.params.maxItems) return null;
    if (this.responses.length >= 20 && this.scoreSd(st) < this.params.targetScoreSd) return null;

    const N = this.model.N;
    let best: DiagnosticChoice | null = null;

    for (const item of this.model.content.items) {
      if (this.used.has(item.id)) continue;
      const ci = this.model.index.get(item.conceptId)!;
      const b = expertDifficultyToLogit(item.difficulty);
      const a = this.model.params.discrimination;
      const g = this.model.content.exam.guessFloor;

      const z = sigmoid(a * (st.mu[ci] - b));
      const p = g + (1 - g) * z;
      if (p < this.params.successBand[0] || p > this.params.successBand[1]) continue;

      const H = (1 - g) * a * z * (1 - z);
      const Scc = st.S[ci * N + ci];
      // q_c = exam-weighted uncertainty: own variance × own weight + correlated
      // variance × correlated weights (the reason informative items on hub
      // concepts are extra valuable).
      let q = 0;
      const colJ = new Float64Array(N);
      for (let j = 0; j < N; j++) colJ[j] = st.S[j * N + ci];
      for (let j = 0; j < N; j++) {
        const wj = this.model.content.conceptWeight.get(this.model.byIdx[j]!) ?? 0;
        if (wj === 0) continue;
        q += wj * colJ[j] * colJ[j];
      }
      const R = Math.max(p * (1 - p), 1e-3);
      const value = (H * H * q) / (H * H * Scc + R);
      if (!best || value > best.value) {
        best = { item, value, predictedP: p };
      }
    }
    return best;
  }

  record(item: Item, correct: boolean, day: number): void {
    this.used.add(item.id);
    this.responses.push({ item, correct, day });
  }

  /** sd of expected score under current posterior (from the belief engine). */
  scoreSd(st: BeliefState): number {
    return expectedScoreSd(this.model, st);
  }

  /** Human-readable "what we know / don't know" + sharpen suggestions. */
  summary(st: BeliefState): {
    scoreBand: [number, number];
    knownTopics: string[];
    unknownTopics: string[];
    sharpen: string[];
  } {
    const sd = this.scoreSd(st);
    const mean = expectedScore(this.model, st);
    const known: string[] = [];
    const unknown: string[] = [];
    for (const topic of this.model.content.topics) {
      let n = 0, sum = 0;
      for (let i = 0; i < this.model.N; i++) {
        if (this.model.topicIndexOf[i] === this.topicIdx(topic.id)) {
          n += st.nEff[i];
          sum += st.nEff[i];
        }
      }
      if (n >= 4) known.push(topic.name);
      else unknown.push(topic.name);
    }
    // Sharpen = weakest known-ish topics with thinnest evidence.
    const sharpen = unknown.slice(0, 3);
    return { scoreBand: [mean - 1.28 * sd, mean + 1.28 * sd], knownTopics: known, unknownTopics: unknown, sharpen };
  }

  private topicIdx(topicId: string): number {
    return this.model.content.topics.findIndex((t) => t.id === topicId);
  }
}
