import type { Body } from "../car/geometry";

/** Where Home draws its car, in window points, so the launch car can land on it exactly. */
export type LaunchTarget = {
  x: number;
  y: number;
  width: number;
  body: Body;
  paint: string;
  look: "shaded" | "line";
};

let target: LaunchTarget | null = null;
const listeners = new Set<(t: LaunchTarget) => void>();

export function setLaunchTarget(t: LaunchTarget) {
  target = t;
  for (const l of listeners) l(t);
}

/** Calls back once Home has reported its car (at once if it already has). */
export function onLaunchTarget(cb: (t: LaunchTarget) => void): () => void {
  if (target) cb(target);
  listeners.add(cb);
  return () => listeners.delete(cb);
}
