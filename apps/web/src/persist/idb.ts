/**
 * LOCAL PERSISTENCE [ADR-032] — the room remembers.
 * Local-only IndexedDB of the raw EVENT LOG (kernel-native: state is a
 * projection of events; replay rebuilds everything — beliefs, memory,
 * misconceptions, agency, artifacts). No server, no sync (Wave-2 stays gated).
 */

const DB = "techgram-sanctuary";
const STORE = "events";
let dbp: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  if (!dbp) {
    dbp = new Promise((res, rej) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: "idempotency_key" });
      };
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  }
  return dbp;
}

export async function saveEvents(events: unknown[]): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const d = await db();
    const tx = d.transaction(STORE, "readwrite");
    const st = tx.objectStore(STORE);
    st.clear();
    for (const e of events) st.put(e);
  } catch { /* private mode / quota — the room degrades to in-memory, honestly */ }
}

export async function loadEvents<T>(): Promise<T[]> {
  if (typeof indexedDB === "undefined") return [];
  try {
    const d = await db();
    return await new Promise((res, rej) => {
      const tx = d.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => res(req.result as T[]);
      req.onerror = () => rej(req.error);
    });
  } catch { return []; }
}

export async function wipeEverything(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const d = await db();
    const tx = d.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
  } catch { /* nothing to wipe */ }
}
