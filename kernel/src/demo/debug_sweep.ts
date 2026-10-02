/** Sweep: techgram vs baselines across horizons and archetypes. */
import { buildSeedContent } from "../polity_seed.js";
import { buildBeliefModel, DEFAULT_BELIEF_PARAMS } from "../belief.js";
import { DEFAULT_MEMORY_PARAMS } from "../memory.js";
import { aggregate } from "../lab.js";

const content = buildSeedContent();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });

for (const days of [30, 45, 60]) {
  const agg = aggregate(model, days, 4, 31000 + days, ["techgram", "fixed_order", "random"]);
  const t = agg.techgram, f = agg.fixed_order, r = agg.random;
  console.log(
    `${days}d: techgram ${t.meanMarks.toFixed(1)} (pass ${(t.meanPass * 100).toFixed(0)}%, calib ${(t.meanCalibration! * 100).toFixed(1)}) | fixed ${f.meanMarks.toFixed(1)} | random ${r.meanMarks.toFixed(1)} | lift vs fixed ${(t.meanMarks - f.meanMarks).toFixed(1)}, vs random ${(t.meanMarks - r.meanMarks).toFixed(1)}`,
  );
}
