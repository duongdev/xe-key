import type { ReactNode } from "react";
import { Pressable, type ViewStyle } from "react-native";
import type { Colors } from "../theme/tokens";
import { Text } from "./text";

type Props = {
  label: string;
  onPress?: () => void;
  color?: keyof Colors;
  icon?: ReactNode;
  style?: ViewStyle;
};

/** Text-only action with a 44 pt hit target. */
export function TextButton({ label, onPress, color = "fg2", icon, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        {
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: pressed ? 0.6 : 1,
        },
        style,
      ]}
    >
      {icon}
      <Text variant="label" weight={400} color={color}>
        {label}
      </Text>
    </Pressable>
  );
}
