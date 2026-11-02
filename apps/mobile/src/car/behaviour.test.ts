import { fuelAverage, fuelFill, fuelTone, periodDays, speedBand } from "./behaviour";
import { periodOf, type SummaryRow } from "./summary";

const row = (date: number, over: Partial<SummaryRow> = {}): SummaryRow => ({
  date,
  trips: 1,
  km: 10,
  seconds: 600,
  daySeconds: 600,
  nightSeconds: 0,
  avgKmh: 20,
  maxKmh: 50,
  kmPerL: 10,
  accelPct: null,
  brakePct: null,
  ...over,
});
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d).getTime();

test("speedBand follows Honda's bars", () => {
  expect([null, 0, 49, 50, 89, 90, 140].map(speedBand)).toEqual([0, 1, 1, 2, 2, 3, 3]);
});

test("fuelFill maps 6 to 16 km/l onto 0..1", () => {
  expect([null, 4, 6, 11, 16, 20].map(fuelFill)).toEqual([0, 0, 0, 0.5, 1, 1]);
});

test("fuelTone compares with the car's own average", () => {
  const avg = { kmPerL: 10, trips: 12 };
  expect(fuelTone(8.9, avg)).toBe("warn");
  expect(fuelTone(9.1, avg)).toBe("fg2");
  expect(fuelTone(10.9, avg)).toBe("fg2");
  expect(fuelTone(11.1, avg)).toBe("acc");
  expect(fuelTone(5, { kmPerL: 10, trips: 4 })).toBe("fg2");
  expect(fuelTone(null, avg)).toBe("fg2");
});

test("fuelAverage weights by distance over the last 30 days", () => {
  const today = new Date(2026, 10, 2, 9);
  const rows = [
    row(at(2026, 11, 1), { km: 30, kmPerL: 12, trips: 2 }),
    row(at(2026, 10, 10), { km: 10, kmPerL: 8, trips: 3 }),
    row(at(2026, 9, 1), { km: 100, kmPerL: 5, trips: 9 }),
  ];
  expect(fuelAverage(rows, today)).toEqual({ kmPerL: (30 * 12 + 10 * 8) / 40, trips: 5 });
});

test("periodDays lists driven days newest first, or months for a year", () => {
  const today = new Date(2026, 10, 4);
  const day = [
    row(at(2026, 11, 2)),
    row(at(2026, 11, 3), { trips: 0 }),
    row(at(2026, 11, 4)),
    row(at(2026, 10, 30)),
  ];
  const month = [row(at(2026, 10, 1)), row(at(2026, 11, 1)), row(at(2025, 12, 1))];
  const summary = { day, month, year: [] };
  expect(periodDays(summary, periodOf("week", today)).map((r) => r.date)).toEqual([
    at(2026, 11, 4),
    at(2026, 11, 2),
  ]);
  expect(periodDays(summary, periodOf("year", today)).map((r) => r.date)).toEqual([
    at(2026, 11, 1),
    at(2026, 10, 1),
  ]);
});
