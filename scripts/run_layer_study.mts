/**
 * THE LAYER INTERACTION STUDY RUNNER [ADR-045] — 24 real-time student
 * situations, per-turn per-layer traces + ablations.
 * Writes docs/LAYER_STUDY_RESULTS.json.
 */
import { writeFileSync } from "node:fs";
import { runLayerStudy } from "../kernel/src/lab/layer-trace.js";

const t0 = Date.now();
const { results, aggregate } = runLayerStudy();

for (const r of results) {
  console.log(
    `${r.id} ${r.name.padEnd(28)} | marks ${String(r.marks.executive).padStart(3)}/${String(r.marks.linear).padEnd(3)} (${r.marks.margin >= 0 ? "+" : ""}${r.marks.margin}) ` +
    `| acc ${(r.accuracy.executive * 100).toFixed(0)}/${(r.accuracy.linear * 100).toFixed(0)}% ` +
    `| bErr ${r.beliefError.executive.toFixed(2)}/${r.beliefError.linear.toFixed(2)} ` +
    `| selfErr ${String(r.selfErrors).padStart(3)} dev ${(r.deviationPct * 100).toFixed(0)}% ` +
    `| ablate: selfModel ${String(r.ablation.noSelfModel).padStart(2)}% linear ${String(r.ablation.linear).padStart(2)}% wall ${String(r.ablation.noWall).padStart(2)}%`,
  );
}
console.log("\n===== AGGREGATE =====");
console.log(JSON.stringify(aggregate, null, 2));
console.log(`elapsed: ${Date.now() - t0}ms`);

writeFileSync(
  new URL("../docs/LAYER_STUDY_RESULTS.json", import.meta.url),
  JSON.stringify({ generated_at: new Date().toISOString(), model: "GLM-5.3-Flash (Z.ai) via ZCode", aggregate, results }, null, 2),
);
console.log("wrote docs/LAYER_STUDY_RESULTS.json");
