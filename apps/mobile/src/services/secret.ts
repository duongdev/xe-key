import type { CookieStore } from "@xekey/core";
import * as SecureStore from "expo-secure-store";

// Keychain, this device only, readable while unlocked (ADR 0004, 0005). Never in backups.
const OPTS = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export type SecretKey = "deviceId" | "deviceToken" | "region" | "phone" | "password" | "cookies";

export const secret = {
  get: (k: SecretKey) => SecureStore.getItemAsync(k, OPTS),
  set: (k: SecretKey, v: string) => SecureStore.setItemAsync(k, v, OPTS),
  del: (k: SecretKey) => SecureStore.deleteItemAsync(k, OPTS),
};

/** In-memory jar that writes through to the Keychain, so the session survives restarts. */
export function keychainCookies(seed: Record<string, string>): CookieStore {
  const jar = new Map(Object.entries(seed));
  return {
    all: () => Object.fromEntries(jar),
    set: (name, value) => {
      jar.set(name, value);
      secret.set("cookies", JSON.stringify(Object.fromEntries(jar))).catch((e: unknown) => {
        console.warn("cookies: save failed", e);
      });
    },
  };
}

export async function loadCookies(): Promise<Record<string, string>> {
  const raw = await secret.get("cookies");
  return raw ? (JSON.parse(raw) as Record<string, string>) : {};
}
