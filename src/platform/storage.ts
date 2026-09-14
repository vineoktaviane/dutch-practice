import { openDB, type IDBPDatabase } from 'idb';
import type { Stats } from '../types';
import type { FactState } from '../srs/sm2';

// v1 used a key-value window.storage API that only existed in its original
// environment; this replaces it with IndexedDB so progress survives offline.
const DB_NAME = 'dutch-grammar-trainer';
const STORE = 'kv';
const SRS_STORE = 'srs';
const STATS_KEY = 'stats';

let dbPromise: Promise<IDBPDatabase> | null = null;

function db(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    // An older tab or the installed window holding the previous version blocks
    // the upgrade: openDB then never settles, and an unsettled promise skips
    // the catch blocks below entirely. Time it out so callers fall back.
    const opening = openDB(DB_NAME, 2, {
      upgrade(d, oldVersion) {
        if (oldVersion < 1) d.createObjectStore(STORE);
        if (oldVersion < 2) d.createObjectStore(SRS_STORE, { keyPath: 'id' });
      },
      blocking(_cur, _next, event) {
        // a newer version is waiting on us: let go and reconnect on demand
        (event.target as IDBDatabase | null)?.close();
        dbPromise = null;
      }
    });
    dbPromise = Promise.race([
      opening,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('IndexedDB upgrade blocked')), 3000)
      )
    ]);
  }
  return dbPromise;
}

export function emptyStats(): Stats {
  return { answered: 0, correct: 0, byTopic: {} };
}

export async function loadStats(): Promise<Stats> {
  try {
    const v = await (await db()).get(STORE, STATS_KEY);
    if (v && typeof v.answered === 'number') return v as Stats;
  } catch {
    // IndexedDB unavailable (e.g. some private-browsing modes): run in-memory
  }
  return emptyStats();
}

export async function saveStats(stats: Stats): Promise<void> {
  try {
    await (await db()).put(STORE, stats, STATS_KEY);
  } catch {
    // best-effort: the session still works without persistence
  }
}

export interface Settings {
  /** typed-answer mode per context (topic id, 'mix', or 'review') */
  typed: Record<string, boolean>;
  /** answer sounds on/off; undefined (older saves) means on */
  sound?: boolean;
}

export async function loadSettings(): Promise<Settings> {
  try {
    const v = await (await db()).get(STORE, 'settings');
    if (v && typeof v.typed === 'object') return v as Settings;
  } catch {
    // fall through to defaults
  }
  return { typed: {} };
}

export async function saveSettings(s: Settings): Promise<void> {
  try {
    await (await db()).put(STORE, s, 'settings');
  } catch {
    // best-effort
  }
}

export async function loadFactStates(): Promise<FactState[]> {
  try {
    return (await (await db()).getAll(SRS_STORE)) as FactState[];
  } catch {
    return [];
  }
}

export async function saveFactState(state: FactState): Promise<void> {
  try {
    await (await db()).put(SRS_STORE, state);
  } catch {
    // best-effort: SRS still works in-memory for this session
  }
}
