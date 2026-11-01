import type { CarStatus } from "./car";
import { pickSnapshot } from "./snapshot";

const base = {
  doors: "locked",
  engine: { on: false },
  updatedAt: 1000,
  account: "ok",
} as unknown as CarStatus;
const at = (over: Partial<CarStatus>) => ({ ...base, ...over }) as CarStatus;

describe("pickSnapshot", () => {
  it("takes the first read", () => {
    expect(pickSnapshot(undefined, base)).toBe(base);
  });
  it("takes a newer car report", () => {
    const next = at({ doors: "unlocked", updatedAt: 2000 });
    expect(pickSnapshot(base, next)).toBe(next);
  });
  it("ignores a read carrying an older car report (a lagging server)", () => {
    const prev = at({ doors: "unlocked", updatedAt: 2000 });
    expect(pickSnapshot(prev, at({ doors: "locked", updatedAt: 1500 }))).toBe(prev);
  });
  it("holds a confirmed lock against reads no newer than the confirm", () => {
    const prev = at({ doors: "locked", updatedAt: 2000, confirmedAt: 3000 });
    const stale = at({ doors: "unlocked", updatedAt: 2500, fuelPct: 40 });
    const out = pickSnapshot(prev, stale);
    expect(out.doors).toBe("locked");
    expect(out.fuelPct).toBe(40);
    expect(out.confirmedAt).toBe(3000);
  });
  it("lets a car report after the confirm change the state (changed elsewhere)", () => {
    const prev = at({ doors: "locked", updatedAt: 2000, confirmedAt: 3000 });
    const next = at({ doors: "unlocked", updatedAt: 3500 });
    expect(pickSnapshot(prev, next).doors).toBe("unlocked");
  });
  it("always passes sign-out through", () => {
    const prev = at({ updatedAt: 5000 });
    const out = at({ account: "signed-out", updatedAt: 1 });
    expect(pickSnapshot(prev, out)).toBe(out);
  });
});
