import {
  baseUrl,
  HondaHttp,
  type HttpResponse,
  isSuccess,
  login,
  logout,
  parseEnvelope,
  type Region,
  registerDevice,
  resendCode,
  sessionExpired,
  verifyCode,
} from "@xekey/core";
import { randomUUID } from "expo-crypto";
import { Platform } from "react-native";
import type { AuthService, FoundCar } from "./auth";
import { bodyFor, codeError, hondaUsername, paintFor, signInError } from "./honda-map";
import { keychainCookies, loadCookies, secret, password as storedPassword } from "./secret";

// iOS fetch keeps its own shared cookie jar; omit it so only our Keychain jar holds the session (ADR 0008).
const omitFetch = (url: string, init: RequestInit) => fetch(url, { ...init, credentials: "omit" });

const client = (region: Region, cookies: Record<string, string> = {}) =>
  new HondaHttp({ base: baseUrl(region), fetch: omitFetch, cookies: keychainCookies(cookies) });

// A personal build can pin a deviceId that Honda already trusts (no device-change SMS):
// EXPO_PUBLIC_DEVICE_ID in apps/mobile/.env.local, never committed.
const PINNED_DEVICE_ID = process.env.EXPO_PUBLIC_DEVICE_ID;

async function ensure(key: "deviceId" | "deviceToken"): Promise<string> {
  if (key === "deviceId" && PINNED_DEVICE_ID) {
    if ((await secret.get(key)) !== PINNED_DEVICE_ID) await secret.set(key, PINNED_DEVICE_ID);
    return PINNED_DEVICE_ID;
  }
  const have = await secret.get(key);
  if (have) return have;
  const id = randomUUID();
  await secret.set(key, id);
  return id;
}

let http: HondaHttp | null = null;
/** Credentials held between login and verifyCode; saved to the Keychain only once sign-in succeeds. */
let pending: { region: Region; phone: string; password: string } | null = null;

async function saveCredentials(p: NonNullable<typeof pending>) {
  await secret.set("region", p.region);
  await secret.set("phone", p.phone);
  await storedPassword.set(p.password);
}

async function signInWith(h: HondaHttp, phone: string, password: string) {
  const deviceId = await ensure("deviceId");
  return login(h, phone, password, deviceId);
}

/** The signed-in client, restored from the Keychain after a restart; null when signed out. */
async function current(): Promise<HondaHttp | null> {
  if (http) return http;
  const region = (await secret.get("region")) as Region | null;
  if (!region) return null;
  http = client(region, await loadCookies());
  return http;
}

/** Signs in again with the stored password (ADR 0005). False when that fails too. */
async function relogin(): Promise<boolean> {
  // Face ID cancelled or failed (password guarded by the setting) counts as a failed re-login.
  const [region, phone, password] = await Promise.all([
    secret.get("region"),
    secret.get("phone"),
    storedPassword.get().catch(() => null),
  ]);
  if (!region || !phone || !password) return false;
  http = client(region as Region);
  const res = await signInWith(http, phone, password);
  return isSuccess(res.status);
}

export class SignedOut extends Error {}

/** Runs a call; on a lost session signs in again once and retries. Throws `SignedOut` if that fails. */
export async function call<T>(run: (h: HondaHttp) => Promise<HttpResponse<T>>) {
  const h = await current();
  if (!h) throw new SignedOut();
  const res = await run(h);
  if (!sessionExpired(res.statusCode, res.json)) return res;
  if (!(await relogin()) || !http) throw new SignedOut();
  return run(http);
}

async function foundCar(h: HondaHttp): Promise<FoundCar> {
  type Car = Record<string, unknown>;
  const cars = parseEnvelope<Car[]>((await h.get<Car[]>("/car")).json).data;
  const list = Array.isArray(cars) ? cars : [];
  const car = list.find((c) => c.default === true) ?? list[0] ?? {};
  type Top = { vehicleInfo?: { lastTimeCall?: number } };
  const oid = encodeURIComponent(String(car.oid ?? ""));
  const top = parseEnvelope<Top>((await h.get<Top>(`/car/topPage?carOid=${oid}`)).json).data;
  const paint = paintFor(typeof car.color === "string" ? car.color : undefined);
  const name = typeof car.name === "string" ? car.name : undefined;
  return {
    model: name ?? "Honda",
    body: bodyFor(name),
    paintName: paint.name,
    paint: paint.hex,
    plate: null,
    connectActive: car.isExpired !== true,
    updatedAt: top.vehicleInfo?.lastTimeCall ?? Date.now(),
  };
}

export const liveAuth: AuthService = {
  async signIn({ region, phone, password }) {
    http = client(region);
    try {
      const reg = await registerDevice(http, {
        uid: await ensure("deviceId"),
        deviceToken: await ensure("deviceToken"),
        appID: "ao.co.honda.hconnect",
        appVersion: "1.2.7",
        osPlatform: "iOS",
        osVersion: String(Platform.Version),
        model: "iPhone",
        manufacturer: "Apple",
        locale: "vi",
        timeZone: "VN",
      });
      if (!isSuccess(reg.status))
        return { ok: false, error: signInError(reg.statusCode, reg.error.code) };
      pending = { region, phone: hondaUsername(region, phone), password };
      const res = await signInWith(http, pending.phone, password);
      if (isSuccess(res.status)) {
        await saveCredentials(pending);
        return { ok: true, car: await foundCar(http) };
      }
      if (res.error.code === "NEED_VERIFICATION_CODE") return { ok: true };
      pending = null;
      return {
        ok: false,
        error: signInError(res.statusCode, res.error.code),
        code: res.error.code,
      };
    } catch {
      return { ok: false, error: "server-down" };
    }
  },
  async sendCode() {
    if (http) await resendCode(http);
  },
  async verifyCode(code) {
    if (!http || !pending) return { ok: false, error: "unknown" };
    try {
      const v = await verifyCode(http, code);
      if (!isSuccess(v.status)) return { ok: false, error: codeError(v.statusCode, v.error.code) };
      // verifyCode only trusts the device; the session comes from a second login.
      const res = await signInWith(http, pending.phone, pending.password);
      if (!isSuccess(res.status))
        return { ok: false, error: codeError(res.statusCode, res.error.code) };
      await saveCredentials(pending);
      pending = null;
      return { ok: true, car: await foundCar(http) };
    } catch {
      return { ok: false, error: "server-down" };
    }
  },
  async signOut() {
    const h = await current();
    const deviceId = await secret.get("deviceId");
    if (h && deviceId) await logout(h, deviceId).catch(() => {});
    http = null;
    pending = null;
    // deviceId and deviceToken stay so the next sign-in needs no SMS code (ADR 0004).
    await Promise.all([
      ...(["region", "phone", "cookies"] as const).map((k) => secret.del(k)),
      storedPassword.del(),
    ]);
  },
};
