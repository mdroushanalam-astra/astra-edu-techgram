/**
 * THE TECHGRAM WORLD ADAPTER [Phase 5, roadmap §11, ADR-043] — THE UCS BOUNDARY.
 *
 * cognitive/ = the UNIVERSAL layer (Executive, developmental loop, expression —
 * zero domain knowledge). THIS module is the boundary: it translates a concrete
 * world (curriculum, prerequisites, weights, sensors, learning rules, outcomes)
 * into universal objects (TurnWorkspace, ExecutiveDirective, observations) and
 * back. The cognitive engine must not know that "geomorphology" or "UPSC"
 * exists — concept names flow through as OPAQUE strings.
 *
 * Two weight systems, kept strictly apart:
 *   • priorWeights — world structure the Executive may use for targeting
 *     (like a teacher knowing a syllabus emphasises one area);
 *   • externalWeights — THE EXTERNAL EVALUATOR (immutable exam truth). The
 *     only consumer is externalEvaluate(). The cognitive layer has no access.
 *     [anti-Goodhart: proven by the Phase 5 experiment — flipping the
 *     evaluator changes the score, never the decisions]
 *
 * The adapter satisfies the DomainAdapter contract from cognitive/contracts.ts.
 */
import type { TurnWorkspace, ExecutiveDirective } from "../cognitive/executive.js";
import type { DomainAdapter, CogObject, CognitiveWorkspace } from "../cognitive/contracts.js";
import { selfPredict } from "../cognitive/self-development.js";
import type { SelfInsights } from "../cognitive/developmental-session.js";
import type { Content } from "../content.js";

/* ── world vocabulary ─────────────────────────────────────────────────────── */

export interface WorldConcept {
  id: string;
  name: string; // opaque to the cognitive layer
  prereqs: string[];
  difficulty: number; // 0..1 — how slow mastery grows
}

export interface WorldLearningRule {
  correctGain: number;   // mastery from a correct retrieval
  wrongGain: number;     // mastery from a failed attempt (learning follows the outcome)
  fatigueSlope: number;  // eff = max(floor, 1 - slope·fatigue)
  effFloor: number;
  fatigueRise: number;   // fatigue added per study turn
  breakRecovery: number; // fatigue removed by a break
  sleepFactor: number;   // fatigue multiplier overnight
  pCorrectFatigue: number; // pCorrect = mastery - penalty·fatigue
}

export interface WorldConfig {
  id: string;
  /** Domain label — NEVER read by the cognitive layer; for reports only. */
  domainLabel: string;
  concepts: WorldConcept[];
  /** World structure the Executive may use for targeting (prior knowledge). */
  priorWeights: Map<string, number>;
  /** THE EXTERNAL EVALUATOR — immutable; consumed only by externalEvaluate(). */
  externalWeights: Map<string, number>;
  rule: WorldLearningRule;
  /** Sensor noise on answers (0 = deterministic given mastery). */
  answerNoise: number;
  turnsPerDay: number;
  marksScale: number;
}

/** The STUDENT is part of the world, not of the brain — archetypes are sensor/truth profiles. */
export interface StudentProfile {
  id: string;
  learningRate: number;       // multiplier on mastery gains
  fatigueSensitivity: number; // multiplier on fatigue effects
  startFatigue: number;
  answerNoise: number;        // extra sensor noise (anxious/distracted students)
  streakClustering: number;   // 0 = independent answers, >0 = momentum in correctness
  sleepFactor: number;        // personal overnight recovery
}

/** Ten student archetypes — the experiment's human variation. */
export const ARCHETYPES: Record<string, StudentProfile> = {
  steady:           { id: "steady",           learningRate: 1.0,  fatigueSensitivity: 1.0,  startFatigue: 0.1, answerNoise: 0,    streakClustering: 0,   sleepFactor: 0.55 },
  fast_learner:     { id: "fast_learner",     learningRate: 1.5,  fatigueSensitivity: 1.0,  startFatigue: 0.1, answerNoise: 0,    streakClustering: 0,   sleepFactor: 0.55 },
  slow_grinder:     { id: "slow_grinder",     learningRate: 0.55, fatigueSensitivity: 1.0,  startFatigue: 0.1, answerNoise: 0,    streakClustering: 0,   sleepFactor: 0.55 },
  streaky:          { id: "streaky",          learningRate: 1.0,  fatigueSensitivity: 1.0,  startFatigue: 0.1, answerNoise: 0,    streakClustering: 0.25, sleepFactor: 0.55 },
  quick_fatiguer:   { id: "quick_fatiguer",   learningRate: 1.0,  fatigueSensitivity: 1.6,  startFatigue: 0.2, answerNoise: 0,    streakClustering: 0,   sleepFactor: 0.7 },
  high_stamina:     { id: "high_stamina",     learningRate: 1.0,  fatigueSensitivity: 0.45, startFatigue: 0.1, answerNoise: 0,    streakClustering: 0,   sleepFactor: 0.4 },
  anxious:          { id: "anxious",          learningRate: 1.0,  fatigueSensitivity: 1.2,  startFatigue: 0.15, answerNoise: 0.18, streakClustering: 0.15, sleepFactor: 0.6 },
  overconfident:    { id: "overconfident",    learningRate: 1.0,  fatigueSensitivity: 1.0,  startFatigue: 0.1, answerNoise: 0.05, streakClustering: 0,   sleepFactor: 0.55 },
  evening_crammer:  { id: "evening_crammer",  learningRate: 1.0,  fatigueSensitivity: 1.1,  startFatigue: 0.45, answerNoise: 0.05, streakClustering: 0,   sleepFactor: 0.5 },
  recovery_sleeper: { id: "recovery_sleeper", learningRate: 1.0,  fatigueSensitivity: 1.0,  startFatigue: 0.1, answerNoise: 0,    streakClustering: 0,   sleepFactor: 0.3 },
};

export const DEFAULT_RULE: WorldLearningRule = {
  correctGain: 0.07, wrongGain: 0.015,
  fatigueSlope: 0.8, effFloor: 0.15,
  fatigueRise: 0.14, breakRecovery: 0.5, sleepFactor: 0.55,
  pCorrectFatigue: 0.35,
};

/* ── building worlds ──────────────────────────────────────────────────────── */

/** A real world from the frozen seed content (UPSC Polity, CBSE-8, …). */
export function worldFromContent(
  content: Content, nConcepts: number, id: string, domainLabel: string,
  overrides: Partial<WorldConfig> = {},
): WorldConfig {
  const concepts: WorldConcept[] = content.concepts.slice(0, nConcepts).map((c) => ({
    id: c.id,
    name: c.name,
    prereqs: [...c.prereqs],
    difficulty: Math.min(0.9, 0.2 + (c.prereqs.length * 0.12)),
  }));
  const priorWeights = new Map<string, number>();
  const externalWeights = new Map<string, number>();
  for (const c of concepts) {
    const w = content.conceptWeight.get(c.id) ?? 1;
    priorWeights.set(c.id, w);
    externalWeights.set(c.id, w);
  }
  return {
    id, domainLabel, concepts, priorWeights, externalWeights,
    rule: DEFAULT_RULE, answerNoise: 0, turnsPerDay: 8, marksScale: 6,
    ...overrides,
  };
}

/** A synthetic world — pure structure, no domain at all. */
export function syntheticWorld(id: string, n: number, opts: {
  chainDepth?: number;     // prerequisites chain depth
  weightTail?: "flat" | "heavy";
  noise?: number;
  rule?: Partial<WorldLearningRule>;
  label?: string;
} = {}): WorldConfig {
  const chainDepth = opts.chainDepth ?? 0;
  const concepts: WorldConcept[] = Array.from({ length: n }, (_, i) => ({
    id: `s_${id}_c${i}`,
    name: `Concept-${i + 1}`,
    prereqs: chainDepth > 0 && i >= chainDepth ? [`s_${id}_c${i - chainDepth}`] : [],
    difficulty: 0.2 + ((i * 37) % 50) / 100,
  }));
  const priorWeights = new Map<string, number>();
  const externalWeights = new Map<string, number>();
  for (const c of concepts) {
    const w = opts.weightTail === "heavy" ? (priorWeights.size < 2 ? 3 : 0.5) : 1;
    priorWeights.set(c.id, w);
    externalWeights.set(c.id, w);
  }
  return {
    id, domainLabel: opts.label ?? `synthetic-${id}`,
    concepts, priorWeights, externalWeights,
    rule: { ...DEFAULT_RULE, ...opts.rule },
    answerNoise: opts.noise ?? 0,
    turnsPerDay: 8, marksScale: 6,
  };
}

/* ── world state + the adapter ────────────────────────────────────────────── */

export interface WorldState {
  truth: Map<string, number>; // TRUE mastery per concept — the world, not the brain
  fatigue: number;
  wrongStreak: number;
  lastOutcome: "correct" | "wrong" | null;
  lastTwoOutcomes: ("correct" | "wrong" | null)[];
  day: number;
  turn: number;
  breaks: number;
}

/** Linear congruential stream — the world's own RNG (deterministic per seed). */
export function makeWorldRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export interface TurnObservation {
  correct: boolean;
  masteryDelta: number;
  fatigueAfter: number;
}

export class TechgramWorldAdapter implements DomainAdapter {
  readonly domain: string;
  constructor(readonly config: WorldConfig) {
    this.domain = config.id;
  }

  /** The adapter's contract method: universal objects → domain action name. */
  planFrom(goal: CogObject<"goal">, workspace: CognitiveWorkspace): { action: string; why: string } {
    const claim = goal.payload?.["claim"];
    const action = (typeof claim === "string" && claim) || workspace.focus[0]?.name || "study";
    return { action, why: "translated by the world adapter from universal objects — the engine never saw the domain" };
  }

  initTruth(base = 0.22): Map<string, number> {
    const truth = new Map<string, number>();
    this.config.concepts.forEach((c, i) => {
      truth.set(c.id, Math.min(0.6, base + 0.06 * (i % 5) + ((c.id.length * 7) % 10) * 0.008));
    });
    return truth;
  }

  initState(profile: StudentProfile): WorldState {
    return {
      truth: this.initTruth(),
      fatigue: profile.startFatigue,
      wrongStreak: 0, lastOutcome: null,
      lastTwoOutcomes: [null, null],
      day: 1, turn: 0, breaks: 0,
    };
  }

  /**
   * THE WORLD'S LEARNING RULE — a study turn happens, the student answers.
   * Learning follows the outcome; fatigue degrades efficiency and accuracy;
   * archetypes modulate rate/sensitivity/noise/clustering.
   */
  study(st: WorldState, conceptId: string, profile: StudentProfile, rng: () => number): TurnObservation {
    const c = this.config.concepts.find((x) => x.id === conceptId)!;
    const rule = this.config.rule;
    const eff = Math.max(rule.effFloor, 1 - rule.fatigueSlope * st.fatigue * profile.fatigueSensitivity);
    const pCorrectRaw = Math.max(0.1, (st.truth.get(conceptId) ?? 0.2) - rule.pCorrectFatigue * st.fatigue * profile.fatigueSensitivity);
    // streak clustering: momentum in correctness (the world's student, not the brain)
    const momentum = st.lastTwoOutcomes[0] === st.lastTwoOutcomes[1] && st.lastOutcome !== null
      ? profile.streakClustering * (st.lastOutcome === "correct" ? 1 : -1) : 0;
    const pCorrect = Math.min(0.98, Math.max(0.05, pCorrectRaw + momentum));
    const noise = this.config.answerNoise + profile.answerNoise;
    const correct = rng() < (noise > 0 ? pCorrect * (1 - noise) + (rng() < noise ? 0.5 : 0) : pCorrect);
    const gain = (correct ? rule.correctGain : rule.wrongGain) * eff * profile.learningRate * (1 - c.difficulty * 0.4);
    const before = st.truth.get(conceptId) ?? 0.2;
    const after = Math.min(0.95, before + gain);
    st.truth.set(conceptId, after);
    st.fatigue = Math.min(1, st.fatigue + rule.fatigueRise);
    st.wrongStreak = correct ? 0 : st.wrongStreak + 1;
    st.lastOutcome = correct ? "correct" : "wrong";
    st.lastTwoOutcomes = [st.lastTwoOutcomes[1]!, st.lastOutcome];
    return { correct, masteryDelta: after - before, fatigueAfter: st.fatigue };
  }

  rest(st: WorldState): void {
    st.fatigue = Math.max(0, st.fatigue - this.config.rule.breakRecovery);
    st.lastOutcome = null;
    st.breaks++;
  }

  sleep(st: WorldState, profile: StudentProfile): void {
    st.fatigue = Math.max(0.05, st.fatigue * this.config.rule.sleepFactor * profile.sleepFactor / 0.55);
  }

  /** External evaluation — the ONLY consumer of externalWeights. Immutable exam truth. */
  externalEvaluate(st: WorldState): number {
    let sum = 0;
    for (const c of this.config.concepts) {
      sum += (st.truth.get(c.id) ?? 0) * (this.config.externalWeights.get(c.id) ?? 1);
    }
    return Math.round(sum * this.config.marksScale);
  }

  /** The universal workspace — concept names enter as OPAQUE strings. */
  assembleWorkspace(args: {
    day: number; turn: number; st: WorldState; profile: StudentProfile;
    targetId: string; targetMean: number; targetGrey: boolean;
    uncertainties: number; breaksThisDay: number; llmThisDay: number;
    insights?: SelfInsights; turnsRemaining: number;
  }): TurnWorkspace {
    const alt = this.config.concepts.find((c) => c.id !== args.targetId);
    return {
      turn: args.turn,
      elapsedMin: args.turn * 8,
      timeLeftMin: Math.max(0, this.config.turnsPerDay * 10 - args.turn * 10),
      turnsRemaining: args.turnsRemaining,
      focusConcept: { id: args.targetId, name: this.nameOf(args.targetId), mean: args.targetMean, grey: args.targetGrey },
      alternativeConcept: alt ? { id: alt.id, name: alt.name, gainPerMinute: 0.2 } : null,
      uncertainties: args.uncertainties,
      hypothesisCount: 1,
      momentum: 0.4, frustration: 0.2,
      fatigue: args.st.fatigue,
      wrongStreak: args.st.wrongStreak,
      lastOutcome: args.st.lastOutcome,
      planProgress: { done: args.turn - 1, total: this.config.turnsPerDay },
      counts: { jokes: 0, llm: args.llmThisDay, breaks: args.breaksThisDay, sinceLastIntervention: args.turn },
      visualStructure: false,
      incumbentMove: { kind: "study", conceptId: args.targetId, conceptName: this.nameOf(args.targetId) },
      selfInsights: args.insights,
    };
  }

  nameOf(conceptId: string): string {
    return this.config.concepts.find((c) => c.id === conceptId)?.name ?? conceptId;
  }

  /** Self-predictions are universal — the adapter just routes the call. */
  predictSelf(turn: number, st: WorldState, targetMean: number) {
    return selfPredict(turn, st.fatigue, st.wrongStreak, targetMean);
  }
}

export type DirectiveOutcome = { directive: ExecutiveDirective };
