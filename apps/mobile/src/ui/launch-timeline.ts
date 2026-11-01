// Splash → Home timeline from the Splash board's CSS keyframes (HANDOFF.md › Splash → Home).
// Pure and worklet-safe: the overlay samples it every frame; easing curves are passed in.

export const END_MS = 1920;

type Ease = (x: number) => number;
type Point = { x: number; y: number };

const seg = (t: number, start: number, ms: number) => {
  "worklet";
  return Math.min(1, Math.max(0, (t - start) / ms));
};

/** Piecewise-linear keyframes, like CSS `@keyframes` with linear timing. */
const keys = (p: number, at: number[], v: number[]) => {
  "worklet";
  for (let i = 1; i < at.length; i++) {
    const a = at[i - 1] ?? 0;
    const b = at[i] ?? 1;
    if (p <= b) {
      const va = v[i - 1] ?? 0;
      return va + ((v[i] ?? 0) - va) * ((p - a) / (b - a));
    }
  }
  return v[v.length - 1] ?? 0;
};

/** Every animated value at `t` ms. `settle` and `inOut` are the board's curves. */
export function frame(t: number, settle: Ease, inOut: Ease) {
  "worklet";
  const tile = settle(seg(t, 250, 320));
  return {
    tileScale: 1 - 0.28 * tile,
    tileOpacity: 1 - tile,
    /** 0 → 1 along the dot's flight (230–1050 ms). */
    dot: inOut(seg(t, 230, 820)),
    dotOpacity: 1 - seg(t, 1060, 200),
    /** 1 = fully off to the left, 0 = in place (400–1080 ms). */
    carShift: 1 - settle(seg(t, 400, 680)),
    floor: keys(seg(t, 350, 1400), [0, 0.3, 0.7, 1], [0, 1, 1, 0]),
    wink: keys(seg(t, 1040, 860), [0, 0.12, 0.24, 0.37, 0.62, 1], [0, 1, 0.2, 1, 0.7, 0]),
    /** The overlay's dark ground; fading it reveals all of Home at once (1250–1700 ms). */
    veil: 1 - settle(seg(t, 1250, 450)),
    carOpacity: 1 - seg(t, 1760, 160),
  };
}

/** The dot's arc: up and over to the headlight, peaking 4.7 pt above the end, growing then shrinking. */
export function dotAt(p: number, from: Point, to: Point) {
  "worklet";
  const mid = { x: from.x + 0.45 * (to.x - from.x), y: to.y - 4.7 };
  const at = [0, 0.5, 1];
  return {
    x: keys(p, at, [from.x, mid.x, to.x]),
    y: keys(p, at, [from.y, mid.y, to.y]),
    scale: keys(p, at, [1, 1.25, 0.8]),
  };
}
