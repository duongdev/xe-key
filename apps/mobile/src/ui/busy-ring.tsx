import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { useReducedMotion } from "../theme/motion";
import { useTheme } from "../theme/use-theme";

/**
 * Pending ring around a control: 1.4 s per turn; amber, dashed, half speed while the car is asleep.
 * Reduce Motion: a still ring that pulses.
 */
export function BusyRing({
  size,
  stroke = 8,
  retrying,
}: {
  size: number;
  stroke?: number;
  retrying: boolean;
}) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const turn = useSharedValue(0);
  const pulse = useSharedValue(1);
  const r = size / 2 - stroke / 2 - 2;
  const len = 2 * Math.PI * r;

  useEffect(() => {
    if (reduced) {
      pulse.value = withRepeat(withTiming(0.35, { duration: 700 }), -1, true);
      return;
    }
    turn.value = 0;
    turn.value = withRepeat(
      withTiming(360, { duration: retrying ? 2800 : 1400, easing: Easing.linear }),
      -1,
    );
  }, [reduced, retrying, turn, pulse]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value}deg` }],
    opacity: pulse.value,
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", width: size, height: size }, style]}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={retrying ? c.warn : c.acc}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={retrying ? "40 30" : `${len * 0.17} ${len * 0.83}`}
        />
      </Svg>
    </Animated.View>
  );
}
