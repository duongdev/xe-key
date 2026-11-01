import type { HondaHttp } from "@xekey/core";
import { isSuccess, parseEnvelope } from "@xekey/core";
import * as Location from "expo-location";
import type { CarLocation, CarService, CarStatus } from "./car";
import { call } from "./honda";
import { type HondaRaw, toAlerts, toCarStatus } from "./honda-car";

type Obj = Record<string, unknown>;

async function data(run: (h: HondaHttp) => ReturnType<HondaHttp["get"]>): Promise<Obj> {
  const res = await call(run);
  if (res.statusCode >= 400) throw new Error(`honda: http ${res.statusCode}`);
  const d = parseEnvelope(res.json as never).data as unknown;
  return d && typeof d === "object" ? (d as Obj) : {};
}

let carOid: string | null = null;
let carRow: Obj = {};

async function car(): Promise<Obj> {
  if (carOid) return carRow;
  const res = await call((h) => h.get("/car"));
  const list = parseEnvelope(res.json as never).data as unknown;
  const cars = Array.isArray(list) ? (list as Obj[]) : [];
  carRow = cars.find((c) => c.default === true) ?? cars[0] ?? {};
  carOid =
    typeof carRow.oid === "string" || typeof carRow.oid === "number" ? String(carRow.oid) : "";
  return carRow;
}

// Apple's on-device geocoder: free, no third party sees the car's position. Cached per ~100 m.
const places = new Map<string, { name: string | null; area: string | null }>();
async function place(lat: number, lng: number) {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const hit = places.get(key);
  if (hit) return hit;
  try {
    const [a] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const name = a?.name ?? a?.street ?? null;
    const area = [a?.district, a?.city ?? a?.subregion].filter(Boolean).join(", ") || null;
    const p = { name, area };
    places.set(key, p);
    return p;
  } catch {
    return { name: null, area: null };
  }
}

async function withPlace(loc: CarLocation | null): Promise<CarLocation | null> {
  return loc ? { ...loc, ...(await place(loc.lat, loc.lng)) } : null;
}

async function status(): Promise<CarStatus> {
  const c = await car();
  const q = `?carOid=${encodeURIComponent(carOid ?? "")}`;
  const [top, door, engine, finder] = await Promise.all([
    data((h) => h.get(`/car/topPage${q}`)),
    data((h) => h.get(`/car/status/door${q}`)),
    data((h) => h.get(`/car/status/engine${q}`)),
    data((h) => h.get(`/car/finder/location${q}`)),
  ]);
  const raw: HondaRaw = { car: c, top, door, engine, finder };
  const s = toCarStatus(raw);
  return { ...s, location: await withPlace(s.location) };
}

export class NotYet extends Error {
  name = "NotYet";
}

export const liveCar: CarService = {
  status,
  async command(kind, onEvent) {
    // Task 015 wires real commands; until then only "find" (a plain read) runs.
    if (kind !== "find") throw new NotYet();
    onEvent({ type: "accepted" });
    const s = await status();
    onEvent({ type: "confirmed" });
    return s;
  },
  async trips() {
    return { trips: [], driving: null, soon: true };
  },
  async alerts() {
    await car();
    return toAlerts(
      await data((h) => h.get(`/car/alertMessages?carOid=${encodeURIComponent(carOid ?? "")}`)),
    );
  },
  async deleteAlert(id) {
    const [warningType = "", oid = ""] = id.split(":");
    const p = new URLSearchParams({ oid, warningType });
    const res = await call((h) => h.delete(`/car/alertMessages?${p}`));
    if (!isSuccess(parseEnvelope(res.json as never).status))
      throw new Error("honda: delete failed");
  },
};

/** Forget the cached car (sign out, account switch). */
export function resetLiveCar() {
  carOid = null;
  carRow = {};
}
