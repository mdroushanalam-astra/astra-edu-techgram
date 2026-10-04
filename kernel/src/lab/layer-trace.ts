/**
 * THE LAYER INTERACTION STUDY [ADR-045] — 24 real-time student situations,
 * every layer traced per turn, and every layer's INFLUENCE measured by ablation.
 *
 * Question the Founder asked: "test each layer to exactly know how they
 * function — give real-time simulations of student interaction and workflow,
 * 20-30 different situations (mindset, knowledge, everything), and check how
 * each layer interacted in real time."
 *
 * Method:
 *   1. TRACE  — a full session run records, per turn, what each layer did:
 *      Sensors → Belief (frozen) → Workspace → S1 self-prediction → C1
 *      Executive (candidates, blocks, deviation, confidence) → ExperiencePlan →
 *      Conductor → Expression → S2 ledger (after the outcome) → Outcome.
 *   2. ABLATE — re-run each situation with one layer's contribution removed
 *      (no self-model, no executive [linear], no physiological wall) and count
 *      how many decisions actually changed. Influence = measured, not claimed.
 *   3. AGGREGATE — layer activity rates, influence table, calibration of the
 *      self-predictions, and turn-by-turn narratives for vivid situations.
 *
 * The student is simulated from DECLARED truth models (archetype + knowledge
 * shape). Zero LLM decisions. Deterministic per seed.
 */
import { buildBeliefModel, initialState, observe, reportConcept, DEFAULT_BELIEF_PARAMS } from "../belief.js";
import { DEFAULT_MEMORY_PARAMS, applyReview, newMemoryCell } from "../memory.js";
import { decide, DEFAULT_STRATEGY, type ExecutiveDirective, type TurnWorkspace } from "../cognitive/executive.js";
import { DevelopmentalSession } from "../cognitive/developmental-session.js";
import { planFromDirective, validateExperiencePlan } from "../cognitive/experience-plan.js";
import { conduct, initialState as initialConductorState, advance } from "../cognitive/conductor.js";
import { composeExpression, validateUtterance } from "../cognitive/expression.js";
import { TechgramWorldAdapter, ARCHETYPES, makeWorldRng, type StudentProfile, type WorldState } from "../adapter/world-adapter.js";
import { minimalContent, polityWorld, cbseWorld } from "../adapter/worlds.js";

export type KnowledgeShape = "novice" | "mixed" | "advanced" | "spiky";

export interface Situation {
  id: string;
  name: string;
  /** The human story: mindset, knowledge, behaviour. */
  description: string;
  profile: StudentProfile;
  knowledge: KnowledgeShape;
  world: "polity" | "cbse";
  seed: number;
  days: number;
}

function p(over: Partial<StudentProfile>): StudentProfile {
  return { ...ARCHETYPES.steady!, ...over };
}

/** The twenty-four — mindsets × knowledge × behaviour. */
export const SITUATIONS: Situation[] = [
  { id: "t01", name: "Fresh novice, calm", description: "Knows almost nothing; relaxed and steady. Tests the engine on a fully grey map.", profile: p({ id: "novice_calm" }), knowledge: "novice", world: "polity", seed: 301, days: 6 },
  { id: "t02", name: "Fresh novice, anxious", description: "Knows almost nothing AND worries — noise up, clustering on. Tests gentle pacing under noise.", profile: p({ id: "novice_anxious", answerNoise: 0.2, fatigueSensitivity: 1.3, streakClustering: 0.15 }), knowledge: "novice", world: "polity", seed: 302, days: 6 },
  { id: "t03", name: "The steady middle", description: "Baseline adult learner: mixed knowledge, no drama. The control situation.", profile: p({ id: "mixed_calm" }), knowledge: "mixed", world: "polity", seed: 303, days: 6 },
  { id: "t04", name: "Overconfident middle", description: "Mixed knowledge but sure of themselves — the engine must catch miscalibration.", profile: p({ id: "mixed_overconfident", answerNoise: 0.05 }), knowledge: "mixed", world: "polity", seed: 304, days: 6 },
  { id: "t05", name: "Streaky middle", description: "Runs hot and cold — correct/wrong come in clusters.", profile: p({ id: "mixed_streaky", streakClustering: 0.25 }), knowledge: "mixed", world: "polity", seed: 305, days: 6 },
  { id: "t06", name: "Tires fast", description: "Fatigue hits hard and early — the rest machinery must earn its keep.", profile: p({ id: "mixed_fatiguer", fatigueSensitivity: 1.6, startFatigue: 0.2 }), knowledge: "mixed", world: "polity", seed: 306, days: 6 },
  { id: "t07", name: "Advanced and quick", description: "Knows most of it, learns fast — targeting must leave the known alone.", profile: p({ id: "advanced_quick", learningRate: 1.5 }), knowledge: "advanced", world: "polity", seed: 307, days: 6 },
  { id: "t08", name: "Advanced marathoner", description: "High stamina on advanced knowledge — fatigue barely matters; edge must come from targeting.", profile: p({ id: "advanced_stamina", fatigueSensitivity: 0.45 }), knowledge: "advanced", world: "polity", seed: 308, days: 6 },
  { id: "t09", name: "Spiky and sure", description: "Half the map mastered, half untouched — and confident throughout.", profile: p({ id: "spiky_confident", answerNoise: 0.05 }), knowledge: "spiky", world: "polity", seed: 309, days: 6 },
  { id: "t10", name: "Night-before crammer, spiky", description: "Starts every session already tired; knowledge is all-or-nothing.", profile: p({ id: "spiky_crammer", startFatigue: 0.45 }), knowledge: "spiky", world: "polity", seed: 310, days: 6 },
  { id: "t11", name: "Slow grinder", description: "Learns at half speed; needs patience and repetition, not speed.", profile: p({ id: "slow_grinder", learningRate: 0.55 }), knowledge: "mixed", world: "polity", seed: 311, days: 6 },
  { id: "t12", name: "Deep sleeper", description: "Recovers fully overnight — each day starts fresh; tests day-to-day pacing.", profile: p({ id: "recovery_sleeper", sleepFactor: 0.3 }), knowledge: "mixed", world: "polity", seed: 312, days: 6 },
  { id: "t13", name: "Anxious and slow", description: "Noise AND a slow learning rate — the engine must not mistake noise for inability.", profile: p({ id: "anxious_slow", answerNoise: 0.18, learningRate: 0.6, fatigueSensitivity: 1.2 }), knowledge: "mixed", world: "polity", seed: 313, days: 6 },
  { id: "t14", name: "Gifted and impatient", description: "Learns nearly twice as fast — the engine must keep up and not over-drill.", profile: p({ id: "gifted", learningRate: 1.8 }), knowledge: "mixed", world: "polity", seed: 314, days: 6 },
  { id: "t15", name: "Distracted answerer", description: "High answer noise from attention lapses — signals are faint.", profile: p({ id: "avoider", answerNoise: 0.28 }), knowledge: "mixed", world: "polity", seed: 315, days: 6 },
  { id: "t16", name: "Exam panic", description: "Arrives half-tired AND anxious — a pressure-cooker session.", profile: p({ id: "exam_panic", startFatigue: 0.5, answerNoise: 0.15, fatigueSensitivity: 1.3 }), knowledge: "mixed", world: "polity", seed: 316, days: 6 },
  { id: "t17", name: "Confident novice", description: "Knows nothing, thinks they know plenty — maximal miscalibration to surface.", profile: p({ id: "confident_novice", answerNoise: 0.08 }), knowledge: "novice", world: "polity", seed: 317, days: 6 },
  { id: "t18", name: "Humble advanced", description: "Advanced knowledge, no noise, no drama — the cleanest signal regime.", profile: p({ id: "humble_advanced" }), knowledge: "advanced", world: "polity", seed: 318, days: 6 },
  { id: "t19", name: "Inconsistent", description: "A quarter of answers are essentially coin-flips regardless of mastery.", profile: p({ id: "inconsistent", answerNoise: 0.25 }), knowledge: "mixed", world: "polity", seed: 319, days: 6 },
  { id: "t20", name: "Marathoner", description: "Stamina of a mule, sleeps badly — fatigue accumulates across days.", profile: p({ id: "marathoner", fatigueSensitivity: 0.5, sleepFactor: 0.75 }), knowledge: "mixed", world: "polity", seed: 320, days: 6 },
  { id: "t21", name: "Night owl", description: "Always starts tired, recovers poorly — the wall and rest levers live here.", profile: p({ id: "night_owl", startFatigue: 0.4, sleepFactor: 0.4, fatigueSensitivity: 1.1 }), knowledge: "mixed", world: "polity", seed: 321, days: 6 },
  { id: "t22", name: "Fragile streaks", description: "Streaks with real momentum — a bad patch can spiral.", profile: p({ id: "fragile_streak", streakClustering: 0.35 }), knowledge: "mixed", world: "polity", seed: 322, days: 6 },
  { id: "t23", name: "Steady advanced (CBSE)", description: "The same steady learner on a DIFFERENT curriculum — the boundary check.", profile: p({ id: "steady_cbse" }), knowledge: "advanced", world: "cbse", seed: 323, days: 6 },
  { id: "t24", name: "Everything at once", description: "Noisy AND streaky AND tires fast AND spiky knowledge — the chaos test.", profile: p({ id: "chaotic", answerNoise: 0.2, streakClustering: 0.25, fatigueSensitivity: 1.5, startFatigue: 0.3 }), knowledge: "spiky", world: "cbse", seed: 324, days: 6 },
];

/* ── the traced run ───────────────────────────────────────────────────────── */

export interface LayerTurnTrace {
  turn: number; day: number;
  sensor: { fatigue: number; streak: number; lastOutcome: string | null };
  belief: { target: string; mean: number; grey: boolean; uncertainties: number };
  s1_prediction: { emitted: number; categories: string[] };
  executive: { decision: string; confidence: number; candidateCount: number; candidates: string[]; blocked: string[]; deviated: boolean; insightsInjected: boolean; selfModelCandidate: boolean };
  s2_ledger: { newErrors: number; totalErrors: number; kinds: string[] };
  plan_conductor: { channels: number; steps: number };
  expression: { utterances: number; kinds: string[]; selfCorrection: boolean; praise: boolean; allProvenanceValid: boolean };
  outcome: { correct: boolean | null; masteryDelta: number };
  wall: boolean;
}

export interface SituationResult {
  id: string; name: string; description: string; world: string; knowledge: KnowledgeShape; seed: number; turns: number;
  marks: { executive: number; linear: number; margin: number };
  accuracy: { executive: number; linear: number };
  beliefError: { executive: number; linear: number };
  breaks: { executive: number; linearMissed: number; wall: number };
  selfErrors: number; predictionErrorRate: number; insightsInjectedPct: number;
  deviationPct: number; blockedPct: number; selfCorrectionVoiced: number; praiseVoiced: number;
  ablation: { noSelfModel: number; linear: number; beliefBlind: number; noWall: number }; // % of decisions changed when ablated
  ablationMarks: { noSelfModel: number; noWall: number; beliefBlind: number };
  trace: LayerTurnTrace[];
}

const STUDY: ExecutiveDirective = { learningAction: "retrieve", communication: "explain", presentation: "board", augmentation: "no_llm" };
const BREAK: ExecutiveDirective = { learningAction: "break", communication: "reassure", presentation: "none", augmentation: "no_llm" };

interface RunCfg {
  policy: "executive" | "linear";
  learningEnabled: boolean;
  wall: boolean;
  trace: boolean;
  /** Ablation: "need" = belief-driven targeting (normal); "roundrobin" = the executive is BELIEF-BLIND (the belief layer's influence isolated). */
  targeting: "need" | "roundrobin";
}

function adapterFor(s: Situation): TechgramWorldAdapter {
  return s.world === "cbse" ? cbseWorld() : polityWorld();
}

export function runSituation(s: Situation, cfg: RunCfg): { result: Omit<SituationResult, "ablation" | "ablationMarks" | "trace"> & { trace: LayerTurnTrace[] } } {
  const adapter = adapterFor(s);
  const world = adapter.config;
  const model = buildBeliefModel(minimalContent(world), DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });
  const st = initialState(model);
  const memory = new Map<number, ReturnType<typeof newMemoryCell>>();
  const rng = makeWorldRng(s.seed);
  const wst: WorldState = adapter.initState(s.profile, s.knowledge);
  const session = new DevelopmentalSession({ learningEnabled: cfg.learningEnabled });
  const conductor = initialConductorState();
  const praiseTurns: number[] = [];
  let lastReassuranceTurn = -10;
  const trace: LayerTurnTrace[] = [];
  let carried: import("../cognitive/self-development.js").SelfErrorRecord[] = [];

  let answers = 0, correct = 0, breaks = 0, wallBreaks = 0, missedBreaks = 0;
  let plans = 0, stepsTotal = 0, utterancesN = 0, selfCorrections = 0, praiseN = 0;
  let allProvenanceValid = true;
  let predictionsTurns = 0, errorTurns = 0, insightsTurns = 0, deviatedTurns = 0, blockedTurns = 0;
  let turnCounter = 0;

  for (let day = 1; day <= s.days; day++) {
    // the session persists across days — its ledger IS the carried experience
    for (let turn = 0; turn < world.turnsPerDay; turn++) {
      turnCounter++;
      const fatigueAtDecision = wst.fatigue;
      const ranked = world.concepts.map((c) => {
        const r = reportConcept(model, st, c.id);
        return { id: c.id, need: (r.grey ? 0.85 : 1 - r.mean) * (world.priorWeights.get(c.id) ?? 1), mean: r.mean, grey: r.grey };
      }).sort((a, b) => b.need - a.need);
      // Target selection — NEED (belief-driven, normal) vs ROUNDROBIN (the
      // belief-blind ablation: same executive, but it cannot aim by belief).
      let target = ranked[0]!;
      if (cfg.targeting === "roundrobin") {
        const rid = world.concepts[turnCounter % world.concepts.length]!.id;
        const r = reportConcept(model, st, rid);
        target = { id: rid, need: 0, mean: r.mean, grey: r.grey };
      }
      const w: TurnWorkspace = adapter.assembleWorkspace({
        day, turn, st: wst, profile: s.profile,
        targetId: target.id, targetMean: target.mean, targetGrey: target.grey,
        uncertainties: ranked.filter((r) => r.grey || r.mean < 0.35).length,
        breaksThisDay: breaks, llmThisDay: 0, turnsRemaining: world.turnsPerDay - turn - 1,
      });

      let directive: ExecutiveDirective = STUDY;
      let receipt = null as ReturnType<DevelopmentalSession["decideTurn"]>["receipt"] | null;
      let predictions = { emitted: 0, categories: [] as string[] };
      let blocked: string[] = [], candidates: string[] = [];
      let deviated = false, insightsInjected = false, selfModelCandidate = false, confidence = 0;
      let wallHere = false;

      if (cfg.policy === "linear") {
        if (wst.fatigue > 0.75) missedBreaks++;
        directive = STUDY;
      } else {
        const td = session.decideTurn(w, { directive: STUDY, predictedBenefit: 0.4 * (1 - wst.fatigue * 0.5) }, s.seed * 1000 + turnCounter);
        directive = td.directive;
        receipt = td.receipt;
        predictions = { emitted: td.selfPredictions.length, categories: [...new Set(td.selfPredictions.map((x) => x.category))] };
        predictionsTurns++;
        candidates = [td.directive.learningAction, ...td.receipt.alternativesConsidered.map((a) => a.directive.split("/")[0]!)];
        blocked = td.receipt.constraintsApplied;
        deviated = td.directive.learningAction !== "retrieve";
        insightsInjected = td.insightsUsed !== null;
        selfModelCandidate = td.receipt.reason.some((r) => r.includes("self-model"));
        confidence = td.receipt.confidence;
        if (deviated) deviatedTurns++;
        if (blocked.length > 0) blockedTurns++;
        if (insightsInjected) insightsTurns++;
        if (cfg.wall && wst.fatigue > 0.85 && directive.learningAction !== "break") {
          directive = BREAK; wallBreaks++; wallHere = true;
        }
      }

      const plan = planFromDirective({
        learningAction: directive.learningAction, communication: directive.communication,
        presentation: directive.presentation, augmentation: directive.augmentation,
        conceptId: target.id, conceptName: adapter.nameOf(target.id),
        reasons: receipt ? receipt.reason : ["the linear baseline has no receipts"],
        evidenceRefs: receipt ? receipt.evidenceRefs : ["baseline:linear"],
        predictedBenefit: receipt ? receipt.prediction.predictedBenefit : 0.4,
        uncertainty: receipt ? receipt.prediction.uncertainty : 0.5,
        receiptId: receipt ? receipt.id : `linear_t${turnCounter}`,
        fatigue: wst.fatigue,
      });
      validateExperiencePlan(plan);
      const steps = conduct(plan);
      for (const stp of steps) void advance(conductor, steps.length, stp.waitForStudent);
      plans++; stepsTotal += steps.length;

      let exprCount = 0, exprKinds: string[] = [], sc = false, pr = false;
      if (cfg.policy === "executive") {
        const expr = composeExpression(
          { directive, receipt: receipt!, workspace: w, plan, ledger: session.ledger, insights: session.insights(), llmBridgeOn: false },
          { turn: turnCounter, lastTwoOutcomes: wst.lastTwoOutcomes, praiseTurns, lastReassuranceTurn },
        );
        for (const u of expr.utterances) { try { validateUtterance(u); } catch { allProvenanceValid = false; } }
        exprCount = expr.utterances.length; utterancesN += exprCount;
        exprKinds = expr.utterances.map((u) => u.kind);
        sc = exprKinds.includes("self-correction"); pr = exprKinds.includes("praise");
        if (sc) selfCorrections++; if (pr) praiseN++;
      }

      let newErrors = 0;
      if (directive.learningAction === "break") {
        breaks++;
        adapter.rest(wst);
        session.recordActual({ directive, wasIntervention: false, tookBreak: true, nextAnswerCorrect: null, performanceDelta: 0, fatigueAtDecision });
        carried = [...session.ledger];
      } else {
        const obs = adapter.study(wst, target.id, s.profile, rng);
        answers++; if (obs.correct) correct++;
        const ci = model.index.get(target.id);
        if (ci !== undefined) {
          observe(model, st, { conceptId: target.id, correct: obs.correct, evidenceW: 1, day });
          const cell = memory.get(ci) ?? newMemoryCell("conceptual", DEFAULT_MEMORY_PARAMS);
          memory.set(ci, applyReview(cell, obs.correct, day, DEFAULT_MEMORY_PARAMS));
        }
        if (cfg.policy === "executive") {
          const before = session.ledger.length;
          session.recordActual({ directive, wasIntervention: directive.learningAction !== "retrieve", tookBreak: false, nextAnswerCorrect: obs.correct, performanceDelta: obs.masteryDelta, fatigueAtDecision });
          newErrors = session.ledger.length - before;
          if (newErrors > 0) errorTurns++;
          carried = [...session.ledger];
        }
        if (cfg.trace) {
          trace.push({
            turn: turnCounter, day,
            sensor: { fatigue: +wst.fatigue.toFixed(2), streak: wst.wrongStreak, lastOutcome: wst.lastOutcome },
            belief: { target: adapter.nameOf(target.id), mean: +target.mean.toFixed(3), grey: target.grey, uncertainties: w.uncertainties },
            s1_prediction: predictions,
            executive: { decision: `${directive.learningAction}/${directive.communication}`, confidence: +confidence.toFixed(2), candidateCount: candidates.length, candidates, blocked, deviated, insightsInjected, selfModelCandidate },
            s2_ledger: { newErrors, totalErrors: session.ledger.length, kinds: session.ledger.slice(-newErrors).map((e) => e.patternHypothesis ?? "untagged") },
            plan_conductor: { channels: 6, steps: steps.length },
            expression: { utterances: exprCount, kinds: exprKinds, selfCorrection: sc, praise: pr, allProvenanceValid: true },
            outcome: { correct: obs.correct, masteryDelta: +obs.masteryDelta.toFixed(4) },
            wall: wallHere,
          });
        }
        continue;
      }
      if (cfg.trace) {
        trace.push({
          turn: turnCounter, day,
          sensor: { fatigue: +wst.fatigue.toFixed(2), streak: wst.wrongStreak, lastOutcome: wst.lastOutcome },
          belief: { target: adapter.nameOf(target.id), mean: +target.mean.toFixed(3), grey: target.grey, uncertainties: w.uncertainties },
          s1_prediction: predictions,
          executive: { decision: `${directive.learningAction}/${directive.communication}`, confidence: +confidence.toFixed(2), candidateCount: candidates.length, candidates, blocked, deviated, insightsInjected, selfModelCandidate },
          s2_ledger: { newErrors, totalErrors: session.ledger.length, kinds: [] },
          plan_conductor: { channels: 6, steps: steps.length },
          expression: { utterances: exprCount, kinds: exprKinds, selfCorrection: sc, praise: pr, allProvenanceValid: allProvenanceValid },
          outcome: { correct: null, masteryDelta: 0 },
          wall: wallHere,
        });
      }
    }
    adapter.sleep(wst, s.profile);
  }

  let errSum = 0;
  for (const c of world.concepts) errSum += Math.abs(reportConcept(model, st, c.id).mean - (wst.truth.get(c.id) ?? 0));

  return {
    result: {
      id: s.id, name: s.name, description: s.description, world: s.world, knowledge: s.knowledge, seed: s.seed, turns: turnCounter,
      marks: { executive: adapter.externalEvaluate(wst), linear: 0, margin: 0 },
      accuracy: { executive: answers > 0 ? correct / answers : 0, linear: 0 },
      beliefError: { executive: errSum / Math.max(1, world.concepts.length), linear: 0 },
      breaks: { executive: breaks, linearMissed: missedBreaks, wall: wallBreaks },
      selfErrors: session.ledger.length,
      predictionErrorRate: predictionsTurns > 0 ? errorTurns / predictionsTurns : 0,
      insightsInjectedPct: turnCounter > 0 ? insightsTurns / turnCounter : 0,
      deviationPct: turnCounter > 0 ? deviatedTurns / turnCounter : 0,
      blockedPct: turnCounter > 0 ? blockedTurns / turnCounter : 0,
      selfCorrectionVoiced: selfCorrections, praiseVoiced: praiseN,
      trace,
    },
  };
}

/** Percent of executive decisions that changed when a layer was ablated. */
function pctDecisionsChanged(full: LayerTurnTrace[], ablated: LayerTurnTrace[]): number {
  // A decision = the directive AND the concept it aimed at (targeting is the
  // belief layer's output — an ablation that only moves the target is still a
  // changed decision). Break turns included — rest-vs-study flips are the
  // wall/self-model levers doing their work.
  const key = (t: LayerTurnTrace) => `${t.executive.decision}@${t.belief.target}`;
  const n = Math.min(full.length, ablated.length);
  if (n === 0) return 0;
  let diff = 0;
  for (let i = 0; i < n; i++) if (key(full[i]!) !== key(ablated[i]!)) diff++;
  return diff / n;
}

export function studySituation(s: Situation): SituationResult {
  const full = runSituation(s, { policy: 'executive', learningEnabled: true, wall: true, trace: true, targeting: 'need' }).result;
  const noSelf = runSituation(s, { policy: 'executive', learningEnabled: false, wall: true, trace: true, targeting: 'need' }).result;
  const linear = runSituation(s, { policy: 'linear', learningEnabled: false, wall: true, trace: true, targeting: 'roundrobin' }).result;
  const noWall = runSituation(s, { policy: 'executive', learningEnabled: true, wall: false, trace: true, targeting: 'need' }).result;
  const beliefBlind = runSituation(s, { policy: 'executive', learningEnabled: true, wall: true, trace: true, targeting: 'roundrobin' }).result;
  return {
    ...full,
    marks: { executive: full.marks.executive, linear: linear.marks.executive, margin: full.marks.executive - linear.marks.executive },
    accuracy: { executive: full.accuracy.executive, linear: linear.accuracy.executive },
    beliefError: { executive: full.beliefError.executive, linear: linear.beliefError.executive },
    breaks: { executive: full.breaks.executive, linearMissed: linear.breaks.linearMissed, wall: full.breaks.wall },
    ablation: {
      noSelfModel: Math.round(pctDecisionsChanged(full.trace, noSelf.trace) * 100),
      linear: Math.round(pctDecisionsChanged(full.trace, linear.trace) * 100),
      beliefBlind: Math.round(pctDecisionsChanged(full.trace, beliefBlind.trace) * 100),
      noWall: Math.round(pctDecisionsChanged(full.trace, noWall.trace) * 100),
    },
    ablationMarks: { noSelfModel: noSelf.marks.executive, noWall: noWall.marks.executive, beliefBlind: beliefBlind.marks.executive },
  };
}

export interface StudyAggregate {
  situations: number; turns: number;
  execWins: number; execTies: number; execLosses: number;
  meanMargin: number;
  layerActivity: {
    s1PredictionsEveryTurn: boolean;
    insightsInjectedPct: number; s2ErrorTurnPct: number; deviationPct: number; blockedPct: number;
    expressionPct: number; selfCorrectionRate: number; praiseRate: number; wallTurns: number;
  };
  influence: {
    selfModelMeanPct: number; executiveVsLinearMeanPct: number; wallMeanPct: number;
    selfModelMarksDelta: number; wallMarksDelta: number; beliefBlindMeanPct: number; beliefBlindMarksDelta: number;
  };
  predictionCalibration: number;
  provenanceValid: boolean;
}

export function runLayerStudy(): { results: SituationResult[]; aggregate: StudyAggregate } {
  const results = SITUATIONS.map(studySituation);
  const turns = results.reduce((a, r) => a + r.turns, 0);
  const mean = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  const wallTurns = results.reduce((a, r) => a + r.breaks.wall, 0);
  const exprTurns = results.reduce((a, r) => a + r.trace.filter((t) => t.expression.utterances > 0).length, 0);
  const selfCorrectionTurns = results.reduce((a, r) => a + r.trace.filter((t) => t.expression.selfCorrection).length, 0);
  const praiseTurnsN = results.reduce((a, r) => a + r.trace.filter((t) => t.expression.praise).length, 0);
  return {
    results,
    aggregate: {
      situations: results.length,
      turns,
      execWins: results.filter((r) => r.marks.margin > 0).length,
      execTies: results.filter((r) => r.marks.margin === 0).length,
      execLosses: results.filter((r) => r.marks.margin < 0).length,
      meanMargin: +mean(results.map((r) => r.marks.margin)).toFixed(2),
      layerActivity: {
        s1PredictionsEveryTurn: results.every((r) => r.trace.every((t) => t.s1_prediction.emitted > 0)),
        insightsInjectedPct: +mean(results.map((r) => r.insightsInjectedPct)).toFixed(2),
        s2ErrorTurnPct: +mean(results.map((r) => r.predictionErrorRate)).toFixed(2),
        deviationPct: +mean(results.map((r) => r.deviationPct)).toFixed(2),
        blockedPct: +mean(results.map((r) => r.blockedPct)).toFixed(2),
        expressionPct: +((exprTurns / turns)).toFixed(2),
        selfCorrectionRate: +(selfCorrectionTurns / turns).toFixed(3),
        praiseRate: +(praiseTurnsN / turns).toFixed(3),
        wallTurns,
      },
      influence: {
        selfModelMeanPct: +mean(results.map((r) => r.ablation.noSelfModel)).toFixed(1),
    beliefBlindMeanPct: +mean(results.map((r) => r.ablation.beliefBlind)).toFixed(1),
    beliefBlindMarksDelta: +mean(results.map((r) => r.marks.executive - r.ablationMarks.beliefBlind)).toFixed(2),
        executiveVsLinearMeanPct: +mean(results.map((r) => r.ablation.linear)).toFixed(1),
        wallMeanPct: +mean(results.map((r) => r.ablation.noWall)).toFixed(1),
        selfModelMarksDelta: +mean(results.map((r) => r.marks.executive - r.ablationMarks.noSelfModel)).toFixed(2),
        wallMarksDelta: +mean(results.map((r) => r.marks.executive - r.ablationMarks.noWall)).toFixed(2),
      },
      predictionCalibration: +mean(results.map((r) => r.predictionErrorRate)).toFixed(2),
      provenanceValid: results.every((r) => r.trace.every((t) => t.expression.allProvenanceValid)),
    },
  };
}
