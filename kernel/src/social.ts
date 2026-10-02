/**
 * S1 — SOCIAL SLOTS [ADR-028]: the brain's social DECISIONS before any
 * social product exists.
 *  - SOCIAL_PROOF: anonymous + aggregate only. Never named peers for minors.
 *  - STUDY_ROOM_INVITE: compatibility-based (brain-matched), alias-only,
 *    consent required downstream. The room product itself is post-beta.
 * The named-peer comparison ("Riya from your school is ahead") is OUT for
 * minors — permanently unless a future compliance ADR explicitly clears it.
 */

import type { BeliefState } from "./belief.js";
import { reportConcept } from "./belief.js";

export interface SocialProofDecision {
  show: boolean;
  text: string;
  reason: string;
  aggregateOnly: true;
}

/**
 * Anonymous aggregate proof. Shown only when it serves learning context
 * (the concept is due/grey) — never as a leaderboard, never with names.
 */
export function socialProofDecision(
  input: { weeklyCompletions: number; topicName: string },
  context: { conceptGrey: boolean; conceptDue: boolean; minors: boolean },
): SocialProofDecision {
  if (input.weeklyCompletions < 5) {
    return { show: false, text: "", reason: "too few peers for an honest aggregate", aggregateOnly: true };
  }
  if (!(context.conceptGrey || context.conceptDue)) {
    return { show: false, text: "", reason: "no learning context — showing this would be engagement bait", aggregateOnly: true };
  }
  const text = context.minors
    ? `Students working toward similar goals are currently practicing ${input.topicName}.`
    : `${input.weeklyCompletions} students completed the ${input.topicName} challenge this week.`;
  return {
    show: true, text,
    reason: context.conceptGrey ? "grey concept — aggregate proof normalizes starting" : "due review — aggregate proof supports momentum",
    aggregateOnly: true,
  };
}

export interface PeerCandidate {
  /** Alias only — the kernel never holds real names. */
  alias: string;
  conceptId: string;
  mastery: number; // 0..1
  strength: "explanations" | "practice" | "patience";
}

export interface StudyRoomInviteDecision {
  extend: boolean;
  peerAlias?: string;
  conceptName?: string;
  matchReason?: string;
}

/**
 * Brain-matched study-room invitation: complementary mastery on a concept
 * the student is currently missing. Alias-only; the actual room (presence,
 * moderation) is Wave-2 infrastructure and consent-gated downstream.
 */
export function studyRoomInviteDecision(
  st: BeliefState,
  concept: { id: string; name: string },
  peers: PeerCandidate[],
  opts: { myMastery?: number; minPeerMastery?: number; maxMyMastery?: number } = {},
): StudyRoomInviteDecision {
  const myMastery = opts.myMastery ?? 0.4;
  const minPeer = opts.minPeerMastery ?? 0.65;
  const maxMine = opts.maxMyMastery ?? 0.5;
  if (myMastery >= maxMine) return { extend: false };
  const peer = peers.find((p) => p.conceptId === concept.id && p.mastery >= minPeer);
  if (!peer) return { extend: false };
  return {
    extend: true,
    peerAlias: peer.alias,
    conceptName: concept.name,
    matchReason: `complementary states on ${concept.name}: you're building it (${(myMastery * 100).toFixed(0)}%), ${peer.alias} is strong (${(peer.mastery * 100).toFixed(0)}%) and explains well`,
  };
}

/** ReportConcept re-export for social context computation. */
export { reportConcept };

/**
 * AGENCY measurement moved to `agency.ts` [ADR-030] — the single canonical
 * implementation (decision-event based, shrinkage-smoothed, stage-only
 * surface). The earlier turn-based `agencyIndex()` that lived here returned
 * a raw 0..1 scalar and duplicated the concept; it was retired by the
 * Brain-Freeze audit (no second brain, no gamifiable agency scalar).
 */

void reportConcept;
