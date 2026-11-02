import type { Trip } from "./car";
import { lacking, withPlaces } from "./trip-places";

const trip = (id: string, over: Partial<Trip> = {}): Trip => ({
  id,
  startedAt: 1,
  km: 1,
  minutes: 1,
  from: null,
  to: null,
  ...over,
});

test("saved places fill trips that have none", () => {
  const saved = { a: { from: "Thảo Điền", to: "Quận 1", route: [] } };
  expect(withPlaces([trip("a"), trip("b")], saved)).toEqual([
    trip("a", { from: "Thảo Điền", to: "Quận 1" }),
    trip("b"),
  ]);
});

test("lacking lists trips with no places, saved or given", () => {
  const saved = { a: { from: "X", to: "Y", route: [] } };
  expect(lacking([trip("a"), trip("b"), trip("c", { from: "P", to: "Q" })], saved)).toEqual(["b"]);
});
