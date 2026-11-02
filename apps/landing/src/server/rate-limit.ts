// ponytail: in-memory per container (ADR 0009); move to Postgres or Traefik if the site scales out.
/** Sliding-window limiter: `hit(key, now)` is true while the key has fewer than `limit` hits in the window. */
export function createLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();
  return function hit(key: string, now: number): boolean {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 10_000) {
      for (const [k, ts] of hits) if (ts.every((t) => now - t >= windowMs)) hits.delete(k);
    }
    return true;
  };
}

/** Client IP behind Traefik: X-Real-IP, else the last X-Forwarded-For hop (the one the proxy added). */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const hops = headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((h) => h.trim())
    .filter(Boolean);
  return hops?.at(-1) ?? "unknown";
}
