// Service reminder (HANDOFF › Service, FINDINGS Round 11). Honda has no live odometer and no
// "service done" call: the dealer's repair order is the only reading and the only reset.
import type { SummaryRow } from "./summary";

/** One dealer visit; `type` is Honda's local name ("Bảo dưỡng định kỳ"). */
export type ServiceVisit = {
  id: string;
  type: string;
  /** Local midnight of the visit day. */
  date: number;
  /** Odometer on the repair order. */
  km: number;
  /** VND; only `/maintenance/detail` has it. */
  priceVnd: number | null;
};

export type ServiceInfo = {
  overdue: boolean;
  /** Odometer reading of the next periodic service. */
  targetKm: number | null;
  dueDate: number | null;
  /** Honda sends 0 for both when overdue. */
  kmLeft: number | null;
  daysLeft: number | null;
  planVnd: number | null;
  /** Newest first. */
  visits: ServiceVisit[];
};

export type ServiceLevel = "ok" | "soon" | "overdue";

const SOON_KM = 1_000;
const SOON_DAYS = 30;

/** Null hides the tile and banners. */
export function serviceLevel(s: ServiceInfo): ServiceLevel | null {
  if (s.overdue) return "overdue";
  if ((s.targetKm === null && s.dueDate === null) || (s.kmLeft === null && s.daysLeft === null))
    return null;
  if (
    (s.kmLeft !== null && s.kmLeft <= SOON_KM) ||
    (s.daysLeft !== null && s.daysLeft <= SOON_DAYS)
  )
    return "soon";
  return "ok";
}

/** Last dealer reading + trip km of the days after it. Reads low when the car missed trips. */
export function odometerEstimate(visits: ServiceVisit[], days: SummaryRow[]) {
  const from = visits.reduce<ServiceVisit | null>((a, v) => (!a || v.date > a.date ? v : a), null);
  if (!from) return null;
  const km = days.filter((d) => d.date > from.date).reduce((n, d) => n + d.km, 0);
  return { km: Math.round(from.km + km), from };
}

/** "Already serviced" hides banners until Honda moves the target. */
export const hideKey = (s: ServiceInfo) => `${s.targetKm}:${s.dueDate}`;
