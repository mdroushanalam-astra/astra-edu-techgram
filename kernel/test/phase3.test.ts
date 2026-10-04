import { describe, it, expect } from "vitest";
import { conduct, initialState, advance } from "../src/cognitive/conductor.js";
import { planFromDirective, validateExperiencePlan, type ExperiencePlan } from "../src/cognitive/experience-plan.js";

describe("PHASE 3 — EXECUTION BODY [corrected master roadmap §9]", () => {
  const directive = {
    learningAction: "retrieve", communication: "concise", presentation: "board",
    augmentation: "no_llm", conceptId: "c_fr_14", conceptName: "Friction",
    reasons: ["grey concept, high weight"], evidenceRefs: ["band:c_fr_14"],
    predictedBenefit: 0.4, uncertainty: 0.3, receiptId: "exec_t5_s42", fatigue: 0.5,
  };

  it("the Executive's decision produces a valid ExperiencePlan (the seam works)", () => {
    const plan = planFromDirective(directive);
    expect(() => validateExperiencePlan(plan)).not.toThrow();
    expect(plan.learning.action).toBe("retrieve");
    expect(plan.learning.conceptName).toBe("Friction");
    expect(plan.presence.state).toBe("speaking");
    expect(plan.expression.surface).toBe("board");
    expect(plan.experience.mode).toBe("continue");
    expect(plan.expectedOutcome.predictionRef).toBe("exec_t5_s42");
    expect(plan.rationale.reasons).toContain("grey concept, high weight");
  });

  it("the Conductor executes the plan into ordered steps", () => {
    const plan = planFromDirective(directive);
    const steps = conduct(plan);
    expect(steps.length).toBeGreaterThan(3);
    expect(steps[0].channel).toBe("learning");
    expect(steps.some((s) => s.channel === "presence")).toBe(true);
    expect(steps.some((s) => s.channel === "evidence")).toBe(true);
  });

  it("a break directive produces a rest plan with silence", () => {
    const breakPlan = planFromDirective({ ...directive, learningAction: "break", communication: "silence" });
    expect(breakPlan.learning.action).toBe("rest");
    expect(breakPlan.presence.state).toBe("silent");
    expect(breakPlan.experience.mode).toBe("break");
  });

  it("the conductor advances through steps", () => {
    const plan = planFromDirective(directive);
    const steps = conduct(plan);
    let state = initialState();
    for (const _ of steps) state = advance(state, steps.length, false);
    expect(state.executedSteps).toBe(steps.length);
    expect(state.completed).toBe(false); // completed is set externally
  });
});
