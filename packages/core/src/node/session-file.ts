import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseSession, type Session } from "../session.js";

export function saveSession(path: string, session: Session): void {
  // mode on create: no window where a new file holds the session with default perms.
  writeFileSync(path, JSON.stringify(session, null, 2), { mode: 0o600 });
  chmodSync(path, 0o600);
}

export function loadSession(path: string): Session | null {
  if (!existsSync(path)) return null;
  return parseSession(JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>);
}
