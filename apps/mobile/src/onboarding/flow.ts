export type Step =
  | "welcome"
  | "region"
  | "sign-in"
  | "device"
  | "code"
  | "found"
  | "style"
  | "setup";

const ORDER: Step[] = ["welcome", "region", "sign-in", "device", "code", "found", "style", "setup"];

/** Steps you cannot go back from: the account is already bound to this phone. */
const NO_BACK = new Set<Step>(["welcome", "found", "setup"]);

const PROGRESS: Partial<Record<Step, number>> = {
  region: 1,
  "sign-in": 2,
  device: 2,
  code: 3,
  found: 4,
};

export function next(step: Step): Step | "done" {
  return ORDER[ORDER.indexOf(step) + 1] ?? "done";
}

export function back(step: Step): Step | null {
  return NO_BACK.has(step) ? null : (ORDER[ORDER.indexOf(step) - 1] ?? null);
}

/** Filled segments (of 4) in the step header. */
export function progress(step: Step): number {
  return PROGRESS[step] ?? 0;
}
