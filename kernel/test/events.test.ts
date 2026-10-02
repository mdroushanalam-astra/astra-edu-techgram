import { describe, it, expect } from "vitest";
import { buildBeliefModel, DEFAULT_BELIEF_PARAMS } from "../src/belief.js";
import { DEFAULT_MEMORY_PARAMS } from "../src/memory.js";
import { buildSeedContent } from "../src/polity_seed.js";
import { applyEvent, newSystemState, replay, type StudentEvent } from "../src/events.js";

const content = buildSeedContent();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });

let counter = 0;
function ev(day: number, type: StudentEvent["type"], payload: Record<string, unknown>): StudentEvent {
  counter += 1;
  return {
    event_id: `ev${counter}`,
    student_id: "s1",
    day,
    type,
    payload,
    source: "test",
    schema_version: 1,
    idempotency_key: `k${counter}`,
  };
}

describe("event fabric — projection of state", () => {
  it("sequential application and replay of the same log produce identical state", () => {
    const log: StudentEvent[] = [
      ev(0, "onboarded", { self_rating: 4 }),
      ev(1, "item_response", { concept_id: "c_fr_14", item_id: "i_fr_1", correct: true, time_sec: 40 }),
      ev(2, "item_response", { concept_id: "c_fr_14", item_id: "i_fr_2", correct: true, time_sec: 45 }),
      ev(3, "review_completed", { concept_id: "c_fr_14", correct: true }),
    ];
    const projected = replay(model, log);

    let sequential = newSystemState(model);
    for (const e of log) sequential = applyEvent(model, sequential, e);

    expect(projected.belief.mu).toEqual(sequential.belief.mu);
    expect(projected.belief.S).toEqual(sequential.belief.S);
    expect(projected.eventCount).toBe(sequential.eventCount);
  });

  it("duplicate idempotency keys are no-ops (no double counting)", () => {
    let sys = newSystemState(model);
    const e1 = ev(1, "item_response", { concept_id: "c_fr_14", correct: true, time_sec: 40 });
    sys = applyEvent(model, sys, e1);
    const afterOnce = sys.belief.mu.slice();
    const e1dupe: StudentEvent = { ...e1, event_id: "ev-dupe" };
    sys = applyEvent(model, sys, e1dupe);
    expect(sys.belief.mu).toEqual(afterOnce);
    expect(sys.eventCount).toBe(1);
  });

  it("out-of-order events still project coherently (logical day sorting on replay)", () => {
    const ordered = [
      ev(1, "item_response", { concept_id: "c_fr_14", correct: true, time_sec: 40 }),
      ev(2, "item_response", { concept_id: "c_fr_19", correct: false, time_sec: 50 }),
    ];
    const shuffled = [ordered[1]!, ordered[0]!];
    const a = replay(model, ordered);
    const b = replay(model, shuffled);
    expect(a.belief.mu).toEqual(b.belief.mu);
  });

  it("scorecard import shifts the imported topic", () => {
    let sys = newSystemState(model);
    const before = sys.belief.mu.slice();
    sys = applyEvent(model, sys, ev(1, "scorecard_imported", { scorecards: { t_fr: 0.9 } }));
    const iFr = model.index.get("c_fr_14")!;
    const iBod = model.index.get("c_bd_eci")!;
    expect(sys.belief.mu[iFr]).toBeGreaterThan(before[iFr]!);
    expect(sys.belief.mu[iBod]).toBeCloseTo(before[iBod]!);
  });

  it("goal_set records the deadline used by the planner", () => {
    let sys = newSystemState(model);
    sys = applyEvent(model, sys, ev(0, "goal_set", { goal_id: "upsc_cse_prelims_2027", deadline_day: 200 }));
    expect(sys.goal?.deadlineDay).toBe(200);
  });
});
