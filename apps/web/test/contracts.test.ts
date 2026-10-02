/**
 * SPRINT 0 — CONTRACT TESTS [ADR-032]
 * The contracts are enforced here: provenance gate, humor-authorship gate,
 * scene integrity, voice tier resolution honesty. These tests are the
 * frontend constitution's teeth.
 */
import { describe, it, expect } from "vitest";
import {
  validateUtterance, ProvenanceError,
  type Utterance, type EvidenceRef,
  resolveVoiceOutTier, resolveVoiceInTier, type VoiceCapabilities,
  type SessionScene,
} from "../src/contracts/index.js";

const band: EvidenceRef = { kind: "band", conceptId: "c_fr_14" };
const atom: EvidenceRef = { kind: "atom", id: "a_fr_14_01" };
const event: EvidenceRef = { kind: "event", id: "pe42" };
const preference: EvidenceRef = { kind: "preference", dimension: "explanation_style", option: "analogy" };

function ut(over: Partial<Utterance> = {}): Utterance {
  return {
    semanticSource: "test.greeting",
    evidenceRefs: [band],
    uncertainty: { level: "grey" },
    policy: { tone: "warm", energy: "medium", allowHumor: false },
    ...over,
  };
}

describe("CLAIM PROVENANCE — the anti-fraud gate", () => {
  it("an honest multi-source sentence passes (event + preference + decision + atom)", () => {
    // "You struggled with this yesterday, so I'm going to approach it visually today."
    const u = ut({
      semanticSource: "session.policy_change",
      evidenceRefs: [event, preference, atom],
      decisionRef: { kind: "decision", id: "plan_d2_b0" },
      uncertainty: { level: "grey" },
    });
    expect(() => validateUtterance(u)).not.toThrow();
  });

  it("an utterance with NO evidence refs is rejected — the constitution has teeth", () => {
    expect(() => validateUtterance(ut({ evidenceRefs: [] }))).toThrow(ProvenanceError);
    try {
      validateUtterance(ut({ evidenceRefs: [] }));
    } catch (e) {
      expect((e as Error).message).toMatch(/didn't produce it/);
    }
  });

  it("humor without an authored variant is rejected (no runtime-invented jokes)", () => {
    const u = ut({ policy: { tone: "warm", energy: "high", allowHumor: true } });
    expect(() => validateUtterance(u)).toThrow(/authored variant/);
    const ok = ut({
      policy: { tone: "warm", energy: "high", allowHumor: true },
      authoredVariantId: "hum_c_fr_14_v2",
      evidenceRefs: [atom],
    });
    expect(() => validateUtterance(ok)).not.toThrow();
  });

  it("inverted 'known' bands are rejected (no fake precision)", () => {
    expect(() => validateUtterance(ut({ uncertainty: { level: "known", band: [0.8, 0.4] } }))).toThrow(/inverted/);
  });
});

describe("VOICE TIERS — capability-gated, never a dependency", () => {
  const caps = (over: Partial<VoiceCapabilities> = {}): VoiceCapabilities => ({
    ttsOut: true, ttsQuality: 0.8, webgpu: true, micPermission: "granted",
    asrModelReady: true, perfClass: "mid", ...over,
  });

  it("out: usable voice → tts; bad voice → text_first with an honest reason", () => {
    expect(resolveVoiceOutTier(caps()).tier).toBe("tts");
    const bad = resolveVoiceOutTier(caps({ ttsQuality: 0.2 }));
    expect(bad.tier).toBe("text_first");
    expect(bad.reason).toMatch(/never breaks/);
  });

  it("in: capable+ready → local_asr; capable+not-downloaded → optional; low-end → text_only; mic denied → respect it", () => {
    expect(resolveVoiceInTier(caps()).tier).toBe("local_asr");
    expect(resolveVoiceInTier(caps({ asrModelReady: false })).tier).toBe("network_asr_optional");
    expect(resolveVoiceInTier(caps({ perfClass: "low" })).tier).toBe("text_only");
    const denied = resolveVoiceInTier(caps({ micPermission: "denied" }));
    expect(denied.tier).toBe("text_only");
    expect(denied.reason).toMatch(/respect/);
  });
});

describe("SCENE GRAPH — typed scenes, kernel truth only", () => {
  it("a complete session scene composes (teacher + board + interaction + evidence)", () => {
    const scene: SessionScene = {
      seq: 7,
      teacher: { presence: "explaining", gaze: "board", expression: "thoughtful" },
      blackboard: {
        elements: [{ id: "b1", kind: "causal_chain", ref: { kind: "concept", id: "c_geo_delta" } }],
        animating: ["b1"],
        focus: "b1",
      },
      interaction: { mode: "waiting", accept: ["tap", "text"] },
      evidence: {
        reason: "Your confidence on this topic is ahead of your delayed recall.",
        uncertainty: { level: "grey", band: [0.4, 0.7] },
        whyThisAvailable: true,
      },
      camera: "board-focus",
      acknowledgmentMs: 450,
    };
    expect(scene.teacher.presence).toBe("explaining");
    expect(scene.blackboard.elements[0]!.ref!.kind).toBe("concept");
    expect(scene.interaction.accept).toContain("text"); // text is ALWAYS present
  });

  it("a wrong-answer scene uses attentive expression and never implies punishment", () => {
    const scene: SessionScene = {
      seq: 8,
      teacher: { presence: "responding", gaze: "student", expression: "attentive" },
      blackboard: { elements: [], animating: [] },
      interaction: { mode: "none", accept: ["tap", "text"] },
      evidence: { uncertainty: { level: "grey" }, whyThisAvailable: true },
      camera: "medium",
    };
    expect(["attentive", "thoughtful", "concerned-lean-in"]).toContain(scene.teacher.expression);
  });

  it("the 'shut up gracefully' rule is expressible: presence 'absent', interaction waiting", () => {
    const scene: SessionScene = {
      seq: 9,
      teacher: { presence: "absent", gaze: "away", expression: "neutral" },
      blackboard: { elements: [{ id: "b2", kind: "question_marker", ref: { kind: "receipt", id: "r1" } }], animating: [] },
      interaction: { mode: "free_response", accept: ["text", "tap"] },
      evidence: { uncertainty: { level: "unknown" }, whyThisAvailable: false },
      camera: "minimal",
    };
    expect(scene.teacher.presence).toBe("absent");
    expect(scene.blackboard.elements.length).toBeGreaterThan(0); // board remains
  });
});
