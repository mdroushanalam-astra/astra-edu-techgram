/** Persisted execution adapter: policy belongs to the existing kernel. */
import {
  buildGeomorphologyContent, buildSeedContent, buildPolityAtomBank, assembleAtomBank,
  getAtom, buildBeliefModel, replay, planDay, reportConcept, computePersonalisationState,
  DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, DEFAULT_PLANNER_PARAMS, makeRng,
  composeSession, nextMove, startTeacherSession, applyStudentTurn, buildPlanReceipt,
  type Atom, type StudentEvent, type TeachingMove, type TeacherState, type ComposedSession, type Plan,
} from "../kernel/src/index.js";
import { geographyPack } from "../content/geography.generated.js";
import { referenceVersion, searchGeographyReference, teacherReference } from "./geography_reference.js";
import { buildGeographyUnits, buildGeographyUnitAtoms, geographyUnits, unitFrontier } from "./geography_units.js";
import { DevelopmentalSession } from "../kernel/src/cognitive/developmental-session.js";
import { planFromDirective } from "../kernel/src/cognitive/experience-plan.js";
import { conduct } from "../kernel/src/cognitive/conductor.js";
import { applyCommunicationPolicy } from "../kernel/src/cognitive/expression.js";
import type { ExecutiveDirective, TurnWorkspace } from "../kernel/src/cognitive/executive.js";

export interface RuntimeRequest {
  catalog?: "units";
  student_id: string; pack: string; day: number; days_to_exam: number; minutes: number;
  command_id: string; events: StudentEvent[]; preferences?: Record<string, unknown>;
  context?: SessionContext | null;
  answer?: { item_id: string; choice: number; confidence: number; time_sec: number; command_id: string };
  action?: { action: string; step_id?: string; elapsed_sec?: number; confidence?: number };
}
interface AnswerRecord {
  purpose?: "diagnostic" | "practice" | "check" | "transfer";
  command: string; question: string; selected: string; correct: boolean; answer: string;
  explanation: string; concept: string; seconds: number; confidence: number; assisted: boolean;
}
interface SessionContext {
  version: 2; id: string; contentVersion: string; atomVersion: string;
  referenceVersion?: string;
  minutes: number; elapsed_sec: number; status: "active" | "paused" | "completed";
  teacher: TeacherState; session: ComposedSession; plan: Plan; move: TeachingMove | null;
  step_number: number; answers: AnswerRecord[]; assisted: boolean; support: Atom | null; revealed: string[];
  cognition?: { workspace: TurnWorkspace; incumbent: ExecutiveDirective; executed: ExecutiveDirective; seed: number; predictedBenefit: number };
}
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
export function knowledgeSearch(pack: string, query: string) {
  const bank = pack === "polity" ? buildPolityAtomBank() : buildGeographyUnitAtoms();
  const words = (query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(w => w.length > 2).slice(0, 12);
  const results = words.length ? bank.atoms.filter(a => a.kind === "explanation" || a.kind === "example")
    .map(a => ({ a, score: words.reduce((n, w) => n + Number(`${a.conceptId} ${a.body}`.toLowerCase().includes(w)), 0) }))
    .filter(r => r.score > 0).sort((a, b) => b.score - a.score || a.a.id.localeCompare(b.a.id)).slice(0, 5)
    .map(({ a }) => ({ id: a.id, concept_id: a.conceptId, body: a.body, source: a.source, review: a.verifiedBy })) : [];
  const references = pack === "geography" ? searchGeographyReference(query).map(r => ({ ...r,
    unit_id: geographyUnits.concepts.find(c => `geo_master_${c.section.replaceAll(".", "_")}` === r.id)?.unit })) : [];
  return { results: [...references, ...results].slice(0, 5), scope: pack === "geography"
    ? "Geography reference library and four authored teaching units (20 assessed concepts). Subject review and textbook edition verification remain pending; the full curriculum and live web search are not configured."
    : "Source-linked seed lessons, not complete curriculum coverage. Expert review remains pending; live web search is not configured." };
}
export function runConnectedSession(request: RuntimeRequest) {
  const active = request.context?.status !== "completed" ? request.context : null;
  const modern = request.pack !== "polity" && (active ? active.contentVersion === geographyUnits.version : request.catalog === "units");
  const content = request.pack === "polity" ? buildSeedContent() : modern ? buildGeographyUnits() : buildGeomorphologyContent();
  const bank = request.pack === "polity" ? buildPolityAtomBank() : modern ? buildGeographyUnitAtoms() : assembleAtomBank(geographyPack.version, clone(geographyPack.atoms) as unknown as Atom[]);
  const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });
  const events = clone(request.events ?? []);
  const knownVersions = request.pack === "polity" ? [content.version] : [buildGeomorphologyContent().version, geographyUnits.version];
  if (events.some(e => e.type === "item_response" && !knownVersions.includes(String(e.payload.content_version)))) throw new Error("Stored content needs explicit migration");
  // Separate evidence spaces across immutable grading versions; preserve the full event log.
  const currentEvents = () => events.filter(e => e.type !== "item_response" || e.payload.content_version === content.version);
  const preferences = request.preferences ?? {};
  let state = replay(model, currentEvents());
  let ctx = request.context?.version === 2 ? clone(request.context) : null;
  if (ctx?.referenceVersion && ctx.referenceVersion !== referenceVersion) throw new Error("Stored reference content needs explicit migration");
  if (ctx && ctx.status !== "completed" && (ctx.contentVersion !== content.version || ctx.atomVersion !== bank.version)) throw new Error("Active lesson version requires explicit migration");
  let feedback: Record<string, unknown> | null = null;
  const event = (type: StudentEvent["type"], payload: Record<string, unknown>) => events.push({
    event_id: request.command_id, idempotency_key: request.command_id, student_id: request.student_id,
    day: request.day, type, payload, source: "server", schema_version: 1 });
  const stepId = () => ctx ? `${ctx.id}:${ctx.step_number}` : "";
  if (request.answer || request.action) {
    if (!ctx || ctx.status === "completed") throw new Error("No active lesson");
    if (request.action?.step_id !== undefined && request.action.step_id !== stepId()) throw new Error("Teaching step changed");
    if (ctx.status === "paused" && !["resume", "finish"].includes(request.action?.action ?? "")) throw new Error("Resume the lesson first");
    if (request.action?.elapsed_sec !== undefined) ctx.elapsed_sec += Math.max(0, Math.min(300, request.action.elapsed_sec));
  }
  if (request.answer && ctx) {
    const move = ctx.move;
    const answer = request.answer;
    if (!move?.item || move.expectEvidence.kind !== "item_response" || answer.item_id !== move.item.id) throw new Error("No matching issued question");
    const item = content.itemById.get(answer.item_id)!;
    const correct = item.answer === answer.choice;
    const assisted = ctx.assisted || ctx.revealed.includes(item.id) || move.move.startsWith("HINT_");
    const explanation = getAtom(bank, item.conceptId, "explanation");
    event("item_response", { concept_id: item.conceptId, item_id: item.id, correct, chosen_option: answer.choice,
      confidence: answer.confidence, time_sec: answer.time_sec, content_version: content.version,
      assisted, session_id: ctx.id, teaching_move: move.move, cognitive_context: ctx.cognition ?? null });
    ctx.answers.push({ command: request.command_id, purpose: item.purpose, question: item.stem, selected: item.options[answer.choice]!, correct,
      answer: item.options[item.answer]!, explanation: explanation?.body ?? "", concept: item.conceptId,
      seconds: answer.time_sec, confidence: answer.confidence, assisted });
    ctx.elapsed_sec += Math.max(.1, Math.min(300, answer.time_sec));
    ctx.revealed.push(item.id);
    applyStudentTurn(ctx.teacher, { correct, confidence: answer.confidence });
    state = replay(model, currentEvents());
    feedback = { correct, correct_option: item.answer, correct_text: item.options[item.answer], concept_id: item.conceptId,
      assisted, explanation: explanation ? { body: explanation.body, source: explanation.source, verified_by: explanation.verifiedBy } : null };
    ctx.move = nextMove(model, state.belief, state.misconceptions, ctx.teacher, ctx.session, bank);
    ctx.step_number++;
    ctx.support = null;
    ctx.assisted = false;
  }
  if (request.action && ctx) {
    const action = request.action.action;
    if (action === "pause") ctx.status = "paused";
    else if (action === "resume") ctx.status = "active";
    else if (action === "finish") ctx.status = "completed";
    else if (action === "hint" || action === "example") {
      if (!ctx.move?.item || ctx.move.expectEvidence.kind !== "item_response" || !ctx.move.expectEvidence.hintsAllowed) throw new Error("This independent check has no hints");
      const kind = action === "example" ? "example" : `hint_l${Math.min(3, (ctx.teacher.hintLevel ?? 0) + 1)}` as "hint_l1" | "hint_l2" | "hint_l3";
      const atom = getAtom(bank, ctx.move.conceptId, kind);
      if (!atom) throw new Error("No support available for this step");
      ctx.support = atom;
      ctx.assisted = true;
      if (action === "hint") ctx.teacher.hintLevel = Math.min(3, (ctx.teacher.hintLevel ?? 0) + 1);
      event("hint_used", { session_id: ctx.id, item_id: ctx.move.item.id, atom_id: atom.id, support_kind: action });
    } else if (action === "continue") {
      if (ctx.move?.expectEvidence.kind === "item_response") throw new Error("Answer this question before continuing");
      ctx.move = nextMove(model, state.belief, state.misconceptions, ctx.teacher, ctx.session, bank);
      ctx.step_number++;
      ctx.support = null;
      ctx.assisted = false;
    }
  }
  const personalized = computePersonalisationState(events, request.day);
  if (!ctx || (ctx.status === "completed" && !request.action && !request.answer)) {
    const frontier = modern ? unitFrontier(String(preferences.geographyUnit ?? "geomorphology"), model, state.belief) : null;
    const plan = planDay(model, state.belief, { day: request.day, daysToExam: request.days_to_exam,
      allowedConceptIds: frontier?.ids, maxBlocks: modern ? 1 : undefined,
      minutesAvailable: request.minutes, prepHorizonDays: Math.max(1, request.days_to_exam), memory: state.memory,
      personalisation: personalized }, DEFAULT_PLANNER_PARAMS, makeRng(20261010 + request.day));
    const session = composeSession(plan, request.minutes, undefined, buildPlanReceipt(plan, ["Subject review and action gains remain uncalibrated."], plan.blocks[0]?.prediction.aomVersion ?? "unknown"));
    if (frontier) {
      plan.personalisationApplied.push(`Selected unit: ${frontier.selected}; ${frontier.prerequisitesIncluded ? "unmet prerequisites are checked first" : "eligible concepts ranked by the kernel"}. Topic weights are balanced authoring assumptions, not exam frequency evidence.`);
      const block = plan.blocks[0];
      if (block) session.segments = [
        { id: "unit-cycle", kind: "teach", protocol: "assessed-unit", conceptId: block.conceptId, conceptName: block.conceptName,
          minutes: Math.max(2, request.minutes - 2), sourceBlockIndex: 0, prediction: block.prediction,
          objective: `Explain ${block.conceptName}, distinguish its common error, and apply it to a new situation without hints.` },
        { id: "unit-wrap", kind: "calibration_wrap", conceptId: block.conceptId, conceptName: block.conceptName,
          minutes: 2, sourceBlockIndex: 0, prediction: block.prediction, objective: "Compare independent answers and confidence; choose the next useful step" },
      ];
      session.paramsVersion = "composer-assessed-unit-1";
    }
    const teacher = startTeacherSession();
    ctx = { version: 2, id: request.command_id, contentVersion: content.version, atomVersion: bank.version,
      referenceVersion: request.pack === "geography" ? referenceVersion : undefined, minutes: request.minutes,
      elapsed_sec: 0, status: "active", teacher, session, plan, move: null, step_number: 1, answers: [], assisted: false, support: null, revealed: [] };
    ctx.move = nextMove(model, state.belief, state.misconceptions, teacher, session, bank);
    event("session_started", { session_id: ctx.id, minutes: ctx.minutes, content_version: content.version });
  }
  if (!ctx.move || ctx.elapsed_sec >= ctx.minutes * 60) ctx.status = "completed";
  const rows = content.concepts.map(c => ({ id: c.id, name: c.name, ...reportConcept(model, state.belief, c.id) }));
  const move = ctx.move;
  const segment = ctx.session.segments.find(s => s.id === move?.segmentId);
  const focus = rows.find(r => r.id === move?.conceptId) ?? rows[0]!;
  const responses = currentEvents().filter(e => e.type === "item_response");
  const sameConcept = responses.filter(e => e.payload.concept_id === focus.id && !e.payload.assisted);
  let wrongStreak = 0;
  for (let i = sameConcept.length - 1; i >= 0 && sameConcept[i]!.payload.correct === false; i--) wrongStreak++;
  const kind = move?.move ?? "SUMMARISE_CLOSE";
  const incumbent: ExecutiveDirective = { learningAction: ctx.status === "completed" ? "end" : kind === "DIAGNOSTIC_PROBE" ? "diagnose" : kind === "CONTRAST" ? "practice" : kind.includes("PROMPT") || kind === "TRANSFER_ITEM" ? "retrieve" : "teach",
    communication: preferences.style === "Let me try it myself" && move?.item ? "silence" : "explain", presentation: "board", augmentation: "no_llm" };
  const workspace: TurnWorkspace = { turn: ctx.step_number, elapsedMin: ctx.elapsed_sec / 60, timeLeftMin: Math.max(0, ctx.minutes - ctx.elapsed_sec / 60),
    turnsRemaining: Math.max(1, ctx.session.segments.length - ctx.teacher.segmentIndex),
    focusConcept: { id: focus.id, name: focus.name, mean: focus.mean, grey: focus.grey }, alternativeConcept: null,
    uncertainties: rows.filter(r => r.grey).length, hypothesisCount: 0, momentum: 0, frustration: 0, fatigue: 0,
    wrongStreak, lastOutcome: sameConcept.length ? (sameConcept.at(-1)!.payload.correct ? "correct" : "wrong") : null,
    planProgress: { done: ctx.teacher.segmentIndex, total: ctx.session.segments.length }, counts: { jokes: 0, llm: 0, breaks: 0, sinceLastIntervention: wrongStreak },
    visualStructure: request.pack !== "polity", incumbentMove: { kind, conceptId: focus.id, conceptName: focus.name } };
  const cognitive = new DevelopmentalSession({ learningEnabled: true });
  const limits = { maxJokes: 0, maxLLM: 0, maxBreaks: 0, minGapBetweenInterventions: 0, minTeachingRatio: .6 };
  for (const e of responses) {
    const prev = e.payload.cognitive_context as SessionContext["cognition"];
    if (!prev?.workspace || !prev.incumbent) continue;
    const d = cognitive.decideTurn(prev.workspace, { directive: prev.incumbent, predictedBenefit: prev.predictedBenefit ?? 0 }, prev.seed, limits);
    cognitive.recordActual({ directive: prev.executed ?? d.directive, wasIntervention: false, tookBreak: false,
      nextAnswerCorrect: e.payload.assisted ? null : e.payload.correct === true, performanceDelta: 0, fatigueAtDecision: 0 });
  }
  const prediction = segment?.prediction;
  const benefit = prediction?.dMastery ?? 0;
  const decision = cognitive.decideTurn(workspace, { directive: incumbent, predictedBenefit: benefit }, request.day + ctx.step_number, limits);
  // Preserve cognitive proposals; do not silently substitute another action for an issued teacher step.
  const receipt = { ...decision.receipt, directive: incumbent, reason: [move?.why ?? "Session completed", "The active teacher/evidence contract determines the delivered move; the executive proposal is recorded separately."],
    constraintsApplied: [...decision.receipt.constraintsApplied, "Persisted teaching-step/evidence contract"],
    prediction: { ...decision.receipt.prediction, predictedBenefit: benefit }, prediction_status: prediction?.status ?? "unknown" };
  ctx.cognition = { workspace, incumbent, executed: incumbent, seed: request.day + ctx.step_number, predictedBenefit: benefit };
  const experience = planFromDirective({ ...incumbent, conceptId: focus.id, conceptName: focus.name, reasons: receipt.reason,
    evidenceRefs: receipt.evidenceRefs, predictedBenefit: benefit, uncertainty: receipt.prediction.uncertainty, receiptId: receipt.id, fatigue: 0 });
  const policy = applyCommunicationPolicy(workspace, incumbent);
  const atom = move?.atomId ? bank.byId.get(move.atomId) : getAtom(bank, focus.id, "explanation");
  const independentQuestion = move?.expectEvidence.kind === "item_response" && !move.expectEvidence.hintsAllowed;
  const publicAtom = independentQuestion ? null : atom;
  const item = move?.item ?? ctx.teacher.activeItem ?? content.items[0]!;
  const example = getAtom(bank, focus.id, "example");
  let body = preferences.style === "Show me an example" && kind === "EXPLAIN" && example ? `${move?.utterance}\n\n${example.body}` : move?.utterance ?? "";
  if (kind === "CALIBRATION_PROMPT") {
    const independent = ctx.answers.filter(a => !a.assisted);
    const correct = independent.filter(a => a.correct).length;
    const averageConfidence = independent.length ? (independent.reduce((n, a) => n + a.confidence, 0) / independent.length).toFixed(1) : "not measured";
    body = `Your independent answers: ${correct} correct out of ${independent.length}. Average reported confidence: ${averageConfidence}${independent.length ? " out of 3" : ""}. Assisted practice is excluded from these figures. These are observations from this session, not a retention or mastery estimate. Your confidence was recorded with each answer. Continue to close your session and reflect.`;
  }
  return {
    model_version: "typescript-kernel-v2", content_version: content.version, events, runtime_context: ctx,
    concepts: rows, plan: ctx.plan, personalisation: personalized,
    decision: { directive: incumbent, recommendation: decision.directive, receipt },
    self_model: { errors: cognitive.ledger.length, insights: cognitive.insights(), evidence: "observed answer outcomes; intervention effects unmeasured" },
    teaching: publicAtom ? { body: publicAtom.body, source: publicAtom.source, verified_by: publicAtom.verifiedBy } : null,
    item: { id: item.id, stem: item.stem, options: item.options, concept_id: item.conceptId, dimension: item.dimension, purpose: item.purpose }, feedback,
    lesson: { step_id: stepId(), move: kind, body, title: focus.name, concept_id: focus.id,
      reference: request.pack === "geography" && ctx.referenceVersion === referenceVersion && kind === "EXPLAIN"
        ? teacherReference(focus.id) : null,
      input: move?.expectEvidence.kind ?? "none", hints_allowed: move?.expectEvidence.kind === "item_response" && move.expectEvidence.hintsAllowed,
      hint_level: ctx.teacher.hintLevel, support: ctx.support ? { body: ctx.support.body, source: ctx.support.source } : null,
      hint_available: !!getAtom(bank, focus.id, `hint_l${Math.min(3, ctx.teacher.hintLevel + 1)}` as "hint_l1" | "hint_l2" | "hint_l3") && ctx.teacher.hintLevel < 3,
      example_available: !!example,
      source: atom?.source ?? "Evidence-based template", review: atom?.verifiedBy ?? "Template",
      objective: segment?.objective ?? "Reflect on your session", completed_segments: ctx.teacher.segmentIndex, total_segments: ctx.session.segments.length,
      board: modern && !independentQuestion ? { kind: "process-flow", concept_id: focus.id, nodes: geographyUnits.concepts.find(c => c.id === focus.id)?.nodes ?? [],
        caption: geographyUnits.concepts.find(c => c.id === focus.id)?.example ?? "" } : ["g_erosion", "g_transport", "g_deposition", "g_landforms"].includes(focus.id) ? { kind: "river-process", concept_id: focus.id } : { kind: "concept", concept_id: focus.id },
      communication: { ...policy, language: "English", requested_language: preferences.language ?? "English", humor: preferences.humor === true },
      execution: conduct(experience), receipt_id: receipt.id },
    session: { id: ctx.id, status: ctx.status, minutes: ctx.minutes, elapsed_sec: ctx.elapsed_sec, answers: ctx.answers,
      independent_answers: ctx.answers.filter(a => !a.assisted).length, assisted_answers: ctx.answers.filter(a => a.assisted).length },
    signals: { wrong_streak: wrongStreak, assessed_responses: responses.filter(e => !e.payload.assisted).length, fatigue: "unknown", frustration: "unknown" },
    continuity: modern && events.some(e => e.type === "item_response" && e.payload.content_version !== content.version) ? "This expanded curriculum uses a separate evidence space. Earlier session notes and events remain saved; their grading is unchanged." : responses.length ? `Welcome back. You have ${responses.length} recorded answers in this learning space. Today we are exploring ${focus.name}.` : `We will first check what you know about ${focus.name}.`,
  };
}
