/**
 * KERNEL ADAPTER [ADR-032] — the ONLY file that knows both sides.
 * Maps frozen-kernel outputs INTO the frontend contracts. React components
 * never import the kernel directly; they consume scenes, utterances, bands.
 * Every utterance carries provenance — the hologram cannot lie.
 */
import {
  buildBeliefModel, initialState, planDay, composeSession, buildPlanReceipt, compileNarrativeArc,
  nextMove, startTeacherSession, applyStudentTurn,
  applyEvent, replay,
  computePersonalisationState, reportConcept, growthReceipt, capabilityJourney, scanMilestones,
  changedMyMind, agencySurface, newAgencyState,
  DEFAULT_BELIEF_PARAMS, DEFAULT_PLANNER_PARAMS, DEFAULT_MEMORY_PARAMS, makeRng,
  buildGeomorphologyContent, GEO_GOAL, GEO_HOOKS, GEO_CAPABILITIES,
  type BeliefModel, type BeliefState, type SystemState, type StudentEvent, type Item,
  type TeachingMove, type TeacherState,
} from "@techgram/kernel";
import type { Utterance, EvidenceRef, SessionScene, TeacherExpression, PresenceState, CameraShot } from "../contracts/index.js";

export const content = buildGeomorphologyContent();
export const model: BeliefModel = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });
export const EMPTY_BANK = { version: "empty", atoms: [], byId: new Map(), byConceptKind: new Map(), byPair: new Map(), byKind: new Map() } as const;

export interface SanctuaryState {
  sys: SystemState;
  teacher: TeacherState;
  arc: ReturnType<typeof compileNarrativeArc>;
  plan: ReturnType<typeof planDay>;
  day: number;
  events: StudentEvent[];
}

export function newSanctuary(events: StudentEvent[] = [], minutes = 40): SanctuaryState {
  const sys = replay(model, events);
  const day = (events.at(-1)?.day ?? 0) + 1;
  const rng = makeRng(20261003 + day);
  const plan = planDay(model, sys.belief, { day, daysToExam: 89, minutesAvailable: minutes, prepHorizonDays: 90, memory: sys.memory }, DEFAULT_PLANNER_PARAMS, rng);
  const composed = composeSession(plan, minutes, undefined, buildPlanReceipt(plan, []));
  const pers = computePersonalisationState(events, day - 1);
  const arc = compileNarrativeArc(model, composed, pers, sys.curiosity, {
    spec: { goalId: GEO_GOAL.id, durationMin: minutes, objectives: ["understand geomorphic processes"], constraints: [], studentStateVersion: "v1" },
    goalConnection: GEO_GOAL.aspiration,
    hook: GEO_HOOKS[day % GEO_HOOKS.length] ?? GEO_HOOKS[0]!,
  });
  return { sys, teacher: startTeacherSession(), arc, plan, day, events };
}

/* ---------------- provenance factories ---------------- */

export function utteranceFromMove(m: TeachingMove, extraRefs: EvidenceRef[] = []): Utterance {
  const refs: EvidenceRef[] = [];
  if (m.atomId) refs.push({ kind: "atom", id: m.atomId });
  refs.push({ kind: "band", conceptId: m.conceptId });
  if (m.item) refs.push({ kind: "decision", id: `item:${m.item.id}` });
  refs.push(...extraRefs);
  const expressionTone: Utterance["policy"]["tone"] =
    m.move === "ENCOURAGE_REFRAME" ? "warm"
    : m.move === "CONTRAST" || m.move.startsWith("HINT") ? "challenging"
    : m.move === "SUMMARISE_CLOSE" ? "celebratory"
    : "neutral";
  return {
    semanticSource: `teacher.${m.move}`,
    evidenceRefs: refs,
    decisionRef: { kind: "decision", id: `${m.move}:${m.segmentId}` },
    contentRef: m.atomId ? { kind: "atom", id: m.atomId } : undefined,
    uncertainty: { level: "known" },
    policy: { tone: expressionTone, energy: "medium", allowHumor: false, syncBoardElementIds: [m.conceptId] },
  };
}

export function arcHook(s: SanctuaryState): { question: string; conceptId: string } {
  const ol = s.arc.segments.find((x) => x.beat === "open_loop");
  const ori = s.arc.segments.find((x) => x.beat === "orientation" || x.beat === "hook");
  return ol?.curiosityHook ?? ori?.curiosityHook ?? { question: "shall we begin?", conceptId: content.concepts[0]!.id };
}

export function arcGoal(s: SanctuaryState): string {
  return s.arc.segments.find((x) => x.goalConnection)?.goalConnection ?? "";
}

export function hookUtterance(hook: { question: string; conceptId: string }, extraRefs: EvidenceRef[] = []): Utterance {
  return {
    semanticSource: "session.hook",
    evidenceRefs: [{ kind: "band", conceptId: hook.conceptId }, ...extraRefs],
    uncertainty: { level: "grey" },
    policy: { tone: "warm", energy: "high", allowHumor: false },
  };
}

/* ---------------- presence mapping (the director) ---------------- */

const MOVE_PRESENCE: Record<string, { presence: PresenceState; expression: TeacherExpression; camera: CameraShot }> = {
  MEMORY_OPEN: { presence: "speaking", expression: "warm", camera: "close-up" },
  DIAGNOSTIC_PROBE: { presence: "waiting", expression: "attentive", camera: "medium" },
  EXPLAIN: { presence: "explaining", expression: "thoughtful", camera: "board-focus" },
  WORKED_EXAMPLE: { presence: "pointing", expression: "thoughtful", camera: "board-focus" },
  FADE_EXAMPLE: { presence: "explaining", expression: "neutral", camera: "wide" },
  RETRIEVAL_PROMPT: { presence: "waiting", expression: "attentive", camera: "medium" },
  HINT_L1: { presence: "responding", expression: "concerned-lean-in", camera: "close-up" },
  HINT_L2: { presence: "responding", expression: "concerned-lean-in", camera: "close-up" },
  HINT_L3: { presence: "responding", expression: "warm", camera: "close-up" },
  CONTRAST: { presence: "pointing", expression: "playful", camera: "board-focus" },
  SELF_EXPLAIN_PROMPT: { presence: "listening", expression: "attentive", camera: "medium" },
  TRANSFER_ITEM: { presence: "waiting", expression: "playful", camera: "wide" },
  CALIBRATION_PROMPT: { presence: "waiting", expression: "thoughtful", camera: "close-up" },
  ENCOURAGE_REFRAME: { presence: "speaking", expression: "warm", camera: "close-up" },
  SUMMARISE_CLOSE: { presence: "speaking", expression: "small-genuine-excitement", camera: "medium" },
};

export function sceneFromMove(seq: number, m: TeachingMove, boardElementIds: string[]): SessionScene {
  const d = MOVE_PRESENCE[m.move] ?? { presence: "speaking" as PresenceState, expression: "neutral" as TeacherExpression, camera: "medium" as CameraShot };
  return {
    seq,
    teacher: { presence: d.presence, gaze: d.camera === "board-focus" ? "board" : "student", expression: d.expression, utterance: utteranceFromMove(m) },
    blackboard: { elements: boardElementIds.map((id) => ({ id, kind: "concept", ref: { kind: "concept", id } })), animating: [m.conceptId], focus: m.conceptId },
    interaction: (m.item ? { mode: "question" as const, accept: ["tap", "text"] as ("tap" | "text")[], options: m.options, hintAvailable: m.move !== "HINT_L3" } : { mode: "none" as const, accept: ["tap", "text"] as ("tap" | "text")[] }),
    evidence: { reason: m.why, uncertainty: { level: "grey" }, whyThisAvailable: true },
    camera: d.camera,
    acknowledgmentMs: 380 + Math.floor(m.utterance.length % 3) * 90,
  };
}

/* ---------------- the turn loop ---------------- */

export interface TurnResult { done: boolean; move: TeachingMove | null }

export function askNext(s: SanctuaryState): TurnResult {
  const mis = s.sys.misconceptions;
  const memoryOpen = undefined;
  const move = nextMove(model, s.sys.belief, mis, s.teacher, { segments: s.arc.segments as never }, EMPTY_BANK as never, memoryOpen);
  if (!move) return { done: true, move: null };
  return { done: false, move };
}

export function answerCurrent(s: SanctuaryState, move: TeachingMove, choice: number | null, confidence: 1 | 2 | 3 = 2): StudentEvent[] {
  const item: Item | undefined = move.item;
  const correct = item ? choice === item.answer : true;
  applyStudentTurn(s.teacher, { correct, confidence });
  if (!item) return [];
  const ev: StudentEvent = {
    event_id: `web_${s.day}_${s.events.length + 1}_${item.id}`,
    student_id: "student", day: s.day, type: "item_response",
    payload: { concept_id: move.conceptId, item_id: item.id, correct, confidence, chosen_option: choice ?? -1, time_sec: 30 + ((s.events.length * 7) % 40) },
    source: "web", schema_version: 1, idempotency_key: `web_${s.day}_${item.id}_${s.events.length}`,
  };
  s.sys = applyEvent(model, s.sys, ev);
  s.events.push(ev);
  return [ev];
}

export function emitAgency(s: SanctuaryState, decision: string, mode: "accepted_recommendation" | "proposed_with_reason" | "decided_independently"): StudentEvent {
  const ev: StudentEvent = {
    event_id: `web_agency_${s.events.length + 1}`, student_id: "student", day: s.day,
    type: "agency_observed", payload: { decision, mode }, source: "web", schema_version: 1,
    idempotency_key: `web_agency_${s.events.length}_${decision}`,
  };
  s.sys = applyEvent(model, s.sys, ev);
  s.events.push(ev);
  return ev;
}

/* ---------------- surfaces data (all kernel-derived) ---------------- */

export interface ConceptRow { id: string; name: string; mean: number; lo: number; hi: number; grey: boolean; nEff: number }

export function conceptRows(st: BeliefState): ConceptRow[] {
  return content.concepts.map((c) => {
    const r = reportConcept(model, st, c.id);
    return { id: c.id, name: c.name, mean: r.mean, lo: r.lo, hi: r.hi, grey: r.grey, nEff: r.nEff };
  });
}

export function growthFor(s: SanctuaryState) { return growthReceipt(model, s.sys.belief, null); }
export function journeyFor(s: SanctuaryState) { return capabilityJourney(model, s.sys.belief, GEO_CAPABILITIES); }
export function milestonesFor(s: SanctuaryState) { return scanMilestones(model, s.sys.belief, s.sys.artifacts, s.events as never); }
export function shiftsFor(s: SanctuaryState) { return changedMyMind(model, initialState(model), s.sys.belief); }
export function agencyFor(s: SanctuaryState) { return agencySurface(s.sys.agency); }
export function personalisationFor(s: SanctuaryState) { return computePersonalisationState(s.events, s.day - 1); }
