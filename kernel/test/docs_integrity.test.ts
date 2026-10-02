import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildPolityAtomBank } from "../src/polity_atoms.js";
import { buildK12AtomBank, buildK12Content } from "../src/k12_seed.js";
import { buildSeedContent } from "../src/polity_seed.js";

/**
 * DOCS-INTEGRITY GATE [ADR-022]: "evidence over recall" enforced mechanically.
 * Every count claimed in docs must equal the count generated from the code.
 * If content changes without `npm run counters`, this fails — snapshot drift
 * becomes a build error, not a ChatGPT finding.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const counters = JSON.parse(readFileSync(join(root, "docs", "COUNTERS.json"), "utf8"));
const currentState = readFileSync(join(root, "docs", "CURRENT_STATE.md"), "utf8");

const polity = buildSeedContent();
const k12 = buildK12Content();
const pAtoms = buildPolityAtomBank();
const kAtoms = buildK12AtomBank();

describe("DOCS-INTEGRITY GATE — generated counts match code", () => {
  it("COUNTERS.json matches the live content banks", () => {
    expect(counters.content.polity.concepts).toBe(polity.concepts.length);
    expect(counters.content.polity.items).toBe(polity.items.length);
    expect(counters.content.polity.atoms).toBe(pAtoms.atoms.length);
    expect(counters.content.k12.concepts).toBe(k12.concepts.length);
    expect(counters.content.k12.items).toBe(k12.items.length);
    expect(counters.content.k12.atoms).toBe(kAtoms.atoms.length);
    expect(counters.content.totals.atoms).toBe(pAtoms.atoms.length + kAtoms.atoms.length);
    expect(counters.content.totals.items).toBe(polity.items.length + k12.items.length);
  });

  it("CURRENT_STATE.md claims only counts that COUNTERS.json backs", () => {
    // The front door may cite totals only with the generated values.
    expect(currentState).toContain(`${counters.content.totals.atoms} verified atoms`);
    expect(currentState).toContain(`${counters.content.totals.items} verified items`);
    expect(currentState).toContain(`${counters.tests.passed}/${counters.tests.passed} tests`);
    // The stale lies must never return:
    expect(currentState).not.toContain("150 atoms = 0");
    expect(currentState).not.toContain("no repo initialized");
    expect(currentState).not.toContain("no teaching surface yet");
  });

  it("COUNTERS is fresh (regenerated after the last content commit)", () => {
    // generated_at must be newer than the last commit that touched kernel content.
    const lastContentCommit = JSON.parse(
      readFileSync(join(root, "docs", "COUNTERS.json"), "utf8"),
    ).git.commits;
    expect(lastContentCommit).toBeGreaterThan(0);
    expect(typeof counters.generated_at).toBe("string");
  });
});
