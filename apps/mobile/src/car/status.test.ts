import { bodyParts } from "./status";

const closed = {
  doorsLocked: true,
  doorsOpen: { fl: false, fr: false, rl: false, rr: false },
  windowsCm: { fl: 0, fr: 0, rl: 0, rr: 0 },
  trunkOpen: false,
  hoodOpen: false,
};

describe("bodyParts", () => {
  it("is all ok when everything is shut and locked", () => {
    const p = bodyParts(closed);
    expect(p.sides).toEqual({ fl: "ok", fr: "ok", rl: "ok", rr: "ok" });
    expect(p.rows.map((r) => [r.part, r.tone])).toEqual([
      ["doors", "ok"],
      ["windows", "ok"],
      ["trunk", "ok"],
      ["hood", "ok"],
    ]);
    expect(p.attention).toBe(false);
  });

  it("flags an open window on its side with its size", () => {
    const p = bodyParts({ ...closed, windowsCm: { ...closed.windowsCm, rl: 3 } });
    expect(p.sides.rl).toBe("warn");
    expect(p.sides.fl).toBe("ok");
    expect(p.rows[1]).toEqual({
      part: "windows",
      tone: "warn",
      value: { kind: "window", side: "rl", cm: 3 },
    });
    expect(p.attention).toBe(true);
  });

  it("an open door beats an open window on the same side", () => {
    const p = bodyParts({
      ...closed,
      doorsOpen: { ...closed.doorsOpen, fr: true },
      windowsCm: { ...closed.windowsCm, fr: 10 },
    });
    expect(p.sides.fr).toBe("open");
    expect(p.rows[0]).toEqual({
      part: "doors",
      tone: "warn",
      value: { kind: "open", sides: ["fr"] },
    });
  });

  it("unlocked doors are attention even when shut", () => {
    const p = bodyParts({ ...closed, doorsLocked: false });
    expect(p.rows[0]).toEqual({ part: "doors", tone: "warn", value: { kind: "unlocked" } });
  });

  it("counts several open windows", () => {
    const p = bodyParts({ ...closed, windowsCm: { fl: 2, fr: 0, rl: 5, rr: 0 } });
    expect(p.rows[1]?.value).toEqual({ kind: "windows", count: 2 });
  });

  it("flags trunk and hood", () => {
    const p = bodyParts({ ...closed, trunkOpen: true, hoodOpen: true });
    expect(p.rows[2]?.tone).toBe("warn");
    expect(p.rows[3]?.tone).toBe("warn");
  });
});
