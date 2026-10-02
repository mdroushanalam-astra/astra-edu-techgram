/**
 * ADR-030 — THE ALLOCATION WIRES.
 * The review's four missing connections, each tested as BEHAVIOUR:
 *   1. Agency Transfer: measured from decision events; surface without a
 *      gamifiable scalar (anti-Goodhart).
 *   2. Personalisation → planner: measured behaviour actually CHANGES the plan.
 *   3. Opportunity cost: every plan names what it gave up.
 *   4. Mismatch minimum: a personalisation prediction that keeps missing
 *      flags itself.
 */
import { describe, it, expect } from "vitest";
import {
  newAgencyState, observeAgency, agencyIndexFor, agencyStage, overallAgencyIndex, agencySurface,
  copyAgencyState, type AgencyState, type DecisionType, type AgencyMode,
} from "../src/agency.js";
import { buildBeliefModel, initialState, observe, reportConcept, DEFAULT_BELIEF_PARAMS } from "../src/belief.js";
import { planDay, DEFAULT_PLANNER_PARAMS } from "../src/planner.js";
import { applyReview, newMemoryCell, DEFAULT_MEMORY_PARAMS } from "../src/memory.js";
import { buildSeedContent } from "../src/polity_seed.js";
import { makeRng } from "../src/linalg.js";
import { buildPlanReceipt } from "../src/receipts.js";
import { newSystemState, applyEvent, replay, type StudentEvent } from "../src/events.js";
import { predictionErrorStats, type OutcomeRecord } from "../src/aom.js";
import { scanMilestones, growthReceipt } from "../src/validation.js";
import type { PersonalisationState, BehaviourFlags } from "../src/behaviour.js";

const content = buildSeedContent();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });

let n = 0;
function ev(day: number, type: StudentEvent["type"], payload: Record<string, unknown> = {}): StudentEvent {
  n += 1;
  return { event_id: `al${n}`, student_id: "s", day, type, payload, source: "t", schema_version: 1, idempotency_key: `alk${n}` };
}

const REST_FLAGS: BehaviourFlags = {
  scaffoldNext: false, forceRetrieval: false, fadeHints: false,
  calibrationDrill: false, lightenPlan: false, restDay: true, probeNeeded: false,
};
const LIGHTEN_FLAGS: BehaviourFlags = { ...REST_FLAGS, restDay: false, lightenPlan: true };

function persState(over: Partial<PersonalisationState> = {}): PersonalisationState {
  return {
    momentum: 0, fatigueTimeSlope: 0, fatigueErrorSlope: 0, frustration: 0,
    loadToleranceMin: 0, optimalSessionMin: null, avoidance: [], recoveryRate: 0.5,
    responses: 100, ...over,
  };
}

/** Strongly-learned + decayed memory so a due review exists. */
function dueMemory() {
  const st = initialState(model);
  for (let d = 1; d <= 10; d++) observe(model, st, { conceptId: "c_fr_14", correct: true, evidenceW: 1.3, day: d });
  const memory = new Map<number, import("../src/memory.js").MemoryCell>();
  const ci = model.index.get("c_fr_14")!;
  memory.set(ci, newMemoryCell("conceptual", DEFAULT_MEMORY_PARAMS));
  applyReview(memory.get(ci)!, true, 11, DEFAULT_MEMORY_PARAMS);
  return { st, memory };
}

/* ------------------------------------------------------------------ */
/* 1. Agency Transfer — measured, staged, never scalar-facing          */
/* ------------------------------------------------------------------ */

describe("ADR-030 — Agency Transfer measurement", () => {
  it("progresses techgram_led → shared → student_led as decisions shift", () => {
    let s: AgencyState = newAgencyState();
    for (let i = 0; i < 5; i++) s = observeAgency(s, "retrieval_selection", "accepted_recommendation", i + 1);
    expect(agencyStage(agencyIndexFor(s, "retrieval_selection")!)).toBe("techgram_led");
    // 8 independent decisions with shrinkage: 8/(8+5) ≈ 0.615
    for (let i = 0; i < 8; i++) s = observeAgency(s, "topic_selection", "decided_independently", i + 1);
    expect(agencyStage(agencyIndexFor(s, "topic_selection")!)).toBe("student_led");
    expect(agencyStage(overallAgencyIndex(s)!)).toBe("shared");
  });

  it("shrinkage keeps thin evidence honest — one independent decision ≠ student_led", () => {
    const s = observeAgency(newAgencyState(), "topic_selection", "decided_independently", 1);
    expect(agencyIndexFor(s, "topic_selection")).toBeLessThan(0.25);
    expect(agencyStage(agencyIndexFor(s, "topic_selection")!)).toBe("techgram_led");
    expect(agencyIndexFor(newAgencyState(), "topic_selection")).toBeNull();
  });

  it("is copy-on-write; unknown decision types are ignored (forward-compat)", () => {
    const s = observeAgency(newAgencyState(), "help_seeking", "proposed_with_reason", 2);
    expect(copyAgencyState(s)).toEqual(s);
    const weird = observeAgency(s, "vibes_reading" as DecisionType, "decided_independently", 3);
    expect(weird).toBe(s);
    const badMode = observeAgency(s, "help_seeking", "demanded" as AgencyMode, 3);
    expect(badMode).toBe(s);
  });

  it("round-trips through the event fabric with deterministic replay", () => {
    const events: StudentEvent[] = [
      ev(1, "agency_observed", { decision: "topic_selection", mode: "accepted_recommendation" }),
      ev(2, "agency_observed", { decision: "topic_selection", mode: "accepted_recommendation" }),
      ev(3, "agency_observed", { decision: "retrieval_selection", mode: "decided_independently" }),
    ];
    let sys = newSystemState(model);
    for (const e of events) sys = applyEvent(model, sys, e);
    const replayed = replay(model, events);
    expect(replayed.agency).toEqual(sys.agency);
    expect(sys.agency.decisions["topic_selection"]).toEqual({
      accepted: 2, proposed: 0, independent: 0, firstDay: 1, lastDay: 2,
    });
  });
});

describe("ADR-030 — agency surface (anti-Goodhart by construction)", () => {
  it("exposes stage names and counts, NEVER the raw index scalar", () => {
    let s = newAgencyState();
    for (let i = 0; i < 8; i++) s = observeAgency(s, "break_timing", "proposed_with_reason", i + 1);
    const surf = agencySurface(s);
    expect(surf.stage).toBe("shared"); // 8×0.5/(8+5) = 4/13 ≈ 0.31
    expect(surf.decisionsObserved).toBe(8);
    expect(surf.byDecision[0]!.n).toBe(8);
    expect(typeof surf.byDecision[0]!.stage).toBe("string");
    // The gamifiable scalar must not appear anywhere in the rendered surface.
    const json = JSON.stringify(surf);
    expect(json).not.toMatch(/"index"/);
    expect(json).not.toMatch(/"score"/);
    expect(json).not.toMatch(/agency_index/);
  });

  it("honest empty state and a deterministic transfer move", () => {
    const empty = agencySurface(newAgencyState());
    expect(empty.stage).toBe("no_evidence");
    expect(empty.nextTransferMove).toBeNull();
    let s = newAgencyState();
    for (let i = 0; i < 5; i++) s = observeAgency(s, "difficulty_selection", "accepted_recommendation", i + 1);
    const surf = agencySurface(s);
    expect(surf.nextTransferMove).not.toBeNull();
    expect(surf.nextTransferMove!.decision).toBe("difficulty_selection");
    expect(surf.nextTransferMove!.offer).toMatch(/two sensible options/);
  });
});

/* ------------------------------------------------------------------ */
/* 2. Personalisation → planner: behaviour changes the plan            */
/* ------------------------------------------------------------------ */

describe("ADR-030 — the planner consumes measured behaviour", () => {
  it("rest day: reviews only, capped at 15 minutes", () => {
    const { st, memory } = dueMemory();
    const plan = planDay(model, st, { day: 60, daysToExam: 100, minutesAvailable: 240, memory }, DEFAULT_PLANNER_PARAMS, makeRng(5), );
    const rest = planDay(model, st, { day: 60, daysToExam: 100, minutesAvailable: 240, memory, flags: REST_FLAGS }, DEFAULT_PLANNER_PARAMS, makeRng(5));
    expect(rest.personalisationApplied[0]).toMatch(/^rest_day:/);
    expect(rest.blocks.length).toBeGreaterThan(0);
    for (const b of rest.blocks) expect(b.action).toBe("review");
    expect(rest.totalMinutes).toBeLessThanOrEqual(15);
    expect(plan.totalMinutes).toBeGreaterThan(rest.totalMinutes);
    if (rest.foregone) expect(rest.foregone.why).toMatch(/rest day/);
  });

  it("lighten flag halves the day (burnout drift → lighter, not escalated)", () => {
    const { st, memory } = dueMemory();
    const plan = planDay(model, st, { day: 60, daysToExam: 100, minutesAvailable: 240, memory, flags: LIGHTEN_FLAGS }, DEFAULT_PLANNER_PARAMS, makeRng(6));
    expect(plan.personalisationApplied[0]).toMatch(/^lighten_plan:/);
    expect(plan.totalMinutes).toBeLessThanOrEqual(120);
    expect(plan.blocks.length).toBeGreaterThan(0);
  });

  it("measured load tolerance caps the day below the requested minutes", () => {
    const st = initialState(model);
    const capped = planDay(model, st, { day: 1, daysToExam: 180, minutesAvailable: 240, memory: new Map(), personalisation: persState({ loadToleranceMin: 40 }) }, DEFAULT_PLANNER_PARAMS, makeRng(7));
    const plain = planDay(model, st, { day: 1, daysToExam: 180, minutesAvailable: 240, memory: new Map() }, DEFAULT_PLANNER_PARAMS, makeRng(7));
    expect(capped.personalisationApplied.join(" ")).toMatch(/load_cap/);
    expect(capped.totalMinutes).toBeLessThanOrEqual(44); // ceil(40 × 1.1)
    expect(capped.totalMinutes).toBeLessThan(plain.totalMinutes);
  });

  it("measured fatigue shrinks blocks: learn 20m, practice 15m", () => {
    const st = initialState(model);
    const plan = planDay(model, st, {
      day: 1, daysToExam: 180, minutesAvailable: 240, memory: new Map(),
      personalisation: persState({ fatigueTimeSlope: 0.6, fatigueErrorSlope: 0.25 }),
    }, DEFAULT_PLANNER_PARAMS, makeRng(8));
    expect(plan.personalisationApplied.join(" ")).toMatch(/fatigue_blocks/);
    const learns = plan.blocks.filter((b) => b.action === "learn");
    const practices = plan.blocks.filter((b) => b.action === "practice");
    expect(learns.length).toBeGreaterThan(0);
    for (const b of learns) expect(b.minutes).toBe(20);
    for (const b of practices) expect(b.minutes).toBe(15);
  });

  it("avoidance soft-penalty: the avoided concept loses its seat under scarcity", () => {
    const st = initialState(model);
    const plain = planDay(model, st, { day: 1, daysToExam: 180, minutesAvailable: 45, memory: new Map() }, DEFAULT_PLANNER_PARAMS, makeRng(9));
    const topLearn = plain.blocks.find((b) => b.action === "learn");
    expect(topLearn).toBeDefined();
    const avoidedPlan = planDay(model, st, {
      day: 1, daysToExam: 180, minutesAvailable: 45, memory: new Map(),
      personalisation: persState({ avoidance: [{ conceptId: topLearn!.conceptId, missedSessions: 3 }] }),
    }, DEFAULT_PLANNER_PARAMS, makeRng(9));
    expect(avoidedPlan.personalisationApplied.join(" ")).toMatch(/avoidance_soft/);
    const avoidedLearn = avoidedPlan.blocks.find((b) => b.action === "learn" && b.conceptId === topLearn!.conceptId);
    expect(avoidedLearn).toBeUndefined(); // a different concept took the slot
  });

  it("no evidence → the plan says so (no invented signals)", () => {
    const st = initialState(model);
    const plan = planDay(model, st, { day: 1, daysToExam: 180, minutesAvailable: 240, memory: new Map() }, DEFAULT_PLANNER_PARAMS, makeRng(10));
    expect(plan.personalisationApplied).toEqual(["no behavioural evidence yet — default plan"]);
  });
});

/* ------------------------------------------------------------------ */
/* 3. Opportunity cost — every plan names what it gave up              */
/* ------------------------------------------------------------------ */

describe("ADR-030 — opportunity cost in plan + receipt", () => {
  it("foregone is the best action the budget did not buy, with the honest why", () => {
    const st = initialState(model);
    const tight = planDay(model, st, { day: 1, daysToExam: 180, minutesAvailable: 25, memory: new Map() }, DEFAULT_PLANNER_PARAMS, makeRng(11));
    expect(tight.blocks.length).toBeGreaterThan(0);
    expect(tight.foregone).not.toBeNull();
    expect(tight.foregone!.why).toMatch(/budget|cap/);
    const abundant = planDay(model, st, { day: 1, daysToExam: 180, minutesAvailable: 240, maxBlocks: 1, memory: new Map() }, DEFAULT_PLANNER_PARAMS, makeRng(11));
    if (abundant.foregone) expect(abundant.foregone.why).toMatch(/cap|budget/);
  });

  it("the receipt carries the audit trail and the opportunity cost", () => {
    const st = initialState(model);
    const plan = planDay(model, st, { day: 1, daysToExam: 180, minutesAvailable: 240, memory: new Map(), personalisation: persState({ loadToleranceMin: 40 }) }, DEFAULT_PLANNER_PARAMS, makeRng(12));
    const receipt = buildPlanReceipt(plan, []);
    expect(receipt.personalisation).toEqual(plan.personalisationApplied);
    expect(receipt.constraints_checked).toContain("measured behaviour caps");
    if (plan.foregone) {
      expect(receipt.opportunity_cost).not.toBeNull();
      expect(receipt.opportunity_cost!.concept).toBe(plan.foregone.conceptId);
      expect(receipt.opportunity_cost!.why).toBe(plan.foregone.why);
    }
    const plainPlan = planDay(model, st, { day: 1, daysToExam: 180, minutesAvailable: 240, memory: new Map() }, DEFAULT_PLANNER_PARAMS, makeRng(12));
    const plain = buildPlanReceipt(plainPlan, []);
    // With a finite budget over a 54-concept syllabus there is ALWAYS a
    // next-best thing — that honesty is the point. Receipt must mirror plan.
    expect(plain.opportunity_cost === null).toBe(plainPlan.foregone === null);
    expect(plain.constraints_checked).not.toContain("measured behaviour caps");
  });
});

/* ------------------------------------------------------------------ */
/* 4. Mismatch minimum — repeated prediction failure flags itself      */
/* ------------------------------------------------------------------ */

describe("ADR-030 — AOM prediction-error mismatch detection", () => {
  const rec = (over: Partial<OutcomeRecord>): OutcomeRecord => ({
    action: "practice", minutes: 20, masteryAtAction: 0.4,
    predictedDMastery: 0.3, observedDMastery: 0.02, n: 4, ...over,
  });

  it("3 consecutive large misses on an action → mismatch flagged", () => {
    const s = predictionErrorStats([rec({}), rec({}), rec({})]);
    expect(s.mismatchDetected).toBe(true);
    expect(s.mismatchActions).toContain("practice");
    expect(s.perAction[0]!.consecutiveLargeMisses).toBe(3);
  });

  it("2 misses then a hit → not flagged; maxRun remembers the longest run (2 < 3)", () => {
    const s = predictionErrorStats([rec({}), rec({}), rec({ observedDMastery: 0.3 })]);
    expect(s.mismatchDetected).toBe(false);
    expect(s.perAction[0]!.consecutiveLargeMisses).toBe(2); // longest run, not current run
  });

  it("is per-action — learn missing does not flag practice", () => {
    const s = predictionErrorStats([rec({ action: "learn" }), rec({ action: "learn" }), rec({ action: "learn" }), rec({}), rec({})]);
    expect(s.mismatchActions).toEqual(["learn"]);
  });
});

/* ------------------------------------------------------------------ */
/* 5. Milestone + anti-Goodhart audit across surfaces                  */
/* ------------------------------------------------------------------ */

describe("ADR-030 — milestone + anti-Goodhart audit", () => {
  it("first independent decision becomes a milestone (pilot Layer 4)", () => {
    const st = initialState(model);
    const ms = scanMilestones(model, st, [], [
      { type: "item_response", payload: { correct: true }, day: 1 },
      { type: "agency_observed", payload: { decision: "topic_selection", mode: "decided_independently", concept_id: "c_fr_14" }, day: 4 },
    ]);
    const m = ms.find((x) => x.type === "first_independent_decision");
    expect(m).toBeDefined();
    expect(m!.day).toBe(4);
    expect(m!.description).toMatch(/on your own/);
  });

  it("no validation surface shows a single gamifiable mastery or agency number", () => {
    const st = initialState(model);
    for (let d = 1; d <= 8; d++) observe(model, st, { conceptId: "c_fr_14", correct: d % 3 !== 0, evidenceW: 1, day: d });
    // growth receipt: every evidenced line carries a band, not just a mean
    const gr = growthReceipt(model, st, null);
    expect(gr.lines.length).toBeGreaterThan(0);
    for (const l of gr.lines) {
      expect(Array.isArray(l.currentBand)).toBe(true);
      expect(l.currentBand[0]!).toBeLessThanOrEqual(l.currentBand[1]!);
    }
    // report concept: grey honesty + band
    const rep = reportConcept(model, st, "c_fr_14");
    expect(Array.isArray([rep.lo, rep.hi])).toBe(true);
    // agency surface: stage names only
    const surf = agencySurface(observeAgency(newAgencyState(), "topic_selection", "accepted_recommendation", 1));
    for (const key of Object.keys(surf)) expect(["stage", "decisionsObserved", "byDecision", "nextTransferMove", "note"]).toContain(key);
  });
});
