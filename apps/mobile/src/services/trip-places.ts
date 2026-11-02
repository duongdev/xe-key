import type { Trip } from "./car";
import type { Point } from "./polyline";

/** What a trip detail gives once (past trips never change), kept per trip id. */
export type SavedTrip = { from: string | null; to: string | null; route: Point[] };
export type SavedTrips = Record<string, SavedTrip>;

export function withPlaces(trips: Trip[], saved: SavedTrips): Trip[] {
  return trips.map((t) => {
    const s = saved[t.id];
    return t.from === null && s ? { ...t, from: s.from, to: s.to } : t;
  });
}

/** Ids of listed trips with no places yet: the ones the PIN would load. */
export function lacking(trips: Trip[], saved: SavedTrips): string[] {
  return trips.filter((t) => t.from === null && !saved[t.id]).map((t) => t.id);
}
