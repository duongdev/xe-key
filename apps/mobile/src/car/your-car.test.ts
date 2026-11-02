import { carNameFor, hondaLook, NAME_MAX, saveName, vinTail } from "./your-car";

test("name: trimmed, at most 24 chars, empty falls back to Honda's model", () => {
  expect(saveName("  Xe nhà  ", "CIVIC RS")).toBe("Xe nhà");
  expect(saveName("   ", "CIVIC RS")).toBeNull();
  expect(saveName(" CIVIC RS ", "CIVIC RS")).toBeNull();
  expect(saveName("x".repeat(30), "CIVIC RS")).toHaveLength(NAME_MAX);
  expect(carNameFor(null, "CIVIC RS")).toBe("CIVIC RS");
  expect(carNameFor("Xe nhà", "CIVIC RS")).toBe("Xe nhà");
});

test("reset: Honda's body and paint, shaded, no own name", () => {
  expect(hondaLook({ model: "CIVIC RS", color: "NH-883P Trắng ngà" })).toEqual({
    car: { body: "sedan", look: "shaded", paint: "#E9E9E6" },
    carName: null,
  });
});

test("VIN shows only its last 4", () => {
  expect(vinTail("MRHFE1650PP012345")).toBe("•••• 2345");
  expect(vinTail(null)).toBeNull();
});
