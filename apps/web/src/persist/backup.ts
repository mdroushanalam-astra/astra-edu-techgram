/**
 * EXPORT / RECOVERY [Real-World Layer] — local-only storage is a real risk
 * for shared family phones. One file carries everything: the profile + the
 * full event log. Import rebuilds the room exactly (state = replay).
 */

import type { StudentEvent } from "@techgram/kernel";
import { loadEvents, saveEvents } from "./idb.js";
import { loadProfile, saveProfile } from "./profile.js";

export function exportAll(): void {
  loadEvents<StudentEvent>().then((events) => {
    const bundle = {
      kind: "techgram-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: loadProfile(),
      events,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `techgram-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

export async function importAll(file: File): Promise<{ ok: boolean; error?: string }> {
  try {
    const text = await file.text();
    const bundle = JSON.parse(text);
    if (bundle.kind !== "techgram-backup" || !Array.isArray(bundle.events)) {
      return { ok: false, error: "not a Techgram backup file" };
    }
    if (bundle.profile) saveProfile(bundle.profile);
    await saveEvents(bundle.events);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e).slice(0, 120) };
  }
}
