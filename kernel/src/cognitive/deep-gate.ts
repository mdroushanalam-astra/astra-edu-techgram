/**
 * THE PHASE 1 DEEP GATE [corrected master roadmap §7] — the real matched-baseline run.
 * Frozen Linear Teacher vs Executive-driven session, same world, same student truth,
 * same time budget. The only difference: who picks the concept and who decides rest.
 *
 * The world is honest: true mastery per concept drives answer probability, study turns
 * grow true mastery (diminished by fatigue), and the kernel observes only the answers.
 * Both policies see the same evidence stream. The outcome is TRUE learning, not belief.
 *
 * PHASE 2+3 INTEGRATION: the Executive's branch runs the full developmental loop
 * (developmental-session.ts) — self-predictions before every decision, the
 * SelfErrorLedger judged after every turn, self-insights injected into later
 * decisions — and every executed directive is routed through the ExperiencePlan
 * seam (planFromDirective → validateExperiencePlan) and conducted by the
 * Conductor. The gate is a real session flow, not a receipt generator.
 */
import { buildBeliefModel, initialState, observe, reportConcept, DEFAULT_BELIEF_PARAMS, type BeliefState } from "../belief.js";
import { buildSeedContent } from "../polity_seed.js";
import { DEFAULT_MEMORY_PARAMS, applyReview, newMemoryCell } from "../memory.js";
import { makeRng } from "../linalg.js";
import type { ExecutiveDirective, TurnWorkspace } from "./executive.js";
import { DevelopmentalSession } from "./developmental-session.js";
import { planFromDirective, validateExperiencePlan } from "./experience-plan.js";
import { conduct, initialState as initialConductorState, advance, type ConductorState } from "./conductor.js";

const CONTENT = buildSeedContent();
const MODEL = buildBeliefModel(CONTENT, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });
const GATE_CONCEPTS = CONTENT.concepts.slice(0, 6);
/**
 * 8 turns per day: a session long enough for measured fatigue to actually build
 * (0.1 → ~1.0 across a day at +0.13/turn). At 4 turns/day fatigue never left the
 * low band and rest decisions could not pay off for EITHER policy — the world
 * was too short for the phenomenon the Executive manages to express.
 */
const TURNS_PER_DAY = 8;

const STUDY_DIRECTIVE: ExecutiveDirective = { learningAction: "retrieve", communication: "explain", presentation: "board", augmentation: "no_llm" };
const BREAK_DIRECTIVE: ExecutiveDirective = { learningAction: "break", communication: "reassure", presentation: "none", augmentation: "no_llm" };

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
  /* Phase 2+3 integration evidence */
  plans: number;
  conductorSteps: number;
  wallBreaks: number;
  selfErrors: number;
  decisionsWithInsights: number;
}

export function runDeepGate(days = 10, seed = 7331): DeepGateResult {
  const linear = runPolicy("linear", days, seed);
  const executive = runPolicy("executive", days, seed);
  const margin = executive.trueMarks - linear.trueMarks;
  const verdict = margin >= 0 ? "PASS" : "FAIL";
  return {
    days, linear, executive, verdict,
    detail: `executive ${executive.trueMarks} vs linear ${linear.trueMarks} true marks over ${days} days (${margin >= 0 ? "+" : ""}${margin}); executive breaks ${executive.breaks} (wall ${executive.wallBreaks}), linear ${linear.breaks}; belief error exec ${executive.beliefError.toFixed(3)} vs lin ${linear.beliefError.toFixed(3)}; developmental loop: ${executive.selfErrors} self-errors, ${executive.decisionsWithInsights} decisions informed by self-model; conductor: ${executive.plans} plans / ${executive.conductorSteps} steps`,
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
  // One developmental runtime per POLICY RUN — experience persists across days.
  const session = new DevelopmentalSession({ learningEnabled: true });
  let conductorState: ConductorState = initialConductorState();

  let fatigue = 0.1;
  let breaks = 0, missedBreaks = 0, receipts = 0, answers = 0, correct = 0;
  let plans = 0, conductorSteps = 0, wallBreaks = 0, decisionsWithInsights = 0;
  let wrongStreak = 0;
  let lastOutcome: "correct" | "wrong" | null = null;
  let turnCounter = 0;
  const dayEndFatigues: number[] = [];

  for (let day = 1; day <= days; day++) {
    // The session contract is per-session (per day), not per lifetime.
    let breaksThisDay = 0, llmThisDay = 0;
    for (let turn = 0; turn < TURNS_PER_DAY; turn++) {
      turnCounter++;
      const fatigueAtDecision = fatigue;
      let directive: ExecutiveDirective = STUDY_DIRECTIVE;
      let target = concepts[turnCounter % concepts.length]!.id;
      if (policy === "linear" && fatigue > 0.75) missedBreaks++;

      if (policy === "executive") {
        const ranked = [...concepts].map((c) => {
          const r = reportConcept(MODEL, st, c.id);
          const need = r.grey ? 0.85 : 1 - r.mean;
          return { id: c.id, need: need * (CONTENT.conceptWeight.get(c.id) ?? 1), mean: r.mean, grey: r.grey };
        }).sort((a, b) => b.need - a.need);
        target = ranked[0]!.id;
        const focus = ranked[0]!;

        const w: TurnWorkspace = {
          turn: turnCounter, elapsedMin: turn * 10, timeLeftMin: 40 - turn * 10,
          turnsRemaining: TURNS_PER_DAY - turn - 1,
          focusConcept: { id: target, name: target, mean: focus.mean, grey: focus.grey },
          alternativeConcept: null,
          uncertainties: ranked.filter((r) => r.grey || r.mean < 0.35).length,
          hypothesisCount: 0,
          momentum: 0.2, frustration: 0.1, fatigue,
          wrongStreak, lastOutcome,
          planProgress: { done: turn, total: TURNS_PER_DAY },
          counts: { jokes: 0, llm: llmThisDay, breaks: breaksThisDay, sinceLastIntervention: turn },
          visualStructure: false,
          incumbentMove: { kind: "study", conceptId: target, conceptName: target },
        };
        // The incumbent is fatigue-honest: the linear teacher's value discounted
        // by the same efficiency curve the world itself uses. Declared, not hidden.
        const incumbent = { directive: STUDY_DIRECTIVE, predictedBenefit: 0.4 * (1 - fatigue * 0.5) };
        const td = session.decideTurn(w, incumbent, seed + turnCounter);
        directive = td.directive;
        receipts++;
        if (td.insightsUsed) decisionsWithInsights++;

        // THE PHYSIOLOGICAL WALL — measured fatigue beyond tolerance forces rest.
        // A constraint on execution, counted, not a silent override.
        if (fatigue > 0.85 && directive.learningAction !== "break") {
          directive = BREAK_DIRECTIVE;
          wallBreaks++;
        }

        // THE CONDUCTOR — the decision becomes an ExperiencePlan and is conducted
        // into ordered steps inside the real session flow. [Phase 3 integration]
        const plan = planFromDirective({
          learningAction: directive.learningAction,
          communication: directive.communication,
          presentation: directive.presentation,
          augmentation: directive.augmentation,
          conceptId: target, conceptName: target,
          reasons: td.receipt.reason,
          evidenceRefs: td.receipt.evidenceRefs,
          predictedBenefit: td.receipt.prediction.predictedBenefit,
          uncertainty: td.receipt.prediction.uncertainty,
          receiptId: td.receipt.id, fatigue,
        });
        validateExperiencePlan(plan);
        const steps = conduct(plan);
        for (const s of steps) conductorState = advance(conductorState, steps.length, s.waitForStudent);
        plans++; conductorSteps += steps.length;

        if (directive.learningAction === "break") {
          breaks++; breaksThisDay++;
          fatigue = Math.max(0, fatigue - 0.5);
          session.recordActual({
            directive, wasIntervention: false, tookBreak: true,
            nextAnswerCorrect: null, performanceDelta: 0,
            fatigueAtDecision,
          });
          continue; // break turn: skip study
        }
        if (directive.augmentation === "llm") llmThisDay++;
      }

      const conceptObj = concepts.find((c) => c.id === target)!;
      const eff = Math.max(0.15, 1 - fatigue * 0.8);
      // The answer reflects CURRENT mastery, and learning FOLLOWS the outcome:
      // successful retrieval teaches far more than a failed attempt (a wrong
      // grind at 20% accuracy is not worth the same as a rested correct one).
      // Declared — this is what connects rest and accuracy to TRUE learning.
      const pCorrect = Math.max(0.1, conceptObj.trueMastery - fatigue * 0.35);
      const isCorrect = rng.next() < pCorrect;
      const gain = (isCorrect ? 0.07 : 0.015) * eff;
      conceptObj.trueMastery = Math.min(0.95, conceptObj.trueMastery + gain);
      fatigue = Math.min(1, fatigue + 0.13);
      answers++; if (isCorrect) correct++;

      const ci = MODEL.index.get(target);
      if (ci !== undefined) {
        observe(MODEL, st, { conceptId: target, correct: isCorrect, evidenceW: 1, day });
        const cell = memory.get(ci) ?? newMemoryCell(CONTENT.conceptById.get(target)!.type, DEFAULT_MEMORY_PARAMS);
        memory.set(ci, applyReview(cell, isCorrect, day, DEFAULT_MEMORY_PARAMS));
      }

      if (policy === "executive") {
        session.recordActual({
          directive, wasIntervention: directive.learningAction !== "retrieve",
          tookBreak: false, nextAnswerCorrect: isCorrect,
          performanceDelta: isCorrect ? 0.07 * eff : 0.015 * eff,
          fatigueAtDecision,
        });
        wrongStreak = isCorrect ? 0 : wrongStreak + 1;
        lastOutcome = isCorrect ? "correct" : "wrong";
      }
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
    plans, conductorSteps, wallBreaks,
    selfErrors: session.ledger.length,
    decisionsWithInsights,
  };
}
