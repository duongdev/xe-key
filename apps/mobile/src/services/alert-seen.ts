import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CarAlert } from "./car";

// Honda has no "mark as read" call, so alerts the user marked read are remembered on the device.
// Only alert ids are stored (not personal data).
const KEY = "alerts.seen.v1";
const MAX = 500;
let seen: Set<string> | null = null;

async function load(): Promise<Set<string>> {
  if (seen) return seen;
  try {
    seen = new Set(JSON.parse((await AsyncStorage.getItem(KEY)) ?? "[]") as string[]);
  } catch {
    seen = new Set();
  }
  return seen;
}

/** Alerts with the ones the user already marked read shown as read. */
export async function withSeen(alerts: CarAlert[]): Promise<CarAlert[]> {
  const s = await load();
  return alerts.map((a) => (a.unread && s.has(a.id) ? { ...a, unread: false } : a));
}

export async function markSeen(ids: string[]) {
  const s = await load();
  for (const id of ids) s.add(id);
  const keep = [...s].slice(-MAX);
  seen = new Set(keep);
  await AsyncStorage.setItem(KEY, JSON.stringify(keep)).catch(() => {});
}
