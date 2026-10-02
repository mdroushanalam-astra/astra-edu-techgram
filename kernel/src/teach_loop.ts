/**
 * TEACHING LOOP RUNNER — the closed loop, end to end.
 *
 *   plan (planner) → compose (B7) → teach (B8 moves) → student turn
 *     → typed events → belief/memory/misconception update
 *     → AOM outcome records (evidence-based) → session receipt
 *
 * The STUDENT is injected as a `Responder` — the kernel never simulates a
 * student. Tests inject a synthetic human; the future PWA injects a real one.
 * This file contains ZERO pedagogy and ZERO student modelling: it is pure
 * orchestration of the organs, and the proof that the loop closes without
 * any LLM anywhere.
 */

import { composeSession, type ComposedSession, type Segment } from "./composer.js";
import {
  nextMove, applyStudentTurn, startTeacherSession,
  type TeachingMove, type TeacherState,
} from "./teacher.js";
import type { BeliefModel, BeliefState } from "./belief.js";
import { reportConcept } from "./belief.js";
import type { SystemState } from "./events.js";
import { applyEvent, type StudentEvent } from "./events.js";
import { buildPlanReceipt, type Receipt } from "./receipts.js";
import type { Plan } from "./planner.js";
import type { AtomBank } from "./atoms.js";
import type { MemoryParams } from "./memory.js";
import { DEFAULT_MEMORY_PARAMS } from "./memory.js";
import type { OutcomeRecord } from "./aom.js";

/**
 * The student's turn, as the world presents it. `kind` matches the move's
 * expectEvidence contract.
 */
export interface StudentTurn {
  kind: "item_response" | "confidence_report" | "none";
  /** Chosen option index (evidence: distractor → misconception). */
  chosenOption?: number;
  correct?: boolean;
  confidence?: 1 | 2 | 3;
  timeSec?: number;
}

/** Dependency-injected student. Deterministic if the implementation is. */
export type Responder = (move: TeachingMove, turnIndex: number) => StudentTurn;

export interface SessionTranscriptEntry {
  seq: number;
  segmentId: string;
  segmentKind: Segment["kind"];
  move: TeachingMove["move"];
  conceptId: string;
  utterance: string;
  atomId?: string;
  why: string;
  studentTurn?: StudentTurn;
  eventIds: string[];
}

export interface SessionResult {
  session: ComposedSession;
  receipt: Receipt;
  transcript: SessionTranscriptEntry[];
  events: StudentEvent[];
  outcomeRecords: OutcomeRecord[];
  /** The folded state AFTER the session — belief/memory/misconceptions updated by evidence alone. */
  finalSys: SystemState;
  /** Per-segment belief snapshots for human-readable reporting. */
  segmentSummaries: {
    segmentId: string;
    kind: Segment["kind"];
    conceptId: string;
    moves: number;
    evidenceEvents: number;
    meanBefore: number | null;
    meanAfter: number | null;
  }[];
}

export interface RunSessionOptions {
  day: number;
  minutesAvailable: number;
  plan: Plan;
  responder: Responder;
  atomBank: AtomBank;
  memParams?: MemoryParams;
  /** Cap on moves — a runaway-guard, never a pedagogy decision. */
  maxMoves?: number;
}

/**
 * Execute one complete teaching session for one day's plan.
 * Every event is folded through applyEvent (the exact production path), so
 * belief/memory/misconceptions update from student evidence alone.
 */
export function runTeachingSession(
  model: BeliefModel,
  sys: SystemState,
  opts: RunSessionOptions,
): SessionResult {
  const memParams = opts.memParams ?? DEFAULT_MEMORY_PARAMS;
  const planReceipt = buildPlanReceipt(opts.plan, unknownsOf(model), aomVersionOf(opts.plan));
  const session = composeSession(opts.plan, opts.minutesAvailable, undefined, planReceipt);

  const teacher: TeacherState = startTeacherSession();
  const transcript: SessionTranscriptEntry[] = [];
  const events: StudentEvent[] = [];
  const outcomeRecords: OutcomeRecord[] = [];
  const segmentSummaries: SessionResult["segmentSummaries"] = [];
  let evCounter = 0;
  const maxMoves = opts.maxMoves ?? 120;

  let guard = 0;
  while (teacher.segmentIndex < session.segments.length && guard < maxMoves * 2) {
    guard += 1;
    const segIdxAtStart = teacher.segmentIndex;
    const segStartMu = sys.belief.mu[model.index.get(session.segments[segIdxAtStart]?.conceptId ?? "") ?? 0];
    const segStartMean = segStartMu !== undefined ? 1 / (1 + Math.exp(-segStartMu)) : null;
    let evidenceEvents = 0;
    const seg = session.segments[segIdxAtStart];
    if (!seg) break;

    let movesThisSegment = 0;
    // Run the segment to its budget (or until the teacher advances it).
    while (teacher.segmentIndex === segIdxAtStart && guard < maxMoves * 2) {
      guard += 1;
      const move = nextMove(model, sys.belief, sys.misconceptions, teacher, session, opts.atomBank);
      if (!move) break;
      if (move.move === "SUMMARISE_CLOSE" && teacher.segmentMoveLog.filter((m) => m === "SUMMARISE_CLOSE").length > 1) break;

      const turnIndex = transcript.length;
      const turn = move.expectEvidence.kind === "none" ? { kind: "none" as const } : opts.responder(move, turnIndex);
      const entry: SessionTranscriptEntry = {
        seq: transcript.length + 1,
        segmentId: move.segmentId,
        segmentKind: seg.kind,
        move: move.move,
        conceptId: move.conceptId,
        utterance: move.utterance,
        atomId: move.atomId,
        why: move.why,
        studentTurn: turn.kind === "none" ? undefined : turn,
        eventIds: [],
      };

      // Emit typed events per the evidence contract.
      if (turn.kind === "item_response" && move.item) {
        evCounter += 1;
        const ev: StudentEvent = {
          event_id: `sess_d${opts.day}_${evCounter}`,
          student_id: "session",
          day: opts.day,
          type: "item_response",
          payload: {
            concept_id: move.conceptId,
            item_id: move.item.id,
            correct: turn.correct ?? false,
            chosen_option: turn.chosenOption,
            confidence: turn.confidence,
            time_sec: turn.timeSec ?? move.item.expectedTimeSec,
          },
          source: "teaching_session",
          session_id: undefined,
          schema_version: 1,
          idempotency_key: `sess-${opts.day}-${evCounter}`,
        };
        events.push(ev);
        entry.eventIds.push(ev.event_id);
        evidenceEvents += 1;
        // Fold immediately: the next move must see the updated belief.
        sys = applyEvent(model, sys, ev, memParams);
        applyStudentTurn(teacher, { correct: turn.correct, confidence: turn.confidence });
      } else if (turn.kind === "confidence_report") {
        evCounter += 1;
        const ev: StudentEvent = {
          event_id: `sess_d${opts.day}_${evCounter}`,
          student_id: "session",
          day: opts.day,
          type: "confidence_reported",
          payload: { concept_id: move.conceptId, confidence: turn.confidence ?? 2 },
          source: "teaching_session",
          schema_version: 1,
          idempotency_key: `sess-${opts.day}-${evCounter}`,
        };
        events.push(ev);
        entry.eventIds.push(ev.event_id);
        evidenceEvents += 1;
        sys = applyEvent(model, sys, ev, memParams);
        applyStudentTurn(teacher, {});
      }

      transcript.push(entry);
      movesThisSegment += 1;
      if (movesThisSegment > 40) break; // per-segment runaway guard
    }

    // AOM outcome record for the segment (evidence-based belief shift).
    const ci = model.index.get(seg.conceptId);
    if (ci !== undefined) {
      const afterMu = sys.belief.mu[ci];
      outcomeRecords.push({
        action: blockActionOf(session, seg),
        minutes: seg.minutes,
        masteryAtAction: 1 / (1 + Math.exp(-segStartMu)),
        predictedDMastery: seg.prediction.dMastery,
        observedDMastery: afterMu - segStartMu,
        n: evidenceEvents,
      });
    }
    const afterMu2 = sys.belief.mu[ci ?? 0];
    segmentSummaries.push({
      segmentId: seg.id,
      kind: seg.kind,
      conceptId: seg.conceptId,
      moves: movesThisSegment,
      evidenceEvents,
      meanBefore: segStartMean,
      meanAfter: afterMu2 !== undefined ? 1 / (1 + Math.exp(-afterMu2)) : null,
    });
  }

  return {
    session,
    receipt: planReceipt,
    transcript,
    events,
    outcomeRecords,
    finalSys: sys,
    segmentSummaries,
  };
}

function blockActionOf(session: ComposedSession, seg: Segment): OutcomeRecord["action"] {
  const block = session.receipt
    ? undefined
    : undefined;
  void block;
  switch (seg.kind) {
    case "retrieval_warmup": return "review";
    case "teach": return "learn";
    case "practice": return "practice";
    case "probe": return "diagnose";
    case "transfer": return "practice";
    case "calibration_wrap": return "review";
  }
}

function unknownsOf(model: BeliefModel): string[] {
  const out: string[] = [];
  for (const t of model.content.topics) {
    out.push(`${t.name}: coverage tracked via concept-level envelopes`);
  }
  return out.slice(0, 3);
}

function aomVersionOf(plan: Plan): string | undefined {
  return plan.blocks[0]?.prediction.aomVersion;
}

/** Convenience: believed mastery report after the session for one concept. */
export function sessionConceptReport(model: BeliefModel, sys: SystemState, conceptId: string) {
  return reportConcept(model, sys.belief, conceptId);
}
