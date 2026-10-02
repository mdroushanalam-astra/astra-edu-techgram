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

/* ==========================================================================
 * PERSONALISATION STATE v1 [ADR-024]
 * Measured, enveloped-behaviour features consumed by the planner (load and
 * length), the teacher (tone) and the notification slot (timing).
 * THE OBSERVABLE-STATE LAW [ADR-023]: these are observed/inferred behavioural
 * features — never claims about internal mental state, never labels.
 * ========================================================================== */

export interface PersonalisationState {
  /** Accuracy trend over the last 3 active days, clamped [-1, 1]. + = improving. */
  momentum: number;
  /** Median within-session response-time drift (late-third / early-third − 1), ≥ 0. */
  fatigueTimeSlope: number;
  /** Median within-session error-rate rise (late − early), ≥ 0. */
  fatigueErrorSlope: number;
  /** 0..1 — rapid-wrong + hint-escalation rate (frustration signature). */
  frustration: number;
  /** Max completed day-minutes without abandonment (0 = unknown). */
  loadToleranceMin: number;
  /** Median completed session minutes (null = fewer than 2 completed sessions). */
  optimalSessionMin: number | null;
  /** Median local start minute-of-day (undefined unless events log time_of_day_min). */
  chronotypeMin?: number;
  /** Spread of start minutes (IQR), same condition. */
  chronotypeSpread?: number;
  /** Planned concepts with repeated no-response sessions (avoidance pattern). */
  avoidance: { conceptId: string; missedSessions: number }[];
  /** P(correct | previous item wrong) within the window — resilience. */
  recoveryRate: number;
  /** Evidence volume behind this state. */
  responses: number;
}

/**
 * Compute the Personalisation State from raw events over a window.
 * Deterministic; every field degrades to an honest neutral/unknown default
 * when evidence is thin. Consumed by planner/teacher/notification — never
 * rendered to the student as a label.
 */
export function computePersonalisationState(
  events: StudentEvent[],
  todayDay: number,
  windowDays = 14,
): PersonalisationState {
  const from = todayDay - windowDays;
  const inWindow = events.filter((e) => e.day > from && e.day <= todayDay);

  // --- group item responses by day, in event order (within-session ordering)
  const byDay = new Map<number, { correct: boolean; timeSec?: number; conceptId: string; hint?: boolean }[]>();
  const startedSessions = new Map<string, { day: number; conceptId: string }>(); // `${day}:${conceptId}`
  const completedDayMinutes: number[] = [];

  for (const e of inWindow) {
    if (e.type === "item_response") {
      const arr = byDay.get(e.day) ?? [];
      arr.push({
        correct: Boolean(e.payload.correct),
        timeSec: typeof e.payload.time_sec === "number" ? e.payload.time_sec : undefined,
        conceptId: String(e.payload.concept_id ?? ""),
        hint: e.payload.hint_used === true,
      });
      byDay.set(e.day, arr);
    } else if (e.type === "session_started") {
      const cid = String(e.payload.topic ?? e.payload.concept_id ?? "");
      startedSessions.set(`${e.day}:${cid}`, { day: e.day, conceptId: cid });
    } else if (e.type === "session_completed" || e.type === "session_abandoned") {
      const mins = Number(e.payload.minutes ?? e.payload.duration_min ?? 0);
      if (mins > 0 && e.type === "session_completed") completedDayMinutes.push(mins);
    }
  }

  // active-day helpers reused from the local set
  const active = new Set<number>();
  for (const d of byDay.keys()) if ((byDay.get(d)?.length ?? 0) > 0) active.add(d);

  // --- momentum: slope of daily accuracy across the last 3 active days
  const activeDaysSorted = [...active].sort((a, b) => a - b);
  const last3 = activeDaysSorted.slice(-3).map((d) => {
    const rs = byDay.get(d)!;
    return rs.filter((r) => r.correct).length / rs.length;
  });
  let momentum = 0;
  if (last3.length >= 2) {
    const slope = (last3[last3.length - 1]! - last3[0]!) / (last3.length - 1);
    momentum = Math.max(-1, Math.min(1, slope * 2));
  }

  // --- fatigue: within-day early vs late thirds (days with >= 6 responses)
  const timeDrifts: number[] = [];
  const errorRises: number[] = [];
  for (const [, rs] of byDay) {
    if (rs.length < 6) continue;
    const third = Math.floor(rs.length / 3);
    const early = rs.slice(0, third);
    const late = rs.slice(-third);
    const med = (xs: (number | undefined)[]) => {
      const v = xs.filter((x): x is number => x !== undefined).sort((a, b) => a - b);
      return v.length ? v[Math.floor(v.length / 2)]! : undefined;
    };
    const eT = med(early.map((r) => r.timeSec));
    const lT = med(late.map((r) => r.timeSec));
    if (eT !== undefined && lT !== undefined && eT > 0) timeDrifts.push(Math.max(0, lT / eT - 1));
    const eE = early.filter((r) => !r.correct).length / early.length;
    const lE = late.filter((r) => !r.correct).length / late.length;
    errorRises.push(Math.max(0, lE - eE));
  }
  const median = (xs: number[]) => (xs.length ? xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)]! : 0);

  // --- frustration: rapid-wrong + hint escalation, median daily rate
  const dayTimes = new Map<number, number[]>();
  for (const [d, rs] of byDay) {
    const ts = rs.map((r) => r.timeSec).filter((t): t is number => t !== undefined);
    if (ts.length) dayTimes.set(d, ts);
  }
  const frustByDay: number[] = [];
  for (const [d, rs] of byDay) {
    if (rs.length < 4) continue;
    const dayTs = (dayTimes.get(d) ?? []).slice().sort((a, b) => a - b);
    const medT = dayTs.length ? dayTs[Math.floor(dayTs.length / 2)]! : 45;
    const rapidWrong = rs.filter((r) => !r.correct && r.timeSec !== undefined && r.timeSec < 0.4 * medT).length;
    const hintEsc = rs.filter((r) => r.hint === true).length;
    frustByDay.push((rapidWrong + hintEsc) / rs.length);
  }

  // --- avoidance: started sessions with zero responses that day, per concept
  const missCount = new Map<string, number>();
  for (const [key, s] of startedSessions) {
    const rs = byDay.get(s.day) ?? [];
    const touched = rs.some((r) => r.conceptId === s.conceptId);
    if (!touched) missCount.set(s.conceptId, (missCount.get(s.conceptId) ?? 0) + 1);
  }
  const avoidance = [...missCount.entries()]
    .filter(([, n]) => n >= 2)
    .map(([conceptId, missedSessions]) => ({ conceptId, missedSessions }))
    .sort((a, b) => b.missedSessions - a.missedSessions)
    .slice(0, 5);

  // --- recovery: P(correct | previous item wrong), same-day consecutive pairs
  let recoverOpps = 0, recoverHits = 0;
  for (const [, rs] of byDay) {
    for (let i = 1; i < rs.length; i++) {
      if (!rs[i - 1]!.correct) { recoverOpps += 1; if (rs[i]!.correct) recoverHits += 1; }
    }
  }

  // --- chronotype: median first-event minute of day (only when logged)
  const firstMinByDay = new Map<number, number[]>();
  for (const e of inWindow) {
    const m = e.payload.time_of_day_min;
    if (typeof m !== "number") continue;
    const arr = firstMinByDay.get(e.day) ?? [];
    if (arr.length === 0 || m < arr[0]!) arr.unshift(m); else arr.push(m);
    firstMinByDay.set(e.day, arr);
  }
  const startMins = [...firstMinByDay.values()].map((a) => a[0]!);
  let chronotypeMin: number | undefined, chronotypeSpread: number | undefined;
  if (startMins.length >= 3) {
    const s = startMins.slice().sort((a, b) => a - b);
    chronotypeMin = s[Math.floor(s.length / 2)]!;
    const q1 = s[Math.floor(s.length * 0.25)]!, q3 = s[Math.floor(s.length * 0.75)]!;
    chronotypeSpread = q3 - q1;
  }

  const responses = [...byDay.values()].reduce((a, rs) => a + rs.length, 0);

  return {
    momentum,
    fatigueTimeSlope: median(timeDrifts),
    fatigueErrorSlope: median(errorRises),
    frustration: median(frustByDay),
    loadToleranceMin: completedDayMinutes.length ? Math.max(...completedDayMinutes) : 0,
    optimalSessionMin: completedDayMinutes.length >= 2 ? median(completedDayMinutes) : null,
    chronotypeMin,
    chronotypeSpread,
    avoidance,
    recoveryRate: recoverOpps > 0 ? recoverHits / recoverOpps : 0.5,
    responses,
  };
}

/**
 * RETURN MODEL v0 [ADR-025] — assumed-weight propensity of next-day return.
 * Versioned like the AOM: weights are ASSUMED until pilot outcomes calibrate
 * them. Consumed by the NOTIFICATION slot and plan sizing. Not a label, not
 * shown raw to students.
 */
export interface ReturnModelParams {
  version: string;
  weights: { intercept: number; streak: number; gapDays: number; completionRate: number; momentum: number };
  status: "assumed" | "measured";
}

export const DEFAULT_RETURN_MODEL: ReturnModelParams = {
  version: "return-model-0.1.0-assumed",
  status: "assumed",
  weights: { intercept: -0.4, streak: 0.18, gapDays: -0.22, completionRate: 0.9, momentum: 0.55 },
};

export function returnPropensity(
  p: ReturnModelParams,
  f: { streak: number; gapDays: number; completionRate: number; momentum: number },
): { p: number; version: string; status: "assumed" | "measured" } {
  const w = p.weights;
  const z = w.intercept + w.streak * f.streak - Math.abs(w.gapDays) * f.gapDays
    + w.completionRate * f.completionRate + w.momentum * f.momentum;
  const sig = 1 / (1 + Math.exp(-z));
  return { p: Math.max(0.01, Math.min(0.99, sig)), version: p.version, status: p.status };
}
