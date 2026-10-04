/**
 * TARGETING POLICY [ADR-046] — the Executive's aiming rule, strengthened.
 *
 * THE FINDING THAT DROVE THIS [Layer Study, ADR-045]: the Executive observes
 * selectively (it aims where believed need is), so on students who know most
 * of the map, long-untouched concepts' beliefs go STALE — the calibration
 * advantage inverted for advanced students (belief error 0.38/0.40 vs linear's
 * 0.34/0.41 at t07/t08). Marks never lost, but understanding degraded.
 *
 * THE FIX: staleness-aware need — a concept not observed for many days carries
 * a bounded maintenance boost on top of believed need. The Executive spends a
 * slice of its budget keeping its map fresh instead of letting it rot.
 *
 * `staleness: false` reproduces the historical Phase 1 behavior exactly — the
 * deep gate [EXPERIMENTS §17] remains the frozen matched-baseline evidence.
 */

export interface ConceptNeedArgs {
  mean: number;            // believed mastery (0..1)
  grey: boolean;           // insufficient evidence
  weight: number;          // world prior weight
  lastObservedDay: number; // day the concept was last observed (0 = never)
  day: number;             // current day
  staleness?: boolean;     // enable the maintenance boost
}

export const STALENESS_HORIZON = 10;  // days until a concept is fully "stale"
export const STALENESS_BOOST = 0.25;  // up to +25% need for fully stale concepts

export function conceptNeed(args: ConceptNeedArgs): number {
  const base = (args.grey ? 0.85 : 1 - args.mean) * args.weight;
  if (!args.staleness) return base;
  const since = Math.max(0, args.day - args.lastObservedDay);
  const stale = Math.min(1, since / STALENESS_HORIZON);
  return base * (1 + STALENESS_BOOST * stale);
}
