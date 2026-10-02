import { describe, it, expect } from "vitest";
import { Envelope, assertNoUpgrade, strongestInputType } from "../src/envelope.js";

const NOW = 100;

describe("Learning Envelope — machine-enforced rules", () => {
  it("forces unknown on null values (rule 1)", () => {
    const e = new Envelope({
      value: null,
      unit: "probability",
      knowledge_type: "assessed",
      observation_basis: "mock_test",
      observed_at: NOW,
    });
    expect(e.knowledge_type).toBe("unknown");
    expect(e.confidence).toBe(0);
    expect(e.uncertainty).toBe(1);
  });

  it("rejects invalid knowledge_type (rule 2)", () => {
    expect(
      () =>
        new Envelope({
          value: 0.5,
          unit: "probability",
          knowledge_type: "guessed" as never,
          observation_basis: "mock_test",
          observed_at: NOW,
        }),
    ).toThrow(/invalid knowledge_type/);
  });

  it("assessed requires a test-based observation basis (rule 3)", () => {
    expect(
      () =>
        new Envelope({
          value: 0.7,
          unit: "probability",
          knowledge_type: "assessed",
          observation_basis: "self_declaration",
          observed_at: NOW,
        }),
    ).toThrow(/assessed knowledge requires/);
  });

  it("marks expired facts decayed and halves confidence (rule 4)", () => {
    const e = new Envelope({
      value: 0.6,
      unit: "probability",
      knowledge_type: "assessed",
      observation_basis: "mock_test",
      observed_at: 200,
      valid_until: 150, // observed_at > valid_until → expired at construction
      confidence: 0.8,
    });
    expect(e.knowledge_type).toBe("decayed");
    expect(e.confidence).toBeCloseTo(0.4);
  });

  it("predictions require a model_id (rule 5)", () => {
    expect(
      () =>
        new Envelope({
          value: 0.5,
          unit: "probability",
          knowledge_type: "predicted",
          observation_basis: "retention_model",
          observed_at: NOW,
        }),
    ).toThrow(/model_id/);
  });

  it("rejects negative uncertainty and out-of-range confidence (rule 6)", () => {
    expect(
      () =>
        new Envelope({
          value: 0.5, unit: "x", knowledge_type: "computed",
          observation_basis: "state_fusion", observed_at: NOW, uncertainty: -0.1,
        }),
    ).toThrow(/non-negative/);
    expect(
      () =>
        new Envelope({
          value: 0.5, unit: "x", knowledge_type: "computed",
          observation_basis: "state_fusion", observed_at: NOW, confidence: 1.5,
        }),
    ).toThrow(/confidence/);
  });

  it("unknown() helper produces an honest unknown", () => {
    const e = Envelope.unknown("probability", "system_default", NOW);
    expect(e.knowledge_type).toBe("unknown");
    expect(e.value).toBeNull();
  });
});

describe("No-upgrade invariant", () => {
  it("blocks derived claims stronger than inputs", () => {
    expect(() => assertNoUpgrade("assessed", ["self_reported", "inferred"])).toThrow(/No-upgrade/);
  });
  it("allows derived claims weaker than or equal to inputs", () => {
    expect(() => assertNoUpgrade("inferred", ["assessed"])).not.toThrow();
    expect(() => assertNoUpgrade("assessed", ["assessed", "inferred"])).not.toThrow();
  });
  it("strength order is sane", () => {
    expect(strongestInputType(["unknown", "self_reported"])).toBe("self_reported");
    expect(strongestInputType(["assessed", "computed"])).toBe("assessed");
  });
});
