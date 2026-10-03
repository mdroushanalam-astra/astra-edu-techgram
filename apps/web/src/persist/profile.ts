/**
 * LOCAL PROFILE [ADR-033] — the device IS the account for v3.
 * Stored locally (privacy promise); sync/accounts stay Wave-2.
 */

export interface Profile {
  name: string;
  preferredName?: string;
  exam: string;
  dailyMin: number;
  stage: string;
  journey?: string;
  calib: { difficulty?: string; sessionKind?: string };
  metAstra: boolean;
  createdAt: number;
}

const KEY = "tg_profile_v1";

export function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch { return null; }
}

export function saveProfile(p: Profile): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ }
}

export function markMetAstra(prefName?: string): void {
  const p = loadProfile();
  if (p) saveProfile({ ...p, metAstra: true, preferredName: prefName ?? p.preferredName });
}
