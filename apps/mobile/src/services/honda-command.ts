import type { RemoteAccepted, RemoteKind } from "@xekey/core";

const APP_DEFAULT_MS = 300_000;

/** When to ask for the result: Honda's `timeOutInterval` + 3 s, as the official app does. */
export function pullDelayMs(data: RemoteAccepted): number {
  const n = Number(data.timeOutInterval);
  return (Number.isFinite(n) && n > 0 ? n : APP_DEFAULT_MS) + 3000;
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
