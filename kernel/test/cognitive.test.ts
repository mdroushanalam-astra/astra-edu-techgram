import { describe, it, expect } from "vitest";
import { cog, type CognitiveWorkspace, calibrate, counterfactual } from "../src/cognitive/contracts.js";
import { assembleWorkspace, assembleSelfModel, predictionFromOutcome, causalFromPrereqs } from "../src/cognitive/assemble.js";
import { buildBeliefModel, initialState, DEFAULT_BELIEF_PARAMS } from "../src/belief.js";
import { DEFAULT_MEMORY_PARAMS } from "../src/memory.js";
import { buildSeedContent } from "../src/polity_seed.js";

const content = buildSeedContent();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });

describe("COGNITIVE CORE v0.2 — universal contracts [ADR-034]", () => {
  it("cog(): provenance is structural — observed claims demand a basis, confidence is bounded", () => {
    const g = cog("goal", "g1", "observed", "student onboarding", 0.9, "education", { statement: "pass UPSC" });
    expect(g.kind).toBe("goal");
    expect(() => cog("belief", "b1", "observed", "", 0.9, "education")).toThrow(/observed claims require a basis/);
    expect(() => cog("belief", "b2", "inferred", "x", 1.4, "education")).toThrow(/out of range/);
  });

  it("the workspace assembles what matters NOW — and names what it does NOT contain", () => {
    const plan = {
      blocks: [{ action: "learn", conceptId: "c_fr_14", conceptName: "Fr", minutes: 25, gainPerMinute: 0.3, reason: "grey, high weight" }],
      foregone: { action: "diagnose", conceptId: "c_fr_21", conceptName: "Dep", why: "budget" },
      totalMinutes: 25,
    };
    const w: CognitiveWorkspace = assembleWorkspace(model, initialState(model), plan, "pass UPSC", "90 days");
    expect(w.goal!.statement).toBe("pass UPSC");
    expect(w.candidateActions[0]!.action).toBe("learn");
    expect(w.plan.foregone).toContain("Dep");
    expect(w.notContained.length).toBeGreaterThan(0); // humility as data
  });

  it("predictions calibrate — the never-self-fooling loop as a contract", () => {
    const p = predictionFromOutcome("p1", "action-outcome", "practice lifts mastery", 0.22, 0.08, "AOM assumed", "aom-0.1.0");
    const c = calibrate(p, 0.05);
    expect(c.predictionError).toBeCloseTo(-0.17);
    expect(c.calibratedAt).toBeDefined();
  });

  it("causal v0: counterfactuals speak honestly when no model exists", () => {
    const edges = causalFromPrereqs("c_delta", [{ id: "c_transport", name: "Transport" }], "prerequisite chain");
    expect(counterfactual(edges, "c_transport", true)).toMatch(/without c_transport/);
    expect(counterfactual([], "c_ghost", true)).toMatch(/no causal model/);
  });

  it("the self-model assembles humility from state — knows, known-unknowns, limitations", () => {
    const sm = assembleSelfModel(model, initialState(model), [], 2);
    expect(sm.knownUnknowns.length).toBeGreaterThan(0);
    expect(sm.modelLimitations.some((l) => l.includes("misconception"))).toBe(true);
  });
});
