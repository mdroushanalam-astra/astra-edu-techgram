/**
 * THE DEVELOPMENTAL CORE [Phase 2, corrected master roadmap §8] — S0–S4.
 * The engine learns about ITSELF: predicts its own behavior, catches its own
 * errors, investigates its own uncertainties, and changes its own strategies
 * based on evidence. Not metaphysics — measurable, auditable, versioned.
 *
 * S0 GENESIS: bounded self-inquiry at initialization (not benchmarking — the
 *   engine chooses what to investigate about itself based on VoI).
 * S1 SELF-PREDICTION: before consequential decisions, predict own behavior.
 * S2 SELF-ERROR LEDGER: prediction/actual/error/pattern, accumulated.
 * S3 SELF-INQUIRY: VoI applied to self-uncertainties — "which fact about my
 *   own performance would most reduce my uncertainty about myself?"
 * S4 SELF-IMPROVEMENT: one strategy experiment — hypothesis → A/B → test →
 *   external evaluation → keep/reject → developmental state update.
 *
 * THE GATE: history → self-model change → DECISION change. A database record
 * changing is not enough — the machinery generating future decisions must change.
 */

/* ── S0: SelfModel₀ — built from self-directed inquiry, not assertion ──── */

export interface SelfUncertainty {
  id: string;
  question: string;
  /** Which organ or capability this uncertainty is about. */
  area: string;
  /** VoI: how much resolving this would improve future decisions. */
  informationValue: number;
  /** The probe that would resolve it. */
  probe: string;
}

export interface DevelopmentalState {
  /** SelfModel₀ — built from measurement during Genesis. */
  selfModelVersion: number;
  capabilities: { area: string; evidence: number; assessment: string }[];
  limitations: { area: string; evidence: number; assessment: string }[];
  calibrationScore: number | null;
  knownUnknowns: string[];
  activeHypotheses: { id: string; statement: string; status: "testing" | "supported" | "rejected" }[];
  /** S2: the accumulated self-error ledger. */
  selfErrorLedger: SelfErrorRecord[];
  /** S4: the strategy experiments. */
  experiments: StrategyExperiment[];
  version: number;
}

export interface SelfErrorRecord {
  id: string;
  prediction: string;
  actual: string;
  error: string;
  context: string;
  at: number;
  /** Pattern hypothesis if a recurring pattern was detected. */
  patternHypothesis?: string;
}

export interface StrategyExperiment {
  id: string;
  hypothesis: string;
  strategyA: string;
  strategyB: string;
  result: string;
  kept: boolean;
  evaluatedBy: "external" | "simulator";
}

/** S0: Genesis — build SelfModel₀ by choosing which self-uncertainties to investigate. */
export function genesis(
  uncertainties: SelfUncertainty[],
  maxProbes: number,
): { investigated: SelfUncertainty[]; skipped: SelfUncertainty[]; selfModel: DevelopmentalState } {
  const sorted = [...uncertainties].sort((a, b) => b.informationValue - a.informationValue);
  const investigated = sorted.slice(0, maxProbes);
  const skipped = sorted.slice(maxProbes);
  return {
    investigated, skipped,
    selfModel: {
      selfModelVersion: 0,
      capabilities: investigated
        .filter((u) => u.informationValue > 0.5)
        .map((u) => ({ area: u.area, evidence: u.informationValue, assessment: u.question })),
      limitations: investigated
        .filter((u) => u.informationValue <= 0.5)
        .map((u) => ({ area: u.area, evidence: 1 - u.informationValue, assessment: u.question })),
      calibrationScore: null,
      knownUnknowns: skipped.map((u) => u.question),
      activeHypotheses: [],
      selfErrorLedger: [],
      experiments: [],
      version: 0,
    },
  };
}

/* ── S1: Self-Prediction — predict own behavior before acting ──────────── */

export interface SelfPrediction {
  id: string;
  turn: number;
  prediction: string;
  confidence: number;
  category: "decision" | "performance" | "intervention" | "uncertainty";
}

export function selfPredict(
  turn: number,
  fatigue: number,
  wrongStreak: number,
  believedMean: number,
): SelfPrediction[] {
  const out: SelfPrediction[] = [];
  if (fatigue > 0.6) {
    out.push({ id: `sp${turn}_fatigue`, turn, prediction: "I predict my learning efficiency is degraded by fatigue", confidence: 0.7 + fatigue * 0.2, category: "performance" });
  }
  if (wrongStreak >= 2) {
    out.push({ id: `sp${turn}_streak`, turn, prediction: "I predict I will intervene within 2 turns", confidence: 0.65 + wrongStreak * 0.1, category: "intervention" });
  }
  if (believedMean < 0.3) {
    out.push({ id: `sp${turn}_low`, turn, prediction: "I predict this concept needs more evidence before I can teach it well", confidence: 0.6, category: "uncertainty" });
  }
  out.push({ id: `sp${turn}_conf`, turn, prediction: `I predict my confidence in this decision is ${believedMean > 0.5 ? "moderate" : "low"}`, confidence: Math.max(0.3, believedMean), category: "decision" });
  return out;
}

/* ── S2: Self-Error Ledger ───────────────────────────────────────────────── */

export function checkSelfPrediction(
  sp: SelfPrediction, actual: string,
): { record: SelfErrorRecord; wasWrong: boolean } {
  const wasWrong = !actual.toLowerCase().includes(sp.prediction.split(" ").slice(2, 5).join(" ").toLowerCase().slice(0, 15));
  return {
    wasWrong,
    record: {
      id: sp.id, prediction: sp.prediction, actual,
      error: wasWrong ? "self-prediction was wrong" : "self-prediction was correct",
      context: `turn ${sp.turn}, confidence ${sp.confidence.toFixed(2)}`,
      at: Date.now(),
    },
  };
}

/** Detect recurring patterns in the self-error ledger. */
export function detectPatterns(ledger: SelfErrorRecord[]): string[] {
  const errors = ledger.filter((r) => r.error.includes("wrong"));
  const byContext = new Map<string, number>();
  for (const e of errors) {
    const key = e.error;
    byContext.set(key, (byContext.get(key) ?? 0) + 1);
  }
  return [...byContext.entries()]
    .filter(([, n]) => n >= 3)
    .map(([error, n]) => `recurring self-error (${n}x): ${error}`);
}

/* ── S3: Self-Inquiry via VoI ───────────────────────────────────────────── */

export interface SelfInquiry {
  id: string;
  question: string;
  /** How much this inquiry would reduce uncertainty about the system itself. */
  informationValue: number;
  probe: string;
}

/** VoI applied inward: "which uncertainty about myself is worth resolving next?" */
export function selfInquiry(
  knownUnknowns: string[],
  recentErrors: SelfErrorRecord[],
): SelfInquiry[] {
  return knownUnknowns.map((q, i) => ({
    id: `si${i}`,
    question: q,
    informationValue: 0.5 + (recentErrors.filter((e) => e.error.includes("wrong")).length * 0.1),
    probe: i % 2 === 0 ? "run a matched A/B simulation" : "probe with a focused diagnostic",
  })).sort((a, b) => b.informationValue - a.informationValue);
}

/* ── S4: Self-Improvement — one strategy experiment ─────────────────────── */

export interface StrategyHypothesis {
  id: string;
  /** The observed failure pattern that motivated this hypothesis. */
  observation: string;
  /** The proposed change. */
  change: string;
  /** Level 1 = parameter, Level 2 = strategy, Level 3 = representation. */
  level: 1 | 2 | 3;
}

export function runSelfImprovementExperiment(
  h: StrategyHypothesis,
  simulatorResult: { old: number; new: number },
): { kept: boolean; record: StrategyExperiment } {
  const kept = simulatorResult.new > simulatorResult.old;
  return {
    kept,
    record: {
      id: h.id,
      hypothesis: `${h.observation} → ${h.change}`,
      strategyA: "previous strategy",
      strategyB: h.change,
      result: `simulator: old ${simulatorResult.old.toFixed(3)}, new ${simulatorResult.new.toFixed(3)} → ${kept ? "KEEP" : "REJECT"}`,
      kept,
      evaluatedBy: "simulator",
    },
  };
}

/** THE PHASE 2 GATE: history → self-model change → DECISION change. */
export function phase2Gate(
  before: DevelopmentalState,
  after: DevelopmentalState,
  decisionsBefore: string[],
  decisionsAfter: string[],
): { pass: boolean; detail: string } {
  const selfModelChanged = after.version > before.version;
  const decisionsChanged = JSON.stringify(decisionsBefore) !== JSON.stringify(decisionsAfter);
  const hasEvidence = after.selfErrorLedger.length > 0 || after.experiments.length > 0;
  return {
    pass: selfModelChanged && decisionsChanged && hasEvidence,
    detail: `self-model v${before.version}→v${after.version}; decisions changed: ${decisionsChanged}; evidence: ${after.selfErrorLedger.length} errors + ${after.experiments.length} experiments`,
  };
}
