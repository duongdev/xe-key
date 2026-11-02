// Driving behaviour per trip (HANDOFF › Trips by day): Honda's speed bands and a fuel meter
// judged against this car's own average, since a fair km/l differs per car.
import type { Period, SummaryRow } from "./summary";

/** Honda's bars (APK): 1 segment up to 49 km/h, 2 for 50–89, 3 from 90. 0 = no value. */
export function speedBand(kmh: number | null): 0 | 1 | 2 | 3 {
  if (kmh === null) return 0;
  return kmh <= 49 ? 1 : kmh <= 89 ? 2 : 3;
}

/** Fuel meter fill: 6 km/l empty → 16 km/l full. */
export function fuelFill(kmPerL: number | null): number {
  if (kmPerL === null) return 0;
  return Math.min(1, Math.max(0, (kmPerL - 6) / 10));
}

export type FuelAverage = { kmPerL: number | null; trips: number };

/** Distance-weighted km/l and the trip count over the 30 days before `today`. */
export function fuelAverage(dayRows: SummaryRow[], today: Date): FuelAverage {
  const from = today.getTime() - 30 * 86_400_000;
  const rows = dayRows.filter((r) => r.date >= from && r.kmPerL !== null && r.km > 0);
  const km = rows.reduce((n, r) => n + r.km, 0);
  return {
    kmPerL: km ? rows.reduce((n, r) => n + r.km * (r.kmPerL ?? 0), 0) / km : null,
    trips: rows.reduce((n, r) => n + r.trips, 0),
  };
}

/** warn = 10%+ thirstier than usual, acc = 10%+ thriftier; fg2 with under 5 trips of history. */
export function fuelTone(kmPerL: number | null, avg: FuelAverage): "warn" | "fg2" | "acc" {
  if (kmPerL === null || avg.kmPerL === null || avg.trips < 5) return "fg2";
  const ratio = kmPerL / avg.kmPerL;
  return ratio <= 0.9 ? "warn" : ratio >= 1.1 ? "acc" : "fg2";
}

/** The list under the card: driven days of a week / month, or the months of a year; newest first. */
export function periodDays(s: { day: SummaryRow[]; month: SummaryRow[] }, p: Period) {
  const rows = p.kind === "year" ? s.month : s.day;
  return rows
    .filter((r) => r.date >= p.start && r.date < p.end && r.trips > 0)
    .sort((a, b) => b.date - a.date);
}
