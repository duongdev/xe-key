import type { CommandKind } from "../car/command";
import type { CarService, CarStatus } from "./car";

/** Dev-only knob to drive every Home state from the kitchen sink. */
export type Scenario = "normal" | "asleep" | "unreachable" | "signed-out" | "expired" | "slow";
let scenario: Scenario = "normal";
export const setScenario = (s: Scenario) => {
  scenario = s;
};
export const getScenario = () => scenario;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let car: CarStatus = {
  model: "HR-V e:HEV",
  plate: "51K-123.45",
  doors: "locked",
  engine: { on: false },
  cabinC: 34,
  fuelPct: 62,
  rangeKm: 418,
  location: { name: "Landmark 81", distanceKm: 1.2 },
  alerts: 2,
  updatedAt: Date.now() - 2 * 60_000,
  account: "ok",
};

const snapshot = (): CarStatus => ({
  ...car,
  account: scenario === "signed-out" ? "signed-out" : scenario === "expired" ? "expired" : "ok",
  signedOutAt: scenario === "signed-out" ? Date.now() - 40 * 60_000 : undefined,
});

const apply = (kind: CommandKind) => {
  if (kind === "lock") car = { ...car, doors: "locked" };
  if (kind === "unlock") car = { ...car, doors: "unlocked" };
  if (kind === "start") car = { ...car, engine: { on: true, endsAt: Date.now() + 10 * 60_000 } };
  if (kind === "stop") car = { ...car, engine: { on: false } };
  car = { ...car, updatedAt: Date.now() };
};

/** Timings follow Engine-states: sent < 1 s, accepted 1–8 s, retry every few seconds. */
export const mockCar: CarService = {
  async status() {
    await wait(scenario === "slow" ? 3000 : 400);
    return snapshot();
  },
  async wake() {
    await wait(2400);
    car = { ...car, updatedAt: Date.now() };
    return snapshot();
  },
  async command(kind, onEvent) {
    await wait(700);
    onEvent({ type: "accepted" });
    if (scenario === "asleep" || scenario === "unreachable") {
      for (let i = 0; i < 3; i++) {
        await wait(1800);
        onEvent({ type: "asleep" });
      }
      await wait(1800);
      if (scenario === "unreachable") {
        onEvent({ type: "asleep" });
        return null;
      }
    } else {
      await wait(1900);
    }
    apply(kind);
    onEvent({ type: "confirmed" });
    return snapshot();
  },
};
