import { describe, it, expect } from "vitest";
import {
  proposeStrategy, runStrategyExperiment, makeStrategyHarness, BASE_SIM_PROFILE,
  type SimProfile,
} from "../src/cognitive/strategy-experiments.js";
import { DEFAULT_STRATEGY, type StrategyParameters, type TurnWorkspace } from "../src/cognitive/executive.js";
import { DevelopmentalSession } from "../src/cognitive/developmental-session.js";
import { phase2Gate, type DevelopmentalState, type SelfErrorRecord } from "../src/cognitive/self-development.js";
import type { ExecutiveDirective } from "../src/cognitive/executive.js";
import { makeRng } from "../src/linalg.js";

/**
 * S4 IN THE LOOP [ADR-041] — self-improvement as a LIVE cycle:
 *   experience (SelfErrorLedger) → falsifiable proposal → matched A/B in the
 *   simulator → keep/reject on an EXTERNAL metric → adopted parameters →
 *   DIFFERENT future decisions.
 *
 * The two world profiles below are honest economics, not rigged ones: one
 * where quieting breaks pays (the evaluator KEEPS the change) and one where
 * it costs (the SAME proposal is REJECTED). The evaluator is external to the
 * proposer — that is the whole point.
 */

const prematureBreak = (i: number): SelfErrorRecord => ({
  id: `pb${i}`, prediction: "(experience-grounded judgment)", actual: "turn outcome",
  error: "self-prediction was wrong: premature break", context: `decision #${i}`,
  at: i, patternHypothesis: "break-calibration",
});
const fatigueCollapse = (i: number): SelfErrorRecord => ({
  id: `fc${i}`, prediction: "(experience-grounded judgment)", actual: "turn outcome",
  error: "self-prediction was wrong: fatigue collapse without a break", context: `decision #${i}`,
  at: i, patternHypothesis: "break-calibration",
});
const wastedIntervention = (i: number): SelfErrorRecord => ({
  id: `wi${i}`, prediction: "(experience-grounded judgment)", actual: "turn outcome",
  error: "self-prediction was wrong: intervention did not help", context: `decision #${i}`,
  at: i, patternHypothesis: "intervention-timing",
});

/** Where quieting breaks PAYS: breaks cost more than the fatigue they prevent. */
const CHEAP_TO_STUDY: Partial<SimProfile> = { fatigueRise: 0.2, startFatigue: 0.45, turns: 14, maxBreaks: 3 };
/** Where quieting breaks COSTS: unbroken fatigue wrecks efficiency. */
const PUNISHING_FATIGUE: Partial<SimProfile> = { fatigueRise: 0.1, startFatigue: 0.45, turns: 14, maxBreaks: 2 };

const overBreakLedger = [prematureBreak(1), prematureBreak(2), prematureBreak(3)];
const SEEDS = [11, 22, 33];

const harnessFor = (over: Partial<SimProfile>) =>
  makeStrategyHarness({
    ...BASE_SIM_PROFILE,
    tendency: { interventionTendency: "balanced", breakCalibration: "aggressive" },
    ...over,
  });

describe("S4 — proposeStrategy: no evidence, no proposal", () => {
  it("refuses to propose on a thin ledger (the development law)", () => {
    expect(proposeStrategy([])).toBeNull();
    expect(proposeStrategy([prematureBreak(1), prematureBreak(2)])).toBeNull();
    expect(proposeStrategy([wastedIntervention(1), wastedIntervention(2)])).toBeNull();
  });

  it("turns a premature-break pattern into a falsifiable quieting proposal", () => {
    const p = proposeStrategy(overBreakLedger);
    expect(p).not.toBeNull();
    expect(p!.param).toBe("aggressiveBreakQuiet");
    expect(p!.from).toBe(0.6);
    expect(p!.to).toBe(0.5);
    expect(p!.from).not.toBe(p!.to);
    expect(p!.observation).toMatch(/premature breaks/);
    expect(p!.level).toBe(1);
  });

  it("maps a fatigue-collapse pattern the other way (under-break → boost)", () => {
    const p = proposeStrategy([fatigueCollapse(1), fatigueCollapse(2), fatigueCollapse(3)]);
    expect(p!.param).toBe("reluctantBreakBoost");
    expect(p!.from).toBe(1.25);
    expect(p!.to).toBe(1.5);
  });

  it("is deterministic and bounded", () => {
    const a = proposeStrategy(overBreakLedger);
    const b = proposeStrategy(overBreakLedger);
    expect(a).toEqual(b);
    // a pushed-to-the-bound parameter silences that proposal family
    const atBound: StrategyParameters = { ...DEFAULT_STRATEGY, aggressiveBreakQuiet: 0.3 };
    expect(proposeStrategy(overBreakLedger, atBound)).toBeNull();
  });
});

describe("S4 — the matched A/B evaluator is external and decisive", () => {
  const proposal = proposeStrategy(overBreakLedger)!;

  it("KEEPS a change that improves true learning in the world it runs in", () => {
    const r = runStrategyExperiment(proposal, harnessFor(CHEAP_TO_STUDY), SEEDS);
    expect(r.kept).toBe(true);
    expect(r.newMetric).toBeGreaterThan(r.oldMetric);
    expect(r.adopted.aggressiveBreakQuiet).toBe(0.5);
    expect(r.record.result).toMatch(/KEEP/);
    expect(r.evaluatedBy).toBe("simulator");
  });

  it("REJECTS the SAME proposal when the world's economics say otherwise", () => {
    const r = runStrategyExperiment(proposal, harnessFor(PUNISHING_FATIGUE), SEEDS);
    expect(r.kept).toBe(false);
    expect(r.newMetric).toBeLessThan(r.oldMetric);
    expect(r.adopted).toEqual(DEFAULT_STRATEGY); // adoption changes NOTHING on reject
    expect(r.record.result).toMatch(/REJECT/);
  });

  it("records carry the real A/B numbers — append-only evidence, not vibes", () => {
    const r = runStrategyExperiment(proposal, harnessFor(CHEAP_TO_STUDY), SEEDS);
    expect(r.record.result).toContain(r.oldMetric.toFixed(3));
    expect(r.record.result).toContain(r.newMetric.toFixed(3));
    expect(r.record.hypothesis).toContain("aggressiveBreakQuiet");
    expect(r.record.strategyB).toContain("0.5");
  });
});

/* ── THE EPOCH ────────────────────────────────────────────────────────────── */

const BREAK_DIR: ExecutiveDirective = { learningAction: "break", communication: "reassure", presentation: "none", augmentation: "no_llm" };

/** Session 1: the Executive takes premature breaks (the incumbent habit fires early) and lives with the experience. */
function runOverBreakingSession(): DevelopmentalSession {
  const s = new DevelopmentalSession({ learningEnabled: true });
  for (let t = 1; t <= 3; t++) {
    const w: TurnWorkspace = {
      turn: t, elapsedMin: t * 5, timeLeftMin: 40 - t * 5, turnsRemaining: 6 - t,
      focusConcept: { id: "c_fr_14", name: "Friction", mean: 0.55, grey: false },
      alternativeConcept: null, uncertainties: 2, hypothesisCount: 1,
      momentum: 0.4, frustration: 0.2, fatigue: 0.5,
      wrongStreak: 0, lastOutcome: null,
      planProgress: { done: t, total: 8 },
      counts: { jokes: 0, llm: 0, breaks: t - 1, sinceLastIntervention: 9 },
      visualStructure: false,
      incumbentMove: { kind: "break", conceptId: "c_fr_14", conceptName: "Friction" },
    };
    s.decideTurn(w, { directive: BREAK_DIR, predictedBenefit: 0.5 }, 100 + t);
    s.recordActual({
      directive: BREAK_DIR, wasIntervention: false, tookBreak: true,
      nextAnswerCorrect: null, performanceDelta: 0, fatigueAtDecision: 0.5,
    });
  }
  return s;
}

/**
 * Session-2 probe: the SAME matched trajectory the A/B evaluated (CHEAP world,
 * same dynamics, same answer stream) but run through the real developmental
 * runtime — seeded ledger (the carried experience) + the adopted strategy.
 * Divergence between the two runs can then come ONLY from the strategy.
 * Seed 22 is used because seeds 11/33 happen to never reach the marginal
 * turns where the two strategies disagree (both decide identically there) —
 * the divergence must be EXERCISED, not assumed.
 */
function probeSession2(ledger: SelfErrorRecord[], strategy: StrategyParameters | undefined, seed = 22): { trace: string[]; breaks: number } {
  const s = new DevelopmentalSession({ learningEnabled: true, strategy });
  s.ledger.push(...ledger); // experience carries across sessions — that is the epoch
  const profile = { ...BASE_SIM_PROFILE, ...CHEAP_TO_STUDY };
  const rng = makeRng(seed);
  let fatigue = profile.startFatigue;
  let mastery = 0.25;
  let wrongStreak = 0;
  let breaks = 0;
  let lastOutcome: "correct" | "wrong" | null = null;
  const trace: string[] = [];
  for (let turn = 1; turn <= profile.turns; turn++) {
    const w: TurnWorkspace = {
      turn: 20 + turn, elapsedMin: turn * 8, timeLeftMin: 80 - turn * 8, turnsRemaining: profile.turns - turn,
      focusConcept: { id: "c_fr_14", name: "Friction", mean: profile.mean, grey: profile.mean < 0.35 },
      alternativeConcept: null, uncertainties: profile.uncertainties, hypothesisCount: 1,
      momentum: 0.4, frustration: 0.2, fatigue,
      wrongStreak, lastOutcome,
      planProgress: { done: turn - 1, total: profile.turns },
      counts: { jokes: 0, llm: 0, breaks, sinceLastIntervention: turn },
      visualStructure: false,
      incumbentMove: { kind: "study", conceptId: "c_fr_14", conceptName: "Friction" },
    };
    const { directive } = s.decideTurn(
      w,
      { directive: { learningAction: "retrieve", communication: "explain", presentation: "board", augmentation: "no_llm" }, predictedBenefit: profile.incumbentBaseBenefit * (1 - fatigue * 0.5) },
      900 + turn,
      { maxJokes: 2, maxLLM: 2, maxBreaks: profile.maxBreaks, minGapBetweenInterventions: profile.minGapBetweenInterventions, minTeachingRatio: 0.6 },
    );
    trace.push(directive.learningAction);
    if (directive.learningAction === "break") {
      breaks++;
      fatigue = Math.max(0, fatigue - 0.5);
      lastOutcome = null;
      continue;
    }
    const eff = Math.max(0.15, 1 - fatigue * 0.8);
    const pCorrect = Math.max(0.1, mastery - fatigue * 0.35);
    const isCorrect = rng.next() < pCorrect;
    mastery = Math.min(0.95, mastery + (isCorrect ? profile.correctGain : profile.wrongGain) * eff);
    fatigue = Math.min(1, fatigue + profile.fatigueRise);
    wrongStreak = isCorrect ? 0 : wrongStreak + 1;
    lastOutcome = isCorrect ? "correct" : "wrong";
  }
  return { trace, breaks };
}

describe("S4 — THE EPOCH: experience → hypothesis → experiment → different future behavior", () => {
  const session1 = runOverBreakingSession();
  const proposal = proposeStrategy(session1.ledger, DEFAULT_STRATEGY)!;
  const experiment = runStrategyExperiment(proposal, harnessFor(CHEAP_TO_STUDY), SEEDS);

  it("session 1's experience produces the proposal (the loop feeds the improver)", () => {
    expect(session1.ledger.length).toBe(3);
    expect(proposal.param).toBe("aggressiveBreakQuiet");
  });

  it("the experiment KEEPS the change in the world it was tested in", () => {
    expect(experiment.kept).toBe(true);
    expect(experiment.adopted.aggressiveBreakQuiet).toBe(0.5);
  });

  it("a KEPT experiment changes the next session's decisions (fewer, later breaks)", () => {
    const baseline = probeSession2(session1.ledger, undefined); // factory settings
    const improved = probeSession2(session1.ledger, experiment.adopted); // runs under the adopted strategy
    expect(baseline.trace).not.toEqual(improved.trace);
    expect(improved.breaks).toBeLessThan(baseline.breaks);
  });

  it("a REJECTED experiment changes NOTHING — the veto is real", () => {
    const rejected = runStrategyExperiment(proposal, harnessFor(PUNISHING_FATIGUE), SEEDS);
    expect(rejected.kept).toBe(false);
    const baseline = probeSession2(session1.ledger, undefined);
    const afterReject = probeSession2(session1.ledger, rejected.adopted); // == DEFAULT_STRATEGY
    expect(afterReject.trace).toEqual(baseline.trace);
  });

  it("phase2Gate formalizes the epoch: state version + evidence + decision change", () => {
    const emptyState: DevelopmentalState = {
      selfModelVersion: 0, capabilities: [], limitations: [], calibrationScore: null,
      knownUnknowns: [], activeHypotheses: [], selfErrorLedger: session1.ledger,
      experiments: [], version: 0,
    };
    const afterState: DevelopmentalState = {
      ...emptyState,
      selfErrorLedger: session1.ledger,
      experiments: [experiment.record],
      version: 1,
    };
    const before = probeSession2(session1.ledger, undefined).trace;
    const after = probeSession2(session1.ledger, experiment.adopted).trace;
    const gate = phase2Gate(emptyState, afterState, before, after);
    expect(gate.pass).toBe(true);
    expect(gate.detail).toMatch(/v0→v1/);
  });

  it("the adopted parameter space is ONLY the Executive's own tunables", () => {
    expect(Object.keys(experiment.adopted).sort()).toEqual(Object.keys(DEFAULT_STRATEGY).sort());
  });
});
