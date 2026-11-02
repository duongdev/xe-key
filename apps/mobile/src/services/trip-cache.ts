import { File, Paths } from "expo-file-system";
import { useSyncExternalStore } from "react";
import type { SavedTrip, SavedTrips } from "./trip-places";

// Place names and routes are location history: kept in Library/Caches (never in iCloud or device
// backups). If iOS purges it, the next PIN loads them again.
const file = () => new File(Paths.cache, "trip-places.json");

let saved: SavedTrips | null = null;
const listeners = new Set<() => void>();
const emit = () => {
  for (const l of listeners) l();
};

function load(): SavedTrips {
  if (saved) return saved;
  try {
    const f = file();
    saved = f.exists ? (JSON.parse(f.textSync()) as SavedTrips) : {};
  } catch {
    saved = {};
  }
  return saved;
}

export const tripCache = {
  all: load,
  get: (id: string): SavedTrip | undefined => load()[id],
  put(add: SavedTrips) {
    saved = { ...load(), ...add };
    try {
      file().write(JSON.stringify(saved));
    } catch (e) {
      console.warn("trip cache: save failed", e);
    }
    emit();
  },
  /** Sign-out and Forget PIN. */
  clear() {
    saved = {};
    try {
      const f = file();
      if (f.exists) f.delete();
    } catch (e) {
      console.warn("trip cache: clear failed", e);
    }
    emit();
  },
};

export function useSavedTrips(): SavedTrips {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    return () => listeners.delete(l);
  }, load);
}
