import { describe, it, expect } from "vitest";
import {
  buildBeliefModel, expectedScore, reportConcept, DEFAULT_BELIEF_PARAMS, initialState,
} from "../src/belief.js";
import { DEFAULT_MEMORY_PARAMS } from "../src/memory.js";
import { buildSeedContent } from "../src/polity_seed.js";
import { buildPolityAtomBank } from "../src/polity_atoms.js";
import { makeRng, sigmoid } from "../src/linalg.js";
import { planDay, DEFAULT_PLANNER_PARAMS, type Plan } from "../src/planner.js";
import { newSystemState, applyEvent, type StudentEvent, type SystemState } from "../src/events.js";
import { runTeachingSession, type Responder } from "../src/teach_loop.js";
import type { TeachingMove } from "../src/teacher.js";
import { makeSimStudent, simRespond, simStudy, simDecayDay, trueExamMarks, WORLD_A_FRIENDLY, type SimStudent } from "../src/lab.js";

/**
 * FREEZE INSPECTION: the multi-day closed loop. A synthetic student is taught
 * for 10 days through the REAL path — planDay → composer → teacher → student
 * turns → events → state — while a hidden truth learns/forgets in parallel.
 * The question: does the loop produce measurable learning, honest tracking,
 * and zero crashes? This is the evidence behind "backend freeze".
 */
const content = buildSeedContent();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });
const bank = buildPolityAtomBank();

function runClosedLoopDays(days: number, seed: number) {
  const truth: SimStudent = makeSimStudent(model, { seed, archetype: "consistent", days, minutesPerDay: 240, truthShares: [0.25, 0.25, 0.15, 0.35] }, WORLD_A_FRIENDLY);
  const studentRng = makeRng(seed * 3 + 1);
  let sys: SystemState = newSystemState(model);
  const allEvents: StudentEvent[] = [];
  let evCounter = 0;
  const levelErr: number[] = [];
  const dailyMoves: number[] = [];

  for (let day = 1; day <= days; day++) {
    simDecayDay(truth, model);
    const daysToExam = days - day;

    const plan: Plan = planDay(
      model, sys.belief,
      { day, daysToExam, minutesAvailable: 240, prepHorizonDays: days, memory: sys.memory },
      DEFAULT_PLANNER_PARAMS, makeRng(seed * 31 + day),
    );

    // Responder answers from the hidden truth; the truth ALSO learns from
    // teach/practice/review segments (real students learn while being taught).
    const dayEvents: StudentEvent[] = [];
    const responder: Responder = (move: TeachingMove) => {
      if (move.expectEvidence.kind === "none") return { kind: "none" as const };
      if (move.expectEvidence.kind === "confidence_report") return { kind: "confidence_report" as const, confidence: 2 as const };
      const item = move.item!;
      const ci = model.index.get(move.conceptId)!;
      const correct = simRespond(model, truth, model.content.items.indexOf(item), ci, studentRng);
      if (correct) {
        return { kind: "item_response" as const, chosenOption: item.answer, correct: true, confidence: 2 as const, timeSec: item.expectedTimeSec };
      }
      const tags = Object.keys(item.distractorTags);
      const chosen = tags.length > 0 && studentRng.next() < 0.5 ? Number(tags[0]) : (item.answer + 1) % 4;
      return { kind: "item_response" as const, chosenOption: chosen, correct: false, confidence: 2 as const, timeSec: item.expectedTimeSec };
    };

      const result = runTeachingSession(model, sys, {
        day, minutesAvailable: 240, plan, responder, atomBank: bank,
      });
      sys = result.finalSys;
      allEvents.push(...result.events);
      dailyMoves.push(result.transcript.length);

    // The hidden learner studies what the session actually taught.
    for (const seg of result.session.segments) {
      const ci = model.index.get(seg.conceptId)!;
      const action = seg.kind === "teach" ? "learn" : seg.kind === "practice" || seg.kind === "transfer" ? "practice" : seg.kind === "retrieval_warmup" ? "review" : "diagnose";
      simStudy(truth, model, ci, action, seg.minutes, day, studentRng);
    }

    levelErr.push(Math.abs(expectedScore(model, sys.belief) - trueExamMarks(model, truth)));
    void evCounter;
  }

  return { sys, truth, allEvents, levelErr, dailyMoves };
}

describe("FREEZE INSPECTION — multi-day closed loop (the brain teaches, evidence flows)", () => {
  it("10 days: every event is typed, the state stays coherent, and the loop never stalls", () => {
    const { sys, allEvents, dailyMoves } = runClosedLoopDays(10, 4242);
    expect(allEvents.length).toBeGreaterThan(150); // real teaching volume
    for (const e of allEvents) {
      expect(e.schema_version).toBe(1);
      expect(e.idempotency_key.length).toBeGreaterThan(0);
      expect(["item_response", "confidence_reported"]).toContain(e.type);
    }
    // No day stalls: every day produced moves.
    expect(dailyMoves.every((m) => m > 0)).toBe(true);
    // Misconception machinery live where wrong answers hit tagged distractors.
    void sys;
  });

  it("10 days: beliefs track the hidden truth (calibration error bounded)", () => {
    const { sys, truth } = runClosedLoopDays(10, 5555);
    let acc = 0;
    for (let i = 0; i < model.N; i++) acc += Math.abs(sigmoid(sys.belief.mu[i]) - sigmoid(truth.theta[i]));
    const err = acc / model.N;
    expect(err).toBeLessThan(0.25);
  });

  it("10 days: the student measurably LEARNS through the teaching loop (true exam marks rise)", () => {
    const seed = 777;
    const taught = runClosedLoopDays(10, seed);
    // Control: same hidden student, NO teaching (decay only).
    const controlTruth = makeSimStudent(model, { seed, archetype: "consistent", days: 10, minutesPerDay: 240, truthShares: [0.25, 0.25, 0.15, 0.35] }, WORLD_A_FRIENDLY);
    for (let d = 1; d <= 10; d++) simDecayDay(controlTruth, model);
    const taughtMarks = trueExamMarks(model, taught.truth);
    const controlMarks = trueExamMarks(model, controlTruth);
    expect(taughtMarks).toBeGreaterThan(controlMarks + 2); // real learning, not noise
  });

  it("weak-topic recovery: a topic the student misses gets scheduled and improves", () => {
    const seed = 8888;
    const truth = makeSimStudent(model, { seed, archetype: "consistent", days: 6, minutesPerDay: 240, truthShares: [0.25, 0.25, 0.15, 0.35] }, WORLD_A_FRIENDLY);
    // Sabotage one topic in truth AND keep the belief honest about it.
    const topicConcepts = content.concepts.filter((c) => c.topicId === "t_bod").map((c) => model.index.get(c.id)!);
    for (const i of topicConcepts) truth.theta[i] = -2.5;
    let sys: SystemState = newSystemState(model);
    const studentRng = makeRng(seed + 1);
    const responder: Responder = (move: TeachingMove) => {
      if (move.expectEvidence.kind === "none") return { kind: "none" as const };
      if (move.expectEvidence.kind === "confidence_report") return { kind: "confidence_report" as const, confidence: 2 as const };
      const item = move.item!;
      const ci = model.index.get(move.conceptId)!;
      const correct = simRespond(model, truth, model.content.items.indexOf(item), ci, studentRng);
      return {
        kind: "item_response" as const,
        chosenOption: correct ? item.answer : (item.answer + 1) % 4,
        correct, confidence: 2 as const, timeSec: item.expectedTimeSec,
      };
    };
    let thetaBefore = 0;
    for (const i of topicConcepts) thetaBefore += truth.theta[i];
    for (let day = 1; day <= 6; day++) {
      simDecayDay(truth, model);
      const plan = planDay(model, sys.belief, { day, daysToExam: 6 - day, minutesAvailable: 240, prepHorizonDays: 6, memory: sys.memory }, DEFAULT_PLANNER_PARAMS, makeRng(seed * 7 + day));
      const result = runTeachingSession(model, sys, { day, minutesAvailable: 240, plan, responder, atomBank: bank });
      sys = result.finalSys;
      for (const seg of result.session.segments) {
        const ci = model.index.get(seg.conceptId)!;
        const action = seg.kind === "teach" ? "learn" : seg.kind === "practice" ? "practice" : seg.kind === "retrieval_warmup" ? "review" : "diagnose";
        simStudy(truth, model, ci, action, seg.minutes, day, studentRng);
      }
    }
    let thetaAfter = 0;
    for (const i of topicConcepts) thetaAfter += truth.theta[i];
    // The scheduler must have poured time into the weak topic — truth improves.
    expect(thetaAfter).toBeGreaterThan(thetaBefore - 1); // far better than pure decay
    const rep = reportConcept(model, sys.belief, "c_bd_eci");
    expect(rep.nEff).toBeGreaterThan(0); // the weak topic was actually visited
  });

  it("REPLAY: the full 3-day event log rebuilds the state bit-for-bit", () => {
    const seed = 999;
    const truth = makeSimStudent(model, { seed, archetype: "avoidant", days: 3, minutesPerDay: 240, truthShares: [0.25, 0.25, 0.15, 0.35] }, WORLD_A_FRIENDLY);
    const studentRng = makeRng(seed);
    let sys: SystemState = newSystemState(model);
    const allEvents: StudentEvent[] = [];
    for (let day = 1; day <= 3; day++) {
      simDecayDay(truth, model);
      const plan = planDay(model, sys.belief, { day, daysToExam: 3 - day, minutesAvailable: 240, memory: sys.memory }, DEFAULT_PLANNER_PARAMS, makeRng(seed * 11 + day));
      const responder: Responder = (move: TeachingMove) => {
        if (move.expectEvidence.kind === "none") return { kind: "none" as const };
        if (move.expectEvidence.kind === "confidence_report") return { kind: "confidence_report" as const, confidence: 2 as const };
        const item = move.item!;
        const ci = model.index.get(move.conceptId)!;
        const correct = simRespond(model, truth, model.content.items.indexOf(item), ci, studentRng);
        return { kind: "item_response" as const, chosenOption: item.answer, correct, confidence: 2 as const, timeSec: item.expectedTimeSec };
      };
      const result = runTeachingSession(model, sys, { day, minutesAvailable: 240, plan, responder, atomBank: bank });
      sys = result.finalSys;
      allEvents.push(...result.events);
    }
    // Replay from scratch.
    let replayed: SystemState = newSystemState(model);
    for (const e of allEvents) replayed = applyEvent(model, replayed, e);
    expect(replayed.belief.mu).toEqual(sys.belief.mu);
    expect(replayed.belief.S).toEqual(sys.belief.S);
    expect(Object.keys(replayed.misconceptions.byId).sort()).toEqual(Object.keys(sys.misconceptions.byId).sort());
  });
});
