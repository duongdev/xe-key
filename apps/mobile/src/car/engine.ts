/** One remote start runs the engine for 10 minutes (TCU limit). */
export const RUN_S = 600;
/** Remote starts allowed before the car must be driven (TCU limit, no client bypass). */
export const MAX_STARTS = 2;

export type Engine = { on: false } | { on: true; endsAt: number };
export type EngineState = { running: false } | { running: true; left: number; fraction: number };

export function engineState(engine: Engine, now: number): EngineState {
  if (!engine.on) return { running: false };
  // Our end time is an estimate (±30 s); only the car's report turns the engine off.
  const left = Math.max(0, Math.floor((engine.endsAt - now) / 1000));
  return { running: true, left, fraction: Math.min(1, left / RUN_S) };
}

export const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Extend costs a start; with none left it becomes a 1-minute-before reminder. */
export function extendAction(
  startsLeft: number,
  reminderSet: boolean,
): "extend" | "remind" | "reminded" {
  if (startsLeft > 0) return "extend";
  return reminderSet ? "reminded" : "remind";
}
