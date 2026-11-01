import { dotAt, END_MS, frame } from "./launch-timeline";

const lin = (x: number) => x;

describe("frame", () => {
  it("starts as the native launch image: full tile, car off to the left, dark ground", () => {
    expect(frame(0, lin, lin)).toMatchObject({
      tileScale: 1,
      tileOpacity: 1,
      dot: 0,
      carShift: 1,
      wink: 0,
      floor: 0,
      veil: 1,
      carOpacity: 1,
    });
  });
  it("shrinks the tile 250–570 ms and drives the car in 400–1080 ms", () => {
    expect(frame(410, lin, lin).tileScale).toBeCloseTo(1 - 0.28 * 0.5);
    expect(frame(570, lin, lin).tileOpacity).toBe(0);
    expect(frame(740, lin, lin).carShift).toBeCloseTo(0.5);
    expect(frame(1080, lin, lin).carShift).toBe(0);
  });
  it("winks twice from 1040 ms", () => {
    const at = (ms: number) => frame(ms, lin, lin).wink;
    expect(at(1040)).toBe(0);
    expect(at(1040 + 0.12 * 860)).toBeCloseTo(1);
    expect(at(1040 + 0.24 * 860)).toBeCloseTo(0.2);
    expect(at(1040 + 0.37 * 860)).toBeCloseTo(1);
    expect(at(1900)).toBe(0);
  });
  it("fades Home in 1250–1700 ms, then the overlay car 1760–1920 ms", () => {
    expect(frame(1249, lin, lin).veil).toBe(1);
    expect(frame(1475, lin, lin).veil).toBeCloseTo(0.5);
    expect(frame(1700, lin, lin).veil).toBe(0);
    expect(frame(1760, lin, lin).carOpacity).toBe(1);
    expect(frame(END_MS, lin, lin).carOpacity).toBe(0);
  });
});

describe("dotAt", () => {
  const from = { x: 0, y: 0 };
  const to = { x: 121.8, y: -130.5 };
  it("arcs from the tile dot to the headlight, peaking just above the end (board numbers)", () => {
    expect(dotAt(0, from, to)).toEqual({ x: 0, y: 0, scale: 1 });
    const mid = dotAt(0.5, from, to);
    expect(mid.x).toBeCloseTo(54.8, 1);
    expect(mid.y).toBeCloseTo(-135.2);
    expect(mid.scale).toBeCloseTo(1.25);
    expect(dotAt(1, from, to)).toEqual({ x: 121.8, y: -130.5, scale: 0.8 });
  });
});
