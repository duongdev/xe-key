import type { CommandKind } from "../car/command";
import { RUN_S } from "../car/engine";
import type { CarService, CarStatus } from "./car";

/** Dev-only knob to drive every Home state from the kitchen sink. */
export type Scenario = "normal" | "asleep" | "unreachable" | "signed-out" | "expired" | "slow";
let scenario: Scenario = "normal";
export const setScenario = (s: Scenario) => {
  scenario = s;
};
export const getScenario = () => scenario;
/** Dev: pretend the car was driven, which re-arms the remote starts. */
export const resetStarts = () => {
  car = { ...car, startsLeft: 2 };
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Gap between wake attempts while the car is asleep. */
const RETRY_MS = 4000;

let car: CarStatus = {
  model: "HR-V e:HEV",
  plate: "51K-123.45",
  doors: "locked",
  engine: { on: false },
  startsLeft: 2,
  closed: { doors: true, trunk: true, hood: true },
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
  engine: car.engine.on && car.engine.endsAt <= Date.now() ? { on: false } : car.engine,
  account: scenario === "signed-out" ? "signed-out" : scenario === "expired" ? "expired" : "ok",
  signedOutAt: scenario === "signed-out" ? Date.now() - 40 * 60_000 : undefined,
});

const apply = (kind: CommandKind) => {
  if (kind === "lock") car = { ...car, doors: "locked" };
  if (kind === "unlock") car = { ...car, doors: "unlocked" };
  if (kind === "start")
    car = {
      ...car,
      startsLeft: car.startsLeft - 1,
      engine: { on: true, endsAt: Date.now() + RUN_S * 1000 },
    };
  if (kind === "extend" && car.engine.on)
    car = {
      ...car,
      startsLeft: car.startsLeft - 1,
      engine: { on: true, endsAt: car.engine.endsAt + RUN_S * 1000 },
    };
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
  async command(kind, onEvent, opts) {
    const wait = async (ms: number) => {
      await new Promise((r) => setTimeout(r, ms));
      if (opts?.cancel?.cancelled)
        throw Object.assign(new Error("cancelled"), { name: "AbortError" });
    };
    await wait(700);
    onEvent({ type: "accepted" });
    if (scenario === "asleep" || scenario === "unreachable") {
      for (let i = 0; i < 3; i++) {
        await wait(RETRY_MS);
        onEvent({ type: "asleep" });
      }
      await wait(RETRY_MS);
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
