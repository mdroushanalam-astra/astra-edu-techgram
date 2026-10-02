/**
 * SPRINT 0 — CLAIM PROVENANCE CONTRACT [ADR-032]
 * Every student-facing utterance is an evidence GRAPH. The multi-reference
 * rule (ChatGPT refinement, adopted): one honest sentence may combine an
 * event, a preference estimate, a planner decision and an atom — so
 * provenance is `evidenceRefs[]` + typed optional anchors, and
 * `validateUtterance` rejects anything that cannot show its work.
 * The kernel-adapter constructs these; UI components only consume.
 * Anti-fraud lint (CI): a component rendering a hardcoded student-claim
 * string fails the build.
 */

/** A pointer into kernel truth. `kind` names the organ; `id` locates the fact. */
export type EvidenceRef =
  | { kind: "atom"; id: string }
  | { kind: "receipt"; id: string }
  | { kind: "band"; conceptId: string }          // reportConcept output
  | { kind: "milestone"; id: string }
  | { kind: "template"; id: string }             // tier-4 template (kernel-authored phrasing)
  | { kind: "event"; id: string }                // student event id
  | { kind: "decision"; id: string }             // plan block / planner decision
  | { kind: "preference"; dimension: string; option: string }
  | { kind: "memory"; conceptId: string }        // memory cell (retrievability/stability)
  | { kind: "agency"; decision: string }         // agency observation
  | { kind: "mismatch"; id: string };            // predictionErrorStats / preference mismatch

/** Honest uncertainty — the UI renders this, never hides it. */
export interface UtteranceUncertainty {
  level: "known" | "grey" | "unknown";
  /** When known: the band behind the claim (0..1 mastery space). */
  band?: [number, number];
  /** Kernel-computed n_eff behind the claim, when applicable. */
  nEff?: number;
}

/** How the Presence Layer may express this utterance. Never invents content. */
export interface RenderingPolicy {
  tone: "warm" | "neutral" | "challenging" | "celebratory" | "calm";
  /** Session-truth energy mirroring: supplied by kernel-derived state, not mood invention. */
  energy: "low" | "medium" | "high";
  /** Humor allowed only when an authored variant exists AND kernel policy permits. */
  allowHumor: boolean;
  /** Board sync: element ids this utterance synchronizes with (cross-modal timing). */
  syncBoardElementIds?: string[];
}

/**
 * A student-facing utterance. Constructed ONLY by the kernel-adapter.
 * `validateUtterance` is the gate: no evidence refs → not renderable. Full stop.
 */
export interface Utterance {
  /** What the sentence IS semantically (greeting, reframe, receipt narration…). */
  semanticSource: string;
  /** Mandatory evidence graph — the sentence's receipts. */
  evidenceRefs: EvidenceRef[];
  /** The kernel decision this utterance expresses, when it expresses one. */
  decisionRef?: { kind: "decision"; id: string };
  /** The content atom being taught, when teaching. */
  contentRef?: { kind: "atom"; id: string };
  uncertainty: UtteranceUncertainty;
  policy: RenderingPolicy;
  /** Kernel-authored personality variant id (humor ledger candidate), if any. */
  authoredVariantId?: string;
}

export class ProvenanceError extends Error {}

/** The mechanical gate. A UI that bypasses this fails the constitution. */
export function validateUtterance(u: Utterance): void {
  if (!u.evidenceRefs || u.evidenceRefs.length === 0) {
    throw new ProvenanceError(
      `CLAIM-PROVENANCE VIOLATION: utterance '${u.semanticSource}' has no evidence refs — ` +
        `if the brain didn't produce it, the UI doesn't say it.`,
    );
  }
  if (u.uncertainty.level === "known" && u.uncertainty.band && u.uncertainty.band[0] > u.uncertainty.band[1]) {
    throw new ProvenanceError("Provenance error: known band is inverted.");
  }
  if (u.policy.allowHumor && !u.authoredVariantId) {
    throw new ProvenanceError(
      "Provenance error: humor requires an authored variant (no runtime-invented jokes).",
    );
  }
}
