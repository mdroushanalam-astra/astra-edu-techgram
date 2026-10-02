/**
 * AGENCY TRANSFER [ADR-030] — the measurable gradient.
 *
 * Techgram's end state is not dependence: it is a student who increasingly
 * makes their own learning decisions well. This module MEASURES that
 * progression from observable decision events — nothing else.
 *
 * The gradient (who led the decision?):
 *   accepted_recommendation   → Techgram decided, student accepted
 *   proposed_with_reason      → student proposed a plan AND said why
 *   decided_independently     → student chose; Techgram verified afterwards
 *
 * ANTI-GOODHART: the raw agency index is never exposed to the student — a
 * single gamifiable number would turn "agency" into a metric to chase, which
 * destroys the thing it measures. The surface exposes stage names and counts
 * only. `agencySurface()` is the ONLY rendering path and structurally omits
 * the scalar.
 *
 * Observable-State Law [ADR-023]: stages ("techgram_led" / "shared" /
 * "student_led") describe WHO LED observed decisions — a behavioural pattern,
 * never a claim about the student's mind.
 */

export type DecisionType =
  | "topic_selection"
  | "retrieval_selection"
  | "difficulty_selection"
  | "misconception_detection"
  | "session_length"
  | "break_timing"
  | "help_seeking"
  | "strategy_selection";

export const DECISION_TYPES: DecisionType[] = [
  "topic_selection",
  "retrieval_selection",
  "difficulty_selection",
  "misconception_detection",
  "session_length",
  "break_timing",
  "help_seeking",
  "strategy_selection",
];

export type AgencyMode = "accepted_recommendation" | "proposed_with_reason" | "decided_independently";

const MODE_WEIGHT: Record<AgencyMode, number> = {
  accepted_recommendation: 0,
  proposed_with_reason: 0.5,
  decided_independently: 1,
};

export interface DecisionStats {
  accepted: number;
  proposed: number;
  independent: number;
  firstDay: number;
  lastDay: number;
}

export interface AgencyState {
  decisions: Record<string, DecisionStats>;
}

export function newAgencyState(): AgencyState {
  return { decisions: {} };
}

export function copyAgencyState(s: AgencyState): AgencyState {
  const decisions: Record<string, DecisionStats> = {};
  for (const [k, v] of Object.entries(s.decisions)) decisions[k] = { ...v };
  return { decisions };
}

/**
 * Record one observed decision. Pure: returns a NEW AgencyState.
 * Unknown decision types and non-finite days are ignored (forward
 * compatibility + data hygiene — a malformed event must not poison the
 * state machine [Brain-Freeze audit, Journal 15]).
 */
export function observeAgency(s: AgencyState, decision: DecisionType, mode: AgencyMode, day: number): AgencyState {
  if (!DECISION_TYPES.includes(decision)) return s;
  if (!Number.isFinite(day)) return s;
  const prev = s.decisions[decision] ?? { accepted: 0, proposed: 0, independent: 0, firstDay: day, lastDay: day };
  const next: DecisionStats = { ...prev, lastDay: Math.max(prev.lastDay, day), firstDay: Math.min(prev.firstDay, day) };
  if (mode === "accepted_recommendation") next.accepted += 1;
  else if (mode === "proposed_with_reason") next.proposed += 1;
  else if (mode === "decided_independently") next.independent += 1;
  else return s;
  return { decisions: { ...s.decisions, [decision]: next } };
}

export type AgencyStage = "techgram_led" | "shared" | "student_led";

/** Stage thresholds on the smoothed index. Behavioural descriptors, not labels of the person. */
export function agencyStage(index: number): AgencyStage {
  if (index < 0.25) return "techgram_led";
  if (index < 0.55) return "shared";
  return "student_led";
}

/**
 * Smoothed agency index for ONE decision type. Shrinkage toward 0 (k pseudo-
 * observations of "Techgram led"): early, thin evidence reads honestly as
 * techgram_led instead of flattering the student. Null when never observed.
 */
export function agencyIndexFor(s: AgencyState, decision: DecisionType, k = 5): number | null {
  const d = s.decisions[decision];
  if (!d) return null;
  const n = d.accepted + d.proposed + d.independent;
  if (n === 0) return null;
  const w = d.accepted * MODE_WEIGHT.accepted_recommendation + d.proposed * MODE_WEIGHT.proposed_with_reason + d.independent * MODE_WEIGHT.decided_independently;
  return w / (n + k);
}

/** Evidence-weighted index across all observed decision types. Null when no data. */
export function overallAgencyIndex(s: AgencyState, k = 5): number | null {
  let wSum = 0, iSum = 0;
  for (const dt of DECISION_TYPES) {
    const idx = agencyIndexFor(s, dt, k);
    const d = s.decisions[dt];
    if (idx === null || !d) continue;
    const n = d.accepted + d.proposed + d.independent;
    wSum += n;
    iSum += idx * n;
  }
  return wSum > 0 ? iSum / wSum : null;
}

/* ------------------------------------------------------------------ */
/* The surface — stage names + counts, NEVER the raw scalar            */
/* ------------------------------------------------------------------ */

export interface AgencyDecisionView {
  decision: DecisionType;
  n: number;
  stage: AgencyStage;
  /** What the counts look like, in plain words. */
  evidence: string;
}

export interface AgencySurface {
  stage: AgencyStage | "no_evidence";
  decisionsObserved: number;
  byDecision: AgencyDecisionView[];
  /** The next choice-architecture offer, or null while evidence is thin. */
  nextTransferMove: { decision: DecisionType; offer: string } | null;
  note: string;
}

const PLAIN: Record<DecisionType, string> = {
  topic_selection: "choosing what to study",
  retrieval_selection: "choosing what to revise",
  difficulty_selection: "choosing how hard to push",
  misconception_detection: "spotting their own misconceptions",
  session_length: "setting session length",
  break_timing: "timing their own breaks",
  help_seeking: "deciding when to ask for help",
  strategy_selection: "picking a study strategy",
};

/**
 * The ONLY student-facing rendering of agency. Deliberately returns no
 * numeric index — anti-Goodhart [ADR-030]: there is no single number here
 * to chase, only an honest description of who has been leading.
 */
export function agencySurface(s: AgencyState): AgencySurface {
  const views: AgencyDecisionView[] = [];
  for (const dt of DECISION_TYPES) {
    const d = s.decisions[dt];
    if (!d) continue;
    const n = d.accepted + d.proposed + d.independent;
    const idx = agencyIndexFor(s, dt)!;
    views.push({
      decision: dt,
      n,
      stage: agencyStage(idx),
      evidence:
        `${n} decision${n === 1 ? "" : "s"} observed: ${d.accepted} accepted a recommendation, ` +
        `${d.proposed} proposed their own with a reason, ${d.independent} decided independently`,
    });
  }
  views.sort((a, b) => b.n - a.n);
  const totalObserved = views.reduce((a, v) => a + v.n, 0);
  if (views.length === 0) {
    return {
      stage: "no_evidence",
      decisionsObserved: 0,
      byDecision: [],
      nextTransferMove: null,
      note: "No decision observations yet — agency is measured from what you actually choose, so there's nothing to report honestly.",
    };
  }
  const overall = overallAgencyIndex(s)!;
  const stage = agencyStage(overall);

  // Transfer move: the most-practised decision still fully led by Techgram
  // gets a two-option choice; a shared decision gets a propose-and-verify.
  let move: AgencySurface["nextTransferMove"] = null;
  const led = views.find((v) => v.stage === "techgram_led" && v.n >= 3);
  const shared = views.find((v) => v.stage === "shared" && v.n >= 3);
  if (shared) {
    move = {
      decision: shared.decision,
      offer: `Next time, propose the ${PLAIN[shared.decision]} yourself — with your reason — and Techgram will test it against the evidence.`,
    };
  } else if (led) {
    move = {
      decision: led.decision,
      offer: `Want to try ${PLAIN[led.decision]} yourself? Techgram will offer two sensible options and explain both.`,
    };
  }

  return {
    stage,
    decisionsObserved: totalObserved,
    byDecision: views,
    nextTransferMove: move,
    note:
      stage === "techgram_led"
        ? "Techgram has been leading the decisions so far — that's the right starting point, and it will hand over as you show the judgement."
        : stage === "shared"
          ? "You and Techgram are sharing the decisions now — your own proposals are being taken seriously and tested."
          : "You are increasingly leading your own learning decisions — Techgram's job shifts to verifying them with you.",
  };
}
