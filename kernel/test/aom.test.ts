import { describe, it, expect } from "vitest";
import {
  DEFAULT_AOM_INSTANCE, makeAssumedAom, predictAction, predictDiagnoseUncertainty,
  learnFromOutcomes, approve, statusConfidence, type OutcomeRecord,
} from "../src/aom.js";

describe("B5.5 Action Outcome Model — prediction", () => {
  const aom = DEFAULT_AOM_INSTANCE;

  it("learn gains exceed review gains and shrink with mastery (diminishing returns)", () => {
    const weak = predictAction(aom, { action: "learn", minutes: 25, mastery: 0.3, daysToExam: 100, triage: false });
    const strong = predictAction(aom, { action: "learn", minutes: 25, mastery: 0.85, daysToExam: 100, triage: false });
    const review = predictAction(aom, { action: "review", minutes: 15, mastery: 0.5, daysToExam: 100, triage: false, retrievabilityNow: 0.5 });
    expect(weak.dMastery).toBeGreaterThan(review.dMastery);
    expect(weak.dMastery).toBeGreaterThan(strong.dMastery);
    expect(weak.status).toBe("assumed");
    expect(weak.confidence).toBeCloseTo(0.4);
    expect(weak.aomVersion).toMatch(/^aom-/);
  });

  it("triage context penalises brand-new material (applied ONCE, inside the AOM)", () => {
    const normal = predictAction(aom, { action: "learn", minutes: 25, mastery: 0.1, daysToExam: 100, triage: false });
    const triage = predictAction(aom, { action: "learn", minutes: 25, mastery: 0.1, daysToExam: 30, triage: true });
    expect(triage.dMastery).toBeCloseTo(normal.dMastery * aom.params.triagePenalty, 6);
    // No double penalty: the value is penalised exactly once.
    expect(triage.dMastery / normal.dMastery).toBeCloseTo(0.35, 6);
  });

  it("review stability multiplier grows as retrievability drops (just-in-time protection)", () => {
    const fresh = predictAction(aom, { action: "review", minutes: 15, mastery: 0.5, daysToExam: 10, triage: false, retrievabilityNow: 0.95 });
    const stale = predictAction(aom, { action: "review", minutes: 15, mastery: 0.5, daysToExam: 10, triage: false, retrievabilityNow: 0.3 });
    expect(stale.stabilityMultiplier).toBeGreaterThan(fresh.stabilityMultiplier);
    expect(stale.stabilityMultiplier).toBeLessThanOrEqual(aom.params.reviewGrowth.cap);
  });

  it("diagnose predicts zero mastery gain (measurement, not teaching)", () => {
    const d = predictAction(aom, { action: "diagnose", minutes: 10, mastery: 0.3, daysToExam: 100, triage: false });
    expect(d.dMastery).toBe(0);
    expect(d.stabilityMultiplier).toBe(1);
    expect(d.fatigue).toBeLessThan(0.2);
  });

  it("diagnose uncertainty reduction: more variance removed when the observation is informative", () => {
    // H large (belief near the item's difficulty) vs H small (belief far away).
    const informative = predictDiagnoseUncertainty(1.0, 0.20, 0.15);
    const uninformative = predictDiagnoseUncertainty(1.0, 0.02, 0.15);
    expect(informative).toBeGreaterThan(uninformative);
    expect(informative).toBeGreaterThan(0);
    expect(informative).toBeLessThanOrEqual(1.0); // variance cannot go negative
  });

  it("is deterministic — same input, same prediction (pure function, no RNG)", () => {
    const input = { action: "learn" as const, minutes: 25, mastery: 0.4, daysToExam: 90, triage: false };
    const a = predictAction(aom, input);
    const b = predictAction(aom, input);
    expect(a).toEqual(b);
  });
});

describe("B5.5 — learning from outcomes (the never-self-fooling loop)", () => {
  const aom = DEFAULT_AOM_INSTANCE;

  const rec = (over: Partial<OutcomeRecord>): OutcomeRecord => ({
    action: "learn", minutes: 25, masteryAtAction: 0.4,
    predictedDMastery: 0.3 * 2.5 * 0.6, observedDMastery: 0.3 * 2.5 * 0.6, n: 3,
    ...over,
  });

  it("empty records → no parameter drift (the AOM never invents evidence)", () => {
    const proposal = learnFromOutcomes(aom, []);
    expect(proposal.changeSummary).toMatch(/no parameter changed/);
    expect(proposal.params.gainsPer10Min.learn.value).toBe(aom.params.gainsPer10Min.learn.value);
  });

  it("records matching the prior leave the prior essentially intact", () => {
    const consistent = Array.from({ length: 40 }, () => rec({}));
    const proposal = learnFromOutcomes({ ...aom, provenance: "pilot" }, consistent);
    const before = aom.params.gainsPer10Min.learn.value;
    const after = proposal.params.gainsPer10Min.learn.value;
    expect(Math.abs(after - before)).toBeLessThan(0.02); // shrinkage holds the line
  });

  it("strong contrary evidence moves the gain toward reality — with shrinkage", () => {
    const overachieving = Array.from({ length: 60 }, () =>
      rec({ observedDMastery: 0.3 * 2.5 * 0.6 * 1.8 }), // reality says gains are 1.8× the prior
    );
    const proposal = learnFromOutcomes({ ...aom, provenance: "pilot" }, overachieving);
    const before = aom.params.gainsPer10Min.learn.value;
    const after = proposal.params.gainsPer10Min.learn.value;
    expect(after).toBeGreaterThan(before + 0.05);
    expect(after).toBeLessThan(before * 1.8); // shrunk toward the prior, not swallowed
    expect(proposal.params.gainsPer10Min.learn.status).toBe("measured");
    expect(proposal.params.parents).toContain(aom.params.version);
  });

  it("CLOSED-LOOP BAN: simulator-provenance proposals cannot be approved into production", () => {
    const worldData = Array.from({ length: 100 }, () => rec({ observedDMastery: 999 })); // absurd world data
    const proposal = learnFromOutcomes({ ...aom, provenance: "world:B_misspecified" }, worldData);
    expect(proposal.params.gainsPer10Min.learn.status).toBe("assumed"); // never "measured" from a sim
    expect(() => approve(proposal, "Founder")).toThrow(/CLOSED-LOOP BAN/);
  });

  it("the human gate is mandatory and named", () => {
    const pilotData = Array.from({ length: 100 }, () => rec({}));
    const proposal = learnFromOutcomes({ ...aom, provenance: "pilot" }, pilotData);
    expect(() => approve(proposal, "  ")).toThrow(/named human approver/);
    const approved = approve(proposal, "Roushan (Founder)");
    expect(approved.gainsPer10Min.learn.status).toBe("measured");
    expect(proposal.approvedBy).toBe("Roushan (Founder)");
  });

  it("confidence grows with evidence behind the parameters", () => {
    expect(statusConfidence("assumed", 0)).toBeCloseTo(0.4);
    expect(statusConfidence("measured", 500)).toBeGreaterThan(statusConfidence("measured", 40));
  });

  it("version lineage: a proposal names the pack it grew from", () => {
    const proposal = learnFromOutcomes(aom, [rec({ observedDMastery: 0.01 })]);
    expect(proposal.params.parents).toEqual([aom.params.version]);
    expect(proposal.params.version).not.toBe(aom.params.version);
    expect(makeAssumedAom("x").version).toBe("x");
  });
});

describe("B5.5 — end-to-end loop: simulation outcomes feed the AOM learner", () => {
  it("runSim emits per-block outcome records; learnFromOutcomes pools them into a proposal", async () => {
    const { buildBeliefModel, DEFAULT_BELIEF_PARAMS } = await import("../src/belief.js");
    const { buildSeedContent } = await import("../src/polity_seed.js");
    const { DEFAULT_MEMORY_PARAMS } = await import("../src/memory.js");
    const { runSim } = await import("../src/lab.js");

    const content = buildSeedContent();
    const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });
    const records: import("../src/aom.js").OutcomeRecord[] = [];
    runSim(
      model,
      { seed: 31337, archetype: "consistent", days: 14, minutesPerDay: 240, truthShares: [0.25, 0.25, 0.15, 0.35] },
      "techgram",
      { onOutcome: (r) => records.push(r) },
    );
    expect(records.length).toBeGreaterThan(20); // 14 days × several blocks

    // Predictions are recorded BEFORE outcomes exist (they came from the plan).
    for (const r of records) {
      expect(r.predictedDMastery).toBeGreaterThanOrEqual(0);
      expect(r.minutes).toBeGreaterThan(0);
    }
    // The evidence-based observations are finite and bounded (belief shifts per block).
    for (const r of records) {
      expect(Number.isFinite(r.observedDMastery)).toBe(true);
      expect(Math.abs(r.observedDMastery)).toBeLessThan(2.5);
    }
    // Feeding them to the learner produces a lineage-linked proposal.
    const proposal = learnFromOutcomes(DEFAULT_AOM_INSTANCE, records);
    expect(proposal.params.parents).toContain(DEFAULT_AOM_INSTANCE.params.version);
    // Provenance ban: sim outcomes are world data, not pilot data.
    expect(() => approve({ ...proposal, provenance: "world:sim" }, "Founder")).toThrow(/CLOSED-LOOP BAN/);
  });
});
