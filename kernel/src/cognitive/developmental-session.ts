/**
 * THE DEVELOPMENTAL SESSION LOOP [Phase 2 integration] — where the S-series
 * (self-development.ts) is COMPOSED INTO the Executive's decision pipeline
 * (executive.ts). This file is the causal chain the Phase 2 gate demands:
 *
 *   experience → self-prediction (S1, before deciding) → decision
 *   → outcome → self-error (S2, structural judgment) → SelfErrorLedger
 *   → derived self-insights → DIFFERENT next decision.
 *
 * Judgments here are STRUCTURAL (category vs. measured actual), not the string
 * overlap of checkSelfPrediction — a self-prediction is checked against what
 * actually happened this turn, not against wording. The ledger it produces is
 * compatible with detectPatterns() and phase2Gate().
 *
 * The counterfactual is a constructor flag: `learningEnabled: false` records
 * the same experience but never injects insights into decisions — run both and
 * compare the decision traces to prove the loop is closed.
 */
import {
  decide, type TurnWorkspace, type ExecutiveDirective, type ExecutiveReceipt,
  type ConstraintLimits,
} from "./executive.js";
import {
  selfPredict, detectPatterns,
  type SelfPrediction, type SelfErrorRecord,
} from "./self-development.js";

/** What the system knows about itself, injected into the workspace. */
export type SelfInsights = NonNullable<TurnWorkspace["selfInsights"]>;

/** The measured outcome of one executed turn — the experience half of the loop. */
export interface TurnActual {
  /** The directive that was ACTUALLY executed (after any wall/constraint). */
  directive: ExecutiveDirective;
  /** Was this turn a deviation from the incumbent plan (a real intervention)? */
  wasIntervention: boolean;
  tookBreak: boolean;
  /** The student's next answer after this turn (null when the turn took no answer). */
  nextAnswerCorrect: boolean | null;
  /** Measured learning progress this turn (mastery delta or equivalent). */
  performanceDelta: number;
  /** Fatigue level the workspace showed when the decision was made. */
  fatigueAtDecision: number;
}

/** Judge one self-prediction against the turn's actual. */
type Judgment =
  | { kind: "stood" }                       // prediction held — no record
  | { kind: "deferred" }                    // horizon not exhausted (intervention window)
  | { kind: "correct" }                     // prediction confirmed within its window
  | { kind: "error"; error: string; hypothesis: string };

function judgePrediction(sp: SelfPrediction, actual: TurnActual): Judgment {
  const ans = actual.nextAnswerCorrect;
  switch (sp.category) {
    case "decision": {
      // "I predict my confidence in this decision is moderate/low"
      const predictedLow = sp.prediction.includes("low");
      if (ans === null) return { kind: "stood" };
      if (predictedLow && ans) return { kind: "error", error: "self-prediction was wrong: under-confident decision", hypothesis: "confidence" };
      if (!predictedLow && !ans) return { kind: "error", error: "self-prediction was wrong: over-confident decision", hypothesis: "confidence" };
      return { kind: "correct" };
    }
    case "performance": {
      // "I predict my learning efficiency is degraded by fatigue"
      if (ans === false) return { kind: "correct" }; // degradation was real
      if (ans === true && actual.performanceDelta < 0.03 && actual.fatigueAtDecision > 0.6) {
        return { kind: "error", error: "self-prediction was wrong: fatigue degradation over-predicted", hypothesis: "fatigue-model" };
      }
      return { kind: "stood" };
    }
    case "uncertainty": {
      // "I predict this concept needs more evidence before I can teach it well"
      if (ans === null) return { kind: "stood" };
      if (ans && actual.performanceDelta >= 0.05) {
        return { kind: "error", error: "self-prediction was wrong: teach-readiness under-predicted", hypothesis: "readiness" };
      }
      return { kind: "correct" };
    }
    case "intervention": {
      // "I predict I will intervene within 2 turns" — a horizon, not an instant.
      if (actual.wasIntervention) return { kind: "correct" };
      return { kind: "deferred" };
    }
  }
}

/** Derive the Executive's self-insights from the accumulated SelfErrorLedger. */
export function deriveSelfInsights(ledger: SelfErrorRecord[]): SelfInsights {
  let interventionWasted = 0, interventionMissed = 0;
  let breakEarly = 0, breakMissed = 0;
  for (const r of ledger) {
    if (r.patternHypothesis === "intervention-timing") {
      if (r.error.includes("did not help")) interventionWasted++; else interventionMissed++;
    }
    if (r.patternHypothesis === "break-calibration") {
      if (r.error.includes("premature")) breakEarly++; else breakMissed++;
    }
  }
  return {
    recurringPatterns: detectPatterns(ledger),
    interventionTendency:
      interventionWasted > interventionMissed ? "early" :
      interventionMissed > interventionWasted ? "late" : "balanced",
    breakCalibration:
      breakEarly > breakMissed ? "aggressive" :
      breakMissed > breakEarly ? "reluctant" : "balanced",
    selfErrorCount: ledger.length,
  };
}

export interface TurnDecision {
  directive: ExecutiveDirective;
  receipt: ExecutiveReceipt;
  /** The self-predictions emitted BEFORE this decision (S1). */
  selfPredictions: SelfPrediction[];
  /** The insights injected into the workspace for this decision (null = none yet, or learning disabled). */
  insightsUsed: SelfInsights | null;
}

export interface DevelopmentalConfig {
  /**
   * THE COUNTERFACTUAL SWITCH. When true, derived insights are injected into
   * every decision. When false, experience is still recorded (the ledger still
   * grows — the system still HAS experiences) but never changes a decision.
   */
  learningEnabled: boolean;
}

/** The intervention horizon, in turns, for "I will intervene within N turns". */
const INTERVENTION_HORIZON = 2;

/**
 * One session's developmental runtime. Per turn:
 *   decideTurn()  — S1 self-predictions BEFORE deciding; insights injected.
 *   recordActual()— S2 structural judging; ledger grows; insights re-derived.
 */
export class DevelopmentalSession {
  readonly ledger: SelfErrorRecord[] = [];
  readonly decisions: TurnDecision[] = [];
  private pending: { sp: SelfPrediction; turnsLeft: number }[] = [];
  private readonly config: DevelopmentalConfig;

  constructor(config: DevelopmentalConfig = { learningEnabled: true }) {
    this.config = config;
  }

  /** What the system currently knows about itself (null until first experience). */
  insights(): SelfInsights | null {
    if (this.ledger.length === 0) return null;
    return deriveSelfInsights(this.ledger);
  }

  /** THE DECISION, developmentally wrapped: predict → consult self-model → decide. */
  decideTurn(
    w: TurnWorkspace,
    incumbent: { directive: ExecutiveDirective; predictedBenefit: number },
    seed: number,
    limits: ConstraintLimits | undefined = undefined,
  ): TurnDecision {
    // S1 — before ANY decision, the system predicts its own behavior.
    const sps = selfPredict(w.turn, w.fatigue, w.wrongStreak, w.focusConcept.mean);
    this.pending.push(...sps.map((sp) => ({ sp, turnsLeft: INTERVENTION_HORIZON })));
    // The self-model consultation: insights (if any) enter the workspace.
    const insights = this.config.learningEnabled ? this.insights() : null;
    const workspace: TurnWorkspace = insights ? { ...w, selfInsights: insights } : w;
    const { directive, receipt } = decide(workspace, incumbent, seed, limits);
    const td: TurnDecision = { directive, receipt, selfPredictions: sps, insightsUsed: insights };
    this.decisions.push(td);
    return td;
  }

  /** THE EXPERIENCE: judge the turn's self-predictions against what actually happened. */
  recordActual(actual: TurnActual): SelfErrorRecord[] {
    const errors: SelfErrorRecord[] = [];
    const at = this.decisions.length;

    // 1. Judge pending self-predictions (S1 → S2).
    const stillPending: typeof this.pending = [];
    for (const p of this.pending) {
      const j = judgePrediction(p.sp, actual);
      if (j.kind === "deferred") {
        p.turnsLeft -= 1;
        if (p.turnsLeft > 0) stillPending.push(p);
        else errors.push(this.record(p.sp, "self-prediction was wrong: missed intervention horizon", "intervention-timing", at));
      } else if (j.kind === "error") {
        errors.push(this.record(p.sp, j.error, j.hypothesis, at));
      }
      // stood / correct → no record (only ERRORS accumulate — the ledger is not a diary)
    }
    this.pending = stillPending;

    // 2. Experience-grounded judgment, independent of predictions: did an
    //    intervention actually help? Did a break land where it should?
    if (actual.wasIntervention && actual.nextAnswerCorrect === false && actual.performanceDelta <= 0.02) {
      errors.push(this.errRecord("self-prediction was wrong: intervention did not help", "intervention-timing", at));
    }
    if (actual.tookBreak && actual.fatigueAtDecision < 0.6) {
      errors.push(this.errRecord("self-prediction was wrong: premature break", "break-calibration", at));
    }
    if (!actual.tookBreak && actual.fatigueAtDecision >= 0.9 && actual.nextAnswerCorrect === false) {
      errors.push(this.errRecord("self-prediction was wrong: fatigue collapse without a break", "break-calibration", at));
    }

    this.ledger.push(...errors);
    return errors;
  }

  private record(sp: SelfPrediction, error: string, hypothesis: string, at: number): SelfErrorRecord {
    return {
      id: sp.id, prediction: sp.prediction,
      actual: "turn outcome", error,
      context: `turn ${sp.turn}, category ${sp.category}, decision #${at}`,
      at, patternHypothesis: hypothesis,
    };
  }

  private errRecord(error: string, hypothesis: string, at: number): SelfErrorRecord {
    return {
      id: `exp${at}_${hypothesis}`, prediction: "(experience-grounded judgment)",
      actual: "turn outcome", error,
      context: `decision #${at}`, at, patternHypothesis: hypothesis,
    };
  }
}
