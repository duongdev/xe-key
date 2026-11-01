import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

/**
 * Resolves the deviceId the server binds the session to. Priority:
 *   1. HONDA_DEVICE_ID env (use your iPhone's/registered id to avoid a device change)
 *   2. a persisted file (stable across runs)
 *   3. a fresh 16-hex id (android_id shape) — triggers a one-time verification
 */
export function resolveDeviceId(file?: string): string {
  const env = process.env.HONDA_DEVICE_ID?.trim();
  if (env) return env;
  if (file && existsSync(file)) return readFileSync(file, "utf8").trim();
  const id = randomBytes(8).toString("hex");
  if (file) writeFileSync(file, id);
  return id;
}
