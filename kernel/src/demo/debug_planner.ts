/** Debug instrumentation: why does the planner trail baselines? */
import { buildSeedContent } from "../polity_seed.js";
import { buildBeliefModel, DEFAULT_BELIEF_PARAMS } from "../belief.js";
import { DEFAULT_MEMORY_PARAMS } from "../memory.js";
import { runSim, trueExamMarks, makeSimStudent, type SimConfig } from "../lab.js";

const content = buildSeedContent();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });

function stats(seed: number, policy: "techgram" | "fixed_order" | "random") {
  const cfg: SimConfig = { seed, archetype: "consistent", days: 30, minutesPerDay: 240, truthShares: [0.25, 0.25, 0.15, 0.35] };
  const base = makeSimStudent(model, cfg);
  const r = runSim(model, cfg, policy);
  const studied = new Set<number>();
  let totalThetaGain = 0;
  for (let i = 0; i < model.N; i++) {
    totalThetaGain += r.finalTheta[i] - base.theta[i];
  }
  // coverage: concepts touched at all
  for (let i = 0; i < model.N; i++) {
    if (r.finalTheta[i] > base.theta[i] + 0.02) studied.add(i);
  }
  const initial = trueExamMarks(model, base);
  console.log(
    `${policy.padEnd(12)} marks=${r.examMarks.toFixed(1)} (start ${initial.toFixed(1)}) gain=${(r.examMarks - initial).toFixed(1)}  concepts-touched=${studied.size}/${model.N}  Σθgain=${totalThetaGain.toFixed(2)}`,
  );
}

for (const seed of [555]) {
  console.log(`--- seed ${seed} ---`);
  stats(seed, "techgram");
  stats(seed, "fixed_order");
  stats(seed, "random");
}

// Print the first 5 days of techgram plans + action tally over 30 days.
(globalThis as Record<string, unknown>).__TECHGRAM_DEBUG__ = true;
const cfg2: SimConfig = { seed: 555, archetype: "consistent", days: 30, minutesPerDay: 240, truthShares: [0.25, 0.25, 0.15, 0.35] };
const tally: Record<string, number> = {};
let plannedDays = 0;
runSim(model, cfg2, "techgram", {
  onPlan: (day, plan) => {
    plannedDays++;
    const p = plan as typeof plan & { _dbg?: { poolTop: string; dueReviewCount: number; minReview: number; chosenTop: string; sameObject: boolean } };
    if (day === 6 || day === 8) {
      console.log(`\n== runSim day ${day} plan (${plan.totalMinutes}m, ${plan.blocks.length} blocks) ==`);
      console.log(`dbg: ${JSON.stringify(p._dbg)}`);
      console.log(`blocks: ${plan.blocks.map((b) => `${b.action.slice(0, 4)}:${b.conceptName.slice(0, 14)}`).join(" | ")}`);
    }
    for (const b of plan.blocks) tally[b.action] = (tally[b.action] ?? 0) + 1;
  },
});
console.log(`planned days: ${plannedDays}, block tally:`, tally);
