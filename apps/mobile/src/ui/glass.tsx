import { Button, type ButtonProps, Host } from "@expo/ui/swift-ui";
import {
  buttonBorderShape,
  buttonStyle,
  controlSize,
  disabled as disabledModifier,
  foregroundStyle,
  labelStyle,
  padding,
} from "@expo/ui/swift-ui/modifiers";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import type { ReactNode } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import { useTheme } from "../theme/use-theme";

const liquid = isLiquidGlassAvailable();
const PRESS_ROOM = 16;

/**
 * A floating surface (toast, floating tabs, buttons over content or the map). Native Liquid Glass
 * on iOS 26+; before that a solid raised fill with a soft shadow, so it reads the same on any ground.
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
  const dark = scheme === "dark";
  return (
    <View
      accessibilityRole={accessibilityRole}
      style={[
        {
          backgroundColor: dark ? c.s2 : c.s1,
          shadowColor: "#000",
          shadowOpacity: dark ? 0.45 : 0.1,
          shadowRadius: dark ? 12 : 10,
          shadowOffset: { width: 0, height: dark ? 8 : 6 },
        },
        dark && { borderWidth: 0.75, borderColor: "rgba(255,255,255,0.06)" },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * 44 pt glass circle for header and map actions. On iOS 26+ it is a native SwiftUI glass button
 * (system press, shimmer and light), so the icon is an SF Symbol; before that a solid fallback.
 */
export function GlassButton({
  label,
  symbol,
  onPress,
  disabled,
  color,
  children,
  style,
}: {
  label: string;
  symbol: NonNullable<ButtonProps["systemImage"]>;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
  children: ReactNode;
  style?: ViewStyle;
}) {
  const { c, scheme } = useTheme();
  if (liquid)
    return (
      // The native press grows the glass past its frame; the Host pads for it so it isn't clipped.
      <View style={style}>
        <Host matchContents colorScheme={scheme} style={{ margin: -PRESS_ROOM }}>
          <Button
            label={label}
            systemImage={symbol}
            onPress={onPress}
            modifiers={[
              buttonStyle("glass"),
              buttonBorderShape("circle"),
              labelStyle("iconOnly"),
              controlSize("large"),
              foregroundStyle(color ?? c.fg),
              disabledModifier(!!disabled),
              padding({ all: PRESS_ROOM }),
            ]}
          />
        </Host>
      </View>
    );
  return (
    <Glass style={{ width: 44, height: 44, borderRadius: 22, ...style }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => ({
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ scale: pressed ? 0.96 : 1 }],
        })}
      >
        {children}
      </Pressable>
    </Glass>
  );
}
