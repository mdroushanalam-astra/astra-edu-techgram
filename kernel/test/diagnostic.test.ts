import { describe, it, expect } from "vitest";
import { buildBeliefModel, initialState, observe, DEFAULT_BELIEF_PARAMS } from "../src/belief.js";
import { DiagnosticSession, DEFAULT_DIAGNOSTIC_PARAMS } from "../src/diagnostic.js";
import { DEFAULT_MEMORY_PARAMS } from "../src/memory.js";
import { buildSeedContent } from "../src/polity_seed.js";
import { makeRng } from "../src/linalg.js";

const content = buildSeedContent();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, {
  selfRating: 3,
});

describe("CAT diagnostic — information-gain selection", () => {
  it("selects unused items and stops in the 20–25 item window", () => {
    const st = initialState(model);
    const sess = new DiagnosticSession(model);
    const rng = makeRng(23);
    let count = 0;
    for (;;) {
      const choice = sess.next(st);
      if (!choice) break;
      expect(sess.used.has(choice.item.id)).toBe(false);
      sess.record(choice.item, rng.next() < 0.5, count + 1);
      // Apply the same observation to the belief (as the real loop would).
      observe(model, st, {
        conceptId: choice.item.conceptId,
        b: 0,
        correct: rng.next() < 0.5,
        evidenceW: 1,
        day: count + 1,
      });
      count++;
      if (count > 100) break; // safety
    }
    expect(count).toBeGreaterThanOrEqual(20);
    expect(count).toBeLessThanOrEqual(DEFAULT_DIAGNOSTIC_PARAMS.maxItems);
  });

  it("prefers informative items over trivially easy or impossibly hard ones", () => {
    const st = initialState(model);
    const sess = new DiagnosticSession(model);
    const choice = sess.next(st);
    expect(choice).not.toBeNull();
    // First pick must have positive information value and mid difficulty.
    expect(choice!.predictedP).toBeGreaterThan(0.3);
    expect(choice!.predictedP).toBeLessThan(0.95);
  });

  it("summary reports bands, known and unknown topics without fake precision", () => {
    const st = initialState(model);
    const sess = new DiagnosticSession(model);
    const rng = makeRng(29);
    for (;;) {
      const choice = sess.next(st);
      if (!choice) break;
      sess.record(choice.item, rng.next() < 0.55, sess.responses.length + 1);
      observe(model, st, {
        conceptId: choice.item.conceptId,
        correct: rng.next() < 0.55,
        evidenceW: 1,
        day: sess.responses.length,
      });
    }
    const s = sess.summary(st);
    expect(s.scoreBand[0]).toBeLessThanOrEqual(s.scoreBand[1]);
    expect(s.unknownTopics.length).toBeGreaterThan(0); // 25 items cannot map 40 concepts
    expect(s.sharpen.length).toBeGreaterThan(0);
  });

  it("never repeats an item within a session", () => {
    const st = initialState(model);
    const sess = new DiagnosticSession(model);
    const ids = new Set<string>();
    for (let k = 0; k < 5; k++) {
      const c = sess.next(st);
      if (!c) break;
      expect(ids.has(c.item.id)).toBe(false);
      ids.add(c.item.id);
      sess.record(c.item, true, k + 1);
      observe(model, st, { conceptId: c.item.conceptId, correct: true, evidenceW: 1, day: k + 1 });
    }
  });
});
