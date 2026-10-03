/**
 * COGNITIVE ASSEMBLERS [ADR-034 Tier A] — pure views that present the frozen
 * kernel's existing outputs as universal cognitive objects. No new decisions;
 * no stored truth — every assembly is rebuilt per moment from kernel state.
 */
import type { BeliefModel, BeliefState } from "../belief.js";
import { reportConcept } from "../belief.js";
import type { Plan } from "../planner.js";
import type { SanctuaryPlanLike } from "./types.js";
import {
  type CognitiveWorkspace, type SelfModel, type PredictionRecord, type PredictionTarget,
  type CausalEdge,
} from "./contracts.js";

/** THE COGNITIVE WORKSPACE — what matters right now, assembled from state. */
export function assembleWorkspace(
  model: BeliefModel, st: BeliefState, plan: SanctuaryPlanLike, goalStatement: string | null, horizon: string,
): CognitiveWorkspace {
  const rows = model.content.concepts.map((c) => {
    const r = reportConcept(model, st, c.id);
    return { id: c.id, name: c.name, mean: r.mean, grey: r.grey, nEff: r.nEff, weight: model.content.conceptWeight.get(c.id) ?? 0 };
  });
  const evidenced = rows.filter((r) => !r.grey);
  const focus = [...evidenced].sort((a, b) => b.weight - a.weight).slice(0, 3)
    .map(({ id, name, mean, grey }) => ({ id, name, mean, grey }));
  const uncertainties = rows.filter((r) => r.grey).slice(0, 5)
    .map(({ id, name, nEff }) => ({ id, name, nEff }));
  return {
    builtAt: Date.now(),
    goal: goalStatement ? { id: "primary-goal", statement: goalStatement, horizon } : null,
    focus,
    uncertainties,
    hypotheses: [], // misconception candidates feed this from the session layer
    candidateActions: plan.blocks.map((b) => ({
      id: `${b.action}:${b.conceptId}`, action: b.action, target: b.conceptName, gainPerMinute: b.gainPerMinute,
    })),
    plan: {
      blocks: plan.blocks.map((b) => ({ action: b.action, concept: b.conceptName, minutes: b.minutes, why: b.reason })),
      foregone: plan.foregone ? `${plan.foregone.action} on ${plan.foregone.conceptName}` : null,
    },
    notContained: [
      "the full student history (the event log holds it)",
      "unscheduled memories (they surface when due)",
      "anything outside this domain pack",
    ],
  };
}

/** THE SELF-MODEL — machine humility assembled from calibration evidence. */
export function assembleSelfModel(
  model: BeliefModel, st: BeliefState,
  predictions: PredictionRecord[],
  misconceptionCount: number,
): SelfModel {
  const calibrated = predictions.filter((p) => p.predictionError !== undefined);
  const knownUnknowns = model.content.concepts
    .map((c) => ({ c, r: reportConcept(model, st, c.id) }))
    .filter((x) => x.r.grey)
    .slice(0, 6)
    .map((x) => `${x.r.mean.toFixed(2)}-band: ${x.c.name}`);
  const byArea = new Map<string, { sum: number; n: number }>();
  for (const p of calibrated) {
    const k = p.target;
    const cur = byArea.get(k) ?? { sum: 0, n: 0 };
    byArea.set(k, { sum: cur.sum + (p.predictionError ?? 0), n: cur.n + 1 });
  }
  return {
    knows: model.content.concepts
      .map((c) => ({ c, r: reportConcept(model, st, c.id) }))
      .filter((x) => !x.r.grey && x.r.mean >= 0.6)
      .slice(0, 5)
      .map((x) => x.c.name),
    knownUnknowns,
    recentPredictionErrors: calibrated.slice(-5).map((p) => ({ id: p.id, target: p.target, error: p.predictionError! })),
    systematicBiases: [...byArea.entries()]
      .filter(([, v]) => v.n >= 3)
      .map(([area, v]) => ({ area, bias: v.sum / v.n, n: v.n })),
    modelLimitations: [
      ...(misconceptionCount > 0 ? [`${misconceptionCount} active misconception hypotheses — candidates, not confirmed truth`] : []),
      "session-length and load tolerances are measured per student; the priors were assumed",
      "prediction records are young — calibration needs real-student outcomes",
    ],
    reliableFor: [
      { organ: "belief bands", evidenceCount: model.content.concepts.length },
      { organ: "session plan", evidenceCount: 1 },
    ],
  };
}

/** PREDICTION REGISTRY — the AOM's outcome records as universal predictions. */
export function predictionFromOutcome(
  id: string, target: PredictionTarget, predicted: string, value: number,
  uncertainty: number, basis: string, modelVersion: string,
): PredictionRecord {
  return { id, target, prediction: predicted, value, uncertainty, horizon: "session", basis, modelVersion };
}

/** CAUSAL v0 — the misconception prerequisite chain as causal edges. */
export function causalFromPrereqs(
  conceptId: string, prereqs: { id: string; name: string }[], evidence: string,
): CausalEdge[] {
  return prereqs.map((p) => ({
    cause: p.id, effect: conceptId, relation: "increases" as const,
    evidence, confidence: 0.7,
  }));
}
