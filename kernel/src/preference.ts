/**
 * S1 — PREFERENCE STATE [ADR-027/028].
 * AOM-style: preference hypothesis → predicted response → observed →
 * prediction error → update. NO personality labels — estimates with n, error
 * and provenance. "Riya likes humour = true" is banned; estimates are kept.
 */

export type PreferenceDimension = "example_style" | "explanation_style" | "interaction_style" | "humor";

export const PREFERENCE_DIMENSIONS: Record<PreferenceDimension, string[]> = {
  example_style: ["real_world", "historical", "fictional"],
  explanation_style: ["analogy", "diagram", "formal_definition"],
  interaction_style: ["questions", "challenge"],
  humor: ["dry", "absurd", "student_life", "exam"],
};

export interface PreferenceEstimate {
  dimension: PreferenceDimension;
  option: string;
  /** Engagement/response estimate 0..1 (0.5 = neutral prior). */
  estimate: number;
  n: number;
  /** Last prediction error (observed − predicted), when measured. */
  lastError?: number;
  day: number;
}

export interface PreferenceMismatch {
  dimension: PreferenceDimension;
  option: string;
  predicted: number;
  observed: number;
  error: number;
  n: number;
  day: number;
}

export interface PreferenceState {
  byDimension: Record<string, PreferenceEstimate[]>;
  mismatches: PreferenceMismatch[];
}

export function initialPreferenceState(): PreferenceState {
  return { byDimension: {}, mismatches: [] };
}

export function copyPreferenceState(s: PreferenceState): PreferenceState {
  return {
    byDimension: JSON.parse(JSON.stringify(s.byDimension)),
    mismatches: s.mismatches.map((m) => ({ ...m })),
  };
}

function findEstimate(s: PreferenceState, dim: PreferenceDimension, option: string): PreferenceEstimate | undefined {
  return (s.byDimension[dim] ?? []).find((e) => e.option === option);
}

/** Current estimate (neutral 0.5 prior when unobserved). */
export function predictPreference(s: PreferenceState, dim: PreferenceDimension, option: string): number {
  return findEstimate(s, dim, option)?.estimate ?? 0.5;
}

/**
 * Observe a preference response and update with shrinkage toward the
 * estimate (k = prior strength). A large error on an established estimate
 * is logged as a MISMATCH — "I thought you preferred diagrams; adjusting."
 */
export function observePreference(
  s: PreferenceState,
  dim: PreferenceDimension,
  option: string,
  observed: number,
  day: number,
  opts: { priorStrength?: number; mismatchThreshold?: number } = {},
): PreferenceMismatch | null {
  const k = opts.priorStrength ?? 6;
  const threshold = opts.mismatchThreshold ?? 0.3;
  const prior = findEstimate(s, dim, option);
  const predicted = prior?.estimate ?? 0.5;
  const n = (prior?.n ?? 0) + 1;
  const estimate = Math.max(0, Math.min(1, prior
    ? prior.estimate + (observed - prior.estimate) * (k / (k + n))
    : (observed + 0.5 * k) / (1 + k)));
  const error = observed - predicted;

  const arr = s.byDimension[dim] ?? [];
  const idx = arr.findIndex((e) => e.option === option);
  const entry: PreferenceEstimate = {
    dimension: dim, option, estimate, n,
    lastError: error, day,
  };
  if (idx >= 0) arr[idx] = entry; else arr.push(entry);
  s.byDimension[dim] = arr;

  let mismatch: PreferenceMismatch | null = null;
  if (n >= 3 && Math.abs(error) > threshold) {
    mismatch = { dimension: dim, option, predicted, observed, error, n, day };
    s.mismatches.push(mismatch);
  }
  return mismatch;
}

/** The AOM-law check: personalization predictions must be tracked for error. */
export function preferenceAccuracy(s: PreferenceState, dim: PreferenceDimension): { n: number; meanAbsError: number } | null {
  const arr = (s.byDimension[dim] ?? []).filter((e) => e.lastError !== undefined);
  if (arr.length === 0) return null;
  return {
    n: arr.reduce((a, e) => a + e.n, 0),
    meanAbsError: arr.reduce((a, e) => a + Math.abs(e.lastError ?? 0), 0) / arr.length,
  };
}
