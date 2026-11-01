import type { ReactNode } from "react";
import { useRef } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { haptics } from "../theme/haptics";
import type { Colors } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { Text } from "./text";

export const HOLD_MS = 600;
const RELEASE_MS = 150;

type Props = {
  label: string;
  icon?: ReactNode;
  /** `hold` arms after 0.6 s (physical/risky); `tap` acts at once (safe). */
  mode: "hold" | "tap";
  onAction: () => void;
  bg?: keyof Colors;
  fg?: keyof Colors;
  fill?: keyof Colors;
  disabled?: boolean;
  /** Defaults to `label`; set it when the visible label is shortened. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Finger down/up during a hold, e.g. to show "Keep holding". */
  onHoldChange?: (holding: boolean) => void;
};

/**
 * Primary car control. Hold: linear fill 600 ms, selection tick at start, medium impact when
 * armed; releasing early springs back and sends nothing. The fill stays under Reduce Motion
 * (it is feedback). VoiceOver double-tap acts directly.
 */
export function HoldButton({
  label,
  icon,
  mode,
  onAction,
  bg = "s1",
  fg = "fg",
  fill = "warn",
  disabled,
  accessibilityLabel,
  accessibilityHint,
  onHoldChange,
}: Props) {
  const { c } = useTheme();
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const start = () => {
    scale.value = withTiming(0.97, { duration: 90 });
    if (mode === "tap") {
      haptics.light();
      return;
    }
    haptics.selection();
    onHoldChange?.(true);
    progress.value = withTiming(1, { duration: HOLD_MS, easing: Easing.linear });
    timer.current = setTimeout(() => {
      timer.current = null;
      onHoldChange?.(false);
      haptics.medium();
      progress.value = withTiming(0, { duration: RELEASE_MS });
      onAction();
    }, HOLD_MS);
  };

  const end = () => {
    scale.value = withTiming(1, { duration: 90 });
    if (timer.current) {
      onHoldChange?.(false);
      clearTimeout(timer.current);
      timer.current = null;
      progress.value = withTiming(0, { duration: RELEASE_MS, easing: Easing.out(Easing.quad) });
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      accessibilityActions={[{ name: "activate" }]}
      onAccessibilityAction={() => !disabled && onAction()}
      disabled={disabled}
      onPressIn={start}
      onPressOut={end}
      onPress={mode === "tap" ? onAction : undefined}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          {
            height: 68,
            borderRadius: 34,
            overflow: "hidden",
            backgroundColor: c[bg],
            opacity: disabled ? 0.5 : 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          },
          pressStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              backgroundColor: c[fill],
              opacity: 0.35,
            },
            fillStyle,
          ]}
        />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {icon}
          <Text weight={600} color={fg} style={{ fontSize: 16 }}>
            {label}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}
