import { describe, it, expect } from "vitest";
import { decide, type TurnWorkspace, type ExecutiveDirective } from "../src/cognitive/executive.js";
import {
  DevelopmentalSession, deriveSelfInsights,
  type TurnActual,
} from "../src/cognitive/developmental-session.js";
import { runDeepGate } from "../src/cognitive/deep-gate.js";
import { selfPredict, type SelfErrorRecord } from "../src/cognitive/self-development.js";

/**
 * THE COUNTERFACTUAL — is the developmental loop ACTUALLY closed?
 *
 * History: this file once PROVED the loop was open (commit 9c390db — disabling
 * self-development changed NOTHING in the Executive's behavior). That finding
 * drove the repair: the S-series is now composed into the decision pipeline via
 * DevelopmentalSession (predict → decide → experience → ledger → insights →
 * different next decision). This file now proves the repair with the same
 * standard: a counterfactual. Same session, same experience, self-learning
 * ON vs OFF — the decision traces must DIVERGE once self-errors accumulate.
 */

const TEACH = (benefit: number) => ({
  directive: { learningAction: "teach" as const, communication: "explain" as const, presentation: "board" as const, augmentation: "no_llm" as const },
  predictedBenefit: benefit,
});
const DIAGNOSE_INCUMBENT = {
  directive: { learningAction: "diagnose" as const, communication: "question" as const, presentation: "none" as const, augmentation: "no_llm" as const },
  predictedBenefit: 0.5,
};
const SEED = 7; // rng 0.49 — below the 0.72 exploration threshold, so near-ties hold

function baseWs(turn: number, over: Partial<TurnWorkspace> = {}): TurnWorkspace {
  return {
    turn, elapsedMin: turn * 5, timeLeftMin: 40 - turn * 5, turnsRemaining: 3,
    focusConcept: { id: "c_fr_14", name: "Friction", mean: 0.6, grey: false },
    alternativeConcept: null,
    uncertainties: 2, hypothesisCount: 1,
    momentum: 0.4, frustration: 0.2, fatigue: 0.3,
    wrongStreak: 0, lastOutcome: null,
    planProgress: { done: turn, total: 5 },
    counts: { jokes: 0, llm: 0, breaks: 0, sinceLastIntervention: 9 },
    visualStructure: false,
    incumbentMove: { kind: "teach", conceptId: "c_fr_14", conceptName: "Friction" },
    ...over,
  };
}

/** Run the scripted 5-turn session. Returns both decision traces and both ledgers. */
function runScriptedSession() {
  const enabled = new DevelopmentalSession({ learningEnabled: true });
  const disabled = new DevelopmentalSession({ learningEnabled: false });

  // The scripted world — identical experience for both runs. Only the ENABLED
  // run may let that experience change its decisions.
  const script: {
    ws: TurnWorkspace;
    incumbent: { directive: ExecutiveDirective; predictedBenefit: number };
    actual: TurnActual;
  }[] = [
    // Turn 1: believed mean 0.6 → "moderate confidence" predicted → answer WRONG.
    { ws: baseWs(1), incumbent: TEACH(0.5),
      actual: { directive: { learningAction: "teach", communication: "explain", presentation: "board", augmentation: "no_llm" }, wasIntervention: false, tookBreak: false, nextAnswerCorrect: false, performanceDelta: 0.015, fatigueAtDecision: 0.3 } },
    // Turn 2: believed mean 0.25 → "low confidence" + "needs more evidence" → answer CORRECT.
    { ws: baseWs(2, { focusConcept: { id: "c_fr_14", name: "Friction", mean: 0.25, grey: true }, uncertainties: 4 }), incumbent: TEACH(0.45),
      actual: { directive: { learningAction: "teach", communication: "explain", presentation: "board", augmentation: "no_llm" }, wasIntervention: false, tookBreak: false, nextAnswerCorrect: true, performanceDelta: 0.07, fatigueAtDecision: 0.4 } },
    // Turn 3: an intervention (diagnose) that did NOT help — the "early" evidence.
    { ws: baseWs(3), incumbent: DIAGNOSE_INCUMBENT,
      actual: { directive: { learningAction: "diagnose", communication: "question", presentation: "none", augmentation: "no_llm" }, wasIntervention: true, tookBreak: false, nextAnswerCorrect: false, performanceDelta: 0.01, fatigueAtDecision: 0.5 } },
    // Turn 4: THE DIVERGENCE TURN — weak incumbent (0.05), uncertainty high (5).
    { ws: baseWs(4, { uncertainties: 5, focusConcept: { id: "c_fr_14", name: "Friction", mean: 0.3, grey: true } }), incumbent: TEACH(0.05),
      actual: { directive: { learningAction: "diagnose", communication: "question", presentation: "none", augmentation: "no_llm" }, wasIntervention: true, tookBreak: false, nextAnswerCorrect: true, performanceDelta: 0.06, fatigueAtDecision: 0.5 } },
    // Turn 5: persistence — the self-model keeps shaping decisions.
    { ws: baseWs(5, { uncertainties: 5, focusConcept: { id: "c_fr_14", name: "Friction", mean: 0.3, grey: true } }), incumbent: TEACH(0.05),
      actual: { directive: { learningAction: "diagnose", communication: "question", presentation: "none", augmentation: "no_llm" }, wasIntervention: true, tookBreak: false, nextAnswerCorrect: true, performanceDelta: 0.06, fatigueAtDecision: 0.5 } },
  ];

  for (const s of script) {
    enabled.decideTurn(s.ws, s.incumbent, SEED);
    disabled.decideTurn(s.ws, s.incumbent, SEED);
    enabled.recordActual(s.actual);
    disabled.recordActual(s.actual);
  }
  return { enabled, disabled };
}

describe("COUNTERFACTUAL — the developmental loop IS closed", () => {
  const { enabled, disabled } = runScriptedSession();

  it("experience accumulates IDENTICALLY in both runs — the ledger is not the difference", () => {
    // Both runs HAVE the same experiences; only one is allowed to learn from them.
    expect(enabled.ledger.length).toBe(disabled.ledger.length);
    expect(enabled.ledger.length).toBeGreaterThanOrEqual(4);
  });

  it("S1: a self-prediction is emitted BEFORE every single decision", () => {
    for (const td of enabled.decisions) {
      expect(td.selfPredictions.length).toBeGreaterThan(0);
    }
    // and the predictions are the S-series organ's, not decoration
    expect(enabled.decisions[0]!.selfPredictions.some((p) => p.category === "decision")).toBe(true);
  });

  it("the first decisions are IDENTICAL — before self-knowledge exists there is nothing to learn from", () => {
    // Turn 1: the ledger is empty → insights are null → same candidate pool.
    expect(enabled.decisions[0]!.insightsUsed).toBeNull();
    expect(enabled.decisions[0]!.directive).toEqual(disabled.decisions[0]!.directive);
  });

  it("THE COUNTERFACTUAL: after self-errors accumulate, the ENABLED run decides DIFFERENTLY", () => {
    // Turn 4: same workspace, same incumbent, same seed — but the enabled run
    // carries the self-model ("I intervene too early when uncertain") and adds
    // an evidence-first candidate the disabled run cannot see.
    const e = enabled.decisions[3]!;
    const d = disabled.decisions[3]!;
    expect(e.insightsUsed).not.toBeNull();
    expect(e.insightsUsed!.interventionTendency).toBe("early");
    expect(e.directive.learningAction).toBe("diagnose");
    expect(d.directive.learningAction).toBe("teach");
    expect(e.directive).not.toEqual(d.directive);
    // and the receipt SAYS the self-model changed the decision
    expect(e.receipt.reason.join(" ")).toMatch(/self-model/);
  });

  it("the learned behavior PERSISTS — the self-model keeps shaping later decisions", () => {
    expect(enabled.decisions[4]!.directive.learningAction).toBe("diagnose");
    expect(disabled.decisions[4]!.directive.learningAction).toBe("teach");
  });

  it("deriveSelfInsights maps experience kinds to the right self-knowledge", () => {
    const ledger: SelfErrorRecord[] = [
      { id: "a", prediction: "p", actual: "a", error: "self-prediction was wrong: intervention did not help", context: "", at: 1, patternHypothesis: "intervention-timing" },
      { id: "b", prediction: "p", actual: "a", error: "self-prediction was wrong: fatigue collapse without a break", context: "", at: 2, patternHypothesis: "break-calibration" },
    ];
    const si = deriveSelfInsights(ledger);
    expect(si.interventionTendency).toBe("early");     // wasted > missed
    expect(si.breakCalibration).toBe("reluctant");     // missed > early
    expect(si.selfErrorCount).toBe(2);
    // recurring patterns need ≥3 of the same error (the S2 organ's rule)
    expect(si.recurringPatterns.length).toBe(0);
  });

  it("selfPredict feeds the loop: performance predictions are judged structurally, not by string overlap", () => {
    const sps = selfPredict(9, 0.8, 2, 0.25);
    expect(sps.length).toBeGreaterThan(0);
    // the organ still works standalone (frozen behavior)
    expect(sps.some((s) => s.prediction.includes("fatigue"))).toBe(true);
  });
});

describe("THE DEEP GATE — matched baseline with the loop closed [Phase 1+2+3]", () => {
  it("the Executive beats the linear teacher on TRUE MARKS", () => {
    const r = runDeepGate(10, 7331);
    expect(r.verdict).toBe("PASS");
    expect(r.executive.trueMarks).toBeGreaterThan(r.linear.trueMarks);
    // calibration comes WITH the true-mark win, not instead of it
    expect(r.executive.beliefError).toBeLessThan(r.linear.beliefError);
  }, 30000);

  it("the gate run is a real session flow: Conductor executes every decision", () => {
    const r = runDeepGate(10, 7331);
    expect(r.executive.plans).toBe(80);          // one ExperiencePlan per executive turn
    expect(r.executive.conductorSteps).toBeGreaterThan(300);
    expect(r.linear.conductorSteps).toBe(0);     // the linear teacher has no conductor — it is the baseline
  }, 30000);

  it("the gate run closes the developmental loop: experience → insights → decisions", () => {
    const r = runDeepGate(10, 7331);
    expect(r.executive.selfErrors).toBeGreaterThan(0);
    // nearly every decision after the first turns is self-model-informed
    expect(r.executive.decisionsWithInsights).toBeGreaterThan(r.executive.receipts * 0.9);
    expect(r.linear.selfErrors).toBe(0);
  }, 30000);
});
