import type { ReactNode } from "react";
import { View } from "react-native";
import { useTheme } from "../theme/use-theme";
import { Text } from "./text";

export function Chip({ icon, label, small }: { icon?: ReactNode; label: string; small?: boolean }) {
  const { c } = useTheme();
  const height = small ? 36 : 40;
  return (
    <View
      style={{
        height,
        paddingLeft: 12,
        paddingRight: 14,
        borderRadius: height / 2,
        backgroundColor: c.s1,
        flexDirection: "row",
        alignItems: "center",
        gap: small ? 6 : 8,
      }}
    >
      {icon}
      <Text variant={small ? "caption" : "label"} color={small ? "fg2" : "fg"}>
        {label}
      </Text>
    </View>
  );
}
