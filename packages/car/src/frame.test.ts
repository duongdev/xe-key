import { describe, expect, it } from "vitest";
import { BODIES, type Body, bodyCenterX, viewBoxX } from "./geometry.js";

const xs = (path: string) =>
  (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number).filter((_, i) => i % 2 === 0);

describe("frame", () => {
  it("centres every body in the 720 frame", () => {
    for (const body of Object.keys(BODIES) as Body[]) {
      const x = xs(BODIES[body].top);
      const left = Math.min(...x) - viewBoxX(body);
      const right = 720 - (Math.max(...x) - viewBoxX(body));
      expect(left).toBeCloseTo(right);
    }
  });

  it("matches the board's numbers for the HR-V (x 101–690)", () => {
    expect(bodyCenterX(BODIES.crossover.top)).toBe(395.5);
    expect(viewBoxX("crossover")).toBe(35.5);
  });
});
