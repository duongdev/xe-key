import type { ReactNode } from "react";
import { View } from "react-native";
import { useTheme } from "../theme/use-theme";
import { Text } from "./text";

/** Labelled 56 pt input shell. `state` draws the focus or error ring. */
export function Field({
  label,
  state,
  children,
}: {
  label: string;
  state?: "focus" | "error";
  children: ReactNode;
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text variant="caption" color="fg2">
        {label}
      </Text>
      <View
        style={{
          height: 56,
          borderRadius: 16,
          backgroundColor: c.s1,
          borderWidth: 2,
          borderColor: state === "error" ? c.error : state === "focus" ? c.acc : c.s1,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingLeft: 14,
          paddingRight: 4,
        }}
      >
        {children}
      </View>
    </View>
  );
}
