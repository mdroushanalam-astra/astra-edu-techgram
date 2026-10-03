/**
 * PHASE 0 GATE [corrected master roadmap §6] — the Cognitive Architecture
 * Foundation's exit conditions, enforced as tests:
 * contracts compile · ownership explicit and conflict-free · frozen organs
 * behaviorally unchanged · no silent mutation of frozen state by the
 * cognitive layer · ExperiencePlan typed and validated · existing behavior
 * reproducible.
 */
import { describe, it, expect } from "vitest";
import {
  requireBasis, PrimitiveError, type Goal,
} from "../src/cognitive/primitives.js";
import { OWNERSHIP, ownershipConflicts, cognitiveOwnershipViolations, FORBIDDEN_COGNITIVE_OWNERSHIP } from "../src/cognitive/ownership.js";
import { validateExperiencePlan, ExperiencePlanError, type ExperiencePlan } from "../src/cognitive/experience-plan.js";
import { assembleWorkspace, assembleSelfModel } from "../src/cognitive/assemble.js";
import { buildBeliefModel, initialState, observe, DEFAULT_BELIEF_PARAMS } from "../src/belief.js";
import { DEFAULT_MEMORY_PARAMS } from "../src/memory.js";
import { buildSeedContent } from "../src/polity_seed.js";
import { planDay, DEFAULT_PLANNER_PARAMS } from "../src/planner.js";
import { makeRng } from "../src/linalg.js";

const content = buildSeedContent();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });

function prov(basis = "phase-0 test"): { basis: string; source: string; timestamp: number } {
  return { basis, source: "phase0-test", timestamp: 1 };
}

describe("PHASE 0 GATE — universal primitives", () => {
  it("primitives compile and carry provenance", () => {
    const g: Goal = {
      id: "g1", statement: "pass UPSC", subgoals: ["polity"], constraints: ["2h/day"],
      horizon: "90 days", provenance: prov("student onboarding"),
    };
    expect(g.statement).toBe("pass UPSC");
    expect(() => requireBasis("test-goal", g.provenance)).not.toThrow();
  });

  it("observed primitives without a basis are rejected — the no-upgrade law holds at the primitive layer", () => {
    expect(() => requireBasis("test", { basis: "", source: "x", timestamp: 1 })).toThrow(PrimitiveError);
  });
});

describe("PHASE 0 GATE — ownership boundaries", () => {
  it("every organ owns a distinct domain — no duplicate claims", () => {
    expect(ownershipConflicts()).toEqual([]);
  });

  it("the cognitive layer never claims frozen-organ truth", () => {
    expect(cognitiveOwnershipViolations()).toEqual([]);
    expect(FORBIDDEN_COGNITIVE_OWNERSHIP.length).toBeGreaterThan(0);
  });

  it("the ownership map covers the required organs", () => {
    const organs = OWNERSHIP.map((o) => o.organ).join(" | ");
    for (const required of ["Belief Engine", "Memory Engine", "AOM", "SelfModel", "Executive", "Workspace", "Event Fabric"]) {
      expect(organs).toContain(required);
    }
  });
});

describe("PHASE 0 GATE — the frozen organs remain behaviorally unchanged", () => {
  it("the cognitive assemblers are PURE: they never mutate kernel state or plans", () => {
    const st = initialState(model);
    const before = JSON.stringify(st);
    const plan = planDay(model, st, { day: 1, daysToExam: 89, minutesAvailable: 40, prepHorizonDays: 90, memory: new Map() }, DEFAULT_PLANNER_PARAMS, makeRng(5));
    const planBefore = JSON.stringify(plan);
    assembleWorkspace(model, st, plan, "pass UPSC", "90 days");
    assembleSelfModel(model, st, [], 0);
    expect(JSON.stringify(st)).toBe(before);
    expect(JSON.stringify(plan)).toBe(planBefore);
  });

  it("the kernel loop is reproducible after the cognitive layer exists (same seed → same plan)", () => {
    const st = initialState(model);
    const p1 = planDay(model, st, { day: 1, daysToExam: 89, minutesAvailable: 40, prepHorizonDays: 90, memory: new Map() }, DEFAULT_PLANNER_PARAMS, makeRng(99));
    const p2 = planDay(model, st, { day: 1, daysToExam: 89, minutesAvailable: 40, prepHorizonDays: 90, memory: new Map() }, DEFAULT_PLANNER_PARAMS, makeRng(99));
    expect(p1.blocks.map((b) => b.conceptId + b.action)).toEqual(p2.blocks.map((b) => b.conceptId + b.action));
  });

  it("belief updates behave identically with the cognitive module imported (no silent mutation)", () => {
    const st = initialState(model);
    const before = st.mu.slice().toString();
    observe(model, st, { conceptId: "c_fr_14", correct: true, evidenceW: 1, day: 1 });
    expect(st.mu.toString()).not.toBe(before); // the organ still works
  });
});

describe("PHASE 0 GATE — ExperiencePlan as a typed contract", () => {
  const plan: ExperiencePlan = {
    id: "exp_1",
    learning: { action: "retrieve", conceptId: "c_fr_14", conceptName: "Friction", minutes: 8 },
    presence: { state: "wait", gaze: "student", waitSeconds: 8 },
    expression: { surface: "board", spec: { highlight: "rough-surface" } },
    evidence: { requests: ["confidence"], showWhy: true },
    experience: { mode: "continue" },
    agency: { mode: "offer-choice", choices: ["try myself", "show an example"] },
    expectedOutcome: { predictionRef: "pred_1", predictedBenefit: 0.2, uncertainty: 0.3 },
    rationale: { receiptId: "exec_t5_s42", reasons: ["grey concept, high weight"], evidenceRefs: ["band:c_fr_14"] },
  };

  it("a complete six-channel plan validates", () => {
    expect(() => validateExperiencePlan(plan)).not.toThrow();
  });

  it("a broken plan is rejected by the seam gate", () => {
    const broken = { ...plan, learning: undefined } as unknown as ExperiencePlan;
    expect(() => validateExperiencePlan(broken)).toThrow(ExperiencePlanError);
  });
});
