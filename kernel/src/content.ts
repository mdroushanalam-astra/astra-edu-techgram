/**
 * Knowledge-asset types (B0) + the curriculum graph.
 * Content is data, versioned. The kernel reasons over it; it never mutates it.
 */

export type ConceptType = "factual" | "conceptual" | "applied";

export interface Topic {
  id: string;
  name: string;
  /** Expected number of Prelims questions from this topic (PYQ-derived). */
  examQuestions: number;
}

export interface Concept {
  id: string;
  topicId: string;
  name: string;
  type: ConceptType;
  /** Hard prerequisite concept ids — planner gates `learn` on these. */
  prereqs: string[];
  /** Confusable concept ids — feed CONTRAST moves and the misconception map. */
  confusableWith: string[];
}

export interface Item {
  id: string;
  conceptId: string;
  stem: string;
  options: [string, string, string, string];
  answer: number; // 0..3
  /** Expert-rated difficulty 1..5 → logit via fixed map. */
  difficulty: number;
  /** Typical seconds a prepared aspirant needs. */
  expectedTimeSec: number;
  /** Distractor index → misconception id (moat M2 tags). */
  distractorTags: Record<number, string>;
  /** Which cognitive channel this item primarily measures. */
  dimension: "recall" | "recognition" | "conceptual" | "application" | "transfer";
}

export interface ExamSpec {
  questions: number;
  marksEach: number;
  /** Fraction of marks lost on a wrong attempt (e.g. 1/3). */
  negativeFraction: number;
  guessFloor: number;
  /** Cutoff prior on total marks (mean, sd). */
  cutoff: { mean: number; sd: number };
  /** Attempt-policy break-even P(correct) — risk-neutral 0.25 for 4 options −1/3. */
  attemptBreakEven: number;
}

export interface Content {
  version: string;
  exam: ExamSpec;
  topics: Topic[];
  concepts: Concept[];
  items: Item[];
  /** topicId -> topic; conceptId -> concept; itemId -> item. */
  topicById: Map<string, Topic>;
  conceptById: Map<string, Concept>;
  itemById: Map<string, Item>;
  /** conceptId -> its items. */
  itemsByConcept: Map<string, Item[]>;
  /** Derived exam weight per concept (expected questions). */
  conceptWeight: Map<string, number>;
}

/** Fixed map: expert difficulty 1..5 → logit b (lower = easier). */
export function expertDifficultyToLogit(d: number): number {
  const map = [-1.2, -0.6, 0, 0.6, 1.2];
  return map[Math.max(1, Math.min(5, Math.round(d))) - 1];
}

export function assembleContent(
  version: string,
  exam: ExamSpec,
  topics: Topic[],
  concepts: Concept[],
  items: Item[],
): Content {
  const topicById = new Map(topics.map((t) => [t.id, t]));
  const conceptById = new Map(concepts.map((c) => [c.id, c]));
  const itemById = new Map(items.map((i) => [i.id, i]));
  const itemsByConcept = new Map<string, Item[]>();
  for (const it of items) {
    const arr = itemsByConcept.get(it.conceptId) ?? [];
    arr.push(it);
    itemsByConcept.set(it.conceptId, arr);
  }
  // Exam weight per concept = topic question share spread over its concepts.
  const conceptsPerTopic = new Map<string, number>();
  for (const c of concepts) {
    conceptsPerTopic.set(c.topicId, (conceptsPerTopic.get(c.topicId) ?? 0) + 1);
  }
  const conceptWeight = new Map<string, number>();
  for (const c of concepts) {
    const tq = topicById.get(c.topicId)?.examQuestions ?? 1;
    conceptWeight.set(c.id, tq / (conceptsPerTopic.get(c.topicId) ?? 1));
  }
  return {
    version, exam, topics, concepts, items,
    topicById, conceptById, itemById, itemsByConcept, conceptWeight,
  };
}

// ---------- graph (B0 structural prior) ----------

/**
 * Build the N×N adjacency (symmetric) from prereq + confusability edges.
 * Prereq edges connect at full strength; confusables at half strength.
 */
export function buildAdjacency(content: Content, N: number, index: Map<string, number>): Float64Array {
  const A = new Float64Array(N * N);
  for (const c of content.concepts) {
    const i = index.get(c.id);
    if (i === undefined) continue;
    for (const p of c.prereqs) {
      const j = index.get(p);
      if (j === undefined) continue;
      A[i * N + j] = 1;
      A[j * N + i] = 1;
    }
    for (const p of c.confusableWith) {
      const j = index.get(p);
      if (j === undefined || i === j) continue;
      // Confusability is pedagogically informative but weaker than prereq.
      if (A[i * N + j] === 0) {
        A[i * N + j] = 0.5;
        A[j * N + i] = 0.5;
      }
    }
  }
  return A;
}

/** Laplacian L = D − A of a symmetric adjacency. */
export function laplacian(A: Float64Array, N: number): Float64Array {
  const L = new Float64Array(N * N);
  for (let i = 0; i < N; i++) {
    let deg = 0;
    for (let j = 0; j < N; j++) {
      const a = A[i * N + j];
      L[i * N + j] = -a;
      deg += a;
    }
    L[i * N + i] = deg;
  }
  return L;
}
