import { stopAt } from "./stops";

describe("stopAt", () => {
  it("returns the stop under the finger", () => {
    expect(stopAt(0, 300, 3)).toBe(0);
    expect(stopAt(150, 300, 3)).toBe(1);
    expect(stopAt(299, 300, 3)).toBe(2);
    expect(stopAt(65, 360, 6)).toBe(1);
  });

  it("clamps outside the rail", () => {
    expect(stopAt(-40, 300, 3)).toBe(0);
    expect(stopAt(900, 300, 3)).toBe(2);
  });
});
