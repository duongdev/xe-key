import type { ReactNode } from "react";
import { useRef } from "react";
import { type GestureResponderEvent, Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { haptics } from "../theme/haptics";
import type { Colors } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { usePressGlass } from "./press-glass";
import { Text } from "./text";

export const HOLD_MS = 1500;
const RELEASE_MS = 150;
/** Progress ticks while holding, before the armed impact at HOLD_MS. */
const TICKS_MS = [500, 1000];

type Props = {
  label: string;
  icon?: ReactNode;
  /** `hold` arms after 1.5 s (physical/risky); `tap` acts at once (safe). */
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
 * Primary car control. Hold: linear fill 1.5 s, selection ticks at start, 0.5 s and 1.0 s, medium
 * impact when armed; releasing early springs back and sends nothing. The fill stays under Reduce Motion
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
  const press = usePressGlass();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear = () => {
    for (const id of timers.current) clearTimeout(id);
    timers.current = [];
  };
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const start = (e: GestureResponderEvent) => {
    press.handlers.onPressIn(e);
    if (mode === "tap") {
      haptics.light();
      return;
    }
    haptics.selection();
    onHoldChange?.(true);
    progress.value = withTiming(1, { duration: HOLD_MS, easing: Easing.linear });
    timers.current = [
      ...TICKS_MS.map((ms) => setTimeout(() => haptics.selection(), ms)),
      setTimeout(() => {
        timers.current = [];
        onHoldChange?.(false);
        haptics.medium();
        progress.value = withTiming(0, { duration: RELEASE_MS });
        onAction();
      }, HOLD_MS),
    ];
  };

  const end = () => {
    press.handlers.onPressOut();
    if (timers.current.length) {
      onHoldChange?.(false);
      clear();
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
      onTouchMove={press.handlers.onTouchMove}
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
            backgroundColor: c[bg],
            opacity: disabled ? 0.5 : 1,
            alignItems: "center",
            justifyContent: "center",
          },
          press.lift,
        ]}
        onLayout={press.handlers.onLayout}
      >
        {/* Clip only the fill: a clipped button would also clip its press shadow. */}
        <View
          pointerEvents="none"
          style={{ position: "absolute", inset: 0, borderRadius: 34, overflow: "hidden" }}
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
        </View>
        {press.layer}
        <View pointerEvents="none" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {icon}
          <Text weight={600} color={fg} style={{ fontSize: 16 }}>
            {label}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}
