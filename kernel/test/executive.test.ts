import { describe, it, expect } from "vitest";
import {
  generateCandidates, applyConstraints, decide, select, DEFAULT_LIMITS,
  type TurnWorkspace,
} from "../src/cognitive/executive.js";
import { runC1Gate } from "../src/cognitive/gate.js";

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
const incumbent = { directive: { learningAction: "teach" as const, communication: "explain" as const, presentation: "board" as const, augmentation: "no_llm" as const }, predictedBenefit: 0.5 };

describe("COGNITIVE EXECUTIVE C1 [ADR-035] — closed-loop, not a dispatcher", () => {
  it("generates COMPETING candidates from workspace signals — not one path", () => {
    const c = generateCandidates(ws(), incumbent);
    const kinds = c.map((x) => x.directive.learningAction + "/" + x.directive.presentation);
    expect(c.some((x) => x.directive.presentation === "chart")).toBe(true);      // visual structure -> chart
    expect(c.some((x) => x.directive.learningAction === "reflect")).toBe(false);  // no correct answer yet -> no silence
    expect(kinds.length).toBeGreaterThanOrEqual(2);
  });

  it("silence is first-class after a correct answer", () => {
    const c = generateCandidates(ws({ lastOutcome: "correct", elapsedMin: 10 }), incumbent);
    expect(c.some((x) => x.directive.communication === "silence")).toBe(true);
  });

  it("constraints block budget-spent interventions and record WHY", () => {
    const w = ws({ counts: { jokes: 2, llm: 2, breaks: 2, sinceLastIntervention: 0 }, fatigue: 0.9 });
    const cands = generateCandidates(w, incumbent);
    const { survivors, blocked } = applyConstraints(cands, w, DEFAULT_LIMITS);
    expect(blocked.length).toBeGreaterThan(0);
    expect(blocked[0]!.why).toMatch(/budget|too soon/);
    expect(survivors.length).toBeGreaterThan(0);
  });

  it("every decision carries a COMPLETE receipt: alternatives, prediction, confidence, constraints, seed", () => {
    const w = ws({ fatigue: 0.9 });
    const { directive, receipt } = decide(w, incumbent, 42);
    expect(receipt.directive.learningAction).toBe(directive.learningAction);
    expect(receipt.alternativesConsidered.length).toBeGreaterThan(0);
    expect(receipt.prediction.predictedBenefit).toBeDefined();
    expect(Array.isArray(receipt.constraintsApplied)).toBe(true);
    expect(receipt.executiveVersion).toBe("C1.0");
    // deterministic replay
    const again = decide(w, incumbent, 42);
    expect(again.receipt.directive).toEqual(receipt.directive);
  });

  it("LLM augmentation is EARNED (2+ wrong streak), never free", () => {
    const calm = generateCandidates(ws({ wrongStreak: 0 }), incumbent);
    expect(calm.some((x) => x.directive.augmentation === "llm")).toBe(false);
    const struggling = generateCandidates(ws({ wrongStreak: 2 }), incumbent);
    expect(struggling.some((x) => x.directive.augmentation === "llm")).toBe(true);
  });

  it("THE C1 GATE: the executive matches-or-beats the linear teacher over matched days", () => {
    const report = runC1Gate({ base: 0.62, seed: 7331 }, 10);
    expect(report.verdict).toBe("PASS");
    expect(report.executive.receipts).toBeGreaterThanOrEqual(36); // receipts complete
  });
});
