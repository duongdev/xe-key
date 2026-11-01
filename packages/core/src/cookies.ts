/** Where `HondaHttp` keeps the session cookies (JSESSIONID, iprmtkn…). */
export interface CookieStore {
  all(): Record<string, string>;
  set(name: string, value: string): void;
}

export function memoryCookies(seed: Record<string, string> = {}): CookieStore {
  const jar = new Map(Object.entries(seed));
  return {
    all: () => Object.fromEntries(jar),
    set: (name, value) => {
      jar.set(name, value);
    },
  };
}

/**
 * Splits a comma-joined Set-Cookie header (React Native exposes only the joined form) into single
 * cookies. A comma starts a new cookie only when followed by `name=`; commas inside Expires do not.
 */
export function splitSetCookie(joined: string | null | undefined): string[] {
  if (!joined) return [];
  return joined
    .split(/,(?=\s*[^;,=\s]+=)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type HeadersLike = { get(name: string): string | null; getSetCookie?: () => string[] };

/** [name, value] pairs from a response; attributes (Path, Expires…) are dropped. */
export function readSetCookie(headers: HeadersLike): [string, string][] {
  const lines =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : splitSetCookie(headers.get("set-cookie"));
  const pairs: [string, string][] = [];
  for (const line of lines) {
    const pair = line.split(";", 1)[0] ?? "";
    const eq = pair.indexOf("=");
    if (eq > 0) pairs.push([pair.slice(0, eq).trim(), pair.slice(eq + 1).trim()]);
  }
  return pairs;
}

export function cookieHeader(cookies: Record<string, string>): string | undefined {
  const parts = Object.entries(cookies).map(([k, v]) => `${k}=${v}`);
  return parts.length ? parts.join("; ") : undefined;
}
