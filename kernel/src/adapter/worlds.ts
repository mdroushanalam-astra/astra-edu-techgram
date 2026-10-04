/**
 * THE WORLDS [Phase 5, ADR-043] — concrete configs the adapter can carry.
 * Two REAL worlds from the frozen seeds (UPSC Polity, CBSE Class 8 Science —
 * proving goal-agnosticism at the runtime layer) and SYNTHETIC worlds (pure
 * structure, no domain at all) for the experiment.
 */
import { buildSeedContent } from "../polity_seed.js";
import { buildK12Content } from "../k12_seed.js";
import type { Content } from "../content.js";
import {
  TechgramWorldAdapter, worldFromContent, syntheticWorld,
  type WorldConfig,
} from "./world-adapter.js";

export function polityWorld(nConcepts = 6): TechgramWorldAdapter {
  return new TechgramWorldAdapter(
    worldFromContent(buildSeedContent(), nConcepts, "upsc-polity", "UPSC Polity (real frozen seed)"),
  );
}

export function cbseWorld(nConcepts = 6): TechgramWorldAdapter {
  return new TechgramWorldAdapter(
    worldFromContent(buildK12Content(), nConcepts, "cbse-8-science", "CBSE Class 8 Science (real frozen seed)"),
  );
}

/** Minimal Content skeleton so the frozen belief engine can run on ANY world. */
export function minimalContent(world: WorldConfig): Content {
  return {
    version: `minimal-${world.id}`,
    // The belief engine reads guessFloor from the exam spec — a world stub
    // must carry a sane exam geometry or observe() degrades to NaN.
    exam: { questions: 100, marksEach: 1, negativeFraction: 0, guessFloor: 0.2, cutoff: { mean: 50, sd: 10 }, attemptBreakEven: 0.25 },
    topics: [{ id: `t_${world.id}`, name: world.domainLabel, conceptIds: world.concepts.map((c) => c.id) }],
    concepts: world.concepts.map((c) => ({
      id: c.id, topicId: `t_${world.id}`, name: c.name,
      type: "concept" as const, prereqs: c.prereqs, confusableWith: [],
    })),
    items: [],
    topicById: new Map([[`t_${world.id}`, { id: `t_${world.id}`, name: world.domainLabel, conceptIds: world.concepts.map((c) => c.id) }]]),
    conceptById: new Map(world.concepts.map((c) => [c.id, { id: c.id, topicId: `t_${world.id}`, name: c.name, type: "concept" as const, prereqs: c.prereqs, confusableWith: [] }])),
    itemById: new Map(),
    itemsByConcept: new Map(world.concepts.map((c) => [c.id, []])),
    conceptWeight: world.priorWeights,
  } as unknown as Content;
}

export function syntheticChainWorld(): TechgramWorldAdapter {
  return new TechgramWorldAdapter(syntheticWorld("chain", 6, { chainDepth: 1, weightTail: "flat", label: "Synthetic A — prerequisite chain" }));
}
export function syntheticFlatWorld(): TechgramWorldAdapter {
  return new TechgramWorldAdapter(syntheticWorld("flat", 6, { chainDepth: 0, weightTail: "flat", label: "Synthetic B — flat, independent" }));
}
export function syntheticHeavyWorld(): TechgramWorldAdapter {
  return new TechgramWorldAdapter(syntheticWorld("heavy", 6, { chainDepth: 0, weightTail: "heavy", label: "Synthetic C — heavy-tailed exam weights" }));
}
export function syntheticSparseWorld(): TechgramWorldAdapter {
  return new TechgramWorldAdapter(syntheticWorld("sparse", 6, {
    chainDepth: 1, weightTail: "flat", noise: 0.2, label: "Synthetic D — sparse, noisy evidence",
    rule: { correctGain: 0.05, wrongGain: 0.01 },
  }));
}
