/**
 * THE COGNITIVE EXECUTIVE — C1 [ADR-035].
 * The kernel-level place where the existing organs JOINTLY make a turn-level
 * decision. Not an if/else dispatcher: per turn it ASSEMBLES the workspace,
 * GENERATES competing candidate directives, ESTIMATES consequences, applies
 * constraints (ethics wall + session contract), SELECTS one, and emits a
 * DECISION RECEIPT — so Astra can explain why THIS action over the
 * alternatives, and C4 can later ask whether it actually worked.
 *
 * Directive model: four independent facets (learning action, communication,
 * presentation, augmentation) — not a flat enum. Silence is first-class.
 * Deterministic: seeded; every decision replayable.
 * The incumbent (the linear teacher's move) is always a candidate — the
 * Executive deviates only when its predicted benefit beats cost. That makes
 * C1 safe by construction and comparable to the linear teacher in the gate.
 */

export type LearningAction = "teach" | "retrieve" | "diagnose" | "practice" | "reflect" | "switchTopic" | "break" | "end";
export type Communication = "explain" | "question" | "example" | "analogy" | "challenge" | "reassure" | "silence";
export type Presentation = "board" | "chart" | "text" | "voice" | "avatar" | "none";
export type Augmentation = "llm" | "no_llm";

export interface ExecutiveDirective {
  learningAction: LearningAction;
  communication: Communication;
  presentation: Presentation;
  augmentation: Augmentation;
}

export interface ExecutiveReceipt {
  id: string;
  turn: number;
  executiveVersion: string;
  directive: ExecutiveDirective;
  reason: string[];
  evidenceRefs: string[];
  alternativesConsidered: { directive: string; predictedBenefit: number; predictedCost: number; whyNot: string }[];
  prediction: { predictedBenefit: number; uncertainty: number; horizon: string };
  confidence: number;
  constraintsApplied: string[];
  seed: number;
}

/** THE TURN WORKSPACE — what matters right now, assembled from the organs. */
export interface TurnWorkspace {
  turn: number;
  elapsedMin: number;
  timeLeftMin: number;
  /** How many productive turns remain in this session (drives consequence evaluation). */
  turnsRemaining: number;
  /** Student state (from belief + behaviour — the organs speak, we assemble). */
  focusConcept: { id: string; name: string; mean: number; grey: boolean };
  alternativeConcept: { id: string; name: string; gainPerMinute: number } | null;
  uncertainties: number;
  hypothesisCount: number;
  momentum: number;
  frustration: number;
  /** Intra-session fatigue proxy: elapsed share of the measured tolerance. */
  fatigue: number;
  wrongStreak: number;
  lastOutcome: "correct" | "wrong" | null;
  planProgress: { done: number; total: number };
  /** Session contract counters. */
  counts: { jokes: number; llm: number; breaks: number; sinceLastIntervention: number };
  /** Does the current concept carry visual structure worth a chart? */
  visualStructure: boolean;
  /** The incumbent: what the linear teacher would do this turn. */
  incumbentMove: { kind: string; conceptId: string; conceptName: string };
  /** THE DEVELOPMENTAL LOOP — what the system knows about itself. When present, the Executive adjusts its own behavior based on self-knowledge. Without this, the developmental loop is open (the counterfactual proves it). */
  selfInsights?: {
    /** Recurring self-error patterns (from the Self-Error Ledger). */
    recurringPatterns: string[];
    /** Whether the system tends to intervene too early when uncertain. */
    interventionTendency: "early" | "balanced" | "late";
    /** Whether break decisions have been well-calibrated. */
    breakCalibration: "aggressive" | "balanced" | "reluctant";
    /** How many self-prediction errors have been accumulated. */
    selfErrorCount: number;
  };
}

export interface Candidate {
  directive: ExecutiveDirective;
  source: "incumbent" | "executive";
  predictedBenefit: number;
  predictedCost: number;
  reasons: string[];
  evidenceRefs: string[];
}

export interface ConstraintLimits {
  maxJokes: number; maxLLM: number; maxBreaks: number;
  minGapBetweenInterventions: number; minTeachingRatio: number;
}

export const DEFAULT_LIMITS: ConstraintLimits = {
  maxJokes: 2, maxLLM: 2, maxBreaks: 2,
  minGapBetweenInterventions: 8, minTeachingRatio: 0.6,
};

/** Generate the competing candidates from the workspace. */
export function generateCandidates(w: TurnWorkspace, incumbent: {
  directive: ExecutiveDirective; predictedBenefit: number;
}): Candidate[] {
  const out: Candidate[] = [];
  // The incumbent is always a candidate — deviation must earn its place.
  out.push({
    directive: incumbent.directive, source: "incumbent",
    predictedBenefit: incumbent.predictedBenefit, predictedCost: 0,
    reasons: ["the linear teacher's move — the incumbent"],
    evidenceRefs: [`concept:${w.focusConcept.id}`],
  });

  // BREAK — earned by measured fatigue, not by a clock.
  if (w.fatigue > 0.75) {
    out.push({
      directive: { learningAction: "break", communication: "reassure", presentation: "none", augmentation: "no_llm" },
      source: "executive",
      predictedBenefit: 0.3 * w.fatigue,
      predictedCost: 0.08 * (1 - w.fatigue),
      reasons: [`fatigue ${(w.fatigue * 100).toFixed(0)}% of measured tolerance — a break protects everything after this turn`],
      evidenceRefs: ["behaviour:fatigue", "behaviour:loadTolerance"],
    });
  }

  // CHART — only when the concept carries visual structure AND we're explaining.
  if (w.visualStructure && (incumbent.directive.learningAction === "teach" || incumbent.directive.learningAction === "practice")) {
    out.push({
      directive: { ...incumbent.directive, presentation: "chart", communication: "explain" },
      source: "executive",
      predictedBenefit: incumbent.predictedBenefit + 0.12,
      predictedCost: 0.03,
      reasons: ["the concept has a verified spatial/causal structure — a chart carries it better than words"],
      evidenceRefs: [`concept:${w.focusConcept.id}`, "kernel:prereq-structure"],
    });
  }

  // LLM EXPLAIN — only after repeated failure with the verified material.
  if (w.wrongStreak >= 2 && w.counts.llm < 2) {
    out.push({
      directive: { learningAction: "teach", communication: "example", presentation: "text", augmentation: "llm" },
      source: "executive",
      predictedBenefit: 0.18 + 0.06 * w.wrongStreak,
      predictedCost: 0.1,
      reasons: [`${w.wrongStreak} consecutive misses — a differently-voiced explanation is worth more than a third repetition`],
      evidenceRefs: ["session:wrongStreak", "kernel:atom-coverage"],
    });
  }

  // JOKE — only when momentum is healthy and density allows.
  if (w.momentum > 0.2 && w.frustration < 0.3 && w.elapsedMin > 6 && w.counts.sinceLastIntervention >= 5) {
    out.push({
      directive: { ...incumbent.directive, communication: "reassure", augmentation: "no_llm" },
      source: "executive",
      predictedBenefit: 0.06,
      predictedCost: 0.04,
      reasons: ["momentum is healthy — a light beat lands without costing the loop"],
      evidenceRefs: ["behaviour:momentum", "preference:humor"],
    });
  }

  // SILENCE — first-class: after a correct answer, let the student breathe.
  if (w.lastOutcome === "correct" && w.elapsedMin > 3) {
    out.push({
      directive: { learningAction: "reflect", communication: "silence", presentation: "none", augmentation: "no_llm" },
      source: "executive",
      predictedBenefit: 0.09,
      predictedCost: 0.02,
      reasons: ["a correct answer just landed — silence lets it consolidate instead of burying it in chatter"],
      evidenceRefs: ["session:lastOutcome"],
    });
  }

  // SWITCH TOPIC — frustration is spilling and a real alternative exists.
  if (w.frustration > 0.55 && w.alternativeConcept) {
    out.push({
      directive: { learningAction: "switchTopic", communication: "reassure", presentation: "none", augmentation: "no_llm" },
      source: "executive",
      predictedBenefit: 0.2 * w.frustration + w.alternativeConcept.gainPerMinute * 0.3,
      predictedCost: 0.12,
      reasons: [`frustration ${(w.frustration * 100).toFixed(0)}% on this concept; ${w.alternativeConcept.name} offers ${w.alternativeConcept.gainPerMinute.toFixed(2)} gain/min`],
      evidenceRefs: ["behaviour:frustration", `concept:${w.alternativeConcept.id}`],
    });
  }

  // ── SELF-MODEL CONSULTATION — the developmental loop closing ──────────
  // The system adjusts its own candidate generation based on what it has
  // learned about itself. Without selfInsights, these candidates don't
  // appear. With them, the system's behavior CHANGES based on self-knowledge.
  if (w.selfInsights) {
    const si = w.selfInsights;
    // If past self-errors show early intervention, propose evidence collection instead
    if (si.interventionTendency === "early" && w.uncertainties > 3) {
      out.push({
        directive: { learningAction: "diagnose", communication: "question", presentation: "none", augmentation: "no_llm" },
        source: "executive",
        predictedBenefit: 0.15,
        predictedCost: 0.02,
        reasons: ["self-model: I tend to intervene too early when uncertain — collecting evidence first"],
        evidenceRefs: ["self-model:interventionTendency", "self-error-ledger"],
      });
    }
    // If past self-errors show break miscalibration, adjust break behavior —
    // symmetrically: over-breaking quiets rest, under-breaking honors it sooner.
    if (si.breakCalibration === "aggressive") {
      for (const c of out) {
        if (c.directive.learningAction === "break") {
          c.predictedBenefit *= 0.6;
          c.reasons.push("self-model: past break decisions were too aggressive — reducing break tendency");
        }
      }
    }
    if (si.breakCalibration === "reluctant") {
      for (const c of out) {
        if (c.directive.learningAction === "break") {
          c.predictedBenefit *= 1.25;
          c.reasons.push("self-model: I have under-breaked before — honoring rest sooner");
        }
      }
    }
    // If the self-model says I under-intervene, lean into intervention candidates.
    if (si.interventionTendency === "late") {
      for (const c of out) {
        if (c.directive.learningAction === "diagnose" || (c.directive.augmentation === "llm")) {
          c.predictedBenefit *= 1.2;
          c.reasons.push("self-model: I have missed needed interventions before — leaning in");
        }
      }
    }
    // If self-errors exist, add a caution flag to intervention-heavy candidates
    if (si.selfErrorCount >= 3) {
      for (const c of out) {
        if (c.directive.learningAction === "teach" || c.directive.learningAction === "practice") {
          c.predictedCost += 0.03;
          c.reasons.push("self-model: accumulated self-errors — adding caution margin");
        }
      }
    }
  }

  return out;
}

/** Apply the session contract + ethics wall. Returns survivors and what was blocked. */
export function applyConstraints(
  candidates: Candidate[], w: TurnWorkspace, limits: ConstraintLimits,
): { survivors: Candidate[]; blocked: { directive: string; why: string }[] } {
  const blocked: { directive: string; why: string }[] = [];
  const survivors: Candidate[] = [];
  for (const c of candidates) {
    const a = c.directive.learningAction;
    if (a === "break" && w.counts.breaks >= limits.maxBreaks) { blocked.push({ directive: "break", why: "break budget spent this session" }); continue; }
    if (c.directive.augmentation === "llm" && w.counts.llm >= limits.maxLLM) { blocked.push({ directive: "llm-explain", why: "LLM budget spent this session" }); continue; }
    if (c.directive.communication === "reassure" && c.source === "executive" && w.counts.jokes >= limits.maxJokes) { blocked.push({ directive: "joke", why: "humour density cap — a chatty companion is an exhausting one" }); continue; }
    if (c.source === "executive" && a !== "break" && w.counts.sinceLastIntervention < limits.minGapBetweenInterventions) { blocked.push({ directive: a, why: "too soon after the last intervention" }); continue; }
    survivors.push(c);
  }
  return { survivors, blocked };
}

/** Select: top predicted benefit adjusted by multi-turn consequence, seeded tie-break. */
export function select(survivors: Candidate[], seed: number, w: TurnWorkspace): { chosen: Candidate; confidence: number } {
  const scored = survivors.map((c) => {
    const fatigueAfter = c.directive.learningAction === "break"
      ? Math.max(0, w.fatigue - 0.45)
      : Math.min(1, w.fatigue + 0.13);
    const turns = Math.max(0, w.turnsRemaining);
    // consequence: a break's fatigue recovery improves remaining turns; studying degrades them
    const consequence = c.directive.learningAction === "break"
      ? turns * 0.06 * Math.min(0.45, w.fatigue * 0.5)
      : -turns * 0.012 * w.fatigue;
    return { c, score: (c.predictedBenefit - c.predictedCost) + consequence };
  }).sort((a, b) => b.score - a.score);
  const top = scored[0]!.c;
  // exploration: near-ties occasionally explore (seeded, deterministic)
  if (scored.length > 1) {
    const rng = (seed * 9301 + 49297) % 233280 / 233280;
    const gap = scored[0].score - scored[1].score;
    if (gap < 0.03 && rng > 0.72) return { chosen: scored[1].c, confidence: 0.55 };
  }
  const uncertainty = Math.max(0.15, 0.5 - top.predictedBenefit * 0.2);
  return { chosen: top, confidence: Math.min(0.92, 0.55 + top.predictedBenefit * 0.5) };
}

/** THE DECISION — workspace in, directive + receipt out. Pure and replayable. */
export function decide(
  w: TurnWorkspace,
  incumbent: { directive: ExecutiveDirective; predictedBenefit: number },
  seed: number,
  limits: ConstraintLimits = DEFAULT_LIMITS,
): { directive: ExecutiveDirective; receipt: ExecutiveReceipt } {
  const candidates = generateCandidates(w, incumbent);
  const { survivors, blocked } = applyConstraints(candidates, w, limits);
  const { chosen, confidence } = select(survivors.length ? survivors : [candidates[0]!], seed, w);
  const receipt: ExecutiveReceipt = {
    id: `exec_t${w.turn}_s${seed}`,
    turn: w.turn,
    executiveVersion: "C1.0",
    directive: chosen.directive,
    reason: chosen.reasons,
    evidenceRefs: chosen.evidenceRefs,
    alternativesConsidered: candidates
      .filter((c) => c !== chosen)
      .map((c) => ({
        directive: `${c.directive.learningAction}/${c.directive.communication}/${c.directive.presentation}${c.directive.augmentation === "llm" ? "+llm" : ""}`,
        predictedBenefit: Math.round(c.predictedBenefit * 1000) / 1000,
        predictedCost: Math.round(c.predictedCost * 1000) / 1000,
        whyNot: blocked.find((b) => b.directive === c.directive.learningAction)?.why ?? "lower predicted benefit than the chosen directive",
      })),
    prediction: { predictedBenefit: chosen.predictedBenefit, uncertainty: Math.max(0.1, 0.45 - chosen.predictedBenefit * 0.2), horizon: "this turn" },
    confidence,
    constraintsApplied: blocked.map((b) => `${b.directive}: ${b.why}`),
    seed,
  };
  return { directive: chosen.directive, receipt };
}
