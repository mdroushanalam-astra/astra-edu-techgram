/**
 * THE S4 STRATEGY-EXPERIMENT RUNTIME [ADR-037 levels 1–2, ADR-040 follow-on] —
 * self-improvement as a LIVE loop, not a stored demo. The developmental loop
 * (developmental-session.ts) accumulates self-errors; when a pattern is strong
 * enough, this runtime:
 *
 *   1. PROPOSES a falsifiable strategy change (a parameter delta with a
 *      stated observation — proposeStrategy),
 *   2. TESTS it in a MATCHED A/B simulation: identical world, identical seeds,
 *      identical student truth — ONLY the strategy parameter differs
 *      (makeStrategyHarness + runStrategyExperiment),
 *   3. KEEPS or REJECTS it on an EXTERNAL metric (true learning, not
 *      self-reported benefit) via the S4 organ (runSelfImprovementExperiment),
 *   4. The kept parameters become the session's adopted strategy — future
 *      decisions run under them (DevelopmentalSession config.strategy).
 *
 * Laws honored: the proposal needs EVIDENCE (≥3 pattern errors — no evidence,
 * no proposal); the evaluation is external to the proposer (the simulator's
 * world, not the Executive's own scoring); a rejected experiment changes
 * NOTHING; the parameter space is the Executive's OWN tunables (StrategyParameters)
 * — frozen-organ parameters are untouchable (ownership boundaries).
 * The experiment record is append-only evidence [EXPERIMENTS §18].
 */
import { makeRng } from "../linalg.js";
import {
  decide, DEFAULT_STRATEGY,
  type StrategyParameters, type TurnWorkspace, type ExecutiveDirective,
} from "./executive.js";
import {
  runSelfImprovementExperiment,
  type StrategyExperiment,
} from "./self-development.js";
import type { SelfErrorRecord } from "./self-development.js";

/** A falsifiable strategy proposal: an observation, a parameter, a delta. */
export interface StrategyProposal {
  id: string;
  /** The ledger evidence that motivates the change (the observation half of the hypothesis). */
  observation: string;
  /** Which of the Executive's OWN tunables changes. */
  param: keyof StrategyParameters;
  from: number;
  to: number;
  /** Level 1 = parameter, Level 2 = strategy [ADR-037]. Level 3 (representation) is future work. */
  level: 1 | 2;
}

const MIN_PATTERN_EVIDENCE = 3;

/**
 * Turn a self-error ledger into AT MOST ONE strategy proposal. Deterministic;
 * ordered by evidence strength; refuses to propose without a pattern (≥3
 * same-tag errors); refuses to push a parameter past its sane bound. Returns
 * null when there is nothing worth testing — no evidence, no experiment.
 */
export function proposeStrategy(
  ledger: SelfErrorRecord[],
  current: StrategyParameters = DEFAULT_STRATEGY,
): StrategyProposal | null {
  let breakMissed = 0, breakEarly = 0, interventionWasted = 0, interventionMissed = 0, confidenceErrors = 0;
  for (const r of ledger) {
    if (r.patternHypothesis === "break-calibration") {
      if (r.error.includes("premature")) breakEarly++; else breakMissed++;
    } else if (r.patternHypothesis === "intervention-timing") {
      if (r.error.includes("did not help")) interventionWasted++; else interventionMissed++;
    } else if (r.patternHypothesis === "confidence") {
      confidenceErrors++;
    }
  }
  const r2 = (x: number) => Math.round(x * 100) / 100;
  if (breakMissed >= MIN_PATTERN_EVIDENCE && breakMissed > breakEarly && current.reluctantBreakBoost < 2.0) {
    return {
      id: `sep_breakboost_${r2(current.reluctantBreakBoost)}`,
      observation: `${breakMissed} fatigue collapses without a break — the self-model says I under-break`,
      param: "reluctantBreakBoost",
      from: current.reluctantBreakBoost,
      to: Math.min(2.0, r2(current.reluctantBreakBoost + 0.25)),
      level: 1,
    };
  }
  if (breakEarly >= MIN_PATTERN_EVIDENCE && breakEarly > breakMissed && current.aggressiveBreakQuiet > 0.3) {
    return {
      id: `sep_breakquiet_${r2(current.aggressiveBreakQuiet)}`,
      observation: `${breakEarly} premature breaks — the self-model says I over-break`,
      param: "aggressiveBreakQuiet",
      from: current.aggressiveBreakQuiet,
      to: Math.max(0.3, r2(current.aggressiveBreakQuiet - 0.1)),
      level: 1,
    };
  }
  if (interventionMissed >= MIN_PATTERN_EVIDENCE && interventionMissed > interventionWasted && current.lateInterventionLean < 2.0) {
    return {
      id: `sep_lean_${r2(current.lateInterventionLean)}`,
      observation: `${interventionMissed} missed intervention horizons — I under-intervene when students struggle`,
      param: "lateInterventionLean",
      from: current.lateInterventionLean,
      to: Math.min(2.0, r2(current.lateInterventionLean + 0.2)),
      level: 2,
    };
  }
  if (interventionWasted >= MIN_PATTERN_EVIDENCE && interventionWasted > interventionMissed && current.earlyDiagnoseBenefit < 0.4) {
    return {
      id: `sep_diagnose_${r2(current.earlyDiagnoseBenefit)}`,
      observation: `${interventionWasted} interventions that did not help — evidence-first should be valued higher`,
      param: "earlyDiagnoseBenefit",
      from: current.earlyDiagnoseBenefit,
      to: Math.min(0.4, r2(current.earlyDiagnoseBenefit + 0.05)),
      level: 2,
    };
  }
  if (confidenceErrors >= 5 && current.cautionMargin < 0.08) {
    return {
      id: `sep_caution_${r2(current.cautionMargin)}`,
      observation: `${confidenceErrors} confidence miscalibrations — my benefit estimates need a wider margin`,
      param: "cautionMargin",
      from: current.cautionMargin,
      to: Math.min(0.08, r2(current.cautionMargin + 0.01)),
      level: 1,
    };
  }
  return null;
}

/* ── the matched A/B harness ─────────────────────────────────────────────── */

/** The harness world: same declared constants as the deep gate, compact. */
export interface SimProfile {
  /** Study turns per simulated session. */
  turns: number;
  /** Fatigue added per study turn (deep-gate world: 0.13). */
  fatigueRise: number;
  startFatigue: number;
  /** Believed mean of the (single) focus concept. */
  mean: number;
  uncertainties: number;
  /** Learning follows the outcome [EXPERIMENTS §17]: correct vs failed attempt. */
  correctGain: number;
  wrongGain: number;
  /** The incumbent's base benefit, fatigue-discounted by the deep-gate rule base×(1−f·0.5). Concepts differ in value. */
  incumbentBaseBenefit: number;
  /** Session-contract overrides the harness needs for headroom. */
  maxBreaks: number;
  minGapBetweenInterventions: number;
  /** The FIXED self-model tendency the arms run under — the tendency the hypothesis is about. */
  tendency: {
    interventionTendency: "early" | "balanced" | "late";
    breakCalibration: "aggressive" | "balanced" | "reluctant";
  };
}

export const BASE_SIM_PROFILE: SimProfile = {
  turns: 16, fatigueRise: 0.16, startFatigue: 0.3,
  mean: 0.55, uncertainties: 2,
  correctGain: 0.07, wrongGain: 0.015,
  incumbentBaseBenefit: 0.4,
  maxBreaks: 6, minGapBetweenInterventions: 0,
  tendency: { interventionTendency: "balanced", breakCalibration: "reluctant" },
};

const SIM_STUDY: ExecutiveDirective = { learningAction: "retrieve", communication: "explain", presentation: "board", augmentation: "no_llm" };

/**
 * Build the matched simulator: (params, seed) → true learning (Σ mastery gain).
 * BOTH arms run the SAME world and the SAME answer stream per seed; the ONLY
 * difference is the strategy parameter under test. The self-error count is
 * fixed (4) so the caution lever is armed identically for both arms.
 */
export function makeStrategyHarness(
  profile: SimProfile,
): (params: StrategyParameters, seed: number) => number {
  return (params, seed) => {
    const rng = makeRng(seed);
    let fatigue = profile.startFatigue;
    let mastery = 0.25;
    let wrongStreak = 0;
    let breaks = 0;
    let lastOutcome: "correct" | "wrong" | null = null;
    let learning = 0;
    for (let turn = 1; turn <= profile.turns; turn++) {
      const w: TurnWorkspace = {
        turn, elapsedMin: turn * 8, timeLeftMin: 80 - turn * 8, turnsRemaining: profile.turns - turn,
        focusConcept: { id: "sim_focus", name: "SimConcept", mean: profile.mean, grey: profile.mean < 0.35 },
        alternativeConcept: null,
        uncertainties: profile.uncertainties, hypothesisCount: 1,
        momentum: 0.4, frustration: 0.2, fatigue,
        wrongStreak, lastOutcome,
        planProgress: { done: turn - 1, total: profile.turns },
        counts: { jokes: 0, llm: 0, breaks, sinceLastIntervention: turn },
        visualStructure: false,
        incumbentMove: { kind: "study", conceptId: "sim_focus", conceptName: "SimConcept" },
        selfInsights: {
          recurringPatterns: [],
          interventionTendency: profile.tendency.interventionTendency,
          breakCalibration: profile.tendency.breakCalibration,
          selfErrorCount: 4,
          strategy: params, // ← THE ONLY THING THAT DIFFERS BETWEEN ARMS
        },
      };
      // Fatigue-honest incumbent, same rule as the deep gate (declared): the
      // concept's base value discounted by the fatigue the turn would add.
      const incumbent = { directive: SIM_STUDY, predictedBenefit: profile.incumbentBaseBenefit * (1 - fatigue * 0.5) };
      const { directive } = decide(w, incumbent, seed * 1000 + turn, {
        maxJokes: 2, maxLLM: 2, maxBreaks: profile.maxBreaks,
        minGapBetweenInterventions: profile.minGapBetweenInterventions, minTeachingRatio: 0.6,
      });
      if (directive.learningAction === "break") {
        breaks++;
        fatigue = Math.max(0, fatigue - 0.5);
        lastOutcome = null;
        continue;
      }
      const eff = Math.max(0.15, 1 - fatigue * 0.8);
      const pCorrect = Math.max(0.1, mastery - fatigue * 0.35);
      const isCorrect = rng.next() < pCorrect;
      const gain = (isCorrect ? profile.correctGain : profile.wrongGain) * eff;
      mastery = Math.min(0.95, mastery + gain);
      learning += gain;
      fatigue = Math.min(1, fatigue + profile.fatigueRise);
      wrongStreak = isCorrect ? 0 : wrongStreak + 1;
      lastOutcome = isCorrect ? "correct" : "wrong";
    }
    return learning;
  };
}

export interface StrategyExperimentResult {
  kept: boolean;
  /** The append-only S4 record (with the real A/B numbers in `result`). */
  record: StrategyExperiment;
  /** The parameters future sessions run under (changed ONLY on keep). */
  adopted: StrategyParameters;
  oldMetric: number;
  newMetric: number;
  evaluatedBy: "external" | "simulator";
}

/**
 * Run the matched A/B over several seeds (noise-robust), then let the S4 organ
 * rule keep/reject. A tie REJECTS (conservative: a change must EARN adoption).
 */
export function runStrategyExperiment(
  proposal: StrategyProposal,
  simulate: (params: StrategyParameters, seed: number) => number,
  seeds: number[],
  current: StrategyParameters = DEFAULT_STRATEGY,
): StrategyExperimentResult {
  const armA: StrategyParameters = { ...current, [proposal.param]: proposal.from };
  const armB: StrategyParameters = { ...current, [proposal.param]: proposal.to };
  let oldSum = 0, newSum = 0;
  for (const s of seeds) {
    oldSum += simulate(armA, s);
    newSum += simulate(armB, s);
  }
  const n = Math.max(1, seeds.length);
  const oldMetric = oldSum / n;
  const newMetric = newSum / n;
  const { kept, record } = runSelfImprovementExperiment(
    {
      id: proposal.id,
      observation: proposal.observation,
      change: `${proposal.param}: ${proposal.from} → ${proposal.to} (level ${proposal.level})`,
      level: proposal.level,
    },
    { old: oldMetric, new: newMetric },
  );
  return {
    kept,
    record,
    adopted: kept ? { ...current, [proposal.param]: proposal.to } : current,
    oldMetric,
    newMetric,
    evaluatedBy: record.evaluatedBy,
  };
}
