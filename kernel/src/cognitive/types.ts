/** Minimal structural types so the cognitive module stays decoupled. */
export interface SanctuaryPlanLike {
  blocks: { action: string; conceptId: string; conceptName: string; minutes: number; gainPerMinute: number; reason: string }[];
  foregone: { action: string; conceptId: string; conceptName: string; why: string } | null;
  totalMinutes: number;
}
