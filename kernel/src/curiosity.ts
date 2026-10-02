/**
 * S1 — CURIOSITY STATE [ADR-027/028].
 * We optimize EDUCATIONALLY-USEFUL curiosity, never maximum teasing:
 * hook value = educational relevance + difficulty fit + novelty + student
 * interest − interruption cost. Then we measure what actually happened.
 */

export interface CuriosityQuestion {
  id: string;
  question: string;
  conceptIds: string[];
  /** "student" questions are the most valuable evidence we collect. */
  source: "student" | "system";
  status: "unresolved" | "answered" | "scheduled";
  usefulness?: number;
  day: number;
}

export interface CuriosityState {
  questions: CuriosityQuestion[];
}

export function initialCuriosityState(): CuriosityState {
  return { questions: [] };
}

export function copyCuriosityState(s: CuriosityState): CuriosityState {
  return { questions: s.questions.map((q) => ({ ...q, conceptIds: [...q.conceptIds] })) };
}

export function captureCuriosity(
  s: CuriosityState,
  q: { id?: string; question: string; conceptIds: string[]; source: "student" | "system"; day: number },
): CuriosityQuestion {
  const entry: CuriosityQuestion = {
    id: q.id ?? `cq_${s.questions.length + 1}`,
    question: q.question,
    conceptIds: [...q.conceptIds],
    source: q.source,
    status: "unresolved",
    day: q.day,
  };
  s.questions.push(entry);
  return entry;
}

export function resolveCuriosity(s: CuriosityState, id: string, status: "answered" | "scheduled"): void {
  const q = s.questions.find((x) => x.id === id);
  if (q) q.status = status;
}

export interface HookScoreInput {
  educationalRelevance: number; // 0..1
  difficultyFit: number;        // 0..1
  novelty: number;              // 0..1
  studentInterest: number;      // 0..1
  interruptionCost: number;     // 0..1
}

/** Hook value — the constraint from the external review: useful curiosity, not teasing. */
export function scoreHook(h: HookScoreInput): number {
  return Math.max(0, Math.min(1,
    0.35 * h.educationalRelevance + 0.2 * h.difficultyFit + 0.15 * h.novelty
    + 0.2 * h.studentInterest - 0.3 * h.interruptionCost + 0.1,
  ));
}

/** Best open loop for the session end: the student's own unresolved question first. */
export function pickOpenLoop(s: CuriosityState, model: { N: number; byIdx: (string | undefined)[] }, st: { mu: Float64Array }, conceptWeightOf: (conceptId: string) => number): CuriosityQuestion | null {
  const studentQs = s.questions.filter((q) => q.status === "unresolved" && q.source === "student");
  if (studentQs.length > 0) {
    // prefer the question tied to the highest-weight unresolved concept
    studentQs.sort((a, b) =>
      Math.max(0, ...b.conceptIds.map((c) => conceptWeightOf(c))) -
      Math.max(0, ...a.conceptIds.map((c) => conceptWeightOf(c))));
    return studentQs[0]!;
  }
  void model; void st;
  return null;
}
