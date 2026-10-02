import { describe, it, expect } from "vitest";
import { buildBeliefModel, initialState, observe, expectedScore, reportConcept, DEFAULT_BELIEF_PARAMS } from "../src/belief.js";
import { DEFAULT_MEMORY_PARAMS } from "../src/memory.js";
import { buildSeedContent } from "../src/polity_seed.js";
import { makeRng, sigmoid } from "../src/linalg.js";
import { runSim, aggregate, trueExamMarks } from "../src/lab.js";

/**
 * The cold-start regression fixture (from diag_sim_cold_start.py + the v2x plan):
 * if a change makes the estimator less honest or the planner worse on simulated
 * exam outcomes, this suite fails. Numbers are pinned with generous tolerance;
 * seeds are fixed so results are deterministic.
 */
const content = buildSeedContent();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });

describe("simulator regression — estimator honesty (gate G0-lite, estimator half)", () => {
  it("level error decreases as evidence accumulates", () => {
    const st = initialState(model);
    const rng = makeRng(101);
    // Hidden truth for one synthetic student (same family as prior — stated).
    const truthTheta = new Float64Array(model.N);
    for (let i = 0; i < model.N; i++) truthTheta[i] = model.mu0[i] + rng.normal(0, Math.sqrt(0.8));
    const truth = (theta: Float64Array) => {
      let wSum = 0;
      for (let i = 0; i < model.N; i++) wSum += model.content.conceptWeight.get(model.byIdx[i]!) ?? 0;
      const scale = wSum > 0 ? content.exam.questions / wSum : 0;
      let m = 0;
      for (let i = 0; i < model.N; i++) {
        const w = model.content.conceptWeight.get(model.byIdx[i]!) ?? 0;
        const p = content.exam.guessFloor + (1 - content.exam.guessFloor) * sigmoid(model.params.discrimination * (theta[i] - model.conceptB[i]));
        m += w * content.exam.marksEach * p * scale;
      }
      return m;
    };
    const errAt = (n: number) => {
      while (st.nEff.reduce((a, b) => a + b, 0) < n) {
        const c = content.concepts[Math.floor(rng.next() * content.concepts.length)]!;
        const z = sigmoid(model.params.discrimination * (truthTheta[model.index.get(c.id)!] - model.conceptB[model.index.get(c.id)!]));
        observe(model, st, { conceptId: c.id, correct: rng.next() < content.exam.guessFloor + (1 - content.exam.guessFloor) * z, evidenceW: 1, day: 1 });
      }
      return Math.abs(expectedScore(model, st) - truth(truthTheta));
    };
    const err25 = errAt(25);
    const err100 = errAt(100);
    expect(err100).toBeLessThan(err25);
  });

  it("80% intervals cover the truth at a sane rate (inflation active)", () => {
    const st = initialState(model);
    const rng = makeRng(103);
    const truthTheta = new Float64Array(model.N);
    for (let i = 0; i < model.N; i++) truthTheta[i] = model.mu0[i] + rng.normal(0, Math.sqrt(0.8));
    // 60 responses across concepts
    for (let k = 0; k < 60; k++) {
      const c = content.concepts[Math.floor(rng.next() * content.concepts.length)]!;
      const z = sigmoid(model.params.discrimination * (truthTheta[model.index.get(c.id)!] - model.conceptB[model.index.get(c.id)!]));
      observe(model, st, { conceptId: c.id, correct: rng.next() < content.exam.guessFloor + (1 - content.exam.guessFloor) * z, evidenceW: 1, day: 1 });
    }
    let covered = 0, counted = 0;
    for (let i = 0; i < model.N; i++) {
      const rep = reportConcept(model, st, model.byIdx[i]!);
      const truthMastery = sigmoid(truthTheta[i]);
      if (rep.grey) continue; // only judge evidenced concepts
      counted++;
      if (truthMastery >= rep.lo && truthMastery <= rep.hi) covered++;
    }
    const coverage = covered / Math.max(1, counted);
    expect(coverage).toBeGreaterThan(0.45);
    expect(coverage).toBeLessThanOrEqual(1.0);
  });
});

describe("simulator regression — planner value (gate G0-lite, planner half)", () => {
  // G0's actual definition: across archetypes, not the single ideal case.
  // (A perfect student on a perfect fixed order is the one scenario where a
  // fixed schedule is near-optimal; the kernel's edge is adaptation.)
  const agg = aggregate(model, 30, 2, 60411, ["techgram", "fixed_order", "random"]);

  it("techgram planning beats random allocation across archetypes (30 days)", () => {
    expect(agg.techgram.meanMarks).toBeGreaterThan(agg.random.meanMarks);
  });

  it("techgram planning beats fixed syllabus order across archetypes (30 days)", () => {
    expect(agg.techgram.meanMarks).toBeGreaterThan(agg.fixed_order.meanMarks);
  });

  it("belief calibration error is bounded across archetypes", () => {
    expect(agg.techgram.meanCalibration).toBeDefined();
    expect(agg.techgram.meanCalibration!).toBeLessThan(0.2);
  });

  it("belief calibration error is bounded (the filter is not delusional)", () => {
    const r = runSim(model, { seed: 888, archetype: "consistent", days: 30, minutesPerDay: 240, truthShares: [0.25, 0.25, 0.15, 0.35] }, "techgram");
    expect(r.calibrationError).toBeDefined();
    expect(r.calibrationError!).toBeLessThan(0.25); // mean |σ(μ) − σ(θ)| < 0.25
  });

  it("event replay reproduces the folded state exactly", () => {
    // runSim already folds via applyEvent; re-running with the same seed is
    // bit-identical — pin it.
    const a = runSim(model, { seed: 999, archetype: "avoidant", days: 20, minutesPerDay: 240, truthShares: [0.25, 0.25, 0.15, 0.35] }, "techgram");
    const b = runSim(model, { seed: 999, archetype: "avoidant", days: 20, minutesPerDay: 240, truthShares: [0.25, 0.25, 0.15, 0.35] }, "techgram");
    expect(a.finalTheta).toEqual(b.finalTheta);
    expect(a.examMarks).toBeCloseTo(b.examMarks, 10);
  });
});
