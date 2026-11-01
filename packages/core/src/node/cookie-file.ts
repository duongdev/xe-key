import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { type CookieStore, memoryCookies } from "../cookies.js";

/** Cookie jar persisted to a JSON file (chmod 600) after every change. */
export function fileCookies(path: string): CookieStore {
  const seed = existsSync(path)
    ? (JSON.parse(readFileSync(path, "utf8")) as Record<string, string>)
    : {};
  const jar = memoryCookies(seed);
  return {
    all: jar.all,
    set(name, value) {
      jar.set(name, value);
      // mode on create: no window where a new file holds cookies with default (world-readable) perms.
      writeFileSync(path, JSON.stringify(jar.all(), null, 2), { mode: 0o600 });
      chmodSync(path, 0o600);
    },
  };
}
