import { describe, it, expect } from "vitest";
import { buildBeliefModel, initialState, observe, DEFAULT_BELIEF_PARAMS } from "../src/belief.js";
import { simulateExam } from "../src/exam.js";
import { DEFAULT_MEMORY_PARAMS } from "../src/memory.js";
import { buildSeedContent } from "../src/polity_seed.js";
import { makeRng } from "../src/linalg.js";

const content = buildSeedContent();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS);

describe("exam model — Monte Carlo", () => {
  it("produces a coherent scenario with pClear in [0,1]", () => {
    const st = initialState(model);
    const rng = makeRng(7);
    const sc = simulateExam(model, st, new Map(), rng, { draws: 300, daysToExam: 120 });
    expect(sc.pClear).toBeGreaterThanOrEqual(0);
    expect(sc.pClear).toBeLessThanOrEqual(1);
    expect(sc.p10).toBeLessThanOrEqual(sc.p50);
    expect(sc.p50).toBeLessThanOrEqual(sc.p90);
    expect(sc.draws).toBe(300);
  });

  it("a stronger student scores higher and clears more often (monotonic sanity)", () => {
    const weak = initialState(model);
    const strong = initialState(model);
    const rng = makeRng(11);
    // Give the strong student solid correct evidence across many concepts,
    // with the exam close enough that forgetting does not erase everything.
    for (let d = 1; d <= 80; d++) {
      const c = content.concepts[d % content.concepts.length]!;
      observe(model, strong, { conceptId: c.id, correct: true, evidenceW: 1.3, day: d });
    }
    const weakSc = simulateExam(model, weak, new Map(), rng, { draws: 400, daysToExam: 10 });
    const strongSc = simulateExam(model, strong, new Map(), rng, { draws: 400, daysToExam: 10 });
    expect(strongSc.mean).toBeGreaterThan(weakSc.mean);
    expect(strongSc.pClear).toBeGreaterThanOrEqual(weakSc.pClear);
  });

  it("forgetting to exam day reduces the forecast when the exam is far", () => {
    const st = initialState(model);
    const rng = makeRng(13);
    for (let d = 1; d <= 25; d++) {
      observe(model, st, { conceptId: content.concepts[d % content.concepts.length]!.id, correct: true, evidenceW: 1.3, day: d });
    }
    const near = simulateExam(model, st, new Map(), rng, { draws: 400, daysToExam: 2 });
    const far = simulateExam(model, st, new Map(), rng, { draws: 400, daysToExam: 200 });
    // With only a few reviews, decay to 200 days drags scores toward the prior.
    expect(far.mean).toBeLessThanOrEqual(near.mean);
  });

  it("negative marking keeps prior-student scores near the guess-adjusted floor", () => {
    const st = initialState(model);
    const rng = makeRng(17);
    const sc = simulateExam(model, st, new Map(), rng, { draws: 400, daysToExam: 1 });
    // Pure prior student attempts everything (conf ≈ p + noise); with p ≈ 0.4
    // across the paper, expected marks should sit well below 200 and above −50.
    expect(sc.mean).toBeLessThan(140);
    expect(sc.mean).toBeGreaterThan(-40);
  });
});

describe("goal/attempt policy parameters", () => {
  it("break-even is above the guess floor (never attempt blind)", () => {
    expect(content.exam.attemptBreakEven).toBeGreaterThan(content.exam.guessFloor);
    expect(content.exam.negativeFraction).toBeGreaterThan(0);
    expect(content.exam.negativeFraction).toBeLessThan(1);
  });
});
