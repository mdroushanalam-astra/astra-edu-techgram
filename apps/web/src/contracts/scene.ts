/**
 * SPRINT 0 — SESSION SCENE GRAPH [ADR-032, ChatGPT refinement adopted]
 * The frontend never receives commands like "show graph" — it receives a
 * typed SESSION SCENE. The kernel (via teach_loop teacher moves + session
 * state) determines WHAT the scene contains; the Presence Layer determines
 * HOW it is expressed; renderers (hologram, blackboard, voice, input)
 * consume the scene. This is what makes camera direction, cross-modal
 * sync and the "shut up gracefully" rule testable instead of vibes.
 */

import type { Utterance } from "./provenance.js";

/** Interpersonal presence states — stillness is part of intelligence. */
export type PresenceState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "pointing"
  | "explaining"
  | "waiting"
  | "responding"
  | "reflecting"
  | "absent"; // "the system must be able to shut up": avatar may fade entirely

/** Where the gaze/attention of the teacher rests. Camera-contact is default. */
export type GazeTarget = "student" | "board" | "away";

/** Scene camera (the 2.5D stagecraft engine renders these as parallax moves). */
export type CameraShot = "close-up" | "medium" | "wide" | "board-focus" | "minimal";

export type TeacherExpression =
  | "neutral"
  | "attentive"        // wrong answer → curious/attentive, NEVER anger
  | "thoughtful"
  | "warm"
  | "small-genuine-excitement"
  | "concerned-lean-in"
  | "playful"
  | "calm";

export interface SceneTeacher {
  presence: PresenceState;
  gaze: GazeTarget;
  expression: TeacherExpression;
  /** The utterance being delivered (provenance-validated upstream). */
  utterance?: Utterance;
}

export interface SceneBlackboard {
  /** Board elements currently on the slate (board.ts primitives). */
  elements: { id: string; kind: string; ref?: { kind: string; id: string } }[];
  /** Element ids animating right now (draw-on, highlight, reveal-missing-link). */
  animating: string[];
  /** Which element has focus (the "notice what happens here" sync point). */
  focus?: string;
}

export interface SceneInteraction {
  mode: "question" | "free_response" | "waiting" | "none";
  /** Answer affordances — text/tap is ALWAYS present (voice is additive). */
  accept: ("tap" | "text" | "voice")[];
  options?: { id: string; label: string }[];
  /** Hint affordance state (L1→L3 fade ladder is kernel policy). */
  hintAvailable?: boolean;
}

/** Evidence layer — the third simultaneous layer (HUMAN / THINKING / EVIDENCE). */
export interface SceneEvidence {
  /** One-plain-language reason THIS exists, kernel-derived. */
  reason?: string;
  uncertainty: { level: "known" | "grey" | "unknown"; band?: [number, number] };
  /** "Why this?" primitive is available on this scene. */
  whyThisAvailable: boolean;
}

/**
 * The typed scene. Renderers are pure functions of this + prior scene.
 * The Presence Layer (not components) composes scenes from kernel events.
 */
export interface SessionScene {
  seq: number;
  teacher: SceneTeacher;
  blackboard: SceneBlackboard;
  interaction: SceneInteraction;
  evidence: SceneEvidence;
  camera: CameraShot;
  /** Timing hypothesis (ms) — tuned on hardware, never sacred [ADR-032]. */
  acknowledgmentMs?: number;
  /** Reduced-motion / accessibility: renderers must honor. */
  reducedMotion?: boolean;
}

/** The Presence Layer's composition contract: kernel events in, scenes out. */
export interface PresenceComposer {
  /** Build the next scene from the previous scene + a kernel teacher event. */
  next(prev: SessionScene | null, kernelEvent: SceneKernelEvent): SessionScene;
}

/** Discriminated kernel events the Presence Layer understands. */
export type SceneKernelEvent =
  | { type: "session_open"; greeting: Utterance }
  | { type: "move"; move: string; utterance?: Utterance }   // teacher.ts move id
  | { type: "board_update"; elements: SceneBlackboard["elements"]; animate?: string[]; focus?: string }
  | { type: "await_answer"; mode: SceneInteraction["mode"]; options?: SceneInteraction["options"] }
  | { type: "student_answer"; answerId?: string; text?: string }
  | { type: "student_silence"; msElapsed: number }
  | { type: "break_suggest"; utterance: Utterance }         // measured fatigue, embodied
  | { type: "session_close"; closing: Utterance; trailer?: Utterance };
