import { type ReactNode, useEffect } from "react";
import type { ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { pop, settle, useReducedMotion } from "../theme/motion";

type Kind = "rise" | "pop" | "settle-left";

const FROM: Record<Kind, { x: number; y: number; s: number; ms: number }> = {
  /** Live data arrives: values rise 4 px and fade in. */
  rise: { x: 0, y: 4, s: 1, ms: 320 },
  /** Confirmed check: 0.8 → 1 on Pop. */
  pop: { x: 0, y: 0, s: 0.8, ms: 320 },
  /** Car answers: settles in from the left. */
  "settle-left": { x: -24, y: 0, s: 1, ms: 600 },
};

/**
 * Plays one entrance on mount (or when `play` changes). Reduce Motion: a 150 ms fade, no movement.
 * `index` staggers siblings by 40 ms.
 */
export function Appear({
  kind,
  index = 0,
  play,
  style,
  children,
}: {
  kind: Kind;
  index?: number;
  play?: unknown;
  style?: ViewStyle;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const f = FROM[kind];
  const p = useSharedValue(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `play` is the replay trigger
  useEffect(() => {
    p.value = 0;
    p.value = withDelay(
      index * 40,
      withTiming(
        1,
        reduced ? { duration: 150 } : { duration: f.ms, easing: kind === "pop" ? pop : settle },
      ),
    );
  }, [play, reduced]);

  const anim = useAnimatedStyle(() => {
    const t = p.value;
    if (reduced) return { opacity: t };
    return {
      opacity: Math.min(1, t * 1.5),
      transform: [
        { translateX: f.x * (1 - t) },
        { translateY: f.y * (1 - t) },
        { scale: f.s + (1 - f.s) * t },
      ],
    };
  });

  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

/** Slow skeleton shimmer (1.2 s pass); a still block under Reduce Motion. */
export function Shimmer({ style }: { style: ViewStyle }) {
  const reduced = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    o.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [reduced, o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[style, anim]} />;
}

/** Slow continuous turn (e.g. snowflake once per 8 s while AC runs); still under Reduce Motion. */
export function Spin({ periodMs, children }: { periodMs: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  const deg = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    deg.value = 0;
    deg.value = withRepeat(withTiming(360, { duration: periodMs, easing: Easing.linear }), -1);
  }, [reduced, periodMs, deg]);
  const anim = useAnimatedStyle(() => ({ transform: [{ rotate: `${deg.value}deg` }] }));
  return <Animated.View style={anim}>{children}</Animated.View>;
}
