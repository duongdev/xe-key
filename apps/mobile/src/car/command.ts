/** Remote commands and their lifecycle. Vocabulary: CONTEXT.md › Commands. */
export type CommandKind = "lock" | "unlock" | "start" | "stop" | "extend" | "find";

export type Command =
  | { status: "idle" }
  | { status: "sent" | "accepted" | "confirmed" | "failed"; kind: CommandKind; attempt: number }
  | { status: "retrying"; kind: CommandKind; attempt: number };

export type CommandEvent =
  | { type: "send"; kind: CommandKind }
  | { type: "accepted" }
  | { type: "asleep" }
  | { type: "confirmed" }
  | { type: "failed" }
  | { type: "reset" };

export const MAX_RETRIES = 3;
export const IDLE: Command = { status: "idle" };

export const inFlight = (c: Command) =>
  c.status === "sent" || c.status === "accepted" || c.status === "retrying";

export function commandReducer(c: Command, e: CommandEvent): Command {
  if (e.type === "reset") return IDLE;
  if (e.type === "send") return inFlight(c) ? c : { status: "sent", kind: e.kind, attempt: 0 };
  if (!inFlight(c) || c.status === "idle") return c;
  switch (e.type) {
    case "accepted":
      return c.status === "sent" ? { ...c, status: "accepted" } : c;
    case "asleep":
      return c.attempt >= MAX_RETRIES
        ? { ...c, status: "failed" }
        : { ...c, status: "retrying", attempt: c.attempt + 1 };
    case "confirmed":
      return { ...c, status: "confirmed" };
    case "failed":
      return { ...c, status: "failed" };
  }
}
