/**
 * THE PHASE 5 EXPERIMENT [roadmap §11, ADR-043] — thirty rigorous scenarios
 * spanning the ENTIRE cognitive structure: student archetypes, real + synthetic
 * worlds, adversarial conditions, and structural proofs (replay determinism,
 * frozen-organ purity, anti-Goodhart evaluator isolation, LLM OFF/ON identity,
 * developmental divergence, S4 adoption in-run).
 *
 * Every scenario runs the FULL stack through the TechgramWorldAdapter:
 * world → workspace → Executive (with self-predictions, ledger, insights) →
 * ExperiencePlan → Conductor → Expression → outcome → world.
 *
 * Executive vs linear matched baseline on TRUE MARKS (the external evaluator)
 * in every non-structural scenario; the evaluator is inaccessible to the brain.
 * All run state is LOCAL to a run — nothing bleeds between arms or scenarios.
 */
import { buildBeliefModel, initialState, observe, reportConcept, DEFAULT_BELIEF_PARAMS } from "../belief.js";
import { DEFAULT_MEMORY_PARAMS, applyReview, newMemoryCell } from "../memory.js";
import { DEFAULT_STRATEGY, type ExecutiveDirective, type StrategyParameters, type TurnWorkspace } from "../cognitive/executive.js";
import { DevelopmentalSession } from "../cognitive/developmental-session.js";
import { planFromDirective, validateExperiencePlan } from "../cognitive/experience-plan.js";
import { conduct, initialState as initialConductorState, advance } from "../cognitive/conductor.js";
import { composeExpression, validateUtterance } from "../cognitive/expression.js";
import { proposeStrategy, runStrategyExperiment, makeStrategyHarness, BASE_SIM_PROFILE } from "../cognitive/strategy-experiments.js";
import type { SelfErrorRecord } from "../cognitive/self-development.js";
import { TechgramWorldAdapter, ARCHETYPES, makeWorldRng, type StudentProfile } from "../adapter/world-adapter.js";
import { minimalContent, polityWorld, cbseWorld, syntheticChainWorld, syntheticFlatWorld, syntheticHeavyWorld, syntheticSparseWorld } from "../adapter/worlds.js";

/* ── the world-execution loop ─────────────────────────────────────────────── */

export interface RunOptions {
  days: number;
  policy: "executive" | "linear";
  learningEnabled: boolean;
  llmBridgeOn: boolean;
  s4Enabled: boolean;
  skippedDays: number[];
  interruptionsPerDay: number;
  seed: number;
  collect: boolean;
  trackShadow: boolean;
  strategy: StrategyParameters | undefined;
}

export interface RunResult {
  policy: "executive" | "linear";
  trueMarks: number;
  answers: number;
  correct: number;
  beliefError: number;
  breaks: number;
  missedBreaks: number;
  wallBreaks: number;
  selfErrors: number;
  decisionsWithInsights: number;
  plans: number;
  conductorSteps: number;
  utterances: number;
  selfCorrections: number;
  llmVoiced: number;
  experimentsKept: number;
  experimentsRejected: number;
  interruptionsHandled: number;
  allProvenanceValid: boolean;
  shadowMatches: boolean;
  finalStrategy: StrategyParameters;
  receiptsJson: string;
}

const STUDY: ExecutiveDirective = { learningAction: "retrieve", communication: "explain", presentation: "board", augmentation: "no_llm" };
const BREAK: ExecutiveDirective = { learningAction: "break", communication: "reassure", presentation: "none", augmentation: "no_llm" };

function defaultOpts(policy: "executive" | "linear", seed: number): RunOptions {
  return {
    days: 8, policy, learningEnabled: true, llmBridgeOn: false, s4Enabled: false,
    skippedDays: [], interruptionsPerDay: 0, seed,
    collect: true, trackShadow: false, strategy: undefined,
  };
}

export function runCognitiveRun(adapter: TechgramWorldAdapter, profile: StudentProfile, opts: RunOptions): RunResult {
  const world = adapter.config;
  const content = minimalContent(world);
  const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });
  const st = initialState(model);
  const shadow = opts.trackShadow ? initialState(model) : null;
  const memory = new Map<number, ReturnType<typeof newMemoryCell>>();
  const rng = makeWorldRng(opts.seed);
  const wst = adapter.initState(profile);

  // ALL run state is local — nothing bleeds between runs.
  const trace: unknown[] = [];
  let carriedLedger: SelfErrorRecord[] = [];
  const praiseTurns: number[] = [];
  let lastReassuranceTurn = -10;
  let conductorState = initialConductorState();
  let adopted: StrategyParameters | undefined = opts.strategy;
  const testedParams = new Set<string>();

  let breaks = 0, missedBreaks = 0, wallBreaks = 0, receiptsN = 0, answers = 0, correct = 0;
  let plans = 0, conductorSteps = 0, utterancesN = 0, selfCorrections = 0, llmVoiced = 0;
  let experimentsKept = 0, experimentsRejected = 0, interruptionsHandled = 0, decisionsWithInsights = 0;
  let allProvenanceValid = true;
  let turnCounter = 0;

  for (let day = 1; day <= opts.days; day++) {
    if (opts.skippedDays.includes(day)) { adapter.sleep(wst, profile); continue; }
    // A developmental runtime per DAY; the ledger carries across days (the epoch).
    const session = new DevelopmentalSession({ learningEnabled: opts.learningEnabled, strategy: adopted });
    if (day > 1) session.ledger.push(...carriedLedger);
    let breaksThisDay = 0, llmThisDay = 0;

    for (let turn = 0; turn < world.turnsPerDay; turn++) {
      turnCounter++;
      const fatigueAtDecision = wst.fatigue;
      let directive: ExecutiveDirective = STUDY;
      let targetId = world.concepts[turnCounter % world.concepts.length]!.id;
      if (opts.policy === "linear" && wst.fatigue > 0.75) missedBreaks++;

      if (opts.policy === "executive") {
        const ranked = world.concepts.map((c) => {
          const r = reportConcept(model, st, c.id);
          const need = (r.grey ? 0.85 : 1 - r.mean) * (world.priorWeights.get(c.id) ?? 1);
          return { id: c.id, need, mean: r.mean, grey: r.grey };
        }).sort((a, b) => b.need - a.need);
        targetId = ranked[0]!.id;
        const w: TurnWorkspace = adapter.assembleWorkspace({
          day, turn, st: wst, profile,
          targetId, targetMean: ranked[0]!.mean, targetGrey: ranked[0]!.grey,
          uncertainties: ranked.filter((r) => r.grey || r.mean < 0.35).length,
          breaksThisDay, llmThisDay, turnsRemaining: world.turnsPerDay - turn - 1,
        });
        const td = session.decideTurn(w, { directive: STUDY, predictedBenefit: 0.4 * (1 - wst.fatigue * 0.5) }, opts.seed * 1000 + turnCounter);
        directive = td.directive;
        receiptsN++;
        if (td.insightsUsed) decisionsWithInsights++;
        if (wst.fatigue > 0.85 && directive.learningAction !== "break") { directive = BREAK; wallBreaks++; }
        const plan = planFromDirective({
          learningAction: directive.learningAction, communication: directive.communication,
          presentation: directive.presentation, augmentation: directive.augmentation,
          conceptId: targetId, conceptName: adapter.nameOf(targetId),
          reasons: td.receipt.reason, evidenceRefs: td.receipt.evidenceRefs,
          predictedBenefit: td.receipt.prediction.predictedBenefit,
          uncertainty: td.receipt.prediction.uncertainty,
          receiptId: td.receipt.id, fatigue: wst.fatigue,
        });
        validateExperiencePlan(plan);
        const steps = conduct(plan);
        for (const s of steps) conductorState = advance(conductorState, steps.length, s.waitForStudent);
        plans++; conductorSteps += steps.length;

        // THE EXPRESSION — the decision becomes experience [Phase 4].
        const expr = composeExpression(
          { directive, receipt: td.receipt, workspace: w, plan, ledger: session.ledger, insights: session.insights(), llmBridgeOn: opts.llmBridgeOn },
          { turn: turnCounter, lastTwoOutcomes: wst.lastTwoOutcomes, praiseTurns, lastReassuranceTurn },
        );
        for (const u of expr.utterances) { try { validateUtterance(u); } catch { allProvenanceValid = false; } }
        utterancesN += expr.utterances.length;
        selfCorrections += expr.utterances.filter((u) => u.kind === "self-correction").length;
        llmVoiced += expr.utterances.filter((u) => u.llm !== undefined).length;
        if (opts.collect) {
          trace.push({
            t: turnCounter,
            d: `${directive.learningAction}/${directive.communication}/${directive.augmentation}`,
            c: targetId,
            r: td.receipt,
            u: expr.utterances.map((x) => ({ k: x.kind, x: x.text, e: x.evidenceRefs.length, l: x.llm !== undefined })),
          });
        }

        if (directive.learningAction === "break") {
          breaks++; breaksThisDay++;
          adapter.rest(wst);
          session.recordActual({ directive, wasIntervention: false, tookBreak: true, nextAnswerCorrect: null, performanceDelta: 0, fatigueAtDecision });
          carriedLedger = [...session.ledger];
          if (opts.interruptionsPerDay > 0) { conductorState = initialConductorState(); interruptionsHandled += opts.interruptionsPerDay; }
          continue;
        }
        if (directive.augmentation === "llm") llmThisDay++;
      }

      const conceptObj = world.concepts.find((c) => c.id === targetId)!;
      const obs = adapter.study(wst, targetId, profile, rng);
      answers++; if (obs.correct) correct++;
      const ci = model.index.get(targetId);
      if (ci !== undefined) {
        observe(model, st, { conceptId: targetId, correct: obs.correct, evidenceW: 1, day });
        if (shadow) observe(model, shadow, { conceptId: targetId, correct: obs.correct, evidenceW: 1, day });
        const cell = memory.get(ci) ?? newMemoryCell("conceptual", DEFAULT_MEMORY_PARAMS);
        memory.set(ci, applyReview(cell, obs.correct, day, DEFAULT_MEMORY_PARAMS));
      }
      if (opts.policy === "executive") {
        session.recordActual({
          directive, wasIntervention: directive.learningAction !== "retrieve",
          tookBreak: false, nextAnswerCorrect: obs.correct,
          performanceDelta: obs.masteryDelta, fatigueAtDecision,
        });
        carriedLedger = [...session.ledger];
      }
      if (opts.interruptionsPerDay > 0) { conductorState = initialConductorState(); interruptionsHandled += opts.interruptionsPerDay; }
    }

    // S4 IN THE RUN — at day end (from day 3): propose → matched A/B → adopt.
    if (opts.s4Enabled && opts.policy === "executive" && day >= 3 && carriedLedger.length > 0) {
      const insights = session.insights();
      const proposal = proposeStrategy(carriedLedger, adopted ?? DEFAULT_STRATEGY);
      if (proposal && !testedParams.has(proposal.param)) {
        testedParams.add(proposal.param);
        const sim = makeStrategyHarness({
          ...BASE_SIM_PROFILE,
          tendency: { interventionTendency: insights?.interventionTendency ?? "balanced", breakCalibration: insights?.breakCalibration ?? "balanced" },
        });
        const r = runStrategyExperiment(proposal, sim, [11, 22, 33], adopted ?? DEFAULT_STRATEGY);
        if (r.kept) { experimentsKept++; adopted = r.adopted; } else { experimentsRejected++; }
      }
    }
    adapter.sleep(wst, profile);
  }

  let errSum = 0;
  for (const c of world.concepts) {
    errSum += Math.abs(reportConcept(model, st, c.id).mean - (wst.truth.get(c.id) ?? 0));
  }
  let shadowMatches = true;
  if (opts.trackShadow && shadow) {
    for (let i = 0; i < st.mu.length; i++) {
      if (st.mu[i] !== shadow.mu[i]) { shadowMatches = false; break; }
    }
  }

  return {
    policy: opts.policy,
    trueMarks: adapter.externalEvaluate(wst),
    answers, correct,
    beliefError: errSum / Math.max(1, world.concepts.length),
    breaks, missedBreaks, wallBreaks,
    selfErrors: carriedLedger.length,
    decisionsWithInsights, plans, conductorSteps,
    utterances: utterancesN, selfCorrections, llmVoiced,
    experimentsKept, experimentsRejected, interruptionsHandled,
    allProvenanceValid, shadowMatches,
    finalStrategy: adopted ?? DEFAULT_STRATEGY,
    receiptsJson: opts.collect ? JSON.stringify(trace) : "",
  };
}

/* ── scenarios ────────────────────────────────────────────────────────────── */

export type CheckName = "replay" | "frozenOrgans" | "antiGoodhart" | "llmIdentity" | "divergence";

export interface Scenario {
  id: string;
  name: string;
  category: "archetype" | "cross-world" | "adversarial" | "structural";
  adapter: () => TechgramWorldAdapter;
  archetype: keyof typeof ARCHETYPES;
  seed: number;
  days?: number;
  opts?: Partial<RunOptions>;
  checks?: CheckName[];
  expectExecutiveWin?: boolean;
}

export interface ScenarioResult {
  id: string; name: string; category: Scenario["category"];
  worldId: string; archetype: string; seed: number; days: number;
  executive: RunResult;
  linear: RunResult;
  margin: number;
  checks: Record<string, boolean | "no-errors">;
  pass: boolean;
  notes: string[];
}

function flippedWorld(adapter: TechgramWorldAdapter): TechgramWorldAdapter {
  const cfg = adapter.config;
  // The flip must CHANGE the values even when the original evaluator is flat
  // (max+min−v is a no-op for uniform weights — caught by scenarios 26/27).
  // Rank-based decay: id-sorted concepts get weights × (n−rank)/n — always
  // distinct, always a different weighted sum, never shown to the brain.
  const sorted = [...cfg.concepts].map((c) => c.id).sort();
  const n = sorted.length;
  const flipped = new Map<string, number>();
  sorted.forEach((id, rank) => {
    flipped.set(id, (cfg.externalWeights.get(id) ?? 1) * ((n - rank) / n));
  });
  return new TechgramWorldAdapter({ ...cfg, externalWeights: flipped });
}

export function runScenario(s: Scenario): ScenarioResult {
  const adapter = s.adapter();
  const profile = ARCHETYPES[s.archetype];
  const days = s.days ?? 8;
  const base: RunOptions = { ...defaultOpts("executive", s.seed), days, ...s.opts };
  const executive = runCognitiveRun(adapter, profile, { ...base, policy: "executive" });
  const linear = runCognitiveRun(adapter, profile, { ...defaultOpts("linear", s.seed), days, learningEnabled: false, collect: false, trackShadow: false, strategy: undefined });
  const margin = executive.trueMarks - linear.trueMarks;
  const checks: Record<string, boolean | "no-errors"> = {};
  const notes: string[] = [];

  for (const check of s.checks ?? []) {
    if (check === "replay") {
      const again = runCognitiveRun(adapter, profile, { ...base, policy: "executive" });
      checks.replayBitIdentical = again.receiptsJson === executive.receiptsJson && again.trueMarks === executive.trueMarks;
      if (!checks.replayBitIdentical) notes.push("REPLAY DIVERGED — determinism broken");
    }
    if (check === "frozenOrgans") {
      const tracked = runCognitiveRun(adapter, profile, { ...base, policy: "executive", trackShadow: true });
      checks.frozenOrgansUnchanged = tracked.shadowMatches;
      if (!tracked.shadowMatches) notes.push("FROZEN-ORGAN VIOLATION — the cognitive layer distorted observation");
    }
    if (check === "antiGoodhart") {
      const flipped = runCognitiveRun(flippedWorld(adapter), profile, { ...base, policy: "executive" });
      const decisionsUnchanged = flipped.receiptsJson === executive.receiptsJson;
      const evalChanged = flipped.trueMarks !== executive.trueMarks;
      checks.antiGoodhartIsolation = decisionsUnchanged && evalChanged;
      if (!decisionsUnchanged) notes.push("ANTI-GOODHART FAIL — decisions moved with the evaluator");
      if (!evalChanged) notes.push("ANTI-GOODHART FAIL — the evaluator did not respond to flipping");
    }
    if (check === "llmIdentity") {
      const on = runCognitiveRun(adapter, profile, { ...base, policy: "executive", llmBridgeOn: true });
      checks.llmIdentity = on.receiptsJson === executive.receiptsJson && on.trueMarks === executive.trueMarks;
      if (!checks.llmIdentity) notes.push("LLM IDENTITY FAIL — the bridge changed cognition");
    }
    if (check === "divergence") {
      const off = runCognitiveRun(adapter, profile, { ...base, policy: "executive", learningEnabled: false });
      const differs = off.receiptsJson !== executive.receiptsJson;
      checks.developmentalDivergence = executive.selfErrors === 0 ? "no-errors" : differs;
      if (differs) notes.push("learning on vs off → decisions diverged (the loop is causal)");
    }
  }

  const expectWin = s.expectExecutiveWin ?? (s.category !== "structural");
  const checksPass = Object.values(checks).every((v) => v === true || v === "no-errors");
  const winPass = expectWin ? margin >= 0 : true;
  const provenancePass = executive.allProvenanceValid;
  const pass = checksPass && winPass && provenancePass;
  if (!provenancePass) notes.push("PROVENANCE FAIL — an utterance lacked evidence");
  if (!winPass) notes.push(`executive LOST the matched baseline by ${margin} true marks`);

  return {
    id: s.id, name: s.name, category: s.category,
    worldId: adapter.config.id, archetype: s.archetype, seed: s.seed, days,
    executive, linear, margin, checks, pass, notes,
  };
}

/* ── THE THIRTY ───────────────────────────────────────────────────────────── */

const noiseyPolity = (noise: number) => () => {
  const base = polityWorld().config;
  return new TechgramWorldAdapter({ ...base, answerNoise: noise });
};
const noiseyFlat = (noise: number) => () => {
  const base = syntheticFlatWorld().config;
  return new TechgramWorldAdapter({ ...base, answerNoise: noise });
};

export const SCENARIOS: Scenario[] = [
  // 1–10: student archetypes on the real UPSC Polity world
  ...(["steady", "fast_learner", "slow_grinder", "streaky", "quick_fatiguer", "high_stamina", "anxious", "overconfident", "evening_crammer", "recovery_sleeper"] as const).map(
    (arch, i) => ({
      id: `s${String(i + 1).padStart(2, "0")}_${arch}`,
      name: `Archetype ${arch} on UPSC Polity`,
      category: "archetype" as const,
      adapter: polityWorld,
      archetype: arch as Scenario["archetype"],
      seed: 101 + i * 7,
      checks: ["llmIdentity", "divergence"] as CheckName[],
    }),
  ),
  // 11–17: cross-world — the same brain on other curricula and pure structure
  { id: "s11_cbse_steady", name: "CBSE Class 8 Science — steady", category: "cross-world", adapter: cbseWorld, archetype: "steady", seed: 211, checks: ["llmIdentity", "divergence"] },
  { id: "s12_cbse_fatiguer", name: "CBSE Class 8 Science — quick fatiguer", category: "cross-world", adapter: cbseWorld, archetype: "quick_fatiguer", seed: 212, checks: ["llmIdentity"] },
  { id: "s13_cbse_anxious", name: "CBSE Class 8 Science — anxious", category: "cross-world", adapter: cbseWorld, archetype: "anxious", seed: 213, checks: ["llmIdentity"] },
  { id: "s14_chain", name: "Synthetic A — prerequisite chain", category: "cross-world", adapter: syntheticChainWorld, archetype: "steady", seed: 221, checks: ["llmIdentity", "divergence"] },
  { id: "s15_flat", name: "Synthetic B — flat independent", category: "cross-world", adapter: syntheticFlatWorld, archetype: "steady", seed: 222, checks: ["llmIdentity"] },
  { id: "s16_heavy", name: "Synthetic C — heavy-tailed weights", category: "cross-world", adapter: syntheticHeavyWorld, archetype: "steady", seed: 223, checks: ["llmIdentity", "divergence"] },
  { id: "s17_sparse", name: "Synthetic D — sparse noisy evidence", category: "cross-world", adapter: syntheticSparseWorld, archetype: "steady", seed: 224, checks: ["llmIdentity"] },
  // 18–22: adversarial conditions
  { id: "s18_noise30", name: "Adversarial — 30% answer noise", category: "adversarial", adapter: noiseyPolity(0.3), archetype: "steady", seed: 231, checks: ["llmIdentity", "divergence"] },
  { id: "s19_skipped_days", name: "Adversarial — 3 of 8 days skipped", category: "adversarial", adapter: polityWorld, archetype: "steady", seed: 232, opts: { skippedDays: [3, 5, 7] }, checks: ["llmIdentity"] },
  { id: "s20_interruptions", name: "Adversarial — interruptions every turn", category: "adversarial", adapter: polityWorld, archetype: "steady", seed: 233, opts: { interruptionsPerDay: 8 }, checks: ["llmIdentity"] },
  { id: "s21_noise_plus_fatiguer", name: "Adversarial — noise + quick fatiguer", category: "adversarial", adapter: noiseyPolity(0.2), archetype: "quick_fatiguer", seed: 234, checks: ["llmIdentity", "divergence"] },
  { id: "s22_flat_noise25", name: "Adversarial — flat world, 25% noise", category: "adversarial", adapter: noiseyFlat(0.25), archetype: "steady", seed: 235, checks: ["llmIdentity"] },
  // 23–30: structural proofs
  { id: "s23_replay", name: "Structural — replay determinism (bit-identical)", category: "structural", adapter: polityWorld, archetype: "steady", seed: 241, checks: ["replay"], expectExecutiveWin: false },
  { id: "s24_frozen", name: "Structural — frozen organs untouched (shadow belief)", category: "structural", adapter: polityWorld, archetype: "streaky", seed: 242, checks: ["frozenOrgans"], expectExecutiveWin: false },
  { id: "s25_frozen_cbse", name: "Structural — frozen organs on a second world", category: "structural", adapter: cbseWorld, archetype: "slow_grinder", seed: 243, checks: ["frozenOrgans"], expectExecutiveWin: false },
  { id: "s26_antigoodhart_polity", name: "Structural — anti-Goodhart: evaluator flipped (Polity)", category: "structural", adapter: polityWorld, archetype: "steady", seed: 244, checks: ["antiGoodhart"], expectExecutiveWin: false },
  { id: "s27_antigoodhart_chain", name: "Structural — anti-Goodhart: evaluator flipped (chain world)", category: "structural", adapter: syntheticChainWorld, archetype: "steady", seed: 245, checks: ["antiGoodhart"], expectExecutiveWin: false },
  { id: "s28_s4_inrun", name: "Structural — S4 in-run: proposals evaluated, veto enforced", category: "structural", adapter: polityWorld, archetype: "quick_fatiguer", seed: 246, opts: { s4Enabled: true, days: 10 }, checks: ["llmIdentity"], expectExecutiveWin: false },
  { id: "s29_persistence", name: "Structural — 20-day horizon, experience persists", category: "structural", adapter: polityWorld, archetype: "evening_crammer", seed: 247, opts: { days: 20 }, checks: ["divergence", "llmIdentity"], expectExecutiveWin: false },
  { id: "s30_fullstack", name: "Structural — full stack (S4 + expression + LLM bridge on)", category: "structural", adapter: cbseWorld, archetype: "anxious", seed: 248, opts: { s4Enabled: true, llmBridgeOn: true, days: 10 }, checks: ["replay", "frozenOrgans", "divergence"], expectExecutiveWin: false },
];

export interface ExperimentSummary {
  total: number; passed: number; failed: number;
  byCategory: Record<string, { total: number; passed: number }>;
  margins: { mean: number; median: number; min: number; max: number; wins: number; ties: number; losses: number };
  totals: {
    selfErrors: number; decisionsWithInsights: number; plans: number; conductorSteps: number;
    utterances: number; selfCorrections: number; llmVoiced: number;
    experimentsKept: number; experimentsRejected: number; interruptionsHandled: number;
  };
  structural: Record<string, boolean | "no-errors">;
}

export function runAllScenarios(): { results: ScenarioResult[]; summary: ExperimentSummary } {
  const results = SCENARIOS.map(runScenario);
  return { results, summary: summarize(results) };
}

export function summarize(results: ScenarioResult[]): ExperimentSummary {
  const byCategory: Record<string, { total: number; passed: number }> = {};
  for (const r of results) {
    byCategory[r.category] ??= { total: 0, passed: 0 };
    byCategory[r.category]!.total++;
    if (r.pass) byCategory[r.category]!.passed++;
  }
  const margins = results.map((r) => r.margin).sort((a, b) => a - b);
  const structural: Record<string, boolean | "no-errors"> = {};
  for (const r of results) for (const [k, v] of Object.entries(r.checks)) structural[k] = v;
  return {
    total: results.length,
    passed: results.filter((r) => r.pass).length,
    failed: results.filter((r) => !r.pass).length,
    byCategory,
    margins: {
      mean: Math.round((margins.reduce((a, b) => a + b, 0) / Math.max(1, margins.length)) * 100) / 100,
      median: margins[Math.floor(margins.length / 2)] ?? 0,
      min: margins[0] ?? 0,
      max: margins[margins.length - 1] ?? 0,
      wins: results.filter((r) => r.margin > 0).length,
      ties: results.filter((r) => r.margin === 0).length,
      losses: results.filter((r) => r.margin < 0).length,
    },
    totals: {
      selfErrors: results.reduce((a, r) => a + r.executive.selfErrors, 0),
      decisionsWithInsights: results.reduce((a, r) => a + r.executive.decisionsWithInsights, 0),
      plans: results.reduce((a, r) => a + r.executive.plans, 0),
      conductorSteps: results.reduce((a, r) => a + r.executive.conductorSteps, 0),
      utterances: results.reduce((a, r) => a + r.executive.utterances, 0),
      selfCorrections: results.reduce((a, r) => a + r.executive.selfCorrections, 0),
      llmVoiced: results.reduce((a, r) => a + r.executive.llmVoiced, 0),
      experimentsKept: results.reduce((a, r) => a + r.executive.experimentsKept, 0),
      experimentsRejected: results.reduce((a, r) => a + r.executive.experimentsRejected, 0),
      interruptionsHandled: results.reduce((a, r) => a + r.executive.interruptionsHandled, 0),
    },
    structural,
  };
}

