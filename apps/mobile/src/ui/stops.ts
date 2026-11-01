/** Index of the stop under `x` on a rail of `width` split into `n` equal stops. */
export function stopAt(x: number, width: number, n: number): number {
  return Math.min(n - 1, Math.max(0, Math.floor((x / width) * n)));
}
