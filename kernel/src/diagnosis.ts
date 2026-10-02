/**
 * B10 — Diagnosis + Misconception Engine. [ADR-019 tiers]
 *
 * Two jobs, both deterministic, both evidence-driven:
 *
 * 1. MISCONCEPTIONS: every wrong answer on a tagged distractor increments a
 *    per-student Beta-style counter for that misconception (sure+wrong ×2).
 *    Three tiers — never a jump to remediation on thin evidence:
 *      CANDIDATE  (n ≥ 1)                      → investigate
 *      PROBABLE   (n ≥ 3, consistent)          → targeted probe
 *      CONFIRMED  (n ≥ 3, sure-wrong ≥ 2)      → CONTRAST + targeted items
 *
 * 2. ROOT-CAUSE SUSPECTS: when a concept fails, rank its prerequisites by
 *    suspect score = (1 − σ(μ_p)) · posterior-correlation(p, c). A suspect
 *    with HIGH uncertainty → diagnostic probe first; with LOW uncertainty →
 *    remediate first. [PORT of the prototype's bottleneck insight, now
 *    posterior-correlation driven]
 */

import type { Item } from "./content.js";
import type { BeliefModel, BeliefState } from "./belief.js";
import { reportConcept } from "./belief.js";

// ---------------------------------------------------------------------------
// Misconceptions
// ---------------------------------------------------------------------------

export interface MisconceptionCell {
  /** Wrong answers that picked this misconception's distractor. */
  hits: number;
  /** Of those, how many were answered with maximal self-reported confidence. */
  sureWrong: number;
  /** Total records (hits) — alias kept for clarity in tiers. */
  n: number;
}

export type MisconceptionTier = "candidate" | "probable" | "confirmed";

export interface MisconceptionState {
  byId: Record<string, MisconceptionCell>;
}

export function newMisconceptionState(): MisconceptionState {
  return { byId: {} };
}

export function copyMisconceptionState(s: MisconceptionState): MisconceptionState {
  const byId: Record<string, MisconceptionCell> = {};
  for (const [k, v] of Object.entries(s.byId)) byId[k] = { ...v };
  return { byId };
}

/**
 * Evidence contract for misconceptions: a wrong answer whose CHOSEN option
 * carries a misconception tag. Confidence 3 (sure) counts double — the
 * "sure + wrong" signature is the strongest misconception signal we have.
 */
export function updateMisconception(
  st: MisconceptionState,
  item: Item,
  chosenOption: number,
  correct: boolean,
  confidence?: number,
): void {
  if (correct) return;
  const mid = item.distractorTags[chosenOption];
  if (!mid) return;
  const cell = st.byId[mid] ?? { hits: 0, sureWrong: 0, n: 0 };
  cell.hits += 1;
  cell.n += 1;
  if (confidence === 3) cell.sureWrong += 1;
  st.byId[mid] = cell;
}

/** Tier for one misconception, per ADR-019. null = no signal. */
export function misconceptionTier(s: MisconceptionState, id: string): MisconceptionTier | null {
  const c = s.byId[id];
  if (!c || c.n < 1) return null;
  if (c.n >= 3 && c.sureWrong >= 2) return "confirmed";
  if (c.n >= 3) return "probable";
  return "candidate";
}

/** All misconceptions at tier `confirmed` (the only tier the Teacher acts on). */
export function confirmedMisconceptions(s: MisconceptionState): { id: string; cell: MisconceptionCell }[] {
  return Object.entries(s.byId)
    .filter(([id]) => misconceptionTier(s, id) === "confirmed")
    .map(([id, cell]) => ({ id, cell }))
    .sort((a, b) => b.cell.n - a.cell.n);
}

// ---------------------------------------------------------------------------
// Root-cause suspects (prerequisite traversal)
// ---------------------------------------------------------------------------

export interface RootCauseSuspect {
  prereqId: string;
  prereqName: string;
  /** suspect = (1 − σ(μ_p)) · corr_post(p, c), in [0, 1]. */
  suspect: number;
  /** Posterior correlation between prereq and failing concept. */
  corr: number;
  /** True when the prereq itself is uncertain → probe before remediating. */
  uncertain: boolean;
}

/**
 * For a failing concept c, rank its prerequisites as root-cause suspects.
 * Uses the belief engine's covariance: corr_post = Σ_pc / √(Σ_pp·Σ_cc).
 */
export function rootCauseSuspects(model: BeliefModel, st: BeliefState, conceptId: string): RootCauseSuspect[] {
  const ci = model.index.get(conceptId);
  if (ci === undefined) return [];
  const concept = model.content.conceptById.get(conceptId)!;
  const N = model.N;
  const Scc = Math.max(st.S[ci * N + ci], 1e-9);
  const out: RootCauseSuspect[] = [];
  for (const pid of concept.prereqs) {
    const pi = model.index.get(pid);
    if (pi === undefined) continue;
    const Spp = Math.max(st.S[pi * N + pi], 1e-9);
    const Spc = st.S[pi * N + ci];
    const corr = Math.max(-1, Math.min(1, Spc / Math.sqrt(Spp * Scc)));
    const mastery = sigmoidOf(st.mu[pi]);
    const suspect = Math.max(0, (1 - mastery) * corr);
    const rep = reportConcept(model, st, pid);
    out.push({
      prereqId: pid,
      prereqName: model.content.conceptById.get(pid)?.name ?? pid,
      suspect,
      corr,
      uncertain: rep.grey || rep.hi - rep.lo > 0.5,
    });
  }
  return out.sort((a, b) => b.suspect - a.suspect);
}

function sigmoidOf(x: number): number {
  return 1 / (1 + Math.exp(-x));
}
