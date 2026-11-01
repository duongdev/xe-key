import { RUN_S } from "../car/engine";
import type { CarAlert, CarStatus } from "./car";

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
  return {
    model: str(raw.car.name).trim() || "Honda",
    plate: null,
    doors: is(raw.door.allDoors, "LOCK") ? "locked" : "unlocked",
    // ponytail: no end time from Honda (resTime unit unknown); assume a 10 min run from the last report.
    engine:
      raw.engine.engine === true
        ? { on: true, endsAt: resTime > 0 ? Date.now() + resTime * 1000 : updatedAt + RUN_S * 1000 }
        : { on: false },
    // Unverified: resStartCounter read 1 after recent starts; assumed starts used since the last drive.
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
      unread: a.read !== true,
      title: str(a.name).replace(/_/g, " ").replace(/\s+/g, " ").trim(),
      text,
      ok: kind === "command" ? !FAILED.test(text) : undefined,
    };
  });
}
