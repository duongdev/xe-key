import { describe, expect, it } from "vitest";
import { SWIPE_PX, slideAt, swipeStep } from "./carousel";

describe("slideAt", () => {
  it("moves forward and back", () => {
    expect(slideAt(2, 1, 6)).toBe(3);
    expect(slideAt(2, -1, 6)).toBe(1);
  });

  it("wraps at both ends", () => {
    expect(slideAt(5, 1, 6)).toBe(0);
    expect(slideAt(0, -1, 6)).toBe(5);
  });
});

describe("swipeStep", () => {
  it("goes next on a left swipe past the threshold", () => {
    expect(swipeStep(-(SWIPE_PX + 1))).toBe(1);
  });

  it("goes back on a right swipe past the threshold", () => {
    expect(swipeStep(SWIPE_PX + 1)).toBe(-1);
  });

  it("ignores short drags, including exactly the threshold", () => {
    expect(swipeStep(0)).toBe(0);
    expect(swipeStep(SWIPE_PX)).toBe(0);
    expect(swipeStep(-SWIPE_PX)).toBe(0);
  });
});
