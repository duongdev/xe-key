import { AC_TEMP, COMMANDS, ENDPOINTS } from "./endpoints.js";
import type { HondaHttp, HttpResponse } from "./http.js";

/** Commands that act on the car. Each needs a fresh `clientUUID` (the official app uses UUID v4). */
export type RemoteKind = "lock" | "unlock" | "start" | "stop" | "extend" | "lights" | "horn";
export type AcLevel = keyof typeof AC_TEMP;

/** `results.data` of a command POST (FINDINGS Round 7 / app models). */
export interface RemoteAccepted {
  "X-Request-Id"?: string;
  message?: string;
  /** How long to wait before asking for the result, in ms. */
  timeOutInterval?: number | string;
  timeUnit?: string;
}

/** `horn` is Honda's horn-lights: the app never sounds the horn alone. */
const HORN_LIGHT: Partial<Record<RemoteKind, string>> = {
  lights: COMMANDS.lights,
  horn: COMMANDS.hornLights,
};

const ENGINE: Partial<Record<RemoteKind, string>> = {
  start: COMMANDS.engineStart,
  stop: COMMANDS.engineStop,
  extend: COMMANDS.engineExtend,
};

/** Sends a command. The server accepts it here; the car's answer comes from `pullRemote`. */
export async function sendRemote(
  http: HondaHttp,
  carOid: string,
  kind: RemoteKind,
  clientUUID: string,
  ac: AcLevel = "mid",
): Promise<HttpResponse<RemoteAccepted>> {
  const hornLight = HORN_LIGHT[kind];
  if (hornLight)
    return http.postForm<RemoteAccepted>(ENDPOINTS.hornLight, {
      carOid,
      clientUUID,
      command: hornLight,
    });
  return kind === "lock" || kind === "unlock"
    ? http.postForm<RemoteAccepted>(ENDPOINTS.doorLock, {
        carOid,
        clientUUID,
        command: kind === "lock" ? COMMANDS.lock : COMMANDS.unlock,
      })
    : http.postJson<RemoteAccepted>(ENDPOINTS.engine, {
        carOid,
        clientUUID,
        command: ENGINE[kind],
        // The app sends the AC setting on start, stop and extend alike.
        vehicleControl: { acSetting: { acTempVal: AC_TEMP[ac], acDefSetting: "autoOn" } },
      });
}

/** Asks for a command's outcome. `SUCCESS` means the car did it; the app treats anything else as failed. */
export async function pullRemote(
  http: HondaHttp,
  carOid: string,
  kind: RemoteKind,
  clientUUID: string,
  sentAt: number,
): Promise<HttpResponse<RemoteAccepted>> {
  const path = HORN_LIGHT[kind]
    ? ENDPOINTS.pullHornLightResult
    : kind === "lock" || kind === "unlock"
      ? ENDPOINTS.pullDoorLockResult
      : ENDPOINTS.pullEngineResult;
  const q = new URLSearchParams({ carOid, clientUUID, timeStampSpecified: String(sentAt) });
  return http.get<RemoteAccepted>(`${path}?${q}`);
}
