import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { haptics } from "../theme/haptics";
import { useTiming } from "../theme/motion";
import type { Colors } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { Text } from "./text";

type Tone = "primary" | "neutral" | "secondary" | "warn";

const tones: Record<Tone, { bg: keyof Colors; fg: keyof Colors }> = {
  primary: { bg: "acc", fg: "onacc" },
  neutral: { bg: "fg", fg: "bg" },
  secondary: { bg: "s1", fg: "fg" },
  warn: { bg: "warn", fg: "onwarn" },
};

type Props = {
  label: string;
  onPress?: () => void;
  icon?: ReactNode;
  tone?: Tone;
  disabled?: boolean;
  loading?: boolean;
  height?: 64 | 68;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  icon,
  tone = "primary",
  disabled,
  loading,
  height = 68,
  style,
}: Props) {
  const { c } = useTheme();
  const timing = useTiming();
  const scale = useSharedValue(1);
  const pressed = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const t = tones[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      onPress={onPress}
      onPressIn={() => {
        haptics.light();
        scale.value = withTiming(0.97, timing(90));
      }}
      onPressOut={() => {
        scale.value = withTiming(1, timing(90));
      }}
    >
      <Animated.View
        style={[
          {
            minHeight: height,
            borderRadius: height / 2,
            backgroundColor: c[t.bg],
            opacity: disabled ? 0.4 : 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            paddingHorizontal: 24,
          },
          pressed,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={c[t.fg]} />
        ) : (
          <>
            {icon}
            <Text weight={600} color={t.fg} style={{ textAlign: "center", flexShrink: 1 }}>
              {label}
            </Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}
