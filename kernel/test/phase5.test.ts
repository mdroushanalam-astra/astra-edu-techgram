import { describe, it, expect } from "vitest";
import {
  runScenario, runAllScenarios, summarize, SCENARIOS,
} from "../src/lab/phase5.js";
import { TechgramWorldAdapter, ARCHETYPES, worldFromContent } from "../src/adapter/world-adapter.js";
import { polityWorld, cbseWorld, minimalContent, syntheticChainWorld } from "../src/adapter/worlds.js";
import { buildBeliefModel, initialState, observe, reportConcept, DEFAULT_BELIEF_PARAMS } from "../src/belief.js";
import { DEFAULT_MEMORY_PARAMS } from "../src/memory.js";
import type { CogObject } from "../src/cognitive/contracts.js";

/**
 * PHASE 5 — THE TECHGRAM WORLD ADAPTER + THE THIRTY-SCENARIO RIG [ADR-043].
 * The UCS boundary: cognitive/ = universal; the adapter = world.
 * The engine must not know that "geomorphology" or "UPSC" exists.
 */

describe("THE ADAPTER — the UCS boundary", () => {
  it("satisfies the DomainAdapter contract", () => {
    const adapter = polityWorld();
    const goal: CogObject<"goal"> = {
      kind: "goal", id: "g1", status: "observed", basis: "onboarding",
      confidence: 0.9, domain: "education", createdAt: 1,
      payload: { claim: "Clear the foundations" },
    };
    const out = adapter.planFrom(goal, { builtAt: 1, goal: null, focus: [{ id: "c", name: "Friction", mean: 0.4, grey: false }], uncertainties: [], hypotheses: [] } as never);
    expect(out.action).toBe("Clear the foundations");
    expect(out.why).toMatch(/never saw the domain/);
  });

  it("concept names enter the workspace as OPAQUE strings — domain knowledge stays in the adapter", () => {
    const adapter = cbseWorld();
    const wst = adapter.initState(ARCHETYPES.steady!);
    const w = adapter.assembleWorkspace({
      day: 1, turn: 0, st: wst, profile: ARCHETYPES.steady!,
      targetId: adapter.config.concepts[0]!.id, targetMean: 0.4, targetGrey: true,
      uncertainties: 2, breaksThisDay: 0, llmThisDay: 0, turnsRemaining: 7,
    });
    // the workspace carries the label; the engine cannot know what it means
    expect(typeof w.focusConcept.name).toBe("string");
    expect(w.focusConcept.id).toBe(adapter.config.concepts[0]!.id);
  });

  it("the external evaluator is the ONLY consumer of externalWeights — the brain reads priorWeights, never exam truth", () => {
    const adapter = polityWorld();
    const wst = adapter.initState(ARCHETYPES.steady!);
    const before = adapter.externalEvaluate(wst);
    // flip the evaluator; the world's truth did not change
    const flipped = new TechgramWorldAdapter({
      ...adapter.config,
      externalWeights: new Map([...adapter.config.externalWeights].map(([k, v], i) => [k, v * (i % 2 === 0 ? 2 : 0.5)])),
    });
    const after = flipped.externalEvaluate(wst);
    expect(after).not.toBe(before);
    // and the PRIOR weights the executive targets with are a different map
    expect(adapter.config.priorWeights).not.toBe(adapter.config.externalWeights);
  });

  it("the world's learning rule follows the outcome and fatigue — sensors, not magic", () => {
    const adapter = syntheticChainWorld();
    const wst = adapter.initState(ARCHETYPES.steady!);
    const rng = () => 0.99; // always wrong (below any pCorrect)
    const c0 = adapter.config.concepts[0]!.id;
    const o1 = adapter.study(wst, c0, ARCHETYPES.steady!, rng);
    expect(o1.correct).toBe(false);
    expect(o1.masteryDelta).toBeGreaterThan(0); // a failed attempt still teaches a little
    const rested = adapter.initState(ARCHETYPES.steady!);
    rested.fatigue = 0.9;
    const o2 = adapter.study(rested, c0, ARCHETYPES.steady!, () => 0.01); // always right
    const fresh = adapter.initState(ARCHETYPES.steady!);
    const o3 = adapter.study(fresh, c0, ARCHETYPES.steady!, () => 0.01);
    expect(o2.masteryDelta).toBeLessThan(o3.masteryDelta); // fatigue degraded the same correct answer
  });

  it("a minimal world still runs the frozen belief engine — no NaN from missing content", () => {
    const world = syntheticChainWorld();
    const model = buildBeliefModel(minimalContent(world.config), DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });
    const st = initialState(model);
    const c0 = world.config.concepts[0]!.id;
    observe(model, st, { conceptId: c0, correct: true, evidenceW: 1, day: 1 });
    const r = reportConcept(model, st, c0);
    expect(Number.isFinite(r.mean)).toBe(true);
  });
});

describe("THE THIRTY — the full rig as a permanent regression gate", () => {
  const { results, summary } = runAllScenarios();

  it("all 30 scenarios exist and ALL pass", () => {
    expect(SCENARIOS.length).toBe(30);
    expect(results.length).toBe(30);
    const failed = results.filter((r) => !r.pass);
    expect(failed.map((f) => `${f.id}: ${f.notes.join("; ")}`)).toEqual([]);
    expect(summary.passed).toBe(30);
  }, 60000);

  it("the Executive beats the linear teacher on TRUE MARKS in every matched scenario", () => {
    const matched = results.filter((r) => r.category !== "structural");
    expect(matched.length).toBe(22);
    for (const r of matched) expect(r.margin).toBeGreaterThanOrEqual(0);
    expect(summary.margins.losses).toBe(0);
    expect(summary.margins.wins).toBeGreaterThanOrEqual(25);
  }, 60000);

  it("every structural proof holds: replay, frozen organs, anti-Goodhart, LLM identity, divergence", () => {
    expect(summary.structural.replayBitIdentical).toBe(true);
    expect(summary.structural.frozenOrgansUnchanged).toBe(true);
    expect(summary.structural.antiGoodhartIsolation).toBe(true);
    expect(summary.structural.llmIdentity).toBe(true);
    expect(summary.structural.developmentalDivergence).toBe(true);
  }, 60000);

  it("the developmental loop ran everywhere: self-errors accumulated and decisions were self-model-informed", () => {
    for (const r of results) {
      expect(r.executive.selfErrors).toBeGreaterThan(20);
      expect(r.executive.decisionsWithInsights).toBeGreaterThan(r.executive.plans * 0.8);
      expect(r.executive.allProvenanceValid).toBe(true);
    }
    expect(summary.totals.selfErrors).toBeGreaterThan(1000);
    expect(summary.totals.utterances).toBeGreaterThan(1500);
  }, 60000);

  it("goal-agnosticism at the runtime layer: the same brain ran UPSC, CBSE and synthetic worlds with zero cognitive changes", () => {
    const worlds = new Set(results.map((r) => r.worldId));
    expect(worlds.has("upsc-polity")).toBe(true);
    expect(worlds.has("cbse-8-science")).toBe(true);
    expect(worlds.has("chain")).toBe(true);
    expect(worlds.has("heavy")).toBe(true);
    expect(worlds.size).toBeGreaterThanOrEqual(6);
  }, 60000);

  it("summarize is honest about category coverage", () => {
    expect(summary.byCategory["archetype"]!.total).toBe(10);
    expect(summary.byCategory["cross-world"]!.total).toBe(7);
    expect(summary.byCategory["adversarial"]!.total).toBe(5);
    expect(summary.byCategory["structural"]!.total).toBe(8);
  });
});

describe("worldFromContent keeps real seeds working (regression)", () => {
  it("slices the frozen seed content into a world without mutating it", () => {
    const adapter = polityWorld(4);
    expect(adapter.config.concepts.length).toBe(4);
    expect(adapter.config.domainLabel).toContain("UPSC");
    // and the seed still builds its full model elsewhere (frozen content untouched)
    expect(adapter.config.priorWeights.size).toBe(4);
  });
});
