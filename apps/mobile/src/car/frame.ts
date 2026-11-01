import { BODIES, type Body } from "./geometry";

export const FRAME_W = 720;
export const FRAME_H = 280;

/** Midpoint of the path's x range (every other number; control points count, as on the design board). */
export function bodyCenterX(top: string): number {
  const xs = (top.match(/-?\d+(\.\d+)?/g) ?? []).map(Number).filter((_, i) => i % 2 === 0);
  return (Math.min(...xs) + Math.max(...xs)) / 2;
}

/** viewBox x that puts the body in the middle of the frame, so wrappers can stay symmetric. */
export function viewBoxX(body: Body): number {
  return bodyCenterX(BODIES[body].top) - FRAME_W / 2;
}
