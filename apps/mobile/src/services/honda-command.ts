import type { RemoteAccepted, RemoteKind } from "@xekey/core";
import type { CarAlert } from "./car";

const APP_DEFAULT_MS = 300_000;

/**
 * When to ask for the result: Honda's `timeOutInterval` + 3 s, as the official app does. Its horn
 * and lights screen lifts any wait under 10 s (or none) to 30 s.
 */
export function pullDelayMs(data: RemoteAccepted, kind?: RemoteKind): number {
  const n = Number(data.timeOutInterval);
  const ok = Number.isFinite(n) && n > 0;
  if (kind === "lights" || kind === "horn") return (ok && n >= 10_000 ? n : 30_000) + 3000;
  return (ok ? n : APP_DEFAULT_MS) + 3000;
}

/** True when a door or engine status reply already shows the command's effect. */
export function done(kind: RemoteKind, reply: Record<string, unknown>): boolean {
  const doors = String(reply.allDoors ?? "").toUpperCase();
  if (kind === "lock") return doors === "LOCK";
  if (kind === "unlock") return doors === "UNLOCK" || doors === "OPEN";
  if (kind === "start") return reply.engine === true;
  if (kind === "stop") return reply.engine === false;
  return false;
}

/**
 * Horn and lights change nothing a status read shows, but Honda logs each result as a command
 * message within ~20 s (its own reply wait is minutes). First command message since `sentAt`, or
 * null while there is none; a failed one carries Honda's reason in `text`.
 */
export function logged(alerts: CarAlert[], sentAt: number): CarAlert | null {
  return (
    alerts.filter((a) => a.kind === "command" && a.at >= sentAt).sort((a, b) => a.at - b.at)[0] ??
    null
  );
}

/** A command Honda refused or the car could not do; `reason` is Honda's own words when it gave any. */
export class CommandError extends Error {
  constructor(readonly reason: string | null) {
    super(reason ?? "command failed");
  }
}

/** Honda's message without its code prefix ("W101: Thao tác…" → "Thao tác…"); null when empty. */
export const reasonText = (s: string | null | undefined) =>
  s?.replace(/^[A-Z]+\d+(\(\d+\))?:\s*/, "").trim() || null;
