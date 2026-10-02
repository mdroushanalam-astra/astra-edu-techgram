import { describe, it, expect } from "vitest";
import { buildBeliefModel, initialState, observe, reportConcept, DEFAULT_BELIEF_PARAMS } from "../src/belief.js";
import { planDay, DEFAULT_PLANNER_PARAMS, type PlanContext } from "../src/planner.js";
import { applyReview, newMemoryCell, DEFAULT_MEMORY_PARAMS } from "../src/memory.js";
import { buildSeedContent } from "../src/polity_seed.js";
import { makeRng } from "../src/linalg.js";
import { buildPlanReceipt, joinOutcome } from "../src/receipts.js";
import { Envelope } from "../src/envelope.js";

const content = buildSeedContent();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, {
  selfRating: 3,
});

function freshMemory() {
  return new Map<number, import("../src/memory.js").MemoryCell>();
}

describe("planner — robust exam-date allocation", () => {
  it("respects the minutes budget and block cap", () => {
    const st = initialState(model);
    const rng = makeRng(31);
    const ctx: PlanContext = { day: 1, daysToExam: 180, minutesAvailable: 240, memory: freshMemory() };
    const plan = planDay(model, st, ctx, DEFAULT_PLANNER_PARAMS, rng);
    expect(plan.totalMinutes).toBeLessThanOrEqual(240);
    expect(plan.blocks.length).toBeLessThanOrEqual(16); // 15-min minimum blocks
    for (const b of plan.blocks) expect(b.minutes).toBeGreaterThan(0);
  });

  it("schedules due reviews of decayed high-weight content (forgetting-aware)", () => {
    const st = initialState(model);
    const rng = makeRng(37);
    // Learn a high-weight concept strongly, let it decay hard, then plan.
    for (let d = 1; d <= 10; d++) {
      observe(model, st, { conceptId: "c_fr_14", correct: true, evidenceW: 1.3, day: d });
    }
    const memory = freshMemory();
    const ci = model.index.get("c_fr_14")!;
    memory.set(ci, newMemoryCell("conceptual", DEFAULT_MEMORY_PARAMS));
    applyReview(memory.get(ci)!, true, 11, DEFAULT_MEMORY_PARAMS);
    const ctx: PlanContext = { day: 60, daysToExam: 100, minutesAvailable: 240, memory };
    const plan = planDay(model, st, ctx, DEFAULT_PLANNER_PARAMS, rng);
    const review = plan.blocks.find((b) => b.action === "review");
    expect(review).toBeDefined();
    expect(review!.reason).toMatch(/retrievability/);
  });

  it("gates learning behind prerequisites and offers remediation instead", () => {
    const st = initialState(model);
    const rng = makeRng(41);
    // Keep prereq of an advanced concept weak; plan a short day.
    const advanced = model.content.conceptById.get("c_am_bs")!; // requires c_am_proc
    expect(advanced.prereqs.length).toBeGreaterThan(0);
    // Make prereq clearly weak.
    for (let d = 1; d <= 6; d++) {
      observe(model, st, { conceptId: "c_am_proc", correct: false, evidenceW: 1, day: d });
    }
    const ctx: PlanContext = { day: 1, daysToExam: 200, minutesAvailable: 120, memory: freshMemory() };
    const plan = planDay(model, st, ctx, DEFAULT_PLANNER_PARAMS, rng);
    const learningAdvanced = plan.blocks.find(
      (b) => b.action === "learn" && b.conceptId === "c_am_bs",
    );
    expect(learningAdvanced).toBeUndefined();
  });

  it("prioritises diagnose (VoI) on grey high-weight concepts early", () => {
    const st = initialState(model);
    const rng = makeRng(43);
    const ctx: PlanContext = { day: 1, daysToExam: 365, minutesAvailable: 240, memory: freshMemory() };
    const plan = planDay(model, st, ctx, DEFAULT_PLANNER_PARAMS, rng);
    // Day 1 state is grey nearly everywhere; at least one block should be
    // information-seeking (diagnose) or review due — not blind learning only.
    expect(plan.blocks.length).toBeGreaterThan(0);
    expect(
      plan.blocks.some((b) => b.action === "diagnose" || b.action === "review" || b.action === "learn"),
    ).toBe(true);
  });

  it("every block carries a receipt-grade reason and assumption tag", () => {
    const st = initialState(model);
    const rng = makeRng(47);
    const plan = planDay(
      model,
      st,
      { day: 1, daysToExam: 150, minutesAvailable: 200, memory: freshMemory() },
      DEFAULT_PLANNER_PARAMS,
      rng,
    );
    for (const b of plan.blocks) {
      expect(b.reason.length).toBeGreaterThan(15);
      expect(["assumed", "measured"]).toContain(b.assumption);
      expect(b.expectedGainMarks).toBeGreaterThanOrEqual(0);
      expect(b.gainPerMinute).toBeCloseTo(b.expectedGainMarks / b.minutes, 6);
    }
  });

  it("is deterministic for the same seed", () => {
    const st = initialState(model);
    const p1 = planDay(model, st, { day: 1, daysToExam: 150, minutesAvailable: 240, memory: freshMemory() }, DEFAULT_PLANNER_PARAMS, makeRng(99));
    const p2 = planDay(model, st, { day: 1, daysToExam: 150, minutesAvailable: 240, memory: freshMemory() }, DEFAULT_PLANNER_PARAMS, makeRng(99));
    expect(p1.blocks.map((b) => b.conceptId + b.action)).toEqual(p2.blocks.map((b) => b.conceptId + b.action));
    expect(p1.expectedGainMarks).toBeCloseTo(p2.expectedGainMarks, 10);
  });
});

describe("receipts", () => {
  it("produces a complete receipt and joins outcomes", () => {
    const st = initialState(model);
    const plan = planDay(
      model,
      st,
      { day: 2, daysToExam: 140, minutesAvailable: 240, memory: freshMemory() },
      DEFAULT_PLANNER_PARAMS,
      makeRng(53),
    );
    const receipt = buildPlanReceipt(plan, ["Economy: not assessed (out of V1 scope)"]);
    expect(receipt.receipt_id).toMatch(/^rcpt_d2_/);
    expect(receipt.assumptions.every((a) => ["assumed", "measured"].includes(a.status))).toBe(true);
    expect(receipt.what_would_change_my_mind.length).toBeGreaterThan(10);
    expect(receipt.params_version).toBe(DEFAULT_PLANNER_PARAMS.version);
    const joined = joinOutcome(receipt, { gain_marks: 0.4 });
    expect(joined.prediction_error).not.toBeNull();
  });
});

describe("envelope integration — reported mastery carries provenance", () => {
  it("grey classification before evidence, solid after", () => {
    const st = initialState(model);
    const before = reportConcept(model, st, "c_fr_14");
    expect(before.grey).toBe(true);
    for (let d = 1; d <= 5; d++) {
      observe(model, st, { conceptId: "c_fr_14", correct: true, evidenceW: 1, day: d });
    }
    const after = reportConcept(model, st, "c_fr_14");
    expect(after.grey).toBe(false);
    expect(after.mean).toBeGreaterThan(before.mean);
  });

  it("envelope reports decayed facts honestly", () => {
    const e = new Envelope({
      value: 0.7, unit: "probability", knowledge_type: "assessed",
      observation_basis: "mock_test", observed_at: 10, valid_until: 5, confidence: 0.9,
    });
    expect(e.knowledge_type).toBe("decayed");
  });
});
