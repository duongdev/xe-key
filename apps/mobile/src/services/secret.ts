import type { CookieStore } from "@xekey/core";
import * as SecureStore from "expo-secure-store";

// Keychain, this device only, readable while unlocked (ADR 0004, 0005). Never in backups.
const OPTS = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export type SecretKey = "deviceId" | "deviceToken" | "region" | "phone" | "cookies";

export const secret = {
  get: (k: SecretKey) => SecureStore.getItemAsync(k, OPTS),
  set: (k: SecretKey, v: string) => SecureStore.setItemAsync(k, v, OPTS),
  del: (k: SecretKey) => SecureStore.deleteItemAsync(k, OPTS),
};

const LOCKED = "passwordLocked";
const guarded = { ...OPTS, requireAuthentication: true, authenticationPrompt: "Xe Key" };

/**
 * The Honda password for silent re-login (ADR 0005). With the Face ID setting on it is stored
 * behind Face ID, so reading it (a re-login) asks for Face ID.
 */
export const password = {
  async get(): Promise<string | null> {
    const locked = (await SecureStore.getItemAsync(LOCKED, OPTS)) === "1";
    return SecureStore.getItemAsync("password", locked ? guarded : OPTS);
  },
  async set(value: string, locked?: boolean) {
    const lock = locked ?? (await SecureStore.getItemAsync(LOCKED, OPTS)) === "1";
    // Access control can't change in place: replace the item.
    await SecureStore.deleteItemAsync("password", OPTS);
    await SecureStore.setItemAsync("password", value, lock ? guarded : OPTS);
    await SecureStore.setItemAsync(LOCKED, lock ? "1" : "0", OPTS);
  },
  /** Moves the stored password behind Face ID or out from behind it (asks Face ID if it is guarded). */
  async protect(lock: boolean) {
    const value = await password.get();
    if (value) await password.set(value, lock);
  },
  async del() {
    await SecureStore.deleteItemAsync("password", OPTS);
    await SecureStore.deleteItemAsync(LOCKED, OPTS);
  },
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
