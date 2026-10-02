/**
 * B12 — Intelligence Receipt: every decision is auditable.
 * The receipt is the contract between the kernel and every stakeholder:
 * student ("why this?"), parent ("why Geography not Economics?"),
 * founder ("is the system actually calibrated?").
 */

import type { Plan, PlanBlock } from "./planner.js";
import { round4, Envelope } from "./envelope.js";
import type { AomParams } from "./aom.js";

export interface ReceiptInput {
  fact: string;
  envelope: Envelope | Record<string, unknown>;
}

export interface Receipt {
  receipt_id: string;
  slot: string;
  decision: string;
  day: number;
  inputs: ReceiptInput[];
  expected: Record<string, unknown>;
  alternatives: { action: string; score: number; why?: string }[];
  assumptions: { id: string; status: "assumed" | "measured"; sensitivity?: string }[];
  constraints_checked: string[];
  /** ADR-030: which measured behaviour signals changed this plan (audit trail). */
  personalisation: string[];
  /** ADR-030 opportunity cost: the best action today's budget did not buy. */
  opportunity_cost: { action: string; concept: string; gain_per_minute: number; why: string } | null;
  unknowns: string[];
  what_would_change_my_mind: string;
  params_version: string;
  propensity?: number;
  actual_outcome?: Record<string, unknown> | null;
  prediction_error?: number | null;
}

let receiptCounter = 0;

export function buildPlanReceipt(plan: Plan, unknowns: string[], aom?: AomParams | string): Receipt {
  receiptCounter += 1;
  const id = `rcpt_d${plan.day}_${String(receiptCounter).padStart(6, "0")}`;
  const aomParams = typeof aom === "string" ? undefined : aom;
  const aomVersion = typeof aom === "string" ? aom : aom?.version;
  const alternatives = plan.blocks.slice(0, 5).map((b: PlanBlock) => ({
    action: `${b.action}:${b.conceptId}`,
    score: round4(b.gainPerMinute),
    why: b.reason,
  }));
  // Assumptions come from the AOM parameter pack — the receipt inherits the
  // AOM's honest `assumed|measured` status per gain, never a blanket claim.
  const assumptions: Receipt["assumptions"] = aomParams
    ? (Object.entries(aomParams.gainsPer10Min) as [string, { status: "assumed" | "measured"; n: number }][]).map(
        ([id2, g]) => ({ id: `aom.gain.${id2}`, status: g.status, sensitivity: `n=${g.n}` }),
      )
    : [{ id: "aom.gains", status: "assumed", sensitivity: "default pack" }];
  return {
    receipt_id: id,
    slot: "NEXT_SESSION",
    decision:
      plan.blocks.length === 0
        ? "No plan blocks (insufficient information or no candidates)"
        : plan.blocks
            .map((b) => `${b.action} ${b.conceptName} (${b.minutes}m)`)
            .join(" → "),
    day: plan.day,
    inputs: [], // filled by the caller from state reports where relevant
    expected: {
      total_gain_marks: round4(plan.expectedGainMarks),
      total_minutes: plan.totalMinutes,
      aom_version: aomVersion ?? plan.blocks[0]?.prediction.aomVersion ?? "aom-0.1.0-assumed",
      per_block_predictions: plan.blocks.map((b) => ({
        action: b.action,
        concept: b.conceptId,
        d_mastery: round4(b.prediction.dMastery),
        status: b.prediction.status,
      })),
      basis: "robust mean over posterior draws; action outcomes predicted by the Action Outcome Model",
    },
    alternatives,
    assumptions,
    constraints_checked: [
      "prerequisites",
      "minutes",
      "review share",
      "block cap",
      ...(plan.personalisationApplied.some((s) =>
        /^(rest_day|lighten_plan|load_cap|fatigue_blocks|avoidance_soft):/.test(s),
      )
        ? ["measured behaviour caps"]
        : []),
    ],
    personalisation: plan.personalisationApplied,
    opportunity_cost: plan.foregone
      ? {
          action: plan.foregone.action,
          concept: plan.foregone.conceptId,
          gain_per_minute: round4(plan.foregone.gainPerMinute),
          why: plan.foregone.why,
        }
      : null,
    unknowns,
    what_would_change_my_mind:
      "Two correct no-hint responses on a grey concept, or a failed delayed check on a reviewed one",
    params_version: plan.paramsVersion,
    actual_outcome: null,
    prediction_error: null,
  };
}

/** Join an actual outcome back to a receipt (the slow loop's fuel). */
export function joinOutcome(receipt: Receipt, actual: Record<string, unknown>): Receipt {
  const expected = receipt.expected.total_gain_marks as number | undefined;
  receipt.actual_outcome = actual;
  if (typeof expected === "number" && typeof actual.gain_marks === "number") {
    receipt.prediction_error = round4(actual.gain_marks - expected);
  }
  return receipt;
}
