import { formatTime } from "./format";

const t = new Date(2026, 10, 2, 7, 5).getTime();
const pm = new Date(2026, 10, 2, 18, 30).getTime();

describe("formatTime", () => {
  it("writes 24-hour time with a leading zero", () => {
    expect(formatTime(t, "24h", "en")).toBe("07:05");
    expect(formatTime(pm, "24h", "vi")).toBe("18:30");
  });

  it("writes 12-hour time with AM/PM in English", () => {
    expect(formatTime(t, "12h", "en")).toBe("7:05 AM");
    expect(formatTime(pm, "12h", "en")).toBe("6:30 PM");
  });

  it("uses SA/CH in Vietnamese 12-hour time", () => {
    expect(formatTime(pm, "12h", "vi")).toBe("6:30 CH");
  });
});
