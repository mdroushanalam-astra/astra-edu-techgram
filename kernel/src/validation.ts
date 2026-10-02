/**
 * S3 — VALIDATION SURFACES [ADR-027/028].
 * Every feeling of validation the student gets must be earned from evidence
 * the brain actually holds. These generators produce template-ready output
 * from kernel state — the frontend renders, never invents.
 *
 * THE AGENCY GRADIENT: Techgram tells me → shows me → I understand why →
 * I can see it myself → I can act without Techgram.
 */

import type { BeliefModel, BeliefState } from "./belief.js";
import { reportConcept, expectedScore } from "./belief.js";
import type { StudentArtifact } from "./artifact.js";
import { earliestArtifactFor } from "./artifact.js";
import type { CuriosityState } from "./curiosity.js";
import type { PersonalisationState } from "./behaviour.js";

/* ------------------------------------------------------------------ */
/* Growth Receipt — "I'm getting better" backed by evidence            */
/* ------------------------------------------------------------------ */

export interface GrowthReceiptLine {
  conceptId: string;
  conceptName: string;
  baselineMean: number | null;
  currentMean: number;
  currentBand: [number, number];
  nEff: number;
  improvement: number | null; // null when no baseline
}

export interface GrowthReceipt {
  lines: GrowthReceiptLine[];
  summary: string;
  totalImproved: number;
  totalTracked: number;
}

/**
 * Compare the current belief state against a baseline (earlier state or
 * the prior). Only evidenced concepts (nEff ≥ 3) get lines — no fake
 * precision on grey concepts.
 */
export function growthReceipt(
  model: BeliefModel,
  current: BeliefState,
  baseline: BeliefState | null,
): GrowthReceipt {
  const lines: GrowthReceiptLine[] = [];
  for (let i = 0; i < model.N; i++) {
    const cid = model.byIdx[i]!;
    const cur = reportConcept(model, current, cid);
    if (cur.grey) continue;
    const baseMean = baseline
      ? reportConcept(model, baseline, cid).mean
      : null;
    const improvement = baseMean !== null ? cur.mean - baseMean : null;
    lines.push({
      conceptId: cid,
      conceptName: model.content.conceptById.get(cid)?.name ?? cid,
      baselineMean: baseMean,
      currentMean: cur.mean,
      currentBand: [cur.lo, cur.hi],
      nEff: cur.nEff,
      improvement,
    });
  }
  lines.sort((a, b) => (b.improvement ?? 0) - (a.improvement ?? 0));
  const totalImproved = lines.filter((l) => l.improvement !== null && l.improvement > 0.02).length;
  return {
    lines,
    summary: totalImproved > 0
      ? `${totalImproved} concepts improved with evidence — ${lines.length} tracked total.`
      : `${lines.length} concepts tracked; no measurable improvement yet — that's honest, not failure.`,
    totalImproved,
    totalTracked: lines.length,
  };
}

/* ------------------------------------------------------------------ */
/* Capability Journey — goal→capabilities→concepts (no "% toward IAS") */
/* ------------------------------------------------------------------ */

export interface CapabilityJourneyEntry {
  capability: string;
  meanMastery: number;
  band: [number, number];
  conceptsTracked: number;
  conceptsEvidenced: number;
  /** Evidence-backed statement of what the student can now do. */
  canDo: string | null;
}

export function capabilityJourney(
  model: BeliefModel,
  st: BeliefState,
  capGraph: { capability: string; conceptIds: string[] }[],
): CapabilityJourneyEntry[] {
  return capGraph.map(({ capability, conceptIds }) => {
    let sum = 0, lo = 1, hi = 0, tracked = 0, evidenced = 0;
    for (const cid of conceptIds) {
      const r = reportConcept(model, st, cid);
      sum += r.mean;
      lo = Math.min(lo, r.lo);
      hi = Math.max(hi, r.hi);
      tracked += 1;
      if (!r.grey) evidenced += 1;
    }
    const mean = tracked > 0 ? sum / tracked : 0;
    const canDo = evidenced >= 2 && mean >= 0.5
      ? `Can explain and apply ${capability.toLowerCase()} at ${fmt(mean)} level (evidence: ${evidenced}/${tracked} concepts)`
      : null;
    return {
      capability,
      meanMastery: mean,
      band: [lo, hi] as [number, number],
      conceptsTracked: tracked,
      conceptsEvidenced: evidenced,
      canDo,
    };
  });
}

function fmt(x: number): string { return `${(x * 100).toFixed(0)}%`; }

/* ------------------------------------------------------------------ */
/* Changed-My-Mind — the conceptual-change moment                      */
/* ------------------------------------------------------------------ */

export interface ChangedMyMind {
  conceptId: string;
  conceptName: string;
  thenBelief: number;
  nowBelief: number;
  shift: number;
  verdict: string;
}

/** Detect concepts where the belief shifted by more than `threshold`. */
export function changedMyMind(
  model: BeliefModel,
  before: BeliefState,
  after: BeliefState,
  threshold = 0.15,
): ChangedMyMind[] {
  const out: ChangedMyMind[] = [];
  for (let i = 0; i < model.N; i++) {
    const beforeM = sigmoidOf(before.mu[i]);
    const afterM = sigmoidOf(after.mu[i]);
    const shift = afterM - beforeM;
    if (Math.abs(shift) >= threshold) {
      const cid = model.byIdx[i]!;
      out.push({
        conceptId: cid,
        conceptName: model.content.conceptById.get(cid)?.name ?? cid,
        thenBelief: beforeM,
        nowBelief: afterM,
        shift,
        verdict: shift > 0
          ? "strengthened — the evidence moved you forward"
          : "weakened — the evidence corrected an overestimate",
      });
    }
  }
  return out.sort((a, b) => Math.abs(b.shift) - Math.abs(a.shift));
}

function sigmoidOf(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/* ------------------------------------------------------------------ */
/* Milestone scan — celebrate real cognitive achievements              */
/* ------------------------------------------------------------------ */

export type MilestoneType =
  | "first_independent_explanation"
  | "delayed_recall_success"
  | "misconception_resolved"
  | "transfer_success"
  | "self_correction"
  | "first_independent_decision";

export interface Milestone {
  type: MilestoneType;
  conceptId: string;
  description: string;
  day: number;
}

/**
 * Scan the session's evidence for milestone-level achievements.
 * Each type fires at most once per scan — quality over quantity.
 */
export function scanMilestones(
  model: BeliefModel,
  st: BeliefState,
  artifacts: StudentArtifact[],
  events: { type: string; payload: Record<string, unknown>; day: number }[],
): Milestone[] {
  const milestones: Milestone[] = [];
  const seen = new Set<MilestoneType>();

  // First independent explanation (an artifact of type explanation)
  const expl = artifacts.find((a) => a.type === "explanation");
  if (expl && !seen.has("first_independent_explanation")) {
    seen.add("first_independent_explanation");
    milestones.push({
      type: "first_independent_explanation",
      conceptId: expl.conceptIds[0] ?? "",
      description: "First time you explained a concept without help.",
      day: expl.day,
    });
  }

  // Delayed recall success (review_completed with correct=true, gap ≥ 3 days)
  const reviews = events.filter((e) => e.type === "review_completed" && e.payload.correct === true);
  for (const r of reviews) {
    const cid = String(r.payload.concept_id ?? "");
    const rep = reportConcept(model, st, cid);
    if (rep.lastObservedDay >= 0 && r.day - rep.lastObservedDay >= 3 && !seen.has("delayed_recall_success")) {
      seen.add("delayed_recall_success");
      milestones.push({
        type: "delayed_recall_success",
        conceptId: cid,
        description: "You remembered this concept after a delay — that's durable learning.",
        day: r.day,
      });
      break; // one per scan
    }
  }

  // Transfer success (transfer/application answered correctly first try)
  const transfers = events.filter((e) =>
    e.type === "item_response" && e.payload.correct === true && e.payload.transfer === true);
  if (transfers.length > 0 && !seen.has("transfer_success")) {
    seen.add("transfer_success");
    milestones.push({
      type: "transfer_success",
      conceptId: String(transfers[0]!.payload.concept_id ?? ""),
      description: "You applied a concept to a completely new scenario.",
      day: transfers[0]!.day,
    });
  }

  // First independent decision [ADR-030]: the student led a learning decision
  // themselves (agency_observed, decided_independently) — Layer 4 evidence.
  const indep = events.find((e) => e.type === "agency_observed" && e.payload.mode === "decided_independently");
  if (indep && !seen.has("first_independent_decision")) {
    seen.add("first_independent_decision");
    milestones.push({
      type: "first_independent_decision",
      conceptId: String(indep.payload.concept_id ?? ""),
      description: "First learning decision you made on your own — Techgram checked it with you, not for you.",
      day: indep.day,
    });
  }

  return milestones;
}

/* ------------------------------------------------------------------ */
/* Curiosity Ledger — the student's own questions drive the curriculum */
/* ------------------------------------------------------------------ */

export function curiosityLedger(curiosity: CuriosityState): {
  open: { question: string; conceptIds: string[] }[];
  resolved: { question: string }[];
  note: string;
} {
  const open = curiosity.questions.filter((q) => q.status === "unresolved")
    .map((q) => ({ question: q.question, conceptIds: q.conceptIds }));
  const resolved = curiosity.questions.filter((q) => q.status === "answered")
    .map((q) => ({ question: q.question }));
  return {
    open,
    resolved,
    note: open.length > 0
      ? `${open.length} open question(s) — your curiosity is driving the curriculum.`
      : "No open questions yet — they'll come as you learn.",
  };
}
