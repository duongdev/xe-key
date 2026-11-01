import { freshness } from "./freshness";

const now = 1_000_000_000;
const ago = (ms: number) => freshness(now - ms, now);

describe("freshness", () => {
  it("is live under a minute", () => {
    expect(ago(0)).toEqual({ unit: "live" });
    expect(ago(59_000)).toEqual({ unit: "live" });
  });

  it("counts minutes, hours, days", () => {
    expect(ago(60_000)).toEqual({ unit: "m", n: 1 });
    expect(ago(59 * 60_000)).toEqual({ unit: "m", n: 59 });
    expect(ago(3 * 3_600_000)).toEqual({ unit: "h", n: 3 });
    expect(ago(49 * 3_600_000)).toEqual({ unit: "d", n: 2 });
  });

  it("treats a clock in the future as live", () => {
    expect(freshness(now + 5000, now)).toEqual({ unit: "live" });
  });
});
