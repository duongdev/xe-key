import type { HondaHttp } from "@xekey/core";
import {
  cookieHeader,
  isSuccess,
  parseEnvelope,
  pullRemote,
  type RemoteKind,
  sendRemote,
} from "@xekey/core";
import { randomUUID } from "expo-crypto";
import * as Location from "expo-location";
import { recentDays, toSummaryRows } from "../car/summary";
import { type CarLocation, type CarService, type CarStatus, NoPin } from "./car";
import { call } from "./honda";
import {
  type HondaRaw,
  lastDays,
  pinResult,
  toAlerts,
  toCarStatus,
  toService,
  toTripRoute,
  toTrips,
} from "./honda-car";
import { CommandError, done, logged, pullDelayMs, reasonText } from "./honda-command";
import { loadCookies } from "./secret";

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});

async function data(run: (h: HondaHttp) => ReturnType<HondaHttp["get"]>): Promise<Obj> {
  const res = await call(run);
  if (res.statusCode >= 400) throw new Error(`honda: http ${res.statusCode}`);
  const d = parseEnvelope(res.json as never).data as unknown;
  return d && typeof d === "object" ? (d as Obj) : {};
}

let carOid: string | null = null;
/** Honda PIN token: memory only, for this app session (like the Honda app). */
let pinToken: string | null = null;
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
  return { ...s, location: await withPlace(s.location ?? null) };
}

async function visitPrice(id: string): Promise<number | null> {
  const d = await data((h) => h.get(`/maintenance/detail?mtcoid=${encodeURIComponent(id)}`));
  const n = Number(d.totalPrice);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const POLL_MS = 5000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * One command, CONTEXT.md › Commands: Sent → Accepted (POST SUCCESS) → Confirmed or Failed.
 * Honda has no push to us, so we watch the door/engine status every 5 s and confirm as soon as it
 * shows the change; when Honda's wait is over we ask for the result once, as the official app does.
 */
async function remote(
  kind: RemoteKind,
  onEvent: Parameters<CarService["command"]>[1],
  opts: Parameters<CarService["command"]>[2],
): Promise<CarStatus | null> {
  await car();
  const oid = carOid ?? "";
  const uuid = randomUUID();
  const sentAt = Date.now();
  const accepted = parseEnvelope(
    (await call((h) => sendRemote(h, oid, kind, uuid, opts?.ac ?? "mid"))).json,
  );
  if (!isSuccess(accepted.status)) {
    console.warn("command refused", kind, accepted.error.code, accepted.error.message);
    throw new CommandError(reasonText(accepted.error.message));
  }
  onEvent({ type: "accepted" });
  const deadline = Date.now() + pullDelayMs(accepted.data, kind);
  // Horn and lights leave no trace in any status read: only Honda's result tells.
  const statusPath =
    kind === "lights" || kind === "horn"
      ? null
      : kind === "lock" || kind === "unlock"
        ? "/car/status/door"
        : "/car/status/engine";
  while (Date.now() < deadline) {
    await sleep(POLL_MS);
    if (opts?.cancel?.cancelled) return null;
    if (!statusPath) {
      const hit = logged(
        toAlerts(
          await data((h) => h.get(`/car/alertMessages?carOid=${encodeURIComponent(oid)}`)).catch(
            () => ({}),
          ),
        ),
        sentAt,
      );
      if (!hit) continue;
      if (hit.ok === false) {
        console.warn("command failed (log)", kind, hit.title, hit.text);
        throw new CommandError(reasonText(hit.text));
      }
      onEvent({ type: "confirmed" });
      return status();
    }
    const reply = await data((h) => h.get(`${statusPath}?carOid=${encodeURIComponent(oid)}`)).catch(
      () => ({}),
    );
    if (done(kind, reply)) {
      onEvent({ type: "confirmed" });
      return status();
    }
  }
  const pulled = parseEnvelope((await call((h) => pullRemote(h, oid, kind, uuid, sentAt))).json);
  if (!isSuccess(pulled.status)) {
    console.warn("command failed", kind, pulled.error.code, pulled.error.message);
    throw new CommandError(reasonText(pulled.error.message));
  }
  onEvent({ type: "confirmed" });
  return status();
}

async function summaryRows(type: "Day" | "Month" | "Year") {
  const res = await call((h) => h.get(`/car/trip/summary?summaryType=${type}`));
  const env = parseEnvelope(res.json as never);
  if (!isSuccess(env.status)) throw new Error(`honda: summary ${env.error.code}`);
  return toSummaryRows(env.data);
}

async function dayTrips(day: number) {
  const d = new Date(day);
  const q = `day=${d.getDate()}&month=${d.getMonth() + 1}&year=${d.getFullYear()}`;
  const res = await call((h) => h.get(`/car/trip?${q}`));
  const env = parseEnvelope(res.json as never);
  if (!isSuccess(env.status)) throw new Error(`honda: trips ${env.error.code}`);
  return toTrips(env.data).sort((a, b) => b.startedAt - a.startedAt);
}

export const liveCar: CarService = {
  status,
  async command(kind, onEvent, opts) {
    if (kind !== "find") return remote(kind, onEvent, opts);
    // Find is a plain read: the official app never asks the car for a fresh fix.
    onEvent({ type: "accepted" });
    const s = await status();
    onEvent({ type: "confirmed" });
    return s;
  },
  // No PIN needed for any of these (FINDINGS Rounds 8–9); places need it (t023).
  async trips() {
    // The latest days that had drives (from the summary), not just this week: ~20 trips.
    const driven = await summaryRows("Day")
      .then((rows) => recentDays(rows))
      .catch(() => null);
    const pick =
      driven ??
      lastDays(new Date()).map(({ day, month, year }) => new Date(year, month - 1, day).getTime());
    const days = await Promise.allSettled(pick.map(dayTrips));
    if (days.every((d) => d.status === "rejected")) throw new Error("honda: trips failed");
    const trips = days.flatMap((d) => (d.status === "fulfilled" ? d.value : []));
    return trips.sort((a, b) => b.startedAt - a.startedAt);
  },
  async summary() {
    const [day, month, year] = await Promise.all(
      (["Day", "Month", "Year"] as const).map(summaryRows),
    );
    return { day: day ?? [], month: month ?? [], year: year ?? [] };
  },
  dayTrips,
  async verifyPin(pin) {
    const res = await call((h) => h.postForm("/auth/pin/verify", { pin }));
    const result = pinResult(res.json);
    pinToken = result.ok ? result.token : null;
    return result;
  },
  async tripDetail(id) {
    if (!pinToken) throw new NoPin();
    const q = new URLSearchParams({ oid: id, pinToken });
    const res = await call((h) => h.get(`/car/trip/detail?${q}`));
    const env = parseEnvelope(res.json as never);
    if (!isSuccess(env.status)) {
      // A token Honda no longer takes is as good as none.
      pinToken = null;
      throw new NoPin(`honda: trip detail ${env.error.code}`);
    }
    const route = toTripRoute(env.data);
    const ends = [route[0], route[route.length - 1]];
    const [from, to] = await Promise.all(
      ends.map(async (p) => (p ? await place(p.lat, p.lng) : null)),
    );
    // "Thảo Điền, Thủ Đức": place name plus its district (HANDOFF › Trip detail).
    const label = (p: typeof from) =>
      [p?.name, p?.area?.split(", ")[0]].filter(Boolean).join(", ") || null;
    return { route, from: label(from), to: label(to) };
  },
  forgetPin() {
    pinToken = null;
  },
  async hondaCar() {
    const c = await car();
    const model = obj(c.carModel);
    const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    const image = text(c.carImage);
    const cookie = cookieHeader(await loadCookies());
    return {
      model: text(c.name) ?? "Honda",
      year: text(model.year),
      vin: text(c.VIN),
      plate: null,
      color: text(c.color),
      photo: image
        ? { uri: image, headers: cookie ? { Cookie: cookie } : ({} as Record<string, string>) }
        : null,
    };
  },
  async service() {
    await car();
    const q = `?carOid=${encodeURIComponent(carOid ?? "")}`;
    // `/maintenance` needs no uoid: Honda uses the signed-in user (FINDINGS Round 11).
    const [top, next, list] = await Promise.all([
      data((h) => h.get(`/car/topPage${q}`)),
      data((h) => h.get(`/car/nextMaintenance${q}`)),
      data((h) => h.get("/maintenance")),
    ]);
    const s = toService(top, next, list, {});
    const newest = await Promise.all(s.visits.slice(0, 3).map((v) => visitPrice(v.id)));
    return { ...s, visits: s.visits.map((v, i) => ({ ...v, priceVnd: newest[i] ?? null })) };
  },
  visitPrice,
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
  pinToken = null;
  carRow = {};
}
