import { describe, expect, it } from "vitest";
import { BODIES, bodyGeometry, luminance, needsAssist, wheelArch } from "./geometry.js";

const nums = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe("wheelArch", () => {
  const wy = 198;
  const yb = 206;
  const r = 66;
  const d = wheelArch(548, r, wy, yb);

  it("starts and ends on the rocker line, on the arch circle", () => {
    const [x1, y1, rx, ry, , , , x2, y2] = nums(d);
    expect(y1).toBe(yb);
    expect(y2).toBe(yb);
    expect(rx).toBe(r);
    expect(ry).toBe(r);
    for (const x of [x1 as number, x2 as number]) {
      expect(Math.hypot(x - 548, yb - wy)).toBeCloseTo(r, 0);
    }
    expect(x1).toBeGreaterThan(548);
    expect(x2).toBeLessThan(548);
  });

  it("uses the large-arc flag so the arch goes over the wheel", () => {
    expect(d).toMatch(/A66 66 0 1 0 /);
  });
});

describe("bodyGeometry", () => {
  it("closes the body with both arches, front wheel first", () => {
    const g = bodyGeometry("crossover");
    expect(g.body.startsWith(BODIES.crossover.top)).toBe(true);
    expect(g.body.endsWith(" Z")).toBe(true);
    expect(g.body.match(/ A/g)).toHaveLength(2);
  });

  it("uses the per-body arch gap (sedan 5, default 8)", () => {
    expect(bodyGeometry("sedan").archRadius).toBe(46 + 5);
    expect(bodyGeometry("suv").archRadius).toBe(58 + 8);
  });

  it("covers all five bodies", () => {
    expect(Object.keys(BODIES).sort()).toEqual(["city", "crossover", "mpv", "sedan", "suv"]);
  });
});

describe("luminance", () => {
  it("returns 0 for black and 1 for white", () => {
    expect(luminance("#000000")).toBe(0);
    expect(luminance("#FFFFFF")).toBeCloseTo(1, 5);
  });

  it("weights channels with Rec. 709", () => {
    expect(luminance("#6B7078")).toBeCloseTo(0.4373, 3);
    expect(luminance("#00FF00")).toBeCloseTo(0.7152, 4);
  });
});

describe("needsAssist", () => {
  it("assists a black car on dark ground and a white car on light ground", () => {
    expect(needsAssist("#15171A", "dark")).toBe(true);
    expect(needsAssist("#E9E9E6", "light")).toBe(true);
  });

  it("leaves a gray car alone on either ground", () => {
    expect(needsAssist("#6B7078", "dark")).toBe(false);
    expect(needsAssist("#6B7078", "light")).toBe(false);
  });

  it("does not assist a dark car on light ground", () => {
    expect(needsAssist("#15171A", "light")).toBe(false);
  });
});
