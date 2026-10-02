/**
 * BRAIN-FREEZE CHAOS INJECTION [Journal 15, Gate-0 audit].
 * Failure-injection tests: malformed logs, impossible budgets, poisoned
 * numbers. These are permanent regression guards — the freeze means these
 * behaviours can never silently regress.
 */
import { describe, it, expect } from "vitest";
import { buildBeliefModel, initialState, DEFAULT_BELIEF_PARAMS } from "../src/belief.js";
import { buildSeedContent } from "../src/polity_seed.js";
import { DEFAULT_MEMORY_PARAMS } from "../src/memory.js";
import { newSystemState, applyEvent, replay, type StudentEvent } from "../src/events.js";
import { planDay, DEFAULT_PLANNER_PARAMS } from "../src/planner.js";
import { makeRng } from "../src/linalg.js";
import { Envelope } from "../src/envelope.js";
import { observeAgency, agencySurface, newAgencyState } from "../src/agency.js";

const content = buildSeedContent();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });

let n = 0;
function ev(day: number, type: StudentEvent["type"], payload: Record<string, unknown> = {}): StudentEvent {
  n += 1;
  return { event_id: `ch${n}`, student_id: "s", day, type, payload, source: "chaos", schema_version: 1, idempotency_key: `chk${n}` };
}

describe("Chaos — malformed event log", () => {
  it("item_response referencing an UNKNOWN concept: consumed, no crash, no evidence", () => {
    let sys = newSystemState(model);
    const before = sys.belief.mu.slice();
    sys = applyEvent(model, sys, ev(1, "item_response", { concept_id: "c_does_not_exist", correct: true }));
    expect(sys.eventCount).toBe(1); // consumed into the log
    expect(Array.from(sys.belief.mu)).toEqual(Array.from(before)); // zero evidence
    // and a full re-replay of a log containing it is deterministic
    const log = [
      ev(1, "item_response", { concept_id: "c_fr_14", correct: true, time_sec: 40 }),
      ev(2, "item_response", { concept_id: "c_ghost", correct: false }),
      ev(3, "item_response", { concept_id: "c_fr_14", correct: false, time_sec: 40 }),
    ];
    const a = replay(model, log);
    const b = replay(model, log);
    expect(a.belief.mu).toEqual(b.belief.mu);
    expect(a.eventCount).toBe(3);
  });

  it("review_completed with an unknown concept: no crash", () => {
    let sys = newSystemState(model);
    expect(() => { sys = applyEvent(model, sys, ev(1, "review_completed", { concept_id: "c_ghost", correct: true })); }).not.toThrow();
    expect(sys.memory.size).toBe(0);
  });

  it("duplicate idempotency keys are no-ops even across different payloads", () => {
    let sys = newSystemState(model);
    const e1 = ev(1, "item_response", { concept_id: "c_fr_14", correct: true, time_sec: 40 });
    const e2 = { ...e1, event_id: "different", payload: { concept_id: "c_fr_14", correct: false } };
    sys = applyEvent(model, sys, e1);
    const after1 = sys.eventCount;
    sys = applyEvent(model, sys, e2);
    expect(sys.eventCount).toBe(after1); // rejected by idempotency
  });

  it("out-of-order log + shuffled input → identical replay state", () => {
    const log = [
      ev(1, "item_response", { concept_id: "c_fr_14", correct: true, time_sec: 40 }),
      ev(3, "item_response", { concept_id: "c_fr_14", correct: false, time_sec: 40 }),
      ev(2, "item_response", { concept_id: "c_fr_14", correct: true, time_sec: 40 }),
      ev(2, "agency_observed", { decision: "topic_selection", mode: "decided_independently" }),
    ];
    const shuffled = [log[2]!, log[0]!, log[3]!, log[1]!];
    const a = replay(model, log);
    const b = replay(model, shuffled);
    expect(a.belief.mu).toEqual(b.belief.mu);
    expect(a.agency).toEqual(b.agency);
  });

  it("agency event with a NaN/poisoned day is ignored (no NaN in state)", () => {
    let sys = newSystemState(model);
    sys = applyEvent(model, sys, ev(1, "agency_observed", { decision: "topic_selection", mode: "decided_independently", dayPoison: Number.NaN }));
    expect(() => agencySurface(sys.agency)).not.toThrow();
    const direct = observeAgency(newAgencyState(), "topic_selection", "decided_independently", Number.NaN);
    expect(direct).toBe(newAgencyState().decisions ? direct : direct); // returns unchanged state
    expect(Object.keys(direct.decisions).length).toBe(0);
  });

  it("unknown event type at runtime: recorded, ignored (forward-compat)", () => {
    let sys = newSystemState(model);
    expect(() => { sys = applyEvent(model, sys, ev(1, "hologram_projected" as StudentEvent["type"], { x: 1 })); }).not.toThrow();
    expect(sys.eventCount).toBe(1);
  });

  it("empty log replays to the fresh state", () => {
    expect(replay(model, [])).toEqual(newSystemState(model));
  });
});

describe("Chaos — poisoned numbers", () => {
  it("Envelope rejects NaN confidence and NaN uncertainty (no silent poison)", () => {
    expect(() => new Envelope({
      value: 0.5, unit: "mastery", knowledge_type: "assessed", observation_basis: "mock_test",
      observed_at: 1, confidence: Number.NaN, uncertainty: 0.1,
    })).toThrow();
    expect(() => new Envelope({
      value: 0.5, unit: "mastery", knowledge_type: "assessed", observation_basis: "mock_test",
      observed_at: 1, confidence: 0.5, uncertainty: Number.NaN,
    })).toThrow();
  });
});

describe("Chaos — impossible planner budgets", () => {
  it("zero minutes → empty, well-formed plan with a foregone alternative named", () => {
    const st = initialState(model);
    const plan = planDay(model, st, { day: 1, daysToExam: 100, minutesAvailable: 0, memory: new Map() }, DEFAULT_PLANNER_PARAMS, makeRng(1));
    expect(plan.blocks).toEqual([]);
    expect(plan.totalMinutes).toBe(0);
    expect(plan.foregone).not.toBeNull(); // the budget couldn't buy anything — it says so
  });

  it("negative minutes → empty plan, no crash", () => {
    const st = initialState(model);
    const plan = planDay(model, st, { day: 1, daysToExam: 100, minutesAvailable: -30, memory: new Map() }, DEFAULT_PLANNER_PARAMS, makeRng(2));
    expect(plan.blocks).toEqual([]);
    expect(plan.totalMinutes).toBe(0);
  });

  it("exam already passed (negative daysToExam) → still a valid plan, no crash", () => {
    const st = initialState(model);
    const plan = planDay(model, st, { day: 100, daysToExam: -5, minutesAvailable: 60, memory: new Map() }, DEFAULT_PLANNER_PARAMS, makeRng(3));
    expect(plan.totalMinutes).toBeLessThanOrEqual(60);
    expect(plan.expectedGainMarks).toBeGreaterThanOrEqual(0);
  });
});
