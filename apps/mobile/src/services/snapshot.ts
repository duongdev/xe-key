import type { CarStatus } from "./car";

/**
 * Which car snapshot to show when a new read arrives. Honda's servers sometimes lag each other:
 * a read with an older car report never replaces a newer one, and a confirmed command's state
 * holds against reads whose report is no newer than the confirm.
 */
export function pickSnapshot(prev: CarStatus | undefined, next: CarStatus): CarStatus {
  if (!prev || next.account !== "ok" || prev.account !== "ok") return next;
  if (next.updatedAt < prev.updatedAt) return prev;
  if (prev.confirmedAt && next.updatedAt <= prev.confirmedAt) {
    return { ...next, doors: prev.doors, engine: prev.engine, confirmedAt: prev.confirmedAt };
  }
  return next;
}
