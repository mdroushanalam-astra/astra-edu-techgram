import { describe, it, expect } from "vitest";
import { runLayerStudy, SITUATIONS } from "../src/lab/layer-trace.js";
import { runDemo6 } from "../src/demo/demo6.js";

/**
 * THE LAYER INTERACTION STUDY [ADR-045] as a permanent gate — the 24 real-time
 * student situations with per-layer traces and ablations, plus the Phase 6
 * demo arc [ADR-044]. Runs in under a second.
 */
describe("THE LAYER STUDY — 24 real-time situations, every layer attributed", () => {
  const { results, aggregate } = runLayerStudy();

  it("all 24 situations ran with traces and valid provenance", () => {
    expect(SITUATIONS.length).toBe(24);
    expect(results.length).toBe(24);
    expect(aggregate.turns).toBeGreaterThan(1000);
    expect(aggregate.provenanceValid).toBe(true);
    for (const r of results) expect(r.trace.length).toBeGreaterThan(40);
  }, 60000);

  it("the executive never loses to the linear teacher on true marks", () => {
    expect(aggregate.execLosses).toBe(0);
    expect(aggregate.execWins).toBeGreaterThanOrEqual(20);
  }, 60000);

  it("the influence ordering is honest and mechanistically correct", () => {
    // The executive layer as a whole dominates; belief-driven targeting carries
    // most of it; the wall contributes; the self-model levers stay quiet in
    // these regimes (their causal role is proven in the S4 gate, §18).
    expect(aggregate.influence.executiveVsLinearMeanPct).toBeGreaterThan(60);
    expect(aggregate.influence.beliefBlindMeanPct).toBeGreaterThan(60);
    expect(aggregate.influence.beliefBlindMeanPct).toBeLessThan(aggregate.influence.executiveVsLinearMeanPct + 1);
    expect(aggregate.influence.selfModelMeanPct).toBeLessThan(5);
    expect(aggregate.influence.wallMarksDelta).toBeGreaterThanOrEqual(0);
  }, 60000);

  it("every layer actually worked in real time", () => {
    expect(aggregate.layerActivity.s1PredictionsEveryTurn).toBe(true);      // S1 before every decision
    expect(aggregate.layerActivity.insightsInjectedPct).toBeGreaterThan(0.9); // self-model consulted
    expect(aggregate.layerActivity.s2ErrorTurnPct).toBeGreaterThan(0.3);      // ledger catches errors
    expect(aggregate.layerActivity.blockedPct).toBeGreaterThan(0.5);          // the ethics/contract wall
    expect(aggregate.layerActivity.expressionPct).toBeGreaterThan(0.6);       // the voice speaks
    expect(aggregate.layerActivity.selfCorrectionRate).toBeGreaterThan(0.05); // earned humility, not wallpaper
    expect(aggregate.layerActivity.praiseRate).toBeLessThan(0.15);            // praise stays rare
    expect(aggregate.layerActivity.wallTurns).toBeGreaterThan(0);             // physiology enforced
  }, 60000);

  it("chaos is survivable: t24 (noise+streaks+fatigue+spiky) still wins", () => {
    const chaos = results.find((r) => r.id === "t24")!;
    expect(chaos.marks.margin).toBeGreaterThanOrEqual(0);
    expect(chaos.selfErrors).toBeGreaterThan(10);
  }, 60000);
});

describe("PHASE 6 DEMO — the arc regression", () => {
  it("the 3-minute arc holds: hypothesis → wrong → changed → learned/uncertain", () => {
    const arc = runDemo6({});
    expect(arc.beats.length).toBe(3);
    expect(arc.summary.selfErrors).toBeGreaterThan(5);
    expect(arc.perturbations.filter((p) => p.changed).length).toBeGreaterThanOrEqual(4);
  });
});
