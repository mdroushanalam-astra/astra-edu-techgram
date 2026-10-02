/**
 * BRAIN LAB — the public demo that needs no users.
 * Pick a synthetic student, watch the brain run their days: plans change with
 * receipts, beliefs converge toward hidden truth, and the final exam outcome
 * is compared against baseline schedules. THE LLM TOGGLE IS IRRELEVANT HERE
 * BY DESIGN: every decision above was made with zero LLM calls.
 *
 * Run: npm run brainlab
 * Label: SYNTHETIC. Proves machinery and honesty, not real-world efficacy.
 */

import { buildSeedContent } from "../polity_seed.js";
import {
  buildBeliefModel, initialState, timeUpdate, expectedScore, reportConcept,
  DEFAULT_BELIEF_PARAMS,
} from "../belief.js";
import { newSystemState } from "../events.js";
import { DEFAULT_MEMORY_PARAMS } from "../memory.js";
import { makeRng, sigmoid } from "../linalg.js";
import { planDay, DEFAULT_PLANNER_PARAMS } from "../planner.js";
import { buildPlanReceipt } from "../receipts.js";
import { simulateExam } from "../exam.js";
import { makeSimStudent, runSim, aggregate, simRespond, type Archetype } from "../lab.js";
import { buildPolityAtomBank } from "../polity_atoms.js";
import { runTeachingSession, type Responder } from "../teach_loop.js";

const content = buildSeedContent();
const DAYS = 60;
const MINUTES = 240;

function hr(title: string) {
  console.log(`\n${"═".repeat(78)}\n  ${title}\n${"═".repeat(78)}`);
}

function main() {
  hr("TECHGRAM BRAIN LAB — SYNTHETIC STUDENT DEMONSTRATION");
  console.log(`Content: ${content.version} · ${content.topics.length} topics · ${content.concepts.length} concepts · ${content.items.length} items`);
  console.log(`Exam model: ${content.exam.questions}Q × ${content.exam.marksEach}m, −${content.exam.negativeFraction.toFixed(2)} negative, cutoff prior N(${content.exam.cutoff.mean}, ${content.exam.cutoff.sd})`);
  console.log(`LLM calls used for any decision: 0 (the kernel has no import path to one)`);

  // ---------- Act 1: day 1 — the plan and its receipt ----------
  const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, {
    selfRating: 3,
    scorecards: { t_fr: 0.62 },
  });
  const cfg = {
    seed: 4242,
    archetype: "consistent" as Archetype,
    days: DAYS,
    minutesPerDay: MINUTES,
    truthShares: [0.25, 0.25, 0.15, 0.35] as [number, number, number, number],
  };
  const st = initialState(model);
  const bank = buildPolityAtomBank();
  const rng = makeRng(2026);

  hr("ACT 1 · DAY 1 — the plan and its receipt (why this, why now)");
  const plan1 = planDay(model, st, { day: 1, daysToExam: DAYS - 1, minutesAvailable: MINUTES, memory: new Map() }, DEFAULT_PLANNER_PARAMS, rng);
  for (const b of plan1.blocks) {
    console.log(`  [${b.action.toUpperCase().padEnd(10)}] ${b.conceptName.padEnd(36)} ${String(b.minutes).padStart(3)}m  +${b.expectedGainMarks.toFixed(2)} marks  (${b.gainPerMinute.toFixed(3)}/min)`);
    console.log(`      ↳ ${b.reason}`);
  }
  const receipt = buildPlanReceipt(plan1, ["Economy: not assessed (outside V1 scope)", "true motivation state: unobserved"]);
  console.log(`\n  RECEIPT ${receipt.receipt_id}`);
  console.log(`    decision:        ${receipt.decision}`);
  console.log(`    expected:        +${(receipt.expected.total_gain_marks as number).toFixed(2)} marks over ${receipt.expected.total_minutes}m`);
  console.log(`    assumptions:     ${receipt.assumptions.map((a) => `${a.id}(${a.status})`).join(", ")}`);
  console.log(`    would change if: ${receipt.what_would_change_my_mind}`);

  // ---------- Act 2: run the 60 days; show convergence ----------
  hr(`ACT 2 · ${DAYS} DAYS — belief converges on the hidden truth, plan follows`);
  const sim = runSim(model, cfg, "techgram", {
    onPlan: (day, plan) => {
      if (day === 20 || day === 45) {
        console.log(`  Day ${String(day).padStart(2)}: ${plan.blocks.map((b) => `${b.action.slice(0, 4)}:${b.conceptName.slice(0, 16)}`).join(" | ")}`);
      }
    },
  });
  const traj = sim.levelErrorTrajectory!;
  const at = (d: number) => traj[Math.min(traj.length - 1, d - 1)]?.toFixed(1) ?? "n/a";
  console.log(`  Expected-score error (estimate vs truth): day1 ≈ ${at(1)} marks → day20 ≈ ${at(20)} → day45 ≈ ${at(45)} → day60 ≈ ${at(60)}`);
  console.log(`  Mean |mastery error| across all ${model.N} concepts: ${(sim.calibrationError! * 100).toFixed(1)} points`);
  const converged = sim.finalSys!;
  const evidenced = model.byIdx
    .map((cid, i) => ({ cid: cid!, i, rep: reportConcept(model, converged.belief, cid!) }))
    .filter((r) => !r.rep.grey)
    .slice(0, 3);
  for (const r of evidenced) {
    const truthM = sigmoid(sim.finalTheta[r.i]);
    console.log(`  ${r.cid.padEnd(12)} belief ${r.rep.mean.toFixed(2)} [${r.rep.lo.toFixed(2)}, ${r.rep.hi.toFixed(2)}] n=${r.rep.nEff.toFixed(1)}  · truth ${truthM.toFixed(2)} ${truthM >= r.rep.lo && truthM <= r.rep.hi ? "✓ in band" : "✗ out"}`);
  }

  // ---------- Act 3: exam-day scenario ----------
  hr("ACT 3 · EXAM-DAY SCENARIO — honest forecast, not a promise");
  const scen = simulateExam(model, converged.belief, converged.memory, rng, { draws: 1500, daysToExam: 1 });
  console.log(`  Score band (p10–p90): ${scen.p10.toFixed(0)} – ${scen.p90.toFixed(0)} of 200   (mean ${scen.mean.toFixed(0)})`);
  console.log(`  P(score ≥ cutoff):    ${(scen.pClear * 100).toFixed(1)}%  ← scenario probability; assumptions one tap away`);
  const ranked = Object.entries(scen.byTopic).sort((a, b) => b[1] - a[1]);
  console.log(`  Strongest topics: ${ranked.slice(0, 3).map(([t, m]) => `${content.topicById.get(t)!.name} (${m.toFixed(1)}m)`).join(", ")}`);
  console.log(`  At-risk topics:   ${ranked.slice(-3).map(([t, m]) => `${content.topicById.get(t)!.name} (${m.toFixed(1)}m)`).join(", ")}`);

  // ---------- Act 5: THE COMPLETE LOOP — plan → compose → teach → evidence ----------
  hr("ACT 4 · THE COMPLETE LOOP — plan → compose → teach → evidence → state (zero LLM)");
  const sys5 = newSystemState(model);
  const plan5 = planDay(model, sys5.belief, { day: 1, daysToExam: DAYS, minutesAvailable: 40, memory: sys5.memory }, DEFAULT_PLANNER_PARAMS, rng);
  const truth5 = makeSimStudent(model, { ...cfg, seed: 5150 });
  const studentRng = makeRng(5150);
  const responder: Responder = (move) => {
    if (move.expectEvidence.kind === "none") return { kind: "none" };
    if (move.expectEvidence.kind === "confidence_report") return { kind: "confidence_report", confidence: 2 };
    const item = move.item!;
    const ci = model.index.get(move.conceptId)!;
    const correct = simRespond(model, truth5, model.content.items.indexOf(item), ci, studentRng);
    if (correct) return { kind: "item_response", chosenOption: item.answer, correct: true, confidence: 2, timeSec: item.expectedTimeSec };
    const tags = Object.keys(item.distractorTags);
    const chosen = tags.length > 0 && studentRng.next() < 0.6 ? Number(tags[0]) : (item.answer + 1) % 4;
    return { kind: "item_response", chosenOption: chosen, correct: false, confidence: 2, timeSec: item.expectedTimeSec };
  };
  const session = runTeachingSession(model, sys5, { day: 1, minutesAvailable: 40, plan: plan5, responder, atomBank: bank });
  for (const e of session.transcript) {
    const tag = e.studentTurn ? (e.studentTurn.kind === "item_response" ? (e.studentTurn.correct ? "✓" : "✗") : "◐") : "·";
    console.log(`  ${String(e.seq).padStart(2)} [${e.move.padEnd(17)}] ${e.conceptId.padEnd(12)} ${tag} ${e.utterance.slice(0, 72)}${e.utterance.length > 72 ? "…" : ""}`);
  }
  const evidenceMoves = session.transcript.filter((t) => t.studentTurn && t.studentTurn.kind !== "none").length;
  console.log(`\n  Moves: ${session.transcript.length} · evidence-bearing turns: ${evidenceMoves} · typed events: ${session.events.length}`);
  console.log(`  Every segment traces to a plan block; every move carries a receipt-grade "why".`);
  console.log(`  Belief shifts (before → after, evidence-driven):`);
  for (const s of session.segmentSummaries) {
    if (s.meanBefore !== null && s.meanAfter !== null) {
      console.log(`    ${s.segmentId.padEnd(26)} ${(s.meanBefore * 100).toFixed(0)}% → ${(s.meanAfter * 100).toFixed(0)}%`);
    }
  }
  console.log(`  AOM prediction vs evidence: predicted Δμ +${session.outcomeRecords.reduce((a, o) => a + o.predictedDMastery, 0).toFixed(2)}, observed ${session.outcomeRecords.reduce((a, o) => a + o.observedDMastery, 0).toFixed(2)} (the learning loop's fuel)`);
  console.log(`  LLM calls used in this entire session: 0.`);

  // ---------- Act 5: the gate — planner vs baselines ----------
  hr("ACT 5 · THE GATE — Techgram planner vs baselines (16 synthetic students each, 40 days)");
  const t0 = Date.now();
  const agg = aggregate(model, 40, 4, 9001, ["techgram", "fixed_order", "random"]);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`  ${"policy".padEnd(50)} marks   pass%   belief-err`);
  const rows: [string, keyof typeof agg][] = [
    ["Techgram planner (exam-date-aware, robust, VoI)", "techgram"],
    ["Fixed syllabus order (typical app)", "fixed_order"],
    ["Random allocation (attention economy)", "random"],
  ];
  for (const [label, key] of rows) {
    const a = agg[key];
    const calib = a.meanCalibration !== null ? `${(a.meanCalibration * 100).toFixed(1)}pts` : "—";
    console.log(`  ${label.padEnd(50)} ${a.meanMarks.toFixed(1).padStart(5)}  ${(a.meanPass * 100).toFixed(0).padStart(4)}%   ${calib}`);
  }
  console.log(`\n  Lift vs random: +${(agg.techgram.meanMarks - agg.random.meanMarks).toFixed(1)} marks · vs fixed order: +${(agg.techgram.meanMarks - agg.fixed_order.meanMarks).toFixed(1)} marks`);
  console.log(`  (40-day schedule, 240 min/day, IDENTICAL pedagogy — only the allocation differs)`);
  console.log(`  Aggregate run: ${secs}s for 48 synthetic students × 3 policies`);
  console.log(`\n  SYNTHETIC DATA. Proves the machinery works and is honest — real-world`);
  console.log(`  efficacy claims wait for the pilot (gates G3–G6).`);
}

main();
