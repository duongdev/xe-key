import type { CommandKind } from "../car/command";
import { RUN_S } from "../car/engine";
import { periodStats, type SummaryRow } from "../car/summary";
import {
  type CarAlert,
  type CarService,
  type CarStatus,
  NoPin,
  type Summary,
  type Trip,
} from "./car";

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

const asLive = (t: Trip): Trip => ({
  ...t,
  from: null,
  to: null,
  endedAt: t.startedAt + t.minutes * 60_000,
  avgKmh: Math.round(t.km / (t.minutes / 60)),
  maxKmh: Math.round(t.km / (t.minutes / 60)) + 25,
  kmPerL: 9.5,
  daySeconds: t.minutes * 45,
  nightSeconds: t.minutes * 15,
});

/** ~6 months of Day rows like Honda's, with month and year rows summed from them. */
let summaryCache: Summary | null = null;
let mockPin = false;
function summaryRows(): Summary {
  if (summaryCache) return summaryCache;
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const today = new Date();
  const day: SummaryRow[] = [];
  for (let i = 0; i < 180; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
    const known = TRIPS.filter((t) => t.startedAt >= d.getTime() && t.startedAt < next);
    const drove = known.length > 0 || (i > 6 && rnd() < 0.55);
    if (!drove) continue;
    const trips = known.length || 1 + Math.floor(rnd() * 3);
    const km = known.length ? known.reduce((n, t) => n + t.km, 0) : Math.round(6 + rnd() * 50);
    const seconds = known.length
      ? known.reduce((n, t) => n + t.minutes * 60, 0)
      : Math.round((km / (18 + rnd() * 20)) * 3600);
    const night = Math.round(seconds * (rnd() < 0.3 ? rnd() * 0.5 : 0));
    day.push({
      date: d.getTime(),
      trips,
      km,
      seconds,
      daySeconds: seconds - night,
      nightSeconds: night,
      avgKmh: Math.round((km / (seconds / 3600)) * 10) / 10,
      maxKmh: Math.round(40 + rnd() * 70),
      kmPerL: Math.round((8 + rnd() * 5) * 10) / 10,
      accelPct: 0,
      brakePct: 0,
    });
  }
  const group = (key: (d: Date) => number) => {
    const by = new Map<number, SummaryRow[]>();
    for (const r of day) {
      const k = key(new Date(r.date));
      by.set(k, [...(by.get(k) ?? []), r]);
    }
    return [...by.entries()].map(([date, rows]): SummaryRow => {
      const s = periodStats(rows);
      return {
        date,
        trips: s.trips,
        km: s.km,
        seconds: s.seconds,
        daySeconds: rows.reduce((n, r) => n + r.daySeconds, 0),
        nightSeconds: rows.reduce((n, r) => n + r.nightSeconds, 0),
        avgKmh: s.avgKmh,
        maxKmh: s.maxKmh,
        kmPerL: s.kmPerL,
        accelPct: s.accelPct,
        brakePct: s.brakePct,
      };
    });
  };
  summaryCache = {
    day,
    month: group((d) => new Date(d.getFullYear(), d.getMonth(), 1).getTime()),
    year: group((d) => new Date(d.getFullYear(), 0, 1).getTime()),
  };
  return summaryCache;
}

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
    // Like live: places come only from trip detail (PIN); the mock PIN is 1234.
    return scenario === "empty" ? [] : TRIPS.map(asLive);
  },
  async summary() {
    await wait(400);
    if (scenario === "error") throw new Error("mock: summary failed");
    return scenario === "empty" ? { day: [], month: [], year: [] } : summaryRows();
  },
  async dayTrips(day) {
    await wait(300);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const known = TRIPS.filter((t) => t.startedAt >= day && t.startedAt < next.getTime());
    if (known.length) return known.map(asLive);
    const row = summaryRows().day.find((r) => r.date === day);
    if (!row) return [];
    // Older mock days have no saved places, like live trips before the PIN.
    return Array.from({ length: row.trips }, (_, i): Trip => {
      const startedAt = day + (8 + i * 9) * 3_600_000;
      const minutes = Math.round(row.seconds / 60 / row.trips);
      return {
        id: `m${day}-${i}`,
        startedAt,
        endedAt: startedAt + minutes * 60_000,
        km: Math.round((row.km / row.trips) * 10) / 10,
        minutes,
        from: null,
        to: null,
        avgKmh: row.avgKmh,
        maxKmh: row.maxKmh,
        kmPerL: row.kmPerL,
      };
    }).reverse();
  },
  // Mock PINs: 1234 works, 0000 is locked by Honda, anything else is wrong.
  async verifyPin(pin) {
    await wait(700);
    if (pin === "1234") {
      mockPin = true;
      return { ok: true, token: "mock" };
    }
    return { ok: false, error: pin === "0000" ? "locked" : "wrong" };
  },
  async tripDetail(id) {
    await wait(500);
    if (!mockPin) throw new NoPin();
    const seed = [...id].reduce((n, ch) => n + ch.charCodeAt(0), 0);
    const route = Array.from({ length: 24 }, (_, i) => ({
      lat: 10.79 + i * 0.0012 + Math.sin(i / 3 + seed) * 0.0008,
      lng: 106.7 + i * 0.0015 + Math.cos(i / 4 + seed) * 0.0008,
    }));
    const known = TRIPS.find((t) => t.id === id);
    const names = ["Thảo Điền", "Nguyễn Huệ", "Landmark 81", "Phú Mỹ Hưng", "Bến Thành"];
    return {
      route,
      from: known?.from ?? names[seed % names.length] ?? null,
      to: known?.to ?? names[(seed + 2) % names.length] ?? null,
    };
  },
  forgetPin() {
    mockPin = false;
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
