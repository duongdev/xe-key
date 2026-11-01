import { distanceKm } from "./distance";

describe("distanceKm", () => {
  it("is 0 for the same point", () => {
    expect(distanceKm({ lat: 10.79, lng: 106.72 }, { lat: 10.79, lng: 106.72 })).toBe(0);
  });
  it("matches a known span (Landmark 81 to Ben Thanh, ~4 km), one decimal", () => {
    expect(distanceKm({ lat: 10.7951, lng: 106.7218 }, { lat: 10.7725, lng: 106.698 })).toBeCloseTo(
      3.6,
      1,
    );
  });
});
