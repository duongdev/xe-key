// Driving summary (HANDOFF › Driving summary): pure period math over Honda's
// /car/trip/summary rows (FINDINGS Round 9). Honda has no score; this is what it sends.

export type SummaryRow = {
  /** Local midnight of the row's day (Day), first day of month (Month) or year (Year). */
  date: number;
  trips: number;
  km: number;
  seconds: number;
  daySeconds: number;
  nightSeconds: number;
  avgKmh: number | null;
  maxKmh: number | null;
  kmPerL: number | null;
  accelPct: number | null;
  brakePct: number | null;
};

export type PeriodKind = "week" | "month" | "year";
export type Period = { kind: PeriodKind; start: number; end: number };

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number.parseFloat(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};
const val = (v: unknown) => num(obj(v).value);

/** Honda summary rows → `SummaryRow`. Month/year rows carry 0 for the unused day/month. */
export function toSummaryRows(rows: unknown): SummaryRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((r): SummaryRow[] => {
    const o = obj(r);
    const year = num(o.year);
    if (!year) return [];
    return [
      {
        date: new Date(year, (num(o.month) || 1) - 1, num(o.day) || 1).getTime(),
        trips: num(o.tripCount) ?? 0,
        km: val(o.mileage) ?? 0,
        seconds: num(o.duration) ?? 0,
        daySeconds: num(o.dayDuration) ?? 0,
        nightSeconds: num(o.nightDuration) ?? 0,
        avgKmh: val(o.avgSpeed),
        maxKmh: val(o.maxSpeed),
        kmPerL: val(o.fuelConsumption),
        accelPct: val(o.accelPercentage),
        brakePct: val(o.brakePercentage),
      },
    ];
  });
}

const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function periodOf(kind: PeriodKind, date: Date): Period {
  const d = midnight(date);
  if (kind === "week") {
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
    return { kind, start: start.getTime(), end: end.getTime() };
  }
  if (kind === "month") {
    return {
      kind,
      start: new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime(),
    };
  }
  return {
    kind,
    start: new Date(d.getFullYear(), 0, 1).getTime(),
    end: new Date(d.getFullYear() + 1, 0, 1).getTime(),
  };
}

/** The period `dir` steps away (-1 earlier, 1 later). */
export function stepPeriod(p: Period, dir: -1 | 1): Period {
  const s = new Date(p.start);
  const next =
    p.kind === "week"
      ? new Date(s.getFullYear(), s.getMonth(), s.getDate() + 7 * dir)
      : p.kind === "month"
        ? new Date(s.getFullYear(), s.getMonth() + dir, 1)
        : new Date(s.getFullYear() + dir, 0, 1);
  return periodOf(p.kind, next);
}

/** Steps from the period holding `today` (0); earlier periods are negative. */
export function periodIndex(p: Period, today: Date): number {
  const now = periodOf(p.kind, today);
  const a = new Date(p.start);
  const b = new Date(now.start);
  if (p.kind === "year") return a.getFullYear() - b.getFullYear();
  if (p.kind === "month")
    return (a.getFullYear() - b.getFullYear()) * 12 + a.getMonth() - b.getMonth();
  // Round: a daylight-saving change makes a week 1 h shorter or longer.
  return Math.round((p.start - now.start) / (7 * 86_400_000));
}

/** Later stops at the period holding today; earlier stops at the one holding Honda's oldest row. */
export function canStep(p: Period, dir: -1 | 1, today: Date, oldest: number | null) {
  if (dir === 1) return p.end <= midnight(today).getTime();
  return oldest !== null && p.start > oldest;
}

/** First and last day of the period, for its title. */
export function periodRange(p: Period) {
  const e = new Date(p.end);
  return {
    first: p.start,
    last: new Date(e.getFullYear(), e.getMonth(), e.getDate() - 1).getTime(),
  };
}

export type PeriodStats = {
  trips: number;
  km: number;
  seconds: number;
  avgKmh: number | null;
  maxKmh: number | null;
  kmPerL: number | null;
  /** Share of driving time in daylight, 0..1. */
  dayPct: number | null;
  accelPct: number | null;
  brakePct: number | null;
};

/** Distance-weighted average of a per-row value, over the rows that have it. */
function weighted(rows: SummaryRow[], pick: (r: SummaryRow) => number | null) {
  const has = rows.filter((r) => pick(r) !== null);
  const km = has.reduce((n, r) => n + r.km, 0);
  if (!has.length) return null;
  if (!km) return has.reduce((n, r) => n + (pick(r) ?? 0), 0) / has.length;
  return has.reduce((n, r) => n + r.km * (pick(r) ?? 0), 0) / km;
}

export function periodStats(rows: SummaryRow[]): PeriodStats {
  const sum = (pick: (r: SummaryRow) => number) => rows.reduce((n, r) => n + pick(r), 0);
  const km = sum((r) => r.km);
  const seconds = sum((r) => r.seconds);
  const lit = sum((r) => r.daySeconds + r.nightSeconds);
  const maxes = rows.map((r) => r.maxKmh).filter((v): v is number => v !== null);
  return {
    trips: sum((r) => r.trips),
    km,
    seconds,
    avgKmh: seconds ? km / (seconds / 3600) : null,
    maxKmh: maxes.length ? Math.max(...maxes) : null,
    kmPerL: weighted(rows, (r) => r.kmPerL),
    dayPct: lit ? sum((r) => r.daySeconds) / lit : null,
    accelPct: weighted(rows, (r) => r.accelPct),
    brakePct: weighted(rows, (r) => r.brakePct),
  };
}

export type Bar = { start: number; km: number; today: boolean; future: boolean };

/** Bar slots: 7 days (week), each day (month) or 12 months (year), with km from `rows`. */
export function periodBars(p: Period, rows: SummaryRow[], today: Date): Bar[] {
  const s = new Date(p.start);
  const slots: number[] = [];
  for (let i = 0; ; i++) {
    const d =
      p.kind === "year"
        ? new Date(s.getFullYear(), i, 1)
        : new Date(s.getFullYear(), s.getMonth(), s.getDate() + i);
    if (d.getTime() >= p.end) break;
    slots.push(d.getTime());
  }
  const now = today.getTime();
  return slots.map((start, i) => {
    const end = slots[i + 1] ?? p.end;
    return {
      start,
      km: rows.filter((r) => r.date >= start && r.date < end).reduce((n, r) => n + r.km, 0),
      today: now >= start && now < end,
      future: start > now,
    };
  });
}
