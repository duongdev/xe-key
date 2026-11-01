import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import type { LoginData } from "./auth.js";

export interface Session {
  baseUrl: string;
  deviceId: string;
  oid?: string;
  accessToken?: string;
  biometricRefreshToken?: string;
  email?: string;
  tcuUser?: boolean;
  cookies: Record<string, string>;
}

export function buildSession(
  baseUrl: string,
  deviceId: string,
  data: LoginData,
  cookies: Record<string, string>,
): Session {
  return {
    baseUrl,
    deviceId,
    oid: data.oid,
    accessToken: data.accessToken,
    biometricRefreshToken: data.biometricRefreshToken,
    email: data.email,
    tcuUser: data.tcuUser,
    cookies,
  };
}

export function saveSession(path: string, session: Session): void {
  writeFileSync(path, JSON.stringify(session, null, 2));
  chmodSync(path, 0o600);
}

/** Reads a session, tolerating the Python script's snake_case keys. */
export function loadSession(path: string): Session | null {
  if (!existsSync(path)) return null;
  const raw = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  const pick = (camel: string, snake: string) => raw[camel] ?? raw[snake];
  return {
    baseUrl: String(pick("baseUrl", "base_url") ?? ""),
    deviceId: String(pick("deviceId", "device_id") ?? ""),
    oid: raw.oid as string | undefined,
    accessToken: pick("accessToken", "access_token") as string | undefined,
    biometricRefreshToken: pick("biometricRefreshToken", "biometric_refresh_token") as
      | string
      | undefined,
    email: raw.email as string | undefined,
    tcuUser: pick("tcuUser", "tcu_user") as boolean | undefined,
    cookies: (raw.cookies as Record<string, string>) ?? {},
  };
}
