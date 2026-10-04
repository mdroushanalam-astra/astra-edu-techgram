/**
 * EXPERIENCEPLAN [Phase 0, corrected master roadmap §6.3] — the seam between
 * cognition and execution. An OUTPUT of cognition, not a second brain: the
 * Executive produces it; the Session Conductor executes it; neither may
 * redefine it. Six coordinated channels + the prediction reference + the
 * decision receipt reference.
 */

export interface LearningChannel {
  action: "retrieve" | "diagnose" | "teach" | "compare" | "practice" | "simulate" | "transfer" | "rest";
  conceptId?: string;
  conceptName?: string;
  minutes?: number;
}

export interface PresenceChannel {
  state: "speaking" | "listening" | "thinking" | "silent" | "wait";
  gaze?: "student" | "board" | "away";
  emphasis?: string;
  waitSeconds?: number;
}

export interface ExpressionChannel {
  surface: "board" | "chart" | "text" | "highlight" | "animation" | "example" | "question" | "none";
  spec?: Record<string, unknown>;
}

export interface EvidenceChannel {
  requests: ("confidence" | "delayed-recall" | "counterexample" | "diagnostic" | "prediction-request")[];
  showWhy: boolean;
}

export interface ExperienceChannel {
  mode: "continue" | "switch" | "compress" | "expand" | "break" | "revisit" | "end";
}

export interface AgencyChannel {
  mode: "recommend" | "offer-choice" | "invite-proposal" | "challenge" | "delegate";
  choices?: string[];
}

export interface ExperiencePlan {
  id: string;
  learning: LearningChannel;
  presence: PresenceChannel;
  expression: ExpressionChannel;
  evidence: EvidenceChannel;
  experience: ExperienceChannel;
  agency: AgencyChannel;
  /** The prediction this plan expects to test — ref into the Prediction Registry. */
  expectedOutcome: { predictionRef: string; predictedBenefit: number; uncertainty: number };
  /** The decision receipt this plan came from. */
  rationale: { receiptId: string; reasons: string[]; evidenceRefs: string[] };
}

export class ExperiencePlanError extends Error {}

/** The seam's gate: a plan the Conductor cannot understand is not emitted. */
export function validateExperiencePlan(p: ExperiencePlan): void {
  const channels = ["learning", "presence", "expression", "evidence", "experience", "agency"] as const;
  for (const ch of channels) {
    if (!p[ch]) throw new ExperiencePlanError(`ExperiencePlan ${p.id}: missing channel "${ch}"`);
  }
  if (!p.learning.action) throw new ExperiencePlanError("ExperiencePlan: learning action required");
  // [Refined at Phase 4, discovered BY the gate] The learning channel itself
  // always carries the turn, and SILENCE is a first-class presence — so a plan
  // with no expression surface and no evidence request is coherent (voice-only
  // teaching, silent reflection). What is NOT coherent is an unnamed action.
}


/* ── the bridge: Executive directive → ExperiencePlan ────────────────────── */

export interface DirectiveInput {
  learningAction: string;
  communication: string;
  presentation: string;
  augmentation: string;
  conceptId?: string;
  conceptName?: string;
  reasons: string[];
  evidenceRefs: string[];
  predictedBenefit: number;
  uncertainty: number;
  receiptId: string;
  fatigue: number;
}

/** The Executive's decision becomes an ExperiencePlan — the seam made real. */
export function planFromDirective(d: DirectiveInput): ExperiencePlan {
  const raw = d.learningAction;
  const learning = (raw === "break" ? "rest" : raw) as LearningChannel["action"];
  const isRest = learning === "rest";
  const presenceState: PresenceChannel['state'] =
    d.communication === 'silence' ? 'silent' :
    d.communication === 'challenge' ? 'thinking' :
    d.communication === 'reassure' ? 'speaking' : 'speaking';
  const surface: ExpressionChannel['surface'] =
    d.presentation === 'chart' ? 'chart' :
    d.presentation === 'board' ? 'board' :
    d.presentation === 'none' ? 'none' : 'text';
  const agencyMode: AgencyChannel['mode'] =
    d.communication === 'challenge' ? 'challenge' :
    d.communication === 'question' ? 'invite-proposal' : 'recommend';
  return {
    id: `exp_${d.receiptId}`,
    learning: { action: isRest ? 'rest' : learning, conceptId: d.conceptId, conceptName: d.conceptName },
    presence: { state: presenceState, gaze: presenceState === 'silent' ? 'away' : 'student' },
    expression: { surface },
    evidence: { requests: d.communication === 'question' ? ['confidence'] : [], showWhy: true },
    experience: { mode: isRest ? 'break' : 'continue' },
    agency: { mode: agencyMode },
    expectedOutcome: { predictionRef: d.receiptId, predictedBenefit: d.predictedBenefit, uncertainty: d.uncertainty },
    rationale: { receiptId: d.receiptId, reasons: d.reasons, evidenceRefs: d.evidenceRefs },
  };
}
