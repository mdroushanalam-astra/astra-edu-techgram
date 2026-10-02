import { describe, it, expect } from "vitest";
import {
  newMemoryCell, applyReview, retrievability, isDue, stabilityOf,
  DEFAULT_MEMORY_PARAMS as P,
} from "../src/memory.js";
import { buildSeedContent } from "../src/polity_seed.js";

const content = buildSeedContent();

describe("memory engine — FSRS-lite", () => {
  it("retrievability decreases with elapsed time and is 1 right after review", () => {
    const cell = newMemoryCell("conceptual", P);
    applyReview(cell, true, 10, P);
    expect(retrievability(cell, 10)).toBeCloseTo(1);
    expect(retrievability(cell, 40)).toBeLessThan(retrievability(cell, 20));
    expect(retrievability(cell, 400)).toBeLessThan(retrievability(cell, 40));
  });

  it("successful reviews grow stability (capped), lapses shrink it", () => {
    const cell = newMemoryCell("conceptual", P);
    const S0 = cell.S;
    applyReview(cell, true, 1, P);
    expect(cell.S).toBeGreaterThan(S0);
    const capped = newMemoryCell("factual", P);
    for (let d = 1; d <= 30; d++) applyReview(capped, true, d, P);
    expect(capped.S).toBeLessThanOrEqual(3650);
    const lapsed = newMemoryCell("applied", P);
    const S1 = lapsed.S;
    applyReview(lapsed, false, 5, P);
    expect(lapsed.S).toBeLessThan(S1);
    expect(lapsed.lapses).toBe(1);
  });

  it("due classification tracks the retrievability threshold", () => {
    const cell = newMemoryCell("factual", P); // S=3d
    applyReview(cell, true, 1, P);
    expect(isDue(cell, 2, P)).toBe(false);
    expect(isDue(cell, 60, P)).toBe(true);
  });

  it("never-reviewed concepts use type-prior stability", () => {
    expect(stabilityOf(undefined, "factual", P)).toBe(3);
    expect(stabilityOf(undefined, "conceptual", P)).toBe(8);
    expect(stabilityOf(undefined, "applied", P)).toBe(12);
  });

  it("every concept in the seed content is a valid type", () => {
    for (const c of content.concepts) {
      expect(["factual", "conceptual", "applied"]).toContain(c.type);
    }
  });
});
