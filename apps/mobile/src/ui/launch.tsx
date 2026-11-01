import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { pop, settle, useReducedMotion } from "../theme/motion";
import { useTheme } from "../theme/use-theme";

const TILE = 96;
const FONT = 46;

/**
 * Cold-start mark: the tile settles in 320 ms, the dot drops into place with one small bounce,
 * then the overlay fades — under 700 ms in all. Reduce Motion: a 150 ms fade.
 */
export function Launch({ onDone }: { onDone: () => void }) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const tile = useSharedValue(0);
  const dot = useSharedValue(0);
  const veil = useSharedValue(1);

  useEffect(() => {
    if (reduced) {
      tile.value = 1;
      dot.value = 1;
      veil.value = withDelay(
        250,
        withTiming(0, { duration: 150 }, () => runOnJS(onDone)()),
      );
      return;
    }
    tile.value = withTiming(1, { duration: 320, easing: settle });
    dot.value = withDelay(240, withTiming(1, { duration: 260, easing: pop }));
    veil.value = withDelay(
      520,
      withTiming(0, { duration: 170 }, () => runOnJS(onDone)()),
    );
  }, [reduced, tile, dot, veil, onDone]);

  const veilStyle = useAnimatedStyle(() => ({ opacity: veil.value }));
  const tileStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, tile.value * 1.6),
    transform: [{ scale: 0.9 + 0.1 * tile.value }],
  }));
  const dotStyle = useAnimatedStyle(() => ({
    opacity: dot.value > 0 ? 1 : 0,
    transform: [{ translateY: -22 * (1 - dot.value) }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: c.bg, alignItems: "center", justifyContent: "center" },
        veilStyle,
      ]}
    >
      <Animated.View
        style={[
          {
            width: TILE,
            height: TILE,
            borderRadius: 26,
            backgroundColor: "#F2F2F3",
            alignItems: "center",
            justifyContent: "center",
          },
          tileStyle,
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
          <Animated.Text
            style={{
              fontFamily: "BeVietnamPro_800ExtraBold",
              fontSize: FONT,
              letterSpacing: -0.06 * FONT,
              color: "#0B0B0C",
            }}
          >
            xe
          </Animated.Text>
          <Animated.Text
            style={[
              { fontFamily: "BeVietnamPro_800ExtraBold", fontSize: FONT, color: "#0A6FC2" },
              dotStyle,
            ]}
          >
            .
          </Animated.Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}
