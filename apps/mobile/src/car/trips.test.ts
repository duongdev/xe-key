import { tripTotals, weekBars } from "./trips";

// Monday 2 Nov 2026, 12:00 local.
const today = new Date(2026, 10, 2, 12);
const at = (daysAgo: number, h = 8) => new Date(2026, 10, 2 - daysAgo, h).getTime();

describe("weekBars", () => {
  it("sums km per day for the last 7 days, oldest first, today last", () => {
    const bars = weekBars(
      [
        { startedAt: at(0), km: 10 },
        { startedAt: at(0, 18), km: 5.5 },
        { startedAt: at(3), km: 20 },
        { startedAt: at(7), km: 99 },
      ],
      today,
    );
    expect(bars.map((b) => b.km)).toEqual([0, 0, 0, 20, 0, 0, 15.5]);
    expect(bars[6]?.today).toBe(true);
    expect(bars[6]?.weekday).toBe(1);
    expect(bars[0]?.weekday).toBe(2);
  });

  it("scales height to the busiest day with a 4 pt floor for driven days", () => {
    const bars = weekBars(
      [
        { startedAt: at(0), km: 30 },
        { startedAt: at(1), km: 0.3 },
      ],
      today,
    );
    expect(bars[6]?.height).toBe(1);
    expect(bars[5]?.height).toBeCloseTo(4 / 64, 5);
    expect(bars[4]?.height).toBe(0);
  });

  it("is all zero with no trips", () => {
    expect(weekBars([], today).every((b) => b.km === 0 && b.height === 0)).toBe(true);
  });
});

describe("tripTotals", () => {
  it("counts trips and km in the last 7 days", () => {
    expect(
      tripTotals(
        [
          { startedAt: at(0), km: 8.24 },
          { startedAt: at(6), km: 1 },
          { startedAt: at(9), km: 50 },
        ],
        today,
      ),
    ).toEqual({ trips: 2, km: 9 });
  });
});
