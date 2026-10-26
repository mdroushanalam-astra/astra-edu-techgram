/**
 * B7 — SESSION COMPOSER.
 *
 * Question it answers: GIVEN what the brain decided, what should this
 * 40-minute session actually contain?
 *
 * CRITICAL BOUNDARY: the composer creates ZERO new intelligence. It maps the
 * planner's blocks into an ordered segment template (retrieval warm-up →
 * teach/probe → practice → calibration+wrap), trims to the available minutes,
 * and preserves receipt lineage back to the plan block and its AOM
 * prediction. If a rule here looks like pedagogy policy, it is a LAYOUT rule
 * (order and shape), not a decision about what to teach — that stays with the
 * planner.
 *
 * The "40-minute session" is a default parameter, not a dogma.
 */

import type { Plan, PlanBlock } from "./planner.js";
import type { Receipt } from "./receipts.js";

export type SegmentKind =
  | "retrieval_warmup"
  | "teach"
  | "practice"
  | "probe"
  | "transfer"
  | "calibration_wrap";

export interface Segment {
  protocol?: "assessed-unit";
  id: string;
  kind: SegmentKind;
  conceptId: string;
  conceptName: string;
  minutes: number;
  /** Lineage: index into the source Plan.blocks. */
  sourceBlockIndex: number;
  /** The AOM prediction carried forward from the plan block. */
  prediction: PlanBlock["prediction"];
  objective: string;
}

export interface ComposedSession {
  day: number;
  segments: Segment[];
  totalMinutes: number;
  paramsVersion: string;
  /** Why this session: the plan-level receipt (session contract §5). */
  receipt: Receipt;
}

export interface ComposerParams {
  /** Segment templates in composition order. */
  version: string;
}

export const DEFAULT_COMPOSER_PARAMS: ComposerParams = {
  version: "composer-0.1.0",
};

/**
 * Map each plan block to a segment kind. Layout only — no re-decision.
 */
function kindFor(block: PlanBlock): SegmentKind {
  switch (block.action) {
    case "review": return "retrieval_warmup";
    case "learn": return "teach";
    case "remediate": return "teach";
    case "practice": return "practice";
    case "diagnose": return "probe";
    default: return "practice";
  }
}

/** Per-kind minute templates (the plan block's minutes are an upper bound). */
const SEGMENT_MINUTES: Record<SegmentKind, number> = {
  retrieval_warmup: 6,
  teach: 13,
  practice: 10,
  probe: 8,
  transfer: 5,
  calibration_wrap: 3,
};

const ORDER: SegmentKind[] = ["retrieval_warmup", "probe", "teach", "practice", "transfer", "calibration_wrap"];

export function composeSession(
  plan: Plan,
  minutesAvailable: number,
  params: ComposerParams = DEFAULT_COMPOSER_PARAMS,
  planReceipt?: Receipt,
): ComposedSession {
  interface Candidate {
    seg: Omit<Segment, "id">;
    kind: SegmentKind;
    /** Plan priority proxy: expectedGainMarks per minute (preserves planner order within kind). */
    priority: number;
    blockIndex: number;
  }
  const candidates: Candidate[] = [];
  plan.blocks.forEach((b, i) => {
    const kind = kindFor(b);
    const minutes = Math.min(SEGMENT_MINUTES[kind], b.minutes);
    candidates.push({
      kind,
      blockIndex: i,
      priority: b.gainPerMinute,
      seg: {
        kind,
        conceptId: b.conceptId,
        conceptName: b.conceptName,
        minutes,
        sourceBlockIndex: i,
        prediction: b.prediction,
        objective: objectiveFor(kind, b),
      },
    });
  });

  // Ordering: template order first; within the same kind, preserve the
  // planner's priority. Teach segments alternate with practice when both
  // exist (interleaving layout, learned-science default).
  const byKind = new Map<SegmentKind, Candidate[]>();
  for (const c of candidates) {
    const arr = byKind.get(c.kind) ?? [];
    arr.push(c);
    byKind.set(c.kind, arr);
  }
  for (const arr of byKind.values()) arr.sort((x, y) => y.priority - x.priority);

  const ordered: Candidate[] = [];
  for (const kind of ORDER) {
    if (kind === "transfer") continue; // V1: transfer folded into practice when time remains
    ordered.push(...(byKind.get(kind) ?? []));
  }
  // Interleave: after each teach segment, pull one practice if available.
  const teaches = ordered.filter((c) => c.kind === "teach");
  const practices = byKind.get("practice") ?? [];
  const interleaved: Candidate[] = [];
  let practiceIdx = 0;
  for (const c of ordered) {
    if (c.kind === "teach") {
      interleaved.push(c);
      if (practiceIdx < practices.length) interleaved.push(practices[practiceIdx++]);
    } else if (c.kind !== "practice") {
      interleaved.push(c);
    }
  }
  while (practiceIdx < practices.length) interleaved.push(practices[practiceIdx++]);

  // Trim to the available minutes (drop lowest-priority segments when over).
  let used = interleaved.reduce((a, c) => a + c.seg.minutes, 0);
  const kept = [...interleaved];
  const droppable = kept.filter((c) => c.kind !== "calibration_wrap");
  while (used > minutesAvailable && droppable.length > 0) {
    droppable.sort((x, y) => x.priority - y.priority); // lowest priority first
    const drop = droppable.shift()!;
    const idx = kept.indexOf(drop);
    if (idx >= 0) {
      kept.splice(idx, 1);
      used -= drop.seg.minutes;
    }
    if (kept.length <= 1) break;
  }

  // The calibration+wrap segment is a session TEMPLATE segment (from state
  // deltas, no new concept) — appended after trimming, never dropped.
  if (kept.length > 0 && minutesAvailable - used >= 3) {
    const anchor = kept[kept.length - 1]!;
    kept.push({
      kind: "calibration_wrap",
      blockIndex: anchor.blockIndex,
      priority: anchor.priority,
      seg: {
        kind: "calibration_wrap",
        conceptId: anchor.seg.conceptId,
        conceptName: anchor.seg.conceptName,
        minutes: Math.min(3, minutesAvailable - used),
        sourceBlockIndex: anchor.blockIndex,
        prediction: anchor.seg.prediction,
        objective: "Compare confidence with accuracy, summarise today's belief shifts",
      },
    });
    used += kept[kept.length - 1]!.seg.minutes;
  }

  // Scale the last content segment down if still slightly over.
  let over = used - minutesAvailable;
  if (over > 0 && kept.length > 1) {
    const last = kept[kept.length - 2]!; // keep the wrap intact
    const cut = Math.min(last.seg.minutes - 3, over);
    if (cut > 0) {
      last.seg.minutes -= cut;
      used -= cut;
    }
  }

  const segments: Segment[] = kept.map((c, i) => ({
    ...c.seg,
    id: `seg_d${plan.day}_${String(i + 1).padStart(2, "0")}_${c.kind}`,
  }));

  return {
    day: plan.day,
    segments,
    totalMinutes: segments.reduce((a, s) => a + s.minutes, 0),
    paramsVersion: params.version,
    /** Session contract §5: the session's "why" IS the plan's receipt (passed in by the caller). */
    receipt: planReceipt as Receipt,
  };
}

function objectiveFor(kind: SegmentKind, b: PlanBlock): string {
  switch (kind) {
    case "retrieval_warmup":
      return `Retrieve ${b.conceptName} before it decays further (protect exam-day recall)`;
    case "teach":
      return b.action === "remediate"
        ? `Rebuild the foundational deficit in ${b.conceptName} before returning to dependent topics`
        : `Move ${b.conceptName} from ${"unknown-ish"} toward evidenced mastery`;
    case "practice":
      return `Consolidate ${b.conceptName} under feedback (retrieval + immediate correction)`;
    case "probe":
      return `Resolve the unknown about ${b.conceptName} with the highest-information items`;
    case "transfer":
      return `Apply ${b.conceptName} in a fresh context (transfer check)`;
    case "calibration_wrap":
      return `Compare confidence with accuracy, summarise today's belief shifts`;
  }
}
