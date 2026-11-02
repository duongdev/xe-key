import {
  canStep,
  periodBars,
  periodIndex,
  periodOf,
  periodRange,
  periodStats,
  type SummaryRow,
  stepPeriod,
  toSummaryRows,
} from "./summary";

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d).getTime();
const row = (date: number, over: Partial<SummaryRow> = {}): SummaryRow => ({
  date,
  trips: 1,
  km: 10,
  seconds: 1800,
  daySeconds: 1800,
  nightSeconds: 0,
  avgKmh: 20,
  maxKmh: 50,
  kmPerL: 10,
  accelPct: null,
  brakePct: null,
  ...over,
});

describe("toSummaryRows", () => {
  it("maps a real summary reply and keeps missing values null", () => {
    const rows = toSummaryRows([
      {
        year: 2026,
        month: 11,
        day: 1,
        summaryDate: 1793466000000,
        tripCount: 2,
        duration: 4594,
        dayDuration: 3979,
        nightDuration: 615,
        mileage: { unit: "Km/h", value: 20 },
        avgSpeed: { unit: "Km/h", value: 15.67 },
        maxSpeed: { unit: "Km/h", value: 58 },
        fuelConsumption: { unit: "km/l", value: 10.8 },
        accelPercentage: { unit: "%", value: 0 },
        brakePercentage: { unit: "%", value: null },
      },
      { tripCount: 1 },
    ]);
    expect(rows).toEqual([
      {
        date: at(2026, 11, 1),
        trips: 2,
        km: 20,
        seconds: 4594,
        daySeconds: 3979,
        nightSeconds: 615,
        avgKmh: 15.67,
        maxKmh: 58,
        kmPerL: 10.8,
        accelPct: 0,
        brakePct: null,
      },
    ]);
    expect(toSummaryRows(null)).toEqual([]);
  });

  it("dates month and year rows by their first day", () => {
    const [m] = toSummaryRows([{ year: 2026, month: 10, day: 0, tripCount: 15 }]);
    const [y] = toSummaryRows([{ year: 2026, month: 0, day: 0, tripCount: 93 }]);
    expect(m?.date).toBe(at(2026, 10, 1));
    expect(y?.date).toBe(at(2026, 1, 1));
  });
});

describe("periods", () => {
  const mon = new Date(2026, 10, 2, 9); // Monday 2 Nov 2026

  it("weeks start on Monday", () => {
    expect(periodOf("week", new Date(2026, 10, 1, 12))).toEqual({
      kind: "week",
      start: at(2026, 10, 26),
      end: at(2026, 11, 2),
    });
    expect(periodOf("week", mon).start).toBe(at(2026, 11, 2));
  });

  it("months and years cover the calendar", () => {
    expect(periodOf("month", mon)).toEqual({
      kind: "month",
      start: at(2026, 11, 1),
      end: at(2026, 12, 1),
    });
    expect(periodOf("year", mon)).toEqual({
      kind: "year",
      start: at(2026, 1, 1),
      end: at(2027, 1, 1),
    });
  });

  it("steps back and forward, across month and year ends", () => {
    expect(stepPeriod(periodOf("week", mon), -1).start).toBe(at(2026, 10, 26));
    expect(stepPeriod(periodOf("month", new Date(2026, 0, 15)), -1).start).toBe(at(2025, 12, 1));
    expect(stepPeriod(periodOf("year", mon), 1).start).toBe(at(2027, 1, 1));
  });

  it("stops at the current period and at the oldest row", () => {
    const now = periodOf("week", mon);
    expect(canStep(now, 1, mon, at(2026, 5, 9))).toBe(false);
    expect(canStep(now, -1, mon, at(2026, 5, 9))).toBe(true);
    expect(canStep(now, -1, mon, at(2026, 11, 2))).toBe(false);
    expect(canStep(periodOf("week", new Date(2026, 4, 12)), -1, mon, at(2026, 5, 9))).toBe(true);
    expect(canStep(periodOf("week", new Date(2026, 4, 5)), -1, mon, at(2026, 5, 9))).toBe(false);
  });

  it("gives a range for titles", () => {
    expect(periodRange(periodOf("week", mon))).toEqual({
      first: at(2026, 11, 2),
      last: at(2026, 11, 8),
    });
  });
});

describe("periodStats", () => {
  it("sums, weights fuel by distance and splits day/night", () => {
    const s = periodStats([
      row(at(2026, 11, 1), {
        km: 30,
        seconds: 3600,
        daySeconds: 2700,
        nightSeconds: 900,
        kmPerL: 12,
        maxKmh: 80,
      }),
      row(at(2026, 11, 2), { km: 10, seconds: 1800, daySeconds: 1800, kmPerL: 8, trips: 2 }),
    ]);
    expect(s).toEqual({
      trips: 3,
      km: 40,
      seconds: 5400,
      avgKmh: 40 / 1.5,
      maxKmh: 80,
      kmPerL: (30 * 12 + 10 * 8) / 40,
      dayPct: 4500 / 5400,
      accelPct: null,
      brakePct: null,
    });
  });

  it("is empty for no rows", () => {
    expect(periodStats([])).toEqual({
      trips: 0,
      km: 0,
      seconds: 0,
      avgKmh: null,
      maxKmh: null,
      kmPerL: null,
      dayPct: null,
      accelPct: null,
      brakePct: null,
    });
  });

  it("keeps accel and brake only when Honda sent values", () => {
    const s = periodStats([
      row(1, { km: 10, accelPct: 20, brakePct: 0 }),
      row(2, { km: 30, accelPct: 0 }),
    ]);
    expect(s.accelPct).toBe(5);
    expect(s.brakePct).toBe(0);
  });
});

describe("periodBars", () => {
  const today = new Date(2026, 10, 4, 9); // Wed 4 Nov

  it("gives 7 week slots with today and future flags", () => {
    const bars = periodBars(periodOf("week", today), [row(at(2026, 11, 2), { km: 8 })], today);
    expect(bars).toHaveLength(7);
    expect(bars[0]).toMatchObject({ start: at(2026, 11, 2), km: 8, today: false, future: false });
    expect(bars[2]).toMatchObject({ today: true, future: false });
    expect(bars[3]).toMatchObject({ km: 0, future: true });
  });

  it("gives a slot per day of the month and 12 per year", () => {
    expect(periodBars(periodOf("month", today), [], today)).toHaveLength(30);
    const year = periodBars(periodOf("year", today), [row(at(2026, 10, 1), { km: 99 })], today);
    expect(year).toHaveLength(12);
    expect(year[9]?.km).toBe(99);
    expect(year[10]?.today).toBe(true);
    expect(year[11]?.future).toBe(true);
  });
});

describe("periodIndex", () => {
  const today = new Date(2026, 10, 4, 9);
  it("counts steps from the current period (0), earlier negative", () => {
    expect(periodIndex(periodOf("week", today), today)).toBe(0);
    expect(periodIndex(stepPeriod(periodOf("week", today), -1), today)).toBe(-1);
    expect(periodIndex(periodOf("week", new Date(2026, 4, 12)), today)).toBe(-25);
    expect(periodIndex(periodOf("month", new Date(2025, 11, 3)), today)).toBe(-11);
    expect(periodIndex(periodOf("year", new Date(2024, 1, 1)), today)).toBe(-2);
  });
});
