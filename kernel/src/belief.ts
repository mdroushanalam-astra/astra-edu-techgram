/**
 * B2 — Belief Engine: the core of data-light intelligence.
 *
 * State: mean vector mu (N concepts, logit mastery) + covariance Sigma (N×N).
 * Prior = structure (general / topic / graph-smooth / concept-specific shares).
 * Observation model: 2PL with guess floor. Update: rank-1 extended Kalman.
 * One answer updates the answered concept AND every correlated concept via
 * Sigma[:,c] — this is the whole trick behind inferring prerequisites and
 * neighbours from few responses.
 *
 * Second opinion: per-topic Elo; disagreement widens bands and raises the
 * topic's information value. [PORT: prototype's preserve-disagreement principle]
 */

import { cholesky, invert, makeRng, sampleMVN, sigmoid, type Rng } from "./linalg.js";
import { laplacian, buildAdjacency, expertDifficultyToLogit, type Content } from "./content.js";
import { stabilityOf, type MemoryCell, type MemoryParams } from "./memory.js";

export interface BeliefParams {
  /** Variance shares (general, topic, graph, idiosyncratic) — assumed until ~500 students. */
  shares: { general: number; topic: number; graph: number; own: number };
  /** Total prior variance on the logit scale. */
  totalVariance: number;
  /** Reported-variance inflation (simulation found the filter mildly overconfident). */
  varianceInflation: number;
  /** Observation-model discrimination a (fixed until 200+ responses/item). */
  discrimination: number;
  /** Elo second-opinion step size. */
  eloK: number;
  /** |Elo − filter| above which model_disagreement is flagged. */
  disagreementThreshold: number;
  /** Onboarding self-rating (1..5) → logit shift per step. */
  selfRatingStep: number;
}

export const DEFAULT_BELIEF_PARAMS: BeliefParams = {
  shares: { general: 0.25, topic: 0.25, graph: 0.15, own: 0.35 },
  totalVariance: 1.4,
  varianceInflation: 1.2,
  discrimination: 0.9,
  eloK: 0.15,
  disagreementThreshold: 0.8,
  selfRatingStep: 0.5,
};

export interface Onboarding {
  /** Self-declared preparation level 1..5 (confidence capped upstream). */
  selfRating: number;
  /** Optional imported test-series section scores, topicId → fraction [0,1]. */
  scorecards?: Record<string, number>;
}

export interface BeliefState {
  mu: Float64Array; // N logit mastery means
  S: Float64Array; // N×N covariance, row-major
  nEff: Float64Array; // effective evidence count per concept
  lastTouch: Float64Array; // day of last evidence per concept (−1 = never)
  elo: Float64Array; // per-topic Elo second opinion (logit scale)
  eloSeen: Int32Array; // responses seen per topic
  modelDisagreement: boolean[]; // per topic
}

export interface BeliefModel {
  content: Content;
  params: BeliefParams;
  N: number;
  index: Map<string, number>; // conceptId → idx
  byIdx: (string | undefined)[]; // idx → conceptId
  topicIndexOf: Int32Array; // conceptIdx → topicIdx
  mu0: Float64Array; // prior mean
  Sigma0: Float64Array; // prior covariance (uninflated)
  conceptB: Float64Array; // mean item difficulty per concept (logit)
  memoryParams: MemoryParams;
}

/** Build the structural prior from content + onboarding. Pure. */
export function buildBeliefModel(
  content: Content,
  memoryParams: MemoryParams,
  params: BeliefParams = DEFAULT_BELIEF_PARAMS,
  onboarding?: Onboarding,
): BeliefModel {
  const N = content.concepts.length;
  const index = new Map<string, number>();
  content.concepts.forEach((c, i) => index.set(c.id, i));
  const byIdx: (string | undefined)[] = content.concepts.map((c) => c.id);

  const topicIds = content.topics.map((t) => t.id);
  const topicIndex = new Map(topicIds.map((t, i) => [t, i]));
  const topicIndexOf = new Int32Array(N);
  content.concepts.forEach((c, i) => {
    topicIndexOf[i] = topicIndex.get(c.topicId) ?? -1;
  });

  // Prior mean: base + self-rating shift + scorecard shifts.
  const mu0 = new Float64Array(N).fill(-0.4); // σ(−0.4) ≈ 0.40 baseline
  if (onboarding) {
    const shift = (onboarding.selfRating - 3) * params.selfRatingStep;
    for (let i = 0; i < N; i++) mu0[i] += shift;
    if (onboarding.scorecards) {
      for (const [topicId, frac] of Object.entries(onboarding.scorecards)) {
        const t = topicIndex.get(topicId);
        if (t === undefined) continue;
        // logit-ish shift, capped, basis self_reported/imported (noisy)
        const s = Math.max(0.05, Math.min(0.95, frac));
        const topicShift = 1.4 * (s - 0.45);
        for (let i = 0; i < N; i++) if (topicIndexOf[i] === t) mu0[i] += topicShift;
      }
    }
  }

  // Prior covariance: Σ0 = V · normalize(a·11ᵀ + b·TTᵀ + c·K_graph + d·I)
  const A = buildAdjacency(content, N, index);
  const L = laplacian(A, N);
  for (let i = 0; i < N; i++) L[i * N + i] += 0.3; // K_graph = (L + 0.3 I)^-1
  const Kgraph = invert(L, N);
  const { general: a, topic: b, graph: c, own: d } = params.shares;

  const Sigma0 = new Float64Array(N * N);
  // general: a * 1 * 1'
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) Sigma0[i * N + j] += a;
  // topic: b * T T' (1 if same topic)
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) if (topicIndexOf[i] === topicIndexOf[j]) Sigma0[i * N + j] += b;
  // graph: c * K_graph
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) Sigma0[i * N + j] += c * Kgraph[i * N + j];
  // own: d * I
  for (let i = 0; i < N; i++) Sigma0[i * N + i] += d;
  // normalize so mean diagonal = 1, then scale by totalVariance
  let diagMean = 0;
  for (let i = 0; i < N; i++) diagMean += Sigma0[i * N + i];
  diagMean /= N;
  const scale = params.totalVariance / diagMean;
  for (let k = 0; k < Sigma0.length; k++) Sigma0[k] *= scale;

  // Mean item difficulty per concept.
  const conceptB = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const cid = byIdx[i]!;
    const items = content.itemsByConcept.get(cid) ?? [];
    if (items.length === 0) {
      conceptB[i] = 0;
      continue;
    }
    let s = 0;
    for (const it of items) s += expertDifficultyToLogit(it.difficulty);
    conceptB[i] = s / items.length;
  }

  return {
    content,
    params,
    N,
    index,
    byIdx,
    topicIndexOf,
    mu0,
    Sigma0,
    conceptB,
    memoryParams,
  };
}

export function initialState(model: BeliefModel): BeliefState {
  return {
    mu: model.mu0.slice(),
    S: model.Sigma0.slice(),
    nEff: new Float64Array(model.N),
    lastTouch: new Float64Array(model.N).fill(-1),
    elo: new Float64Array(model.content.topics.length),
    eloSeen: new Int32Array(model.content.topics.length),
    modelDisagreement: new Array(model.content.topics.length).fill(false),
  };
}

export interface Observation {
  conceptId: string;
  /** Item difficulty logit (or concept mean b if null). */
  b?: number;
  correct: boolean;
  /** Evidence weight in (0, 2]: 1 = clean response; 0.5 low; 1.3 confident; 0 = ignore. */
  evidenceW: number;
  /** Logical day of the observation. */
  day: number;
}

/**
 * Rank-1 EKF update. Pure with respect to the state passed in
 * (callers pass a copy if they need history). Time must be logical.
 */
export function observe(model: BeliefModel, st: BeliefState, obs: Observation): BeliefState {
  if (obs.evidenceW <= 0) return st; // rapid guesses teach us nothing
  const i = model.index.get(obs.conceptId);
  if (i === undefined) throw new Error(`observe: unknown concept ${obs.conceptId}`);
  const N = model.N;
  const a = model.params.discrimination;
  const b = obs.b ?? model.conceptB[i];

  const z = sigmoid(a * (st.mu[i] - b));
  const h = model.content.exam.guessFloor + (1 - model.content.exam.guessFloor) * z; // predicted P(correct)
  const H = (1 - model.content.exam.guessFloor) * a * z * (1 - z); // dh/dθ
  const y = obs.correct ? 1 : 0;
  const R = Math.max(h * (1 - h), 1e-3) / obs.evidenceW;
  const s = H * H * st.S[i * N + i] + R;
  if (s <= 0) return st;

  // K = Σ[:,c] · H / s  →  mu += K (y − h);  Σ −= Σ[:,c] Σ[:,c]ᵀ H² / s
  const col = new Float64Array(N);
  for (let r = 0; r < N; r++) col[r] = st.S[r * N + i];
  const kScale = (H / s) * (y - h);
  const downH2 = (H * H) / s;
  for (let r = 0; r < N; r++) st.mu[r] += col[r] * kScale;
  for (let r = 0; r < N; r++) {
    const cr = col[r];
    if (cr === 0) continue;
    for (let q = 0; q < N; q++) st.S[r * N + q] -= cr * col[q] * downH2;
  }
  // Keep the diagonal strictly positive (numerical hygiene).
  for (let r = 0; r < N; r++) st.S[r * N + r] = Math.max(st.S[r * N + r], 1e-6);

  st.nEff[i] += obs.evidenceW;
  st.lastTouch[i] = Math.max(st.lastTouch[i], obs.day);

  // Elo second opinion on the topic.
  const t = model.topicIndexOf[i];
  if (t >= 0) {
    const expected = sigmoid(st.elo[t] - b);
    st.elo[t] += model.params.eloK * ((obs.correct ? 1 : 0) - expected);
    st.eloSeen[t] += 1;
    if (st.eloSeen[t] >= 8) {
      // topic-level filter mean (logit average over the topic's concepts)
      let sum = 0, n = 0;
      for (let r = 0; r < N; r++) if (model.topicIndexOf[r] === t) { sum += st.mu[r]; n++; }
      const filterMean = n > 0 ? sum / n : 0;
      st.modelDisagreement[t] =
        Math.abs(st.elo[t] - filterMean) > model.params.disagreementThreshold;
    }
  }
  return st;
}

/**
 * Time update: forgetting decays mastery toward the prior mean (not toward
 * zero) and uncertainty grows back toward the prior. Coherent with the
 * memory engine: per-concept decay uses stability S from B3.
 * `memoryByConcept` maps conceptIdx → cell (may be undefined = never reviewed).
 */
export function timeUpdate(
  model: BeliefModel,
  st: BeliefState,
  memory: Map<number, MemoryCell>,
  dtDays: number,
): BeliefState {
  if (dtDays <= 0) return st;
  const N = model.N;
  const D = new Float64Array(N); // decay factor per concept
  for (let i = 0; i < N; i++) {
    const cid = model.byIdx[i]!;
    const type = model.content.conceptById.get(cid)!.type;
    const S = stabilityOf(memory.get(i), type, model.memoryParams);
    D[i] = Math.exp(-dtDays / Math.max(S, 0.5));
  }
  for (let i = 0; i < N; i++) {
    st.mu[i] = model.mu0[i] + D[i] * (st.mu[i] - model.mu0[i]);
  }
  // Σ ← D Σ D + (I − D²) ∘ diag(Σ0)
  const S2 = new Float64Array(N * N);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      S2[i * N + j] = D[i] * st.S[i * N + j] * D[j];
    }
  }
  for (let i = 0; i < N; i++) {
    const growth = (1 - D[i] * D[i]) * model.Sigma0[i * N + i];
    S2[i * N + i] += growth;
  }
  st.S = S2;
  return st;
}

// ---------- honest reporting ----------

export interface ReportedMastery {
  conceptId: string;
  mean: number; // σ(μ), inflated variance applied to interval only
  lo: number; // 80% credible interval lower
  hi: number;
  nEff: number;
  lastObservedDay: number; // −1 = never
  /** "unknown-ish" when evidence is too thin to report a mean at face value. */
  grey: boolean;
}

const Z80 = 1.2816;

export function reportConcept(model: BeliefModel, st: BeliefState, conceptId: string): ReportedMastery {
  const i = model.index.get(conceptId)!;
  const sd = Math.sqrt(Math.max(st.S[i * model.N + i], 0)) * model.params.varianceInflation;
  const nEff = st.nEff[i];
  return {
    conceptId,
    mean: sigmoid(st.mu[i]),
    lo: sigmoid(st.mu[i] - Z80 * sd),
    hi: sigmoid(st.mu[i] + Z80 * sd),
    nEff,
    lastObservedDay: st.lastTouch[i],
    grey: nEff < 3,
  };
}

/**
 * Exam-weighted expected score under current beliefs (no plan applied),
 * scaled to the full paper: blueprint weight × (questions / Σweights).
 */
export function expectedScore(model: BeliefModel, st: BeliefState): number {
  let wSum = 0;
  for (let i = 0; i < model.N; i++) wSum += model.content.conceptWeight.get(model.byIdx[i]!) ?? 0;
  const scale = wSum > 0 ? model.content.exam.questions / wSum : 0;
  let marks = 0;
  for (let i = 0; i < model.N; i++) {
    const cid = model.byIdx[i]!;
    const w = model.content.conceptWeight.get(cid) ?? 0;
    if (w === 0) continue;
    const p =
      model.content.exam.guessFloor +
      (1 - model.content.exam.guessFloor) *
        sigmoid(model.params.discrimination * (st.mu[i] - model.conceptB[i]));
    marks += w * model.content.exam.marksEach * p * scale;
  }
  return marks;
}

/** sd of expected score under current posterior (delta method). */
export function expectedScoreSd(model: BeliefModel, st: BeliefState): number {
  let wSum = 0;
  for (let i = 0; i < model.N; i++) wSum += model.content.conceptWeight.get(model.byIdx[i]!) ?? 0;
  const scale = wSum > 0 ? model.content.exam.questions / wSum : 0;
  let varSum = 0;
  for (let i = 0; i < model.N; i++) {
    const w = model.content.conceptWeight.get(model.byIdx[i]!) ?? 0;
    if (w === 0) continue;
    const a = model.params.discrimination;
    const z = sigmoid(a * st.mu[i]);
    const dpdMu = (1 - model.content.exam.guessFloor) * a * z * (1 - z);
    varSum += (w * model.content.exam.marksEach * dpdMu * scale) ** 2 * st.S[i * model.N + i];
  }
  return Math.sqrt(varSum) * model.params.varianceInflation;
}

/** Sample K plausible student states from the posterior (for robust planning). */
export function samplePosterior(model: BeliefModel, st: BeliefState, K: number, rng: Rng): Float64Array[] {
  const N = model.N;
  const infl = model.params.varianceInflation;
  const Sinf = new Float64Array(N * N);
  for (let k = 0; k < Sinf.length; k++) Sinf[k] = st.S[k] * infl * infl;
  const L = cholesky(jitter(Sinf, N), N);
  const draws: Float64Array[] = [];
  const buf = new Float64Array(N);
  for (let k = 0; k < K; k++) {
    sampleMVN(st.mu, L, N, rng, buf);
    draws.push(buf.slice());
  }
  return draws;
}

function jitter(A: Float64Array, N: number): Float64Array {
  const B = A.slice();
  for (let i = 0; i < N; i++) B[i * N + i] += 1e-6;
  return B;
}
