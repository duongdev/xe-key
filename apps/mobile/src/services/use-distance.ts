import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { distanceKm } from "../car/distance";
import type { CarLocation } from "./car";

let me: { lat: number; lng: number } | null = null;

/**
 * Km from the phone to the car. Reads the phone's position only if location is already allowed;
 * `ask` (Find screen, where the user wants directions) shows the permission prompt.
 */
export function useDistance(loc: CarLocation | null | undefined, ask = false): number | null {
  const [pos, setPos] = useState(me);
  useEffect(() => {
    if (!loc || loc.distanceKm !== null) return;
    let live = true;
    (async () => {
      const perm = ask
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();
      if (!perm.granted) return;
      const p =
        (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      me = { lat: p.coords.latitude, lng: p.coords.longitude };
      if (live) setPos(me);
    })().catch((e: unknown) => console.warn("distance: no position", e));
    return () => {
      live = false;
    };
  }, [loc, ask]);
  if (!loc) return null;
  if (loc.distanceKm !== null) return loc.distanceKm;
  return pos ? distanceKm(pos, loc) : null;
}
