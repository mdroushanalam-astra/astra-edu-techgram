/**
 * B1 — Event Fabric: append-only, typed, idempotent.
 * State is a projection of events; replaying the log rebuilds it exactly.
 * [PORT] of the prototype's event sourcing, hardened: idempotency keys,
 * schema version, out-of-order tolerance via logical day ordering.
 */

import { buildBeliefModel, initialState, observe, timeUpdate, type BeliefModel, type BeliefState, type Onboarding } from "./belief.js";
import { applyReview, newMemoryCell, DEFAULT_MEMORY_PARAMS, type MemoryCell, type MemoryParams } from "./memory.js";
import { updateMisconception, newMisconceptionState, copyMisconceptionState, type MisconceptionState } from "./diagnosis.js";
import { initialPreferenceState, copyPreferenceState, observePreference, type PreferenceState, type PreferenceDimension } from "./preference.js";
import { initialCuriosityState, copyCuriosityState, type CuriosityState } from "./curiosity.js";
import { initialCuriosityState as initCuriosity } from "./curiosity.js";
import { newAgencyState, copyAgencyState, observeAgency, type AgencyState, type DecisionType, type AgencyMode } from "./agency.js";
import type { StudentArtifact } from "./artifact.js";
import type { Content } from "./content.js";
import { expertDifficultyToLogit } from "./content.js";

export type EventType =
  | "goal_set"
  | "onboarded"
  | "diagnostic_response"
  | "item_response"
  | "confidence_reported"
  | "hint_used"
  | "session_started"
  | "session_completed"
  | "session_abandoned"
  | "review_completed"
  | "mock_completed"
  | "scorecard_imported"
  | "artifact_added"
  | "curiosity_captured"
  | "preference_observed"
  | "self_report"
  | "agency_observed";

export interface StudentEvent {
  event_id: string;
  student_id: string;
  /** Logical day (the kernel never reads the wall clock). */
  day: number;
  type: EventType;
  payload: Record<string, unknown>;
  source: string;
  session_id?: string;
  schema_version: number;
  idempotency_key: string;
}

export interface SystemState {
  belief: BeliefState;
  memory: Map<number, MemoryCell>; // conceptIdx → cell
  /** B10: per-student misconception counters (evidence-driven, tiered). */
  misconceptions: MisconceptionState;
  /** B12: preference model (AOM-style prediction-error learning). */
  preferences: PreferenceState;
  /** B12: curiosity ledger — student questions are evidence. */
  curiosity: CuriosityState;
  /** B12: student-produced cognition (notes/explanations) — reasoning lineage. */
  artifacts: StudentArtifact[];
  /** B12: optional self-reported session state (energy/focus/stress/motivation). */
  selfReports: { day: number; energy?: number; focus?: number; stress?: number; motivation?: number }[];
  /** ADR-030: agency transfer — who led each kind of learning decision. */
  agency: AgencyState;
  goal: { goalId: string; deadlineDay: number } | null;
  onboarding: Onboarding | null;
  appliedKeys: Set<string>;
  eventCount: number;
}

export function newSystemState(model: BeliefModel): SystemState {
  return {
    belief: initialState(model),
    memory: new Map(),
    misconceptions: newMisconceptionState(),
    preferences: initialPreferenceState(),
    curiosity: initCuriosity(),
    artifacts: [],
    selfReports: [],
    agency: newAgencyState(),
    goal: null,
    onboarding: null,
    appliedKeys: new Set(),
    eventCount: 0,
  };
}

/**
 * Apply one event. Pure: returns a NEW SystemState (copy-on-write), so
 * history can be kept. Duplicate idempotency keys are no-ops.
 */
export function applyEvent(
  model: BeliefModel,
  st: SystemState,
  ev: StudentEvent,
  memParams: MemoryParams = DEFAULT_MEMORY_PARAMS,
): SystemState {
  if (st.appliedKeys.has(ev.idempotency_key)) return st;
  const next: SystemState = {
    belief: {
      mu: st.belief.mu.slice(),
      S: st.belief.S.slice(),
      nEff: st.belief.nEff.slice(),
      lastTouch: st.belief.lastTouch.slice(),
      elo: st.belief.elo.slice(),
      eloSeen: st.belief.eloSeen.slice(),
      modelDisagreement: [...st.belief.modelDisagreement],
    },
    memory: new Map(st.memory),
    misconceptions: copyMisconceptionState(st.misconceptions),
    preferences: copyPreferenceState(st.preferences),
    curiosity: copyCuriosityState(st.curiosity),
    artifacts: st.artifacts.map((a) => ({ ...a })),
    selfReports: st.selfReports.map((s) => ({ ...s })),
    agency: copyAgencyState(st.agency),
    goal: st.goal,
    onboarding: st.onboarding,
    appliedKeys: new Set(st.appliedKeys).add(ev.idempotency_key),
    eventCount: st.eventCount + 1,
  };

  switch (ev.type) {
    case "goal_set": {
      next.goal = {
        goalId: String(ev.payload.goal_id ?? "unknown"),
        deadlineDay: Number(ev.payload.deadline_day ?? 0),
      };
      break;
    }
    case "onboarded": {
      next.onboarding = {
        selfRating: Number(ev.payload.self_rating ?? 3),
        scorecards: (ev.payload.scorecards as Record<string, number>) ?? undefined,
      };
      // Rebuild the prior with onboarding info (prior construction is part of
      // the projection — deterministic from events).
      const withOnboarding = buildBeliefModel(
        model.content,
        memParams,
        model.params,
        next.onboarding,
      );
      const fresh = initialState(withOnboarding);
      next.belief.mu = fresh.mu;
      next.belief.S = fresh.S;
      break;
    }
    case "scorecard_imported": {
      // Noisy pseudo-observations on topic level: fold into mu directly.
      const sc = (ev.payload.scorecards as Record<string, number>) ?? {};
      for (const [topicId, frac] of Object.entries(sc)) {
        const tIdx = model.content.topics.findIndex((t) => t.id === topicId);
        if (tIdx < 0) continue;
        const s = Math.max(0.05, Math.min(0.95, frac));
        const shift = 1.4 * (s - 0.45);
        for (let i = 0; i < model.N; i++) {
          if (model.topicIndexOf[i] === tIdx) next.belief.mu[i] += shift;
        }
      }
      break;
    }
    case "diagnostic_response":
    case "item_response": {
      const conceptId = String(ev.payload.concept_id ?? "");
      const itemId = ev.payload.item_id ? String(ev.payload.item_id) : null;
      const item = itemId ? model.content.itemById.get(itemId) : undefined;
      const correct = Boolean(ev.payload.correct);
      const confidence = ev.payload.confidence as number | undefined; // 1 guess / 2 think / 3 sure
      const timeSec = ev.payload.time_sec as number | undefined;
      const expected = item?.expectedTimeSec ?? 45;

      // Evidence weighting: rapid guess → 0; hints halve; confidence scales.
      let evidenceW = 1;
      if (timeSec !== undefined && timeSec < Math.max(3, 0.15 * expected)) evidenceW = 0;
      if (ev.type === "diagnostic_response" && confidence !== undefined) {
        evidenceW *= confidence === 3 ? 1.3 : confidence === 1 ? 0.5 : 1.0;
      }
      if (ev.type === "item_response" && confidence !== undefined) {
        evidenceW *= confidence === 3 ? 1.3 : confidence === 1 ? 0.5 : 1.0;
      }
      // Sure + wrong: full evidence (it drives the misconception engine too).
      if (confidence === 3 && !correct) evidenceW = Math.max(evidenceW, 1.0);

      observe(model, next.belief, {
        conceptId,
        b: item ? expertDifficultyToLogit(item.difficulty) : undefined,
        correct,
        evidenceW,
        day: ev.day,
      });
      // B10 misconception evidence: wrong answer on a tagged, CHOSEN distractor.
      if (item && correct === false && typeof ev.payload.chosen_option === "number") {
        updateMisconception(
          next.misconceptions,
          item,
          ev.payload.chosen_option,
          correct,
          confidence,
        );
      }
      // Memory: assessment acts as a retrieval-practice touch — but MASSED
      // repetition within one day counts as ONE review (spacing effect).
      const ci = model.index.get(conceptId);
      if (ci !== undefined && evidenceW > 0) {
        const cell = next.memory.get(ci) ?? newMemoryCell(
          model.content.conceptById.get(conceptId)!.type,
          memParams,
        );
        if (cell.lastReviewDay !== ev.day) {
          next.memory.set(ci, applyReview(cell, correct, ev.day, memParams));
        } else {
          next.memory.set(ci, cell);
        }
      }
      break;
    }
    case "review_completed": {
      const conceptId = String(ev.payload.concept_id ?? "");
      const ci = model.index.get(conceptId);
      const correct = Boolean(ev.payload.correct);
      if (ci !== undefined) {
        const cell = next.memory.get(ci) ?? newMemoryCell(
          model.content.conceptById.get(conceptId)!.type,
          memParams,
        );
        next.memory.set(ci, applyReview(cell, correct, ev.day, memParams));
      }
      break;
    }
    case "artifact_added": {
      const art: StudentArtifact = {
        id: String(ev.payload.artifact_id ?? ev.event_id),
        type: (ev.payload.type as StudentArtifact["type"]) ?? "note",
        content: String(ev.payload.content ?? ""),
        conceptIds: (ev.payload.concept_ids as string[]) ?? [],
        day: ev.day,
        provenance: String(ev.payload.provenance ?? ev.source),
      };
      next.artifacts.push(art);
      break;
    }
    case "curiosity_captured": {
      const q = ev.payload.question as string | undefined;
      if (q) {
        next.curiosity.questions.push({
          id: String(ev.payload.question_id ?? ev.event_id),
          question: q,
          conceptIds: (ev.payload.concept_ids as string[]) ?? [],
          source: (ev.payload.source as "student" | "system") ?? "student",
          status: "unresolved",
          day: ev.day,
        });
      }
      break;
    }
    case "preference_observed": {
      const dim = ev.payload.dimension as PreferenceDimension | undefined;
      const option = ev.payload.option as string | undefined;
      const observed = ev.payload.observed as number | undefined;
      if (dim && option && typeof observed === "number") {
        observePreference(next.preferences, dim, option, Math.max(0, Math.min(1, observed)), ev.day);
      }
      break;
    }
    case "self_report": {
      next.selfReports.push({
        day: ev.day,
        energy: ev.payload.energy as number | undefined,
        focus: ev.payload.focus as number | undefined,
        stress: ev.payload.stress as number | undefined,
        motivation: ev.payload.motivation as number | undefined,
      });
      break;
    }
    case "agency_observed": {
      const decision = ev.payload.decision as DecisionType | undefined;
      const mode = ev.payload.mode as AgencyMode | undefined;
      if (decision && mode) {
        next.agency = observeAgency(st.agency, decision, mode, ev.day);
      }
      break;
    }
    case "session_started":
    case "session_completed":
    case "session_abandoned":
    case "confidence_reported":
    case "hint_used":
    case "mock_completed":
      // Behaviour-layer events: recorded for B9 features; no belief update in v0.
      break;
    default:
      break;
  }
  return next;
}

/** Rebuild state from an event log (deterministic replay). */
export function replay(
  model: BeliefModel,
  events: StudentEvent[],
  memParams: MemoryParams = DEFAULT_MEMORY_PARAMS,
): SystemState {
  // Sort by (day, event_id) — logical order; idempotency still guards dupes.
  const sorted = [...events].sort((a, b) => a.day - b.day || a.event_id.localeCompare(b.event_id));
  let st = newSystemState(model);
  for (const ev of sorted) st = applyEvent(model, st, ev, memParams);
  return st;
}
