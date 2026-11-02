import { hideKey, odometerEstimate, type ServiceInfo, serviceLevel } from "./service";
import type { SummaryRow } from "./summary";

const base: ServiceInfo = {
  overdue: false,
  targetKm: 30_000,
  dueDate: Date.UTC(2026, 11, 12),
  kmLeft: 4_800,
  daysLeft: 40,
  planVnd: 2_450_000,
  visits: [],
};

describe("serviceLevel", () => {
  it("is overdue when Honda says so", () => {
    expect(serviceLevel({ ...base, overdue: true, kmLeft: 0, daysLeft: 0 })).toBe("overdue");
  });
  it("is soon at 1,000 km or 30 days left, whichever first", () => {
    expect(serviceLevel({ ...base, kmLeft: 1_000 })).toBe("soon");
    expect(serviceLevel({ ...base, daysLeft: 30 })).toBe("soon");
    expect(serviceLevel({ ...base, kmLeft: 1_001, daysLeft: 31 })).toBe("ok");
  });
  it("hides when Honda sends no target", () => {
    expect(serviceLevel({ ...base, targetKm: null, dueDate: null })).toBeNull();
    expect(serviceLevel({ ...base, kmLeft: null, daysLeft: null })).toBeNull();
  });
});

const day = (date: number, km: number) => ({ date, km }) as SummaryRow;

describe("odometerEstimate", () => {
  const visits = [
    { id: "a", type: "Phụ kiện", date: 1_000, km: 33_220, priceVnd: null },
    { id: "b", type: "Bảo dưỡng định kỳ", date: 500, km: 26_262, priceVnd: 1_196_036 },
  ];
  it("adds trip km driven after the newest visit's day", () => {
    const rows = [day(1_000, 40), day(2_000, 20), day(3_000, 5), day(900, 99)];
    expect(odometerEstimate(visits, rows)).toEqual({ km: 33_245, from: visits[0] });
  });
  it("is null with no history", () => {
    expect(odometerEstimate([], [day(1, 5)])).toBeNull();
  });
});

describe("hideKey", () => {
  it("changes when the target changes", () => {
    expect(hideKey(base)).toBe(hideKey({ ...base, kmLeft: 10 }));
    expect(hideKey(base)).not.toBe(hideKey({ ...base, targetKm: 40_000 }));
  });
});
