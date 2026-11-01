export type Freshness = { unit: "live" } | { unit: "m" | "h" | "d"; n: number };

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** How old the car data is, in the coarsest unit that still means something. */
export function freshness(updatedAt: number, now: number): Freshness {
  const age = now - updatedAt;
  if (age < MIN) return { unit: "live" };
  if (age < HOUR) return { unit: "m", n: Math.floor(age / MIN) };
  if (age < DAY) return { unit: "h", n: Math.floor(age / HOUR) };
  return { unit: "d", n: Math.floor(age / DAY) };
}
