export type TripSummary = { startedAt: number; km: number };

const DAY = 86_400_000;
const BAR_PT = 64;
const MIN_PT = 4;

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Last 7 calendar days (oldest first, today last) with km and bar height 0..1. */
export function weekBars(trips: TripSummary[], today: Date) {
  const end = dayStart(today) + DAY;
  const days = Array.from({ length: 7 }, (_, i) => {
    const start = end - (7 - i) * DAY;
    const km = trips
      .filter((t) => t.startedAt >= start && t.startedAt < start + DAY)
      .reduce((n, t) => n + t.km, 0);
    return { start, km };
  });
  const max = Math.max(0, ...days.map((d) => d.km));
  return days.map(({ start, km }, i) => ({
    weekday: new Date(start).getDay(),
    km,
    today: i === 6,
    height: km === 0 || max === 0 ? 0 : Math.max(MIN_PT, (km / max) * BAR_PT) / BAR_PT,
  }));
}

export function tripTotals(trips: TripSummary[], today: Date) {
  const from = dayStart(today) + DAY - 7 * DAY;
  const week = trips.filter((t) => t.startedAt >= from);
  return { trips: week.length, km: Math.round(week.reduce((n, t) => n + t.km, 0)) };
}
