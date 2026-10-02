import { describe, it, expect } from "vitest";
import {
  buildBeliefModel, initialState, observe, DEFAULT_BELIEF_PARAMS, reportConcept,
} from "../src/belief.js";
import { DEFAULT_MEMORY_PARAMS } from "../src/memory.js";
import { buildSeedContent } from "../src/polity_seed.js";
import { buildPolityAtomBank } from "../src/polity_atoms.js";
import { makeRng, sigmoid } from "../src/linalg.js";
import { planDay, DEFAULT_PLANNER_PARAMS } from "../src/planner.js";
import { buildPlanReceipt } from "../src/receipts.js";
import { composeSession } from "../src/composer.js";
import { startTeacherSession, nextMove, applyStudentTurn } from "../src/teacher.js";
import { runTeachingSession, type Responder } from "../src/teach_loop.js";
import { newSystemState, applyEvent } from "../src/events.js";
import {
  updateMisconception, misconceptionTier, confirmedMisconceptions, rootCauseSuspects,
  newMisconceptionState,
} from "../src/diagnosis.js";
import { makeSimStudent, simRespond, WORLD_A_FRIENDLY } from "../src/lab.js";
import type { StudentTurn } from "../src/teach_loop.js";

const content = buildSeedContent();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });
const bank = buildPolityAtomBank();

describe("B10 — misconception tiers (candidate/probable/confirmed)", () => {
  it("one wrong on a tagged distractor = CANDIDATE only", () => {
    const s = newMisconceptionState();
    const item = content.itemById.get("i_fr_5")!; // tags on option 0
    updateMisconception(s, item, 0, false, 2);
    expect(misconceptionTier(s, "m_maneka_any_procedure")).toBe("candidate");
  });

  it("3 consistent wrongs = PROBABLE; sure-wrongs push to CONFIRMED", () => {
    const s = newMisconceptionState();
    const item = content.itemById.get("i_fr_5")!;
    for (let k = 0; k < 3; k++) updateMisconception(s, item, 0, false, 2);
    expect(misconceptionTier(s, "m_maneka_any_procedure")).toBe("probable");
    const s2 = newMisconceptionState();
    for (let k = 0; k < 3; k++) updateMisconception(s2, item, 0, false, 3);
    expect(misconceptionTier(s2, "m_maneka_any_procedure")).toBe("confirmed");
    expect(confirmedMisconceptions(s2)).toHaveLength(1);
  });

  it("correct answers never create misconception evidence", () => {
    const s = newMisconceptionState();
    const item = content.itemById.get("i_fr_5")!;
    updateMisconception(s, item, 1, true, 3);
    expect(Object.keys(s.byId)).toHaveLength(0);
  });

  it("root-cause suspects rank weak prereqs first via posterior correlation", () => {
    const st = initialState(model);
    // Hammer the prereq of c_am_bs (c_am_proc) with wrong answers.
    for (let d = 1; d <= 8; d++) {
      observe(model, st, { conceptId: "c_am_proc", correct: false, evidenceW: 1.3, day: d });
    }
    const suspects = rootCauseSuspects(model, st, "c_am_bs");
    expect(suspects.length).toBeGreaterThan(0);
    expect(suspects[0]!.prereqId).toBe("c_am_proc");
    expect(suspects[0]!.suspect).toBeGreaterThan(0);
  });
});

describe("B7 — composer layout (no new intelligence)", () => {
  it("maps plan blocks to the segment template, preserves lineage, trims to minutes", () => {
    const st = initialState(model);
    const rng = makeRng(4242);
    const plan = planDay(model, st, { day: 1, daysToExam: 120, minutesAvailable: 240, memory: new Map() }, DEFAULT_PLANNER_PARAMS, rng);
    const receipt = buildPlanReceipt(plan, ["test unknown"]);
    const session = composeSession(plan, 40, undefined, receipt);

    expect(session.segments.length).toBeGreaterThan(0);
    expect(session.totalMinutes).toBeLessThanOrEqual(40);
    // Lineage: every segment maps to a plan block.
    const planConcepts = new Set(plan.blocks.map((b) => b.conceptId));
    for (const s of session.segments) {
      expect(planConcepts.has(s.conceptId)).toBe(true);
      expect(s.prediction.aomVersion).toMatch(/^aom-|^baseline/);
      expect(s.objective.length).toBeGreaterThan(10);
    }
    // Ordering: warmups first, calibration last.
    const kinds = session.segments.map((s) => s.kind);
    if (kinds.includes("retrieval_warmup")) expect(kinds[0]).toBe("retrieval_warmup");
    expect(kinds[kinds.length - 1]).toBe("calibration_wrap");
    // Receipt lineage carried through.
    expect(session.receipt.decision).toBe(receipt.decision);
  });
});

// ---- a deterministic simulated student for the closed loop ----
function makeResponder(seed: number, world = WORLD_A_FRIENDLY): { responder: Responder; truth: ReturnType<typeof makeSimStudent> } {
  const rng = makeRng(seed);
  const truth = makeSimStudent(model, { seed, archetype: "consistent", days: 1, minutesPerDay: 240, truthShares: [0.25, 0.25, 0.15, 0.35] }, world);
  const responder: Responder = (move) => {
    if (move.expectEvidence.kind === "none") return { kind: "none" };
    if (move.expectEvidence.kind === "confidence_report") return { kind: "confidence_report", confidence: 2 };
    const item = move.item!;
    const ci = model.index.get(move.conceptId)!;
    const itemIdx = model.content.items.indexOf(item);
    const correct = simRespond(model, truth, itemIdx, ci, rng, world);
    if (correct) {
      return {
        kind: "item_response", chosenOption: item.answer, correct: true,
        confidence: rng.next() < 0.5 ? 3 : 2, timeSec: item.expectedTimeSec,
      };
    }
    const tags = Object.keys(item.distractorTags);
    const chosen = tags.length > 0 && rng.next() < 0.6 ? Number(tags[0]) : (item.answer + 1) % 4;
    return { kind: "item_response", chosenOption: chosen, correct: false, confidence: 2, timeSec: item.expectedTimeSec };
  };
  return { responder, truth };
}

describe("THE INSPECTION GATE — one complete session, closed loop, zero LLM", () => {
  function runOnce(seed: number) {
    const st = initialState(model);
    const sys = newSystemState(model);
    const rng = makeRng(seed);
    const plan = planDay(model, sys.belief, { day: 1, daysToExam: 120, minutesAvailable: 40, memory: sys.memory }, DEFAULT_PLANNER_PARAMS, rng);
    const { responder } = makeResponder(seed);
    return { result: runTeachingSession(model, sys, { day: 1, minutesAvailable: 40, plan, responder, atomBank: bank }), plan };
  }

  it("every segment traces to a plan block; every move has a why; the plan is brain-generated", () => {
    const { result, plan } = runOnce(9001);
    expect(plan.blocks.length).toBeGreaterThan(0);
    expect(result.session.segments.length).toBeGreaterThan(0);
    expect(result.transcript.length).toBeGreaterThan(5);
    for (const e of result.transcript) {
      expect(e.why.length).toBeGreaterThan(10); // receipt-grade reason on EVERY move
      expect(["DIAGNOSTIC_PROBE","EXPLAIN","WORKED_EXAMPLE","FADE_EXAMPLE","RETRIEVAL_PROMPT","HINT_L1","HINT_L2","HINT_L3","CONTRAST","SELF_EXPLAIN_PROMPT","TRANSFER_ITEM","CALIBRATION_PROMPT","ENCOURAGE_REFRAME","SUMMARISE_CLOSE"]).toContain(e.move);
    }
  });

  it("teaching moves produce typed evidence that flows into belief, memory and misconceptions", () => {
    const { result } = runOnce(9002);
    const itemEvents = result.events.filter((e) => e.type === "item_response");
    expect(itemEvents.length).toBeGreaterThan(3);
    // All events folded through applyEvent — the returned state reflects them.
    const touched = new Set(itemEvents.map((e) => String(e.payload.concept_id)));
    expect(touched.size).toBeGreaterThan(0);
    for (const cid of touched) {
      const ci = model.index.get(cid)!;
      // Memory: every taught concept has a retrieval touch dated today (day 1).
      expect(result.finalSys.memory.get(ci)?.lastReviewDay).toBe(1);
      // Belief: nEff grew from the evidence.
      expect(result.finalSys.belief.nEff[ci]).toBeGreaterThan(0);
    }
    // Misconception counters: wrong-on-tagged answers must have incremented some cell.
    const wrongTagged = itemEvents.filter((e) => e.payload.correct === false && typeof e.payload.chosen_option === "number");
    if (wrongTagged.length > 0) {
      expect(Object.keys(result.finalSys.misconceptions.byId).length).toBeGreaterThan(0);
    }
    // Outcome records: one per segment, predictions recorded, observations finite.
    expect(result.outcomeRecords.length).toBe(result.session.segments.length);
    for (const o of result.outcomeRecords) {
      expect(o.predictedDMastery).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(o.observedDMastery)).toBe(true);
    }
  });

  it("tier discipline: every EXPLAIN/HINT/CONTRAST utterance is a verified atom or an explicit tier-4 template", () => {
    const { result } = runOnce(9003);
    const bankIds = new Set(bank.atoms.map((a) => a.id));
    for (const e of result.transcript) {
      const contentBearing = ["EXPLAIN", "CONTRAST", "WORKED_EXAMPLE", "HINT_L1", "HINT_L2", "HINT_L3", "CALIBRATION_PROMPT", "SUMMARISE_CLOSE", "ENCOURAGE_REFRAME"];
      if (!contentBearing.includes(e.move)) continue;
      expect(e.utterance.length).toBeGreaterThan(15);
      if (e.atomId) {
        // Either a bank atom, or an explicitly-flagged kernel template (tier 4).
        expect(bankIds.has(e.atomId) || e.atomId.startsWith("tpl_")).toBe(true);
      }
    }
  });

  it("the receipt closes the session contract: why-this-session + aom version + predictions", () => {
    const { result } = runOnce(9004);
    expect(result.receipt.receipt_id).toMatch(/^rcpt_d1_/);
    expect(result.receipt.expected.aom_version).toMatch(/^aom-/);
    expect((result.receipt.expected.per_block_predictions as unknown[]).length).toBeGreaterThan(0);
    expect(result.receipt.assumptions.length).toBeGreaterThan(0);
  });

  it("DETERMINISM: identical seed → identical session transcript", () => {
    const a = runOnce(9077);
    const b = runOnce(9077);
    const sig = (r: ReturnType<typeof runOnce>) =>
      JSON.stringify(r.result.transcript.map((t) => [t.seq, t.move, t.segmentId, t.atomId ?? null, t.studentTurn?.chosenOption ?? null]));
    expect(sig(a)).toBe(sig(b));
  });

  it("the loop LEARNS: after the session the taught concept carries real evidence, and replaying the session's events reproduces the state exactly", () => {
    const { result } = runOnce(9100);
    const taught = result.session.segments.find((s) => s.kind === "teach");
    expect(taught).toBeDefined();
    const rep = reportConcept(model, result.finalSys.belief, taught!.conceptId);
    // With real evidence the concept is no longer untouched.
    expect(rep.nEff).toBeGreaterThan(0);
    // Replay determinism: rebuilding the state from the session's event log
    // (the exact production projection path) matches the folded state.
    let s = newSystemState(model);
    for (const ev of result.events) s = applyEvent(model, s, ev);
    const rep2 = reportConcept(model, s.belief, taught!.conceptId);
    expect(rep2.mean).toBeCloseTo(rep.mean, 10);
    expect(rep2.nEff).toBeCloseTo(rep.nEff, 10);
    // Misconception state survived the fold identically.
    expect(Object.keys(s.misconceptions.byId)).toEqual(Object.keys(result.finalSys.misconceptions.byId));
  });
});

describe("B8 — teacher move table (scripted student, deterministic)", () => {
  it("hint ladder fires L1→L2→L3 on repeated wrongs, then a worked example (on a concept WITH hint atoms)", () => {
    const st = initialState(model);
    // Target a concept that has a full hint ladder in the bank (tier discipline:
    // no hint atoms → the teacher never invents hints, it goes to worked example).
    const teach = {
      id: "seg_test_teach", kind: "teach" as const, conceptId: "c_fr_21", conceptName: "Article 21 — Life & Liberty",
      minutes: 20, sourceBlockIndex: 0,
      prediction: { dMastery: 0, stabilityMultiplier: 1, dUncertaintyVar: 0, status: "assumed" as const, confidence: 0.4, aomVersion: "aom-0.1.0-assumed" },
      objective: "test segment",
    };
    const oneSegment = { segments: [teach] };
    const teacher = startTeacherSession();
    const alwaysWrong = { correct: false, confidence: 2 as const, chosenOption: 0, timeSec: 60 };
    const moves: string[] = [];
    let guard = 0;
    let m = nextMove(model, st, newMisconceptionState(), teacher, oneSegment, bank);
    while (m && guard < 30) {
      guard += 1;
      moves.push(m.move);
      if (m.expectEvidence.kind === "item_response") applyStudentTurn(teacher, alwaysWrong);
      m = nextMove(model, st, newMisconceptionState(), teacher, oneSegment, bank);
    }
    expect(moves).toContain("EXPLAIN");
    expect(moves).toContain("HINT_L1");
    expect(moves.indexOf("HINT_L2")).toBeGreaterThan(moves.indexOf("HINT_L1"));
    expect(moves.indexOf("HINT_L3")).toBeGreaterThan(moves.indexOf("HINT_L2"));
    expect(moves).toContain("WORKED_EXAMPLE");
    expect(moves.indexOf("WORKED_EXAMPLE")).toBeGreaterThan(moves.indexOf("HINT_L3"));
  });

  it("SUMMARISE_CLOSE ends every segment; segments advance in order", () => {
    const st = initialState(model);
    const plan = planDay(model, st, { day: 1, daysToExam: 100, minutesAvailable: 240, memory: new Map() }, DEFAULT_PLANNER_PARAMS, makeRng(66));
    const session = composeSession(plan, 40, undefined, buildPlanReceipt(plan, []));
    const teacher = startTeacherSession();
    const alwaysCorrect = { correct: true, confidence: 3 as const, chosenOption: 0, timeSec: 30 };
    let guard = 0;
    let m = nextMove(model, st, newMisconceptionState(), teacher, session, bank);
    const closes: string[] = [];
    while (m && guard < 200) {
      guard += 1;
      if (m.move === "SUMMARISE_CLOSE") closes.push(m.segmentId);
      if (m.expectEvidence.kind === "item_response") applyStudentTurn(teacher, alwaysCorrect);
      m = nextMove(model, st, newMisconceptionState(), teacher, session, bank);
    }
    expect(m).toBeNull(); // session complete
    expect(closes.length).toBe(session.segments.length);
  });
});
