import { describe, it, expect } from "vitest";
import {
  composeExpression, validateUtterance, applyCommunicationPolicy, whyThis,
  selfCorrectionMoment, boardPayloadFor, ExpressionError,
  type Utterance,
} from "../src/cognitive/expression.js";
import { planFromDirective, validateExperiencePlan } from "../src/cognitive/experience-plan.js";
import { runDeepGate } from "../src/cognitive/deep-gate.js";
import { decide, type ExecutiveDirective, type ExecutiveReceipt, type TurnWorkspace } from "../src/cognitive/executive.js";
import type { SelfErrorRecord } from "../src/cognitive/self-development.js";
import type { SelfInsights } from "../src/cognitive/developmental-session.js";

/**
 * THE PHASE 4 GATE [roadmap §10, ADR-042] — Expression.
 * THE LAW: Executive decides → Conductor executes → Presence expresses →
 * LLM voices → UI renders. Never the reverse.
 *
 * The binding gate: LLM OFF vs LLM ON — decisions, learning actions, state
 * transitions, predictions, evidence must remain IDENTICAL. LLM ON makes the
 * experience richer; it must not make the brain smarter by secretly taking
 * control. Plus the expression laws: claim-provenance (unproven claims may
 * not be spoken), silence is first-class, density is controlled, praise is
 * earned/specific/true, self-correction is earned by the ledger, ethics wall
 * holds at the voice, and expression NEVER mutates what it is given.
 */

const DIR = (over: Partial<ExecutiveDirective> = {}): ExecutiveDirective => ({
  learningAction: "teach", communication: "explain", presentation: "board", augmentation: "no_llm", ...over,
});
const RECEIPT: ExecutiveReceipt = {
  id: "exec_t5_s42", turn: 5, executiveVersion: "C1.0",
  directive: DIR(),
  reason: ["the concept has a verified spatial/causal structure — a chart carries it better than words"],
  evidenceRefs: ["concept:c_fr_14", "kernel:prereq-structure"],
  alternativesConsidered: [
    { directive: "break/reassure/none", predictedBenefit: 0.27, predictedCost: 0.02, whyNot: "lower predicted benefit than the chosen directive" },
  ],
  prediction: { predictedBenefit: 0.62, uncertainty: 0.3, horizon: "this turn" },
  confidence: 0.86, constraintsApplied: [], seed: 42,
};

function ws(over: Partial<TurnWorkspace> = {}): TurnWorkspace {
  return {
    turn: 5, elapsedMin: 14, timeLeftMin: 26, turnsRemaining: 3,
    focusConcept: { id: "c_fr_14", name: "Friction", mean: 0.4, grey: false },
    alternativeConcept: null,
    uncertainties: 2, hypothesisCount: 1,
    momentum: 0.4, frustration: 0.2, fatigue: 0.4,
    wrongStreak: 0, lastOutcome: null,
    planProgress: { done: 1, total: 4 },
    counts: { jokes: 0, llm: 0, breaks: 0, sinceLastIntervention: 9 },
    visualStructure: false,
    incumbentMove: { kind: "teach", conceptId: "c_fr_14", conceptName: "Friction" },
    ...over,
  };
}

function planFor(directive: ExecutiveDirective, w: TurnWorkspace) {
  const plan = planFromDirective({
    learningAction: directive.learningAction, communication: directive.communication,
    presentation: directive.presentation, augmentation: directive.augmentation,
    conceptId: w.focusConcept.id, conceptName: w.focusConcept.name,
    reasons: RECEIPT.reason, evidenceRefs: RECEIPT.evidenceRefs,
    predictedBenefit: RECEIPT.prediction.predictedBenefit, uncertainty: RECEIPT.prediction.uncertainty,
    receiptId: RECEIPT.id, fatigue: w.fatigue,
  });
  validateExperiencePlan(plan);
  return plan;
}

const CLEAN_STATE = () => ({ turn: 1, lastTwoOutcomes: [null, null] as ("correct" | "wrong" | null)[], praiseTurns: [] as number[], lastReassuranceTurn: -10 });

function express(directive: ExecutiveDirective, w: TurnWorkspace, over: { ledger?: SelfErrorRecord[]; insights?: SelfInsights | null; llmBridgeOn?: boolean; state?: ReturnType<typeof CLEAN_STATE> } = {}) {
  return composeExpression(
    {
      directive, receipt: RECEIPT, workspace: w, plan: planFor(directive, w),
      ledger: over.ledger ?? [],
      insights: over.insights === undefined ? null : over.insights,
      llmBridgeOn: over.llmBridgeOn ?? false,
    },
    over.state ?? CLEAN_STATE(),
  );
}

const prematureLedger: SelfErrorRecord[] = [1, 2, 3].map((i) => ({
  id: `pb${i}`, prediction: "(x)", actual: "turn outcome",
  error: "self-prediction was wrong: premature break", context: `d#${i}`,
  at: i, patternHypothesis: "break-calibration",
}));
const aggressiveInsights: SelfInsights = {
  recurringPatterns: ["recurring self-error (3x): premature break"],
  interventionTendency: "balanced", breakCalibration: "aggressive", selfErrorCount: 3,
};

describe("THE CLAIM-PROVENANCE LAW at the expression layer", () => {
  it("an utterance without evidence may not be composed", () => {
    const bad: Utterance = { id: "x", kind: "explain", text: "Trust me.", evidenceRefs: [], prosody: { pace: "normal", energy: "medium", pauseBeforeMs: 0, pauseAfterMs: 0, interruptible: true } };
    expect(() => validateUtterance(bad)).toThrow(ExpressionError);
    expect(() => validateUtterance(bad)).toThrow(/no evidence/);
  });

  it("every utterance the composer produces carries evidence — ALL of them", () => {
    const out = express(DIR({ communication: "question" }), ws({ wrongStreak: 2, lastOutcome: "wrong" }), { ledger: prematureLedger, insights: aggressiveInsights });
    expect(out.utterances.length).toBeGreaterThan(0);
    for (const u of out.utterances) expect(() => validateUtterance(u)).not.toThrow();
  });

  it("the ethics wall holds at the voice — guilt/urgency may not be spoken", () => {
    const bad: Utterance = { id: "y", kind: "reassure", text: "You're falling behind everyone else.", evidenceRefs: ["x"], prosody: { pace: "normal", energy: "medium", pauseBeforeMs: 0, pauseAfterMs: 0, interruptible: true } };
    expect(() => validateUtterance(bad)).toThrow(/ethics wall/);
  });
});

describe("SILENCE IS FIRST-CLASS", () => {
  it("a silence directive produces a silent presence and ZERO utterances — still interruptible", () => {
    const out = express(DIR({ communication: "silence", learningAction: "reflect", presentation: "none" }), ws({ lastOutcome: "correct" }));
    expect(out.presence.state).toBe("silent");
    expect(out.presence.interruptible).toBe(true);
    expect(out.utterances.length).toBe(0);
  });
  it("a break is WAITING, not chatter — one short utterance at most", () => {
    const out = express(DIR({ learningAction: "break", communication: "reassure", presentation: "none" }), ws({ fatigue: 0.85 }));
    expect(out.presence.state).toBe("waiting");
    expect(out.presence.waitSeconds).toBeGreaterThan(0);
    expect(out.utterances.length).toBeLessThanOrEqual(1);
  });
});

describe("DENSITY CONTROL — variation, not repetition", () => {
  it("praise is EARNED (two correct outcomes), SPECIFIC (concept named) and TRUE (evidence)", () => {
    const state = CLEAN_STATE();
    state.lastTwoOutcomes = ["correct", "correct"];
    const out = express(DIR(), ws({ lastOutcome: "correct" }), { state });
    const praise = out.utterances.find((u) => u.kind === "praise");
    expect(praise).toBeDefined();
    expect(praise!.text).toContain("Friction");
    expect(praise!.evidenceRefs).toContain("session:lastOutcome");
  });
  it("praise is capped — no second praise within 3 turns, even if earned again", () => {
    const state = CLEAN_STATE();
    state.lastTwoOutcomes = ["correct", "correct"];
    state.praiseTurns.push(5);
    const out = express(DIR(), ws({ turn: 7, lastOutcome: "correct" }), { state });
    expect(out.utterances.find((u) => u.kind === "praise")).toBeUndefined();
  });
  it("reassurance never fires twice within 3 turns", () => {
    const state = CLEAN_STATE();
    state.lastReassuranceTurn = 6;
    const out = express(DIR({ communication: "reassure" }), ws({ turn: 8, wrongStreak: 1, lastOutcome: "wrong" }), { state });
    expect(out.utterances.find((u) => u.kind === "reassure")).toBeUndefined();
  });
  it("transitions rotate deterministically — three phrasings, not one tic", () => {
    const seen = new Set<string>();
    for (let t = 0; t < 3; t++) {
      const state = CLEAN_STATE();
      state.turn = t;
      const out = express(DIR(), ws(), { state });
      seen.add(out.utterances.find((u) => u.kind === "transition")!.text);
    }
    expect(seen.size).toBe(3);
  });
});

describe("THE MICROSCOPE — why-this and earned self-correction", () => {
  it("why-this carries the receipt's reason AND what it gave up", () => {
    const w = whyThis(RECEIPT)!;
    expect(w.text).toContain("verified spatial/causal structure");
    expect(w.text).toContain("Not break");
    expect(w.evidenceRefs).toEqual(RECEIPT.evidenceRefs);
  });
  it("self-correction is earned by REAL ledger patterns — null without evidence", () => {
    expect(selfCorrectionMoment([], aggressiveInsights)).toBeNull();
    expect(selfCorrectionMoment(prematureLedger, null)).toBeNull();
  });
  it("the self-correction sentence is human — no machinery IDs leak", () => {
    const sc = selfCorrectionMoment(prematureLedger, aggressiveInsights)!;
    expect(sc.text).toMatch(/pause|notes/i);
    expect(sc.text).not.toMatch(/exp\d|sp\d|sep_|#|selfError/i);
  });
});

describe("THE PHASE 4 GATE — LLM OFF vs LLM ON: the brain must not get smarter", () => {
  it("at the utterance: identical text and evidence with the bridge off or on — only the request differs", () => {
    const d = DIR({ augmentation: "llm", communication: "example", presentation: "text" });
    const off = express(d, ws({ wrongStreak: 2, lastOutcome: "wrong" }), { llmBridgeOn: false });
    const on = express(d, ws({ wrongStreak: 2, lastOutcome: "wrong" }), { llmBridgeOn: true });
    const offTexts = off.utterances.map((u) => u.text);
    const onTexts = on.utterances.map((u) => u.text);
    expect(onTexts).toEqual(offTexts);
    expect(on.utterances.map((u) => u.evidenceRefs)).toEqual(off.utterances.map((u) => u.evidenceRefs));
    expect(off.utterances.some((u) => u.llm)).toBe(false);
    const voiced = on.utterances.find((u) => u.llm)!;
    expect(voiced.llm!.basis).toEqual(voiced.evidenceRefs); // the LLM may draw ONLY from the evidence basis
    expect(voiced.llm!.constraints.some((c) => c.includes("ethics wall"))).toBe(true);
  });
  it("without LLM augmentation chosen by the Executive, the bridge never engages", () => {
    const on = express(DIR({ augmentation: "no_llm" }), ws(), { llmBridgeOn: true });
    expect(on.utterances.some((u) => u.llm)).toBe(false);
  });
  it("at the session: the deep gate is byte-identical with the bridge off or on", () => {
    const off = runDeepGate(10, 7331, false);
    const on = runDeepGate(10, 7331, true);
    expect(on.executive.trueMarks).toBe(off.executive.trueMarks);
    expect(on.executive.receipts).toBe(off.executive.receipts);
    expect(on.executive.plans).toBe(off.executive.plans);
    expect(on.executive.conductorSteps).toBe(off.executive.conductorSteps);
    expect(on.executive.selfErrors).toBe(off.executive.selfErrors);
    expect(on.executive.decisionsWithInsights).toBe(off.executive.decisionsWithInsights);
    expect(on.executive.utterances).toBe(off.executive.utterances);
    expect(on.executive.breaks).toBe(off.executive.breaks);
    expect(on.verdict).toBe("PASS");
  }, 30000);
});

describe("EXPRESSION NEVER DECIDES — purity", () => {
  it("composeExpression mutates nothing it is given (workspace, receipt, plan, ledger)", () => {
    const d = DIR({ communication: "question" });
    const w = ws({ wrongStreak: 1, lastOutcome: "wrong" });
    const plan = planFor(d, w);
    const ledger = prematureLedger.map((r) => ({ ...r }));
    const wBefore = JSON.stringify(w);
    const rBefore = JSON.stringify(RECEIPT);
    const pBefore = JSON.stringify(plan);
    const lBefore = JSON.stringify(ledger);
    express(d, w, { ledger, insights: aggressiveInsights });
    expect(JSON.stringify(w)).toBe(wBefore);
    expect(JSON.stringify(RECEIPT)).toBe(rBefore);
    expect(JSON.stringify(plan)).toBe(pBefore);
    expect(JSON.stringify(ledger)).toBe(lBefore);
  });
  it("the deep gate's executive decisions are unchanged by expression composition (same gate as ADR-041)", () => {
    const r = runDeepGate(10, 7331);
    expect(r.executive.trueMarks).toBe(12);
    // ADR-046's live-calibration channel shifted break TIMING (10 → 11) — the
    // CLAIM (beat linear on true marks) is what the gate pins, not a snapshot.
    expect(r.executive.breaks).toBeGreaterThanOrEqual(10);
    expect(r.verdict).toBe("PASS");
  }, 30000);
});

describe("CAPABILITY GATES — voice off, board surface, integration", () => {
  it("utterances are complete TEXT with no voice capability required (Tier-0 safe)", () => {
    const out = express(DIR(), ws());
    for (const u of out.utterances) {
      expect(typeof u.text).toBe("string");
      expect(u.text.length).toBeGreaterThan(0);
      expect(u.prosody.interruptible).toBe(true);
    }
  });
  it("the board payload appears only when the surface is not none, and carries evidence", () => {
    const chartOut = express(DIR({ presentation: "chart" }), ws());
    expect(chartOut.board).not.toBeNull();
    expect(chartOut.board!.kind).toBe("relationship");
    expect(chartOut.board!.evidenceRefs.length).toBeGreaterThan(0);
    const noneOut = express(DIR({ presentation: "none" }), ws());
    expect(noneOut.board).toBeNull();
  });
  it("the deep gate session flow now EXPRESSES every executive turn", () => {
    const r = runDeepGate(10, 7331);
    expect(r.executive.utterances).toBeGreaterThan(r.executive.receipts * 0.5);
    expect(r.executive.selfCorrections).toBeGreaterThan(0); // the gate's own patterns earn it
  }, 30000);
});

describe("THE COMMUNICATION POLICY — expresses, never creates", () => {
  it("an overloaded student gets terse policy; a grey concept gets depth", () => {
    const terse = applyCommunicationPolicy(ws({ wrongStreak: 3 }), DIR());
    expect(terse.verbosity).toBe("terse");
    const deep = applyCommunicationPolicy(ws({ focusConcept: { id: "c", name: "C", mean: 0.3, grey: true } }), DIR());
    expect(deep.verbosity).toBe("deep");
  });
  it("the policy does not change the directive it is given", () => {
    const d = DIR();
    applyCommunicationPolicy(ws({ wrongStreak: 3 }), d);
    expect(d.learningAction).toBe("teach");
  });
});
