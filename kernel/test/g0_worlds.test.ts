import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { buildSeedContent } from "../src/polity_seed.js";
import { buildBeliefModel, DEFAULT_BELIEF_PARAMS } from "../src/belief.js";
import { DEFAULT_MEMORY_PARAMS } from "../src/memory.js";
import { aggregate, WORLD_A_FRIENDLY, WORLD_B_MISSPECIFIED, WORLD_C_ADVERSARIAL, type SimWorld } from "../src/lab.js";

/**
 * GATE G0 — REDEFINED (ADR-016, 2026-10-02).
 *
 * The old gate — "planner beats baselines in our simulator" — was necessary
 * but insufficient: a simulator built from the planner's own assumptions can
 * crown the planner in a world designed to agree with it. The new gate:
 *
 *   The planner remains USEFUL — superior or competitive against every
 *   baseline — across multiple, partly unseen generative worlds.
 *
 *   World A (friendly):  truth per Techgram assumptions.
 *   World B (misspecified): different gains, faster forgetting, prereq edges
 *              that barely matter in truth, noisy responses.
 *   World C (adversarial): halved gains, overreported confidence, 30% of
 *              concepts pre-mastered against the prior, availability collapse.
 *   World D (hidden):    sealed generative configurations the kernel never
 *              sees (kernel/src/lab/worlds.hidden.json, hash-pinned below).
 *
 * Pass rule (pre-registered): in EVERY world,
 *   meanMarks(techgram) ≥ meanMarks(random) − 0.5  and
 *   meanMarks(techgram) ≥ meanMarks(fixed_order) − 1.0,
 * and in the friendly world the planner is strictly superior to both.
 */

const content = buildSeedContent();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });

// ---- seal verification: the hidden worlds must not be tampered with ----
const HIDDEN_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "lab", "worlds.hidden.json");
const SEALED_HASH = "c31cd9d5"; // FNV-1a over the file's UTF-8 bytes, pinned at sealing time (2026-10-02)
function fnv1a(text: string): string {
  const bytes = Buffer.from(text, "utf8");
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i]!;
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function loadHiddenWorlds(): SimWorld[] {
  const text = readFileSync(HIDDEN_PATH, "utf8");
  if (fnv1a(text) !== SEALED_HASH) {
    throw new Error(
      `SEALED WORLDS TAMPERED: worlds.hidden.json hash changed (expected ${SEALED_HASH}). ` +
        `Hidden benchmarks may not be edited after sealing — create worlds.hidden.v2 via a new ADR.`,
    );
  }
  const parsed = JSON.parse(text) as {
    worlds: SimWorld[];
    seedBase: number;
    days: number;
    studentsPerArchetype: number;
  };
  return parsed.worlds.map((w) => ({ ...w, name: w.name }));
}

interface WorldResult {
  world: string;
  tech: number;
  fixed: number;
  random: number;
  calib: number | null;
}

function runWorld(world: SimWorld, seedBase: number): WorldResult {
  const agg = aggregate(model, 30, 2, seedBase, ["techgram", "fixed_order", "random"], world);
  return {
    world: world.name,
    tech: agg.techgram.meanMarks,
    fixed: agg.fixed_order.meanMarks,
    random: agg.random.meanMarks,
    calib: agg.techgram.meanCalibration,
  };
}

describe("GATE G0 (four worlds) — planner remains useful across generative worlds", () => {
  const results: WorldResult[] = [];

  it("World A (friendly): strictly superior to both baselines", () => {
    const r = runWorld(WORLD_A_FRIENDLY, 60411);
    results.push(r);
    expect(r.tech).toBeGreaterThan(r.random);
    expect(r.tech).toBeGreaterThan(r.fixed);
  });

  it("World B (misspecified): competitive or superior to both baselines", () => {
    const r = runWorld(WORLD_B_MISSPECIFIED, 60412);
    results.push(r);
    expect(r.tech).toBeGreaterThanOrEqual(r.random - 0.5);
    expect(r.tech).toBeGreaterThanOrEqual(r.fixed - 1.0);
  });

  it("World C (adversarial): competitive or superior to both baselines", () => {
    const r = runWorld(WORLD_C_ADVERSARIAL, 60413);
    results.push(r);
    expect(r.tech).toBeGreaterThanOrEqual(r.random - 0.5);
    expect(r.tech).toBeGreaterThanOrEqual(r.fixed - 1.0);
  });

  it("World D (sealed hidden benchmarks): competitive or superior to both baselines", () => {
    const worlds = loadHiddenWorlds();
    expect(worlds.length).toBeGreaterThanOrEqual(2);
    let i = 0;
    for (const w of worlds) {
      const r = runWorld(w, 771003 + i * 1000);
      results.push(r);
      expect(r.tech).toBeGreaterThanOrEqual(r.random - 0.5);
      expect(r.tech).toBeGreaterThanOrEqual(r.fixed - 1.0);
      i += 1;
    }
  });

  it("prints the G0 table (visible evidence, not hidden assertions)", () => {
    console.log("G0 four-worlds table (30 days, 8 students/world, 240 min/day):");
    for (const r of results) {
      console.log(
        `  ${r.world.padEnd(16)} techgram ${r.tech.toFixed(1)} | fixed ${r.fixed.toFixed(1)} | random ${r.random.toFixed(1)} | lift-vs-best-baseline ${(r.tech - Math.max(r.fixed, r.random)).toFixed(2)} | calib ${r.calib !== null ? (r.calib * 100).toFixed(1) + "pts" : "—"}`,
      );
    }
    expect(results.length).toBeGreaterThanOrEqual(4);
  });
});
