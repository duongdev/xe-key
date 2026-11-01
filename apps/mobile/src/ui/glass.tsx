import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import type { ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import { useTheme } from "../theme/use-theme";

const liquid = isLiquidGlassAvailable();

/**
 * A floating surface (toast, floating tabs, buttons over the map). Native Liquid Glass on iOS 26+;
 * before that a solid raised fill with a soft shadow, so it reads the same on any ground.
 */
export function Glass({
  children,
  style,
  interactive,
  accessibilityRole,
}: {
  children?: ReactNode;
  style?: ViewStyle;
  interactive?: boolean;
  accessibilityRole?: "tablist" | "alert" | "none";
}) {
  const { c, scheme } = useTheme();
  if (liquid)
    return (
      <GlassView
        accessibilityRole={accessibilityRole}
        glassEffectStyle="regular"
        colorScheme={scheme}
        isInteractive={interactive}
        style={[{ overflow: "hidden" }, style]}
      >
        {children}
      </GlassView>
    );
  return (
    <View
      accessibilityRole={accessibilityRole}
      style={[
        {
          backgroundColor: c.s2,
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
