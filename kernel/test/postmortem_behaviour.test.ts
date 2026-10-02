import { describe, it, expect } from "vitest";
import {
  buildBeliefModel, initialState, observe, DEFAULT_BELIEF_PARAMS,
} from "../src/belief.js";
import { DEFAULT_MEMORY_PARAMS } from "../src/memory.js";
import { buildSeedContent } from "../src/polity_seed.js";
import { analyseMock, type MockQuestion } from "../src/postmortem.js";
import {
  computeBehaviourFeatures, behaviourFlags, notificationDecision, missedSessionProbe,
  type BehaviourFeatures,
} from "../src/behaviour.js";
import type { StudentEvent } from "../src/events.js";

const content = buildSeedContent();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });

/** Force a concept's believed mastery to a target σ level for classification tests. */
function stateWith(conceptId: string, targetSigma: number) {
  const st = initialState(model);
  const i = model.index.get(conceptId)!;
  const targetLogit = Math.log(targetSigma / (1 - targetSigma));
  st.mu[i] = targetLogit;
  return st;
}

function q(over: Partial<MockQuestion>): MockQuestion {
  return {
    itemId: "i_fr_1", conceptId: "c_fr_14", attempted: true, chosenOption: 0,
    correct: false, timeSec: 60, confidence: 2, position: 0,
    ...over,
  };
}

describe("B11 — mock post-mortem classification (deterministic, hand-labelled)", () => {
  it("knowledge_gap: wrong, belief said weak (<40%), not rapid", () => {
    const st = stateWith("c_fr_14", 0.15);
    const pm = analyseMock(model, st, [q({})]);
    expect(pm.perQuestion[0]!.cls).toBe("knowledge_gap");
  });

  it("trap: knew it (belief ≥60%), chose the TAGGED trap distractor, was confident", () => {
    const st = stateWith("c_fr_19", 0.85); // i_fr_3 belongs to c_fr_19, tag on option 2
    const pm = analyseMock(model, st, [q({ itemId: "i_fr_3", conceptId: "c_fr_19", chosenOption: 2 })]);
    expect(pm.perQuestion[0]!.cls).toBe("trap");
  });

  it("careless: knew it, answered in half the expected time", () => {
    const st = stateWith("c_fr_14", 0.85);
    const pm = analyseMock(model, st, [q({ timeSec: 15 })]); // expected 40 → ratio <0.5
    expect(pm.perQuestion[0]!.cls).toBe("careless");
  });

  it("time_pressure: last stretch of the paper, question within reach", () => {
    const st = stateWith("c_fr_14", 0.85);
    const pm = analyseMock(model, st, [q({ position: 20 })]); // single-question paper → position ratio ≥0.85
    expect(pm.perQuestion[0]!.cls).toBe("time_pressure");
  });

  it("bad_guess: self-declared guess below break-even (needs a genuinely low belief)", () => {
    const st = stateWith("c_dp_conf", 0.05); // hard item (d=5) + very low belief → p < 0.28
    const pm = analyseMock(model, st, [q({ itemId: "i_dp_4", conceptId: "c_dp_conf", confidence: 1 })]);
    expect(pm.perQuestion[0]!.cls).toBe("bad_guess");
    expect(pm.perQuestion[0]!.pBefore).toBeLessThan(pm.attemptPolicy.breakEven);
  });

  it("over_skip: left a question the belief says was answerable", () => {
    const st = stateWith("c_fr_14", 0.9);
    const pm = analyseMock(model, st, [q({ attempted: false })]);
    expect(pm.perQuestion[0]!.cls).toBe("over_skip");
    expect(pm.perQuestion[0]!.marksImpact).toBeLessThan(0); // expected value surrendered
  });

  it("correct answers are a class, not an error", () => {
    const st = stateWith("c_fr_14", 0.8);
    const pm = analyseMock(model, st, [q({ correct: true, chosenOption: 0 })]);
    expect(pm.perQuestion[0]!.cls).toBe("correct");
    expect(pm.attemptPolicy.actualMarks).toBe(2);
  });

  it("mid-belief wrongs with moderate confidence are honestly UNCLASSIFIED", () => {
    const st = stateWith("c_fr_14", 0.5);
    const pm = analyseMock(model, st, [q({ confidence: 2 })]);
    expect(pm.perQuestion[0]!.cls).toBe("unclassified");
  });

  it("the attempt-policy coach quantifies what the break-even would have earned", () => {
    // Mixed-belief paper: c_fr_14 believed strong, c_dp_conf believed hopeless.
    const st = initialState(model);
    st.mu[model.index.get("c_fr_14")!] = 2;    // strong
    st.mu[model.index.get("c_dp_conf")!] = -3; // hopeless (hard item, d=5)
    const pm = analyseMock(model, st, [
      q({ correct: true, confidence: 3 }),                                          // +2, attempted as advised
      q({ itemId: "i_fr_2", attempted: false, position: 1 }),                       // over-skip (belief high)
      q({ itemId: "i_dp_4", conceptId: "c_dp_conf", confidence: 1, position: 2 }),  // bad guess (belief < break-even)
    ]);
    expect(pm.attemptPolicy.overSkips).toBe(1);
    expect(pm.attemptPolicy.badGuesses).toBe(1);
    expect(pm.attemptPolicy.expectedMarksIfFollowed).toBeGreaterThan(pm.attemptPolicy.actualMarks);
    expect(pm.attemptPolicy.lines.join(" ")).toMatch(/break-even/);
  });

  it("confidence calibration uses the student's OWN data", () => {
    const st = stateWith("c_fr_14", 0.8);
    const pm = analyseMock(model, st, [
      q({ correct: true, confidence: 3 }),
      q({ itemId: "i_fr_2", correct: true, confidence: 3, chosenOption: 0 }),
      q({ itemId: "i_fr_3", correct: true, confidence: 3, chosenOption: 1 }),
      q({ itemId: "i_fr_4", correct: false, confidence: 3, chosenOption: 0, position: 50 }),
    ]);
    expect(pm.attemptPolicy.confidenceCalibration[3].attempted).toBe(4);
    expect(pm.attemptPolicy.confidenceCalibration[3].accuracy).toBeCloseTo(0.75);
  });
});

// ---------------------------------------------------------------------------
// B9 behaviour engine
// ---------------------------------------------------------------------------

let evCounter = 0;
function ev(day: number, type: StudentEvent["type"], payload: Record<string, unknown> = {}): StudentEvent {
  evCounter += 1;
  return {
    event_id: `be_${evCounter}`, student_id: "s", day, type, payload,
    source: "test", schema_version: 1, idempotency_key: `bk${evCounter}`,
  };
}

function buildEvents(): StudentEvent[] {
  const out: StudentEvent[] = [];
  // 14 days of activity: sessions + responses with hints + confident wrongs.
  for (let day = 1; day <= 14; day++) {
    out.push(ev(day, "session_completed"));
    for (let k = 0; k < 6; k++) {
      out.push(ev(day, "item_response", { concept_id: "c_fr_14", correct: k % 2 === 0, confidence: 3, time_sec: 40 }));
    }
    if (day % 2 === 0) out.push(ev(day, "hint_used", { concept_id: "c_fr_14" }));
  }
  return out;
}

describe("B9 — behaviour features (measured, never guessed)", () => {
  it("extracts deterministic features from the raw event log", () => {
    const f = computeBehaviourFeatures(buildEvents(), 14);
    expect(f.activeDays).toBe(14);
    expect(f.streak).toBe(14);
    expect(f.responses).toBe(84);
    expect(f.hintRate).toBeCloseTo(7 / 84, 3); // hints on even days only
    expect(f.completionRate).toBe(1);
    // conf-3 accuracy = 50% = overall accuracy → gap 0
    expect(f.confidenceAccuracyGap).toBeCloseTo(0, 5);
  });

  it("overconfidence shows as a NEGATIVE confidence-accuracy gap", () => {
    // Confident (3) answers are all WRONG; the rest are right → conf-3 accuracy 0 < overall 0.5.
    const events = buildEvents().map((e) => {
      if (e.type !== "item_response") return e;
      const correct = Boolean(e.payload.correct);
      return { ...e, payload: { ...e.payload, correct, confidence: correct ? 2 : 3 } };
    });
    const f = computeBehaviourFeatures(events, 14);
    expect(f.confidenceAccuracyGap).toBeLessThan(0);
  });

  it("flags are internal action changes, never labels: hint dependence → fade hints", () => {
    const heavy: BehaviourFeatures = {
      daysObserved: 14, activeDays: 10, completionRate: 0.9, streak: 5, gapDays: 0,
      hintRate: 0.5, rapidGuessRate: 0.05, meanConfidence: 2.5, confidenceAccuracyGap: 0,
      responses: 100,
    };
    expect(behaviourFlags(heavy, 0).fadeHints).toBe(true);
  });

  it("overconfidence → calibration drills; burnout drift → LIGHTER plan, never escalation", () => {
    const overconfident: BehaviourFeatures = {
      daysObserved: 14, activeDays: 12, completionRate: 1, streak: 6, gapDays: 0,
      hintRate: 0.05, rapidGuessRate: 0.05, meanConfidence: 3, confidenceAccuracyGap: -0.3,
      responses: 60,
    };
    expect(behaviourFlags(overconfident, 0).calibrationDrill).toBe(true);
    const drifted: BehaviourFeatures = {
      daysObserved: 14, activeDays: 2, completionRate: 0.3, streak: 0, gapDays: 5,
      hintRate: 0.1, rapidGuessRate: 0.1, meanConfidence: 2, confidenceAccuracyGap: 0,
      responses: 20,
    };
    const flags = behaviourFlags(drifted, 5);
    expect(flags.lightenPlan).toBe(true);
  });

  it("3 missed sessions → hypothesis distribution + a one-tap probe when nothing is dominant", () => {
    const flags = behaviourFlags(computeBehaviourFeatures(buildEvents(), 14), 3);
    expect(flags.missedHypotheses).toBeDefined();
    const top = Math.max(...Object.values(flags.missedHypotheses!));
    expect(top).toBeLessThan(0.5);
    expect(flags.probeNeeded).toBe(true);
    const probe = missedSessionProbe();
    expect(probe.options.length).toBeGreaterThanOrEqual(4);
  });

  it("notification policy: silence when done, back off when ignored, nudge on long gaps", () => {
    const f = computeBehaviourFeatures(buildEvents(), 14);
    expect(notificationDecision(f, true, 0).send).toBe(false);
    expect(notificationDecision(f, false, 2).send).toBe(false);
    const gapped = { ...f, gapDays: 7, streak: 0 };
    expect(notificationDecision(gapped, false, 0).send).toBe(true);
    expect(notificationDecision(gapped, false, 0).reason).toMatch(/gentle/);
  });
});
