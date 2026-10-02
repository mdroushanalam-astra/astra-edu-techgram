/**
 * S1 — SESSION-EXPERIENCE CONTRACTS [ADR-027/028].
 *
 * The B7 upgrade: the composer's block plan becomes a NARRATIVE session —
 * orientation → prior probe → hook → discovery → micro-quiz → application →
 * synthesis → open loop — plus BreakPolicy and SessionOutcome.
 *
 * INVARIANTS [ADR-027]: every segment carries objective + expected evidence;
 * the frontend renders this, it never invents it; personalization alters
 * sequencing/presentation, never fabricates knowledge about the student.
 */

import type { Receipt } from "./receipts.js";
import type { ComposedSession } from "./composer.js";
import type { PersonalisationState } from "./behaviour.js";
import type { CuriosityState, CuriosityQuestion } from "./curiosity.js";
import type { BeliefModel } from "./belief.js";
import { reportConcept } from "./belief.js";

export type NarrativeBeat =
  | "orientation"
  | "prior_probe"
  | "hook"
  | "discovery"
  | "micro_quiz"
  | "application"
  | "synthesis"
  | "open_loop"
  | "break";

export interface NarrativeSegment {
  id: string;
  beat: NarrativeBeat;
  /** Machinery kind — maps the beat onto the B8 teacher flow. */
  kind: "probe" | "teach" | "practice" | "calibration_wrap";
  minutes: number;
  conceptId: string;
  conceptName: string;
  objective: string;
  teacherMoveHint: string;
  expectedEvidence: string[];
  curiosityHook?: { question: string; conceptId: string };
  goalConnection?: string;
  sourceSegmentId?: string;
  /** Template utterance for frame beats (orientation/hook/open_loop/break). */
  narrativeTemplate?: string;
  narrativeBeat?: string;
  prediction: { dMastery: number; stabilityMultiplier: number; dUncertaintyVar: number; status: string; confidence: number; aomVersion: string };
}

export interface SessionSpec {
  goalId: string;
  topicId?: string;
  durationMin: number;
  objectives: string[];
  constraints: string[];
  studentStateVersion: string;
}

export interface BreakPolicyDecision {
  recommendedBreakMin: number;
  afterBeatIndex: number;
  confidence: number;
  reason: string;
  evidence: string[];
}

export interface NarrativeSessionPlan {
  spec: SessionSpec;
  segments: NarrativeSegment[];
  totalMinutes: number;
  breakPolicy: BreakPolicyDecision;
  receipt: Receipt;
}

/** Break policy from MEASURED fatigue slopes — never a fixed 10-minute rule. */
export function breakPolicy(personalisation: {
  fatigueTimeSlope: number;
  fatigueErrorSlope: number;
  responses: number;
}, sessionMinutes: number): BreakPolicyDecision {
  const evidence: string[] = [];
  let confidence = 0.3;
  let rec = 0;
  let afterBeatIndex = Math.floor(sessionMinutes / 25); // default: after the first act
  const reasonParts: string[] = [];

  if (personalisation.responses >= 20 && personalisation.fatigueTimeSlope > 0.4) {
    rec = 12;
    confidence = 0.7;
    evidence.push(`response-time drift +${(personalisation.fatigueTimeSlope * 100).toFixed(0)}% within sessions`);
    reasonParts.push("your response time has been rising late in sessions");
  }
  if (personalisation.responses >= 20 && personalisation.fatigueErrorSlope > 0.15) {
    rec = Math.max(rec, 10);
    confidence = Math.max(confidence, 0.65);
    evidence.push(`late-session error rate rises +${(personalisation.fatigueErrorSlope * 100).toFixed(0)} pts`);
    reasonParts.push("accuracy declines late in your sessions");
  }
  if (rec === 0) {
    rec = 5;
    reasonParts.push("standard short reset — no measured fatigue pattern yet");
    confidence = 0.3;
  }
  afterBeatIndex = Math.max(1, Math.min(3, Math.floor(sessionMinutes / 20)));

  return {
    recommendedBreakMin: rec,
    afterBeatIndex,
    confidence,
    reason: reasonParts.join("; ") + `. Evidence: ${personalisation.responses} responses in window.`,
    evidence,
  };
}

/**
 * Compile the planner's block session into the narrative arc.
 * Layout only — every concept/minute still comes from the plan.
 */
export function compileNarrativeArc(
  model: BeliefModel,
  composed: ComposedSession,
  personalisation: PersonalisationState,
  curiosity: CuriosityState,
  opts: { spec: SessionSpec; goalConnection?: string; hook?: { question: string; conceptId: string }; openLoop?: { id: string; question: string; conceptId: string } },
): NarrativeSessionPlan {
  const segments: NarrativeSegment[] = [];
  const spec = opts.spec;
  let budget = composed.totalMinutes;
  let seq = 0;
  const KIND_FOR: Record<NarrativeSegment["beat"], NarrativeSegment["kind"]> = {
    orientation: "teach", prior_probe: "probe", hook: "teach", discovery: "teach",
    micro_quiz: "practice", application: "practice", synthesis: "calibration_wrap",
    open_loop: "teach", break: "teach",
  };
  const mk = (
    beat: NarrativeSegment["beat"], minutes: number, conceptId: string, conceptName: string,
    objective: string, moveHint: string, evidence: string[], extra?: Partial<NarrativeSegment>,
  ) => {
    segments.push({
      id: `nar_${composed.day}_${String(++seq).padStart(2, "0")}_${beat}`,
      beat, kind: KIND_FOR[beat], minutes, conceptId, conceptName, objective,
      teacherMoveHint: moveHint, expectedEvidence: evidence,
      prediction: { dMastery: 0, stabilityMultiplier: 1, dUncertaintyVar: 0, status: "assumed", confidence: 0.4, aomVersion: "narrative" },
      ...extra,
    });
    return segments[segments.length - 1]!;
  };

  // 1. Orientation (always) — the session contract, rendered from state.
  const first = composed.segments[0];
  if (first) {
    const mins = Math.min(2, budget);
    mk("orientation", mins, first.conceptId, first.conceptName,
      `Session contract: today's mission and what we already know about ${first.conceptName}`,
      "MEMORY_OPEN", [], { goalConnection: opts.goalConnection });
    budget -= mins;
  }

  // 2. Prior-knowledge probe / hook — only when there is study content.
  const study = composed.segments.filter((s) => s.kind !== "calibration_wrap");
  const wrap = composed.segments.find((s) => s.kind === "calibration_wrap");

  let hookUsed = false;
  for (const s of study) {
    if (s.kind === "probe") {
      const mins = Math.min(s.minutes, budget);
      mk("prior_probe", mins, s.conceptId, s.conceptName,
        "Prerequisite activation — measure before teaching", "DIAGNOSTIC_PROBE",
        ["item_response"], { sourceSegmentId: s.id });
      budget -= mins;
      continue;
    }
    if ((s.kind === "teach" || s.kind === "practice") && !hookUsed && opts.hook) {
      const mins = Math.min(3, budget);
      mk("hook", mins, s.conceptId, s.conceptName,
        "Curiosity hook — a question the student didn't know they had", "EXPLAIN",
        ["none"], { curiosityHook: opts.hook });
      budget -= mins;
      hookUsed = true;
      continue;
    }
    if (s.kind === "teach") {
      const mins = Math.min(s.minutes, budget);
      mk("discovery", mins, s.conceptId, s.conceptName,
        `Concept construction: ${s.objective}`, "EXPLAIN", ["item_response", "none"],
        { sourceSegmentId: s.id, goalConnection: opts.goalConnection });
      budget -= mins;
      // micro-quiz after each discovery
      if (budget >= 2) {
        mk("micro_quiz", Math.min(3, budget), s.conceptId, s.conceptName,
          "Micro-assessment — evidence before moving on", "RETRIEVAL_PROMPT", ["item_response"]);
        budget -= Math.min(3, budget);
      }
      continue;
    }
    if (s.kind === "practice") {
      const mins = Math.min(s.minutes, budget);
      mk("application", mins, s.conceptId, s.conceptName,
        `Apply ${s.conceptName} with feedback`, "RETRIEVAL_PROMPT", ["item_response"],
        { sourceSegmentId: s.id });
      budget -= mins;
    }
  }

  // 3. Break — from measured fatigue, not a fixed rule.
  const bp = breakPolicy(personalisation, composed.totalMinutes);
  if (bp.recommendedBreakMin > 5 && segments.length > 1) {
    const anchor = Math.min(bp.afterBeatIndex, segments.length);
    segments.splice(anchor, 0, {
      id: `nar_${composed.day}_break`, beat: "break", narrativeBeat: "BREAK", kind: "teach",
      minutes: bp.recommendedBreakMin,
      conceptId: segments[0]!.conceptId, conceptName: "Break",
      objective: `Measured break: ${bp.reason}`, teacherMoveHint: "NONE",
      expectedEvidence: ["none"],
      prediction: { dMastery: 0, stabilityMultiplier: 1, dUncertaintyVar: 0, status: "assumed", confidence: 0.4, aomVersion: "narrative" },
    });
  }

  // 4. Synthesis (calibration + wrap).
  if (wrap) {
    const mins = Math.min(wrap.minutes, Math.max(2, budget));
    mk("synthesis", mins, wrap.conceptId, wrap.conceptName,
      "Calibration check + summary from state deltas", "CALIBRATION_PROMPT",
      ["confidence_report"], { sourceSegmentId: wrap.id });
  }

  // 5. Open loop — the curiosity that pulls the student back.
  const last = segments[segments.length - 1];
  const unresolved = curiosity.questions.find((q) => q.status === "unresolved");
  const openQ: { id: string; question: string; conceptId: string } | undefined =
    opts.openLoop
      ? { id: opts.openLoop.id, question: opts.openLoop.question, conceptId: opts.openLoop.conceptId }
      : unresolved
        ? { id: unresolved.id, question: unresolved.question, conceptId: unresolved.conceptIds[0] ?? last?.conceptId ?? "" }
        : undefined;
  if (last && budget >= 2) {
    const mins = Math.min(2, budget);
    segments.push({
      id: `nar_${composed.day}_${String(++seq).padStart(2, "0")}_open_loop`,
      beat: "open_loop", narrativeBeat: "OPEN_LOOP", kind: "teach", minutes: mins,
      conceptId: last.conceptId, conceptName: last.conceptName,
      objective: openQ ? `Open loop: ${openQ.question}` : "Preview the next session's open question",
      teacherMoveHint: "TEMPLATE", expectedEvidence: ["none"],
      curiosityHook: openQ ? { question: openQ.question, conceptId: openQ.conceptId } : undefined,
      prediction: { dMastery: 0, stabilityMultiplier: 1, dUncertaintyVar: 0, status: "assumed", confidence: 0.4, aomVersion: "narrative" },
    });
  }

  return {
    spec,
    segments,
    totalMinutes: segments.reduce((a, s) => a + s.minutes, 0),
    breakPolicy: { ...bp, afterBeatIndex: Math.min(bp.afterBeatIndex, segments.length) },
    receipt: composed.receipt,
  };
}

/* ------------------------------------------------------------------ */
/* SessionOutcome — the AOM's session-grade fuel [ADR-028]             */
/* ------------------------------------------------------------------ */

export interface SessionSelfReport {
  energy?: number; focus?: number; stress?: number; motivation?: number;
}

export interface SessionOutcome {
  day: number;
  plannedDuration: number;
  actualMinutes: number;
  conceptsTouched: string[];
  conceptsImproved: string[];
  conceptsUncertain: string[];
  misconceptionChanges: string[];
  evidenceCount: number;
  preferenceSignals: number;
  selfReport?: SessionSelfReport;
  predictedGainMarks?: number;
  observedGainMarks?: number;
  predictionError?: number;
  curiosityOpen: string[];
  notes: string[];
}

export function buildSessionOutcome(
  result: {
    session: { totalMinutes: number };
    receipt: Receipt;
    transcript: { move: string }[];
    events: { type: string }[];
    outcomeRecords: { predictedDMastery: number; observedDMastery: number }[];
    segmentSummaries: { conceptId: string; meanBefore: number | null; meanAfter: number | null }[];
  },
  personalisation: { frustration: number; fatigueTimeSlope: number },
  selfReport?: SessionSelfReport,
): SessionOutcome {
  const touched = [...new Set(result.segmentSummaries.map((s) => s.conceptId))];
  const improved = result.segmentSummaries
    .filter((s) => s.meanBefore !== null && s.meanAfter !== null && s.meanAfter! > s.meanBefore!)
    .map((s) => s.conceptId);
  const declined = result.segmentSummaries
    .filter((s) => s.meanBefore !== null && s.meanAfter !== null && s.meanAfter! < s.meanBefore!)
    .map((s) => s.conceptId);
  const predicted = result.outcomeRecords.reduce((a, o) => a + o.predictedDMastery, 0);
  const observed = result.outcomeRecords.reduce((a, o) => a + o.observedDMastery, 0);
  const notes: string[] = [];
  if (personalisation.frustration > 0.2) notes.push("frustration signature present — next session scaffolds earlier");
  if (personalisation.fatigueTimeSlope > 0.4) notes.push("fatigue pattern — break policy recommended");
  return {
    day: result.receipt.day,
    plannedDuration: result.session.totalMinutes,
    actualMinutes: result.session.totalMinutes,
    conceptsTouched: touched,
    conceptsImproved: improved,
    conceptsUncertain: declined,
    misconceptionChanges: [],
    evidenceCount: result.events.length,
    preferenceSignals: 0,
    selfReport,
    predictedGainMarks: undefined,
    observedGainMarks: undefined,
    predictionError: undefined,
    curiosityOpen: [],
    notes,
  };
}

interface StudentEventLite { type: string }
