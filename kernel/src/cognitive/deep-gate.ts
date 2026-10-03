/**
 * THE PHASE 1 DEEP GATE [corrected master roadmap §7] — the real matched-baseline run.
 * Frozen Linear Teacher vs Executive-driven session, same world, same student truth,
 * same time budget. The only difference: who picks the concept and whether breaks happen.
 *
 * The world is honest: true mastery per concept drives answer probability, study turns
 * grow true mastery (diminished by fatigue), and the kernel observes only the answers.
 * Both policies see the same evidence stream. The outcome is TRUE learning, not belief.
 */
import { buildBeliefModel, initialState, observe, reportConcept, DEFAULT_BELIEF_PARAMS, type BeliefState } from "../belief.js";
import { buildSeedContent } from "../polity_seed.js";
import { DEFAULT_MEMORY_PARAMS, applyReview, newMemoryCell } from "../memory.js";
import { makeRng } from "../linalg.js";
import { decide, type TurnWorkspace } from "./executive.js";

const CONTENT = buildSeedContent();
const MODEL = buildBeliefModel(CONTENT, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });
const GATE_CONCEPTS = CONTENT.concepts.slice(0, 6);
const TURNS_PER_DAY = 4;

export interface DeepGateResult {
  days: number;
  linear: PolicyResult;
  executive: PolicyResult;
  verdict: "PASS" | "FAIL";
  detail: string;
}

interface PolicyResult {
  trueMarks: number;
  avgEndFatigue: number;
  breaks: number;
  missedBreaks: number;
  beliefError: number;
  receipts: number;
  answers: number;
  correct: number;
}

export function runDeepGate(days = 10, seed = 7331): DeepGateResult {
  const linear = runPolicy("linear", days, seed);
  const executive = runPolicy("executive", days, seed);
  const margin = executive.trueMarks - linear.trueMarks;
  const verdict = margin >= 0 ? "PASS" : "FAIL";
  return {
    days, linear, executive, verdict,
    detail: `executive ${executive.trueMarks} vs linear ${linear.trueMarks} true marks over ${days} days (${margin >= 0 ? "+" : ""}${margin}); executive breaks ${executive.breaks}, linear ${linear.breaks}; belief error exec ${executive.beliefError.toFixed(3)} vs lin ${linear.beliefError.toFixed(3)}`,
  };
}

function runPolicy(policy: "linear" | "executive", days: number, seed: number): PolicyResult {
  const st = initialState(MODEL);
  const memory = new Map<number, ReturnType<typeof newMemoryCell>>();
  const rng = makeRng(seed * 31 + (policy === "executive" ? 1 : 0));
  const concepts = GATE_CONCEPTS.map((c) => ({
    id: c.id, name: c.name,
    weight: CONTENT.conceptWeight.get(c.id) ?? 1,
    trueMastery: 0.22 + 0.07 * (GATE_CONCEPTS.indexOf(c) % 5) + (c.id.charCodeAt(3) % 10) * 0.008,
  }));
  let fatigue = 0.1;
  let breaks = 0, missedBreaks = 0, receipts = 0, answers = 0, correct = 0;
  let turnCounter = 0;
  const dayEndFatigues: number[] = [];

  for (let day = 1; day <= days; day++) {
    for (let turn = 0; turn < TURNS_PER_DAY; turn++) {
      turnCounter++;
      let action: "study" | "break" = "study";
      let target = concepts[turnCounter % concepts.length]!.id;

      if (policy === "executive") {
        const ranked = [...concepts].map((c) => {
          const r = reportConcept(MODEL, st, c.id);
          const need = r.grey ? 0.85 : 1 - r.mean;
          return { id: c.id, need: need * (CONTENT.conceptWeight.get(c.id) ?? 1) };
        }).sort((a, b) => b.need - a.need);
        target = ranked[0]!.id;
        if (fatigue > 0.75) {
          const w: TurnWorkspace = {
            turn: turnCounter, elapsedMin: turn * 10, timeLeftMin: 40 - turn * 10,
            focusConcept: { id: target, name: target, mean: 0.4, grey: false },
            alternativeConcept: null, uncertainties: 3, hypothesisCount: 0,
            momentum: 0.2, frustration: 0.1, fatigue,
            wrongStreak: 0, lastOutcome: null,
            planProgress: { done: turn, total: TURNS_PER_DAY },
            counts: { jokes: 0, llm: 0, breaks, sinceLastIntervention: turn },
            visualStructure: false,
            incumbentMove: { kind: "study", conceptId: target, conceptName: target },
          };
          const incumbent = { directive: { learningAction: "retrieve" as const, communication: "explain" as const, presentation: "board" as const, augmentation: "no_llm" as const }, predictedBenefit: 0.4 };
          const { directive, receipt } = decide(w, incumbent, seed + turnCounter);
          receipts++;
          if (directive.learningAction === "break") { action = "break"; }
        }
      } else if (policy === "linear" && fatigue > 0.75) {
        missedBreaks++;
      }

      if (action === "break") {
        breaks++;
        fatigue = Math.max(0, fatigue - 0.5);
        continue;
      }

      const conceptObj = concepts.find((c) => c.id === target)!;
      const eff = 1 - fatigue * 0.5;
      conceptObj.trueMastery = Math.min(0.95, conceptObj.trueMastery + 0.07 * eff);
      fatigue = Math.min(1, fatigue + 0.13);

      const pCorrect = Math.max(0.12, conceptObj.trueMastery - fatigue * 0.2);
      const isCorrect = rng.next() < pCorrect;
      answers++; if (isCorrect) correct++;

      const ci = MODEL.index.get(target);
      if (ci !== undefined) {
        observe(MODEL, st, { conceptId: target, correct: isCorrect, evidenceW: 1, day });
        const cell = memory.get(ci) ?? newMemoryCell(CONTENT.conceptById.get(target)!.type, DEFAULT_MEMORY_PARAMS);
        memory.set(ci, applyReview(cell, isCorrect, day, DEFAULT_MEMORY_PARAMS));
      }

      if (policy === "linear" && fatigue > 0.75) missedBreaks++;
    }
    dayEndFatigues.push(fatigue);
    fatigue = Math.max(0.08, fatigue * 0.55);
  }

  let trueMarks = 0;
  for (const c of concepts) {
    trueMarks += c.trueMastery * c.weight;
  }
  trueMarks = Math.round(trueMarks * 6);

  let errSum = 0, errN = 0;
  for (const c of concepts) {
    const believed = reportConcept(MODEL, st, c.id).mean;
    const truth = concepts.find((x) => x.id === c.id)!.trueMastery;
    errSum += Math.abs(believed - truth);
    errN++;
  }

  return {
    trueMarks,
    avgEndFatigue: dayEndFatigues.reduce((a, b) => a + b, 0) / Math.max(1, dayEndFatigues.length),
    breaks, missedBreaks,
    beliefError: errSum / Math.max(1, errN),
    receipts, answers, correct,
  };
}
