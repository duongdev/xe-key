import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, View, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { haptics } from "../theme/haptics";
import type { Colors } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { usePressGlass } from "./press-glass";
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
  const press = usePressGlass();
  const t = tones[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      onPress={onPress}
      onTouchMove={press.handlers.onTouchMove}
      onPressOut={press.handlers.onPressOut}
      onPressIn={(e) => {
        haptics.light();
        press.handlers.onPressIn(e);
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
          press.lift,
          style,
        ]}
        onLayout={press.handlers.onLayout}
      >
        {press.layer}
        {loading ? (
          <ActivityIndicator color={c[t.fg]} />
        ) : (
          <View
            pointerEvents="none"
            style={{ flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 }}
          >
            {icon}
            <Text weight={600} color={t.fg} style={{ textAlign: "center", flexShrink: 1 }}>
              {label}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}
