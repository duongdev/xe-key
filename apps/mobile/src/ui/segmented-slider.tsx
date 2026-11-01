import { type ReactNode, useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useReducedMotion, useTiming } from "../theme/motion";
import type { Colors } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { ScrubRail } from "./scrub-rail";
import { Text } from "./text";

type Props = {
  options: readonly string[];
  value: number;
  onChange: (i: number) => void;
  label: string;
  height?: number;
  knob?: keyof Colors;
  onKnob?: keyof Colors;
  knobIcon?: ReactNode;
};

/** A few named stops; drag or tap, knob springs to the stop (Pop, 320 ms). */
export function SegmentedSlider({
  options,
  value,
  onChange,
  label,
  height = 48,
  knob = "fg",
  onKnob = "bg",
  knobIcon,
}: Props) {
  const { c } = useTheme();
  const timing = useTiming();
  const reduced = useReducedMotion();
  const [w, setW] = useState(0);
  const x = useSharedValue(0);
  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const seg = (w - 8) / options.length;
  const fontSize = height >= 56 ? 15 : 14;

  useEffect(() => {
    x.value = reduced
      ? withTiming(value * seg, timing(150))
      : withSpring(value * seg, { duration: 320, dampingRatio: 0.6 });
  }, [value, seg, x, reduced, timing]);

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <ScrubRail
        count={options.length}
        value={value}
        onChange={onChange}
        label={label}
        valueText={options[value] ?? ""}
        style={{ height, borderRadius: height / 2, backgroundColor: c.s1 }}
      >
        {() => (
          <>
            <View style={{ position: "absolute", inset: 0, flexDirection: "row" }}>
              {options.map((o) => (
                <View key={o} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <Text variant="caption" color="fg2" style={{ fontSize }}>
                    {o}
                  </Text>
                </View>
              ))}
            </View>
            <Animated.View
              style={[
                {
                  position: "absolute",
                  top: 4,
                  bottom: 4,
                  left: 4,
                  width: seg,
                  borderRadius: (height - 8) / 2,
                  backgroundColor: c[knob],
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                },
                knobStyle,
              ]}
            >
              {knobIcon}
              <Text variant="caption" weight={600} color={onKnob} style={{ fontSize }}>
                {options[value]}
              </Text>
            </Animated.View>
          </>
        )}
      </ScrubRail>
    </View>
  );
}
