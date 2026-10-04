/**
 * THE PHASE 5 EXPERIMENT RUNNER [ADR-043] — 30 scenarios, full cognitive stack,
 * matched baselines + structural proofs. Writes docs/PHASE5_EXPERIMENT_RESULTS.json.
 */
import { writeFileSync } from "node:fs";
import { runAllScenarios } from "../kernel/src/lab/phase5.js";

const t0 = Date.now();
const { results, summary } = runAllScenarios();
const elapsedMs = Date.now() - t0;

for (const r of results) {
  const flag = r.pass ? "PASS" : "FAIL";
  console.log(
    `${flag}  ${r.id.padEnd(26)} ${r.category.padEnd(11)} margin ${String(r.margin >= 0 ? "+" + r.margin : r.margin).padStart(3)}  ` +
    `exec ${String(r.executive.trueMarks).padStart(3)}/${String(r.linear.trueMarks).padEnd(3)} ` +
    `bErr ${r.executive.beliefError.toFixed(2)}/${r.linear.beliefError.toFixed(2)} ` +
    `selfErr ${String(r.executive.selfErrors).padStart(3)} utt ${String(r.executive.utterances).padStart(3)} sc ${String(r.executive.selfCorrections).padStart(2)} ` +
    `s4 ${r.executive.experimentsKept}k/${r.executive.experimentsRejected}r ` +
    `${r.notes.length ? " | " + r.notes.join("; ") : ""}`,
  );
}
console.log("\n===== SUMMARY =====");
console.log(JSON.stringify(summary, null, 2));
console.log(`elapsed: ${elapsedMs}ms`);

writeFileSync(
  new URL("../docs/PHASE5_EXPERIMENT_RESULTS.json", import.meta.url),
  JSON.stringify({ generated_at: new Date().toISOString(), model: "GLM-5.3-Flash (Z.ai) via ZCode", elapsedMs, summary, results }, null, 2),
);
console.log("wrote docs/PHASE5_EXPERIMENT_RESULTS.json");
