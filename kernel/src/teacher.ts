/**
 * B8 — THE TEACHER (scripted pedagogical state machine).
 *
 * Question it answers: GIVEN the current teaching situation, how should this
 * content be delivered?
 *
 * ARCHITECTURAL LAW (ADR-014 point 17-18): THE MOVE IS THE INTELLIGENCE; THE
 * SENTENCE IS DECORATION. The teacher selects from a finite move vocabulary
 * using the brain's state; it renders moves from VERIFIED ATOMS (tier 1) or
 * templates (tier 2) or raw atom text (tier 4). The LLM paraphrase tier lives
 * in the communication layer OUTSIDE this kernel and is optional.
 *
 * The teacher NEVER re-decides what to teach (that is planner → composer);
 * it decides how to deliver the assigned segment and what evidence to collect.
 * Every move carries a receipt-grade `why` and declares the evidence it will
 * generate — the evidence contract of the closed loop.
 */

import type { Item } from "./content.js";
import type { BeliefModel, BeliefState } from "./belief.js";
import { reportConcept } from "./belief.js";
import type { Segment } from "./composer.js";
import type { Atom, AtomBank } from "./atoms.js";
import { getAtom, getContrastAtom, getEncouragement } from "./atoms.js";
import {
  confirmedMisconceptions, misconceptionTier, rootCauseSuspects,
  type MisconceptionState,
} from "./diagnosis.js";

export type TeacherMoveId =
  | "DIAGNOSTIC_PROBE"
  | "EXPLAIN"
  | "WORKED_EXAMPLE"
  | "FADE_EXAMPLE"
  | "RETRIEVAL_PROMPT"
  | "HINT_L1"
  | "HINT_L2"
  | "HINT_L3"
  | "CONTRAST"
  | "SELF_EXPLAIN_PROMPT"
  | "TRANSFER_ITEM"
  | "CALIBRATION_PROMPT"
  | "ENCOURAGE_REFRAME"
  | "SUMMARISE_CLOSE";

/** Evidence contract: what the move expects from the student. */
export type ExpectedEvidence =
  | { kind: "item_response"; itemId: string; hintsAllowed: false }
  | { kind: "item_response"; itemId: string; hintsAllowed: true }
  | { kind: "confidence_report" }
  | { kind: "none" };

export interface TeachingMove {
  move: TeacherMoveId;
  segmentId: string;
  conceptId: string;
  /** Rendered utterance (tier 1/2/4 — deterministic; the LLM tier is external). */
  utterance: string;
  atomId?: string;
  item?: Item;
  options?: string[];
  expectEvidence: ExpectedEvidence;
  /** Receipt-grade reason: why THIS move, NOW. */
  why: string;
  /** Budgetary minutes this move consumes (drives segment end). */
  minutes: number;
}

export interface TeacherState {
  segmentIndex: number;
  moveCount: number;
  /** Consecutive wrong answers in the current segment. */
  wrongStreak: number;
  correctStreak: number;
  /** Hint ladder depth for the current item (0 = no hint yet). */
  hintLevel: number;
  /** Highest hint level already SHOWN for the active item (each level shows once). */
  hintShownLevel: number;
  /** Wrong attempts on the ACTIVE item — drives the hint ladder depth. */
  activeItemWrongs: number;
  /** Current item awaiting a response (retry semantics after hints). */
  activeItem?: Item;
  /** Moves executed for the current segment (by id, for the transcript). */
  segmentMoveLog: TeacherMoveId[];
  /** Minutes consumed in the current segment. */
  segmentMinutesSpent: number;
  /** Retrieval successes in the current segment (of attempts). */
  retrievalCorrect: number;
  retrievalAttempts: number;
  lastOutcome?: "correct" | "wrong";
  /** Rotate deterministically through encouragement variants. */
  encouragementRotation: number;
}

export function startTeacherSession(): TeacherState {
  return {
    segmentIndex: 0,
    moveCount: 0,
    wrongStreak: 0,
    correctStreak: 0,
    hintLevel: 0,
    hintShownLevel: 0,
    activeItemWrongs: 0,
    segmentMoveLog: [],
    segmentMinutesSpent: 0,
    retrievalCorrect: 0,
    retrievalAttempts: 0,
    encouragementRotation: 0,
  };
}

function itemsFor(model: BeliefModel, conceptId: string): Item[] {
  return model.content.itemsByConcept.get(conceptId) ?? [];
}

function pickItem(model: BeliefModel, conceptId: string, used: Set<string>): Item | undefined {
  const items = itemsFor(model, conceptId);
  if (items.length === 0) return undefined;
  // Prefer unseen items; a concept with few items may re-serve seen ones —
  // the answer was never revealed, and spaced re-retrieval is legitimate.
  const fresh = items.filter((i) => !used.has(i.id));
  const pool = fresh.length > 0 ? fresh : items;
  const sorted = [...pool].sort((a, b) => Math.abs(3 - a.difficulty) - Math.abs(3 - b.difficulty) || a.id.localeCompare(b.id));
  return sorted[0];
}

/**
 * The move-selection rule table (deterministic policy — v2x §10.2, trimmed to
 * what V1's evidence channels can support). Segment-kind aware.
 */
export function nextMove(
  model: BeliefModel,
  st: BeliefState,
  mis: MisconceptionState,
  teacher: TeacherState,
  session: { segments: Segment[] },
  bank: AtomBank,
): TeachingMove | null {
  const segment = session.segments[teacher.segmentIndex];
  if (!segment) return null;

  // Segment budget exhausted → close and advance.
  if (teacher.segmentMinutesSpent >= segment.minutes) {
    return closeSegment(model, st, teacher, session, bank);
  }

  const rep = reportConcept(model, st, segment.conceptId);
  const concept = model.content.conceptById.get(segment.conceptId)!;

  // ---- segment-kind entry flows ----
  if (segment.kind === "probe" || (segment.kind === "teach" && (rep.grey || teacher.segmentMoveLog.length === 0 && rep.grey))) {
    if (teacher.segmentMoveLog.length < 2 && rep.grey) {
      const item = pickItem(model, segment.conceptId, usedItems(teacher));
      if (item) return move("DIAGNOSTIC_PROBE", segment, item, teacher,
        `Unknown-ish concept (n_eff ${rep.nEff.toFixed(1)}) — measure before teaching`, 2,
        { kind: "item_response", itemId: item.id, hintsAllowed: false });
    }
    if (segment.kind === "probe") {
      // probe segments end after their 2 items
      return closeSegment(model, st, teacher, session, bank);
    }
  }

  if (segment.kind === "retrieval_warmup") {
    const item = pickItem(model, segment.conceptId, usedItems(teacher));
    if (item && teacher.segmentMinutesSpent < segment.minutes) {
      return move("RETRIEVAL_PROMPT", segment, item, teacher,
        `Due-review retrieval, no hints (protects ${wOf(model, segment.conceptId).toFixed(1)} expected questions)`, 2,
        { kind: "item_response", itemId: item.id, hintsAllowed: false });
    }
    return closeSegment(model, st, teacher, session, bank);
  }

  // ---- teach flow ----
  if (segment.kind === "teach") {
    // 1. After the probe: EXPLAIN from the atom.
    if (!teacher.segmentMoveLog.includes("EXPLAIN") && teacher.segmentMoveLog.filter((m) => m === "DIAGNOSTIC_PROBE").length >= 0) {
      const atom = getAtom(bank, segment.conceptId, "explanation");
      if (atom && !teacher.segmentMoveLog.includes("EXPLAIN")) {
        return move("EXPLAIN", segment, undefined, teacher,
          `First exposure or rebuild — verified atom ${atom.id}`, 4, { kind: "none" }, atom);
      }
    }
    // 2. Hint ladder FIRST when the student just missed (fading, on the ACTIVE item).
    // Fires only once EXPLAIN has happened (probes are measurement and never
    // hint; practice segments have their own ladder). Depth = wrongs on the
    // ACTIVE item; each of the three levels shows at most once, then the
    // worked example takes over.
    if (
      teacher.lastOutcome === "wrong" && teacher.activeItem &&
      teacher.segmentMoveLog.includes("EXPLAIN") &&
      Math.min(teacher.activeItemWrongs, 3) > teacher.hintShownLevel
    ) {
      const level = Math.min(teacher.activeItemWrongs, 3) as 1 | 2 | 3;
      const atom = getAtom(bank, segment.conceptId, (`hint_l${level}` as "hint_l1" | "hint_l2" | "hint_l3"));
      if (atom) {
        return move((`HINT_L${level}` as "HINT_L1" | "HINT_L2" | "HINT_L3"), segment, teacher.activeItem, teacher,
          `Wrong answer — hint ladder level ${level} (fading, from atom ${atom.id})`, 1,
          { kind: "item_response", itemId: teacher.activeItem.id, hintsAllowed: true }, atom);
      }
    }
    // 3. Confirmed misconception → CONTRAST (the misconception engine's output).
    for (const { id } of confirmedMisconceptions(mis)) {
      const item = itemsFor(model, segment.conceptId).find((i) => Object.values(i.distractorTags).includes(id));
      if (item) {
        const other = id.includes("19_21") ? ["c_fr_19", "c_fr_21"] : null;
        void other;
        const pair = contrastPairFor(model, segment.conceptId);
        const atom = pair ? getContrastAtom(bank, pair[0], pair[1]) : undefined;
        if (atom) {
          return move("CONTRAST", segment, undefined, teacher,
            `Confirmed misconception ${id} (n=${mis.byId[id]?.n}) — contrast the confusable pair`, 3, { kind: "none" }, atom);
        }
      }
    }
    // 3. Retrieval after explain (2 items), then practice item.
    if (teacher.segmentMoveLog.includes("EXPLAIN") && teacher.retrievalAttempts < 2) {
      const item = pickItem(model, segment.conceptId, usedItems(teacher));
      if (item) return move("RETRIEVAL_PROMPT", segment, item, teacher,
        `Check what the explanation landed — retrieval, no hints`, 2,
        { kind: "item_response", itemId: item.id, hintsAllowed: false });
    }
    // 4. Worked example after repeated failure.
    if (teacher.wrongStreak >= 2) {
      const atom = getAtom(bank, segment.conceptId, "example") ?? getAtom(bank, segment.conceptId, "common_mistake");
      if (atom) {
        return move("WORKED_EXAMPLE", segment, undefined, teacher,
          `Two consecutive misses — worked example from atom ${atom.id}, then fade`, 5, { kind: "none" }, atom);
      }
      const enc = getEncouragement(bank, teacher.encouragementRotation);
      if (enc) {
        return move("ENCOURAGE_REFRAME", segment, undefined, teacher,
          `Frustration pattern (2 wrong, ${rep.grey ? "grey" : "evidenced"} concept) — reframe, lower difficulty next`, 1, { kind: "none" }, enc);
      }
    }
    // 5. Sure+wrong with guess → self-explain prompt.
    if (teacher.lastOutcome === "correct" && teacher.segmentMoveLog[teacher.segmentMoveLog.length - 1] === "RETRIEVAL_PROMPT") {
      const item = pickItem(model, segment.conceptId, usedItems(teacher));
      if (item) return move("TRANSFER_ITEM", segment, item, teacher,
        `Retrieval landed — one application step (transfer)`, 3,
        { kind: "item_response", itemId: item.id, hintsAllowed: true });
    }
    // 6. Segment taught + retrieved → close.
    if (teacher.segmentMoveLog.includes("EXPLAIN") && teacher.retrievalAttempts >= 2) {
      return closeSegment(model, st, teacher, session, bank);
    }
    // 7. Fallback: retrieval if explain done, else explain (covers no-atom case).
    if (teacher.segmentMoveLog.includes("EXPLAIN")) {
      const item = pickItem(model, segment.conceptId, usedItems(teacher));
      if (item) return move("RETRIEVAL_PROMPT", segment, item, teacher, `Repetition retrieval`, 2, { kind: "item_response", itemId: item.id, hintsAllowed: false });
      return closeSegment(model, st, teacher, session, bank);
    }
    // No atom available → raw-atom-tier template explanation (tier 4).
    return move("EXPLAIN", segment, undefined, teacher,
      `Verified atom unavailable — tier-4 template explanation (flagged for content sprint)`, 4, { kind: "none" },
      { id: `tpl_explain_${segment.conceptId}`, kind: "explanation", body: `Let's build ${concept.name} from first principles: what it says, why it exists, and where the exam tries to trap you. (Atom needed — content sprint.)`, conceptId: segment.conceptId, lang: "en", verifiedBy: "template", version: 1, source: "template", riskLevel: "phrasing" });
  }

  // ---- practice flow ----
  if (segment.kind === "practice") {
    if (teacher.lastOutcome === "wrong" && teacher.hintLevel > 0 && teacher.hintLevel <= 3) {
      const level = teacher.hintLevel as 1 | 2 | 3;
      const atom = getAtom(bank, segment.conceptId, (`hint_l${level}` as "hint_l1" | "hint_l2" | "hint_l3"));
      if (atom && teacher.activeItem) {
        return move((`HINT_L${level}` as "HINT_L1" | "HINT_L2" | "HINT_L3"), segment, teacher.activeItem, teacher,
          `Wrong in practice — hint ladder level ${level}`, 1, { kind: "item_response", itemId: teacher.activeItem.id, hintsAllowed: true }, atom);
      }
    }
    const item = pickItem(model, segment.conceptId, usedItems(teacher));
    if (item && teacher.segmentMinutesSpent < segment.minutes) {
      return move("RETRIEVAL_PROMPT", segment, item, teacher, `Practice with immediate feedback`, 2, { kind: "item_response", itemId: item.id, hintsAllowed: true });
    }
    return closeSegment(model, st, teacher, session, bank);
  }

  // ---- calibration_wrap ----
  if (segment.kind === "calibration_wrap") {
    if (!teacher.segmentMoveLog.includes("CALIBRATION_PROMPT")) {
      return move("CALIBRATION_PROMPT", segment, undefined, teacher,
        `Confidence vs accuracy comparison (the calibration loop)`, 2, { kind: "confidence_report" },
        { id: "tpl_calibration", kind: "explanation", body: "Before we close: for the questions you answered today, rate how sure you were. We will keep score of how your certainty maps to your accuracy — that number is yours to improve.", conceptId: segment.conceptId, lang: "en", verifiedBy: "template", version: 1, source: "template", riskLevel: "phrasing" });
    }
    return closeSegment(model, st, teacher, session, bank);
  }

  return closeSegment(model, st, teacher, session, bank);
}

/** Close the current segment: summary (template from state deltas) + advance. */
function closeSegment(
  model: BeliefModel,
  st: BeliefState,
  teacher: TeacherState,
  session: { segments: Segment[] },
  bank: AtomBank,
): TeachingMove | null {
  const segment = session.segments[teacher.segmentIndex];
  if (segment && !teacher.segmentMoveLog.includes("SUMMARISE_CLOSE")) {
    const rep = reportConcept(model, st, segment.conceptId);
    return move("SUMMARISE_CLOSE", segment, undefined, teacher,
      `Segment complete — summary from state deltas (n_eff now ${rep.nEff.toFixed(1)}, band ${rep.lo.toFixed(2)}–${rep.hi.toFixed(2)})`, 1, { kind: "none" },
      { id: `tpl_summary_${segment.id}`, kind: "explanation", body: `Segment closed: ${segment.conceptName}. ${teacher.retrievalAttempts > 0 ? `Retrieval ${teacher.retrievalCorrect}/${teacher.retrievalAttempts}. ` : ""}My belief is now ${rep.grey ? "still forming — more evidence soon" : `${(rep.mean * 100).toFixed(0)}% (80% band ${rep.lo.toFixed(2)}–${rep.hi.toFixed(2)})`}.`, conceptId: segment.conceptId, lang: "en", verifiedBy: "template", version: 1, source: "template", riskLevel: "phrasing" });
  }
  // advance segment
  teacher.segmentIndex += 1;
  teacher.segmentMoveLog = [];
  teacher.segmentMinutesSpent = 0;
  teacher.wrongStreak = 0;
  teacher.correctStreak = 0;
  teacher.hintLevel = 0;
  teacher.activeItem = undefined;
  teacher.lastOutcome = undefined;
  teacher.retrievalCorrect = 0;
  teacher.retrievalAttempts = 0;
  const next = session.segments[teacher.segmentIndex];
  if (!next) return null;
  return nextMove(model, st, mis0(), teacher, session, bank);
}

function mis0(): MisconceptionState {
  return { byId: {} };
}

function move(
  id: TeacherMoveId,
  segment: Segment,
  item: Item | undefined,
  teacher: TeacherState,
  why: string,
  minutes: number,
  expectEvidence: ExpectedEvidence,
  atom?: Atom,
): TeachingMove {
  teacher.moveCount += 1;
  teacher.segmentMoveLog.push(id);
  teacher.segmentMinutesSpent += minutes;
  if (id === "HINT_L1" || id === "HINT_L2" || id === "HINT_L3") {
    teacher.hintLevel = Number(id.slice(-1));
    teacher.hintShownLevel = Math.max(teacher.hintShownLevel, teacher.hintLevel);
  } else if (id === "WORKED_EXAMPLE" || id === "ENCOURAGE_REFRAME") {
    teacher.hintLevel = 0;
    teacher.hintShownLevel = 3; // ladder exhausted for this item — worked example is the response
    teacher.wrongStreak = 0; // reframe resets the streak
  }
  if (id === "ENCOURAGE_REFRAME") teacher.encouragementRotation += 1;
  if (id === "RETRIEVAL_PROMPT" || id === "DIAGNOSTIC_PROBE" || id === "TRANSFER_ITEM") {
    if (item) {
      markUsed(teacher, item.id);
      // New active item → the ladder restarts on it.
      if (teacher.activeItem?.id !== item.id) teacher.activeItemWrongs = 0;
      teacher.activeItem = item;
      if (id !== "DIAGNOSTIC_PROBE") teacher.retrievalAttempts += 1;
    }
  }
  return {
    move: id,
    segmentId: segment.id,
    conceptId: segment.conceptId,
    utterance: atom?.body ?? "",
    atomId: atom?.id,
    item,
    options: item?.options,
    expectEvidence,
    why,
    minutes,
  };
}

/** Teacher-side bookkeeping after the student's turn (outcome → ladder). */
export function applyStudentTurn(
  teacher: TeacherState,
  response: { correct?: boolean; confidence?: number },
): void {
  if (response.correct === undefined) return;
  if (response.correct) {
    teacher.lastOutcome = "correct";
    teacher.correctStreak += 1;
    teacher.wrongStreak = 0;
    teacher.hintLevel = 0;
    teacher.hintShownLevel = 0;
    teacher.activeItem = undefined;
    if (teacher.retrievalAttempts > 0) teacher.retrievalCorrect += 1;
  } else {
    teacher.lastOutcome = "wrong";
    teacher.wrongStreak += 1;
    teacher.correctStreak = 0;
    if (teacher.activeItem) teacher.activeItemWrongs += 1;
    // Ladder depth is derived from activeItemWrongs by the policy; the active
    // item is retained so hints attach to the SAME question (retry semantics).
  }
  void response.confidence;
}

// ---- item-usage tracking (deterministic rotation within a session) ----
const USED = new WeakMap<TeacherState, Set<string>>();
function usedItems(teacher: TeacherState): Set<string> {
  let s = USED.get(teacher);
  if (!s) {
    s = new Set();
    USED.set(teacher, s);
  }
  return s;
}
function markUsed(teacher: TeacherState, itemId: string): void {
  usedItems(teacher).add(itemId);
}

function wOf(model: BeliefModel, conceptId: string): number {
  return model.content.conceptWeight.get(conceptId) ?? 0;
}

/** The confusable pair for a concept, from the content graph. */
function contrastPairFor(model: BeliefModel, conceptId: string): [string, string] | null {
  const c = model.content.conceptById.get(conceptId);
  if (!c || c.confusableWith.length === 0) return null;
  return [conceptId, c.confusableWith[0]!];
}

/** Probe helper kept for parity with the v2x rule table (unused in V1 flows). */
export function probeNeededFor(model: BeliefModel, st: BeliefState, conceptId: string): boolean {
  const rep = reportConcept(model, st, conceptId);
  return rep.grey;
}

// keep the import used (tier discipline): suspicion of a confirmed
// misconception prefers the concept's own tagged distractor items.
export function misconceptionDrivenItems(
  model: BeliefModel,
  mis: MisconceptionState,
  conceptId: string,
): Item[] {
  const confirmed = confirmedMisconceptions(mis).map((c) => c.id);
  return itemsFor(model, conceptId).filter((i) =>
    Object.values(i.distractorTags).some((mid) => confirmed.includes(mid)),
  );
}

// re-export for the loop
export { misconceptionTier, rootCauseSuspects };
