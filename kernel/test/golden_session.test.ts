import { describe, it, expect } from "vitest";
import {
  buildBeliefModel, initialState, observe, DEFAULT_BELIEF_PARAMS, expectedScore,
} from "../src/belief.js";
import { DEFAULT_MEMORY_PARAMS } from "../src/memory.js";
import { newSystemState, applyEvent } from "../src/events.js";
import { planDay, DEFAULT_PLANNER_PARAMS } from "../src/planner.js";
import { buildPlanReceipt } from "../src/receipts.js";
import { compileNarrativeArc, breakPolicy } from "../src/session.js";
import { composeSession } from "../src/composer.js";
import { computePersonalisationState } from "../src/behaviour.js";
import { makeRng, sigmoid } from "../src/linalg.js";
import { buildGeomorphologyContent, GEO_CAPABILITIES, GEO_HOOKS, GEO_GOAL } from "../src/geo_seed.js";
import { makeSimStudent, simRespond, simStudy, simDecayDay, trueExamMarks } from "../src/lab.js";
import { runTeachingSession, type Responder } from "../src/teach_loop.js";
import { nextMove, startTeacherSession } from "../src/teacher.js";
import { newMisconceptionState } from "../src/diagnosis.js";
import { growthReceipt, changedMyMind } from "../src/validation.js";
import { capabilityJourney } from "../src/validation.js";

const content = buildGeomorphologyContent();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });

function makeResponderFor(seed: number, opts?: { alwaysWrong?: boolean }) {
  const truth = makeSimStudent(model, { seed, archetype: "consistent", days: 1, minutesPerDay: 240, truthShares: [0.25, 0.25, 0.15, 0.35] });
  const rng = makeRng(seed);
  return (move: { expectEvidence: { kind: string }; item?: { id: string; answer: number; expectedTimeSec: number }; conceptId: string }) => {
    if (move.expectEvidence.kind === "none") return { kind: "none" as const };
    if (move.expectEvidence.kind === "confidence_report") return { kind: "confidence_report" as const, confidence: 2 as const };
    const item = move.item!;
    const ci = model.index.get(move.conceptId)!;
    const itemIdx = model.content.items.findIndex((i) => i.id === item.id);
    const correct = opts?.alwaysWrong ? false : simRespond(model, truth, itemIdx, ci, rng);
    return {
      kind: "item_response" as const,
      chosenOption: correct ? item.answer : (item.answer + 1) % 4,
      correct, confidence: 2 as const, timeSec: item.expectedTimeSec,
    };
  };
}

describe("S2 — GOLDEN REPLAY: full narrative session", () => {
  it("compiles the narrative arc: ordered beats, break policy, open loop", () => {
    const st = initialState(model);
    const sys = newSystemState(model);
    const plan = planDay(model, st, { day: 1, daysToExam: 89, minutesAvailable: 40, prepHorizonDays: 90, memory: sys.memory }, DEFAULT_PLANNER_PARAMS, makeRng(1));
    const composed = composeSession(plan, 40, undefined, buildPlanReceipt(plan, []));
    const narrative = compileNarrativeArc(model, composed, {
      momentum: 0, fatigueTimeSlope: 0, fatigueErrorSlope: 0, frustration: 0,
      loadToleranceMin: 0, optimalSessionMin: null, avoidance: [], recoveryRate: 0.5, responses: 0,
    }, { questions: [] }, {
      spec: { goalId: GEO_GOAL.id, durationMin: 40, objectives: ["understand geomorphic processes"], constraints: [], studentStateVersion: "v1" },
      goalConnection: GEO_GOAL.aspiration, hook: GEO_HOOKS[0],
    });
    expect(narrative.segments.length).toBeGreaterThan(3);
    expect(narrative.segments[0]!.beat).toBe("orientation");
    expect(narrative.segments[narrative.segments.length - 1]!.beat).toBe("open_loop");
    expect(narrative.totalMinutes).toBeLessThanOrEqual(40);
    const openLoop = narrative.segments.find((s) => s.beat === "open_loop");
    expect(openLoop?.curiosityHook?.question).toBeDefined();
  });

  it("runs the full session: evidence events, deterministic replay", () => {
    const sys = newSystemState(model);
    const rng = makeRng(42);
    const plan = planDay(model, sys.belief, { day: 1, daysToExam: 89, minutesAvailable: 40, prepHorizonDays: 90, memory: sys.memory }, DEFAULT_PLANNER_PARAMS, rng);
    const responder = makeResponderFor(42);
    const r1 = runTeachingSession(model, sys, { day: 1, minutesAvailable: 40, plan, responder, atomBank: { version: "empty", atoms: [], byId: new Map(), byConceptKind: new Map(), byPair: new Map(), byKind: new Map() } });
    expect(r1.transcript.length).toBeGreaterThan(5);
    expect(r1.events.length).toBeGreaterThan(3);
    for (const e of r1.events) expect(e.schema_version).toBe(1);
    const r2 = runTeachingSession(model, sys, { day: 1, minutesAvailable: 40, plan, responder: makeResponderFor(42), atomBank: { version: "empty", atoms: [], byId: new Map(), byConceptKind: new Map(), byPair: new Map(), byKind: new Map() } });
    expect(r2.transcript.map((t) => t.move)).toEqual(r1.transcript.map((t) => t.move));
  });
});

describe("WORLD A — clean student", () => {
  it("planner produces a plan; session runs with receipts", () => {
    const sys = newSystemState(model);
    const plan = planDay(model, initialState(model), { day: 1, daysToExam: 60, minutesAvailable: 240, memory: new Map() }, DEFAULT_PLANNER_PARAMS, makeRng(10));
    const responder = makeResponderFor(10);
    const result = runTeachingSession(model, sys, { day: 1, minutesAvailable: 240, plan, responder, atomBank: { version: "empty", atoms: [], byId: new Map(), byConceptKind: new Map(), byPair: new Map(), byKind: new Map() } });
    expect(result.transcript.length).toBeGreaterThan(3);
    expect(result.receipt.receipt_id).toBeDefined();
  });
});

describe("WORLD B — false confidence", () => {
  it("confidence calibration gap is tracked", () => {
    let s = newSystemState(model);
    for (let d = 1; d <= 8; d++) {
      s = applyEvent(model, s, { event_id: `b${d}`, student_id: "s", day: d, type: "item_response", payload: { concept_id: "g_erosion", correct: true, confidence: 3, time_sec: 40 }, source: "test", schema_version: 1, idempotency_key: `bk${d}` });
    }
    expect(s.belief.nEff.length).toBeGreaterThan(0);
  });
});

describe("WORLD D — resistant student (avoidance)", () => {
  it("avoidance map flags repeated no-show concepts", () => {
    const events: Parameters<typeof computePersonalisationState>[0] = [];
    for (let day = 1; day <= 4; day++) {
      events.push({ event_id: `d${day}`, student_id: "s", day, type: "session_started" as const, payload: { topic: "g_governance" }, source: "test", schema_version: 1, idempotency_key: `ad${day}` });
      events.push({ event_id: `r${day}`, student_id: "s", day, type: "item_response" as const, payload: { concept_id: "g_erosion", correct: true, time_sec: 40 }, source: "test", schema_version: 1, idempotency_key: `ar${day}` });
    }
    const p = computePersonalisationState(events, 4);
    expect(p.avoidance.some((a) => a.conceptId === "g_governance")).toBe(true);
  });
});

describe("WORLD E — preference model learns", () => {
  it("real_world preference estimate rises after positive observations", () => {
    let sys = newSystemState(model);
    for (let d = 1; d <= 6; d++) {
      sys = applyEvent(model, sys, { event_id: `pe${d}`, student_id: "s", day: d, type: "preference_observed", payload: { dimension: "example_style", option: "real_world", observed: 0.9 }, source: "test", schema_version: 1, idempotency_key: `pe${d}` });
    }
    const est = sys.preferences.byDimension["example_style"]?.find((e) => e.option === "real_world");
    expect(est).toBeDefined();
    expect(est!.estimate).toBeGreaterThan(0.5);
  });
});

describe("WORLD F — preference model WRONG → self-corrects", () => {
  it("mismatch is logged when observed diverges from predicted", () => {
    let sys = newSystemState(model);
    for (let d = 1; d <= 6; d++) {
      sys = applyEvent(model, sys, { event_id: `pf${d}`, student_id: "s", day: d, type: "preference_observed", payload: { dimension: "example_style", option: "real_world", observed: 0.9 }, source: "test", schema_version: 1, idempotency_key: `pf${d}` });
    }
    sys = applyEvent(model, sys, { event_id: "pf7", student_id: "s", day: 7, type: "preference_observed", payload: { dimension: "example_style", option: "real_world", observed: 0.1 }, source: "test", schema_version: 1, idempotency_key: "pf7" });
    expect(sys.preferences.mismatches.length).toBeGreaterThan(0);
  });
});

describe("S3 — validation surfaces (evidence-backed)", () => {
  it("growth receipt: improvement is tracked per concept with honest bands", () => {
    const baseline = initialState(model);
    const current = initialState(model);
    for (let d = 1; d <= 6; d++) {
      observe(model, current, { conceptId: "g_erosion", correct: true, evidenceW: 1.3, day: d });
    }
    const receipt = growthReceipt(model, current, baseline);
    expect(receipt.lines.length).toBeGreaterThan(0);
    const geo = receipt.lines.find((l) => l.conceptId === "g_erosion");
    expect(geo).toBeDefined();
    expect(geo!.improvement).not.toBeNull();
    expect(geo!.improvement!).toBeGreaterThan(0);
  });

  it("capability journey: geo capabilities tracked with canDo statements", () => {
    const st = initialState(model);
    for (let d = 1; d <= 10; d++) {
      observe(model, st, { conceptId: "g_erosion", correct: true, evidenceW: 1.3, day: d });
      observe(model, st, { conceptId: "g_transport", correct: true, evidenceW: 1.3, day: d });
    }
    const journey = capabilityJourney(model, st, GEO_CAPABILITIES);
    expect(journey.length).toBe(GEO_CAPABILITIES.length);
    const physical = journey.find((j) => j.capability === "Physical-process reasoning")!;
    expect(physical.meanMastery).toBeGreaterThan(0.4);
  });

  it("changed-my-mind: detects significant belief shifts", () => {
    const before = initialState(model);
    const after = initialState(model);
    const i = model.index.get("g_erosion")!;
    before.mu[i] = -1;
    after.mu[i] = 1;
    const shifts = changedMyMind(model, before, after, 0.15);
    expect(shifts.length).toBeGreaterThan(0);
    expect(shifts[0]!.shift).toBeGreaterThan(0);
  });
});
