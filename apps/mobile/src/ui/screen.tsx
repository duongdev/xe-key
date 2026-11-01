import type { ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { space } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";

/** Full-screen ground with safe-area padding and the 20 pt gutter. */
export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: c.bg,
          paddingTop: insets.top + 2,
          paddingBottom: Math.max(insets.bottom, 16) + 8,
          paddingHorizontal: space.gutter,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
