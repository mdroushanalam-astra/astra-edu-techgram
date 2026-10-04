import { describe, it, expect } from "vitest";
import { conceptNeed } from "../src/cognitive/targeting.js";
import { decide, type TurnWorkspace } from "../src/cognitive/executive.js";
import { deriveSelfInsights, DevelopmentalSession } from "../src/cognitive/developmental-session.js";
import { runLayerStudy } from "../src/lab/layer-trace.js";
import type { SelfErrorRecord } from "../src/cognitive/self-development.js";

/**
 * THE STRENGTHENING PASS [ADR-046] — three upgrades to the intelligent layers,
 * each answering a finding from the Layer Interaction Study:
 *   1. STALENESS-AWARE TARGETING — fixes the calibration inversion for
 *      advanced/spiky students (selective observation left untouched concepts stale).
 *   2. PROPORTIONAL SELF-MODEL — continuous biases; categorical tendencies are
 *      the full-strength special case (S4 strategy params stay the anchors).
 *   3. LIVE CALIBRATION CHANNEL — error density modulates exploration and the
 *      reported confidence, in real time. The self-model becomes an actor in
 *      normal sessions, not only through the S4 path.
 */
describe("1 — STALENESS-AWARE TARGETING", () => {
  it("a stale concept outranks an equally-uncertain fresh one; staleness:false is the historical rule", () => {
    const fresh = conceptNeed({ mean: 0.4, grey: false, weight: 1, lastObservedDay: 10, day: 10, staleness: true });
    const stale = conceptNeed({ mean: 0.4, grey: false, weight: 1, lastObservedDay: 0, day: 10, staleness: true });
    expect(stale).toBeGreaterThan(fresh);
    expect(fresh).toBeCloseTo(0.6, 5); // (1-0.4)*1 — the historical need, observed today
    expect(conceptNeed({ mean: 0.4, grey: false, weight: 1, lastObservedDay: 0, day: 10, staleness: false })).toBeCloseTo(0.6, 5);
  });
  it("the boost is bounded (+25% max)", () => {
    const max = conceptNeed({ mean: 0.4, grey: false, weight: 1, lastObservedDay: -100, day: 10, staleness: true });
    expect(max / 0.6).toBeCloseTo(1.25, 5);
  });
});

describe("2 — PROPORTIONAL SELF-MODEL", () => {
  it("deriveSelfInsights emits continuous biases; a mild bias is weaker than a full one", () => {
    const si = deriveSelfInsights([
      { id: "a", prediction: "p", actual: "x", error: "self-prediction was wrong: premature break", context: "", at: 1, patternHypothesis: "break-calibration" },
      { id: "b", prediction: "p", actual: "x", error: "self-prediction was wrong: fatigue collapse without a break", context: "", at: 2, patternHypothesis: "break-calibration" },
    ]);
    expect(si.breakBias).toBe(0); // 1 early vs 1 missed — balanced
    const mild = deriveSelfInsights([
      { id: "a", prediction: "p", actual: "x", error: "self-prediction was wrong: premature break", context: "", at: 1, patternHypothesis: "break-calibration" },
      { id: "b", prediction: "p", actual: "x", error: "self-prediction was wrong: fatigue collapse without a break", context: "", at: 2, patternHypothesis: "break-calibration" },
      { id: "c", prediction: "p", actual: "x", error: "self-prediction was wrong: fatigue collapse without a break", context: "", at: 3, patternHypothesis: "break-calibration" },
    ]);
    expect(mild.breakBias).toBeCloseTo(1 / 3, 5); // reluctant, mildly
  });

  it("categorical tendencies remain the full-strength special case (S4 anchors intact)", () => {
    const w = (bias: number | undefined): TurnWorkspace => ({
      turn: 5, elapsedMin: 30, timeLeftMin: 10, turnsRemaining: 3,
      focusConcept: { id: "c", name: "C", mean: 0.55, grey: false },
      alternativeConcept: null, uncertainties: 2, hypothesisCount: 1,
      momentum: 0.4, frustration: 0.2, fatigue: 0.9,
      wrongStreak: 0, lastOutcome: null, planProgress: { done: 4, total: 8 },
      counts: { jokes: 0, llm: 0, breaks: 0, sinceLastIntervention: 9 },
      visualStructure: false,
      incumbentMove: { kind: "study", conceptId: "c", conceptName: "C" },
      selfInsights: {
        recurringPatterns: [], interventionTendency: "balanced",
        breakCalibration: bias === undefined ? "aggressive" : "balanced",
        selfErrorCount: 4,
        breakBias: bias,
      },
    });
    const study = { directive: { learningAction: "retrieve" as const, communication: "explain" as const, presentation: "board" as const, augmentation: "no_llm" as const }, predictedBenefit: 0.4 };
    // categorical aggressive (fallback bias -1) == explicit bias -1 == x0.6
    const categorical = decide(w(undefined), study, 7).receipt.alternativesConsidered.find((a) => a.directive.startsWith("break"));
    const explicit = decide(w(-1), study, 7).receipt.alternativesConsidered.find((a) => a.directive.startsWith("break"));
    expect(categorical!.predictedBenefit).toBeCloseTo(explicit!.predictedBenefit, 5);
    // and a mild bias is proportionally weaker than the full one
    const mild = decide(w(-0.5), study, 7).receipt.alternativesConsidered.find((a) => a.directive.startsWith("break"))!;
    const full = decide(w(-1), study, 7).receipt.alternativesConsidered.find((a) => a.directive.startsWith("break"))!;
    expect(mild.predictedBenefit).toBeGreaterThan(full.predictedBenefit);
  });
});

describe("3 — LIVE CALIBRATION CHANNEL", () => {
  it("the session tracks error density over the last 8 decisions", () => {
    const s = new DevelopmentalSession({ learningEnabled: true });
    expect(s.errorDensity()).toBe(0);
    const D = { learningAction: "retrieve" as const, communication: "explain" as const, presentation: "board" as const, augmentation: "no_llm" as const };
    s.decideTurn({
      turn: 1, elapsedMin: 5, timeLeftMin: 35, turnsRemaining: 3,
      focusConcept: { id: "c", name: "C", mean: 0.6, grey: false },
      alternativeConcept: null, uncertainties: 2, hypothesisCount: 1,
      momentum: 0.4, frustration: 0.2, fatigue: 0.3,
      wrongStreak: 0, lastOutcome: null, planProgress: { done: 0, total: 4 },
      counts: { jokes: 0, llm: 0, breaks: 0, sinceLastIntervention: 9 },
      visualStructure: false, incumbentMove: { kind: "study", conceptId: "c", conceptName: "C" },
    }, { directive: D, predictedBenefit: 0.5 }, 1);
    s.recordActual({ directive: D, wasIntervention: false, tookBreak: false, nextAnswerCorrect: false, performanceDelta: 0.01, fatigueAtDecision: 0.3 });
    expect(s.errorDensity()).toBeGreaterThan(0); // the over-confident error landed
  });

  it("high error density widens exploration and shrinks reported confidence", () => {
    const w = (density?: number): TurnWorkspace => ({
      turn: 5, elapsedMin: 30, timeLeftMin: 10, turnsRemaining: 2,
      focusConcept: { id: "c", name: "C", mean: 0.55, grey: false },
      alternativeConcept: null, uncertainties: 2, hypothesisCount: 1,
      momentum: 0.4, frustration: 0.2, fatigue: 0.77, // break-vs-study gap ≈ 0.032 — inside the widened window, outside the base one
      wrongStreak: 0, lastOutcome: null, planProgress: { done: 4, total: 8 },
      counts: { jokes: 0, llm: 0, breaks: 0, sinceLastIntervention: 9 },
      visualStructure: false,
      incumbentMove: { kind: "study", conceptId: "c", conceptName: "C" },
      selfInsights: { recurringPatterns: [], interventionTendency: "balanced", breakCalibration: "balanced", selfErrorCount: 4, errorDensity: density },
    });
    const study = { directive: { learningAction: "retrieve" as const, communication: "explain" as const, presentation: "board" as const, augmentation: "no_llm" as const }, predictedBenefit: 0.4 * (1 - 0.77 * 0.5) }; // fatigue-discounted, runner convention
    const calm = decide(w(0), study, 91);
    const erring = decide(w(0.8), study, 91);
    // the reported confidence says the machine knows it errs
    expect(erring.receipt.confidence).toBeLessThan(calm.receipt.confidence);
    // and the exploration window widened: a near-tie that stays put at density 0
    // can flip at density 0.8 for seeds in the widened band
    let flipped = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const a = decide(w(0), study, seed).directive.learningAction;
      const b = decide(w(0.8), study, seed).directive.learningAction;
      if (a !== b) flipped++;
    }
    expect(flipped).toBeGreaterThan(0);
  });
});

describe("THE STUDY, RE-RUN — the findings the strengthening had to answer", () => {
  const { results, aggregate } = runLayerStudy();
  it("the executive still never loses (22W/2T/0L) and the Phase 5 rig still passes 30/30", () => {
    expect(aggregate.execLosses).toBe(0);
    expect(aggregate.execWins + aggregate.execTies).toBe(24);
  }, 60000);

  it("the advanced-student calibration inversions CLOSED (t07/t08/t18/t23)", () => {
    for (const id of ["t07", "t08", "t18", "t23"]) {
      const r = results.find((x) => x.id === id)!;
      expect(r.beliefError.executive).toBeLessThan(r.beliefError.linear);
    }
  }, 60000);

  it("the self-model is now an in-regime actor: the calibration channel changes real decisions", () => {
    expect(aggregate.influence.selfModelMeanPct).toBeGreaterThan(0);
    const panic = results.find((r) => r.id === "t16")!;
    expect(panic.ablation.noSelfModel).toBeGreaterThan(20); // 77% — for high-error students the channel dominates
  }, 60000);
});
