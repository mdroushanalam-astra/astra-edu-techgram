/**
 * B9 — BEHAVIOUR ENGINE (rules first, deliberately weak, never labelling).
 * [ADR-018: the personalization engine — measured longitudinal behaviour,
 * hypotheses as INTERNAL action flags, one-tap probes, no diagnosis ever.]
 */

import type { StudentEvent } from "./events.js";

export interface BehaviourFeatures {
  daysObserved: number;
  /** Days with any session event. */
  activeDays: number;
  /** Sessions completed vs (completed + abandoned). */
  completionRate: number;
  /** Consecutive active days ending at the observation point. */
  streak: number;
  /** Days since the last active day. */
  gapDays: number;
  hintRate: number;
  rapidGuessRate: number;
  /** Average confidence on answered items (1..3). */
  meanConfidence: number;
  /** Accuracy on confident (3) answers minus accuracy overall. */
  confidenceAccuracyGap: number;
  /** item_responses in the window. */
  responses: number;
}

/**
 * Deterministic feature extraction from the raw event log over a window.
 * Log raw, derive later — these can always be re-derived from events.
 */
export function computeBehaviourFeatures(
  events: StudentEvent[],
  todayDay: number,
  windowDays = 14,
): BehaviourFeatures {
  const from = todayDay - windowDays;
  const inWindow = events.filter((e) => e.day > from && e.day <= todayDay);
  const sessionDays = new Set<number>();
  const activeDaysSet = new Set<number>();
  let completed = 0, abandoned = 0, hints = 0, rapidGuess = 0, responses = 0;
  let confSum = 0, confN = 0, conf3Correct = 0, conf3N = 0, correctAll = 0;

  for (const e of inWindow) {
    if (e.type === "session_completed" || e.type === "session_abandoned") sessionDays.add(e.day);
    if (e.type === "session_completed") { completed += 1; activeDaysSet.add(e.day); }
    if (e.type === "session_abandoned") { abandoned += 1; activeDaysSet.add(e.day); }
    if (e.type === "item_response") {
      activeDaysSet.add(e.day);
      responses += 1;
      const correct = Boolean(e.payload.correct);
      if (correct) correctAll += 1;
      const t = typeof e.payload.time_sec === "number" ? e.payload.time_sec : undefined;
      if (t !== undefined && t <= 5) rapidGuess += 1;
      const c = e.payload.confidence as number | undefined;
      if (c !== undefined) {
        confSum += c; confN += 1;
        if (c === 3) { conf3N += 1; if (correct) conf3Correct += 1; }
      }
    }
    if (e.type === "hint_used") hints += 1;
  }

  // streak: consecutive active days ending today or yesterday.
  let streak = 0;
  let cursor = activeDaysSet.has(todayDay) ? todayDay : todayDay - 1;
  while (activeDaysSet.has(cursor)) { streak += 1; cursor -= 1; }

  let gapDays = 0;
  while (!activeDaysSet.has(todayDay - gapDays) && gapDays < windowDays) gapDays += 1;

  const completions = completed + abandoned;
  return {
    daysObserved: windowDays,
    activeDays: activeDaysSet.size,
    completionRate: completions > 0 ? completed / completions : 1,
    streak,
    gapDays,
    hintRate: responses > 0 ? hints / responses : 0,
    rapidGuessRate: responses > 0 ? rapidGuess / responses : 0,
    meanConfidence: confN > 0 ? confSum / confN : 0,
    confidenceAccuracyGap: conf3N >= 3 ? conf3Correct / conf3N - (responses > 0 ? correctAll / responses : 0) : 0,
    responses,
  };
}

/**
 * INTERNAL action flags — never student-facing labels. Each flag changes an
 * ACTION (plan weight, hint policy, rest), per ADR-018.
 */
export interface BehaviourFlags {
  /** 2+ wrong in a row pattern / high abandonment on hard content → lower difficulty, scaffold. */
  scaffoldNext: boolean;
  /** Long passive stretches (low responses on active days) → retrieval-first. */
  forceRetrieval: boolean;
  /** Hint dependence (hintRate high) → fade hints. */
  fadeHints: boolean;
  /** Overconfident (conf-3 accuracy materially below overall) → calibration drills. */
  calibrationDrill: boolean;
  /** Burnout drift (long gap after streak + falling completion) → LIGHTER plan, not escalation. */
  lightenPlan: boolean;
  restDay: boolean;
  /** Missed-session hypotheses (posterior, hand-set likelihoods). Emitted ONLY to the probe. */
  missedHypotheses?: Record<string, number>;
  /** One-tap probe when no hypothesis is dominant (top < 0.5). */
  probeNeeded: boolean;
}

export function behaviourFlags(f: BehaviourFeatures, missedSessions: number): BehaviourFlags {
  const flags: BehaviourFlags = {
    scaffoldNext: f.completionRate < 0.5 && f.responses > 0,
    forceRetrieval: f.responses > 0 && f.activeDays > 0 && f.hintRate < 0.05 && f.responses / Math.max(1, f.activeDays) < 5,
    fadeHints: f.hintRate > 0.35,
    calibrationDrill: f.confidenceAccuracyGap < -0.15 && f.responses >= 20,
    lightenPlan: f.gapDays >= 3 && f.streak === 0,
    restDay: f.responses > 40 && f.completionRate < 0.4,
    probeNeeded: false,
  };
  if (missedSessions >= 3) {
    const hyp: Record<string, number> = {
      schedule_mismatch: 0.30,
      difficulty: 0.22,
      motivation: 0.18,
      interruption: 0.15,
      notification_ignored: 0.10,
      unknown: 0.05,
    };
    // Normalise (hand-set likelihoods, v2x §7.4 — honest priors).
    const sum = Object.values(hyp).reduce((a, b) => a + b, 0);
    for (const k of Object.keys(hyp)) hyp[k] = (hyp[k] ?? 0) / sum;
    flags.missedHypotheses = hyp;
    const top = Math.max(...Object.values(hyp));
    flags.probeNeeded = top < 0.5; // no dominant hypothesis → ASK, don't guess
  }
  return flags;
}

/**
 * Notification policy (NOTIFICATION slot, V1 rules): at most one/day is the
 * caller's cap; here we decide send/no-send. Delivery is network-dependent —
 * the KERNEL decision is not.
 */
export function notificationDecision(
  f: BehaviourFeatures,
  planDoneToday: boolean,
  consecutiveIgnored: number,
): { send: boolean; reason: string } {
  if (planDoneToday) return { send: false, reason: "plan already complete today — silence is respect" };
  if (consecutiveIgnored >= 2) {
    return { send: false, reason: "two consecutive ignored nudges — back off (anti-nag rule)" };
  }
  if (f.gapDays >= 7) {
    return { send: true, reason: "7-day gap — one gentle re-entry nudge with the smallest possible task" };
  }
  if (f.streak >= 3) {
    return { send: true, reason: "streak ≥3 — protect the rhythm with the usual-time nudge" };
  }
  return { send: true, reason: "default daily nudge at the student's median start window" };
}

/** The one-tap probe text (deterministic template; answers are self_reported, capped). */
export function missedSessionProbe(): { question: string; options: string[] } {
  return {
    question: "What got in the way on the missed days?",
    options: ["My schedule changed", "The material felt too hard", "Motivation dipped", "Something came up unexpectedly", "I didn't see the reminders"],
  };
}
