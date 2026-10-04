/**
 * THE EXPRESSION LAYER [Phase 4, roadmap §10, ADR-039 C3] — how cognition
 * becomes experience. THE LAW: Executive decides → Conductor executes →
 * Presence expresses → LLM voices → UI renders. Never the reverse.
 *
 * §10.1 Communication Policy — verbosity, tone, timing, humor, silence:
 *       EXPRESSES the cognitive decision, does not create it.
 * §10.2 Blackboard — receives STRUCTURED cognitive output; does not invent
 *       educational content (teaching content stays with the frozen teacher
 *       via the learning channel; expression owns the COGNITIVE voice: why,
 *       self-correction, transitions, presence).
 * §10.3 Voice — capability-gated: every utterance is complete text BEFORE any
 *       voice capability; no voice capability is a dependency for intelligence.
 * §10.4 LLM Bridge — may re-voice (paraphrase/example) WITHIN the evidence
 *       basis; cannot select actions, rewrite state, override the Executive,
 *       invent evidence, or alter ground truth. The fallback text is always
 *       the deterministic utterance — LLM OFF and LLM ON produce the same
 *       cognitive output (the Phase 4 gate).
 *
 * The claim-provenance law holds at this layer: an utterance without evidence
 * may not be composed (validateUtterance throws). The student never sees raw
 * machinery ("SelfPredictionError #17") — they experience "it noticed, it was
 * wrong, it changed."
 */
import type { ExecutiveDirective, ExecutiveReceipt, TurnWorkspace } from "./executive.js";
import type { ExperiencePlan } from "./experience-plan.js";
import type { SelfErrorRecord } from "./self-development.js";
import type { SelfInsights } from "./developmental-session.js";

export class ExpressionError extends Error {}

/* ── the expression vocabulary ────────────────────────────────────────────── */

/** Prosody hints — the kernel mirror of the frontend's VoiceIntent. */
export interface Prosody {
  pace: "slow" | "normal" | "brisk";
  energy: "low" | "medium" | "high";
  pauseBeforeMs: number;
  pauseAfterMs: number;
  emphasis?: string;
  /** THE INTERRUPTION NON-NEGOTIABLE [S2]: the student can always stop the voice. */
  interruptible: true;
}

export type UtteranceKind =
  | "explain" | "question" | "reassure" | "why-this"
  | "self-correction" | "praise" | "transition";

export interface LlmBridgeRequest {
  /** What the LLM may do with the utterance. */
  kind: "paraphrase" | "example";
  /** The evidence basis it may draw from — NOTHING outside this. */
  basis: string[];
  /** Hard constraints (ethics wall + claim-provenance), enforced downstream. */
  constraints: string[];
}

export interface Utterance {
  id: string;
  kind: UtteranceKind;
  text: string;
  /** THE CLAIM-PROVENANCE LAW: every spoken sentence traces to evidence. */
  evidenceRefs: string[];
  prosody: Prosody;
  /** Present ONLY when the Executive chose LLM augmentation AND the bridge is on. */
  llm?: LlmBridgeRequest;
}

export interface PresenceBehavior {
  state: "speaking" | "listening" | "thinking" | "silent" | "waiting";
  gaze: "student" | "board" | "away";
  waitSeconds?: number;
  interruptible: boolean;
  /** Why this presence — for the receipt, never spoken to the student. */
  reason: string;
}

/** §10.2 — structured cognitive output for the board. References, not content. */
export interface BoardPayload {
  kind: "concept" | "relationship" | "prediction" | "evidence" | "progression";
  conceptId?: string;
  title: string;
  evidenceRefs: string[];
  data: Record<string, unknown>;
}

/** §10.1 — how the decision is voiced (never what is decided). */
export interface CommunicationPolicy {
  verbosity: "terse" | "standard" | "deep";
  allowHumor: boolean;
  silenceFirst: boolean;
  /** The policy's own why — for the microscope, not for speech. */
  reason: string[];
}

export function validateUtterance(u: Utterance): void {
  if (!u.text || !u.text.trim()) throw new ExpressionError(`utterance ${u.id}: empty text`);
  if (!u.evidenceRefs || u.evidenceRefs.length === 0) {
    throw new ExpressionError(`utterance ${u.id}: no evidence — unproven claims may not be spoken`);
  }
  for (const w of FORBIDDEN_PHRASES) {
    if (u.text.toLowerCase().includes(w)) {
      throw new ExpressionError(`utterance ${u.id}: forbidden phrasing "${w}" (ethics wall)`);
    }
  }
}

/** The ethics wall at the expression layer — guilt/urgency/exploitation may not be voiced. */
const FORBIDDEN_PHRASES = ["you should have", "you're falling behind", "everyone else", "hurry up", "you're lazy", "you always fail"];

/* ── §10.1 the Communication Policy ──────────────────────────────────────── */

export function applyCommunicationPolicy(w: TurnWorkspace, directive: ExecutiveDirective): CommunicationPolicy {
  const reason: string[] = [];
  let verbosity: CommunicationPolicy["verbosity"] = "standard";
  if (w.wrongStreak >= 2) {
    verbosity = "terse";
    reason.push(`${w.wrongStreak} consecutive misses — an overloaded student needs shorter sentences`);
  } else if (w.focusConcept.grey || w.uncertainties >= 4) {
    verbosity = "deep";
    reason.push(w.focusConcept.grey ? "the concept is still grey — depth is warranted" : "high uncertainty — depth is warranted");
  }
  const allowHumor =
    directive.communication === "reassure" &&
    w.momentum > 0.2 && w.frustration < 0.3 &&
    w.counts.jokes < 2;
  if (directive.communication === "reassure") reason.push("the Executive chose a light beat — expression renders it only if momentum is healthy");
  const silenceFirst = directive.communication === "silence" || (w.lastOutcome === "correct" && verbosity !== "terse");
  if (silenceFirst) reason.push("a correct answer just landed — let it consolidate before the next sentence");
  return { verbosity, allowHumor, silenceFirst, reason };
}

/* ── the microscope: why-this and self-correction ────────────────────────── */

/** §9.4 Evidence UI as an utterance: why THIS, and what it gave up. */
export function whyThis(receipt: ExecutiveReceipt): Utterance | null {
  const primary = receipt.reason[0];
  if (!primary) return null;
  const alt = receipt.alternativesConsidered[0];
  const altClause = alt ? ` Not ${alt.directive.split("/")[0]} — ${alt.whyNot}.` : "";
  return {
    id: `why_${receipt.id}`,
    kind: "why-this",
    text: `Why this: ${primary}${altClause}`,
    evidenceRefs: receipt.evidenceRefs,
    prosody: { pace: "normal", energy: "medium", pauseBeforeMs: 250, pauseAfterMs: 400, interruptible: true },
  };
}

/**
 * THE ADR-039 EXPERIENCE — visible self-correction from REAL ledger patterns.
 * The student never sees machinery IDs; they hear that it noticed, was wrong,
 * and changed. Returns null without evidence (no invented humility).
 */
export function selfCorrectionMoment(ledger: SelfErrorRecord[], insights: SelfInsights | null): Utterance | null {
  if (!insights || ledger.length === 0) return null;
  if (insights.interventionTendency === "early" && insights.selfErrorCount >= 3) {
    return {
      id: "sc_intervention_early",
      kind: "self-correction",
      text: "I was about to step in again — but my notes say I do that too early with you. Your turn first.",
      evidenceRefs: ["self-error-ledger", "self-model:interventionTendency"],
      prosody: { pace: "slow", energy: "low", pauseBeforeMs: 400, pauseAfterMs: 700, interruptible: true },
    };
  }
  if (insights.breakCalibration === "reluctant" && insights.selfErrorCount >= 3) {
    return {
      id: "sc_break_reluctant",
      kind: "self-correction",
      text: "I held on too long before our last pause. We pause earlier now — that's on me, not you.",
      evidenceRefs: ["self-error-ledger", "self-model:breakCalibration"],
      prosody: { pace: "slow", energy: "low", pauseBeforeMs: 400, pauseAfterMs: 700, interruptible: true },
    };
  }
  if (insights.breakCalibration === "aggressive" && insights.selfErrorCount >= 3) {
    return {
      id: "sc_break_aggressive",
      kind: "self-correction",
      text: "I kept pausing when you were mid-thought — my notes called it. I let the work run longer now.",
      evidenceRefs: ["self-error-ledger", "self-model:breakCalibration"],
      prosody: { pace: "slow", energy: "low", pauseBeforeMs: 400, pauseAfterMs: 700, interruptible: true },
    };
  }
  if (insights.interventionTendency === "late" && insights.selfErrorCount >= 3) {
    return {
      id: "sc_intervention_late",
      kind: "self-correction",
      text: "I let you wrestle with that a beat too long before stepping in — I move sooner now.",
      evidenceRefs: ["self-error-ledger", "self-model:interventionTendency"],
      prosody: { pace: "slow", energy: "low", pauseBeforeMs: 400, pauseAfterMs: 700, interruptible: true },
    };
  }
  return null;
}

/* ── the composer ─────────────────────────────────────────────────────────── */

const TRANSITIONS = ["Right — here's where we go next.", "Okay. Next beat.", "Moving on."];

function prosodyFor(w: TurnWorkspace, kind: UtteranceKind, policy: CommunicationPolicy): Prosody {
  const struggling = w.wrongStreak >= 2;
  if (kind === "question") {
    return { pace: struggling ? "slow" : "normal", energy: "medium", pauseBeforeMs: 200, pauseAfterMs: 900, emphasis: policy.verbosity === "terse" ? undefined : "the question itself", interruptible: true };
  }
  if (kind === "reassure" || kind === "self-correction") {
    return { pace: "slow", energy: "low", pauseBeforeMs: 300, pauseAfterMs: 600, interruptible: true };
  }
  return {
    pace: struggling ? "slow" : policy.verbosity === "deep" ? "normal" : "brisk",
    energy: struggling ? "low" : "medium",
    pauseBeforeMs: 150, pauseAfterMs: struggling ? 700 : 350,
    interruptible: true,
  };
}

/** One turn's composed expression — pure: it mutates nothing it is given. */
export interface ExpressionTurnInput {
  directive: ExecutiveDirective;
  receipt: ExecutiveReceipt;
  workspace: TurnWorkspace;
  plan: ExperiencePlan;
  /** Carried experience, for the self-correction moment. */
  ledger: SelfErrorRecord[];
  insights: SelfInsights | null;
  /** Bridge on = LLM augmentation produces a bounded re-voicing request. */
  llmBridgeOn: boolean;
}

export interface ExpressionTurnOutput {
  presence: PresenceBehavior;
  utterances: Utterance[];
  board: BoardPayload | null;
  policy: CommunicationPolicy;
}

export function composeExpression(
  input: ExpressionTurnInput,
  state: { turn: number; lastTwoOutcomes: ("correct" | "wrong" | null)[]; praiseTurns: number[]; lastReassuranceTurn: number },
): ExpressionTurnOutput {
  const { directive, receipt, workspace: w, plan, ledger, insights } = input;
  const policy = applyCommunicationPolicy(w, directive);

  // PRESENCE — silence is first-class; a break is waiting, not talking.
  const presence: PresenceBehavior =
    directive.communication === "silence"
      ? { state: "silent", gaze: "away", interruptible: true, reason: "the decision is silence — presence honours it" }
      : directive.learningAction === "break"
        ? { state: "waiting", gaze: "away", waitSeconds: plan.learning.minutes ? plan.learning.minutes * 60 : 300, interruptible: true, reason: "a break is rest, not chatter — the student can always reach back" }
        : directive.communication === "question"
          ? { state: "listening", gaze: "student", interruptible: true, reason: "a question was asked — the next voice is the student's" }
          : { state: "speaking", gaze: w.focusConcept.grey ? "board" : "student", interruptible: true, reason: "the decision is speech" };

  const utterances: Utterance[] = [];
  const refs = [...receipt.evidenceRefs];
  const push = (u: Utterance) => { validateUtterance(u); utterances.push(u); };

  // PRAISE — hybrid (c): warm + specific + TRUE, earned by observed outcomes.
  // Computed BEFORE the silence gate: praise after two clean answers is exactly
  // what a correct answer deserves — then the silence follows.
  const earned =
    w.lastOutcome === "correct" &&
    state.lastTwoOutcomes[0] === "correct" && state.lastTwoOutcomes[1] === "correct" &&
    !state.praiseTurns.some((t) => state.turn - t < 3);
  if (earned) {
    push({
      id: `praise_${receipt.id}`, kind: "praise",
      text: `Two clean answers on ${w.focusConcept.name} in a row — that was yours, no hint.`,
      evidenceRefs: [...refs, "session:lastOutcome", `concept:${w.focusConcept.id}`],
      prosody: { pace: "normal", energy: "high", pauseBeforeMs: 200, pauseAfterMs: 500, interruptible: true },
    });
    state.praiseTurns.push(state.turn);
  }

  // SILENCE: no further utterances. Presence already said it (praise excepted).
  if (policy.silenceFirst || directive.communication === "silence") {
    return { presence, utterances, board: boardPayloadFor(plan, receipt, w), policy };
  }

  // TEACHING CONTENT IS NOT EXPRESSION'S — the frozen teacher speaks the lesson
  // through the learning channel. Expression adds the cognitive voice around it:
  if (directive.learningAction === "break") {
    push({
      id: `rest_${receipt.id}`, kind: "transition",
      text: `Let's pause here${policy.verbosity === "terse" ? "." : " — I'll hold the thread; come back whenever you're ready."}`,
      evidenceRefs: [...refs, "behaviour:fatigue"],
      prosody: prosodyFor(w, "transition", policy),
    });
  } else if (directive.learningAction !== "end") {
    push({
      id: `frame_${receipt.id}`, kind: "transition",
      text: `${TRANSITIONS[state.turn % TRANSITIONS.length]}${policy.verbosity === "deep" ? ` We're on ${w.focusConcept.name}.` : ""}`,
      evidenceRefs: [...refs, `concept:${w.focusConcept.id}`],
      prosody: prosodyFor(w, "transition", policy),
    });
  }

  // WHY-THIS — the microscope, offered after a deviation from the incumbent.
  if (receipt.reason.some((r) => r.startsWith("self-model:")) || directive.learningAction === "diagnose") {
    const why = whyThis(receipt);
    if (why) push(why);
  }

  // SELF-CORRECTION — earned by the ledger, never performed.
  const sc = selfCorrectionMoment(ledger, insights);
  if (sc && state.turn % 3 === 0) push(sc); // at most one every third turn — humility is not wallpaper

  // REASSURANCE — after a near-miss, varied, never twice in a row. A break turn
  // already carries its rest line — adding a reassurance would be chatter.
  if (directive.communication === "reassure" && directive.learningAction !== "break" && state.turn - state.lastReassuranceTurn >= 3) {
    push({
      id: `steady_${receipt.id}`, kind: "reassure",
      text: policy.verbosity === "terse" ? "Steady." : "Steady — this is where the real concept starts, and you're still on the board.",
      evidenceRefs: [...refs, "session:wrongStreak"],
      prosody: prosodyFor(w, "reassure", policy),
    });
    state.lastReassuranceTurn = state.turn;
  }

  // QUESTION — hand the turn over and wait.
  if (directive.communication === "question") {
    push({
      id: `ask_${receipt.id}`, kind: "question",
      text: policy.verbosity === "deep"
        ? `Before I explain ${w.focusConcept.name} — what do you think is going on?`
        : `Your move: what do you think is going on with ${w.focusConcept.name}?`,
      evidenceRefs: [...refs, `concept:${w.focusConcept.id}`],
      prosody: prosodyFor(w, "question", policy),
    });
  }

  // §10.4 THE LLM BRIDGE — only where the Executive chose it, only a re-voicing.
  if (directive.augmentation === "llm" && input.llmBridgeOn && utterances.length > 0) {
    const target = utterances[utterances.length - 1]!;
    target.llm = {
      kind: target.kind === "explain" ? "example" : "paraphrase",
      basis: target.evidenceRefs,
      constraints: [
        "do not state anything outside the basis",
        "no guilt, urgency, or emotional targeting (ethics wall)",
        "no labels of the student",
        "the learning decision and the evidence are not yours to change",
      ],
    };
  }

  return { presence, utterances, board: boardPayloadFor(plan, receipt, w), policy };
}

/** §10.2 — the board receives structured output; it invents nothing. */
export function boardPayloadFor(plan: ExperiencePlan, receipt: ExecutiveReceipt, w: TurnWorkspace): BoardPayload | null {
  if (plan.expression.surface === "none") return null;
  const kind: BoardPayload["kind"] =
    plan.expression.surface === "chart" ? "relationship" :
    plan.learning.action === "diagnose" ? "evidence" :
    w.uncertainties >= 4 ? "prediction" :
    plan.learning.action === "retrieve" ? "progression" : "concept";
  return {
    kind,
    conceptId: w.focusConcept.id,
    title: w.focusConcept.name,
    evidenceRefs: receipt.evidenceRefs,
    data: {
      learningAction: plan.learning.action,
      surface: plan.expression.surface,
      predictedBenefit: receipt.prediction.predictedBenefit,
      uncertainty: receipt.prediction.uncertainty,
      confidence: receipt.confidence,
      grey: w.focusConcept.grey,
      spec: plan.expression.spec ?? null,
    },
  };
}
