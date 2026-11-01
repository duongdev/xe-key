import type { ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { space } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";

/**
 * Full-screen ground with safe-area padding and the 20 pt gutter. `scroll`: the content scrolls to
 * the bottom edge, so no bottom padding here; the list pads its own content with `useBottomPad()`.
 */
export function Screen({
  children,
  style,
  scroll,
}: {
  children: ReactNode;
  style?: ViewStyle;
  scroll?: boolean;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: c.bg,
          paddingTop: insets.top + 2,
          paddingBottom: scroll ? 0 : Math.max(insets.bottom, 16) + 8,
          paddingHorizontal: space.gutter,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Bottom padding for content that scrolls under the home indicator. */
export function useBottomPad() {
  return Math.max(useSafeAreaInsets().bottom, 16) + 16;
}
