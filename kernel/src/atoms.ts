/**
 * ATOM CONTRACT [B0/B8] — pre-verified, versioned units of teaching content.
 * The Teacher renders atoms; it never invents correctness-critical facts.
 * Every atom carries provenance: who verified it, from what source, what
 * risk class it carries (facts = 100% human-verified; phrasing = sampled).
 *
 * Rendering tiers (the LLM is tier 3 and lives OUTSIDE the kernel):
 *   1. exact stored atom text   ← what this bank provides
 *   2. NLG template filling atom fields
 *   3. LLM paraphrase under fact-lock   (communication layer only)
 *   4. raw atom text
 */

export type AtomKind =
  | "explanation"
  | "example"
  | "common_mistake"
  | "hint_l1"
  | "hint_l2"
  | "hint_l3"
  | "contrast"
  | "encouragement";

export interface Atom {
  id: string;
  /** Concept this atom teaches (contrast atoms carry a pair instead). */
  conceptId?: string;
  /** Confusable pair for contrast atoms — [a, b] sorted. */
  pair?: [string, string];
  kind: AtomKind;
  body: string;
  lang: "en";
  verifiedBy: string;
  version: number;
  source: string;
  /** "fact" atoms are correctness-critical; "phrasing" atoms are style. */
  riskLevel: "fact" | "phrasing";
}

export interface AtomBank {
  version: string;
  atoms: Atom[];
  byId: Map<string, Atom>;
  byConceptKind: Map<string, Atom[]>; // `${conceptId}:${kind}` → atoms
  byPair: Map<string, Atom>; // `a|b` sorted → contrast atom
  byKind: Map<string, Atom[]>; // kind → atoms (for encouragements etc.)
}

export function assembleAtomBank(version: string, atoms: Atom[]): AtomBank {
  const byId = new Map<string, Atom>();
  const byConceptKind = new Map<string, Atom[]>();
  const byPair = new Map<string, Atom>();
  const byKind = new Map<string, Atom[]>();
  for (const a of atoms) {
    byId.set(a.id, a);
    if (a.conceptId) {
      const key = `${a.conceptId}:${a.kind}`;
      const arr = byConceptKind.get(key) ?? [];
      arr.push(a);
      byConceptKind.set(key, arr);
    }
    if (a.pair) {
      byPair.set(a.pair.join("|"), a);
    }
    const karr = byKind.get(a.kind) ?? [];
    karr.push(a);
    byKind.set(a.kind, karr);
  }
  return { version, atoms, byId, byConceptKind, byPair, byKind };
}

/** Fetch the highest-version atom for (concept, kind), or undefined. */
export function getAtom(bank: AtomBank, conceptId: string, kind: AtomKind): Atom | undefined {
  const arr = bank.byConceptKind.get(`${conceptId}:${kind}`);
  if (!arr || arr.length === 0) return undefined;
  return arr.reduce((best, a) => (a.version > best.version ? a : best), arr[0]!);
}

/** Fetch the contrast atom for a confusable pair (order-insensitive). */
export function getContrastAtom(bank: AtomBank, a: string, b: string): Atom | undefined {
  const key = [a, b].sort().join("|");
  return bank.byPair.get(key);
}

/** Generic encouragements are concept-independent; rotate deterministically. */
export function getEncouragement(bank: AtomBank, rotation: number): Atom | undefined {
  const arr = bank.byKind.get("encouragement");
  if (!arr || arr.length === 0) return undefined;
  return arr[rotation % arr.length];
}
