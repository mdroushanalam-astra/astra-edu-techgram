import { describe, it, expect } from "vitest";
import { runDemo6 } from "../src/demo/demo6.js";
import { cbseWorld } from "../src/adapter/worlds.js";

/**
 * THE PHASE 6 GATE [roadmap §12, ADR-044] — the 3-minute demo, receipts underneath.
 * The arc: knows nothing → hypothesis → tested → "I was wrong" → changed →
 * what I learned + what I'm still uncertain about. Plus §12's interactive
 * promise: change ONE input → the decision's change is shown WITH the mechanism.
 */
describe("PHASE 6 — the demo arc is real, not narration", () => {
  const arc = runDemo6({});

  it("Act 1: the engine states its hypothesis with honest uncertainty and a receipt", () => {
    const act1 = arc.beats.find((b) => b.minute === 1)!;
    expect(act1.lines.some((l) => l.includes("grey"))).toBe(true);
    expect(act1.lines.some((l) => /predict/i.test(l))).toBe(true);
    expect(act1.receipt).toBeDefined();
  });

  it("Act 2: an expectation was tested, found wrong, and the change is proven against a twin", () => {
    const act2 = arc.beats.find((b) => b.minute === 2)!;
    expect(act2.lines.some((l) => l.includes("I was wrong"))).toBe(true);
    expect(act2.lines.some((l) => l.includes("DIVERGE"))).toBe(true);
    expect(arc.summary.selfErrors).toBeGreaterThan(5);
  });

  it("Act 3: what was learned (about the student AND about itself) + the honest unknown list", () => {
    const act3 = arc.beats.find((b) => b.minute === 3)!;
    expect(act3.lines.some((l) => l.startsWith("Learned about you"))).toBe(true);
    expect(act3.lines.some((l) => l.startsWith("Learned about myself"))).toBe(true);
    expect(act3.lines.some((l) => l.startsWith("Still uncertain"))).toBe(true);
    expect(arc.summary.topBeliefShifts.length).toBe(3);
  });

  it("the viewer controls: changing ONE input changes the decision WITH the mechanism shown", () => {
    expect(arc.perturbations.length).toBe(6);
    const changed = arc.perturbations.filter((p) => p.changed);
    expect(changed.length).toBeGreaterThanOrEqual(4);
    // the mechanism must be visible: the candidate pool itself moved
    for (const p of changed) {
      expect(
        p.baseline.decision !== p.perturbed.decision ||
        JSON.stringify(p.baseline.candidates) !== JSON.stringify(p.perturbed.candidates),
      ).toBe(true);
    }
    // fatigue spike must summon the break candidate
    const fatigue = arc.perturbations.find((p) => p.name === "fatigue spikes")!;
    expect(fatigue.perturbed.candidates).toContain("break");
  });

  it("the arc runs on a second world with the same code (goal-agnostic demo)", () => {
    const cbse = runDemo6({ world: () => cbseWorld(), archetype: "anxious", seed: 707 });
    expect(cbse.beats.length).toBe(3);
    expect(cbse.summary.selfErrors).toBeGreaterThan(0);
    expect(cbse.perturbations.filter((p) => p.changed).length).toBeGreaterThanOrEqual(3);
  });
});
