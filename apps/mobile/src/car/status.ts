export type Side = "fl" | "fr" | "rl" | "rr";
const SIDES: Side[] = ["fl", "fr", "rl", "rr"];

export type Body = {
  doorsLocked: boolean;
  doorsOpen: Record<Side, boolean>;
  /** How far each window is open, in cm (0 = shut). */
  windowsCm: Record<Side, number>;
  trunkOpen: boolean;
  hoodOpen: boolean;
};

export type Tone = "ok" | "warn";
export type RowValue =
  | { kind: "locked" }
  | { kind: "unlocked" }
  | { kind: "open"; sides?: Side[] }
  | { kind: "closed" }
  | { kind: "window"; side: Side; cm: number }
  | { kind: "windows"; count: number };
export type Row = { part: "doors" | "windows" | "trunk" | "hood"; tone: Tone; value: RowValue };

/** Top-down diagram: each side is ok, has an open window (warn), or an open door (open). */
export function bodyParts(b: Body) {
  const sides = Object.fromEntries(
    SIDES.map((s) => [s, b.doorsOpen[s] ? "open" : b.windowsCm[s] > 0 ? "warn" : "ok"]),
  ) as Record<Side, "ok" | "warn" | "open">;

  const openDoors = SIDES.filter((s) => b.doorsOpen[s]);
  const openWindows = SIDES.filter((s) => b.windowsCm[s] > 0);

  const doors: Row =
    openDoors.length > 0
      ? { part: "doors", tone: "warn", value: { kind: "open", sides: openDoors } }
      : {
          part: "doors",
          tone: b.doorsLocked ? "ok" : "warn",
          value: { kind: b.doorsLocked ? "locked" : "unlocked" },
        };
  const first = openWindows[0];
  const windows: Row = !first
    ? { part: "windows", tone: "ok", value: { kind: "closed" } }
    : openWindows.length === 1
      ? {
          part: "windows",
          tone: "warn",
          value: { kind: "window", side: first, cm: b.windowsCm[first] },
        }
      : { part: "windows", tone: "warn", value: { kind: "windows", count: openWindows.length } };
  const shut = (part: "trunk" | "hood", open: boolean): Row => ({
    part,
    tone: open ? "warn" : "ok",
    value: { kind: open ? "open" : "closed" },
  });

  const rows = [doors, windows, shut("trunk", b.trunkOpen), shut("hood", b.hoodOpen)];
  return { sides, rows, attention: rows.some((r) => r.tone === "warn") };
}
