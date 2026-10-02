/**
 * BRAIN-FREEZE LIVE PROBES [Gate-0, Journal 15].
 * Not unit tests — executable probes whose TRANSCRIPTS a human reads.
 * Each probe runs the real kernel end-to-end and prints the evidence chain.
 * Run: npx tsx scripts/freeze_probes.mts
 */
import { buildBeliefModel, initialState, observe, DEFAULT_BELIEF_PARAMS } from "../kernel/src/belief.js";
import { DEFAULT_MEMORY_PARAMS } from "../kernel/src/memory.js";
import { buildSeedContent } from "../kernel/src/polity_seed.js";
import { newSystemState, applyEvent, replay, type StudentEvent } from "../kernel/src/events.js";
import { planDay, DEFAULT_PLANNER_PARAMS } from "../kernel/src/planner.js";
import { buildPlanReceipt } from "../kernel/src/receipts.js";
import { predictAction, predictionErrorStats, learnFromOutcomes, approve, DEFAULT_AOM_INSTANCE, makeAssumedAom, type OutcomeRecord } from "../kernel/src/aom.js";
import { computePersonalisationState } from "../kernel/src/behaviour.js";
import { agencySurface } from "../kernel/src/agency.js";
import { makeRng } from "../kernel/src/linalg.js";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  console.log(`  ${ok ? "PASS" : "FAIL"} — ${label}${detail ? ` · ${detail}` : ""}`);
  if (!ok) failures += 1;
}

const content = buildSeedContent();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });

let n = 0;
const ev = (day: number, type: StudentEvent["type"], payload: Record<string, unknown> = {}): StudentEvent => {
  n += 1;
  return { event_id: `p${n}`, student_id: "probe", day, type, payload, source: "probe", schema_version: 1, idempotency_key: `pk${n}` };
};

/* ==========================================================================
 * PROBE 1 — measured load tolerance overrides the requested budget
 * "Student historically tolerates 40 minutes. Planner receives 240.
 *  Expected: planned duration <= tolerance, and the receipt explains why."
 * ========================================================================== */
console.log("\n═══ PROBE 1 — measured load tolerance beats the requested budget ═══");
{
  // 10 days of history: the student completes 40-minute sessions, every day.
  const events: StudentEvent[] = [];
  for (let day = 1; day <= 10; day++) {
    events.push(ev(day, "session_started", { topic: "c_fr_14" }));
    for (let k = 0; k < 8; k++) {
      events.push(ev(day, "item_response", { concept_id: "c_fr_14", correct: k % 3 !== 0, time_sec: 40 }));
    }
    events.push(ev(day, "session_completed", { minutes: 40 }));
  }
  const pers = computePersonalisationState(events, 10);
  console.log(`  measured: loadToleranceMin=${pers.loadToleranceMin}  optimalSessionMin=${pers.optimalSessionMin}  (from ${pers.responses} responses)`);

  const st = initialState(model);
  const plan = planDay(model, st, { day: 1, daysToExam: 180, minutesAvailable: 240, memory: new Map(), personalisation: pers }, DEFAULT_PLANNER_PARAMS, makeRng(101));
  const receipt = buildPlanReceipt(plan, [], model.params.version);
  console.log(`  requested budget: 240 min → planned: ${plan.totalMinutes} min across ${plan.blocks.length} blocks`);
  console.log(`  plan audit trail: ${JSON.stringify(plan.personalisationApplied)}`);
  console.log(`  receipt.personalisation: ${JSON.stringify(receipt.personalisation)}`);
  console.log(`  receipt.constraints: ${JSON.stringify(receipt.constraints_checked)}`);
  check("planned duration respects measured tolerance (≤ 44 min)", plan.totalMinutes <= Math.ceil(pers.loadToleranceMin * 1.1), `${plan.totalMinutes} ≤ 44`);
  check("receipt names the load cap as the reason", receipt.personalisation.some((s) => s.startsWith("load_cap")), "load_cap entry present");
  check("unconstrained plan for the same day is longer (the cap did real work)", (() => {
    const plain = planDay(model, st, { day: 1, daysToExam: 180, minutesAvailable: 240, memory: new Map() }, DEFAULT_PLANNER_PARAMS, makeRng(101));
    return plain.totalMinutes > plan.totalMinutes;
  })(), "240-budget plan > capped plan");
}

/* ==========================================================================
 * PROBE 2 — prediction → student responds poorly → error → mismatch →
 *           model adjustment → HUMAN GATE (and the simulator ban)
 * "Not merely mismatch = true."
 * ========================================================================== */
console.log("\n═══ PROBE 2 — the never-self-fooling chain, end to end ═══");
{
  const st = initialState(model);
  const ci = model.index.get("c_fr_21")!;
  const concept = model.content.conceptById.get("c_fr_21")!;
  void concept;
  const records: OutcomeRecord[] = [];
  let muBefore = st.mu[ci];

  for (let session = 0; session < 3; session++) {
    const mastery = 1 / (1 + Math.exp(-st.mu[ci]));
    const pred = predictAction(DEFAULT_AOM_INSTANCE, { action: "practice", minutes: 20, mastery, daysToExam: 100, triage: false });
    // The student responds POORLY: 4 confident wrong answers (real EKF updates).
    for (let k = 0; k < 4; k++) observe(model, st, { conceptId: "c_fr_21", correct: false, evidenceW: 1.3, day: 10 * (session + 1) + k });
    const observed = st.mu[ci] - muBefore;
    muBefore = st.mu[ci];
    records.push({ action: "practice", minutes: 20, masteryAtAction: mastery, predictedDMastery: pred.dMastery, observedDMastery: observed, n: 4 });
    console.log(`  session ${session + 1}: predicted Δmastery +${pred.dMastery.toFixed(3)} → observed ${observed >= 0 ? "+" : ""}${observed.toFixed(3)} (4 wrong answers, real EKF)`);
  }

  const stats = predictionErrorStats(records);
  console.log(`  mismatch stats: meanAbsError=${stats.perAction[0]!.meanAbsError.toFixed(3)}  consecutiveLargeMisses=${stats.perAction[0]!.consecutiveLargeMisses}`);
  check("mismatch DETECTED (not merely computed)", stats.mismatchDetected, stats.mismatchActions.join(","));

  // The chain continues: the AOM pools the evidence into a PROPOSAL...
  const proposal = learnFromOutcomes(DEFAULT_AOM_INSTANCE, records);
  console.log(`  model adjustment proposal: ${proposal.changeSummary}`);
  check("proposal carries a real parameter change", /practice:/.test(proposal.changeSummary), "practice gain updated");
  // ...and the human gate decides — pilot provenance may pass.
  const approved = approve(proposal, "Founder (Roushan)");
  console.log(`  human gate: approved by '${approved.approvedBy}' → practice gain now ${approved.gainsPer10Min.practice.value.toFixed(3)} (was 0.220), status ${approved.gainsPer10Min.practice.status}`);
  check("approved pack flows only through a named human", approved.approvedBy === "Founder (Roushan)", "approver recorded");

  // ...and the closed-loop ban: simulator-provenance data can NEVER enter production.
  const worldAom = { params: makeAssumedAom("aom-world-test"), provenance: "world:sim" };
  const worldProposal = learnFromOutcomes(worldAom, records);
  try {
    approve(worldProposal, "Founder (Roushan)");
    check("simulator proposal is BANNED from production", false, "approve() did not throw");
  } catch (e) {
    check("simulator proposal is BANNED from production", true, (e as Error).message.slice(0, 72) + "…");
  }
}

/* ==========================================================================
 * PROBE 3 — student decides independently → evaluated → outcome →
 *           agency event → REPLAY BIT-IDENTICAL
 * ========================================================================== */
console.log("\n═══ PROBE 3 — the agency loop, replayed ═══");
{
  const events: StudentEvent[] = [];
  // Weeks of guided decisions first...
  for (let i = 0; i < 5; i++) events.push(ev(i + 1, "agency_observed", { decision: "retrieval_selection", mode: "accepted_recommendation" }));
  // ...then the student starts deciding, WITH reasons, independently.
  for (let i = 0; i < 8; i++) events.push(ev(10 + i, "agency_observed", { decision: "topic_selection", mode: "decided_independently" }));
  events.push(ev(18, "agency_observed", { decision: "topic_selection", mode: "proposed_with_reason" }));

  let sys = newSystemState(model);
  for (const e of events) sys = applyEvent(model, sys, e);
  const surf = agencySurface(sys.agency);
  console.log(`  stage: ${surf.stage} · decisions observed: ${surf.decisionsObserved}`);
  for (const d of surf.byDecision) console.log(`    · ${d.decision}: ${d.stage} (${d.evidence})`);
  console.log(`  next transfer move: ${surf.nextTransferMove ? `${surf.nextTransferMove.decision} — ${surf.nextTransferMove.offer}` : "none"}`);
  const json = JSON.stringify(surf);
  check("topic_selection reached student_led (8 independent / 9 total)", surf.byDecision.find((d) => d.decision === "topic_selection")?.stage === "student_led", "8/13 smoothed");
  check("surface carries NO gamifiable scalar", !/"index"|"score"/.test(json), "stage names + counts only");

  // THE REPLAY: rebuild everything from the raw event log, compare exactly.
  const replayed = replay(model, events);
  const same = JSON.stringify(replayed.agency) === JSON.stringify(sys.agency);
  console.log(`  replay: ${events.length} events → agency state ${same ? "IDENTICAL" : "DIVERGED"}`);
  check("bit-identical replay from the raw log", same, JSON.stringify(replayed.agency.decisions["topic_selection"]));
}

/* ========================================================================== */
console.log("\n══════════════════════════════════════════════");
console.log(failures === 0 ? "ALL PROBES PASS — the wires behave outside the test suite." : `${failures} PROBE CHECK(S) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
