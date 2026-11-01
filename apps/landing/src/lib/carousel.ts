/** Horizontal drag, in px, a swipe must pass to change the slide. */
export const SWIPE_PX = 50;

export function slideAt(index: number, delta: number, count: number): number {
  return (((index + delta) % count) + count) % count;
}

/** Left swipe (negative dx) goes to the next slide. */
export function swipeStep(dx: number): -1 | 0 | 1 {
  if (dx < -SWIPE_PX) return 1;
  if (dx > SWIPE_PX) return -1;
  return 0;
}
