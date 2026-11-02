import { formatFuel } from "./fuel";

test("km/l stays as Honda sends it, 1 decimal", () => {
  expect(formatFuel(10.3, "kml", "en")).toEqual({ value: "10.3", unit: "km/l" });
  expect(formatFuel(9.5, "kml", "vi")).toEqual({ value: "9,5", unit: "km/l" });
});

test("L/100 km is 100 / km/l, 1 decimal", () => {
  expect(formatFuel(10.3, "l100", "en")).toEqual({ value: "9.7", unit: "L/100 km" });
  expect(formatFuel(12.5, "l100", "vi")).toEqual({ value: "8,0", unit: "L/100 km" });
});

test("missing or zero gives no value", () => {
  expect(formatFuel(null, "l100", "en")).toBeNull();
  expect(formatFuel(0, "l100", "en")).toBeNull();
});
