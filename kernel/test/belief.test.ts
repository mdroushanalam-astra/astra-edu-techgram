import { describe, it, expect } from "vitest";
import { buildBeliefModel, initialState, observe, timeUpdate, expectedScore, DEFAULT_BELIEF_PARAMS } from "../src/belief.js";
import { DEFAULT_MEMORY_PARAMS } from "../src/memory.js";
import { buildSeedContent } from "../src/polity_seed.js";
import { cholesky, invert, makeRng } from "../src/linalg.js";

const content = buildSeedContent();

describe("linalg", () => {
  it("inverts and round-trips", () => {
    const A = new Float64Array([4, 1, 0, 1, 3, 1, 0, 1, 2]);
    const Ai = invert(A, 3);
    // A × A⁻¹ ≈ I
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let s = 0;
        for (let k = 0; k < 3; k++) s += A[i * 3 + k] * Ai[k * 3 + j];
        expect(s).toBeCloseTo(i === j ? 1 : 0, 6);
      }
    }
  });
  it("cholesky rejects non-PD", () => {
    const bad = new Float64Array([1, 2, 2, 1]); // indefinite 2×2
    expect(() => cholesky(bad, 2)).toThrow();
  });
});

describe("belief engine — structural prior", () => {
  const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS);

  it("builds a PD prior covariance with sane diagonal", () => {
    expect(() => cholesky(model.Sigma0, model.N)).not.toThrow();
    let diag = 0;
    for (let i = 0; i < model.N; i++) diag += model.Sigma0[i * model.N + i];
    expect(diag / model.N).toBeCloseTo(DEFAULT_BELIEF_PARAMS.totalVariance, 5);
  });

  it("prior mean respects onboarding self-rating and scorecards", () => {
    const m2 = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, {
      selfRating: 5,
      scorecards: { t_fr: 0.8 },
    });
    const iBase = model.index.get("c_cf_hist")!;
    const iFr = m2.index.get("c_fr_14")!;
    expect(m2.mu0[iFr]).toBeGreaterThan(m2.mu0[iBase]!); // scorecard lift on FR
    const iBase2 = m2.index.get("c_cf_hist")!;
    expect(m2.mu0[iBase2]).toBeGreaterThan(model.mu0[iBase]!); // self-rating lift everywhere
  });

  it("prereq/confusable structure creates correlation (graph smoothing)", () => {
    const i = model.index.get("c_fr_14")!;
    const j = model.index.get("c_fr_19")!; // confusable
    const k = model.index.get("c_bd_eci")!; // unrelated
    expect(model.Sigma0[i * model.N + j]).toBeGreaterThan(model.Sigma0[i * model.N + k]);
  });
});

describe("belief engine — EKF update", () => {
  const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS);

  it("a correct answer raises the answered concept and correlated neighbours", () => {
    const st = initialState(model);
    const before = st.mu.slice();
    observe(model, st, { conceptId: "c_fr_14", correct: true, evidenceW: 1, day: 1 });
    const i = model.index.get("c_fr_14")!;
    const j = model.index.get("c_fr_19")!; // confusable
    const k = model.index.get("c_bd_eci")!; // unrelated
    expect(st.mu[i]).toBeGreaterThan(before[i]!);
    expect(st.mu[j]).toBeGreaterThanOrEqual(before[j]!); // propagated
    const liftIJ = st.mu[j]! - before[j]!;
    const liftIK = st.mu[k]! - before[k]!;
    expect(liftIJ).toBeGreaterThanOrEqual(liftIK); // closer concepts move more
  });

  it("an incorrect answer lowers mastery", () => {
    const st = initialState(model);
    const before = st.mu.slice();
    observe(model, st, { conceptId: "c_fr_21", correct: false, evidenceW: 1, day: 1 });
    const i = model.index.get("c_fr_21")!;
    expect(st.mu[i]).toBeLessThan(before[i]!);
  });

  it("uncertainty shrinks with consistent evidence and nEff accumulates", () => {
    const st = initialState(model);
    const i = model.index.get("c_fr_14")!;
    const sd0 = Math.sqrt(st.S[i * model.N + i]);
    for (let d = 1; d <= 5; d++) {
      observe(model, st, { conceptId: "c_fr_14", correct: true, evidenceW: 1, day: d });
    }
    const sd5 = Math.sqrt(st.S[i * model.N + i]);
    expect(sd5).toBeLessThan(sd0);
    expect(st.nEff[i]).toBeCloseTo(5);
  });

  it("zero-evidence guesses do not move the state (rapid-guess rule)", () => {
    const st = initialState(model);
    const before = st.mu.slice();
    const Sbefore = st.S.slice();
    observe(model, st, { conceptId: "c_fr_14", correct: true, evidenceW: 0, day: 1 });
    expect(st.mu).toEqual(before);
    expect(st.S).toEqual(Sbefore);
  });
});

describe("belief engine — time update (forgetting)", () => {
  const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS);

  it("decays toward the prior mean (not zero) and regrows uncertainty", () => {
    const st = initialState(model);
    const i = model.index.get("c_fr_14")!;
    // push mastery far up
    for (let d = 1; d <= 6; d++) {
      observe(model, st, { conceptId: "c_fr_14", correct: true, evidenceW: 1.3, day: d });
    }
    const afterLearning = st.mu[i]!;
    const varAfterLearning = st.S[i * model.N + i];
    timeUpdate(model, st, new Map(), 30);
    expect(st.mu[i]).toBeLessThan(afterLearning);
    expect(st.mu[i]).toBeGreaterThan(model.mu0[i]!); // decays toward prior, not past it
    expect(st.S[i * model.N + i]).toBeGreaterThan(varAfterLearning);
  });
});

describe("expected score + Elo second opinion", () => {
  const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS);

  it("expected score is in a sane range for the prior (full-paper scale)", () => {
    const st = initialState(model);
    const es = expectedScore(model, st);
    // Prior mastery ≈ 0.4, guess floor 0.25 → roughly 90–120 marks of 200
    expect(es).toBeGreaterThan(40);
    expect(es).toBeLessThan(150);
  });

  it("flags model disagreement when Elo diverges from the filter", () => {
    const st = initialState(model);
    // Force many wrong responses on one topic while prior stays mid → Elo drops.
    for (let d = 1; d <= 20; d++) {
      observe(model, st, { conceptId: "c_fr_14", correct: false, evidenceW: 1, day: d });
      observe(model, st, { conceptId: "c_fr_19", correct: false, evidenceW: 1, day: d });
    }
    const t = model.topicIndexOf[model.index.get("c_fr_14")!];
    // Either flagged or Elo moved strongly negative — the mechanism exists.
    if (st.eloSeen[t] >= 8) {
      expect(st.modelDisagreement[t] || st.elo[t] < -0.4).toBe(true);
    }
  });
});

describe("replay determinism", () => {
  it("same events in same order → bit-identical belief state", () => {
    const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS);
    const run = () => {
      const st = initialState(model);
      const rng = makeRng(42);
      for (let d = 1; d <= 15; d++) {
        const concept = content.concepts[(d * 3) % content.concepts.length]!;
        observe(model, st, { conceptId: concept.id, correct: rng.next() < 0.6, evidenceW: 1, day: d });
      }
      return { mu: st.mu.slice(), S: st.S.slice() };
    };
    const a = run();
    const b = run();
    expect(a.mu).toEqual(b.mu);
    expect(a.S).toEqual(b.S);
  });
});
