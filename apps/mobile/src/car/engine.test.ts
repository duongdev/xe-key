import { engineState, extendAction, RUN_S } from "./engine";

const now = 1_000_000_000;

describe("engineState", () => {
  it("is off when the engine is off", () => {
    expect(engineState({ on: false }, now)).toEqual({ running: false });
  });

  it("counts down whole seconds and drains the ring", () => {
    const s = engineState({ on: true, endsAt: now + 522_400 }, now);
    expect(s).toEqual({ running: true, left: 522, fraction: 522 / RUN_S });
  });

  it("auto-offs when the time is up, even before the car reports it", () => {
    expect(engineState({ on: true, endsAt: now - 1 }, now)).toEqual({ running: false });
    expect(engineState({ on: true, endsAt: now }, now)).toEqual({ running: false });
  });

  it("keeps the ring full after an extend pushes past 10 min", () => {
    const s = engineState({ on: true, endsAt: now + 900_000 }, now);
    expect(s.running && s.fraction).toBe(1);
  });
});

describe("extendAction", () => {
  it("extends while a remote start is left", () => {
    expect(extendAction(1, false)).toBe("extend");
  });

  it("offers a reminder instead of a dead button when none are left", () => {
    expect(extendAction(0, false)).toBe("remind");
    expect(extendAction(0, true)).toBe("reminded");
  });
});
