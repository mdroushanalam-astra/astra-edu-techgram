/**
 * B6 — The Planner: Techgram's real differentiator.
 * Objective: maximise expected exam-day marks over the remaining days,
 * averaged over posterior uncertainty (robust), with a value-of-information
 * bonus for uncertainty-reducing actions in high-weight areas.
 * Every block it emits lands in a receipt with its gain-per-minute and
 * its assumptions. Pure; time is injected.
 */

import { sigmoid, cholesky, type Rng } from "./linalg.js";
import { predictAction, predictDiagnoseUncertainty, DEFAULT_AOM_INSTANCE, type Aom } from "./aom.js";
import {
  stabilityOf,
  retrievability,
  isDue,
  type MemoryCell,
  type MemoryParams,
} from "./memory.js";
import type { BeliefModel, BeliefState } from "./belief.js";
import { reportConcept, samplePosterior } from "./belief.js";
import type { ConceptType } from "./content.js";
import type { PersonalisationState, BehaviourFlags } from "./behaviour.js";

export type PlanAction = "learn" | "review" | "practice" | "diagnose" | "remediate";

export interface PlanBlock {
  conceptId: string;
  conceptName: string;
  action: PlanAction;
  minutes: number;
  /** Robust-mean expected exam-marks gain of this block. */
  expectedGainMarks: number;
  gainPerMinute: number;
  reason: string;
  assumption: "assumed" | "measured";
  /** B5.5: the AOM prediction recorded BEFORE the action (never-self-fooling loop). */
  prediction: {
    dMastery: number;
    stabilityMultiplier: number;
    dUncertaintyVar: number;
    status: "assumed" | "measured";
    confidence: number;
    aomVersion: string;
  };
}

export interface Plan {
  day: number;
  blocks: PlanBlock[];
  totalMinutes: number;
  expectedGainMarks: number;
  paramsVersion: string;
  /**
   * ADR-030 audit trail: which measured behaviour signals changed this plan
   * (load cap, fatigue sizing, avoidance, rest). Empty evidence → said so.
   */
  personalisationApplied: string[];
  /**
   * ADR-030 opportunity cost: the best action the day's scarce cognitive
   * budget did NOT buy. The allocation principle made explicit — every plan
   * names what it gave up.
   */
  foregone: PlanForegone | null;
}

/** The next-best candidate that did not make the plan. */
export interface PlanForegone {
  conceptId: string;
  conceptName: string;
  action: PlanAction;
  minutes: number;
  expectedGainMarks: number;
  gainPerMinute: number;
  why: string;
}

export interface PlannerParams {
  /** Value-of-information weight. */
  voiLambda: number;
  /** Posterior draws for robust averaging. */
  draws: number;
  /** Prerequisite gate: σ(mastery) required to learn a dependent concept. */
  prereqGate: number;
  /** Even with teaching evidence, a prereq below this σ keeps the gate shut. */
  prereqFloor: number;
  /** Min share of day given to due reviews when reviews are due. */
  reviewShareWhenDue: number;
  /** Triage mode activates at ≤ this many days to exam. */
  triageDays: number;
  version: string;
}

export const DEFAULT_PLANNER_PARAMS: PlannerParams = {
  voiLambda: 2.0,
  draws: 16,
  prereqGate: 0.55,
  prereqFloor: 0.45,
  reviewShareWhenDue: 0.35,
  triageDays: 60,
  version: "planner-0.2.0",
};

export interface PlanContext {
  allowedConceptIds?: readonly string[];
  day: number;
  daysToExam: number;
  minutesAvailable: number;
  maxBlocks?: number;
  /** Total prep horizon in days — bounds the triage window (default: no bound). */
  prepHorizonDays?: number;
  memory: Map<number, MemoryCell>;
  /** B5.5 Action Outcome Model (defaults to the assumed production pack). */
  aom?: Aom;
  /**
   * ADR-030: measured personalisation state. When present it CHANGES the
   * plan (load cap, fatigue-sized blocks, avoidance soft-penalty) — the
   * Observable-State Law in action: observed behaviour steering decisions,
   * never labels, every change logged in `plan.personalisationApplied`.
   */
  personalisation?: PersonalisationState;
  /** B9 internal action flags (rest/lighten) — the planner is their consumer. */
  flags?: BehaviourFlags;
}

/** P(correct on a blueprint question at exam day) for one θ draw. */
function pExam(
  model: BeliefModel,
  thetaC: number,
  conceptIdx: number,
  daysToExam: number,
  S: number,
  muShift = 0,
  /** maintained=true: the plan's own review schedule keeps this alive to exam day. */
  maintained = false,
): number {
  const d = maintained ? 1 : Math.exp(-Math.max(0, daysToExam) / Math.max(S, 0.5));
  const thetaExam = model.mu0[conceptIdx] + d * (thetaC + muShift - model.mu0[conceptIdx]);
  const b = model.conceptB[conceptIdx];
  const g = model.content.exam.guessFloor;
  return g + (1 - g) * sigmoid(model.params.discrimination * (thetaExam - b));
}

/** Robust-mean marks contribution of a concept, scaled to the full paper. */
function conceptMarks(
  model: BeliefModel,
  draws: Float64Array[],
  ci: number,
  daysToExam: number,
  S: number,
  muShift = 0,
  maintained = false,
): number {
  const w = model.content.conceptWeight.get(model.byIdx[ci]!) ?? 0;
  if (w === 0) return 0;
  let acc = 0;
  for (const th of draws) acc += pExam(model, th[ci], ci, daysToExam, S, muShift, maintained);
  return (w * model.content.exam.marksEach * acc * paperScale(model)) / draws.length;
}

/** Scale from blueprint-weight marks to full-paper marks. */
export function paperScale(model: BeliefModel): number {
  let wSum = 0;
  for (let i = 0; i < model.N; i++) wSum += model.content.conceptWeight.get(model.byIdx[i]!) ?? 0;
  return wSum > 0 ? model.content.exam.questions / wSum : 0;
}

export function planDay(
  model: BeliefModel,
  st: BeliefState,
  ctx: PlanContext,
  params: PlannerParams = DEFAULT_PLANNER_PARAMS,
  rng: Rng,
): Plan {
  const draws = samplePosterior(model, st, params.draws, rng);
  const aom = ctx.aom ?? DEFAULT_AOM_INSTANCE;
  const N = model.N;
  const candidates: (PlanBlock & { _score: number })[] = [];
  const triageWindow = Math.min(params.triageDays, Math.floor((ctx.prepHorizonDays ?? Infinity) * 0.3));
  const triage = ctx.daysToExam <= triageWindow;

  // ---- ADR-030: the allocation principle meets the measured human ----
  // Scarcity here is not abstract: the student's proven load tolerance,
  // measured fatigue and avoidance pattern resize today's plan. Every change
  // is logged so the receipt can show exactly which observation did what.
  const pers = ctx.personalisation;
  const flags = ctx.flags;
  const plog: string[] = [];
  let effectiveMinutes = ctx.minutesAvailable;
  let learnMin = 25;
  let practiceMin = 20;
  let restDay = false;

  if (flags?.restDay) {
    restDay = true;
    effectiveMinutes = Math.min(effectiveMinutes, 15);
    plog.push(`rest_day: plan capped to ${effectiveMinutes}m — review-first, recovery outranks gain`);
  } else if (flags?.lightenPlan) {
    effectiveMinutes = Math.ceil(effectiveMinutes * 0.5);
    plog.push(`lighten_plan: burnout drift observed — minutes halved to ${effectiveMinutes}m`);
  } else if (pers && pers.loadToleranceMin > 0) {
    const cap = Math.ceil(pers.loadToleranceMin * 1.1);
    if (effectiveMinutes > cap) {
      plog.push(`load_cap: ${ctx.minutesAvailable}→${cap}m (measured tolerance ${pers.loadToleranceMin}m without abandonment)`);
      effectiveMinutes = cap;
    }
  }
  if (!restDay && pers && (pers.fatigueErrorSlope >= 0.2 || pers.fatigueTimeSlope >= 0.5)) {
    learnMin = 20;
    practiceMin = 15;
    plog.push(`fatigue_blocks: learn 25→${learnMin}m, practice 20→${practiceMin}m (late-session degradation measured)`);
  }
  const avoided = new Set((pers?.avoidance ?? []).map((a) => a.conceptId));
  if (avoided.size > 0) {
    plog.push(`avoidance_soft: ${avoided.size} concept(s) down-weighted ×0.6 (repeated no-response pattern) — due reviews unaffected`);
  }
  if (plog.length === 0) plog.push("no behavioural evidence yet — default plan");

  for (let ci = 0; ci < N; ci++) {
    const cid = model.byIdx[ci]!;
    if (ctx.allowedConceptIds && !ctx.allowedConceptIds.includes(cid)) continue;
    const concept = model.content.conceptById.get(cid)!;
    const w = model.content.conceptWeight.get(cid) ?? 0;
    if (w === 0) continue;
    const mastery = sigmoid(st.mu[ci]);
    const rep = reportConcept(model, st, cid);
    const cell = ctx.memory.get(ci);
    const type = concept.type;
    const S = stabilityOf(cell, type, model.memoryParams);

    // Prerequisite gate: a prereq is satisfied when the belief is solid, or
    // when it has been taught enough to carry evidence AND is not clearly
    // weak. The gate's job is ORDERING, not certainty — belief lag must not
    // idle the student, but a failed prereq keeps the gate shut.
    const prereqsOk = concept.prereqs.every((pid) => {
      const pi = model.index.get(pid);
      if (pi === undefined) return true;
      const m = sigmoid(st.mu[pi]);
      return m >= params.prereqGate || (st.nEff[pi] >= 2 && m >= params.prereqFloor);
    });

    // ---- REVIEW (value = real stability growth against decay) ----
    // Due reviews always; near-due reviews during triage (consolidation mode).
    if (
      cell &&
      (isDue(cell, ctx.day, model.memoryParams) ||
        (triage && retrievability(cell, ctx.day) < 0.95))
    ) {
      const Rnow = retrievability(cell, ctx.day);
      const pred = predictAction(aom, {
        action: "review", minutes: 15, mastery, daysToExam: ctx.daysToExam, triage, retrievabilityNow: Rnow,
      });
      const SAfter = Math.min(S * pred.stabilityMultiplier, 3650);
      const before = conceptMarks(model, draws, ci, ctx.daysToExam, S, 0, false);
      const after = conceptMarks(model, draws, ci, ctx.daysToExam, SAfter, 0, false);
      const gain = after - before;
      if (gain > 1e-4) {
        candidates.push({
          conceptId: cid,
          conceptName: concept.name,
          action: "review",
          minutes: 15,
          expectedGainMarks: gain,
          gainPerMinute: gain / 15,
          reason: `Due review: retrievability ${Rnow.toFixed(2)}, stability ${S.toFixed(1)}d → ${SAfter.toFixed(1)}d protects ${w.toFixed(1)} expected exam questions`,
          assumption: pred.status,
          _score: gain / 15,
          prediction: pred,
        });
      }
    }

    // ---- LEARN / REMEDIATE (AOM predicts; the plan maintains what it teaches) ----
    if (prereqsOk && (mastery < 0.55 || rep.grey)) {
      const minutes = learnMin;
      const action: PlanAction = mastery > 0.15 ? "learn" : "remediate";
      const pred = predictAction(aom, {
        action, minutes, mastery, daysToExam: ctx.daysToExam, triage,
      });
      const before = conceptMarks(model, draws, ci, ctx.daysToExam, S, 0, true);
      const after = conceptMarks(model, draws, ci, ctx.daysToExam, S, pred.dMastery, true);
      const gain = after - before;
      if (gain > 1e-4) {
        candidates.push({
          conceptId: cid,
          conceptName: concept.name,
          action,
          minutes,
          expectedGainMarks: gain,
          gainPerMinute: gain / minutes,
          reason:
            action === "learn"
              ? `Mastery band ${(mastery * 100).toFixed(0)}% (${rep.grey ? "unknown-ish, needs evidence" : "evidenced"}), exam weight ${w.toFixed(1)}q — AOM ${pred.aomVersion} predicts Δmastery +${pred.dMastery.toFixed(2)} logit (${pred.status}; maintained by plan reviews)`
              : `Foundational deficit — remediate before advancing (mastery ${(mastery * 100).toFixed(0)}%), AOM ${pred.aomVersion} predicts Δmastery +${pred.dMastery.toFixed(2)} (${pred.status})`,
          assumption: pred.status,
          _score: (gain / minutes) * (avoided.has(cid) ? 0.6 : 1),
          prediction: pred,
        });
      }
    }

    // ---- PRACTICE (consolidation band — diminishing returns fill, not idle days) ----
    if (prereqsOk && mastery >= 0.3 && mastery < 0.92 && st.nEff[ci] >= 2) {
      const minutes = practiceMin;
      const pred = predictAction(aom, {
        action: "practice", minutes, mastery, daysToExam: ctx.daysToExam, triage,
      });
      const before = conceptMarks(model, draws, ci, ctx.daysToExam, S, 0, true);
      const after = conceptMarks(model, draws, ci, ctx.daysToExam, S, pred.dMastery, true);
      const gain = after - before;
      if (gain > 1e-4) {
        candidates.push({
          conceptId: cid,
          conceptName: concept.name,
          action: "practice",
          minutes,
          expectedGainMarks: gain,
          gainPerMinute: gain / minutes,
          reason: `Consolidation band (mastery ${(mastery * 100).toFixed(0)}%) — AOM ${pred.aomVersion} predicts Δmastery +${pred.dMastery.toFixed(2)} (${pred.status})`,
          assumption: pred.status,
          _score: (gain / minutes) * (avoided.has(cid) ? 0.6 : 1),
          prediction: pred,
        });
      }
    }

    // ---- DIAGNOSE (VoI on grey, high-weight areas; uncertainty reduction via AOM) ----
    if (rep.grey && st.nEff[ci] < 3 && w >= 0.4) {
      const Scc = st.S[ci * N + ci];
      const a = model.params.discrimination;
      const z = sigmoid(a * st.mu[ci]);
      const H = (1 - model.content.exam.guessFloor) * a * z * (1 - z);
      const R = Math.max(z * (1 - z), 1e-3);
      const dVar = predictDiagnoseUncertainty(Scc, H, R);
      const dpdMu = H;
      const marksVarRed = (w * model.content.exam.marksEach * dpdMu) ** 2 * dVar;
      const gain = params.voiLambda * Math.sqrt(Math.max(marksVarRed, 0));
      if (gain > 1e-4) {
        const pred = predictAction(aom, {
          action: "diagnose", minutes: 10, mastery, daysToExam: ctx.daysToExam, triage,
        });
        candidates.push({
          conceptId: cid,
          conceptName: concept.name,
          action: "diagnose",
          minutes: 10,
          expectedGainMarks: gain,
          gainPerMinute: gain / 10,
          reason: `Unknown-ish (n_eff ${rep.nEff.toFixed(1)}) on ${w.toFixed(1)}-question weight — information value before committing study time`,
          assumption: pred.status,
          _score: (gain / 10) * 1.1,
          prediction: { ...pred, dUncertaintyVar: dVar },
        });
      }
    }
  }

  // ---- fill the day under constraints ----
  // Two passes: (1) secure the review quota (retention floor), then
  // (2) fill remaining minutes by score. This never starves the day when
  // due reviews are scarcer than the share — the quota is a floor, not a lid.
  candidates.sort((x, y) => y._score - x._score);
  const blocks: PlanBlock[] = [];
  let used = 0;
  let reviewMinutes = 0;
  let diagnoseCount = 0;
  const maxBlocks = ctx.maxBlocks ?? Math.max(2, Math.floor(effectiveMinutes / 15));
  const dueReviews = candidates.filter((c) => c.action === "review");
  const minReview = dueReviews.length > 0
    ? Math.min(
        Math.floor(effectiveMinutes * params.reviewShareWhenDue),
        dueReviews.reduce((a, r) => a + r.minutes, 0),
      )
    : 0;
  const chosen = new Set<PlanBlock>();

  const tryChoose = (c: (typeof candidates)[number]): boolean => {
    if (blocks.length >= maxBlocks) return false;
    if (used + c.minutes > effectiveMinutes) return false;
    if (c.action === "diagnose" && diagnoseCount >= 1) return false;
    const { _score, ...block } = c;
    blocks.push(block);
    chosen.add(c);
    used += c.minutes;
    if (block.action === "review") reviewMinutes += block.minutes;
    if (block.action === "diagnose") diagnoseCount += 1;
    return true;
  };

  // Pass 1: review quota (already score-ordered among reviews).
  if (minReview > 0) {
    for (const r of dueReviews) {
      if (reviewMinutes >= minReview) break;
      tryChoose(r);
    }
  }
  // Pass 2: everything else by score. On a rest day, reviews only.
  for (const c of candidates) {
    if (used >= effectiveMinutes || blocks.length >= maxBlocks) break;
    if (chosen.has(c)) continue;
    if (restDay && c.action !== "review") continue;
    tryChoose(c);
  }

  // ADR-030 opportunity cost: the best thing today's budget did NOT buy.
  let foregone: PlanForegone | null = null;
  const bestNotChosen = candidates.find((c) => !chosen.has(c));
  if (bestNotChosen) {
    const overBudget = used + bestNotChosen.minutes > effectiveMinutes;
    const why = restDay && bestNotChosen.action !== "review"
      ? "rest day — deferred, not forgotten"
      : bestNotChosen.action === "diagnose" && diagnoseCount >= 1 && !overBudget
        ? "one diagnose per day cap"
        : overBudget
          ? "didn't fit today's cognitive budget"
          : "daily block cap reached";
    foregone = {
      conceptId: bestNotChosen.conceptId,
      conceptName: bestNotChosen.conceptName,
      action: bestNotChosen.action,
      minutes: bestNotChosen.minutes,
      expectedGainMarks: bestNotChosen.expectedGainMarks,
      gainPerMinute: bestNotChosen.gainPerMinute,
      why,
    };
  }

  const plan: Plan = {
    day: ctx.day,
    blocks,
    totalMinutes: used,
    expectedGainMarks: blocks.reduce((a, b) => a + b.expectedGainMarks, 0),
    paramsVersion: params.version,
    personalisationApplied: plog,
    foregone,
  };
  // Debug tap (stripped in analysis): expose what the pool looked like.
  if ((globalThis as Record<string, unknown>).__TECHGRAM_DEBUG__) {
    (plan as Plan & { _dbg?: unknown })._dbg = {
      poolTop: candidates[0] ? `${candidates[0].action}:${candidates[0].conceptName}` : "none",
      dueReviewCount: dueReviews.length,
      minReview,
      chosenTop: blocks[0] ? `${blocks[0].action}:${blocks[0].conceptName}` : "none",
      sameObject: dueReviews.length > 0 && chosen.has(dueReviews[0]!),
    };
  }
  return plan;
}
