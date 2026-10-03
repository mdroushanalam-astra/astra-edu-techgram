/**
 * OWNERSHIP BOUNDARIES [Phase 0, corrected master roadmap §6.2].
 * No duplicate ownership. Each frozen organ owns exactly its domain of truth;
 * the cognitive layer owns only what the corrected roadmap assigns it.
 * ownershipConflicts() is the enforcement: an empty array = the map is clean.
 */

export interface Ownership {
  organ: string;
  owns: string[];
  contract: string;
}

export const OWNERSHIP: Ownership[] = [
  { organ: "Belief Engine (belief.ts)", owns: ["mastery beliefs", "mastery bands and uncertainty", "mastery calibration"], contract: "belief.ts" },
  { organ: "Memory Engine (memory.ts)", owns: ["forgetting/retrieval state", "stability and difficulty", "memory review scheduling"], contract: "memory.ts" },
  { organ: "AOM (aom.ts)", owns: ["action-outcome predictions", "prediction calibration for actions"], contract: "aom.ts" },
  { organ: "Behaviour Engine (behaviour.ts)", owns: ["observable behaviour hypotheses", "fatigue/frustration/momentum features", "load tolerance"], contract: "behaviour.ts" },
  { organ: "Personalisation (behaviour.ts + preference.ts)", owns: ["measured personalisation variables", "preference estimates"], contract: "behaviour.ts + preference.ts" },
  { organ: "Misconception Engine (diagnosis.ts)", owns: ["misconception tiers (candidate/probable/confirmed)"], contract: "diagnosis.ts" },
  { organ: "Event Fabric (events.ts)", owns: ["the append-only event log", "replay/determinism"], contract: "events.ts" },
  { organ: "Receipts (receipts.ts)", owns: ["decision provenance records"], contract: "receipts.ts" },
  { organ: "Ethics Wall (charter §2.6, ADR-023)", owns: ["governance boundaries"], contract: "charter" },
  { organ: "SelfModel (cognitive/)", owns: ["hypotheses about the system itself", "self-prediction records", "self-error ledger"], contract: "cognitive/contracts.ts" },
  { organ: "Prediction Registry (cognitive/)", owns: ["universal forecast records and outcomes"], contract: "cognitive/contracts.ts" },
  { organ: "Executive (cognitive/executive.ts)", owns: ["the current turn decision", "decision receipts for the turn"], contract: "cognitive/executive.ts" },
  { organ: "Workspace (cognitive/assemble.ts)", owns: ["the assembled per-moment cognitive context (a VIEW — owns no truth)"], contract: "cognitive/assemble.ts" },
];

/** The cognitive layer may never own these — they belong to the frozen organs. */
export const FORBIDDEN_COGNITIVE_OWNERSHIP = [
  "mastery beliefs", "mastery bands", "forgetting/retrieval state",
  "action-outcome predictions", "misconception tiers", "the append-only event log",
  "ground truth", "external evaluation",
];

/** Empty array = the ownership map is clean (no duplicate claims). */
export function ownershipConflicts(): string[] {
  const seen = new Map<string, string>();
  const conflicts: string[] = [];
  for (const o of OWNERSHIP) {
    for (const item of o.owns) {
      const key = item.toLowerCase();
      if (seen.has(key)) conflicts.push(`"${item}" claimed by both "${seen.get(key)}" and "${o.organ}"`);
      else seen.set(key, item);
    }
  }
  return conflicts;
}

/** The cognitive layer must never claim the forbidden domains. */
export function cognitiveOwnershipViolations(): string[] {
  const cognitive = OWNERSHIP.filter((o) => o.organ.startsWith("SelfModel") || o.organ.startsWith("Prediction Registry") || o.organ.startsWith("Executive") || o.organ.startsWith("Workspace"));
  const bad: string[] = [];
  for (const o of cognitive) {
    for (const item of o.owns) {
      const lower = item.toLowerCase();
      for (const f of FORBIDDEN_COGNITIVE_OWNERSHIP) {
        if (lower.includes(f.toLowerCase())) bad.push(`${o.organ} claims forbidden ownership: ${item}`);
      }
    }
  }
  return bad;
}
