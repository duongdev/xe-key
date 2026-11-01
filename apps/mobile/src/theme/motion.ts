import { Easing, useReducedMotion, type WithTimingConfig } from "react-native-reanimated";

export const settle = Easing.bezier(0.22, 1, 0.36, 1);
export const pop = Easing.bezier(0.34, 1.56, 0.64, 1);

export const stateSpring = { duration: 350, dampingRatio: 0.85 } as const;

const reducedFade: WithTimingConfig = { duration: 150, easing: Easing.linear };

/** Timing config for a curve; with Reduce Motion on, every move becomes a 150 ms fade. */
export function useTiming() {
  const reduced = useReducedMotion();
  return (duration: number, easing = settle): WithTimingConfig =>
    reduced ? reducedFade : { duration, easing };
}

export { useReducedMotion };
