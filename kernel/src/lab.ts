/**
 * The Lab: synthetic students with KNOWN ground truth.
 * Used by (1) the Brain Lab public demo — watch the brain work, no real users
 * needed — and (2) CI regression: if a change worsens the planner's simulated
 * exam outcomes or the estimator's calibration, the suite fails.
 *
 * Honest caveat (written into every demo): the simulator ranks algorithms and
 * catches bugs; it does NOT prove real-world efficacy.
 */

import { makeRng, sigmoid, cholesky, invert, type Rng } from "./linalg.js";
import { buildAdjacency, laplacian, expertDifficultyToLogit, type Content } from "./content.js";
import { DEFAULT_MEMORY_PARAMS, type MemoryCell, type MemoryParams } from "./memory.js";
import {
  buildBeliefModel,
  initialState,
  timeUpdate,
  expectedScore,
  type BeliefModel,
} from "./belief.js";
import { planDay, DEFAULT_PLANNER_PARAMS, type Plan } from "./planner.js";
import { applyEvent, newSystemState, type StudentEvent, type SystemState } from "./events.js";

export type Archetype = "consistent" | "crammer" | "avoidant" | "drifter";
export type Policy = "techgram" | "fixed_order" | "random";

export interface SimConfig {
  seed: number;
  archetype: Archetype;
  days: number;
  minutesPerDay: number;
  /** True-structure scenario shares (general, topic, graph, own). */
  truthShares: [number, number, number, number];
}

export interface SimStudent {
  theta: Float64Array; // TRUE logit mastery per concept
  bTrue: Float64Array; // true difficulty noise per item
  STrue: Float64Array; // true stability per concept
  lastStudy: Float64Array;
}

export interface SimResult {
  examMarks: number;
  passProb: number;
  finalTheta: Float64Array;
  /** Mean |σ(μ) − σ(θ_true)| across concepts (techgram policy only). */
  calibrationError?: number;
  /** |expected score − true expected score| per day (techgram policy only). */
  levelErrorTrajectory?: number[];
  /** The kernel's final state (techgram policy only) — for demos/inspection. */
  finalSys?: SystemState;
}

export function makeSimStudent(model: BeliefModel, cfg: SimConfig): SimStudent {
  const N = model.N;
  const rng = makeRng(cfg.seed * 7919 + 13);
  const [gen, top, graph, own] = cfg.truthShares;
  const A = buildAdjacency(model.content, N, model.index);
  const L = laplacian(A, N);
  for (let i = 0; i < N; i++) L[i * N + i] += 0.3;
  const Kg = invert(L, N);
  const cov = new Float64Array(N * N);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      let v = gen;
      if (model.topicIndexOf[i] === model.topicIndexOf[j]) v += top;
      v += graph * Kg[i * N + j];
      if (i === j) v += own;
      cov[i * N + j] = v;
    }
  }
  let dm = 0;
  for (let i = 0; i < N; i++) dm += cov[i * N + i];
  dm /= N;
  for (let k = 0; k < cov.length; k++) cov[k] *= 1.4 / dm;
  for (let i = 0; i < N; i++) cov[i * N + i] += 1e-6;
  const Lc = cholesky(cov, N);

  const theta = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    let s = 0;
    for (let j = 0; j <= i; j++) s += Lc[i * N + j] * rng.normal(0, 1);
    theta[i] = -0.4 + s;
  }
  const bTrue = new Float64Array(model.content.items.length);
  model.content.items.forEach((it, k) => {
    bTrue[k] = expertDifficultyToLogit(it.difficulty) + rng.normal(0, 0.4);
  });
  const STrue = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const type = model.content.conceptById.get(model.byIdx[i]!)!.type;
    STrue[i] = Math.max(1.5, DEFAULT_MEMORY_PARAMS.initialStability[type] * Math.exp(rng.normal(0, 0.5)));
  }
  return { theta, bTrue, STrue, lastStudy: new Float64Array(N).fill(-999) };
}

export function simRespond(model: BeliefModel, student: SimStudent, itemIdx: number, conceptIdx: number, rng: Rng): boolean {
  const p =
    model.content.exam.guessFloor +
    (1 - model.content.exam.guessFloor) *
      sigmoid(model.params.discrimination * (student.theta[conceptIdx] - student.bTrue[itemIdx]));
  return rng.next() < p;
}

/**
 * Apply a study block to the TRUE learner (identical pedagogy across policies).
 * Learning a concept whose true prerequisites are weak yields half gain —
 * this is the pedagogical reality that intelligent sequencing exploits.
 */
export function simStudy(
  student: SimStudent,
  model: BeliefModel,
  conceptIdx: number,
  action: "learn" | "practice" | "review" | "remediate" | "diagnose",
  minutes: number,
  day: number,
  rng: Rng,
): void {
  if (action === "diagnose") return;
  const gain10 =
    action === "learn" ? 0.3 : action === "remediate" ? 0.28 : action === "practice" ? 0.22 : 0.1;
  const mastery = sigmoid(student.theta[conceptIdx]);
  const concept = model.content.conceptById.get(model.byIdx[conceptIdx]!)!;
  let prereqPenalty = 1;
  for (const pid of concept.prereqs) {
    const pi = model.index.get(pid);
    if (pi !== undefined && sigmoid(student.theta[pi]) < 0.5) {
      prereqPenalty = 0.5;
      break;
    }
  }
  const gain = gain10 * (minutes / 10) * (1 - mastery) * prereqPenalty * (0.8 + 0.4 * rng.next());
  student.theta[conceptIdx] += gain;
  const tSince = Math.max(0, day - student.lastStudy[conceptIdx]);
  const Rtrue = 1 / (1 + tSince / (9 * student.STrue[conceptIdx]));
  const growth = action === "review" ? 1.6 + 0.8 * (1 - Rtrue) : 1.2;
  student.STrue[conceptIdx] = Math.min(student.STrue[conceptIdx] * Math.min(growth, 3), 3650);
  student.lastStudy[conceptIdx] = day;
}

export function simDecayDay(student: SimStudent, model: BeliefModel): void {
  void model;
  for (let i = 0; i < student.theta.length; i++) {
    const d = Math.exp(-1 / Math.max(student.STrue[i], 0.5));
    student.theta[i] = -0.4 + d * (student.theta[i] + 0.4);
  }
}

export function simAdherence(cfg: SimConfig, day: number, rng: Rng): number {
  switch (cfg.archetype) {
    case "consistent":
      return cfg.minutesPerDay;
    case "crammer":
      return day % 3 === 0 ? cfg.minutesPerDay * 1.5 : 0;
    case "avoidant":
      return rng.next() < 0.85 ? cfg.minutesPerDay : 0;
    case "drifter":
      return rng.next() < 0.7 ? cfg.minutesPerDay * 0.8 : 0;
  }
}

/** True expected exam marks (analytic, full-paper scale) — the honest metric. */
export function trueExamMarks(model: BeliefModel, student: SimStudent): number {
  let wSum = 0;
  for (let i = 0; i < model.N; i++) wSum += model.content.conceptWeight.get(model.byIdx[i]!) ?? 0;
  const scale = wSum > 0 ? model.content.exam.questions / wSum : 0;
  let marks = 0;
  for (let i = 0; i < model.N; i++) {
    const w = model.content.conceptWeight.get(model.byIdx[i]!) ?? 0;
    if (w === 0) continue;
    const p =
      model.content.exam.guessFloor +
      (1 - model.content.exam.guessFloor) *
        sigmoid(model.params.discrimination * (student.theta[i] - model.conceptB[i]));
    marks += w * model.content.exam.marksEach * p * scale;
  }
  return marks;
}

/** True P(pass): Monte Carlo over question sampling + cutoff noise. */
export function truePassProbability(model: BeliefModel, student: SimStudent, rng: Rng, draws = 400): number {
  const N = model.N;
  const weights: number[] = [];
  let wSum = 0;
  for (let i = 0; i < N; i++) {
    const w = model.content.conceptWeight.get(model.byIdx[i]!) ?? 0;
    weights.push(w);
    wSum += w;
  }
  const exam = model.content.exam;
  let pass = 0;
  for (let d = 0; d < draws; d++) {
    const cutoff = rng.normal(exam.cutoff.mean, exam.cutoff.sd);
    let marks = 0;
    for (let q = 0; q < exam.questions; q++) {
      let r = rng.next() * wSum;
      let ci = 0;
      for (; ci < N - 1; ci++) {
        r -= weights[ci];
        if (r <= 0) break;
      }
      const b = model.conceptB[ci] + rng.normal(0, 0.8);
      const p = exam.guessFloor + (1 - exam.guessFloor) * sigmoid(model.params.discrimination * (student.theta[ci] - b));
      const conf = Math.min(0.99, Math.max(0.01, p + rng.normal(0, 0.12)));
      if (conf >= exam.attemptBreakEven) {
        if (rng.next() < p) marks += exam.marksEach;
        else marks -= exam.marksEach * exam.negativeFraction;
      }
    }
    if (marks >= cutoff) pass++;
  }
  return pass / draws;
}

function baselinePlan(
  model: BeliefModel,
  policy: "fixed_order" | "random",
  minutes: number,
  day: number,
  rng: Rng,
  cursorRef: { i: number },
): Plan {
  const blocks: Plan["blocks"] = [];
  let used = 0;
  while (used + 25 <= minutes && blocks.length < Math.floor(minutes / 25)) {
    const c =
      policy === "fixed_order"
        ? model.content.concepts[cursorRef.i++ % model.N]!
        : model.content.concepts[rng.int(model.N)]!;
    blocks.push({
      conceptId: c.id,
      conceptName: c.name,
      action: policy === "fixed_order" ? "learn" : rng.next() < 0.5 ? "learn" : "practice",
      minutes: 25,
      expectedGainMarks: 0,
      gainPerMinute: 0,
      reason: policy === "fixed_order" ? "fixed syllabus order (baseline)" : "random allocation (baseline)",
      assumption: "assumed",
    });
    used += 25;
  }
  return { day, blocks, totalMinutes: used, expectedGainMarks: 0, paramsVersion: `baseline-${policy}` };
}

export interface RunCallbacks {
  onPlan?: (day: number, plan: Plan) => void;
}

/** Run one simulated student under one scheduling policy for cfg.days. */
export function runSim(model: BeliefModel, cfg: SimConfig, policy: Policy, cb?: RunCallbacks): SimResult {
  const rng = makeRng(cfg.seed * 104729 + 17);
  const student = makeSimStudent(model, cfg);
  const memParams: MemoryParams = DEFAULT_MEMORY_PARAMS;

  let sys: SystemState = newSystemState(model);
  const events: StudentEvent[] = [];
  let evCounter = 0;
  let folded = 0; // index into events: everything before this is folded into sys

  const emit = (type: StudentEvent["type"], payload: Record<string, unknown>, day: number) => {
    evCounter += 1;
    events.push({
      event_id: `ev_${evCounter}`,
      student_id: "sim",
      day,
      type,
      payload,
      source: "sim",
      schema_version: 1,
      idempotency_key: `sim-${cfg.seed}-${policy}-${evCounter}`,
    });
  };

  const cursorRef = { i: 0 };
  const levelErr: number[] = [];
  let itemsSeen = 0;

  for (let day = 1; day <= cfg.days; day++) {
    const daysToExam = cfg.days - day;
    simDecayDay(student, model);
    const minutes = simAdherence(cfg, day, rng);
    if (minutes === 0) {
      if (policy === "techgram") timeUpdate(model, sys.belief, sys.memory, 1);
      continue;
    }

    let plan: Plan;
    if (policy === "techgram") {
      timeUpdate(model, sys.belief, sys.memory, 1);
      plan = planDay(
        model,
        sys.belief,
        { day, daysToExam, minutesAvailable: minutes, prepHorizonDays: cfg.days, memory: sys.memory },
        DEFAULT_PLANNER_PARAMS,
        rng,
      );
      cb?.onPlan?.(day, plan);
    } else {
      plan = baselinePlan(model, policy, minutes, day, rng, cursorRef);
    }

    for (const block of plan.blocks) {
      const ci = model.index.get(block.conceptId)!;
      simStudy(student, model, ci, block.action as "learn" | "practice" | "review" | "remediate" | "diagnose", block.minutes, day, rng);
      const nItems = block.action === "diagnose" ? 4 : Math.max(2, Math.floor(block.minutes / 8));
      const items = model.content.itemsByConcept.get(block.conceptId) ?? [];
      if (items.length === 0) continue;
      for (let k = 0; k < nItems; k++) {
        const it = items[itemsSeen++ % items.length];
        const itemIdx = model.content.items.indexOf(it);
        const correct = simRespond(model, student, itemIdx, ci, rng);
        if (policy === "techgram") {
          const rapid = rng.next() < 0.15;
          emit("item_response", { concept_id: block.conceptId, item_id: it.id, correct, time_sec: rapid ? 2 : it.expectedTimeSec }, day);
        }
      }
    }

    // Fold the day's events into the kernel state (exact production path).
    while (folded < events.length) {
      sys = applyEvent(model, sys, events[folded++], memParams);
    }

    if (policy === "techgram") {
      const es = expectedScore(model, sys.belief);
      const truth = trueExamMarks(model, student);
      levelErr.push(Math.abs(es - truth));
    }
  }

  const result: SimResult = {
    examMarks: trueExamMarks(model, student),
    passProb: truePassProbability(model, student, rng),
    finalTheta: student.theta,
  };
  if (policy === "techgram") {
    let acc = 0;
    for (let i = 0; i < model.N; i++) acc += Math.abs(sigmoid(sys.belief.mu[i]) - sigmoid(student.theta[i]));
    result.calibrationError = acc / model.N;
    result.levelErrorTrajectory = levelErr;
    result.finalSys = sys;
  }
  return result;
}

/** Aggregate policies over archetypes × students. */
export function aggregate(
  model: BeliefModel,
  days: number,
  studentsPerCell: number,
  seedsBase: number,
  policies: Policy[],
): Record<Policy, { meanMarks: number; meanPass: number; meanCalibration: number | null }> {
  const archetypes: Archetype[] = ["consistent", "crammer", "avoidant", "drifter"];
  const out: Record<string, { marks: number[]; pass: number[]; calib: number[] }> = {};
  for (const p of policies) out[p] = { marks: [], pass: [], calib: [] };
  let seed = seedsBase;
  for (const a of archetypes) {
    for (let s = 0; s < studentsPerCell; s++) {
      for (const p of policies) {
        const cfg: SimConfig = { seed: seed++, archetype: a, days, minutesPerDay: 240, truthShares: [0.25, 0.25, 0.15, 0.35] };
        const r = runSim(model, cfg, p);
        out[p].marks.push(r.examMarks);
        out[p].pass.push(r.passProb > 0.5 ? 1 : 0);
        if (r.calibrationError !== undefined) out[p].calib.push(r.calibrationError);
      }
    }
  }
  const mean = (xs: number[]) => (xs.length ? xs.reduce((x, y) => x + y, 0) / xs.length : 0);
  const res = {} as Record<Policy, { meanMarks: number; meanPass: number; meanCalibration: number | null }>;
  for (const p of policies) {
    res[p] = { meanMarks: mean(out[p].marks), meanPass: mean(out[p].pass), meanCalibration: out[p].calib.length ? mean(out[p].calib) : null };
  }
  return res;
}

export type { MemoryCell };
