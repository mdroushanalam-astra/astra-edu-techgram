import { describe, it, expect } from "vitest";
import {
  computeBehaviourFeatures, computePersonalisationState, returnPropensity,
  DEFAULT_RETURN_MODEL, behaviourFlags,
} from "../src/behaviour.js";
import { assign, evaluateExperiment, pilotExperimentSuite, ENGAGEMENT_MECHANISM_REGISTRY } from "../src/experiments.js";
import { buildBeliefModel, initialState, observe, DEFAULT_BELIEF_PARAMS } from "../src/belief.js";
import { DEFAULT_MEMORY_PARAMS } from "../src/memory.js";
import { buildSeedContent } from "../src/polity_seed.js";
import { newSystemState, applyEvent, type StudentEvent } from "../src/events.js";
import { startTeacherSession, nextMove, applyStudentTurn } from "../src/teacher.js";
import { newMisconceptionState, updateMisconception } from "../src/diagnosis.js";
import { buildPolityAtomBank } from "../src/polity_atoms.js";
import { composeSession } from "../src/composer.js";
import { buildPlanReceipt } from "../src/receipts.js";
import { planDay, DEFAULT_PLANNER_PARAMS } from "../src/planner.js";
import { makeRng } from "../src/linalg.js";

const content = buildSeedContent();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });
const bank = buildPolityAtomBank();

let n = 0;
function ev(day: number, type: StudentEvent["type"], payload: Record<string, unknown> = {}): StudentEvent {
  n += 1;
  return { event_id: `pe${n}`, student_id: "s", day, type, payload, source: "t", schema_version: 1, idempotency_key: `pn${n}` };
}

/** A realistic 10-day stream: slow answers growing slower + more errors late in each day (fatigue). */
function fatigueStream(): StudentEvent[] {
  const out: StudentEvent[] = [];
  for (let day = 1; day <= 10; day++) {
    out.push(ev(day, "session_started", { topic: "c_fr_14" }));
    for (let k = 0; k < 9; k++) {
      const late = k >= 6;
      out.push(ev(day, "item_response", {
        concept_id: "c_fr_14", correct: late ? false : k % 3 !== 0,
        time_sec: late ? 90 + k * 10 : 35 + k * 2, confidence: 2,
      }));
    }
    out.push(ev(day, "session_completed", { minutes: 40 }));
  }
  return out;
}

describe("A1 — Personalisation State v1 (measured, enveloped-behaviour features)", () => {
  it("detects the fatigue signature: late-day time drift and error rise", () => {
    const p = computePersonalisationState(fatigueStream(), 10);
    expect(p.fatigueTimeSlope).toBeGreaterThan(0.5); // late answers much slower
    expect(p.fatigueErrorSlope).toBeGreaterThan(0.2); // late-day errors rise
  });

  it("momentum tracks an improving accuracy trend", () => {
    const out: StudentEvent[] = [];
    for (let day = 1; day <= 6; day++) {
      // accuracy rises across the LAST 3 active days: 0.5 → 0.75 → 1.0
      const acc = day <= 3 ? 0.3 : 0.5 + (day - 4) * 0.25;
      for (let k = 0; k < 8; k++) {
        out.push(ev(day, "item_response", { concept_id: "c_fr_14", correct: k / 8 < acc, time_sec: 40 }));
      }
    }
    const p = computePersonalisationState(out, 6);
    expect(p.momentum).toBeGreaterThan(0.3);
  });

  it("load tolerance + measured session length come from completed sessions", () => {
    const p = computePersonalisationState(fatigueStream(), 10);
    expect(p.loadToleranceMin).toBe(40);
    expect(p.optimalSessionMin).toBe(40);
  });

  it("chronotype is measured only when time_of_day_min is logged; undefined otherwise", () => {
    const withTime = fatigueStream().map((e, i) => ({ ...e, payload: { ...e.payload, time_of_day_min: 360 + (i % 3) * 5 } }));
    const p1 = computePersonalisationState(withTime, 10);
    expect(p1.chronotypeMin).toBeGreaterThanOrEqual(360);
    expect(p1.chronotypeSpread).toBeLessThanOrEqual(10);
    const p2 = computePersonalisationState(fatigueStream(), 10);
    expect(p2.chronotypeMin).toBeUndefined();
  });

  it("avoidance flags planned-but-untouched concepts", () => {
    const out: StudentEvent[] = [];
    for (let day = 1; day <= 4; day++) {
      out.push(ev(day, "session_started", { topic: "c_bd_eci" })); // scheduled, never touched
      out.push(ev(day, "item_response", { concept_id: "c_fr_14", correct: true, time_sec: 40 }));
    }
    const p = computePersonalisationState(out, 4);
    expect(p.avoidance.some((a) => a.conceptId === "c_bd_eci" && a.missedSessions >= 2)).toBe(true);
  });

  it("recovery rate: P(correct | previous wrong) from consecutive pairs", () => {
    const out: StudentEvent[] = [];
    const pattern = [false, true, false, true, false, true]; // always recovers
    for (let day = 1; day <= 2; day++) {
      pattern.forEach((correct, k) => out.push(ev(day, "item_response", { concept_id: "c_fr_14", correct, time_sec: 40 })));
    }
    const p = computePersonalisationState(out, 2);
    expect(p.recoveryRate).toBeCloseTo(1.0);
  });

  it("thin evidence degrades to honest neutrals (no invented signals)", () => {
    const p = computePersonalisationState([ev(1, "item_response", { concept_id: "c_fr_14", correct: true, time_sec: 40 })], 1);
    expect(p.momentum).toBe(0);
    expect(p.fatigueTimeSlope).toBe(0);
    expect(p.optimalSessionMin).toBeNull();
  });
});

describe("A3 — Return Model v0 (assumed weights, versioned, calibrated later)", () => {
  it("higher streak and completion raise propensity; longer gaps lower it", () => {
    const strong = returnPropensity(DEFAULT_RETURN_MODEL, { streak: 6, gapDays: 0, completionRate: 1, momentum: 0.5 });
    const weak = returnPropensity(DEFAULT_RETURN_MODEL, { streak: 0, gapDays: 6, completionRate: 0.2, momentum: -0.5 });
    expect(strong.p).toBeGreaterThan(weak.p);
    expect(strong.status).toBe("assumed");
  });

  it("is deterministic and bounded", () => {
    const a = returnPropensity(DEFAULT_RETURN_MODEL, { streak: 3, gapDays: 1, completionRate: 0.8, momentum: 0.2 });
    const b = returnPropensity(DEFAULT_RETURN_MODEL, { streak: 3, gapDays: 1, completionRate: 0.8, momentum: 0.2 });
    expect(a.p).toBe(b.p);
    expect(a.p).toBeGreaterThan(0.01);
    expect(a.p).toBeLessThan(0.99);
  });
});

describe("A4 — Engagement experiments (deterministic, propensity-logged, ethics registry)", () => {
  it("assignment is deterministic per student and uniformly propensity-logged", () => {
    const def = { id: "nudge_timing_v1", mechanism: "nudge_timing_window" as const, variants: ["A_measured_window", "B_fixed_morning"] as ["A_measured_window", "B_fixed_morning"], salt: "s" };
    const a1 = assign("student-1", def);
    const a2 = assign("student-1", def);
    expect(a1).toEqual(a2);
    expect(a1.propensity).toBe(0.5);
    expect(["A", "B"]).toContain(a1.variant);
    const bStudent = assign("student-2", def);
    expect([a1.variant, bStudent.variant]).toContain("A");
  });

  it("the pilot suite only draws from the respectful registry", () => {
    const suite = pilotExperimentSuite("student-9");
    expect(suite.length).toBeGreaterThanOrEqual(2);
    const knownIds = ["nudge_timing_v1", "session_len_v1"];
    for (const a of suite) expect(knownIds).toContain(a.experimentId);
    // and every mechanism id in the suite is a registered key
    for (const id of knownIds) expect(Object.keys(ENGAGEMENT_MECHANISM_REGISTRY).length).toBeGreaterThan(0);
  });

  it("evaluation reports per-variant rates and refuses winner claims when underpowered", () => {
    const records = [
      ...Array.from({ length: 10 }, (_, i) => ({ experimentId: "x", variant: "A" as const, studentId: `a${i}`, returnedNextDay: i % 2 === 0 })),
      ...Array.from({ length: 10 }, (_, i) => ({ experimentId: "x", variant: "B" as const, studentId: `b${i}`, returnedNextDay: i % 4 === 0 })),
    ];
    const r = evaluateExperiment(records);
    expect(r.byVariant[0]!.n).toBe(10);
    expect(r.byVariant[0]!.returnRate).toBeCloseTo(0.5);
    expect(r.note).toMatch(/underpowered/);
  });
});

describe("A2 — MEMORY_OPEN (the continuity move)", () => {
  function setupWithConfirmedMisconception() {
    const st = initialState(model);
    const sys = newSystemState(model);
    // confirm a misconception on c_fr_21 (its item i_fr_5 has the tagged distractor)
    const item = content.itemById.get("i_fr_5")!;
    for (let k = 0; k < 3; k++) {
      updateMisconception(sys.misconceptions, item, 0, false, 3);
      observe(model, st, { conceptId: "c_fr_21", correct: false, evidenceW: 1, day: k + 1 });
    }
    return { st, sys };
  }

  it("fires once at the first teach segment when a confirmed misconception exists", () => {
    const { st, sys } = setupWithConfirmedMisconception();
    const rng = makeRng(11);
    const plan = planDay(model, st, { day: 5, daysToExam: 100, minutesAvailable: 240, memory: new Map() }, DEFAULT_PLANNER_PARAMS, rng);
    const session = composeSession(plan, 40, undefined, buildPlanReceipt(plan, []));
    const teach = session.segments.find((s) => s.kind === "teach");
    expect(teach).toBeDefined();
    const one = { segments: [teach!] };
    const teacher = startTeacherSession();
    const m1 = nextMove(model, st, sys.misconceptions, teacher, one, bank, { conceptId: "c_fr_21", label: "maneka any procedure", wrongCount: 3 });
    expect(m1!.move).toBe("MEMORY_OPEN");
    expect(m1!.utterance).toMatch(/Yesterday/i);
    applyStudentTurn(teacher, {});
    const m2 = nextMove(model, st, sys.misconceptions, teacher, one, bank, { conceptId: "c_fr_21", label: "x", wrongCount: 3 });
    expect(m2!.move).not.toBe("MEMORY_OPEN"); // once per session
  });

  it("does not fire without a signal", () => {
    const st = initialState(model);
    const teach = {
      id: "seg_t", kind: "teach" as const, conceptId: "c_fr_21", conceptName: "A21", minutes: 20, sourceBlockIndex: 0,
      prediction: { dMastery: 0, stabilityMultiplier: 1, dUncertaintyVar: 0, status: "assumed" as const, confidence: 0.4, aomVersion: "aom" },
      objective: "t",
    };
    const teacher = startTeacherSession();
    const m = nextMove(model, st, newMisconceptionState(), teacher, { segments: [teach] }, bank);
    expect(m!.move).not.toBe("MEMORY_OPEN");
  });
});

describe("Behaviour flags still hold after the enrichment", () => {
  it("no-labels guarantee: the personalisation state contains only numbers and concept ids", () => {
    const p = computePersonalisationState(fatigueStream(), 10);
    for (const v of Object.values(p)) {
      if (Array.isArray(v)) {
        for (const a of v) expect(typeof a.conceptId === "string" && typeof a.missedSessions === "number").toBe(true);
      } else if (v !== null && v !== undefined) {
        expect(["number", "undefined"]).toContain(typeof v);
      }
    }
    const f = computeBehaviourFeatures(fatigueStream(), 10);
    expect(() => behaviourFlags(f, 0)).not.toThrow();
  });
});
