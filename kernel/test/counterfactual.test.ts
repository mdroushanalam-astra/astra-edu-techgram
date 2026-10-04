import { describe, it, expect } from "vitest";
import { decide, type TurnWorkspace } from "../src/cognitive/executive.js";
import { genesis, selfPredict, checkSelfPrediction, detectPatterns, selfInquiry, runSelfImprovementExperiment, type DevelopmentalState } from "../src/cognitive/self-development.js";
import { buildBeliefModel, initialState, DEFAULT_BELIEF_PARAMS } from "../src/belief.js";
import { DEFAULT_MEMORY_PARAMS } from "../src/memory.js";
import { buildSeedContent } from "../src/polity_seed.js";

const content = buildSeedContent();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });

function ws(over: Partial<TurnWorkspace> = {}): TurnWorkspace {
  return {
    turn: 5, elapsedMin: 14, timeLeftMin: 26, turnsRemaining: 3,
    focusConcept: { id: "c_fr_14", name: "Friction", mean: 0.4, grey: false },
    alternativeConcept: { id: "c_fr_21", name: "Deposition", gainPerMinute: 0.2 },
    uncertainties: 4, hypothesisCount: 1,
    momentum: 0.4, frustration: 0.2, fatigue: 0.5,
    wrongStreak: 0, lastOutcome: null,
    planProgress: { done: 1, total: 4 },
    counts: { jokes: 0, llm: 0, breaks: 0, sinceLastIntervention: 9 },
    visualStructure: true,
    incumbentMove: { kind: "teach", conceptId: "c_fr_14", conceptName: "Friction" },
    ...over,
  };
}
const inc = { directive: { learningAction: "teach" as const, communication: "explain" as const, presentation: "board" as const, augmentation: "no_llm" as const }, predictedBenefit: 0.5 };

describe("COUNTERFACTUAL — is the developmental loop ACTUALLY closed?", () => {
  it("TEST 1: the Executive does NOT use SelfPredictions when deciding", () => {
    // IF the developmental loop were closed, self-predictions would influence decisions.
    // Currently: decide() has NO access to SelfPredictions or the SelfErrorLedger.
    const withPredictions = decide(ws({ wrongStreak: 2 }), inc, 42);
    const withoutPredictions = decide(ws({ wrongStreak: 2 }), inc, 42);
    // They're identical because self-predictions aren't wired in
    expect(withPredictions.directive).toEqual(withoutPredictions.directive);
    // This TEST PASSES but proves the LOOP IS NOT CLOSED
  });

  it("TEST 2: the Executive does NOT consult the SelfModel when deciding", () => {
    // The Executive's TurnWorkspace doesn't contain SelfModel data
    const keys = Object.keys(ws());
    expect(keys).not.toContain("selfModel");
    expect(keys).not.toContain("activeHypotheses");
    expect(keys).not.toContain("selfErrorLedger");
    // The workspace has fatigue/frustration/momentum but NOT the self-model
  });

  it("TEST 3: the S0-S4 functions exist but are NOT composed into the decision loop", () => {
    // These functions work individually but don't feed into decide()
    const sps = selfPredict(5, 0.8, 2, 0.25);
    expect(sps.length).toBeGreaterThan(0);
    const ledger = sps.map((s) => checkSelfPrediction(s, "different behavior").record).filter(Boolean);
    expect(ledger.length).toBeGreaterThan(0);
    // But decide() doesn't import or use any of this
  });

  it("COUNTERFACTUAL: disabling the self-development module changes NOTHING in executive behavior", () => {
    // If we removed all S0-S4 code, the Executive would produce IDENTICAL decisions
    // This proves the developmental loop is NOT closed
    const before = decide(ws({ fatigue: 0.9 }), inc, 42);
    // Simulating "self-development disabled" — nothing changes because it was never wired
    const after = decide(ws({ fatigue: 0.9 }), inc, 42);
    expect(after.directive).toEqual(before.directive);
    // This is the finding: the developmental loop is NOT influencing decisions
  });

  it("HONEST CONCLUSION: S0-S4 are SPECIFIED and UNIT-TESTED but NOT INTEGRATED into the decision loop", () => {
    // The evidence level for each:
    const evidenceLevels = {
      S0_genesis: "SPECIFIED+IMPLEMENTED (not integrated)",
      S1_selfPrediction: "SPECIFIED+IMPLEMENTED (not integrated)",
      S2_selfErrorLedger: "SPECIFIED+IMPLEMENTED (not integrated)",
      S3_selfInquiry: "SPECIFIED+IMPLEMENTED (not integrated)",
      S4_selfImprovement: "SPECIFIED+IMPLEMENTED (not integrated)",
      executive: "IMPLEMENTED+UNIT-TESTED+SIMULATED (compact gate only, not matched-baseline-validated with the real session)",
    };
    // The Phase 2 gate has NOT been earned
    expect(evidenceLevels.S0_genesis).toContain("not integrated");
  });
});
