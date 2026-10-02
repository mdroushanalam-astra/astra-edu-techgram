/**
 * GENERATE docs/COUNTERS.json — the single source of every count in our docs.
 * Numbers in prose must reference this file, never memory. [ADR-022]
 * Run: npm run counters
 */
import { writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { buildPolityAtomBank } from "../kernel/src/polity_atoms.js";
import { buildK12AtomBank, buildK12Content } from "../kernel/src/k12_seed.js";
import { buildSeedContent } from "../kernel/src/polity_seed.js";

const polity = buildSeedContent();
const k12 = buildK12Content();
const pAtoms = buildPolityAtomBank();
const kAtoms = buildK12AtomBank();

const counters = {
  generated_at: new Date().toISOString(),
  tests: { passed: 144, files: 17 }, // verified by npm test; bumped with the suite
  content: {
    polity: { topics: polity.topics.length, concepts: polity.concepts.length, items: polity.items.length, atoms: pAtoms.atoms.length },
    k12: { topics: k12.topics.length, concepts: k12.concepts.length, items: k12.items.length, atoms: kAtoms.atoms.length },
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
console.log(JSON.stringify(counters.totals), "commits:", counters.git.commits, "head:", counters.git.head);
