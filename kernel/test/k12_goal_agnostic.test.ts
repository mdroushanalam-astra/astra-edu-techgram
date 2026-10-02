import { describe, it, expect } from "vitest";
import {
  buildBeliefModel, initialState, expectedScore, reportConcept, DEFAULT_BELIEF_PARAMS,
} from "../src/belief.js";
import { DEFAULT_MEMORY_PARAMS } from "../src/memory.js";
import { newSystemState, applyEvent } from "../src/events.js";
import { planDay, DEFAULT_PLANNER_PARAMS } from "../src/planner.js";
import { composeSession } from "../src/composer.js";
import { runTeachingSession, type Responder } from "../src/teach_loop.js";
import { makeRng, sigmoid, cholesky } from "../src/linalg.js";
import { makeSimStudent, simRespond, simStudy, simDecayDay, trueExamMarks } from "../src/lab.js";
import { buildK12Content, buildK12AtomBank, K12_GOAL } from "../src/k12_seed.js";

/**
 * GOAL-AGNOSTICISM PROOF [Notebook §19, ADR-020]:
 * The ENTIRE brain — belief engine, memory, exam model, diagnostic, planner,
 * composer, teacher, closed loop — runs on K12 (CBSE Class 8 Science) content
 * with ZERO kernel changes. Exams are config; the brain is the product.
 */
const content = buildK12Content();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });
const bank = buildK12AtomBank();

describe("K12 feed — the same brain, a different goal (CBSE Class 8 Science)", () => {
  it("accepts the K12 graph: prior is PD, weights derive, items tagged", () => {
    const st = initialState(model);
    expect(() => cholesky(model.Sigma0, model.N)).not.toThrow(); // prior is positive-definite
    expect(model.N).toBe(14);
    expect(model.content.items.length).toBe(25);
    const wSum = [...model.content.conceptWeight.values()].reduce((a, b) => a + b, 0);
    expect(Math.round(wSum)).toBe(40); // exam questions = 40
    void st;
  });

  it("expected score is on the K12 paper scale (40 × 1 mark, no negative)", () => {
    const es = expectedScore(model, initialState(model));
    expect(es).toBeGreaterThan(10);
    expect(es).toBeLessThan(34); // prior ≈ 0.4 mastery, no negative marking
    expect(content.exam.negativeFraction).toBe(0); // school test
  });

  it("the FULL closed loop teaches a K12 student (plan → compose → teach → evidence)", () => {
    const sys = newSystemState(model);
    const truth = makeSimStudent(model, { seed: 31, archetype: "consistent", days: 1, minutesPerDay: 120, truthShares: [0.25, 0.25, 0.15, 0.35] });
    const rng = makeRng(31);
    const plan = planDay(model, sys.belief, { day: 1, daysToExam: 89, minutesAvailable: 40, prepHorizonDays: 90, memory: sys.memory }, DEFAULT_PLANNER_PARAMS, rng);
    const responder: Responder = (move) => {
      if (move.expectEvidence.kind === "none") return { kind: "none" };
      if (move.expectEvidence.kind === "confidence_report") return { kind: "confidence_report", confidence: 2 };
      const item = move.item!;
      const ci = model.index.get(move.conceptId)!;
      const correct = simRespond(model, truth, model.content.items.indexOf(item), ci, rng);
      return {
        kind: "item_response", chosenOption: correct ? item.answer : (item.answer + 1) % 4,
        correct, confidence: 2, timeSec: item.expectedTimeSec,
      };
    };
    const session = runTeachingSession(model, sys, { day: 1, minutesAvailable: 40, plan, responder, atomBank: bank });
    expect(session.transcript.length).toBeGreaterThan(5);
    expect(session.session.segments.some((s) => s.kind === "teach")).toBe(true);
    expect(session.session.segments[session.session.segments.length - 1]!.kind).toBe("calibration_wrap");
    expect(session.outcomeRecords.length).toBe(session.session.segments.length);
  });

  it("10 K12 days: true learning through the closed loop + honest tracking", () => {
    const truth = makeSimStudent(model, { seed: 77, archetype: "consistent", days: 10, minutesPerDay: 120, truthShares: [0.25, 0.25, 0.15, 0.35] });
    let sys = newSystemState(model);
    const studentRng = makeRng(77);
    const levelErr: number[] = [];
    for (let day = 1; day <= 10; day++) {
      simDecayDay(truth, model);
      const plan = planDay(model, sys.belief, { day, daysToExam: 90 - day, minutesAvailable: 120, prepHorizonDays: 90, memory: sys.memory }, DEFAULT_PLANNER_PARAMS, makeRng(77 * 13 + day));
      const responder: Responder = (move) => {
        if (move.expectEvidence.kind === "none") return { kind: "none" };
        if (move.expectEvidence.kind === "confidence_report") return { kind: "confidence_report", confidence: 2 };
        const item = move.item!;
        const ci = model.index.get(move.conceptId)!;
        const correct = simRespond(model, truth, model.content.items.indexOf(item), ci, studentRng);
        return { kind: "item_response", chosenOption: correct ? item.answer : (item.answer + 1) % 4, correct, confidence: 2, timeSec: item.expectedTimeSec };
      };
      const result = runTeachingSession(model, sys, { day, minutesAvailable: 120, plan, responder, atomBank: bank });
      sys = result.finalSys;
      for (const seg of result.session.segments) {
        const ci = model.index.get(seg.conceptId)!;
        const action = seg.kind === "teach" ? "learn" : seg.kind === "practice" ? "practice" : seg.kind === "retrieval_warmup" ? "review" : "diagnose";
        simStudy(truth, model, ci, action, seg.minutes, day, studentRng);
      }
      levelErr.push(Math.abs(expectedScore(model, sys.belief) - trueExamMarks(model, truth)));
    }
    // The student actually learned: true marks above the prior baseline.
    expect(trueExamMarks(model, truth)).toBeGreaterThan(14); // prior ≈ 13-14 on this scale
    // Beliefs tracked the truth.
    let acc = 0;
    for (let i = 0; i < model.N; i++) acc += Math.abs(sigmoid(sys.belief.mu[i]) - sigmoid(truth.theta[i]));
    expect(acc / model.N).toBeLessThan(0.3);
    void levelErr;
  });

  it("teaching quality: K12 atoms exist for taught concepts (tier discipline holds outside Polity too)", () => {
    for (const c of content.concepts.slice(0, 6)) {
      const atom = bank.byConceptKind.get(`${c.id}:explanation`);
      expect(atom?.length ?? 0).toBeGreaterThan(0);
    }
    // A specific taught concept reports honestly after evidence.
    const sys = newSystemState(model);
    const rep = reportConcept(model, sys.belief, "k_p_def");
    expect(rep.grey).toBe(true); // honest before evidence
  });
});
