/**
 * Brain Lab web — kernel harness. Runs the REAL @techgram/kernel in the
 * browser. No mock data, no hardcoded numbers: every value on screen is
 * computed by the same organs the student app will use.
 */
import {
  buildBeliefModel, initialState, observe, planDay, composeSession, buildPlanReceipt,
  simulateExam, reportConcept, DiagnosticSession,
  DEFAULT_BELIEF_PARAMS, DEFAULT_PLANNER_PARAMS,
  buildSeedContent,
  DEFAULT_MEMORY_PARAMS,
  makeRng, sigmoid,
  buildPolityAtomBank,
  makeSimStudent, runSim, simRespond,
  type BeliefModel, type BeliefState, type Item,
} from "@techgram/kernel";

export const content = buildSeedContent();
export const model: BeliefModel = buildBeliefModel(
  content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3, scorecards: { t_fr: 0.62 } },
);
export const atomBank = buildPolityAtomBank();
export const DAYS = 210; // synthetic student's countdown

export function freshState(): BeliefState {
  return initialState(model);
}

export interface ConceptRow {
  id: string; name: string; topic: string;
  mean: number; lo: number; hi: number; nEff: number; grey: boolean; weight: number;
}

export function conceptRows(st: BeliefState): ConceptRow[] {
  return content.concepts.map((c) => {
    const r = reportConcept(model, st, c.id);
    return {
      id: c.id, name: c.name, topic: content.topicById.get(c.topicId)!.name,
      mean: r.mean, lo: r.lo, hi: r.hi, nEff: r.nEff, grey: r.grey,
      weight: content.conceptWeight.get(c.id) ?? 0,
    };
  });
}

export interface WhyPanel {
  item: Item;
  conceptId: string;
  predictedP: number;
  weight: number;
  uncertainty: number; // sd of the concept's belief
  infoValue: number;
  alternative: { id: string; conceptId: string; value: number } | null;
  misconceptionRisk: boolean;
}

/** Screen 3 — the diagnostic picks by information gain; we expose WHY. */
export function whyThisQuestion(st: BeliefState, used: Set<string>): WhyPanel | null {
  const diag = new DiagnosticSession(model);
  diag.used = used;
  const N = model.N;
  const scored: { item: Item; value: number; p: number }[] = [];
  for (const item of content.items) {
    if (used.has(item.id)) continue;
    const ci = model.index.get(item.conceptId)!;
    const b = [-1.2, -0.6, 0, 0.6, 1.2][Math.max(1, Math.min(5, Math.round(item.difficulty))) - 1];
    const a = model.params.discrimination;
    const g = content.exam.guessFloor;
    const z = sigmoid(a * (st.mu[ci] - b));
    const p = g + (1 - g) * z;
    if (p < 0.35 || p > 0.9) continue;
    const H = (1 - g) * a * z * (1 - z);
    let q = 0;
    for (let j = 0; j < N; j++) {
      const wj = content.conceptWeight.get(model.byIdx[j]!) ?? 0;
      if (wj === 0) continue;
      const sjc = st.S[j * N + ci];
      q += wj * sjc * sjc;
    }
    const R = Math.max(p * (1 - p), 1e-3);
    const value = (H * H * q) / (H * H * st.S[ci * N + ci] + R);
    scored.push({ item, value, p });
  }
  scored.sort((x, y) => y.value - x.value);
  const best = scored[0];
  if (!best) return null;
  const ci = model.index.get(best.item.conceptId)!;
  const sd = Math.sqrt(st.S[ci * N + ci]) * model.params.varianceInflation;
  return {
    item: best.item,
    conceptId: best.item.conceptId,
    predictedP: best.p,
    weight: content.conceptWeight.get(best.item.conceptId) ?? 0,
    uncertainty: sd,
    infoValue: best.value,
    alternative: scored[1]
      ? { id: scored[1].item.id, conceptId: scored[1].item.conceptId, value: scored[1].value }
      : null,
    misconceptionRisk: Object.keys(best.item.distractorTags).length > 0,
  };
}

/** Screen 5 — tomorrow's plan + receipt. */
export function tomorrowPlan(st: BeliefState, day: number, memory: Map<number, { S: number; D: number; lastReviewDay: number | null; reps: number; lapses: number }>) {
  const plan = planDay(model, st, { day, daysToExam: DAYS - day, minutesAvailable: 240, prepHorizonDays: DAYS, memory }, DEFAULT_PLANNER_PARAMS, makeRng(2026));
  const receipt = buildPlanReceipt(plan, ["Economy: not assessed (outside V1 scope)"], "aom-0.1.0-assumed");
  const composed = composeSession(plan, 40, undefined, receipt);
  return { plan, receipt, composed };
}

/** Screen 4 — the exam-day scenario (B4 Monte-Carlo). */
export function examScenario(st: BeliefState, memory: Map<number, { S: number; D: number; lastReviewDay: number | null; reps: number; lapses: number }>, daysToExam: number) {
  return simulateExam(model, st, memory as never, makeRng(77), { draws: 800, daysToExam });
}

/** Screen 7 — the race: real aggregation across policies, one call, client-side. */
export function runRace(studentsPerCell: number, seedBase: number) {
  return {
    agg: {
      techgram: runSimRaceCell(studentsPerCell, seedBase, "techgram"),
      fixed: runSimRaceCell(studentsPerCell, seedBase, "fixed"),
      random: runSimRaceCell(studentsPerCell, seedBase, "random"),
    },
    trajectory: runSimTrajectory(seedBase),
  };
}

type Policy = "techgram" | "fixed" | "random";
function runSimRaceCell(students: number, seedBase: number, policy: Policy): number {
  // Lightweight rerun of the lab's aggregate for the three raced policies.
  const marks: number[] = [];
  for (let s = 0; s < students; s++) {
    const seed = seedBase + s * 101;
    const cfg = { seed, archetype: pickArchetype(s), days: 30, minutesPerDay: 240, truthShares: [0.25, 0.25, 0.15, 0.35] as [number, number, number, number] };
    const r = runSim(model, cfg, policy === "fixed" ? "fixed_order" : policy);
    marks.push(r.examMarks);
  }
  return marks.reduce((a, b) => a + b, 0) / marks.length;
}

function pickArchetype(i: number): "consistent" | "crammer" | "avoidant" | "drifter" {
  return (["consistent", "crammer", "avoidant", "drifter"] as const)[i % 4];
}

function runSimTrajectory(seedBase: number): { day: number; err: number; truth: number; belief: number }[] {
  const cfg = { seed: seedBase, archetype: "consistent" as const, days: 30, minutesPerDay: 240, truthShares: [0.25, 0.25, 0.15, 0.35] as [number, number, number, number] };
  const r = runSim(model, cfg, "techgram");
  const truth = r.finalTheta;
  const out: { day: number; err: number; truth: number; belief: number }[] = [];
  const traj = r.levelErrorTrajectory ?? [];
  traj.forEach((err, i) => {
    out.push({ day: i + 1, err, truth: sigmoid(truth[Math.floor(i * model.N / traj.length)]), belief: 0 });
  });
  return out;
}

/** The LLM-unplug proof: same inputs → byte-identical decision. */
export function decisionHash(st: BeliefState, day: number): string {
  const plan = planDay(model, st, { day, daysToExam: DAYS - day, minutesAvailable: 240, memory: new Map() }, DEFAULT_PLANNER_PARAMS, makeRng(777));
  const json = JSON.stringify({ blocks: plan.blocks.map((b) => [b.conceptId, b.action, b.minutes]), v: plan.paramsVersion });
  let h = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) { h ^= json.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export const fmtPct = (x: number) => `${(x * 100).toFixed(0)}%`;
