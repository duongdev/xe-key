import { RUN_S } from "../car/engine";
import type { CarAlert, CarStatus, Trip } from "./car";

// Honda replies are loosely typed (FINDINGS Round 7); everything is read null-safe.
type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number.parseFloat(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};
const str = (v: unknown) => (typeof v === "string" ? v : "");
const is = (v: unknown, word: string) => str(v).toUpperCase() === word;

export type HondaRaw = { car: Obj; top: Obj; door: Obj; engine: Obj; finder: Obj };

export function toCarStatus(raw: HondaRaw): CarStatus {
  const info = obj(raw.top.vehicleInfo);
  const remote = obj(raw.engine.remoteEngine);
  const updatedAt = num(info.lastTimeCall) ?? Date.now();
  const resTime = num(remote.resTime) ?? 0;
  const used = num(remote.resStartCounter);
  const lat = num(raw.finder.latitude);
  const lng = num(raw.finder.longitude);
  const doorOpen = is(raw.door.allDoors, "OPEN");
  // Bits per the official app; it defaults to 8191 (everything) when the code is missing.
  const pkg = num(raw.car.packageServiceCode) ?? 8191;
  return {
    model: str(raw.car.name).trim() || "Honda",
    plate: null,
    doors: is(raw.door.allDoors, "LOCK") ? "locked" : "unlocked",
    // resTime = whole minutes left, rounded up, as of the car's last report (lastTimeCall). Logged
    // 2026-11-02: every report pointed to the same off time within its minute, so the middle of
    // that minute is within ±30 s. Without resTime, assume a full run from the last report.
    engine:
      raw.engine.engine === true
        ? {
            on: true,
            endsAt: resTime > 0 ? updatedAt + resTime * 60_000 - 30_000 : updatedAt + RUN_S * 1000,
          }
        : { on: false },
    // Remote starts used since the car was last driven (went 1 → 2 on a start, 2026-11-02).
    startsLeft: used === null ? null : Math.max(0, 2 - used),
    body: {
      doorsOpen: null,
      anyDoorOpen: doorOpen,
      windowsCm: null,
      trunkOpen: is(raw.door.tailgate, "OPEN"),
      hoodOpen: is(raw.door.hood, "OPEN"),
    },
    // Honda sends 0 when the car has no reading (seen on a parked car in VN); treat as unknown.
    cabinC: num(obj(info.cabinTemperature).value) || null,
    fuelPct: num(obj(info.fuel).value) ?? 0,
    rangeKm: num(obj(info.driveRange).value) ?? 0,
    location:
      lat === null || lng === null
        ? null
        : {
            name: null,
            area: null,
            lat,
            lng,
            distanceKm: null,
            accuracyM: null,
            at: num(raw.finder.time) ?? updatedAt,
          },
    batteryV: num(info.batteryVoltage),
    odometerKm: null,
    serviceInKm: null,
    alerts: num(raw.top.unreadAlertMessages) ?? 0,
    updatedAt,
    account: raw.car.isExpired === true ? "expired" : "ok",
    can: { lock: (pkg & 32) > 0, engine: (pkg & 16) > 0 },
  };
}

/** Failed command results start with a Honda code like `W001(0):` or `RTS02(29):`. */
const FAILED = /^[A-Z]+\d+(\(\d+\))?:/;

export function toAlerts(raw: Obj): CarAlert[] {
  const list = Array.isArray(raw.messages) ? raw.messages : [];
  return list.map((m): CarAlert => {
    const a = obj(m);
    const kind = is(a.category, "COMMAND") ? "command" : "diagnosis";
    const text = str(a.description);
    return {
      id: `${str(a.warningType)}:${str(a.oid)}`,
      kind,
      at: num(a.createDate) ?? 0,
      // Honda leaves command results unread forever; its badge counts only warning lights.
      unread: kind === "diagnosis" && a.read !== true,
      title: str(a.name).replace(/_/g, " ").replace(/\s+/g, " ").trim(),
      text,
      ok: kind === "command" ? !FAILED.test(text) : undefined,
    };
  });
}

/** `/car/trip` day replies → trips. Honda labels `mileage` "Km/h" but it is km (whole numbers). */
export function toTrips(rows: unknown): Trip[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((r): Trip[] => {
    const o = obj(r);
    const startedAt = num(o.tripStartTime);
    if (startedAt === null) return [];
    const seconds = num(o.duration);
    return [
      {
        id: str(o.oid) || String(startedAt),
        startedAt,
        endedAt: num(o.tripEndTime),
        km: num(obj(o.mileage).value) ?? 0,
        minutes: seconds === null ? 0 : Math.round(seconds / 60),
        avgKmh: num(obj(o.avgSpeed).value),
        kmPerL: num(obj(o.fuelConsumption).value),
        from: null,
        to: null,
      },
    ];
  });
}

/** The 7 calendar days `/car/trip` is asked for, today first. */
export function lastDays(today: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
  });
}
