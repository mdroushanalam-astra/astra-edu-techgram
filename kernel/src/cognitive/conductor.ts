/**
 * THE SESSION CONDUCTOR [Phase 3, corrected master roadmap §9] — the
 * execution runtime. Takes an ExperiencePlan from the Executive and produces
 * coherent execution steps. It does NOT decide the learning strategy — it
 * executes the decision. The loop stays alive: interruption → workspace
 * refresh → Executive → new ExperiencePlan.
 */
import type { ExperiencePlan } from "./experience-plan.js";

export interface ExecutionStep {
  step: number;
  channel: "learning" | "presence" | "expression" | "evidence" | "experience" | "agency";
  instruction: string;
  duration?: number;
  /** Whether the student needs to act before the next step. */
  waitForStudent: boolean;
}

/** Convert an ExperiencePlan into an ordered sequence of execution steps. */
export function conduct(plan: ExperiencePlan): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  let n = 0;
  const add = (channel: ExecutionStep["channel"], instruction: string, waitForStudent = false, duration?: number) => {
    steps.push({ step: ++n, channel, instruction, waitForStudent, duration });
  };

  // Learning channel — the educational intervention
  add("learning", `${plan.learning.action} ${plan.learning.conceptName ?? ""}`.trim(), true, plan.learning.minutes);

  // Presence channel — how the system behaves socially
  if (plan.presence.state === "silent" || plan.presence.state === "wait") {
    add("presence", `${plan.presence.state} — give the student room to think`, false, plan.presence.waitSeconds);
  } else if (plan.presence.state === "speaking") {
    add("presence", `speak — gaze ${plan.presence.gaze ?? "student"}${plan.presence.emphasis ? `, emphasize ${plan.presence.emphasis}` : ""}`);
  }

  // Expression channel — how the thought becomes visible
  if (plan.expression.surface !== "none") {
    add("expression", `${plan.expression.surface}${plan.expression.spec ? ": " + JSON.stringify(plan.expression.spec) : ""}`);
  }

  // Evidence channel — deliberate information generation
  for (const req of plan.evidence.requests) {
    add("evidence", `evidence request: ${req}`, true);
  }
  if (plan.evidence.showWhy) {
    add("evidence", "show why — expose the reasoning behind this plan");
  }

  // Experience channel — session rhythm
  add("experience", `session mode: ${plan.experience.mode}`);

  // Agency channel — hand control back to the student
  if (plan.agency.mode === "offer-choice" && plan.agency.choices) {
    add("agency", `offer choice: ${plan.agency.choices.join(" / ")}`, true);
  } else if (plan.agency.mode !== "recommend") {
    add("agency", `agency: ${plan.agency.mode}`, true);
  }

  return steps;
}

/** The Conductor's state after executing — feeds back into the Workspace. */
export interface ConductorState {
  executedSteps: number;
  totalSteps: number;
  waitingForStudent: boolean;
  interrupted: boolean;
  completed: boolean;
}

export function initialState(): ConductorState {
  return { executedSteps: 0, totalSteps: 0, waitingForStudent: false, interrupted: false, completed: false };
}

/** Advance the conductor state after each step. */
export function advance(state: ConductorState, total: number, studentActed: boolean): ConductorState {
  return {
    ...state,
    executedSteps: state.executedSteps + 1,
    totalSteps: total,
    waitingForStudent: studentActed,
  };
}
