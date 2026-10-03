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
  if (p.evidence.requests.length === 0 && p.expression.surface === "none" && p.learning.action !== "rest") {
    throw new ExperiencePlanError("ExperiencePlan: a non-rest plan must carry at least one evidence request or expression");
  }
}
