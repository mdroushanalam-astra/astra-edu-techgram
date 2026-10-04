import { describe, it, expect } from "vitest";
import {
  genesis, selfPredict, checkSelfPrediction, detectPatterns,
  selfInquiry, runSelfImprovementExperiment, phase2Gate,
  type SelfErrorRecord, type DevelopmentalState,
} from "../src/cognitive/self-development.js";

describe("PHASE 2 — DEVELOPMENTAL CORE [corrected master roadmap §8]", () => {
  it("S0 Genesis: self-inquiry (not benchmarking) — VoI picks which uncertainties to investigate", () => {
    const g = genesis([
      { id: "u1", question: "Am I overestimating action success?", area: "AOM", informationValue: 0.7, probe: "matched A/B sim" },
      { id: "u2", question: "Is my break threshold too aggressive?", area: "executive", informationValue: 0.4, probe: "threshold sweep" },
      { id: "u3", question: "Can I predict retention after 7 days?", area: "memory", informationValue: 0.9, probe: "delayed recall test" },
    ], 2);
    expect(g.investigated.length).toBe(2);
    expect(g.investigated[0].informationValue).toBe(0.9); // highest VoI first
    expect(g.selfModel.capabilities.length + g.selfModel.limitations.length).toBe(2);
    expect(g.selfModel.knownUnknowns.length).toBe(1);
  });

  it("S1 Self-Prediction: predicts own behavior BEFORE acting", () => {
    const sps = selfPredict(5, 0.8, 2, 0.25);
    expect(sps.some((s) => s.prediction.includes("fatigue"))).toBe(true);
    expect(sps.some((s) => s.prediction.includes("intervene"))).toBe(true);
    expect(sps.some((s) => s.category === "decision")).toBe(true);
  });

  it("S2 Self-Error Ledger: catches wrong self-predictions and detects recurring patterns", () => {
    const sp = selfPredict(5, 0.8, 2, 0.25)[0];
    const { record, wasWrong } = checkSelfPrediction(sp, "fatigue was low, not high");
    expect(wasWrong).toBe(true);
    const ledger: SelfErrorRecord[] = Array.from({ length: 3 }, (_, i) => ({ ...record, id: `e${i}` }));
    const patterns = detectPatterns(ledger);
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0]).toMatch(/recurring/);
  });

  it("S3 Self-Inquiry: VoI applied to self-uncertainties — CAT pointed inward", () => {
    const inq = selfInquiry(["Am I overestimating success?", "Is my break threshold wrong?"], []);
    expect(inq.length).toBe(2);
    expect(inq[0].informationValue).toBeGreaterThanOrEqual(inq[1].informationValue);
  });

  it("S4 Self-Improvement: one strategy experiment — keep/reject with evidence", () => {
    const { kept, record } = runSelfImprovementExperiment(
      { id: "exp1", observation: "I intervene too early when uncertainty is high", change: "collect one more evidence point before committing", level: 2 },
      { old: 0.6, new: 0.75 },
    );
    expect(kept).toBe(true);
    expect(record.result).toMatch(/KEEP/);
    const rejected = runSelfImprovementExperiment(
      { id: "exp2", observation: "test", change: "test", level: 1 },
      { old: 0.75, new: 0.6 },
    );
    expect(rejected.kept).toBe(false);
  });

  it("PHASE 2 GATE: history → self-model change → DECISION change", () => {
    const before: DevelopmentalState = {
      selfModelVersion: 0, capabilities: [], limitations: [], calibrationScore: null,
      knownUnknowns: [], activeHypotheses: [], selfErrorLedger: [], experiments: [], version: 0,
    };
    const after: DevelopmentalState = {
      ...before, version: 1,
      selfErrorLedger: [{ id: "e1", prediction: "p", actual: "a", error: "wrong", context: "c", at: 1 }],
      experiments: [{ id: "s1", hypothesis: "h", strategyA: "a", strategyB: "b", result: "keep", kept: true, evaluatedBy: "simulator" }],
    };
    const gate = phase2Gate(before, after, ["retrieve:c1", "teach:c2"], ["retrieve:c1", "break", "teach:c3"]);
    expect(gate.pass).toBe(true);
    expect(gate.detail).toMatch(/self-model v0→v1/);
  });
});
