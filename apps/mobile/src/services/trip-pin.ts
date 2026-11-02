import { useSyncExternalStore } from "react";
import { NoPin, type Trip } from "./car";
import type { PinResult } from "./honda-car";
import { carService } from "./query";
import { hondaPin } from "./secret";
import { tripCache } from "./trip-cache";
import { lacking } from "./trip-places";

// HANDOFF › Honda PIN and trip detail. The token itself lives in the car service (memory only);
// this keeps the app-session flags the screens react to.
type Session = { unlocked: boolean; faceIdTried: boolean; faceIdFailed: boolean };
let session: Session = { unlocked: false, faceIdTried: false, faceIdFailed: false };
const listeners = new Set<() => void>();
const set = (next: Partial<Session>) => {
  session = { ...session, ...next };
  for (const l of listeners) l();
};

/** Current flags outside React (e.g. inside a refresh callback). */
export const pinSession = () => session;

export function usePinSession(): Session {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => session,
  );
}

/** Loads route and places for these trips (3 at a time) into the cache. */
export async function loadPlaces(ids: string[]) {
  for (let i = 0; i < ids.length; i += 3) {
    const got = await Promise.all(
      ids.slice(i, i + 3).map(async (id) => {
        try {
          return [id, await carService.tripDetail(id)] as const;
        } catch (e) {
          if (e instanceof NoPin) set({ unlocked: false });
          else console.warn("trip detail failed", id, e);
          return null;
        }
      }),
    );
    tripCache.put(Object.fromEntries(got.filter((g) => g !== null)));
  }
}

/** Checks a typed PIN. On success it is remembered behind Face ID when asked. */
export async function unlock(pin: string, remember: boolean): Promise<PinResult> {
  const res = await carService.verifyPin(pin);
  if (res.ok) {
    set({ unlocked: true, faceIdFailed: false });
    if (remember) await hondaPin.set(pin).catch(() => {});
    else await hondaPin.del();
  }
  return res;
}

/**
 * Opening Trips: Face ID by itself, once per app session, only with a saved PIN and listed trips
 * that lack places. `changed`: Honda rejected the stored PIN (it is deleted).
 */
export async function autoFaceId(
  trips: Trip[],
  reason: string,
): Promise<"ok" | "failed" | "changed" | "skipped"> {
  if (session.unlocked || session.faceIdTried) return "skipped";
  if (!lacking(trips, tripCache.all()).length || !(await hondaPin.saved())) return "skipped";
  set({ faceIdTried: true });
  const pin = await hondaPin.get(reason);
  if (!pin) {
    set({ faceIdFailed: true });
    return "failed";
  }
  const res = await carService.verifyPin(pin);
  if (res.ok) {
    set({ unlocked: true });
    return "ok";
  }
  if (res.error === "wrong") {
    await hondaPin.del();
    return "changed";
  }
  set({ faceIdFailed: true });
  return "failed";
}

/** Settings › Forget PIN, and sign-out: no stored PIN, token, places or routes. */
export async function forgetPin() {
  carService.forgetPin();
  tripCache.clear();
  set({ unlocked: false, faceIdTried: false, faceIdFailed: false });
  await hondaPin.del();
}

/**
 * A trip tap without a token: Face ID when a PIN is saved (asked by the user's tap, so not limited
 * to once per session). `sheet`: fall back to the PIN sheet; `changed`: stored PIN rejected.
 */
export async function faceIdUnlock(reason: string): Promise<"ok" | "sheet" | "changed"> {
  if (session.unlocked) return "ok";
  if (!(await hondaPin.saved())) return "sheet";
  const pin = await hondaPin.get(reason);
  if (!pin) return "sheet";
  const res = await carService.verifyPin(pin);
  if (res.ok) {
    set({ unlocked: true, faceIdFailed: false });
    return "ok";
  }
  if (res.error === "wrong") {
    await hondaPin.del();
    return "changed";
  }
  return "sheet";
}

/** The trip a row opened, for the detail screen (rows already hold everything but the route). */
const opened = new Map<string, Trip>();
export const openedTrip = {
  set: (trip: Trip) => opened.set(trip.id, trip),
  get: (id: string) => opened.get(id),
};
