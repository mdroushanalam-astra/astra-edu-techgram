/**
 * GENERATE docs/COUNTERS.json — the single source of every count in our docs.
 * Numbers in prose must reference this file, never memory. [ADR-022]
 * Run: npm run counters
 */
import { writeFileSync, readFileSync, mkdtempSync, unlinkSync, rmdirSync, existsSync } from "node:fs";
import { execSync, execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { buildPolityAtomBank } from "../kernel/src/polity_atoms.js";
import { buildK12AtomBank, buildK12Content } from "../kernel/src/k12_seed.js";
import { buildGeomorphologyContent } from "../kernel/src/geo_seed.js";
import { geographyPack } from "../content/geography.generated.js";
import { geographyUnits } from "../content/geography-units.generated.js";
import { buildSeedContent } from "../kernel/src/polity_seed.js";

const polity = buildSeedContent();
const k12 = buildK12Content();
const pAtoms = buildPolityAtomBank();
const kAtoms = buildK12AtomBank();
const root = fileURLToPath(new URL("../", import.meta.url));
const reportDir = mkdtempSync(join(tmpdir(), "techgram-counters-"));
function measureTests(workspace: string) {
  const require = createRequire(join(root, workspace, "package.json"));
  const cli = join(dirname(require.resolve("vitest/package.json")), "vitest.mjs");
  const report = join(reportDir, `${workspace.replaceAll("/", "-")}.json`);
  try {
    execFileSync(process.execPath, [cli, "run", "--reporter=json", "--outputFile", report], {cwd: join(root, workspace), encoding: "utf8"});
  } catch (error) { throw new Error(`Cannot publish passing counters: ${workspace} tests failed`, {cause: error}); }
  const results = JSON.parse(readFileSync(report, "utf8"));
  if (!results.success || results.numFailedTests !== 0) throw new Error(`${workspace} report is not green`);
  return {passed: results.numPassedTests, failed: results.numFailedTests, files: results.testResults.length};
}
let kernelTests, webTests;
try {kernelTests = measureTests("kernel"); webTests = measureTests("apps/web");}
finally {
  for (const workspace of ["kernel", "apps/web"]) {const report = join(reportDir, `${workspace.replaceAll("/", "-")}.json`);if (existsSync(report)) unlinkSync(report);}
  rmdirSync(reportDir);
}

const counters = {
  generated_at: new Date().toISOString(),
  tests: { passed: kernelTests.passed + webTests.passed, failed: 0, files: kernelTests.files + webTests.files, split: {kernel: kernelTests, web: webTests} },
  content: {
    polity: { topics: polity.topics.length, concepts: polity.concepts.length, items: polity.items.length, atoms: pAtoms.atoms.length },
    k12: { topics: k12.topics.length, concepts: k12.concepts.length, items: k12.items.length, atoms: kAtoms.atoms.length },
    geography: { topics: buildGeomorphologyContent().topics.length, concepts: buildGeomorphologyContent().concepts.length, items: buildGeomorphologyContent().items.length, atoms: geographyPack.atoms.length, status: "seed; expert review pending" },
    geography_reference: { source_lines: JSON.parse(readFileSync("content/geography-reference.inventory.json", "utf8")).line_count, indexed_sections: JSON.parse(readFileSync("content/geography-reference.inventory.json", "utf8")).indexed_sections, assessment_ready: false },
    geography_units: { version: geographyUnits.version, units: geographyUnits.units.length, concepts: geographyUnits.concepts.length,
      items: geographyUnits.items.length, atoms: geographyUnits.atoms.length, status: geographyUnits.status },
    totals_scope: "Historical Polity/K12 scope; Geography counted separately",
    totals: {
      topics: polity.topics.length + k12.topics.length,
      concepts: polity.concepts.length + k12.concepts.length,
      items: polity.items.length + k12.items.length,
      atoms: pAtoms.atoms.length + kAtoms.atoms.length,
    },
  },
  git: {
    commits: Number(execSync("git rev-list --count HEAD", { encoding: "utf8" }).trim()),
    head: execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim(),
  },
};

writeFileSync("docs/COUNTERS.json", JSON.stringify(counters, null, 2) + "\n");
console.log(JSON.stringify(counters.content.totals), "tests:", counters.tests.passed, "commits:", counters.git.commits, "head:", counters.git.head);
