/**
 * B5.5 — ACTION OUTCOME MODEL (AOM). [ADR-015, 2026-10-02]
 *
 * The organ that turns the planner from a heuristic optimizer into a decision
 * engine. It answers ONE question:
 *
 *   Given this student state, this concept, this action, this duration, and
 *   this context — what outcomes should we expect?
 *
 * Outcomes predicted per action: Δmastery (logit), stability multiplier
 * (memory), uncertainty reduction (variance), fatigue. Each carries its
 * provenance status (`assumed` | `measured`), a confidence, and the AOM
 * version that produced it. The planner CONSUMES these predictions and never
 * hardcodes a gain again.
 *
 * THE NEVER-SELF-FOOLING LOOP (the AOM's reason to exist):
 *   PRIOR → PREDICTION (recorded in the receipt BEFORE the action)
 *         → ACTION → OBSERVED OUTCOME → PREDICTION ERROR
 *         → MODEL UPDATE (human-gated, versioned, never auto-applied)
 *
 * THE CLOSED-LOOP HALLUCINATION BAN (mechanical, not aspirational):
 *   A gain value may never be "validated" by a world that assumed it. Only
 *   outcome records with provenance "pilot" (real students) can be approved
 *   into the production parameter pack. Simulator-world data may train
 *   world-labelled copies for experiments — never production. `approve()`
 *   enforces this at the type level.
 *
 * Determinism: predict() is a pure function — no RNG, no clock, no I/O.
 */

import type { PlanAction } from "./planner.js";

// ---------------------------------------------------------------------------
// Parameter pack — every number carries its provenance
// ---------------------------------------------------------------------------

export type AomAction = "learn" | "practice" | "remediate" | "review";

export interface AomParamEntry {
  value: number;
  status: "assumed" | "measured";
  /** How this value came to be — never blank. */
  source: string;
  /** Weight of evidence behind it (records aggregated). */
  n: number;
}

export interface AomParams {
  version: string;
  /** Parameter-pack lineage — a measured pack names the assumed pack it grew from. */
  parents: string[];
  /**
   * Named human who approved this pack into production — stamped by
   * approve() so the pack ITSELF carries its provenance, not just the
   * proposal wrapper [Brain-Freeze audit probe 2, Journal 15].
   */
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  /** Logit mastery gain per effective 10 minutes, by action. */
  gainsPer10Min: Record<AomAction, AomParamEntry>;
  /** Review stability growth preview: S' = S · min(base + r·(1 − R), cap). */
  reviewGrowth: { base: AomParamEntry; r: AomParamEntry; cap: number };
  /** Stability multiplier applied by a study (non-review) action. */
  studyStabilityMultiplier: AomParamEntry;
  /** Predicted fatigue cost per block (fraction of a day's capacity). */
  fatiguePerBlock: Record<PlanAction, AomParamEntry>;
  /** Policy context: penalty on learning-brand-new material inside the triage window. */
  triagePenalty: number;
  /** Shrinkage strength: implied gains are pooled with the prior at this weight. */
  priorStrength: number;
  /** Records needed before a parameter may call itself `measured`. */
  measuredThreshold: number;
}

export function makeAssumedAom(version = "aom-0.1.0-assumed"): AomParams {
  const assumed = (value: number, source: string): AomParamEntry => ({
    value, status: "assumed", source, n: 0,
  });
  const ls = "learning-science prior: testing effect (Roediger & Karpicke 2006), worked-example effect (Sweller), spacing (Cepeda et al. 2006)";
  return {
    version,
    parents: [],
    createdAt: "2026-10-02",
    gainsPer10Min: {
      learn: assumed(0.30, ls),
      practice: assumed(0.22, ls),
      remediate: assumed(0.28, ls),
      review: assumed(0.10, ls),
    },
    reviewGrowth: {
      base: assumed(1.6, "FSRS-style growth preview"),
      r: assumed(0.8, "FSRS-style growth preview"),
      cap: 3.0,
    },
    studyStabilityMultiplier: assumed(1.2, "study refreshes the memory trace modestly"),
    fatiguePerBlock: {
      learn: assumed(0.20, "assumed effort cost"),
      practice: assumed(0.15, "assumed effort cost"),
      remediate: assumed(0.20, "assumed effort cost"),
      review: assumed(0.10, "assumed effort cost"),
      diagnose: assumed(0.05, "assumed effort cost"),
    },
    triagePenalty: 0.35,
    priorStrength: 20,
    measuredThreshold: 30,
  };
}

/** The production parameter pack for V1 (all assumed — honest until data). */
export const DEFAULT_AOM: AomParams = makeAssumedAom();

export interface Aom {
  params: AomParams;
  /** "pilot" = production-grade provenance; "world:*" = simulator-only. */
  provenance: "pilot" | string;
}

export const DEFAULT_AOM_INSTANCE: Aom = { params: DEFAULT_AOM, provenance: "pilot" };

// ---------------------------------------------------------------------------
// Prediction
// ---------------------------------------------------------------------------

export interface AomPredictInput {
  action: PlanAction;
  minutes: number;
  /** σ(μ): current believed mastery in [0,1] — drives diminishing returns. */
  mastery: number;
  /** Days to exam (context: triage window changes the value of new material). */
  daysToExam: number;
  triage: boolean;
  /** Retrievability now (review only) — drives the stability growth preview. */
  retrievabilityNow?: number;
  /** Current Σ_cc (diagnose only) — for the uncertainty-reduction prediction. */
  scc?: number;
  /** dh/dμ at the current belief (diagnose only) — for uncertainty reduction. */
  dpdMu?: number;
  guessFloor?: number;
}

export interface AomPrediction {
  action: PlanAction;
  minutes: number;
  /** Predicted logit mastery gain, context-adjusted (triage applied here, ONCE). */
  dMastery: number;
  /** Multiplier this action applies to the concept's memory stability. */
  stabilityMultiplier: number;
  /** Predicted reduction in Σ_cc (diagnose only; 0 otherwise). */
  dUncertaintyVar: number;
  /** Predicted fatigue cost of this block. */
  fatigue: number;
  status: "assumed" | "measured";
  confidence: number;
  aomVersion: string;
}

/**
 * Predict the outcome of one action. Pure. No RNG — a prediction is a
 * conditional expectation, and the planner robustifies over posterior draws.
 */
export function predictAction(aom: Aom, input: AomPredictInput): AomPrediction {
  const p = aom.params;
  const status = overallStatus(p);
  const mastery = clamp01(input.mastery);
  let dMastery = 0;
  let stabilityMultiplier = 1;
  let dUncertaintyVar = 0;
  let fatigueEntry: AomParamEntry | undefined;

  switch (input.action) {
    case "learn":
    case "remediate": {
      const g = p.gainsPer10Min[input.action === "learn" ? "learn" : "remediate"];
      const triagePenalty = input.triage && mastery < 0.2 ? p.triagePenalty : 1;
      dMastery = g.value * (input.minutes / 10) * (1 - mastery) * triagePenalty;
      stabilityMultiplier = p.studyStabilityMultiplier.value;
      fatigueEntry = p.fatiguePerBlock[input.action];
      break;
    }
    case "practice": {
      const g = p.gainsPer10Min.practice;
      dMastery = g.value * (input.minutes / 10) * (1 - mastery);
      stabilityMultiplier = p.studyStabilityMultiplier.value * 0.95;
      fatigueEntry = p.fatiguePerBlock.practice;
      break;
    }
    case "review": {
      const g = p.gainsPer10Min.review;
      dMastery = g.value * (input.minutes / 10) * (1 - mastery);
      const R = clamp01(input.retrievabilityNow ?? 0);
      stabilityMultiplier = Math.min(
        p.reviewGrowth.base.value + p.reviewGrowth.r.value * (1 - R),
        p.reviewGrowth.cap,
      );
      fatigueEntry = p.fatiguePerBlock.review;
      break;
    }
    case "diagnose": {
      // Measurement, not teaching: no mastery gain, no stability change.
      // The uncertainty-reduction prediction needs the live belief row
      // (observation-noise term s), so the planner calls
      // predictDiagnoseUncertainty() directly and fills dUncertaintyVar.
      fatigueEntry = p.fatiguePerBlock.diagnose;
      break;
    }
  }

  return {
    action: input.action,
    minutes: input.minutes,
    dMastery,
    stabilityMultiplier,
    dUncertaintyVar,
    fatigue: fatigueEntry?.value ?? 0.1,
    status,
    confidence: statusConfidence(status, maxN(p)),
    aomVersion: p.version,
  };
}

/**
 * Diagnose uncertainty reduction, computed with full information.
 * Kept separate because it needs the observation-noise term s that only the
 * caller (with the live belief row) can form. Pure.
 */
export function predictDiagnoseUncertainty(scc: number, H: number, obsNoiseR: number): number {
  const s = H * H * scc + obsNoiseR;
  if (s <= 0) return 0;
  const sccAfter = Math.max(scc - (H * H * scc * scc) / s, 0);
  return scc - sccAfter;
}

// ---------------------------------------------------------------------------
// Learning from outcomes — the loop, human-gated
// ---------------------------------------------------------------------------

/**
 * One observed block. `observedDMastery` is the EVIDENCE-based belief shift
 * the student's own responses produced (Σ of per-response EKF updates on the
 * concept) — it is driven by student evidence, never by the AOM's assumptions,
 * which is precisely what makes it legal input for gain validation.
 */
export interface OutcomeRecord {
  action: PlanAction;
  minutes: number;
  masteryAtAction: number;
  predictedDMastery: number;
  observedDMastery: number;
  /** Evidence-bearing responses behind the observation. */
  n: number;
}

export interface ProposedAom {
  params: AomParams;
  provenance: "pilot" | string;
  /** Human-readable summary of what changed and why. */
  changeSummary: string;
  approvedBy?: string;
}

/**
 * Pool observed outcomes with the prior (shrinkage: priorStrength acts as
 * k pseudo-observations). Produces a PROPOSAL — nothing is applied until a
 * human approves it, and approval is structurally impossible for
 * simulator-provenance data (the closed-loop ban, enforced here).
 */
export function learnFromOutcomes(aom: Aom, records: OutcomeRecord[]): ProposedAom {
  const p = aom.params;
  const actions: AomAction[] = ["learn", "practice", "remediate", "review"];
  const nextGains: Record<AomAction, AomParamEntry> = { ...p.gainsPer10Min };
  const changes: string[] = [];

  for (const action of actions) {
    const recs = records.filter((r) => r.action === action && r.n > 0);
    if (recs.length === 0) continue;
    let wSum = 0;
    let impliedSum = 0;
    for (const r of recs) {
      const denom = (r.minutes / 10) * (1 - clamp01(r.masteryAtAction));
      if (denom < 1e-4) continue; // at full mastery the gain model is inactive — uninformative
      const implied = r.observedDMastery / denom;
      impliedSum += r.n * implied;
      wSum += r.n;
    }
    if (wSum === 0) continue;
    const prior = p.gainsPer10Min[action];
    const k = p.priorStrength;
    const pooled = (k * prior.value + impliedSum) / (k + wSum);
    const measured = wSum >= p.measuredThreshold && aom.provenance === "pilot";
    nextGains[action] = {
      value: round4(pooled),
      status: measured ? "measured" : prior.status,
      source: measured
        ? `outcome records (n=${wSum}, pooled with prior k=${k}), provenance=${aom.provenance}`
        : prior.source,
      n: prior.n + wSum,
    };
    if (Math.abs(pooled - prior.value) > 1e-4) {
      changes.push(
        `${action}: ${prior.value.toFixed(3)} → ${pooled.toFixed(3)} (n=${wSum}, provenance=${aom.provenance})`,
      );
    }
  }

  const params: AomParams = {
    ...p,
    version: `${p.version.split("-").slice(0, 2).join("-")}-proposed-${Date.now().toString(36)}`,
    parents: [p.version],
    gainsPer10Min: nextGains,
  };
  return {
    params,
    provenance: aom.provenance,
    changeSummary: changes.length > 0 ? changes.join("; ") : "no parameter changed beyond noise",
  };
}

// ---------------------------------------------------------------------------
// Prediction-error mismatch detection [ADR-030]
// ---------------------------------------------------------------------------

export interface ActionErrorStats {
  action: PlanAction;
  n: number;
  meanAbsError: number;
  /** Mean |error| relative to the predicted magnitude (floor 0.05). */
  meanAbsRelativeError: number;
  /** Longest run of consecutive records whose relative error exceeds the threshold. */
  consecutiveLargeMisses: number;
}

export interface PredictionErrorStats {
  perAction: ActionErrorStats[];
  /** True when any action has ≥ consecutiveNeeded large misses in a row. */
  mismatchDetected: boolean;
  mismatchActions: PlanAction[];
}

/**
 * The AOM-law check for OUTCOME predictions: a personalisation hypothesis
 * that keeps missing must be FLAGGED, not silently kept (the mismatch
 * minimum — "my model of this action for this student is wrong"). Records
 * are processed in the order given; callers pass chronological order.
 * Pure — nothing is updated here; the flag routes to the human-gated loop.
 */
export function predictionErrorStats(
  records: OutcomeRecord[],
  opts: { relThreshold?: number; consecutiveNeeded?: number } = {},
): PredictionErrorStats {
  const relThreshold = opts.relThreshold ?? 0.5;
  const consecutiveNeeded = opts.consecutiveNeeded ?? 3;
  const perAction: ActionErrorStats[] = [];
  const mismatchActions: PlanAction[] = [];
  for (const action of ["learn", "practice", "remediate", "review"] as PlanAction[]) {
    const recs = records.filter((r) => r.action === action);
    if (recs.length === 0) continue;
    let absSum = 0, relSum = 0, run = 0, maxRun = 0;
    for (const r of recs) {
      const err = r.observedDMastery - r.predictedDMastery;
      absSum += Math.abs(err);
      const rel = Math.abs(err) / Math.max(Math.abs(r.predictedDMastery), 0.05);
      relSum += rel;
      run = rel > relThreshold ? run + 1 : 0;
      maxRun = Math.max(maxRun, run);
    }
    perAction.push({
      action,
      n: recs.length,
      meanAbsError: absSum / recs.length,
      meanAbsRelativeError: relSum / recs.length,
      consecutiveLargeMisses: maxRun,
    });
    if (maxRun >= consecutiveNeeded) mismatchActions.push(action);
  }
  return { perAction, mismatchDetected: mismatchActions.length > 0, mismatchActions };
}

/**
 * The human gate. ONLY pilot-provenance proposals may become production
 * packs — approving a simulator-world proposal into production is the exact
 * closed-loop hallucination ADR-015 bans, so this throws.
 */
export function approve(proposal: ProposedAom, approver: string): AomParams {
  if (proposal.provenance !== "pilot") {
    throw new Error(
      `CLOSED-LOOP BAN: proposal provenance '${proposal.provenance}' is simulator data — ` +
        `only real-student ('pilot') outcomes may update the production AOM.`,
    );
  }
  if (!approver || approver.trim().length === 0) {
    throw new Error("AOM approval requires a named human approver (the gate is not optional).");
  }
  proposal.params.createdAt = new Date().toISOString().slice(0, 10);
  proposal.approvedBy = approver;
  // The pack itself carries the approval — a production pack with no named
  // human behind it must not exist (probe-2 audit fix).
  proposal.params.approvedBy = approver;
  proposal.params.approvedAt = proposal.params.createdAt;
  return proposal.params;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function overallStatus(p: AomParams): "assumed" | "measured" {
  return Object.values(p.gainsPer10Min).some((g) => g.status === "measured") ? "measured" : "assumed";
}

function maxN(p: AomParams): number {
  return Math.max(...Object.values(p.gainsPer10Min).map((g) => g.n));
}

/** Prediction confidence grows with evidence behind the parameters. */
export function statusConfidence(status: "assumed" | "measured", n: number): number {
  return status === "assumed" ? 0.4 : Math.min(0.9, 0.4 + 0.5 * (n / (n + 50)));
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function round4(x: number): number {
  return Math.round(x * 10000) / 10000;
}
