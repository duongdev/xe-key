import type { CommandKind } from "../car/command";
import { RUN_S } from "../car/engine";
import type { CarAlert, CarService, CarStatus, Trip } from "./car";

/** Dev-only knob to drive every Home state from the kitchen sink. */
export type Scenario =
  | "normal"
  | "asleep"
  | "unreachable"
  | "signed-out"
  | "expired"
  | "slow"
  | "empty"
  | "error";
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
  body: {
    doorsOpen: { fl: false, fr: false, rl: false, rr: false },
    windowsCm: { fl: 0, fr: 0, rl: 3, rr: 0 },
    trunkOpen: false,
    hoodOpen: false,
  },
  cabinC: 34,
  fuelPct: 62,
  rangeKm: 418,
  location: {
    name: "Landmark 81",
    area: "Bình Thạnh",
    lat: 10.7951,
    lng: 106.7218,
    distanceKm: 1.2,
    accuracyM: 20,
    at: Date.now() - 14 * 60_000,
  },
  batteryV: 12.4,
  odometerKm: 24_816,
  serviceInKm: 1_200,
  alerts: 2,
  updatedAt: Date.now() - 2 * 60_000,
  account: "ok",
  can: { lock: true, engine: true },
};

/** `days` back at h:m; for today, never later than 30 min ago. */
const ago = (days: number, h: number, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(h, m, 0, 0);
  // Keeps the order of same-day times when "today" has barely started.
  return Math.min(d.getTime(), Date.now() - 30 * 60_000 - (24 * 60 - (h * 60 + m)) * 1000);
};

const TRIPS: Trip[] = [
  { id: "t1", startedAt: ago(0, 7, 42), km: 8.2, minutes: 24, from: "Thảo Điền", to: "Quận 1" },
  { id: "t2", startedAt: ago(1, 18, 10), km: 8.6, minutes: 31, from: "Quận 1", to: "Thảo Điền" },
  { id: "t3", startedAt: ago(1, 9, 5), km: 3.1, minutes: 12, from: "Thảo Điền", to: "Landmark 81" },
  { id: "t4", startedAt: ago(3, 8, 0), km: 19.4, minutes: 38, from: "Thủ Đức", to: "Phú Mỹ Hưng" },
  {
    id: "t5",
    startedAt: ago(3, 17, 30),
    km: 11.6,
    minutes: 29,
    from: "Phú Mỹ Hưng",
    to: "Thủ Đức",
  },
  { id: "t6", startedAt: ago(5, 10, 0), km: 26, minutes: 47, from: "Thủ Đức", to: "Cần Giờ" },
];

let alerts: CarAlert[] = [
  { id: "a1", kind: "unlocked", n: 15, at: ago(0, 7, 50), unread: true },
  { id: "a2", kind: "auto-off", at: ago(0, 7, 31), unread: true },
  { id: "a3", kind: "locked", at: ago(0, 7, 12), unread: false },
  { id: "a4", kind: "zone", at: ago(1, 18, 0), unread: false },
  { id: "a5", kind: "service", n: 1200, at: ago(2, 9, 0), unread: false },
  { id: "a6", kind: "renew", n: 30, at: ago(3, 9, 0), unread: false },
];

const snapshot = (): CarStatus => ({
  ...car,
  location: scenario === "empty" ? null : car.location,
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
      startsLeft: (car.startsLeft ?? 0) - 1,
      engine: { on: true, endsAt: Date.now() + RUN_S * 1000 },
    };
  if (kind === "extend" && car.engine.on)
    car = {
      ...car,
      startsLeft: (car.startsLeft ?? 0) - 1,
      engine: { on: true, endsAt: car.engine.endsAt + RUN_S * 1000 },
    };
  if (kind === "stop") car = { ...car, engine: { on: false } };
  if (kind === "find" && car.location)
    car = { ...car, location: { ...car.location, at: Date.now() } };
  car = { ...car, updatedAt: Date.now() };
};

/** Timings follow Engine-states: sent < 1 s, accepted 1–8 s, retry every few seconds. */
export const mockCar: CarService = {
  async trips() {
    await wait(500);
    if (scenario === "error") throw new Error("mock: trips failed");
    if (scenario === "empty") return { trips: [], driving: null };
    return {
      trips: TRIPS,
      driving: { score: 86, scoreDelta: 4, accel: 0.84, hardBrakes: 2, speed: 0.92 },
    };
  },
  async alerts() {
    await wait(400);
    if (scenario === "error") throw new Error("mock: alerts failed");
    return scenario === "empty" ? [] : alerts;
  },
  async deleteAlert(id) {
    await wait(300);
    alerts = alerts.filter((a) => a.id !== id);
    car = { ...car, alerts: alerts.filter((a) => a.unread).length };
  },
  async status() {
    await wait(scenario === "slow" ? 3000 : 400);
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
