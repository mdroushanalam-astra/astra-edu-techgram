/**
 * The Learning Envelope — the machine-enforced provenance contract.
 * [PORT] of the Python prototype's epistemics.py + the no-upgrade invariant
 * from the v2 architecture. Constructor-level validation, never hoped.
 */

export type KnowledgeType =
  | "assessed"
  | "inferred"
  | "predicted"
  | "self_reported"
  | "computed"
  | "unknown"
  | "decayed";

export type ObservationBasis =
  | "mock_test"
  | "session_quiz"
  | "diagnostic"
  | "item_response_pattern"
  | "behavioral_log"
  | "self_declaration"
  | "retention_model"
  | "system_default"
  | "state_fusion"
  | "llm_rubric";

export type ValueSemantics = "exact" | "lower_bound" | "estimate";

const KNOWLEDGE_TYPES: ReadonlySet<KnowledgeType> = new Set([
  "assessed", "inferred", "predicted", "self_reported", "computed", "unknown", "decayed",
]);

const TEST_BASES: ReadonlySet<ObservationBasis> = new Set([
  "mock_test", "session_quiz", "diagnostic", "item_response_pattern",
]);

const BASES: ReadonlySet<ObservationBasis> = new Set([
  "mock_test", "session_quiz", "diagnostic", "item_response_pattern",
  "behavioral_log", "self_declaration", "retention_model",
  "system_default", "state_fusion", "llm_rubric",
]);

export interface EnvelopeInit {
  value: number | null;
  unit: string;
  knowledge_type: KnowledgeType;
  observation_basis: ObservationBasis;
  /** Logical time (days since epoch) the value was produced at. */
  observed_at: number;
  /** Logical expiry in days; undefined = no expiry. */
  valid_until?: number;
  decay_model?: "none" | "ebbinghaus" | "fsrs";
  decay_halflife_days?: number;
  confidence?: number;
  sample_size?: number;
  uncertainty?: number;
  value_semantics?: ValueSemantics;
  model_id?: string | null;
  model_version?: string | null;
}

export class Envelope {
  value: number | null;
  unit: string;
  knowledge_type: KnowledgeType;
  observation_basis: ObservationBasis;
  observed_at: number;
  valid_until: number | undefined;
  decay_model: "none" | "ebbinghaus" | "fsrs";
  decay_halflife_days: number;
  confidence: number;
  sample_size: number;
  uncertainty: number;
  value_semantics: ValueSemantics;
  model_id: string | null;
  model_version: string | null;

  constructor(init: EnvelopeInit) {
    // Rule 1: null value forces unknown with zero confidence, maximal uncertainty.
    if (init.value === null || init.value === undefined || Number.isNaN(init.value)) {
      init.knowledge_type = "unknown";
      init.confidence = 0;
      init.uncertainty = 1;
      init.value_semantics = "exact";
    }
    // Rule 2: knowledge_type validity.
    if (!KNOWLEDGE_TYPES.has(init.knowledge_type)) {
      throw new Error(`Envelope: invalid knowledge_type '${init.knowledge_type}'`);
    }
    // Rule 3: basis validity + assessed requires test-based observation.
    if (!BASES.has(init.observation_basis)) {
      throw new Error(`Envelope: invalid observation_basis '${init.observation_basis}'`);
    }
    if (init.knowledge_type === "assessed" && !TEST_BASES.has(init.observation_basis)) {
      throw new Error(
        `Envelope: assessed knowledge requires a test basis, got '${init.observation_basis}'`,
      );
    }
    // Rule 4: temporal decay enforcement (logical time in, logical time compared).
    if (init.valid_until !== undefined && init.observed_at > init.valid_until) {
      init.knowledge_type = "decayed";
      init.confidence = (init.confidence ?? 0.5) * 0.5;
    }
    // Rule 5: model provenance — predictions must name their generator.
    if (init.knowledge_type === "predicted" && !init.model_id) {
      throw new Error("Envelope: predicted knowledge requires model_id");
    }
    // Rule 6: epistemic non-negativity + confidence bounds.
    if ((init.uncertainty ?? 0) < 0) throw new Error("Envelope: uncertainty must be non-negative");
    const conf = init.confidence ?? 0.5;
    if (conf < 0 || conf > 1) throw new Error("Envelope: confidence must be in [0,1]");

    this.value = init.value;
    this.unit = init.unit;
    this.knowledge_type = init.knowledge_type;
    this.observation_basis = init.observation_basis;
    this.observed_at = init.observed_at;
    this.valid_until = init.valid_until;
    this.decay_model = init.decay_model ?? "none";
    this.decay_halflife_days = init.decay_halflife_days ?? 0;
    this.confidence = conf;
    this.sample_size = init.sample_size ?? 0;
    this.uncertainty = init.uncertainty ?? 0.1;
    this.value_semantics = init.value_semantics ?? "exact";
    this.model_id = init.model_id ?? null;
    this.model_version = init.model_version ?? null;
  }

  static unknown(unit: string, reason: ObservationBasis, now: number): Envelope {
    return new Envelope({
      value: null,
      unit,
      knowledge_type: "unknown",
      observation_basis: reason,
      observed_at: now,
      confidence: 0,
      uncertainty: 1,
      sample_size: 0,
    });
  }

  toDict(): Record<string, unknown> {
    return {
      value: this.value,
      unit: this.unit,
      knowledge_type: this.knowledge_type,
      observation_basis: this.observation_basis,
      observed_at: this.observed_at,
      valid_until: this.valid_until ?? null,
      decay_model: this.decay_model,
      decay_halflife_days: this.decay_halflife_days,
      confidence: round4(this.confidence),
      sample_size: this.sample_size,
      uncertainty: round4(this.uncertainty),
      value_semantics: this.value_semantics,
      model_id: this.model_id,
      model_version: this.model_version,
    };
  }
}

export function round4(x: number): number {
  return Math.round(x * 10000) / 10000;
}

/**
 * No-upgrade invariant: a derived fact may never claim a stronger
 * knowledge_type than the strongest input it was computed from.
 * Strength order (weakest → strongest):
 *   unknown < decayed < self_reported < predicted < inferred < computed < assessed
 */
const TYPE_STRENGTH: Record<KnowledgeType, number> = {
  unknown: 0,
  decayed: 1,
  self_reported: 2,
  predicted: 3,
  inferred: 4,
  computed: 5,
  assessed: 6,
};

export function strongestInputType(types: KnowledgeType[]): KnowledgeType {
  let best: KnowledgeType = "unknown";
  for (const t of types) if (TYPE_STRENGTH[t] > TYPE_STRENGTH[best]) best = t;
  return best;
}

export function assertNoUpgrade(derived: KnowledgeType, inputs: KnowledgeType[]): void {
  const strongest = strongestInputType(inputs);
  if (TYPE_STRENGTH[derived] > TYPE_STRENGTH[strongest]) {
    throw new Error(
      `No-upgrade violation: derived '${derived}' exceeds strongest input '${strongest}'`,
    );
  }
}
