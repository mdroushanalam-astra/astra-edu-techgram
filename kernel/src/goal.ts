/**
 * Goal Spec — one planner for every goal. UPSC now; JEE/K12/Career later
 * are config, not code.
 */

export interface GoalSpec {
  id: string;
  deadline: string; // ISO date
  /** Logical day the exam falls on (day numbering shared with the kernel). */
  deadlineDay: number;
  payoff: "expected_marks" | "pass_probability";
  /** Optional per-paper constraints (coverage floors), V1: informational. */
  constraints?: {
    hoursPerDay?: number;
    minCoverage?: Record<string, number>;
  };
}

export function daysBetween(startDay: number, deadlineDay: number): number {
  return Math.max(0, deadlineDay - startDay);
}
