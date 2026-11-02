import { Button, type ButtonProps, Host, Image } from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  buttonBorderShape,
  buttonStyle,
  controlSize,
  disabled as disabledModifier,
  frame,
} from "@expo/ui/swift-ui/modifiers";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import type { ReactNode } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import { useTheme } from "../theme/use-theme";

const liquid = isLiquidGlassAvailable();
const ICON = 14;

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
      // A fixed 44 pt box (matchContents reports 42.7 x 47.3 and sits the circle low). The native
      // press grows ~7 pt past the box: no parent may clip it (scroll views, overflow) and the
      // header row needs zIndex: 1 so content drawn after it can't cover it (glass-room test).
      <Host
        colorScheme={scheme}
        alignment="center"
        style={{ width: 44, height: 44, overflow: "visible", zIndex: 1, ...style }}
      >
        <Button
          onPress={onPress}
          modifiers={[
            buttonStyle("glass"),
            buttonBorderShape("circle"),
            controlSize("large"),
            disabledModifier(!!disabled),
            accessibilityLabel(label),
          ]}
        >
          {/* A fixed icon box keeps every circle the same size, whatever the symbol's width. */}
          <Image
            systemName={symbol}
            size={17}
            color={color ?? c.fg}
            modifiers={[frame({ width: ICON, height: ICON })]}
          />
        </Button>
      </Host>
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
