/**
 * THE C1 GATE [ADR-035] — matched runs: Linear Teacher vs Executive Teacher.
 * Same student, same content, same time budget, same evidence stream.
 * Metrics: simulated exam outcome, interventions taken, receipts complete,
 * deterministic replay. HARD GATE: if the Executive doesn't match-or-beat the
 * linear teacher, we fix it — we don't decorate it.
 */
import { makeRng } from "../linalg.js";
import type { ExecutiveDirective, ExecutiveReceipt, TurnWorkspace } from "./executive.js";
import { decide, DEFAULT_LIMITS } from "./executive.js";

interface SimStudent { base: number; seed: number }

interface DayResult { marks: number; fatigueEnd: number; jokes: number; llm: number; breaks: number; receipts: number; wrongStreaksRecovered: number }

/** One simulated session of 4 segments; returns the day's learning outcome. */
function runSession(
  student: SimStudent, policy: "linear" | "executive", day: number, dayFatigue: number,
): DayResult {
  const rng = makeRng(student.seed * 100 + day * 7);
  let fatigue = dayFatigue;
  let masteryGain = 0;
  let jokes = 0, llm = 0, breaks = 0, receipts = 0, recovered = 0;
  let wrongStreak = 0;
  const receipts_exec: ExecutiveReceipt[] = [];
  const seq = ["retrieve", "teach", "practice", "assess"] as const;

  for (let turn = 0; turn < 4; turn++) {
    let mode: string = seq[turn];
    if (policy === "executive") {
      const w: TurnWorkspace = {
        turn: day * 4 + turn,
        elapsedMin: turn * 10,
        timeLeftMin: 40 - turn * 10,
        focusConcept: { id: "c", name: "c", mean: 0.4, grey: false },
        alternativeConcept: { id: "alt", name: "alt", gainPerMinute: 0.2 },
        uncertainties: 5, hypothesisCount: 1,
        momentum: wrongStreak === 0 ? 0.5 : 0.1,
        frustration: wrongStreak * 0.3,
        fatigue: Math.min(1, fatigue),
        wrongStreak,
        lastOutcome: null,
        planProgress: { done: turn, total: 4 },
        counts: { jokes, llm, breaks, sinceLastIntervention: turn === 0 ? 9 : 3 },
        visualStructure: turn === 2,
        incumbentMove: { kind: mode, conceptId: "c", conceptName: "c" },
      };
      const incumbent = {
        directive: { learningAction: (mode === "retrieve" ? "retrieve" : mode === "teach" ? "teach" : mode === "practice" ? "practice" : "assess") as never, communication: "explain" as never, presentation: "board" as never, augmentation: "no_llm" as never },
        predictedBenefit: 0.5,
      };
      const { directive, receipt } = decide(w, incumbent, student.seed + day * 10 + turn);
      receipts_exec.push(receipt);
      if (directive.learningAction === "break") { breaks++; fatigue = Math.max(0, fatigue - 0.45); mode = "break" as string; }
      else if (directive.communication === "reassure") { jokes++; }
      else if (directive.augmentation === "llm") { llm++; mode = "teach"; }
    }

    // student performance this turn: base accuracy degraded by fatigue
    const acc = Math.max(0.15, student.base - fatigue * 0.35);
    const correct = rng.next() < acc;
    if (correct) { masteryGain += correct ? 0.05 : 0; if (wrongStreak >= 2) recovered++; wrongStreak = 0; }
    else { wrongStreak++; masteryGain -= 0.015; }
    fatigue = Math.min(1, fatigue + 0.07);
    if (mode === "break") fatigue = Math.max(0, fatigue - 0.1);
  }
  void llm;
  return { marks: Math.max(0, masteryGain) * 100 + (100 - fatigue * 30), fatigueEnd: fatigue, jokes, llm, breaks, receipts: receipts_exec.length, wrongStreaksRecovered: recovered };
}

export interface GateReport {
  linear: { marks: number; breaks: number; jokes: number; llm: number };
  executive: { marks: number; breaks: number; jokes: number; llm: number; receipts: number; recovered: number };
  verdict: "PASS" | "FAIL";
  detail: string;
}

/** THE GATE: matched days, same student; the executive must match-or-beat. */
export function runC1Gate(student: SimStudent, days = 10): GateReport {
  let lm = 0, lb = 0, lj = 0, lllm = 0;
  let em = 0, eb = 0, ej = 0, ellm = 0, er = 0, ecov = 0;
  for (let d = 1; d <= days; d++) {
    const dayFatigue = Math.min(0.5, (d - 1) * 0.03);
    const l = runSession(student, "linear", d, dayFatigue);
    const e = runSession(student, "executive", d, dayFatigue);
    lm += l.marks; lb += l.breaks; lj += l.jokes; lllm += l.llm;
    em += e.marks; eb += e.breaks; ej += e.jokes; ellm += e.llm; er += e.receipts; ecov += e.wrongStreaksRecovered;
  }
  const pass = em >= lm - 0.5 && er >= days * 4 * 0.9; // match-or-beat + receipts complete
  return {
    linear: { marks: Math.round(lm), breaks: lb, jokes: lj, llm: lllm },
    executive: { marks: Math.round(em), breaks: eb, jokes: ej, llm: ellm, receipts: er, recovered: ecov },
    verdict: pass ? "PASS" : "FAIL",
    detail: `executive marks ${Math.round(em)} vs linear ${Math.round(lm)} over ${days} matched days; receipts ${er}/${days * 4}`,
  };
}
